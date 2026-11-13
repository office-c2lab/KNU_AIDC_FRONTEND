export default function SceneViewport() {
  return (
    <>
      <div
        id="render-host"
        className="render-host"
        aria-label="Three.js 기반 3D 데이터센터 디지털 트윈"
      >
        <div className="loading" id="loading">
          <div className="loading-ring"></div>
          <strong>3D 데이터센터를 준비하고 있습니다</strong>
          <span>Three.js 장면과 설비를 구성하는 중</span>
        </div>
        <div className="hover-tooltip" id="hover-tooltip"></div>
        <div className="world-labels" id="world-labels"></div>
        <div className="world-alerts" id="world-alerts" aria-label="3D 설비 장애 위치"></div>
      </div>
      <div className="scene-vignette"></div>
      <div className="scanlines"></div>
      <div className="frame"></div>
      <i className="corner tl"></i>
      <i className="corner tr"></i>
      <i className="corner bl"></i>
      <i className="corner br"></i>
    </>
  );
}
