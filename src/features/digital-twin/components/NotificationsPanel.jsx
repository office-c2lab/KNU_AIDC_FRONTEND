import { uiClass } from '../../../styles/interfaceStyles.js';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore.js';
import { SCENARIOS } from '../scene/config/scenarioConfig.js';
import { panelSurface } from './uiStyles.js';
import './NotificationsPanel.css';
const scenarioById = new Map(SCENARIOS.map(scenario => [scenario.id, scenario]));
export default function NotificationsPanel({ dashboardMode = false }) {
  const open = useDigitalTwinStore(state => state.notificationsOpen);
  const setOpen = useDigitalTwinStore(state => state.setNotificationsOpen);
  const incidents = useDigitalTwinStore(state => state.incidents);
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({
      preventScroll: true,
    });
    const close = () => {
      setOpen(false);
      document.getElementById('header-alarm')?.focus({
        preventScroll: true,
      });
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
      aria-hidden={!open}
      inert={!open}
      ref={panelRef}
      id="notifications-panel"
      className={`notifications-panel ${panelSurface} fixed top-[78px] right-[26px] z-[100] w-[min(400px,calc(var(--app-viewport-width,100vw)-32px))] max-h-[calc(var(--app-viewport-height,100dvh)-100px)] overflow-y-auto rounded-[7px]`}
      role="region"
      aria-labelledby="alarm-heading"
      hidden={!open}
    >
      <div className={uiClass('notifications-heading')}>
        <h2 id="alarm-heading">알림 및 이벤트</h2>
        <span className={uiClass('module-readout')} id="alarm-count">
          전체 {dashboardMode ? incidents.length : 0}건
        </span>
        <button
          ref={closeRef}
          type="button"
          aria-label="알림 닫기"
          onClick={() => {
            setOpen(false);
            document.getElementById('header-alarm')?.focus({
              preventScroll: true,
            });
          }}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <ul className={uiClass('alarm-list')} id="alarm-list" aria-live="polite">
        {dashboardMode &&
          incidents.map(incident => {
            const scenario = scenarioById.get(incident.id);
            if (!scenario) return null;
            return (
              <li className={uiClass('alarm-item')} data-level="critical" key={incident.id}>
                <span className={uiClass('alarm-level')}></span>
                <div className={uiClass('alarm-copy')}>
                  <b>{scenario.title}</b>
                  <small>{scenario.asset} · 진행 중</small>
                </div>
                <div className={uiClass('alarm-meta')}>
                  <time className={uiClass('alarm-time')}>
                    {new Intl.DateTimeFormat('ko-KR', {
                      timeZone: 'Asia/Seoul',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(incident.started))}
                  </time>
                  <span className={uiClass('alarm-severity')}>장애</span>
                </div>
              </li>
            );
          })}
        {dashboardMode && !incidents.length && (
          <li className={uiClass('dashboard-empty')}>진행 중인 알림이 없습니다.</li>
        )}
      </ul>
    </section>
  );
}
