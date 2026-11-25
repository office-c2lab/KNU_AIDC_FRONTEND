import { uiClass } from '../../../styles/interfaceStyles.js';
import { tooltipSurface } from './uiStyles.js';
import SelectedAssetPopup from './SelectedAssetPopup.jsx';
export default function SceneViewport() {
  return (
    <>
      <div
        id="render-host"
        className={uiClass('render-host')}
        aria-label="Three.js 기반 3D 데이터센터 디지털 트윈"
      >
        <div className={uiClass('loading')} id="loading">
          <div className={uiClass('loading-ring')}></div>
          <strong>3D 데이터센터를 준비하고 있습니다</strong>
          <span>Three.js 장면과 설비를 구성하는 중</span>
        </div>
        <div
          className={uiClass(
            `${tooltipSurface} absolute z-[10] hidden max-w-[min(440px,calc(100%_-_24px))] whitespace-normal [overflow-wrap:break-word]`
          )}
          id="hover-tooltip"
          role="tooltip"
        ></div>
        <div className={uiClass('world-labels')} id="world-labels"></div>
        <svg
          id="selected-asset-connector"
          className="pointer-events-none absolute inset-0 z-[11] h-full w-full"
          aria-hidden="true"
          style={{ visibility: 'hidden' }}
        >
          <path fill="none" strokeWidth="1.5" />
          <circle r="4" />
        </svg>
        <SelectedAssetPopup />
        <div
          className={uiClass('world-alerts')}
          id="world-alerts"
          aria-label="3D 설비 장애 위치"
        ></div>
        <div
          className={uiClass('floor-incident-labels')}
          id="floor-incident-labels"
          role="group"
          aria-label="층별 발생 시나리오"
        ></div>
      </div>
      <div className={uiClass('scene-vignette')}></div>
    </>
  );
}
