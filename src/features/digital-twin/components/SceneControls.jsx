import { House } from 'lucide-react';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore.js';

const dockButton = 'dock-button';

export default function SceneControls() {
  const viewMode = useDigitalTwinStore(state => state.viewMode);
  const utilities = useDigitalTwinStore(state => state.utilities);
  const agentsVisible = useDigitalTwinStore(state => state.agentsVisible);

  return (
    <>
      <div id="incident-overlay" className="incident-overlay" aria-live="polite"></div>
      <div className="center-status">
        <div className="control-dock" role="toolbar" aria-label="데이터센터 3D 관제 도구">
          <div className="dock-group dock-home-group">
            <button type="button" className={dockButton} id="btn-fit" title="전체 시설 보기">
              <House size={14} aria-hidden="true" />
              <span>전체 시설</span>
            </button>
          </div>

          <div className="dock-group" role="group" aria-label="분석 모드">
            <button
              type="button"
              className={`${dockButton}${viewMode === 'thermal' ? ' active' : ''}`}
              data-mode="thermal"
              aria-pressed={viewMode === 'thermal'}
              title="온도 분포를 켜거나 끕니다"
            >
              온도
            </button>
          </div>

          <div className="dock-group" role="group" aria-label="표시 레이어">
            <button
              type="button"
              className={`${dockButton}${utilities.power ? ' active' : ''}`}
              data-mode="power"
              title="전력 A/B 계통을 켜거나 끕니다"
              aria-pressed={utilities.power}
            >
              전력
            </button>
            <button
              type="button"
              className={`${dockButton}${utilities.coolant ? ' active' : ''}`}
              data-mode="coolant"
              title="냉수 공급·회수 계통을 켜거나 끕니다"
              aria-pressed={utilities.coolant}
            >
              냉각
            </button>
          </div>

          <div className="dock-group">
            <button
              type="button"
              className={`${dockButton}${agentsVisible ? ' active' : ''}`}
              id="btn-agent-visibility"
              aria-pressed={agentsVisible}
              title="AI 운영 요원을 표시하거나 숨깁니다"
            >
              에이전트
            </button>
          </div>
        </div>
      </div>
      <div id="floor-separation-hint" hidden></div>
      <div className="v9-logic" aria-hidden="true">
        <span id="stat-assets"></span>
        <span id="stat-healthy"></span>
        <span id="stat-alerts"></span>
      </div>
    </>
  );
}
