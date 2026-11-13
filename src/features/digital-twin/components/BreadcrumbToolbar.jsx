const chip =
  'chip rounded-sm border border-[#375582] bg-[#12213d] px-2.5 py-[7px] text-[10px] font-semibold whitespace-nowrap text-[#a4bad6] shadow-[inset_0_1px_#9bcaff25] transition hover:border-[#76a6e0] hover:bg-[#243f68] hover:text-[#eff8ff]';

export default function BreadcrumbToolbar() {
  return (
    <>
      <div className="breadcrumbs pointer-events-none fixed top-[86px] right-[calc(var(--right-w)+42px)] left-[calc(var(--left-w)+42px)] z-[18] flex h-9 items-center justify-between gap-2.5 text-[#8198b5]">
        <div className="crumb-path pointer-events-auto flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap">
          <span>⌂</span>
          <span className="sep">›</span>
          <span>KNU AIDC</span>
          <span className="sep">›</span>
          <b id="crumb-current">Building Overview</b>
        </div>
        <div
          className="view-actions pointer-events-auto flex shrink-0 items-center gap-1"
          role="toolbar"
          aria-label="시설 층 배치, 화질 및 시점 설정"
        >
          <button
            type="button"
            className={`${chip} active`}
            data-split-level="0"
            aria-pressed="true"
            title="4개 층 기본 배치"
          >
            기본
          </button>
          <button
            type="button"
            className={chip}
            data-split-level="1"
            aria-pressed="false"
            title="층 분리 1단계"
          >
            분리 1단계
          </button>
          <button
            type="button"
            className={chip}
            data-split-level="2"
            aria-pressed="false"
            title="층 분리 2단계"
          >
            분리 2단계
          </button>
          <span className="view-actions-divider" role="separator" aria-hidden="true"></span>
          <div className="quality-options flex gap-1" role="group" aria-label="렌더링 화질 선택">
            <button
              type="button"
              className={chip}
              id="quality-low"
              data-quality="low"
              aria-pressed="false"
              title="저화질 모드로 렌더링 부담 줄이기"
            >
              저화질
            </button>
            <button
              type="button"
              className={`${chip} active`}
              id="quality-high"
              data-quality="high"
              aria-pressed="true"
              title="고화질 모드로 선명하게 표시"
            >
              고화질
            </button>
          </div>
          <span className="view-actions-divider" role="separator" aria-hidden="true"></span>
          <button type="button" className={chip} id="topChip" title="위에서 내려다보는 시점">
            TOP
          </button>
        </div>
      </div>
    </>
  );
}
