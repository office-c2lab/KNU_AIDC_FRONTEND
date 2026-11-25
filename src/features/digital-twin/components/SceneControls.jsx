import { uiClass } from '../../../styles/interfaceStyles.js';
import { Bot, House, Orbit, Snowflake, Thermometer, View, Zap } from 'lucide-react';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore.js';
import { panelSurface, panelTab } from './uiStyles.js';
const dockSurface = `${panelSurface} pointer-events-auto flex items-center h-[56px] px-[12px] rounded-[7px]`;
const dockGroup = 'relative flex flex-none items-center gap-[10px]';
const dockButton = `${panelTab} grid h-[38px] w-[42px] flex-none place-items-center rounded-[4px] p-[0] [&_svg]:h-[18px] [&_svg]:w-[18px]`;
function LayerButton({ active, label, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      className={uiClass(`${dockButton}${active ? ' active' : ''}`)}
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}
function FloorLayoutIcon({ level }) {
  const gap = 3 + level * 3;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {[12 - gap, 12, 12 + gap].map(y => (
        <path key={y} d={`M3 ${y}l9 -3 9 3 -9 3Z`} />
      ))}
    </svg>
  );
}
export default function SceneControls() {
  const viewMode = useDigitalTwinStore(state => state.viewMode);
  const utilities = useDigitalTwinStore(state => state.utilities);
  const agentsVisible = useDigitalTwinStore(state => state.agentsVisible);
  const autoRotate = useDigitalTwinStore(state => state.autoRotate);
  const splitLevel = useDigitalTwinStore(state => state.splitLevel);
  const activeFloor = useDigitalTwinStore(state => state.activeFloor);
  const selectVisualization = useDigitalTwinStore(state => state.selectVisualization);
  const toggleAgentsVisible = useDigitalTwinStore(state => state.toggleAgentsVisible);
  return (
    <>
      <div
        className={uiClass(
          'fixed bottom-[36px] left-[20px] right-[20px] z-[18] flex flex-wrap justify-center gap-[12px] pointer-events-none'
        )}
      >
        <div className={uiClass(dockSurface)} role="toolbar" aria-label="시점 도구">
          <div className={uiClass(dockGroup)}>
            <button
              type="button"
              className={uiClass(dockButton)}
              id="btn-camera-reset"
              title="현재 시설 시점 초기화"
              aria-label="현재 시설 시점 초기화"
            >
              <House aria-hidden="true" />
            </button>
            <button
              type="button"
              className={uiClass(dockButton)}
              id="topChip"
              title="위에서 보기"
              aria-label="위에서 보기"
            >
              <View aria-hidden="true" />
            </button>
            <button
              type="button"
              className={uiClass(`${dockButton}${autoRotate ? ' active' : ''}`)}
              id="btn-auto"
              title="자동 회전"
              aria-label="자동 회전"
              aria-pressed={autoRotate}
            >
              <Orbit aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className={uiClass(dockSurface)} role="toolbar" aria-label="층 배치">
          <div className={uiClass(dockGroup)}>
            {['기본 배치', '층 분리 1단계', '층 분리 2단계'].map((label, level) => (
              <button
                key={label}
                type="button"
                className={uiClass(
                  `${dockButton}${!activeFloor && splitLevel === level ? ' active' : ''}`
                )}
                data-split-level={level}
                aria-pressed={!activeFloor && splitLevel === level}
                aria-label={label}
                title={label}
              >
                <FloorLayoutIcon level={level} />
              </button>
            ))}
          </div>
        </div>
        <div className={uiClass(dockSurface)} role="toolbar" aria-label="온도 및 표시 레이어">
          <div className={uiClass(dockGroup)}>
            <button
              type="button"
              className={uiClass(`${dockButton}${viewMode === 'thermal' ? ' active' : ''}`)}
              data-mode="thermal"
              aria-pressed={viewMode === 'thermal'}
              title="온도 분포를 켜거나 끕니다"
              aria-label="온도 분포"
            >
              <Thermometer aria-hidden="true" />
            </button>
            <LayerButton
              active={utilities.power}
              label="전력 계통"
              icon={Zap}
              onClick={() => selectVisualization('power')}
            />
            <LayerButton
              active={utilities.coolant}
              label="냉각 계통"
              icon={Snowflake}
              onClick={() => selectVisualization('coolant')}
            />
            <LayerButton
              active={agentsVisible}
              label="AI 운영 요원"
              icon={Bot}
              onClick={toggleAgentsVisible}
            />
          </div>
        </div>
      </div>
      <div id="floor-separation-hint" hidden></div>
      <div className={uiClass('v9-logic')} aria-hidden="true">
        <span id="stat-assets"></span>
        <span id="stat-healthy"></span>
        <span id="stat-alerts"></span>
      </div>
    </>
  );
}
