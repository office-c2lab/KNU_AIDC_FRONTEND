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
            <div className={`${instrumentCard} pue-scale-card`}>
              <div className="pue-scale-value">
                <strong aria-label="PUE 1.32">1.32</strong>
                <span className="status-tag stable">효율 양호</span>
              </div>
              <div
                className="pue-scale"
                role="meter"
                aria-label="전력 사용 효율 PUE"
                aria-valuemin={1}
                aria-valuemax={2}
                aria-valuenow={1.32}
                aria-valuetext="1.32, 효율 양호. 낮을수록 효율적입니다."
                style={{ '--pue-position': '32%' }}
              >
                <div className="pue-scale-track" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="pue-scale-marker" aria-hidden="true"></span>
              </div>
              <div className="pue-scale-labels" aria-hidden="true">
                <span>1.0 · 효율적</span>
                <span>2.0 · 비효율적</span>
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
                </span>
                <span className={healthStatus} id="health-4F">
                  정상
                </span>
              </button>
              <button type="button" className={floorButton} data-floor="3F">
                <span className={floorNumber}>3F</span>
                <span className="floor-copy">
                  <strong>AI / GPU 전산층</strong>
                </span>
                <span className={healthStatus} id="health-3F">
                  정상
                </span>
              </button>
              <button type="button" className={floorButton} data-floor="2F">
                <span className={floorNumber}>2F</span>
                <span className="floor-copy">
                  <strong>일반 서버 전산층</strong>
                </span>
                <span className={healthStatus} id="health-2F">
                  정상
                </span>
              </button>
              <button type="button" className={floorButton} data-floor="1F">
                <span className={floorNumber}>1F</span>
                <span className="floor-copy">
                  <strong>보안·통신·장비 반입</strong>
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
