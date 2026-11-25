import { uiClass } from '../../styles/interfaceStyles.js';
import { useDigitalTwinStore } from '../../stores/digitalTwinStore.js';
import DashboardPanel from './DashboardPanel.jsx';
import { SCENARIOS } from '../digital-twin/scene/config/scenarioConfig.js';
const scenarioById = new Map(SCENARIOS.map(scenario => [scenario.id, scenario]));
const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});
export default function ScenarioHistory() {
  const auditEvents = useDigitalTwinStore(state => state.auditEvents);
  const events = auditEvents.filter(
    event => event.scenarioId || /^(전체 초기화|모든 시나리오 종료)/.test(event.action ?? '')
  );
  return (
    <DashboardPanel
      title="시나리오 이력"
      titleId="scenario-history-title"
      extra={<span>최근 {events.length}건</span>}
      className={uiClass('scenario-history')}
    >
      <div className={uiClass('scenario-history-body')}>
        {events.length ? (
          <ol className={uiClass('scenario-history-list')}>
            {events.map(event => {
              const scenario = scenarioById.get(event.scenarioId);
              return (
                <li key={event.id}>
                  <div className={uiClass('scenario-history-event')}>
                    <strong>
                      {scenario
                        ? scenario.title.replace(scenario.asset, '').trim()
                        : '전체 시나리오'}
                    </strong>
                    <span className={uiClass(`scenario-history-action ${event.kind}`)}>
                      {event.action?.replace(/^전체 초기화/, '모든 시나리오 종료')}
                    </span>
                  </div>
                  <div className={uiClass('scenario-history-meta')}>
                    {scenario && <span>{scenario.asset}</span>}
                    <time dateTime={event.timestamp}>
                      {timeFormat.format(new Date(event.timestamp))}
                    </time>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className={uiClass('scenario-history-empty')}>
            아직 시나리오 이력이 없습니다.
            <br />
            실행·종료하면 이곳에 기록됩니다.
          </p>
        )}
      </div>
    </DashboardPanel>
  );
}
