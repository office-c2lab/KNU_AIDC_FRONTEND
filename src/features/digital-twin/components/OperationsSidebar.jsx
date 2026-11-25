import { uiClass } from '../../../styles/interfaceStyles.js';
import { ArrowUpRight, Circle } from 'lucide-react';
import { SelectedOperatingMetrics } from './OperatingMetrics.jsx';
import { instrumentCard, moduleReadout, panelBase, panelScroll, subTitle } from './uiStyles.js';
export default function OperationsSidebar() {
  return (
    <>
      <aside
        className={uiClass(`${panelBase} right-panel right-[26px]`)}
        aria-label="시설 상세 및 운영 안내"
      >
        <div className={uiClass(panelScroll)}>
          <section aria-labelledby="equipment-heading">
            <div className={uiClass(subTitle)}>
              <h2 id="equipment-heading">선택 대상 상세</h2>
              <span className={uiClass(moduleReadout)} id="device-id-short">
                —
              </span>
            </div>
            <div className={uiClass(`${instrumentCard} selected-card`)}>
              <div className={uiClass('device-head')}>
                <div className={uiClass('device-context')}>
                  <span className={uiClass('device-kicker')} id="device-kicker">
                    대상 선택
                  </span>
                  <span className={uiClass('status-tag state-tag')} id="device-state" hidden>
                    <Circle size={10} aria-hidden="true" /> 정상
                  </span>
                </div>
                <h3 id="device-title">층 또는 설비를 선택하세요</h3>
                <p id="device-location">왼쪽 시설 목록이나 3D 모델에서 선택할 수 있습니다.</p>
              </div>
              <div className={uiClass('device-grid')} id="device-grid"></div>
              <SelectedOperatingMetrics />
              <button
                className={uiClass('asset-detail-trigger')}
                id="open-asset-modal"
                type="button"
                disabled
              >
                <span>설비를 선택하면 상세 보기</span>
                <span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </span>
              </button>
              <div
                className={uiClass('infra-section')}
                data-infra-panel="power"
                aria-label="전력 시설 지표"
                hidden
              >
                <div className={uiClass('infra-card')}>
                  <div className={uiClass('infra-metrics')}>
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
                  </div>
                  <div className={uiClass('infra-progress')}>
                    <span>UPS 부하율</span>
                    <div className={uiClass('infra-track')}>
                      <i id="infra-power-bar" className="w-[68%]"></i>
                    </div>
                    <b id="infra-power-pct">68%</b>
                  </div>
                </div>
              </div>

              <div
                className={uiClass('infra-section')}
                data-infra-panel="cooling"
                aria-label="냉각 시설 지표"
                hidden
              >
                <div className={uiClass('infra-card')}>
                  <div className={uiClass('infra-metrics')}>
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
                  </div>
                  <div className={uiClass('infra-progress cooling')}>
                    <span>냉각 부하율</span>
                    <div className={uiClass('infra-track')}>
                      <i id="infra-cooling-bar" className="w-[61%]"></i>
                    </div>
                    <b id="infra-cooling-pct">61%</b>
                  </div>
                </div>
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
