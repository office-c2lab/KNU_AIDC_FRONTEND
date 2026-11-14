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
  assetSummary: { total: 0, normal: 0, warning: 0, fault: 0 },
  auditEvents: [],
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
  setAssetSummary: assetSummary => set({ assetSummary: { ...assetSummary } }),
  addAuditEvent: event =>
    set(state => ({
      auditEvents: [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          actor: 'SYSTEM',
          kind: 'info',
          ...event,
        },
        ...state.auditEvents,
      ].slice(0, 50),
    })),
  runIncident: (id, actor = 'USER') =>
    set(state => {
      if (state.incidents.some(incident => incident.id === id)) return state;
      const timestamp = new Date().toISOString();
      return {
        chosenScenarioId: id,
        selectedIncidentId: id,
        incidents: [...state.incidents, { id, stage: 0, started: new Date() }],
        auditEvents: [
          {
            id: `${Date.now()}-${id}-run`,
            timestamp,
            actor,
            kind: 'danger',
            action: '장애 발생',
            scenarioId: id,
          },
          ...state.auditEvents,
        ].slice(0, 50),
      };
    }),
  endIncident: (id, actor = 'USER') =>
    set(state => {
      if (!state.incidents.some(incident => incident.id === id)) return state;
      const remaining = state.incidents.filter(incident => incident.id !== id);
      return {
        incidents: remaining,
        selectedIncidentId: remaining[0]?.id ?? null,
        auditEvents: [
          {
            id: `${Date.now()}-${id}-end`,
            timestamp: new Date().toISOString(),
            actor,
            kind: 'success',
            action: '시나리오 종료',
            scenarioId: id,
          },
          ...state.auditEvents,
        ].slice(0, 50),
      };
    }),
  resetIncidents: (actor = 'USER') =>
    set(state => ({
      incidents: [],
      selectedIncidentId: null,
      auditEvents: state.incidents.length
        ? [
            {
              id: `${Date.now()}-reset`,
              timestamp: new Date().toISOString(),
              actor,
              kind: 'success',
              action: `전체 초기화 (${state.incidents.length}건)`,
            },
            ...state.auditEvents,
          ].slice(0, 50)
        : state.auditEvents,
    })),
  resetTwinState: () =>
    set({
      ...initialState,
      utilities: { ...initialState.utilities },
      incidents: [],
      auditEvents: [],
      assetSummary: { ...initialState.assetSummary },
    }),
}));

export const digitalTwinStore = useDigitalTwinStore;
