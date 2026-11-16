import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ASSET_CATALOG } from './assetCatalog.js';
import { SCENARIOS, buildScenarios } from './scenarioConfig.js';
import { createIncidentSelectors } from '../systems/createIncidentSelectors.js';

test('every registered equipment has one complete scenario with valid references', () => {
  const ids = new Set(DEFAULT_ASSET_CATALOG.map(asset => asset.id));
  assert.equal(SCENARIOS.length, DEFAULT_ASSET_CATALOG.length);
  assert.equal(new Set(SCENARIOS.map(s => s.id)).size, SCENARIOS.length);
  assert.equal(new Set(SCENARIOS.map(s => s.asset)).size, ids.size);
  for (const scenario of SCENARIOS) {
    assert.ok(ids.has(scenario.asset));
    for (const key of ['title', 'condition', 'cause', 'impact', 'status', 'level', 'zone']) {
      assert.ok(scenario[key]?.length, `${scenario.asset}: missing ${key}`);
    }
    assert.ok(scenario.checks.length >= 3);
    assert.ok(['normal', 'thermal', 'power', 'coolant'].includes(scenario.mode));
    for (const related of scenario.related) {
      assert.ok(ids.has(related.id));
      assert.notEqual(related.id, scenario.asset);
    }
  }
});

test('existing scenario IDs and initial selection remain compatible', () => {
  assert.deepEqual(
    SCENARIOS.slice(0, 8).map(s => s.id),
    ['gpu', 'server', 'network', 'ups', 'cdu', 'chiller', 'access', 'noc']
  );
});

test('each scenario changes its target state and readings, then restores on termination', () => {
  const activeIncidents = new Map();
  const selectors = createIncidentSelectors({
    clock: { elapsedTime: 0 },
    activeIncidents,
    scenarioById: new Map(SCENARIOS.map(s => [s.id, s])),
  });
  for (const scenario of SCENARIOS) {
    const asset = DEFAULT_ASSET_CATALOG.find(a => a.id === scenario.asset);
    const baseline = selectors.getSensor(asset);
    activeIncidents.set(scenario.id, { id: scenario.id, stage: 0 });
    assert.equal(selectors.getAssetStatus(asset), scenario.status, asset.id);
    const reading = selectors.getSensor(asset);
    assert.ok(Math.abs(reading.temp - baseline.temp - scenario.temp) < 1e-8);
    assert.equal(reading.power, Math.max(0, asset.power + scenario.power));
    for (const other of DEFAULT_ASSET_CATALOG) {
      if (other.id !== asset.id && !scenario.related.some(item => item.id === other.id)) {
        assert.equal(selectors.getAssetStatus(other), '정상', `${asset.id} affected ${other.id}`);
      }
    }
    activeIncidents.delete(scenario.id);
    assert.equal(selectors.getAssetStatus(asset), '정상');
    assert.deepEqual(selectors.getSensor(asset), baseline);
  }
});

test('same-type equipment incidents run and terminate independently', () => {
  const first = SCENARIOS.find(s => s.asset === 'PUMP-01');
  const second = SCENARIOS.find(s => s.asset === 'PUMP-02');
  const activeIncidents = new Map([first, second].map(s => [s.id, { id: s.id, stage: 0 }]));
  const selectors = createIncidentSelectors({
    clock: { elapsedTime: 0 },
    activeIncidents,
    scenarioById: new Map(SCENARIOS.map(s => [s.id, s])),
  });
  const pumps = DEFAULT_ASSET_CATALOG.filter(a => a.type === 'COOLING PUMP');
  assert.ok(pumps.every(a => selectors.getAssetStatus(a) === '장애'));
  activeIncidents.delete(first.id);
  assert.equal(selectors.getAssetStatus(pumps.find(a => a.id === first.asset)), '정상');
  assert.equal(selectors.getAssetStatus(pumps.find(a => a.id === second.asset)), '장애');
});

test('passive spare parts use inventory incidents and agents are excluded', () => {
  const spare = SCENARIOS.find(s => s.asset === 'SPARE-01');
  assert.match(spare.title, /재고/);
  assert.equal(spare.temp, 0);
  assert.equal(spare.power, 0);
  assert.deepEqual(buildScenarios([{ id: 'AGENT-01', type: 'AI AGENT' }]), []);
});
