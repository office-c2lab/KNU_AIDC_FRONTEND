import { ArrowUpRight, ChevronDown, Circle } from 'lucide-react';
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

          <section aria-labelledby="alarm-heading">
            <div className={subTitle}>
              <h2 id="alarm-heading">알림 및 이벤트</h2>
              <span className={moduleReadout} id="alarm-count">
                00
              </span>
            </div>
            <ul className={`${instrumentCard} alarm-list`} id="alarm-list">
              <li className="alarm-item" data-level="warning">
                <span className="alarm-level" aria-hidden="true"></span>
                <div className="alarm-copy">
                  <b>GPU B구역 온도 상승</b>
                  <small>3층 · 냉기 통로 센서 T-31</small>
                </div>
                <div className="alarm-meta">
                  <time className="alarm-time">11:42</time>
                  <span className="alarm-severity">주의</span>
                </div>
              </li>
              <li className="alarm-item" data-level="info">
                <span className="alarm-level" aria-hidden="true"></span>
                <div className="alarm-copy">
                  <b>UPS 배터리 점검 예정</b>
                  <small>1층 · UPS-B 유지보수</small>
                </div>
                <div className="alarm-meta">
                  <time className="alarm-time">10:18</time>
                  <span className="alarm-severity">안내</span>
                </div>
              </li>
              <li className="alarm-item" data-level="resolved">
                <span className="alarm-level" aria-hidden="true"></span>
                <div className="alarm-copy">
                  <b>냉각 설정 최적화 완료</b>
                  <small>AI 제어 절차 완료</small>
                </div>
                <div className="alarm-meta">
                  <time className="alarm-time">09:54</time>
                  <span className="alarm-severity">해결</span>
                </div>
              </li>
            </ul>
          </section>

          <details className="agent-quicklist" id="agent-quicklist">
            <summary>
              <span className="agent-summary-copy">
                AI 운영 요원<small>시설 및 운영 정보 안내</small>
              </span>
              <span id="agent-quick-count">대기 중</span>
              <ChevronDown className="agent-expand-icon" size={14} aria-hidden="true" />
            </summary>
            <div className="agent-shortcuts" id="agent-shortcuts" aria-label="AI 담당자 선택"></div>
            <div className="agent-human-loading" id="agent-human-loading" hidden aria-live="polite">
              역할별 운영요원 모델을 구성하는 중…
            </div>
          </details>
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
