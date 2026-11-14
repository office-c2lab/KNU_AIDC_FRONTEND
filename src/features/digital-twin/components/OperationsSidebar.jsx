import { ArrowUpRight, Circle } from 'lucide-react';
import { instrumentCard, moduleReadout, panelBase, panelScroll, subTitle } from './uiStyles.js';

export default function OperationsSidebar() {
  return (
    <>
      <aside
        className={`${panelBase} right-panel right-[26px]`}
        aria-label="시설 상세 및 운영 안내"
      >
        <div className={panelScroll}>
          <section aria-labelledby="equipment-heading">
            <div className={subTitle}>
              <h2 id="equipment-heading">선택 대상 상세</h2>
              <span className={moduleReadout} id="device-id-short">
                —
              </span>
            </div>
            <div className={`${instrumentCard} selected-card`}>
              <div className="device-head">
                <div className="device-context">
                  <span className="device-kicker" id="device-kicker">
                    대상 선택
                  </span>
                  <span className="status-tag state-tag" id="device-state" hidden>
                    <Circle size={10} aria-hidden="true" /> 정상
                  </span>
                </div>
                <h3 id="device-title">층 또는 설비를 선택하세요</h3>
                <p id="device-location">왼쪽 시설 목록이나 3D 모델에서 선택할 수 있습니다.</p>
              </div>
              <div className="device-grid" id="device-grid"></div>
              <button className="asset-detail-trigger" id="open-asset-modal" type="button" disabled>
                <span>설비를 선택하면 상세 보기</span>
                <span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </span>
              </button>
            </div>
          </section>
          <section
            className="infra-section"
            data-infra-panel="power"
            aria-labelledby="infra-power-heading"
            hidden
          >
            <div className="sub-title infra-title">
              <h2 id="infra-power-heading">전력 설비 상세</h2>
              <span
                className="module-readout infra-state"
                id="infra-power-state"
                aria-live="polite"
              >
                정상
              </span>
            </div>
            <div className="infra-card">
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
            hidden
          >
            <div className="sub-title infra-title">
              <h2 id="infra-cooling-heading">냉각 설비 상세</h2>
              <span
                className="module-readout infra-state"
                id="infra-cooling-state"
                aria-live="polite"
              >
                정상
              </span>
            </div>
            <div className="infra-card">
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

          <div hidden aria-hidden="true">
            <span id="scenario-count"></span>
            <div id="detail-view"></div>
            <div id="scenario-view"></div>
          </div>
        </div>
      </aside>
    </>
  );
}
