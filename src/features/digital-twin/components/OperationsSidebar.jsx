import {
  instrumentCard,
  moduleReadout,
  panelBase,
  panelScroll,
  sectionTitle,
  subTitle,
} from './uiStyles.js';

export default function OperationsSidebar() {
  return (
    <>
      <aside className={`${panelBase} right-panel right-[26px]`} aria-label="환경 및 설비 상태">
        <div className={panelScroll}>
          <section aria-labelledby="environment-heading">
            <div className={sectionTitle}>
              <h2 id="environment-heading">Environmental Status</h2>
              <span className="module-readout live">SIMULATED</span>
            </div>
            <table className={`${instrumentCard} env-table`} aria-label="층별 온습도">
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
            <div className={subTitle}>
              <h2 id="equipment-heading">Selected Equipment</h2>
              <span className={moduleReadout} id="device-id-short">
                ALL
              </span>
            </div>
            <div className={`${instrumentCard} selected-card`}>
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
            <div className={subTitle}>
              <h2 id="alarm-heading">Alarm &amp; Event</h2>
              <span className={moduleReadout} id="alarm-count">
                00
              </span>
            </div>
            <ul className={`${instrumentCard} alarm-list`} id="alarm-list">
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
              역할별 운영요원 모델을 구성하는 중…
            </div>
          </details>
          <section className="extras-section" aria-label="설비 상세와 장애 시뮬레이션">
            <div className={subTitle}>
              <h2>Operations &amp; Simulation</h2>
              <span className={moduleReadout}>DEMO</span>
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
    </>
  );
}
