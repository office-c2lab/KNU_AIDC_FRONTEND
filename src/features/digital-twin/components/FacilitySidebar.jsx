import { ChevronDown } from 'lucide-react';
import {
  floorButton,
  floorList,
  floorNumber,
  healthStatus,
  panelBase,
  panelScroll,
  subTitle,
} from './uiStyles.js';

export default function FacilitySidebar() {
  return (
    <>
      <aside className={`${panelBase} left-panel left-[26px]`} aria-label="시설 현황 및 층 탐색">
        <div className={panelScroll}>
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
        </div>
      </aside>
    </>
  );
}
