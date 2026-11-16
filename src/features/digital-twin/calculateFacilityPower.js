import { SCENARIOS } from './scene/config/scenarioConfig.js';
import { createIncidentSelectors } from './scene/systems/createIncidentSelectors.js';

const scenarioById = new Map(SCENARIOS.map(scenario => [scenario.id, scenario]));
const groups = [
  {
    id: 'it',
    label: 'IT 부하',
    tone: 'blue',
    types: new Set(['SERVER RACK', 'GPU SERVER RACK', 'STORAGE RACK', 'NETWORK EQUIPMENT']),
  },
  {
    id: 'cooling',
    label: '냉각 부하',
    tone: '',
    types: new Set([
      'PRECISION AIR COOLING',
      'COOLANT DISTRIBUTION UNIT',
      'CHILLER',
      'COOLING PUMP',
      'HEAT EXCHANGER',
    ]),
  },
  {
    id: 'power',
    label: '전력 설비',
    tone: 'amber',
    types: new Set(['UPS', 'BATTERY', 'SWITCHGEAR', 'TRANSFORMER', 'BACKUP GENERATOR']),
  },
  { id: 'other', label: '기타·지원', tone: '', types: new Set() },
];

export function calculateFacilityPower(assets, incidents, simulationTime = 0) {
  const { getSensor } = createIncidentSelectors({
    clock: { elapsedTime: simulationTime },
    activeIncidents: new Map(
      incidents.filter(item => scenarioById.has(item.id)).map(item => [item.id, item])
    ),
    scenarioById,
  });
  const totals = Object.fromEntries(groups.map(group => [group.id, 0]));
  for (const asset of assets) {
    if (asset.type === 'AI AGENT') continue;
    // Asset power is simulated own consumption in kW, not upstream throughput.
    // Count every device once; do not add a UPS/PDU's downstream load again.
    const group = groups.find(item => item.types.has(asset.type)) ?? groups.at(-1);
    const reading = getSensor(asset).power;
    if (Number.isFinite(reading)) totals[group.id] += Math.max(0, reading);
  }
  const totalKw = Object.values(totals).reduce((sum, value) => sum + value, 0);
  return {
    totalKw,
    itKw: totals.it,
    // Snapshot estimate only. Formal PUE uses facility/IT energy over the same period.
    pueEstimate: totals.it > 0 ? totalKw / totals.it : null,
    rows: groups.map(({ id, label, tone }) => ({
      id,
      label,
      tone,
      kw: totals[id],
      share: totalKw > 0 ? (totals[id] / totalKw) * 100 : 0,
    })),
  };
}
