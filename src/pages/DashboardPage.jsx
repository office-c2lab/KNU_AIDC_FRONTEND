import ScenarioFacilitySidebar from '../features/dashboard/ScenarioFacilitySidebar.jsx';
import EquipmentOverview from '../features/dashboard/EquipmentOverview.jsx';
import { useMemo, useState } from 'react';
import { ChevronDown, ClipboardList, Flame, Info, Play, RotateCcw, X } from 'lucide-react';
import { SCENARIOS } from '../features/digital-twin/scene/config/scenarioConfig.js';
import { useDigitalTwinStore } from '../stores/digitalTwinStore.js';
import '../features/dashboard/dashboard.css';

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

  const [selectedFacilityId, setSelectedFacilityId] = useState('3F');
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

  const selectedAssetState = useMemo(() => {
    if (!selectedAsset) return '연동 대기';
    for (const incident of incidents) {
      const scenario = scenarioById.get(incident.id);
      if (scenario?.asset === selectedAsset.id) return scenario.status;
    }
    for (const incident of incidents) {
      const scenario = scenarioById.get(incident.id);
      const related = scenario?.related.find(asset => asset.id === selectedAsset.id);
      if (related) return related.state;
    }
    return '정상';
  }, [incidents, selectedAsset]);

  const selectAsset = asset => {
    setSelectedAssetId(asset.id);
    const scenario = SCENARIOS.find(item => item.asset === asset.id);
    if (scenario) setScenarioState({ chosenScenarioId: scenario.id });
  };

  return (
    <main className="dashboard-main">
      <div className="dashboard-grid">
        <ScenarioFacilitySidebar
          facilityGroups={facilityGroups}
          assetCatalog={assetCatalog}
          summary={liveSummary}
          selectedAssetId={selectedAsset?.id}
          runningIds={runningIds}
          onSelectAsset={(facilityId, asset) => {
            setSelectedFacilityId(facilityId);
            selectAsset(asset);
          }}
        />
        <section
          className="scenario-workspace flex min-h-0 min-w-0 flex-col overflow-hidden"
          aria-label="선택 설비 상세"
        >
          <div className="scenario-workspace-scroll">
            <EquipmentOverview
              asset={selectedAsset}
              incidents={incidents}
              facilityName={selectedFacility?.name}
              facilityAssets={facilityAssets}
              stage={selectedIncident ? steps[selectedIncident.stage] : null}
            />
            {selected ? (
              <section className="scenario-runner" aria-labelledby="scenario-runner-title">
                <h2 id="scenario-runner-title">
                  <Play size={20} aria-hidden="true" />
                  시나리오 실행
                </h2>
                <div className="scenario-runner-select">
                  <label htmlFor="selected-equipment-scenario">실행 시나리오</label>
                  <div>
                    <Flame size={17} aria-hidden="true" />
                    <select
                      id="selected-equipment-scenario"
                      value={selected.id}
                      onChange={event => setScenarioState({ chosenScenarioId: event.target.value })}
                    >
                      {SCENARIOS.filter(item => item.asset === selectedAsset.id).map(item => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="scenario-runner-impact">
                  <h3>
                    <Info size={17} aria-hidden="true" />
                    예상 영향
                  </h3>
                  <div>
                    <p>{selected.condition}</p>
                    <p>{selected.impact}</p>
                  </div>
                </div>
                <details className="scenario-runner-procedure" key={selected.id}>
                  <summary>
                    <ClipboardList size={17} aria-hidden="true" />
                    <span>점검 절차 및 대응 체크포인트</span>
                    <ChevronDown size={16} aria-hidden="true" />
                  </summary>
                  <p>{selected.cause}</p>
                  <ol>
                    {selected.checks.map(check => (
                      <li key={check}>{check}</li>
                    ))}
                  </ol>
                </details>
                <div className="scenario-runner-context">
                  <span
                    className={`equipment-status ${selectedAssetState === '정상' ? 'normal' : selectedAssetState === '주의' ? 'warning' : 'fault'}`}
                  >
                    {selectedAssetState}
                  </span>
                  <span>시나리오 등급 · {selected.level}</span>
                </div>
                {selectedIncident ? (
                  <button
                    type="button"
                    className="scenario-runner-action stop"
                    onClick={() => endIncident(selected.id)}
                  >
                    <X size={18} aria-hidden="true" /> 시나리오 종료
                  </button>
                ) : (
                  <button
                    type="button"
                    className="scenario-runner-action"
                    onClick={startSelectedScenario}
                  >
                    <Play size={18} aria-hidden="true" /> 시나리오 실행
                  </button>
                )}
              </section>
            ) : (
              <div className="asset-control-unavailable">
                이 설비에는 실행 가능한 가상 장애 시나리오가 등록되어 있지 않습니다.
              </div>
            )}
          </div>
        </section>

        <div className="dashboard-side-stack">
          <section className="dashboard-panel active-scenarios" aria-labelledby="active-heading">
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
                      <details className="active-scenario-disclosure">
                        <summary>
                          <div>
                            <div className="active-scenario-title-row">
                              <strong>{scenario.title}</strong>
                              <span className="active-scenario-state">
                                {scenario.status} · {scenario.level}
                              </span>
                            </div>
                            <small>
                              {scenario.asset} · {steps[incident.stage]}
                            </small>
                          </div>
                          <ChevronDown
                            className="active-scenario-chevron"
                            size={16}
                            aria-hidden="true"
                          />
                        </summary>
                        <div className="active-scenario-content">
                          <p className="active-scenario-condition">{scenario.condition}</p>
                          <dl className="active-scenario-details">
                            <div>
                              <dt>현재 대응 단계</dt>
                              <dd className="active-scenario-stage">
                                {incident.stage + 1} / {steps.length} · {steps[incident.stage]}
                              </dd>
                            </div>
                            <div>
                              <dt>시작 시각</dt>
                              <dd>
                                <time dateTime={new Date(incident.started).toISOString()}>
                                  {new Intl.DateTimeFormat('ko-KR', {
                                    timeZone: 'Asia/Seoul',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  }).format(new Date(incident.started))}
                                </time>
                              </dd>
                            </div>
                            <div>
                              <dt>예상 영향</dt>
                              <dd>{scenario.impact}</dd>
                            </div>
                            <div>
                              <dt>점검 방향</dt>
                              <dd>{scenario.cause}</dd>
                            </div>
                          </dl>
                          <div className="active-scenario-checks">
                            <h3>대응 체크포인트</h3>
                            <ol>
                              {scenario.checks.map(check => (
                                <li key={check}>{check}</li>
                              ))}
                            </ol>
                          </div>
                          {scenario.related.length > 0 && (
                            <div className="active-scenario-related">
                              <h3>연관 설비</h3>
                              <ul>
                                {scenario.related.map(asset => (
                                  <li key={asset.id}>
                                    <span>
                                      {asset.id} · {asset.state}
                                    </span>
                                    <p>{asset.why}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <button
                            className="active-scenario-end"
                            type="button"
                            onClick={() => endIncident(incident.id)}
                            aria-label={`${scenario.title} 종료`}
                          >
                            <X size={14} aria-hidden="true" /> 시나리오 종료
                          </button>
                        </div>
                      </details>
                    </article>
                  );
                })
              ) : (
                <p className="dashboard-empty">현재 진행 중인 장애가 없습니다.</p>
              )}
            </div>
            <button
              type="button"
              className="reset-scenarios"
              onClick={() => resetIncidents()}
              disabled={!incidents.length}
            >
              <RotateCcw size={14} /> 전체 초기화
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
