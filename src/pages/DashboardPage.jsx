import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, CircleGauge, RotateCcw, Server, X } from 'lucide-react';
import { SCENARIOS } from '../features/digital-twin/scene/config/scenarioConfig.js';
import { useDigitalTwinStore } from '../stores/digitalTwinStore.js';
import '../features/dashboard/dashboard.css';

const scenarioById = new Map(SCENARIOS.map(scenario => [scenario.id, scenario]));
const steps = ['감지', '확인', '원인 분석', '복구 조치', '정상 확인'];

function formatDelta(value, suffix) {
  const numeric = Number(value) || 0;
  return `${numeric > 0 ? '+' : ''}${numeric}${suffix}`;
}

export default function DashboardPage() {
  const incidents = useDigitalTwinStore(state => state.incidents);
  const chosenScenarioId = useDigitalTwinStore(state => state.chosenScenarioId);
  const assetSummary = useDigitalTwinStore(state => state.assetSummary);
  const auditEvents = useDigitalTwinStore(state => state.auditEvents);
  const setScenarioState = useDigitalTwinStore(state => state.setScenarioState);
  const runIncident = useDigitalTwinStore(state => state.runIncident);
  const endIncident = useDigitalTwinStore(state => state.endIncident);
  const resetIncidents = useDigitalTwinStore(state => state.resetIncidents);
  const selectVisualization = useDigitalTwinStore(state => state.selectVisualization);

  const selected = scenarioById.get(chosenScenarioId) ?? SCENARIOS[0];
  const selectedIncident = incidents.find(incident => incident.id === selected.id);
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
    runIncident(selected.id);
    if (['thermal', 'power', 'coolant'].includes(selected.mode)) {
      selectVisualization(selected.mode, true);
    }
  };

  return (
    <main className="dashboard-main">
      <div className="dashboard-heading">
        <div>
          <span>SCENARIO CONTROL CENTER</span>
          <h1>가상 장애 시나리오 제어</h1>
          <p>대상 장비를 선택해 장애를 발생시키고 상태 변화와 대응 현황을 확인합니다.</p>
        </div>
        <div className="dashboard-live">
          <i /> 실시간 연동
        </div>
      </div>

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

      <div className="dashboard-grid">
        <section className="dashboard-panel scenario-control" aria-labelledby="scenario-heading">
          <header className="dashboard-panel-heading">
            <div>
              <span>SCENARIO CONTROL</span>
              <h2 id="scenario-heading">시나리오 제어</h2>
            </div>
            <b>{SCENARIOS.length}종</b>
          </header>
          <div className="scenario-dashboard-list">
            {SCENARIOS.map(scenario => (
              <button
                type="button"
                key={scenario.id}
                className={`${selected.id === scenario.id ? 'selected' : ''}${runningIds.has(scenario.id) ? ' running' : ''}`}
                onClick={() => setScenarioState({ chosenScenarioId: scenario.id })}
              >
                <i />
                <span>
                  <strong>{scenario.title}</strong>
                  <small>
                    {scenario.asset} · {scenario.category}
                  </small>
                </span>
                <em>{runningIds.has(scenario.id) ? '진행 중' : scenario.level}</em>
              </button>
            ))}
          </div>
          <div className="selected-scenario">
            <div className="selected-scenario-title">
              <div>
                <small>
                  {selected.category} / {selected.asset}
                </small>
                <h3>{selected.title}</h3>
              </div>
              <span className={selected.level === '긴급' ? 'critical' : ''}>{selected.level}</span>
            </div>
            <p>{selected.condition}</p>
            <dl>
              <div>
                <dt>예상 영향</dt>
                <dd>{selected.impact}</dd>
              </div>
              <div>
                <dt>점검 방향</dt>
                <dd>{selected.cause}</dd>
              </div>
            </dl>
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
        </section>

        <div className="dashboard-side-stack">
          <section className="dashboard-panel live-status" aria-labelledby="live-heading">
            <header className="dashboard-panel-heading">
              <div>
                <span>LIVE STATUS</span>
                <h2 id="live-heading">실시간 상태 확인</h2>
              </div>
              <b className={selectedIncident ? 'is-fault' : ''}>
                {selectedIncident ? selected.status : '대기'}
              </b>
            </header>
            <div className="live-device">
              <div>
                <small>선택 장비</small>
                <strong>{selected.asset}</strong>
              </div>
              <span>{selected.category}</span>
            </div>
            <div className="live-metrics">
              <div>
                <span>온도 변화</span>
                <strong>{selectedIncident ? formatDelta(selected.temp, '°C') : '0°C'}</strong>
              </div>
              <div>
                <span>부하 변화</span>
                <strong>{selectedIncident ? formatDelta(selected.power, '') : '0'}</strong>
              </div>
              <div>
                <span>장비 상태</span>
                <strong className={selectedIncident ? 'fault-text' : ''}>
                  {selectedIncident ? selected.status : '정상'}
                </strong>
              </div>
            </div>
            <div className="status-progress">
              <span>대응 단계</span>
              <b>{selectedIncident ? steps[selectedIncident.stage] : '시나리오 미실행'}</b>
            </div>
          </section>

          <section className="dashboard-panel active-scenarios" aria-labelledby="active-heading">
            <header className="dashboard-panel-heading">
              <div>
                <span>ACTIVE SCENARIOS</span>
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

      <section className="dashboard-panel event-log" aria-labelledby="event-heading">
        <header className="dashboard-panel-heading">
          <div>
            <span>EVENT HISTORY</span>
            <h2 id="event-heading">이벤트 이력</h2>
          </div>
          <b>최근 {Math.min(auditEvents.length, 12)}건</b>
        </header>
        <div className="event-table" role="table">
          <div className="event-table-head" role="row">
            <span>시간</span>
            <span>사용자</span>
            <span>대상 장비</span>
            <span>이벤트</span>
            <span>상태</span>
          </div>
          {auditEvents.length ? (
            auditEvents.slice(0, 12).map(event => {
              const scenario = scenarioById.get(event.scenarioId);
              return (
                <div className="event-table-row" role="row" key={event.id}>
                  <time>
                    {new Intl.DateTimeFormat('ko-KR', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    }).format(new Date(event.timestamp))}
                  </time>
                  <span>{event.actor}</span>
                  <strong>{scenario?.asset ?? '전체 시설'}</strong>
                  <span>{event.action ?? event.message}</span>
                  <em className={event.kind}>
                    {event.kind === 'danger' ? '장애' : event.kind === 'success' ? '완료' : '정보'}
                  </em>
                </div>
              );
            })
          ) : (
            <p className="dashboard-empty">기록된 이벤트가 없습니다.</p>
          )}
        </div>
      </section>
    </main>
  );
}
