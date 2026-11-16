import { useMemo } from 'react';
import { useDigitalTwinStore } from '../../stores/digitalTwinStore.js';
import { SCENARIOS } from './scene/config/scenarioConfig.js';
import { createIncidentSelectors } from './scene/systems/createIncidentSelectors.js';
import { createAssetTrendData } from './createAssetTrendData.js';
const scenarioById = new Map(SCENARIOS.map(scenario => [scenario.id, scenario]));

export default function useAssetTelemetry(asset) {
  const incidents = useDigitalTwinStore(state => state.incidents);
  const time = useDigitalTwinStore(state => state.simulationTime);
  const energy = useDigitalTwinStore(state => state.energyKwhByAsset);
  return useMemo(() => {
    if (!asset) return null;
    const selectors = createIncidentSelectors({
      clock: { elapsedTime: time },
      activeIncidents: new Map(incidents.map(item => [item.id, item])),
      scenarioById,
      getEnergyKwh: id => energy[id] ?? 0,
    });
    const sensor = selectors.getSensor(asset);
    return {
      ...asset,
      ...sensor,
      status: selectors.getAssetStatus(asset),
      operatingData: selectors.getOperatingData(asset),
      trend: createAssetTrendData(asset.id, sensor),
    };
  }, [asset, incidents, time, energy]);
}
