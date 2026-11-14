import ScenarioFacilitySidebar from '../features/dashboard/ScenarioFacilitySidebar.jsx';
import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleGauge, RotateCcw, Server, X } from 'lucide-react';
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
          selectedAssetId={selectedAsset?.id}
          runningIds={runningIds}
          onSelectAsset={(facilityId, asset) => {
            setSelectedFacilityId(facilityId);
            selectAsset(asset);
          }}
        />
        <section
          className="dashboard-panel flex min-h-0 min-w-0 flex-col overflow-hidden"
          aria-label="선택 설비 상세"
        >
          <div className="selected-scenario">
            <div className="selected-scenario-title">
              <div>
                <small>{selectedAsset?.type ?? '설비를 선택하세요'}</small>
                <h3>{selectedAsset?.id ?? '설비 연동 대기'}</h3>
              </div>
              <span className={selectedAssetState !== '정상' ? 'critical' : ''}>
                {selectedAssetState}
              </span>
            </div>
            <p>{selectedAsset?.summary ?? '디지털 트윈 화면에서 설비 정보를 먼저 불러오세요.'}</p>
            <dl>
              <div>
                <dt>설치 위치</dt>
                <dd>{selectedAsset?.location ?? '—'}</dd>
              </div>
              <div>
                <dt>설비 유형</dt>
                <dd>{selectedAsset?.type ?? '—'}</dd>
              </div>
              <div>
                <dt>현재 온도</dt>
                <dd>
                  {selectedAsset
                    ? `${((selectedAsset.temp || 0) + (selectedIncident ? selected.temp : 0)).toFixed(1)}°C`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt>현재 부하</dt>
                <dd>
                  {selectedAsset
                    ? `${Math.max(0, (selectedAsset.power || 0) + (selectedIncident ? selected.power : 0)).toFixed(2)} kW`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt>운영 용량</dt>
                <dd>{selectedAsset ? `${selectedAsset.capacity ?? 0}%` : '—'}</dd>
              </div>
              <div>
                <dt>대응 단계</dt>
                <dd>{selectedIncident ? steps[selectedIncident.stage] : '시나리오 미실행'}</dd>
              </div>
            </dl>
            {selected ? (
              <div className="asset-control-scenario">
                <div className="asset-scenario-heading">
                  <div>
                    <small>실행 가능한 시나리오</small>
                    <strong>{selected.title}</strong>
                  </div>
                  <span className={selected.level === '긴급' ? 'critical' : ''}>
                    {selected.level}
                  </span>
                </div>
                <p>{selected.condition}</p>
                <dl className="scenario-brief">
                  <div>
                    <dt>예상 영향</dt>
                    <dd>{selected.impact}</dd>
                  </div>
                  <div>
                    <dt>점검 방향</dt>
                    <dd>{selected.cause}</dd>
                  </div>
                </dl>
                <div className="scenario-checks">
                  <small>대응 체크포인트</small>
                  <ol>
                    {selected.checks.map(check => (
                      <li key={check}>{check}</li>
                    ))}
                  </ol>
                </div>
                {selectedIncident ? (
                  <button
                    type="button"
                    className="scenario-action stop"
                    onClick={() => endIncident(selected.id)}
                  >
                    시나리오 종료
                  </button>
                ) : (
                  <button type="button" className="scenario-action" onClick={startSelectedScenario}>
                    가상 장애 발생
                  </button>
                )}
              </div>
            ) : (
              <div className="asset-control-unavailable">
                이 설비에는 실행 가능한 가상 장애 시나리오가 등록되어 있지 않습니다.
              </div>
            )}
          </div>
        </section>

        <div className="dashboard-side-stack">
          <section className="status-overview" aria-labelledby="overview-heading">
            <h2 id="overview-heading" className="sr-only">
              전체 운영 현황
            </h2>
            <article className="status-card total">
              <Server aria-hidden="true" />
              <div>
                <span>전체 설비</span>
                <strong>{liveSummary.total || '—'}</strong>
              </div>
              <small>{liveSummary.total ? 'Three.js 설비 연동' : '설비 데이터 로딩 전'}</small>
            </article>
            <article className="status-card normal">
              <CheckCircle2 aria-hidden="true" />
              <div>
                <span>정상</span>
                <strong>{liveSummary.total ? liveSummary.normal : '—'}</strong>
              </div>
              <small>정상 운영 설비</small>
            </article>
            <article className="status-card warning">
              <AlertTriangle aria-hidden="true" />
              <div>
                <span>주의</span>
                <strong>{liveSummary.warning}</strong>
              </div>
              <small>연관 영향 설비</small>
            </article>
            <article className="status-card fault">
              <CircleGauge aria-hidden="true" />
              <div>
                <span>장애</span>
                <strong>{liveSummary.fault}</strong>
              </div>
              <small>{incidents.length}건 진행 중</small>
            </article>
          </section>

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
                  return (
                    <article key={incident.id}>
                      <i />
                      <div>
                        <strong>{scenario.title}</strong>
                        <small>
                          {scenario.asset} · {steps[incident.stage]}
                        </small>
                      </div>
                      <button
                        type="button"
                        onClick={() => endIncident(incident.id)}
                        aria-label={`${scenario.title} 종료`}
                      >
                        <X size={14} />
                      </button>
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
