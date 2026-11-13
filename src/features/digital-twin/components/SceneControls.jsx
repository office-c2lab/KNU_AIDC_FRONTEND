const dockButton =
  'dock-button flex h-8 items-center gap-2 border-0 border-r border-[#243e61] bg-transparent px-[13px] text-[#b1c9e5] transition hover:bg-[#102845] hover:text-[#e9f5ff]';

export default function SceneControls() {
  return (
    <>
      <div className="scene-caption pointer-events-none fixed bottom-[97px] left-1/2 z-[7] -translate-x-1/2 text-center text-[9px] leading-relaxed tracking-[2px] text-[#a1bad6]">
        <b id="view-title">데이터센터 전체 시설</b>
        <span id="view-subtitle">4개 층의 메인 건물과 2개 지원 시설</span>
      </div>
      <div id="incident-overlay" className="incident-overlay" aria-live="polite"></div>
      <div className="center-status pointer-events-none fixed right-[calc(var(--right-w)+31px)] bottom-9 left-[calc(var(--left-w)+31px)] z-[18] flex justify-center">
        <div
          className="control-dock pointer-events-auto flex h-12 max-w-full items-center overflow-x-auto border border-[#6384b0a6] bg-[#101d34f5] px-2.5 shadow-[inset_0_1px_#a3c6f035,0_8px_24px_#030a1ca0]"
          role="toolbar"
          aria-label="데이터센터 3D 관제 도구"
        >
          <span className="dock-hint">
            <b>Mouse</b> Rotate / Zoom
          </span>
          <button type="button" className={dockButton} id="btn-fit" title="전체 시설 보기">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 10.5 12 3l9 7.5V21H6v-8h12v8" />
            </svg>
            <span>전체 시설</span>
          </button>
          <span className="dock-divider"></span>
          <button
            type="button"
            className={`${dockButton} active`}
            data-mode="normal"
            title="일반 시각화"
          >
            일반
          </button>
          <button type="button" className={dockButton} data-mode="thermal" title="온도 분포 보기">
            온도
          </button>
          <button
            type="button"
            className={dockButton}
            data-mode="power"
            title="전력 A/B 계통을 켜거나 끕니다"
            aria-label="전력 계통"
            aria-pressed="false"
          >
            전력 OFF
          </button>
          <button
            type="button"
            className={dockButton}
            data-mode="coolant"
            title="냉수 공급·회수 계통을 켜거나 끕니다"
            aria-label="냉각 계통"
            aria-pressed="false"
          >
            냉각 OFF
          </button>
          <span className="dock-divider"></span>
          <button
            type="button"
            className={`${dockButton} dock-agent active`}
            id="btn-agent-visibility"
            title="AI 운영 요원 표시 / 숨기기"
            aria-pressed="true"
          >
            요원 ON
          </button>
          <span className="dock-divider"></span>
          <button type="button" className={dockButton} id="btn-auto" title="자동 회전">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M20 7V3m0 0h-4m4 0-3 3a8 8 0 1 0 2 8" />
            </svg>
            <span>자동 회전</span>
          </button>
          <button type="button" className={dockButton} id="btn-view-reset" title="시점 초기화">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 12a8 8 0 1 0 3-6.2L4 8m0-5v5h5" />
            </svg>
            <span>시점 초기화</span>
          </button>
          <button type="button" className={`${dockButton} dock-zoom`} id="btn-zoom-in" title="확대">
            ＋
          </button>
          <button
            type="button"
            className={`${dockButton} dock-zoom`}
            id="btn-zoom-out"
            title="축소"
          >
            －
          </button>
        </div>
      </div>
      <div className="v9-hud-status fixed bottom-3 left-1/2 z-[18] flex -translate-x-1/2 items-center gap-2 font-mono text-[9px] text-[#8ca8c5]">
        <span id="floor-state">전체 층</span>
        <span className="dotline">·</span>
        <span id="mode-hint">마우스 드래그 회전 · 휠 확대</span>
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
