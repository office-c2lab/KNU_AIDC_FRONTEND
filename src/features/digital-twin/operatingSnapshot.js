import { SCENARIOS } from './scene/config/scenarioConfig.js';
import { createIncidentSelectors } from './scene/systems/createIncidentSelectors.js';
import { aggregateFacilityPower } from './calculateFacilityPower.js';

const scenarioById = new Map(SCENARIOS.map(scenario => [scenario.id, scenario]));
const mean = values =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const isPercent = value => Number.isFinite(value) && value >= 0 && value <= 100;

export function aggregateOperatingStatus(readings, incidents = []) {
  const equipment = [
    ...new Map(
      readings.filter(item => item.type !== 'AI AGENT').map(item => [item.id, item])
    ).values(),
  ];
  const ids = new Set(equipment.map(item => item.id));
  let normal = 0,
    warning = 0,
    fault = 0;
  const cpus = [],
    gpus = [];
  for (const item of equipment) {
    if (item.status === '정상') normal++;
    else if (item.status === '주의') warning++;
    else fault++;
    if (item.type === 'SERVER RACK' && isPercent(item.cpuPercent)) cpus.push(item.cpuPercent);
    if (item.type === 'GPU SERVER RACK' && isPercent(item.gpuPercent)) gpus.push(item.gpuPercent);
  }
  // One alarm per known active scenario, not one per affected device or history event.
  const alarmCount = new Set(
    incidents.filter(item => ids.has(scenarioById.get(item.id)?.asset)).map(item => item.id)
  ).size;
  const power = aggregateFacilityPower(equipment);
  return {
    total: equipment.length,
    normal,
    warning,
    fault,
    abnormalAssetCount: warning + fault,
    averageCpuPercent: mean(cpus),
    averageGpuPercent: mean(gpus),
    cpuDeviceCount: cpus.length,
    gpuDeviceCount: gpus.length,
    totalPowerKw: power.totalKw,
    alarmCount,
    power,
  };
}

export function collectOperatingSnapshot(
  assets,
  incidents,
  simulationTime = 0,
  energyKwhByAsset = {}
) {
  const selectors = createIncidentSelectors({
    clock: { elapsedTime: simulationTime },
    activeIncidents: new Map(incidents.map(item => [item.id, item])),
    scenarioById,
    getEnergyKwh: id => energyKwhByAsset[id] ?? 0,
  });
  const byAsset = {};
  for (const asset of assets) {
    if (asset.type === 'AI AGENT') continue;
    const sensor = selectors.getSensor(asset);
    const operatingData = selectors.getOperatingData(asset);
    byAsset[asset.id] = {
      id: asset.id,
      name: asset.name,
      type: asset.type,
      simulationTime,
      status: selectors.getAssetStatus(asset),
      ...sensor,
      operatingData,
      cpuPercent: operatingData.values.cpuPercent ?? null,
      gpuPercent: operatingData.values.gpuPercent ?? null,
    };
  }
  return { byAsset, summary: aggregateOperatingStatus(Object.values(byAsset), incidents) };
}
