export default function DigitalTwinMarkup() {
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
      <header>
        <nav className="main-nav" aria-label="주 메뉴">
          <button className="nav-item active" data-topnav="facility">
            Facility Monitoring
          </button>
          <button className="nav-item" data-topnav="power">
            Power Distribution
          </button>
          <button className="nav-item" data-topnav="ai">
            AI Operations
          </button>
        </nav>
        <div className="system-title">
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
          <div className="title-copy">
            <strong>KNU AIDC Infrastructure Management System</strong>
            <small>3D DIGITAL TWIN CONTROL CENTER</small>
          </div>
          <span className="title-ticks right" aria-hidden="true"></span>
        </div>
        <div className="header-tools">
          <div className="live-pill">
            <i className="live-dot"></i>
            <span>SIM MONITORING</span>
          </div>
          <button
            type="button"
            className="tool-icon"
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
          <span className="operator-name">Admin</span>
          <span className="clock" id="clock">
            --:--:--
          </span>
        </div>
      </header>
      <div className="breadcrumbs">
        <div className="crumb-path">
          <span>⌂</span>
          <span className="sep">›</span>
          <span>KNU AIDC</span>
          <span className="sep">›</span>
          <b id="crumb-current">Building Overview</b>
        </div>
        <div className="view-actions" role="toolbar" aria-label="시설 층 배치, 화질 및 시점 설정">
          <button
            type="button"
            className="chip active"
            data-split-level="0"
            aria-pressed="true"
            title="4개 층 기본 배치"
          >
            기본
          </button>
          <button
            type="button"
            className="chip"
            data-split-level="1"
            aria-pressed="false"
            title="층 분리 1단계"
          >
            분리 1단계
          </button>
          <button
            type="button"
            className="chip"
            data-split-level="2"
            aria-pressed="false"
            title="층 분리 2단계"
          >
            분리 2단계
          </button>
          <span className="view-actions-divider" role="separator" aria-hidden="true"></span>
          <div className="quality-options" role="group" aria-label="렌더링 화질 선택">
            <button
              type="button"
              className="chip"
              id="quality-low"
              data-quality="low"
              aria-pressed="false"
              title="저화질 모드로 렌더링 부담 줄이기"
            >
              저화질
            </button>
            <button
              type="button"
              className="chip active"
              id="quality-high"
              data-quality="high"
              aria-pressed="true"
              title="고화질 모드로 선명하게 표시"
            >
              고화질
            </button>
          </div>
          <span className="view-actions-divider" role="separator" aria-hidden="true"></span>
          <button type="button" className="chip" id="topChip" title="위에서 내려다보는 시점">
            TOP
          </button>
        </div>
      </div>
      <aside className="panel left-panel" aria-label="시설 현황 및 층 탐색">
        <div className="panel-scroll">
          <section className="facility-section" aria-labelledby="facility-heading">
            <div className="section-title">
              <h2 id="facility-heading">Facility Overview</h2>
              <span className="module-readout">KNU AIDC / DEMO</span>
            </div>
            <div className="pue-card">
              <div className="pue-gauge">
                <svg viewBox="0 0 130 130" aria-hidden="true">
                  <defs>
                    <linearGradient id="pue-metal" x2="0" y2="1">
                      <stop stopColor="#2b4971" />
                      <stop offset="1" stopColor="#101e36" />
                    </linearGradient>
                    <linearGradient id="pue-blue">
                      <stop stopColor="#4c85ce" />
                      <stop offset=".76" stopColor="#9cddff" />
                      <stop offset="1" stopColor="#e0f5ff" />
                    </linearGradient>
                    <path id="pue-arc" pathLength="100" d="M35.3 96.7A42 42 0 1 1 94.7 96.7" />
                    <path id="pue-scale" pathLength="100" d="M28.2 103.8A52 52 0 1 1 101.8 103.8" />
                  </defs>
                  <circle cx="65" cy="67" r="59" fill="#0d1a30" stroke="#496d9a" />
                  <circle cx="65" cy="67" r="55.5" fill="#111e36" stroke="#7da2cc55" />
                  <circle cx="65" cy="67" r="34.5" fill="url(#pue-metal)" stroke="#567dab" />
                  <use
                    href="#pue-scale"
                    fill="none"
                    stroke="#83a4ca"
                    strokeWidth="3"
                    strokeDasharray=".65 3.35"
                  />
                  <use
                    href="#pue-scale"
                    fill="none"
                    stroke="#b9d4f4"
                    strokeWidth="5"
                    strokeDasharray=".8 19.2"
                  />
                  <use href="#pue-arc" fill="none" stroke="#050e22" strokeWidth="9" />
                  <use href="#pue-arc" fill="none" stroke="#34547e" strokeWidth="5" />

                  <use
                    className="gauge-fill"
                    href="#pue-arc"
                    fill="none"
                    stroke="url(#pue-blue)"
                    strokeWidth="5"
                    strokeDasharray="64 100"
                  />
                  <path d="M102.5 61.1L112.4 59.5" stroke="#eac476" strokeWidth="2" />
                  <g fill="#a8c2df" fontSize="8" fontFamily="monospace" textAnchor="middle">
                    <text x="34" y="113">
                      1.00
                    </text>
                    <text x="96" y="113">
                      1.50
                    </text>
                  </g>
                </svg>
                <div className="gauge-value">
                  <strong>1.32</strong>
                  <small>PUE</small>
                </div>
              </div>
              <div className="pue-meta">
                <b>High Efficiency</b>
                <span className="status-tag stable">Stable / Normal</span>
                <div className="pue-note">
                  <span>
                    Target PUE <strong>≤ 1.40</strong>
                  </span>
                  <span>DEMO DATA</span>
                </div>
              </div>
            </div>
          </section>

          <section className="power-section" aria-labelledby="power-heading">
            <div className="sub-title">
              <h2 id="power-heading">Power Flow</h2>
              <span className="module-readout">
                <strong>5.84</strong>
                <span className="unit">MW</span>
              </span>
            </div>
            <div className="power-list">
              <div className="power-row">
                <span>IT Load</span>
                <div className="bar blue" style={{ '--load': '72%' }} aria-hidden="true">
                  <div className="bar-track">
                    <i></i>
                  </div>
                </div>
                <b>3.72</b>
              </div>
              <div className="power-row">
                <span>Cooling</span>
                <div className="bar" style={{ '--load': '43%' }} aria-hidden="true">
                  <div className="bar-track">
                    <i></i>
                  </div>
                </div>
                <b>1.21</b>
              </div>
              <div className="power-row">
                <span>Electrical</span>
                <div className="bar amber" style={{ '--load': '31%' }} aria-hidden="true">
                  <div className="bar-track">
                    <i></i>
                  </div>
                </div>
                <b>0.68</b>
              </div>
              <div className="power-row">
                <span>Reserved</span>
                <div className="bar" style={{ '--load': '17%' }} aria-hidden="true">
                  <div className="bar-track">
                    <i></i>
                  </div>
                </div>
                <b>0.23</b>
              </div>
            </div>
          </section>

          <section aria-labelledby="floor-heading">
            <div className="sub-title">
              <h2 id="floor-heading">Floor Navigation</h2>
              <span className="module-readout" id="floor-count">
                4F
              </span>
            </div>
            <div className="floor-list" id="floor-list">
              <button type="button" className="floor-button" data-floor="4F">
                <span className="floor-no">4F</span>
                <span className="floor-copy">
                  <strong>통합 관제층</strong>
                  <small>NOC · SOC / OPERATIONS</small>
                </span>
                <span className="health" id="health-4F">
                  정상
                </span>
              </button>
              <button type="button" className="floor-button" data-floor="3F">
                <span className="floor-no">3F</span>
                <span className="floor-copy">
                  <strong>AI / GPU 전산층</strong>
                  <small>GPU / LIQUID COOLING</small>
                </span>
                <span className="health" id="health-3F">
                  정상
                </span>
              </button>
              <button type="button" className="floor-button" data-floor="2F">
                <span className="floor-no">2F</span>
                <span className="floor-copy">
                  <strong>일반 서버 전산층</strong>
                  <small>SERVER / STORAGE / CRAC</small>
                </span>
                <span className="health" id="health-2F">
                  정상
                </span>
              </button>
              <button type="button" className="floor-button" data-floor="1F">
                <span className="floor-no">1F</span>
                <span className="floor-copy">
                  <strong>보안·통신·장비 반입</strong>
                  <small>SECURITY / MDF / STAGING</small>
                </span>
                <span className="health" id="health-1F">
                  정상
                </span>
              </button>
            </div>
          </section>
          <section className="support-section" aria-labelledby="support-heading">
            <div className="sub-title">
              <h2 id="support-heading">Support Facilities</h2>
              <span className="module-readout">SITE 02</span>
            </div>
            <div className="floor-list facility-support" aria-label="전력·냉각 외부 지원 시설">
              <button type="button" className="floor-button" data-zone="power" aria-pressed="false">
                <span className="floor-no">P</span>
                <span className="floor-copy">
                  <strong>전력 설비동</strong>
                  <small>UPS · BATTERY · GENERATOR</small>
                </span>
                <span className="health" id="health-power">
                  정상
                </span>
              </button>
              <button
                type="button"
                className="floor-button"
                data-zone="cooling"
                aria-pressed="false"
              >
                <span className="floor-no">C</span>
                <span className="floor-copy">
                  <strong>냉각 설비동</strong>
                  <small>CHILLER · PUMP · HEAT EXCHANGER</small>
                </span>
                <span className="health" id="health-cooling">
                  정상
                </span>
              </button>
            </div>
          </section>
        </div>
      </aside>
      <aside className="panel right-panel" aria-label="환경 및 설비 상태">
        <div className="panel-scroll">
          <section aria-labelledby="environment-heading">
            <div className="section-title">
              <h2 id="environment-heading">Environmental Status</h2>
              <span className="module-readout live">SIMULATED</span>
            </div>
            <table className="env-table" aria-label="층별 온습도">
              <thead>
                <tr>
                  <th scope="col">Floor</th>
                  <th scope="col">Temp.</th>
                  <th scope="col">Humidity</th>
                  <th scope="col">Load</th>
                </tr>
              </thead>
              <tbody id="env-body"></tbody>
            </table>
          </section>

          <section
            className="infra-section"
            data-infra-panel="power"
            aria-labelledby="infra-power-heading"
          >
            <div className="sub-title infra-title">
              <h2 id="infra-power-heading">Power Infrastructure</h2>
              <span
                className="module-readout infra-state"
                id="infra-power-state"
                aria-live="polite"
              >
                NORMAL
              </span>
            </div>
            <div className="infra-card">
              <button
                type="button"
                className="infra-jump"
                data-infra-focus="power"
                title="전력 설비동 3D 위치로 이동"
              >
                <span>전력 설비동</span>
                <small>UPS · BATTERY · SWITCHGEAR</small>
                <b aria-hidden="true">›</b>
              </button>
              <div className="infra-metrics">
                <div>
                  <small>UPS A / B</small>
                  <strong id="infra-ups-status">정상 / 정상</strong>
                </div>
                <div>
                  <small>배터리 잔량</small>
                  <strong id="infra-battery">
                    96<em>%</em>
                  </strong>
                </div>
                <div>
                  <small>전력 부하</small>
                  <strong id="infra-power-load">
                    68<em>%</em>
                  </strong>
                </div>
              </div>
              <div className="infra-progress">
                <span>UPS 부하율</span>
                <div className="infra-track">
                  <i id="infra-power-bar" style={{ width: '68%' }}></i>
                </div>
                <b id="infra-power-pct">68%</b>
              </div>
              <div className="infra-equipment-row" aria-label="전력 주요 장비">
                <button type="button" data-infra-asset="UPS-01">
                  <i id="infra-led-ups"></i>UPS-01
                </button>
                <button type="button" data-infra-asset="BAT-01">
                  <i id="infra-led-bat"></i>BAT-01
                </button>
                <button type="button" data-infra-asset="ATS-01">
                  <i id="infra-led-ats"></i>ATS-01
                </button>
              </div>
            </div>
          </section>

          <section
            className="infra-section"
            data-infra-panel="cooling"
            aria-labelledby="infra-cooling-heading"
          >
            <div className="sub-title infra-title">
              <h2 id="infra-cooling-heading">Cooling Infrastructure</h2>
              <span
                className="module-readout infra-state"
                id="infra-cooling-state"
                aria-live="polite"
              >
                NORMAL
              </span>
            </div>
            <div className="infra-card">
              <button
                type="button"
                className="infra-jump"
                data-infra-focus="cooling"
                title="냉각 설비동 3D 위치로 이동"
              >
                <span>냉각 설비동</span>
                <small>CHILLER · PUMP · CDU</small>
                <b aria-hidden="true">›</b>
              </button>
              <div className="infra-metrics">
                <div>
                  <small>냉수 출수 온도</small>
                  <strong id="infra-supply-temp">
                    18.2<em>°C</em>
                  </strong>
                </div>
                <div>
                  <small>CDU 유량</small>
                  <strong id="infra-cdu-flow">
                    148<em>L/min</em>
                  </strong>
                </div>
                <div>
                  <small>냉각 부하</small>
                  <strong id="infra-cooling-load">
                    61<em>%</em>
                  </strong>
                </div>
              </div>
              <div className="infra-progress cooling">
                <span>냉각 부하율</span>
                <div className="infra-track">
                  <i id="infra-cooling-bar" style={{ width: '61%' }}></i>
                </div>
                <b id="infra-cooling-pct">61%</b>
              </div>
              <div className="infra-equipment-row" aria-label="냉각 주요 장비">
                <button type="button" data-infra-asset="CH-01">
                  <i id="infra-led-ch"></i>CH-01
                </button>
                <button type="button" data-infra-asset="PUMP-01">
                  <i id="infra-led-pump"></i>PUMP-01
                </button>
                <button type="button" data-infra-asset="CDU-01">
                  <i id="infra-led-cdu"></i>CDU-01
                </button>
              </div>
            </div>
          </section>

          <section aria-labelledby="equipment-heading">
            <div className="sub-title">
              <h2 id="equipment-heading">Selected Equipment</h2>
              <span className="module-readout" id="device-id-short">
                ALL
              </span>
            </div>
            <div className="selected-card">
              <div className="device-head">
                <div className="device-context">
                  <span className="device-kicker" id="device-kicker">
                    BUILDING OVERVIEW
                  </span>
                  <span className="status-tag state-tag" id="device-state">
                    ● NORMAL
                  </span>
                </div>
                <h3 id="device-title">KNU AIDC Building 01</h3>
                <p id="device-location">Chuncheon Campus · Data Center</p>
              </div>
              <div className="device-grid" id="device-grid"></div>
              <button className="asset-detail-trigger" id="open-asset-modal" type="button" disabled>
                <span>설비를 선택하면 상세 보기</span>
                <span>↗</span>
              </button>
              <div className="trend">
                <h3>1H TREND</h3>
                <svg
                  viewBox="-3 0 266 55"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="최근 1시간 추세 그래프"
                >
                  <defs>
                    <linearGradient id="trend-fill" x2="0" y2="1">
                      <stop stopColor="#489cdb" stopOpacity=".35" />
                      <stop offset="1" stopColor="#489cdb" stopOpacity=".05" />
                    </linearGradient>
                  </defs>
                  <path
                    className="gridline"
                    d="M0 13.5H260M0 27.5H260M0 41.5H260M65 0V55M130 0V55M195 0V55"
                  />
                  <path
                    fill="url(#trend-fill)"
                    d="M0 43 L20 38 L40 41 L60 28 L80 31 L100 23 L120 27 L140 17 L160 22 L180 14 L200 21 L220 12 L240 17 L260 10 L260 55 L0 55Z"
                  />
                  <path
                    className="line"
                    d="M0 43 L20 38 L40 41 L60 28 L80 31 L100 23 L120 27 L140 17 L160 22 L180 14 L200 21 L220 12 L240 17 L260 10"
                  />
                  <circle cx="260" cy="10" r="2.5" fill="#d9f4ff" />
                </svg>
                <div className="trend-scale" aria-hidden="true">
                  <span>−60m</span>
                  <span>−30m</span>
                  <span>NOW</span>
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="alarm-heading">
            <div className="sub-title">
              <h2 id="alarm-heading">Alarm &amp; Event</h2>
              <span className="module-readout" id="alarm-count">
                00
              </span>
            </div>
            <ul className="alarm-list" id="alarm-list">
              <li className="alarm-item" data-level="warning">
                <span className="alarm-level" aria-hidden="true"></span>
                <div className="alarm-copy">
                  <b>GPU Zone B temperature rise</b>
                  <small>3F · Cold aisle sensor T-31</small>
                </div>
                <div className="alarm-meta">
                  <time className="alarm-time">11:42</time>
                  <span className="alarm-severity">WARNING</span>
                </div>
              </li>
              <li className="alarm-item" data-level="info">
                <span className="alarm-level" aria-hidden="true"></span>
                <div className="alarm-copy">
                  <b>UPS battery inspection due</b>
                  <small>1F · UPS-B maintenance</small>
                </div>
                <div className="alarm-meta">
                  <time className="alarm-time">10:18</time>
                  <span className="alarm-severity">INFO</span>
                </div>
              </li>
              <li className="alarm-item" data-level="resolved">
                <span className="alarm-level" aria-hidden="true"></span>
                <div className="alarm-copy">
                  <b>Cooling profile optimized</b>
                  <small>AI control sequence complete</small>
                </div>
                <div className="alarm-meta">
                  <time className="alarm-time">09:54</time>
                  <span className="alarm-severity">RESOLVED</span>
                </div>
              </li>
            </ul>
          </section>

          <details className="agent-quicklist" id="agent-quicklist">
            <summary>
              AI 운영 요원 <span id="agent-quick-count">07 / SIMULATED</span>
            </summary>
            <div className="agent-shortcuts" id="agent-shortcuts" aria-label="AI 담당자 선택"></div>
            <div className="agent-human-loading" id="agent-human-loading" aria-live="polite">
              실사형 인체 모델을 불러오는 중…
            </div>
          </details>
          <section className="extras-section" aria-label="설비 상세와 장애 시뮬레이션">
            <div className="sub-title">
              <h2>Operations &amp; Simulation</h2>
              <span className="module-readout">DEMO</span>
            </div>
            <div className="panel-tabs" role="tablist" aria-label="운영 상세 정보">
              <button
                type="button"
                id="tab-asset"
                data-inspector-tab="asset"
                className="active"
                aria-selected="true"
                role="tab"
              >
                설비 상세
              </button>
              <button
                type="button"
                id="tab-scenario"
                data-inspector-tab="scenario"
                aria-selected="false"
                role="tab"
              >
                장애 시뮬레이션 <b id="scenario-count">0</b>
              </button>
            </div>
            <details id="v9-panel-details" className="v9-panel-details">
              <summary id="v9-detail-toggle">운영 상세 펼치기</summary>
              <div id="detail-view" role="tabpanel"></div>
              <div id="scenario-view" role="tabpanel" hidden></div>
              <div className="inspection-tip" hidden>
                <span className="tip-title">조작 안내</span>
                <p>
                  설비를 선택하면 상세 데이터가 표시됩니다. 장애 시뮬레이션에서는 이벤트를 실행하고
                  복구 단계를 진행할 수 있습니다.
                </p>
              </div>
              <div className="v9-sim-actions">
                <button id="btn-alarm" type="button">
                  선택 시나리오 실행
                </button>
                <button id="btn-reset" type="button">
                  전체 초기화
                </button>
              </div>
            </details>
          </section>
        </div>
      </aside>
      <div className="scene-caption">
        <b id="view-title">데이터센터 전체 시설</b>
        <span id="view-subtitle">4개 층의 메인 건물과 2개 지원 시설</span>
      </div>
      <div id="incident-overlay" className="incident-overlay" aria-live="polite"></div>
      <div className="center-status">
        <div className="control-dock" role="toolbar" aria-label="데이터센터 3D 관제 도구">
          <span className="dock-hint">
            <b>Mouse</b> Rotate / Zoom
          </span>
          <button type="button" className="dock-button" id="btn-fit" title="전체 시설 보기">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 10.5 12 3l9 7.5V21H6v-8h12v8" />
            </svg>
            <span>전체 시설</span>
          </button>
          <span className="dock-divider"></span>
          <button
            type="button"
            className="dock-button active"
            data-mode="normal"
            title="일반 시각화"
          >
            일반
          </button>
          <button type="button" className="dock-button" data-mode="thermal" title="온도 분포 보기">
            온도
          </button>
          <button
            type="button"
            className="dock-button"
            data-mode="power"
            title="전력 A/B 계통을 켜거나 끕니다"
            aria-label="전력 계통"
            aria-pressed="false"
          >
            전력 OFF
          </button>
          <button
            type="button"
            className="dock-button"
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
            className="dock-button dock-agent active"
            id="btn-agent-visibility"
            title="AI 운영 요원 표시 / 숨기기"
            aria-pressed="true"
          >
            요원 ON
          </button>
          <span className="dock-divider"></span>
          <button type="button" className="dock-button" id="btn-auto" title="자동 회전">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M20 7V3m0 0h-4m4 0-3 3a8 8 0 1 0 2 8" />
            </svg>
            <span>자동 회전</span>
          </button>
          <button type="button" className="dock-button" id="btn-view-reset" title="시점 초기화">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 12a8 8 0 1 0 3-6.2L4 8m0-5v5h5" />
            </svg>
            <span>시점 초기화</span>
          </button>
          <button type="button" className="dock-button dock-zoom" id="btn-zoom-in" title="확대">
            ＋
          </button>
          <button type="button" className="dock-button dock-zoom" id="btn-zoom-out" title="축소">
            －
          </button>
        </div>
      </div>
      <div className="v9-hud-status">
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

      <div
        className="asset-modal"
        id="asset-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-modal-title"
        hidden
      >
        <div className="asset-modal-backdrop" data-asset-modal-close></div>
        <div className="asset-modal-window">
          <div className="asset-modal-top">
            <div>
              <div className="asset-modal-sub">KNU AIDC / EQUIPMENT INSPECTION · SIMULATION</div>
              <h2 id="asset-modal-title">설비 상세</h2>
            </div>
            <div className="asset-modal-actions">
              <span className="asset-modal-label" id="asset-modal-status">
                정상
              </span>
              <button
                type="button"
                className="asset-modal-close"
                id="asset-modal-close"
                data-asset-modal-close
                aria-label="상세 모달 닫기"
              >
                ×
              </button>
            </div>
          </div>
          <div className="asset-modal-body">
            <section className="asset-modal-card asset-model-pane" aria-label="선택 설비 3D 모델">
              <div className="asset-pane-heading">
                <span id="asset-modal-device-id">EQUIPMENT</span>
                <small>INTERACTIVE 3D</small>
              </div>
              <div className="asset-modal-stage" id="asset-modal-stage">
                <canvas
                  id="asset-preview-canvas"
                  tabIndex="0"
                  aria-label="설비 3D 모델. 드래그로 회전, 휠로 확대. 랙은 더블클릭으로 도어와 서랍 개폐"
                ></canvas>
                <div className="asset-modal-view-note" id="asset-modal-view-note">
                  드래그로 회전 · 휠로 확대 · 랙 더블클릭으로 도어·서랍 개폐
                </div>
              </div>
              <div className="asset-modal-meta">
                <h3 id="asset-modal-name">설비 이름</h3>
                <p id="asset-modal-summary">설비 설명</p>
                <div className="asset-meta-grid">
                  <span>설치 위치</span>
                  <strong id="asset-modal-location">-</strong>
                  <span>설비 유형</span>
                  <strong id="asset-modal-type">-</strong>
                </div>
                <button
                  type="button"
                  id="asset-modal-door"
                  className="asset-modal-open-door"
                  hidden
                >
                  도어 열기
                </button>
              </div>
            </section>
            <div
              className="agent-modal-report"
              id="agent-modal-report"
              hidden
              aria-label="AI 에이전트 운영 정보"
            >
              <div className="asset-modal-card agent-modal-header">
                <div className="agent-modal-kicker">DIGITAL TWIN / AI OPERATIONS</div>
                <h3 id="agent-modal-role">운영 에이전트</h3>
                <p id="agent-modal-description"></p>
                <div className="agent-status-line">
                  <span>현재 업무 상태</span>
                  <b id="agent-modal-status">정상 감시</b>
                </div>
              </div>
              <div className="agent-modal-grid">
                <div className="asset-modal-card agent-modal-tile">
                  <small>담당 구역</small>
                  <strong id="agent-modal-area">-</strong>
                </div>
                <div className="asset-modal-card agent-modal-tile">
                  <small>연관 경보</small>
                  <strong id="agent-modal-alert-count">0건</strong>
                </div>
              </div>
              <div className="asset-modal-card agent-modal-section">
                <h4>담당 감시 설비</h4>
                <div id="agent-modal-devices" className="agent-modal-device-list"></div>
              </div>
              <div className="asset-modal-card agent-modal-section">
                <h4>현재 점검 및 이벤트 · 모의 상태</h4>
                <div id="agent-modal-events"></div>
              </div>
            </div>
            <div className="asset-modal-report" id="equipment-modal-report">
              <div className="asset-modal-metrics">
                <div className="asset-modal-card asset-signal-card">
                  <span className="asset-signal-title">운영 상태</span>
                  <div className="asset-signal-value" id="asset-modal-state">
                    정상
                  </div>
                  <small className="signal-foot">설비 상태 / 장애 시뮬레이션 연동</small>
                </div>
                <div className="asset-modal-card asset-signal-card">
                  <span className="asset-signal-title">장비 온도</span>
                  <div className="asset-signal-value" id="asset-modal-temp">
                    —
                  </div>
                  <small className="signal-foot">모의 온도 센서</small>
                </div>
                <div className="asset-modal-card asset-signal-card">
                  <span className="asset-signal-title">소비 전력</span>
                  <div className="asset-signal-value" id="asset-modal-power">
                    —
                  </div>
                  <small className="signal-foot">모의 전력 지표</small>
                </div>
                <div className="asset-modal-card asset-signal-card">
                  <span className="asset-signal-title">가동률 / 부하</span>
                  <div className="asset-signal-value" id="asset-modal-util">
                    —
                  </div>
                  <div className="asset-mini-meter">
                    <i id="asset-modal-util-bar" style={{ width: '0%' }}></i>
                  </div>
                </div>
              </div>
              <div className="asset-modal-panels">
                <section className="asset-modal-card asset-chart-card">
                  <div className="asset-chart-title">
                    <strong>온도 변화 추세</strong>
                    <small>모의 추세 · 최근 60분</small>
                  </div>
                  <svg
                    id="asset-modal-temp-chart"
                    className="asset-modal-chart"
                    viewBox="0 0 350 175"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="온도 변화 모의 그래프"
                  ></svg>
                </section>
                <section className="asset-modal-card asset-chart-card">
                  <div className="asset-chart-title">
                    <strong>소비 전력 추세</strong>
                    <small>모의 추세 · 최근 60분</small>
                  </div>
                  <svg
                    id="asset-modal-power-chart"
                    className="asset-modal-chart"
                    viewBox="0 0 350 175"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="소비 전력 변화 모의 그래프"
                  ></svg>
                </section>
                <section className="asset-modal-card asset-modal-note">
                  <h3>설비 점검 · 관련 이벤트</h3>
                  <div id="asset-modal-events"></div>
                </section>
              </div>
            </div>
          </div>
          <div className="asset-modal-footer">
            <span>본 상세 화면의 수치·추세·이벤트는 실제 센서 연결이 아닌 데모 데이터입니다.</span>
            <button type="button" data-asset-modal-close>
              닫기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
