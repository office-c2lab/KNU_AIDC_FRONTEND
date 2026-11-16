import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ASSET_CATALOG } from '../config/assetCatalog.js';
import { SCENARIOS } from '../config/scenarioConfig.js';
import { createIncidentSelectors } from './createIncidentSelectors.js';
import { digitalTwinStore } from '../../../../stores/digitalTwinStore.js';
import { calculateFacilityPower } from '../../calculateFacilityPower.js';

const scenarioById = new Map(SCENARIOS.map(item => [item.id, item]));
const find = id => DEFAULT_ASSET_CATALOG.find(asset => asset.id === id);
const snapshot = (id, time = 0, incidents = []) =>
  createIncidentSelectors({
    clock: { elapsedTime: time },
    activeIncidents: new Map(incidents.map(id => [id, { id, stage: 0 }])),
    scenarioById,
  }).getOperatingData(find(id));

test('all registered equipment exposes type-appropriate, finite, bounded virtual data', () => {
  for (const asset of DEFAULT_ASSET_CATALOG) {
    for (const time of [0, 2, 60, 3600]) {
      const data = snapshot(asset.id, time);
      assert.equal(data.simulated, true);
      assert.ok(data.groups.length);
      for (const value of Object.values(data.values)) {
        if (typeof value === 'number') assert.ok(Number.isFinite(value) && value >= 0, asset.id);
      }
      for (const group of data.groups)
        for (const metric of group.metrics) {
          assert.equal(typeof metric.value, 'string', `${asset.id}: ${metric.key}`);
          assert.ok(!/undefined|NaN|Infinity/.test(metric.value));
        }
      for (const [used, total] of [
        ['memoryUsedGiB', 'memoryTotalGiB'],
        ['diskUsedTiB', 'diskTotalTiB'],
        ['vramUsedGiB', 'vramTotalGiB'],
        ['portsUp', 'portsTotal'],
        ['allocatedGpus', 'totalGpus'],
      ]) {
        if (used in data.values)
          assert.ok(data.values[used] <= data.values[total], `${asset.id}: ${used}`);
      }
      for (const [key, value] of Object.entries(data.values))
        if (key.endsWith('Percent')) assert.ok(value <= 100, key);
    }
  }
});

test('virtual specifications and values are deterministic but change with simulation time', () => {
  for (const id of ['SRV-01', 'STO-01', 'CORE-01', 'GPU-03', 'UPS-01', 'CH-01']) {
    assert.deepEqual(snapshot(id, 10), snapshot(id, 10));
    assert.notDeepEqual(snapshot(id, 10).values, snapshot(id, 12).values, id);
  }
});

test('GPU overheating changes chip temperature, allocation, service and status together', () => {
  const healthy = snapshot('GPU-03', 20);
  const failed = snapshot('GPU-03', 20, ['gpu']);
  assert.ok(failed.values.gpuChipTempC > healthy.values.gpuChipTempC + 20);
  assert.ok(failed.values.allocatedGpus < healthy.values.allocatedGpus);
  assert.equal(failed.values.serviceState, '지연');
  assert.match(failed.values.modelName, /^가상/);
  assert.ok(failed.values.requestsPerMinute < healthy.values.requestsPerMinute);
  assert.deepEqual(
    snapshot('GPU-03', 20),
    healthy,
    'ending incident restores healthy readings at the same time'
  );
});

test('server power, storage IO, network links, UPS load and cooling faults affect their own metrics', () => {
  assert.equal(snapshot('SRV-04', 10, ['server']).values.operatingState, '정지');
  const storageIncident = SCENARIOS.find(item => item.asset === 'STO-01').id;
  assert.ok(
    snapshot('STO-01', 10, [storageIncident]).values.readMiBps <
      snapshot('STO-01', 10).values.readMiBps
  );
  const network = snapshot('CORE-01', 10, ['network']).values;
  assert.equal(network.linkState, '단절');
  assert.equal(network.receiveMbps, 0);
  assert.ok(network.portsUp < network.portsTotal);
  assert.ok(
    snapshot('UPS-01', 10, ['ups']).values.upsLoadPercent >
      snapshot('UPS-01', 10).values.upsLoadPercent
  );
  assert.ok(
    snapshot('CH-01', 10, ['chiller']).values.coolingCop < snapshot('CH-01', 10).values.coolingCop
  );
});

test('related-device warnings degrade virtual AI services without marking unrelated hosts failed', () => {
  assert.equal(snapshot('GPU-02', 10, ['gpu']).values.serviceState, '지연');
  assert.equal(snapshot('GPU-01', 10, ['gpu']).values.serviceState, '정상');
});

test('every scenario has valid operational data and termination restores metrics', () => {
  for (const scenario of SCENARIOS) {
    const baseline = snapshot(scenario.asset, 30);
    const incident = snapshot(scenario.asset, 30, [scenario.id]);
    assert.notEqual(incident.values.operatingState, baseline.values.operatingState, scenario.asset);
    for (const value of Object.values(incident.values))
      if (typeof value === 'number')
        assert.ok(Number.isFinite(value) && value >= 0, scenario.asset);
    assert.deepEqual(snapshot(scenario.asset, 30), baseline);
  }
});

test('energy accumulates in kWh and is retained across incident end, then resets with simulation', () => {
  digitalTwinStore.getState().resetTwinState();
  const state = digitalTwinStore.getState();
  const seconds = 2;
  const selectors = createIncidentSelectors({
    clock: { elapsedTime: seconds / 2 },
    activeIncidents: new Map(),
    scenarioById,
  });
  const expected = (selectors.getSensor(find('GPU-03')).power * seconds) / 3600;
  state.advanceSimulation(seconds);
  assert.equal(digitalTwinStore.getState().simulationTime, 2);
  assert.ok(Math.abs(digitalTwinStore.getState().energyKwhByAsset['GPU-03'] - expected) < 1e-12);
  state.runIncident('gpu');
  state.advanceSimulation(2);
  const beforeEnd = digitalTwinStore.getState().energyKwhByAsset['GPU-03'];
  state.endIncident('gpu');
  assert.equal(digitalTwinStore.getState().energyKwhByAsset['GPU-03'], beforeEnd);
  state.advanceSimulation(2);
  assert.ok(digitalTwinStore.getState().energyKwhByAsset['GPU-03'] > beforeEnd);
  const beforeInvalid = digitalTwinStore.getState();
  state.advanceSimulation(NaN);
  state.advanceSimulation(-1);
  assert.equal(digitalTwinStore.getState(), beforeInvalid);
  state.resetTwinState();
  assert.equal(digitalTwinStore.getState().simulationTime, 0);
  assert.deepEqual(digitalTwinStore.getState().energyKwhByAsset, {});
});

test('facility power uses the same evolving kW readings as equipment details', () => {
  const time = 120;
  const selectors = createIncidentSelectors({
    clock: { elapsedTime: time },
    activeIncidents: new Map([['gpu', { id: 'gpu' }]]),
    scenarioById,
  });
  const expected = DEFAULT_ASSET_CATALOG.reduce(
    (sum, asset) => sum + selectors.getSensor(asset).power,
    0
  );
  const total = calculateFacilityPower(DEFAULT_ASSET_CATALOG, [{ id: 'gpu' }], time);
  assert.ok(Math.abs(total.totalKw - expected) < 1e-8);
});
