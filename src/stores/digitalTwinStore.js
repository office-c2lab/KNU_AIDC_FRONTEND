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
  notificationsOpen: false,
  assetDetail: null,
};

export const useDigitalTwinStore = create(set => ({
  ...initialState,

  setNavigation: navigation => set(navigation),
  setNotificationsOpen: notificationsOpen => set({ notificationsOpen }),
  setAssetDetail: assetDetail => set({ assetDetail }),
  setSplitLevel: splitLevel =>
    set({ splitLevel: Math.max(0, Math.min(2, Math.trunc(splitLevel))) }),
  selectVisualization: (mode, forceOn = false) =>
    set(state => {
      const utilities = { ...state.utilities };
      let viewMode;

      if (mode === 'normal') {
        viewMode = 'normal';
      } else if (mode === 'thermal') {
        viewMode = forceOn ? 'thermal' : state.viewMode === 'thermal' ? 'normal' : 'thermal';
      } else if (mode === 'power' || mode === 'coolant') {
        viewMode = state.viewMode;
        utilities[mode] = forceOn ? true : !utilities[mode];
      } else {
        return state;
      }

      return { viewMode, utilities };
    }),
  setHighQuality: highQuality => set({ highQuality }),
  setAgentsVisible: agentsVisible => set({ agentsVisible }),
  toggleAgentsVisible: () => set(state => ({ agentsVisible: !state.agentsVisible })),
  setAutoRotate: autoRotate => set({ autoRotate }),
  toggleAutoRotate: () => set(state => ({ autoRotate: !state.autoRotate })),
  setScenarioState: scenario => set(scenario),
  setIncidents: incidents => set({ incidents: incidents.map(incident => ({ ...incident })) }),
  resetTwinState: () => set({ ...initialState, utilities: { ...initialState.utilities } }),
}));

export const digitalTwinStore = useDigitalTwinStore;
