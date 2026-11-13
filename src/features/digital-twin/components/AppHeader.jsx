const navItem =
  'nav-item relative h-16 border-0 bg-transparent px-0.5 font-semibold tracking-[0.15px] text-[#a8b9d2] transition-colors hover:text-[#f0f7ff]';

export default function AppHeader() {
  return (
    <>
      <header className="fixed inset-x-[10px] top-[9px] z-20 grid h-[76px] grid-cols-[1fr_520px_1fr] items-start border-b border-[#668cc556] bg-[#0c1833ed] shadow-[inset_0_1px_#88ade13d,0_8px_25px_#03081959] max-[1250px]:grid-cols-[1fr_420px_1fr] max-[930px]:grid-cols-[1fr_330px_1fr] max-[700px]:grid-cols-[1fr_220px_1fr]">
        <nav className="main-nav flex h-16 items-center gap-[30px] pl-7" aria-label="주 메뉴">
          <button className={`${navItem} active`} data-topnav="facility">
            Facility Monitoring
          </button>
          <button className={navItem} data-topnav="power">
            Power Distribution
          </button>
          <button className={navItem} data-topnav="ai">
            AI Operations
          </button>
        </nav>
        <div className="system-title relative grid h-[66px] place-items-center text-center">
          <span className="title-ticks left" aria-hidden="true"></span>
          <svg
            className="title-frame"
            aria-hidden="true"
            viewBox="0 0 600 76"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="title-wings" x2="0" y2="1">
                <stop stopColor="#304b80" stopOpacity="0" />
                <stop offset=".52" stopColor="#223a68" stopOpacity=".56" />
                <stop offset=".92" stopColor="#3f619b" stopOpacity=".59" />
                <stop offset="1" stopColor="#162750" stopOpacity=".38" />
              </linearGradient>
              <linearGradient id="title-glass" x2="0" y2="1">
                <stop stopColor="#2d4c83" stopOpacity="0" />
                <stop offset=".53" stopColor="#1e3865" stopOpacity=".32" />
                <stop offset=".89" stopColor="#315990" stopOpacity=".82" />
                <stop offset="1" stopColor="#527fc0" stopOpacity=".84" />
              </linearGradient>
              <radialGradient
                id="title-halo"
                cx=".5"
                cy=".93"
                r=".52"
                gradientTransform="translate(0 .12) scale(1 .87)"
              >
                <stop stopColor="#8ec5ff" stopOpacity=".52" />
                <stop offset=".48" stopColor="#4883d3" stopOpacity=".23" />
                <stop offset="1" stopColor="#4076d2" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="title-slope" x2="0" y2="1">
                <stop stopColor="#84b3f0" stopOpacity="0" />
                <stop offset=".55" stopColor="#85b4fc" stopOpacity=".39" />
                <stop offset="1" stopColor="#bcdeff" stopOpacity=".95" />
              </linearGradient>
              <linearGradient id="title-edge">
                <stop stopColor="#6ca7ff" stopOpacity="0" />
                <stop offset=".17" stopColor="#87c7ff" />
                <stop offset=".5" stopColor="#f1f8ff" />
                <stop offset=".83" stopColor="#87c7ff" />
                <stop offset="1" stopColor="#6ca7ff" stopOpacity="0" />
              </linearGradient>
              <filter
                id="title-diffusion"
                filterUnits="userSpaceOnUse"
                x="75"
                y="54"
                width="450"
                height="26"
              >
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>
            <path fill="url(#title-wings)" d="M13 5H587V49L562 63H38L13 49Z" />
            <path fill="url(#title-glass)" d="M43 5H557L505 67H95Z" />
            <path fill="url(#title-halo)" d="M43 5H557L505 67H95Z" />
            <path fill="#b9d7ff" fillOpacity=".07" d="M44 5H53L103 66H95ZM547 5H556L505 66H497Z" />
            <path
              fill="none"
              stroke="url(#title-slope)"
              strokeWidth="1.35"
              d="M43 5L95 67H505L557 5"
            />
            <path
              fill="none"
              stroke="url(#title-edge)"
              strokeWidth="5"
              filter="url(#title-diffusion)"
              d="M99 67H501"
            />
            <path fill="none" stroke="url(#title-edge)" strokeWidth="1.4" d="M95 67H505" />
            <path
              fill="#1d2b4b"
              stroke="#eac476"
              strokeOpacity=".72"
              strokeWidth=".8"
              d="M256 67L261 63H339L344 67Z"
            />
            <path fill="none" stroke="#ffe1a0" strokeOpacity=".95" d="M265 65H335" />
          </svg>
          <div className="title-copy relative pb-0.5">
            <strong className="text-sm font-semibold tracking-[0.65px]">
              KNU AIDC Infrastructure Management System
            </strong>
            <small className="mt-1.5 block text-[9px] tracking-[2.4px] text-[#aac9ef]">
              3D DIGITAL TWIN CONTROL CENTER
            </small>
          </div>
          <span className="title-ticks right" aria-hidden="true"></span>
        </div>
        <div className="header-tools flex h-16 items-center justify-end gap-[18px] pr-7 text-[#9dafc4]">
          <div className="live-pill flex items-center gap-2 rounded-sm border border-[#3f6287] bg-[#162943] px-2.5 py-2 text-[#c5dcec] shadow-[inset_0_1px_#9dccfa25]">
            <i className="live-dot h-[7px] w-[7px] rounded-full bg-[#73e1c0] shadow-[0_0_10px_#73e1c0]"></i>
            <span>SIM MONITORING</span>
          </div>
          <button
            type="button"
            className="tool-icon relative grid h-[29px] w-[29px] place-items-center rounded-sm border border-[#3a5279] bg-[#16243d] text-[#bdd3ed]"
            id="header-alarm"
            title="장애 시뮬레이션 열기"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0" />
            </svg>
            <span className="badge" id="header-alarm-count">
              0
            </span>
          </button>
          <span className="operator-name text-[#b4c6de]">Admin</span>
          <span
            className="clock min-w-[78px] text-right font-mono text-xs font-semibold text-[#d5e5fc]"
            id="clock"
          >
            --:--:--
          </span>
        </div>
      </header>
    </>
  );
}
