import ScenarioFacilitySidebar from '../features/dashboard/ScenarioFacilitySidebar.jsx';
import EquipmentOverview from '../features/dashboard/EquipmentOverview.jsx';
import ScenarioHistory from '../features/dashboard/ScenarioHistory.jsx';
import EquipmentCatalog from '../features/dashboard/EquipmentCatalog.jsx';
import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SCENARIOS } from '../features/digital-twin/scene/config/scenarioConfig.js';
import { useDigitalTwinStore } from '../stores/digitalTwinStore.js';
import '../features/dashboard/dashboard.css';
import { panelEntrance } from '../utils/panelMotion.js';

const scenarioById = new Map(SCENARIOS.map(scenario => [scenario.id, scenario]));
const steps = ['감지', '확인', '원인 분석', '복구 조치', '정상 확인'];
const facilityGroups = [
  { id: '4F', name: '통합 관제층', matches: asset => asset.floor === '4F' },
  { id: '3F', name: 'AI / GPU 전산층', matches: asset => asset.floor === '3F' },
  { id: '2F', name: '일반 서버 전산층', matches: asset => asset.floor === '2F' },
  { id: '1F', name: '보안·통신·장비 반입', matches: asset => asset.floor === '1F' },
  { id: 'P', name: '전력 설비동', matches: asset => !asset.floor && asset.zone === 'power' },
  { id: 'C', name: '냉각 설비동', matches: asset => !asset.floor && asset.zone === 'cooling' },
];

export default function DashboardPage() {
  const incidents = useDigitalTwinStore(state => state.incidents);
  const chosenScenarioId = useDigitalTwinStore(state => state.chosenScenarioId);
  const assetSummary = useDigitalTwinStore(state => state.assetSummary);
  const assetCatalog = useDigitalTwinStore(state => state.assetCatalog);
  const setScenarioState = useDigitalTwinStore(state => state.setScenarioState);
  const runIncident = useDigitalTwinStore(state => state.runIncident);
  const endIncident = useDigitalTwinStore(state => state.endIncident);
  const resetIncidents = useDigitalTwinStore(state => state.resetIncidents);
  const selectVisualization = useDigitalTwinStore(state => state.selectVisualization);

  const [selectedFacilityId, setSelectedFacilityId] = useState('all');
  const overview = selectedFacilityId === 'all';
  const [facilityListMode, setFacilityListMode] = useState(false);
  const showCatalog = overview || facilityListMode;
  const [expandedFacilityId, setExpandedFacilityId] = useState(null);
  const [facilitySearch, setFacilitySearch] = useState('');
  const [catalogReturn, setCatalogReturn] = useState({
    facilityId: '3F',
    search: '',
    scrollTop: 0,
    expandedFacilityId: '3F',
  });
  const workspaceRef = useRef(null);
  const facilityRef = useRef(null);
  const [selectedAssetId, setSelectedAssetId] = useState(
    () => scenarioById.get(chosenScenarioId)?.asset ?? null
  );
  const selectedFacility = facilityGroups.find(group => group.id === selectedFacilityId);
  const facilityAssets = useMemo(
    () => assetCatalog.filter(asset => selectedFacility?.matches(asset)),
    [assetCatalog, selectedFacility]
  );
  const selectedAsset =
    facilityAssets.find(asset => asset.id === selectedAssetId) ?? facilityAssets[0];
  const selected = SCENARIOS.find(scenario => scenario.asset === selectedAsset?.id) ?? null;
  const selectedIncident = selected
    ? incidents.find(incident => incident.id === selected.id)
    : null;
  const runningIds = useMemo(() => new Set(incidents.map(incident => incident.id)), [incidents]);

  const liveSummary = useMemo(() => {
    const faultAssets = new Set();
    const warningAssets = new Set();
    incidents.forEach(incident => {
      const scenario = scenarioById.get(incident.id);
      if (!scenario) return;
      faultAssets.add(scenario.asset);
      scenario.related.forEach(asset => warningAssets.add(asset.id));
    });
    faultAssets.forEach(id => warningAssets.delete(id));
    const fault = faultAssets.size;
    const warning = warningAssets.size;
    return {
      total: assetSummary.total,
      fault,
      warning,
      normal: Math.max(0, assetSummary.total - fault - warning),
    };
  }, [assetSummary.total, incidents]);

  const startSelectedScenario = () => {
    if (!selected) return;
    runIncident(selected.id);
    if (['thermal', 'power', 'coolant'].includes(selected.mode)) {
      selectVisualization(selected.mode, true);
    }
  };

  const selectAsset = asset => {
    setSelectedAssetId(asset.id);
    const scenario = SCENARIOS.find(item => item.asset === asset.id);
    if (scenario) setScenarioState({ chosenScenarioId: scenario.id });
  };

  const openAsset = (facilityId, asset) => {
    if (showCatalog) {
      setCatalogReturn({
        facilityId: selectedFacilityId,
        search: facilitySearch,
        scrollTop: workspaceRef.current?.scrollTop ?? 0,
        expandedFacilityId,
      });
    } else {
      setCatalogReturn({
        facilityId,
        search: facilitySearch,
        scrollTop: 0,
        expandedFacilityId: facilityId,
      });
    }
    setFacilityListMode(false);
    setSelectedFacilityId(facilityId);
    setExpandedFacilityId(facilityId);
    selectAsset(asset);
    requestAnimationFrame(() => workspaceRef.current?.scrollTo({ top: 0 }));
  };

  const backToCatalog = () => {
    setSelectedFacilityId(catalogReturn.facilityId);
    setFacilityListMode(true);
    setFacilitySearch(catalogReturn.search);
    setExpandedFacilityId(catalogReturn.expandedFacilityId);
    requestAnimationFrame(() => {
      workspaceRef.current?.scrollTo({ top: catalogReturn.scrollTop });
      const card = [...(workspaceRef.current?.querySelectorAll('[data-asset-id]') ?? [])].find(
        element => element.dataset.assetId === selectedAssetId
      );
      card?.focus({ preventScroll: true });
    });
  };

  const focusIncident = incident => {
    const scenario = scenarioById.get(incident.id);
    const asset = assetCatalog.find(item => item.id === scenario?.asset);
    const facility = asset && facilityGroups.find(group => group.matches(asset));
    if (!facility) return;
    setCatalogReturn({
      facilityId: facility.id,
      search: '',
      scrollTop: 0,
      expandedFacilityId: facility.id,
    });
    setFacilityListMode(false);
    setFacilitySearch('');
    setExpandedFacilityId(facility.id);
    setSelectedFacilityId(facility.id);
    setSelectedAssetId(asset.id);
    setScenarioState({ chosenScenarioId: scenario.id, selectedIncidentId: incident.id });
    requestAnimationFrame(() => {
      workspaceRef.current?.scrollTo({ top: 0 });
      facilityRef.current
        ?.querySelector('.scenario-facility-assets .selected')
        ?.scrollIntoView({ block: 'nearest' });
    });
  };

  return (
    <main className="dashboard-main">
      <div className={`dashboard-grid${showCatalog ? ' catalog-mode' : ''}`}>
        <ScenarioFacilitySidebar
          facilityGroups={facilityGroups}
          assetCatalog={assetCatalog}
          summary={liveSummary}
          selectedAssetId={showCatalog ? null : selectedAsset?.id}
          selectedFacilityId={selectedFacilityId}
          runningIds={runningIds}
          expandedFacilityId={expandedFacilityId}
          onExpandedFacilityChange={setExpandedFacilityId}
          search={facilitySearch}
          onSearchChange={setFacilitySearch}
          navigationRef={facilityRef}
          overview={overview}
          onShowOverview={() => {
            setSelectedFacilityId('all');
            requestAnimationFrame(() => workspaceRef.current?.scrollTo({ top: 0 }));
          }}
          onSelectAsset={openAsset}
          onSelectFacility={facilityId => {
            setSelectedFacilityId(facilityId);
            setFacilityListMode(true);
            requestAnimationFrame(() => workspaceRef.current?.scrollTo({ top: 0 }));
          }}
        />
        <motion.section
          {...panelEntrance({ y: 20, delay: 0.96 })}
          className="scenario-workspace flex min-h-0 min-w-0 flex-col overflow-hidden"
          aria-label={
            showCatalog
              ? `${overview ? '전체 층 및 시설별' : selectedFacility?.name} 설비`
              : '선택 설비 상세'
          }
        >
          <div className="scenario-workspace-scroll" ref={workspaceRef}>
            {showCatalog ? (
              <EquipmentCatalog
                facilityGroups={
                  overview
                    ? facilityGroups
                    : facilityGroups.filter(group => group.id === selectedFacilityId)
                }
                title={overview ? '전체 설비' : `${selectedFacility?.name} 설비`}
                assets={assetCatalog}
                incidents={incidents}
                search={facilitySearch}
                onSelectAsset={openAsset}
              />
            ) : (
              <>
                <nav className="scenario-detail-navigation" aria-label="설비 상세 탐색">
                  <button type="button" onClick={backToCatalog}>
                    {catalogReturn.facilityId === 'all'
                      ? '전체 설비로 돌아가기'
                      : `${facilityGroups.find(group => group.id === catalogReturn.facilityId)?.name ?? '설비 목록'}으로 돌아가기`}
                  </button>
                </nav>
                <EquipmentOverview
                  asset={selectedAsset}
                  stage={selectedIncident ? steps[selectedIncident.stage] : null}
                />
                <div className="scenario-operation-grid">
                  {selected ? (
                    <motion.section
                      {...panelEntrance({ y: 22, delay: 0.12 })}
                      className="scenario-runner"
                      aria-labelledby="scenario-runner-title"
                    >
                      <h2 id="scenario-runner-title">시나리오 실행</h2>
                      <div className="scenario-runner-name">
                        <h3>{selected.title.replace(selected.asset, '').trim()}</h3>
                        <span>시나리오 등급 · {selected.level}</span>
                      </div>
                      <dl className="scenario-runner-summary">
                        <div>
                          <dt>장애 상황</dt>
                          <dd>{selected.condition}</dd>
                        </div>
                        <div>
                          <dt>예상 영향</dt>
                          <dd>{selected.impact}</dd>
                        </div>
                      </dl>
                      <div className="scenario-runner-procedure">
                        <h3>점검 절차</h3>
                        <p>{selected.cause}</p>
                        <ol>
                          {selected.checks.map(check => (
                            <li key={check}>
                              <span>{check.replace(`${selected.asset} · `, '')}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="scenario-runner-footer">
                        {selectedIncident ? (
                          <button
                            type="button"
                            className="scenario-runner-action stop"
                            onClick={() => endIncident(selected.id)}
                          >
                            시나리오 종료
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="scenario-runner-action"
                            onClick={startSelectedScenario}
                          >
                            시나리오 실행
                          </button>
                        )}
                      </div>
                    </motion.section>
                  ) : (
                    <div className="asset-control-unavailable">
                      이 설비에는 실행 가능한 가상 장애 시나리오가 등록되어 있지 않습니다.
                    </div>
                  )}
                  <ScenarioHistory />
                </div>
              </>
            )}
          </div>
        </motion.section>

        {!showCatalog && (
          <div className="dashboard-side-stack">
            <motion.section
              {...panelEntrance({ x: 24, delay: 0.1 })}
              className="dashboard-panel active-scenarios"
              aria-labelledby="active-heading"
            >
              <header className="dashboard-panel-heading">
                <div>
                  <h2 id="active-heading">진행 중 시나리오</h2>
                </div>
                <b>{incidents.length}건</b>
              </header>
              <div className="active-scenario-list">
                {incidents.length ? (
                  incidents.map(incident => {
                    const scenario = scenarioById.get(incident.id);
                    if (!scenario) return null;
                    return (
                      <article key={incident.id} aria-label={scenario.title}>
                        <button
                          type="button"
                          className={`active-scenario-summary${selectedAsset?.id === scenario.asset ? ' selected' : ''}`}
                          aria-pressed={selectedAsset?.id === scenario.asset}
                          aria-label={`${scenario.title}, ${scenario.asset} 설비 보기`}
                          onClick={() => focusIncident(incident)}
                        >
                          <div className="active-scenario-title-row">
                            <strong>{scenario.title.replace(scenario.asset, '').trim()}</strong>
                            <span className="active-scenario-state">
                              {scenario.status} · {scenario.level}
                            </span>
                          </div>
                          <div className="active-scenario-summary-meta">
                            <small>
                              {scenario.asset} · {steps[incident.stage]}
                            </small>
                            <time dateTime={new Date(incident.started).toISOString()}>
                              시작{' '}
                              {new Intl.DateTimeFormat('ko-KR', {
                                timeZone: 'Asia/Seoul',
                                hour: '2-digit',
                                minute: '2-digit',
                              }).format(new Date(incident.started))}
                            </time>
                          </div>
                        </button>
                      </article>
                    );
                  })
                ) : (
                  <p className="dashboard-empty">현재 진행 중인 장애가 없습니다.</p>
                )}
              </div>
              {incidents.length > 0 && (
                <button type="button" className="reset-scenarios" onClick={() => resetIncidents()}>
                  모든 시나리오 종료
                </button>
              )}
            </motion.section>
          </div>
        )}
      </div>
    </main>
  );
}
