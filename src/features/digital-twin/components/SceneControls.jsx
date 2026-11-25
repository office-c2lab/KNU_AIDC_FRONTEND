import { uiClass } from '../../../styles/interfaceStyles.js';
import { Bot, House, RotateCw, Snowflake, Thermometer, View, Zap } from 'lucide-react';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore.js';
const dockButton =
  'grid h-[38px] w-[42px] flex-none place-items-center rounded-[4px] border border-transparent bg-transparent p-[0] text-[#afc8e4] transition-colors hover:border-[#4d7198] hover:bg-[#193554] hover:text-white [&.active]:border-[#73a8dc] [&.active]:bg-[#224a73] [&.active]:text-white [&_svg]:h-[18px] [&_svg]:w-[18px]';
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
        <div className={uiClass('control-dock')} role="toolbar" aria-label="시점 도구">
          <div className={uiClass('dock-group')}>
            <button
              type="button"
              className={uiClass(dockButton)}
              id="btn-fit"
              title="전체 시설 보기"
              aria-label="전체 시설 보기"
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
              <RotateCw aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className={uiClass('control-dock')} role="toolbar" aria-label="층 배치">
          <div className={uiClass('dock-group')}>
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
        <div className={uiClass('control-dock')} role="toolbar" aria-label="온도 및 표시 레이어">
          <div className={uiClass('dock-group')}>
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
