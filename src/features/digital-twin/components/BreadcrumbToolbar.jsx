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
          <b id="crumb-current">시설 전체</b>
        </div>
        <div
          className="view-actions pointer-events-auto flex shrink-0 items-center gap-1"
          role="toolbar"
          aria-label="시설 층 배치, 시점 및 화질 설정"
        >
          <span className="view-actions-label">층 배치</span>
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
          <span className="view-actions-label">시점</span>
          <button type="button" className={chip} id="topChip" title="위에서 내려다보는 시점">
            위에서 보기
          </button>
          <button type="button" className={chip} id="btn-auto" title="자동 회전">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M20 7V3m0 0h-4m4 0-3 3a8 8 0 1 0 2 8" />
            </svg>
            <span>자동 회전</span>
          </button>
          <button type="button" className={chip} id="btn-view-reset" title="현재 시점 초기화">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 12a8 8 0 1 0 3-6.2L4 8m0-5v5h5" />
            </svg>
            <span>초기화</span>
          </button>
          <span className="view-actions-divider" role="separator" aria-hidden="true"></span>
          <span className="view-actions-label">화질</span>
          <div className="quality-options flex gap-1" role="group" aria-label="렌더링 화질 선택">
            <button
              type="button"
              className={chip}
              id="quality-low"
              data-quality="low"
              aria-pressed="false"
              title="저화질 모드로 렌더링 부담 줄이기"
            >
              성능
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
        </div>
      </div>
    </>
  );
}
