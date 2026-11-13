import { create } from 'zustand';

const initialState = {
  activeZone: 'overview',
  activeFloor: null,
  selectedId: null,
  splitLevel: 0,
  viewMode: 'normal',
  utilities: { power: false, coolant: false },
  highQuality: true,
  agentsVisible: true,
  autoRotate: false,
  chosenScenarioId: 'gpu',
  selectedIncidentId: null,
  incidents: [],
};

export const useDigitalTwinStore = create(set => ({
  ...initialState,

  setNavigation: navigation => set(navigation),
  setViewMode: (viewMode, utilities) => set({ viewMode, utilities: { ...utilities } }),
  setPreferences: preferences => set(preferences),
  setScenarioState: scenario => set(scenario),
  setIncidents: incidents => set({ incidents: incidents.map(incident => ({ ...incident })) }),
  resetTwinState: () => set({ ...initialState, utilities: { ...initialState.utilities } }),
}));

export const digitalTwinStore = useDigitalTwinStore;
