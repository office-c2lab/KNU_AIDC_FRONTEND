import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore.js';
import { SCENARIOS } from '../scene/config/scenarioConfig.js';

const scenarioById = new Map(SCENARIOS.map(scenario => [scenario.id, scenario]));

export default function NotificationsPanel({ dashboardMode = false }) {
  const open = useDigitalTwinStore(state => state.notificationsOpen);
  const setOpen = useDigitalTwinStore(state => state.setNotificationsOpen);
  const incidents = useDigitalTwinStore(state => state.incidents);
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    const close = () => {
      setOpen(false);
      document.getElementById('header-alarm')?.focus({ preventScroll: true });
    };
    const onPointerDown = event => {
      if (!panelRef.current?.contains(event.target) && !event.target.closest('#header-alarm'))
        setOpen(false);
    };
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, setOpen]);

  return (
    <section
      ref={panelRef}
      id="notifications-panel"
      className="notifications-panel"
      role="region"
      aria-labelledby="alarm-heading"
      hidden={!open}
    >
      <div className="notifications-heading">
        <h2 id="alarm-heading">알림 및 이벤트</h2>
        <span className="module-readout" id="alarm-count">
          최근 0건
        </span>
        <button
          ref={closeRef}
          type="button"
          aria-label="알림 닫기"
          onClick={() => {
            setOpen(false);
            document.getElementById('header-alarm')?.focus({ preventScroll: true });
          }}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <ul className="alarm-list" id="alarm-list" aria-live="polite">
        {dashboardMode &&
          incidents.map(incident => {
            const scenario = scenarioById.get(incident.id);
            if (!scenario) return null;
            return (
              <li className="alarm-item" data-level="critical" key={incident.id}>
                <span className="alarm-level"></span>
                <div className="alarm-copy">
                  <b>{scenario.title}</b>
                  <small>{scenario.asset} · 진행 중</small>
                </div>
                <div className="alarm-meta">
                  <time className="alarm-time">
                    {new Intl.DateTimeFormat('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(incident.started))}
                  </time>
                  <span className="alarm-severity">장애</span>
                </div>
              </li>
            );
          })}
        {dashboardMode && !incidents.length && (
          <li className="dashboard-empty">진행 중인 알림이 없습니다.</li>
        )}
      </ul>
    </section>
  );
}
