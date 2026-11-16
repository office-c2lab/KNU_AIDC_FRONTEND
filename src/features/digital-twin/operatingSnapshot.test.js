import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ASSET_CATALOG } from './scene/config/assetCatalog.js';
import { collectOperatingSnapshot, aggregateOperatingStatus } from './operatingSnapshot.js';
import { digitalTwinStore } from '../../stores/digitalTwinStore.js';
import { createAssetTrendData } from './createAssetTrendData.js';
import { recordOperatingHistory, HISTORY_MAX_SAMPLES } from './operatingHistory.js';

test('83 devices share one status, CPU/GPU average and kW aggregation', () => {
  const snapshot = collectOperatingSnapshot(DEFAULT_ASSET_CATALOG, [], 2);
  const readings = Object.values(snapshot.byAsset);
  const summary = snapshot.summary;
  assert.equal(summary.total, 83);
  assert.equal(summary.normal, 83);
  assert.equal(summary.warning + summary.fault + summary.alarmCount, 0);
  for (const [type, field, average, count] of [
    ['SERVER RACK', 'cpuPercent', 'averageCpuPercent', 'cpuDeviceCount'],
    ['GPU SERVER RACK', 'gpuPercent', 'averageGpuPercent', 'gpuDeviceCount'],
  ]) {
    const devices = readings.filter(item => item.type === type);
    assert.ok(devices.length > 0);
    assert.equal(summary[count], devices.length);
    assert.equal(
      summary[average],
      devices.reduce((sum, item) => sum + item[field], 0) / devices.length
    );
  }
  assert.ok(
    Math.abs(summary.totalPowerKw - readings.reduce((sum, item) => sum + item.power, 0)) < 1e-9
  );
  assert.equal(summary.power.totalKw, summary.totalPowerKw);
  assert.equal(aggregateOperatingStatus([...readings, ...readings]).total, 83);
  assert.equal(aggregateOperatingStatus([]).averageCpuPercent, null);
});

test('overlapping faults count devices once and alarms by unique known active scenario', () => {
  const incidents = [{ id: 'gpu' }, { id: 'cdu' }, { id: 'gpu' }, { id: 'missing' }];
  const { summary, byAsset } = collectOperatingSnapshot(DEFAULT_ASSET_CATALOG, incidents);
  assert.equal(summary.alarmCount, 2);
  assert.equal(summary.total, summary.normal + summary.warning + summary.fault);
  assert.equal(
    summary.fault,
    Object.values(byAsset).filter(item => ['장애', '보안 경보'].includes(item.status)).length
  );
  assert.equal(
    summary.warning,
    Object.values(byAsset).filter(item => item.status === '주의').length
  );
  assert.equal(aggregateOperatingStatus([], incidents).alarmCount, 0);
});

test('ticks record actual samples; scenario changes preserve past points and shared chart values', () => {
  const store = () => digitalTwinStore.getState();
  store().resetTwinState();
  const first = store().operatingHistory.byAsset['GPU-03'][0];
  assert.equal(store().operatingHistory.summary.length, 1);
  store().advanceSimulation();
  store().runIncident('gpu');
  assert.equal(store().operatingSummary.alarmCount, 1);
  assert.equal(store().operatingHistory.byAsset['GPU-03'].length, 2);
  store().advanceSimulation();
  const captured = store().operatingHistory.byAsset['GPU-03'];
  assert.deepEqual(
    captured.map(point => point.simulationTime),
    [0, 2, 4]
  );
  assert.equal(captured[0], first);
  assert.equal(captured.at(-1).temp, store().telemetryByAsset['GPU-03'].temp);
  assert.ok(captured.at(-1).temp > captured[1].temp);
  assert.equal(captured.at(-1).gpuPercent, store().telemetryByAsset['GPU-03'].gpuPercent);
  store().resetIncidents();
  assert.equal(store().operatingHistory.byAsset['GPU-03'], captured);
  assert.equal(store().operatingSummary.alarmCount, 0);
  store().setNavigation({ selectedId: 'UPS-01' });
  store().setAssetCatalog(DEFAULT_ASSET_CATALOG);
  assert.equal(store().operatingHistory.byAsset['GPU-03'], captured);
  assert.deepEqual(
    createAssetTrendData(captured, 4).map(point => point.temp),
    captured.map(point => point.temp)
  );
  assert.equal(createAssetTrendData(captured, 4)[0].minute, -4 / 60);
  store().advanceSimulation();
  assert.ok(store().operatingHistory.byAsset['GPU-03'].at(-1).temp < captured.at(-1).temp);
  store().resetTwinState();
  assert.equal(store().operatingHistory.byAsset['GPU-03'].length, 1);
  assert.equal(store().simulationTime, 0);
});

test('one-hour history is bounded, immutable and never backfilled after a time jump', () => {
  const snapshot = collectOperatingSnapshot(DEFAULT_ASSET_CATALOG.slice(0, 1), []);
  let history = { byAsset: {}, summary: [] };
  for (let time = 0; time <= 4000; time += 2)
    history = recordOperatingHistory(history, snapshot, time);
  const samples = Object.values(history.byAsset)[0];
  assert.equal(samples.length, HISTORY_MAX_SAMPLES);
  assert.equal(history.summary.length, HISTORY_MAX_SAMPLES);
  assert.equal(samples[0].simulationTime, 400);
  const next = recordOperatingHistory(history, snapshot, 10000);
  assert.equal(next.summary.length, 1);
  assert.equal(samples.length, HISTORY_MAX_SAMPLES);
  assert.equal(next.summary[0].simulationTime, 10000);
});
