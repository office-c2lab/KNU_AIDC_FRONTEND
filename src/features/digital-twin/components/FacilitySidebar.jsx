import {
  floorButton,
  floorList,
  floorNumber,
  healthStatus,
  instrumentCard,
  moduleReadout,
  panelBase,
  panelScroll,
  subTitle,
} from './uiStyles.js';

export default function FacilitySidebar() {
  return (
    <>
      <aside className={`${panelBase} left-panel left-[26px]`} aria-label="시설 현황 및 층 탐색">
        <div className={panelScroll}>
          <section className="facility-section" aria-labelledby="facility-heading">
            <div className={subTitle}>
              <h2 id="facility-heading">전력 사용 효율</h2>
              
            </div>
           
            <div className={`${instrumentCard} pue-card`}>
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
                <span className="status-tag stable">효율 양호</span>
                <span className="pue-guidance">1.0에 가까울수록 효율적</span>
              </div>
            </div>
          </section>

          <section className="power-section" aria-labelledby="power-heading">
            <div className={subTitle}>
              <h2 id="power-heading">전력 사용 현황</h2>
              <span className={moduleReadout}>
                <span className="power-total-label">총 전력</span>
                <strong>5.84</strong>
                <span className="unit">MW</span>
              </span>
            </div>
            <div className={`${instrumentCard} power-list`}>
              <div className="power-row">
                <span>IT 부하</span>
                <div className="bar blue" style={{ '--load': '63.7%' }} aria-hidden="true">
                  <div className="bar-track">
                    <i></i>
                  </div>
                </div>
                <b>3.72</b>
              </div>
              <div className="power-row">
                <span>냉각 부하</span>
                <div className="bar" style={{ '--load': '20.7%' }} aria-hidden="true">
                  <div className="bar-track">
                    <i></i>
                  </div>
                </div>
                <b>1.21</b>
              </div>
              <div className="power-row">
                <span>전력 설비</span>
                <div className="bar amber" style={{ '--load': '11.6%' }} aria-hidden="true">
                  <div className="bar-track">
                    <i></i>
                  </div>
                </div>
                <b>0.68</b>
              </div>
              <div className="power-row">
                <span>기타·예비</span>
                <div className="bar" style={{ '--load': '3.9%' }} aria-hidden="true">
                  <div className="bar-track">
                    <i></i>
                  </div>
                </div>
                <b>0.23</b>
              </div>
            </div>
          </section>

          <section aria-labelledby="floor-heading">
            <div className={subTitle}>
              <h2 id="floor-heading">층별 현황</h2>
              
            </div>
            <div className={floorList} id="floor-list">
              <button type="button" className={floorButton} data-floor="4F">
                <span className={floorNumber}>4F</span>
                <span className="floor-copy">
                  <strong>통합 관제층</strong>
                  <small id="summary-4F">22.4°C · 습도 47.5% · 부하 38%</small>
                </span>
                <span className={healthStatus} id="health-4F">
                  정상
                </span>
              </button>
              <button type="button" className={floorButton} data-floor="3F">
                <span className={floorNumber}>3F</span>
                <span className="floor-copy">
                  <strong>AI / GPU 전산층</strong>
                  <small id="summary-3F">24.6°C · 습도 44.1% · 부하 86%</small>
                </span>
                <span className={healthStatus} id="health-3F">
                  정상
                </span>
              </button>
              <button type="button" className={floorButton} data-floor="2F">
                <span className={floorNumber}>2F</span>
                <span className="floor-copy">
                  <strong>일반 서버 전산층</strong>
                  <small id="summary-2F">23.1°C · 습도 46.8% · 부하 71%</small>
                </span>
                <span className={healthStatus} id="health-2F">
                  정상
                </span>
              </button>
              <button type="button" className={floorButton} data-floor="1F">
                <span className={floorNumber}>1F</span>
                <span className="floor-copy">
                  <strong>보안·통신·장비 반입</strong>
                  <small id="summary-1F">22.8°C · 습도 48.2% · 부하 64%</small>
                </span>
                <span className={healthStatus} id="health-1F">
                  정상
                </span>
              </button>
            </div>
          </section>
          <section className="support-section" aria-labelledby="support-heading">
            <div className={subTitle}>
              <h2 id="support-heading">지원 시설</h2>
              
            </div>
            <div className="floor-list facility-support" aria-label="전력·냉각 외부 지원 시설">
              <button type="button" className={floorButton} data-zone="power" aria-pressed="false">
                <span className={floorNumber}>P</span>
                <span className="floor-copy">
                  <strong>전력 설비동</strong>
                  <small id="summary-power">부하 68% · 배터리 96%</small>
                </span>
                <span className={healthStatus} id="health-power">
                  정상
                </span>
              </button>
              <button
                type="button"
                className={floorButton}
                data-zone="cooling"
                aria-pressed="false"
              >
                <span className={floorNumber}>C</span>
                <span className="floor-copy">
                  <strong>냉각 설비동</strong>
                  <small id="summary-cooling">출수 18.2°C · 부하 61%</small>
                </span>
                <span className={healthStatus} id="health-cooling">
                  정상
                </span>
              </button>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
