import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFacilityPower } from './calculateFacilityPower.js';
import { DEFAULT_ASSET_CATALOG } from './scene/config/assetCatalog.js';
import { SCENARIOS } from './scene/config/scenarioConfig.js';
import { createIncidentSelectors } from './scene/systems/createIncidentSelectors.js';

const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const asset = (id, type, power) => ({ id, type, power });

test('power categories are disjoint, use kW, and sum to total power', () => {
  const result = calculateFacilityPower(
    [
      asset('GPU', 'GPU SERVER RACK', 10),
      asset('NET', 'NETWORK EQUIPMENT', 2),
      asset('CH', 'CHILLER', 3),
      asset('UPS', 'UPS', 1),
      asset('CAM', 'CCTV CAMERA', 0.5),
      asset('AGENT', 'AI AGENT', 100),
    ],
    []
  );
  close(result.totalKw, 16.5);
  close(result.itKw, 12);
  close(result.pueEstimate, 16.5 / 12);
  close(
    result.rows.reduce((sum, row) => sum + row.kw, 0),
    result.totalKw
  );
  close(
    result.rows.reduce((sum, row) => sum + row.share, 0),
    100
  );
  assert.deepEqual(
    result.rows.map(row => row.kw),
    [12, 3, 1, 0.5]
  );
});

test('baseline uses catalog consumption without scaling kW into invented MW', () => {
  const result = calculateFacilityPower(DEFAULT_ASSET_CATALOG, []);
  close(result.totalKw, 203.68);
  assert.ok(result.pueEstimate >= 1);
  close(result.pueEstimate, result.totalKw / result.itKw);
});

test('every simulated incident uses the same consumption as equipment detail and restores on end', () => {
  const baseline = calculateFacilityPower(DEFAULT_ASSET_CATALOG, []);
  const scenarioById = new Map(SCENARIOS.map(scenario => [scenario.id, scenario]));
  for (const scenario of SCENARIOS) {
    const incidents = [{ id: scenario.id, stage: 0 }];
    const result = calculateFacilityPower(DEFAULT_ASSET_CATALOG, incidents);
    const { getSensor } = createIncidentSelectors({
      clock: { elapsedTime: 0 },
      activeIncidents: new Map([[scenario.id, incidents[0]]]),
      scenarioById,
    });
    close(
      result.totalKw,
      DEFAULT_ASSET_CATALOG.reduce((sum, item) => sum + getSensor(item).power, 0)
    );
    close(
      result.rows.reduce((sum, row) => sum + row.kw, 0),
      result.totalKw
    );
    close(result.pueEstimate, result.totalKw / result.itKw);
  }
  assert.deepEqual(calculateFacilityPower(DEFAULT_ASSET_CATALOG, []), baseline);
});

test('combined incidents change IT and infrastructure consumption independently', () => {
  const baseline = calculateFacilityPower(DEFAULT_ASSET_CATALOG, []);
  const gpu = calculateFacilityPower(DEFAULT_ASSET_CATALOG, [{ id: 'gpu' }]);
  close(gpu.totalKw - baseline.totalKw, 0.85);
  close(gpu.itKw - baseline.itKw, 0.85);
  const both = calculateFacilityPower(DEFAULT_ASSET_CATALOG, [{ id: 'gpu' }, { id: 'ups' }]);
  close(both.totalKw - baseline.totalKw, 0.85 + 0.65);
  close(both.itKw - baseline.itKw, 0.85);
});

test('zero IT load, invalid readings and missing scenarios never produce infinite PUE', () => {
  const empty = calculateFacilityPower([], []);
  assert.equal(empty.pueEstimate, null);
  assert.equal(empty.totalKw, 0);
  assert.ok(empty.rows.every(row => row.share === 0));
  const result = calculateFacilityPower(
    [asset('CH', 'CHILLER', 3), asset('BROKEN', 'SERVER RACK', Infinity), asset('NEG', 'UPS', -1)],
    [{ id: 'unknown-incident' }]
  );
  assert.equal(result.totalKw, 3);
  assert.equal(result.pueEstimate, null);
  assert.ok(result.rows.every(row => Number.isFinite(row.share)));
});
