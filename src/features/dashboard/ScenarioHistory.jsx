import { useDigitalTwinStore } from '../../stores/digitalTwinStore.js';
import { motion } from 'framer-motion';
import { SCENARIOS } from '../digital-twin/scene/config/scenarioConfig.js';
import { panelEntrance } from '../../utils/panelMotion.js';

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
    <motion.section
      {...panelEntrance({ y: 22, delay: 0.18 })}
      className="scenario-history"
      aria-labelledby="scenario-history-title"
    >
      <header>
        <h2 id="scenario-history-title">시나리오 이력</h2>
        <span>최근 {events.length}건</span>
      </header>
      <div className="scenario-history-body">
        {events.length ? (
          <ol className="scenario-history-list">
            {events.map(event => {
              const scenario = scenarioById.get(event.scenarioId);
              return (
                <li key={event.id}>
                  <div className="scenario-history-event">
                    <strong>
                      {scenario
                        ? scenario.title.replace(scenario.asset, '').trim()
                        : '전체 시나리오'}
                    </strong>
                    <span className={`scenario-history-action ${event.kind}`}>
                      {event.action?.replace(/^전체 초기화/, '모든 시나리오 종료')}
                    </span>
                  </div>
                  <div className="scenario-history-meta">
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
          <p className="scenario-history-empty">
            아직 시나리오 이력이 없습니다.
            <br />
            실행·종료하면 이곳에 기록됩니다.
          </p>
        )}
      </div>
    </motion.section>
  );
}
