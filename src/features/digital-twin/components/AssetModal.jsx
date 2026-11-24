import { uiClass } from '../../../styles/interfaceStyles.js';
import { X } from 'lucide-react';
import AssetTrendChart from './AssetTrendChart.jsx';
import { AssetOperatingMetrics } from './OperatingMetrics.jsx';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore.js';
export default function AssetModal() {
  const detail = useDigitalTwinStore(state => state.assetDetail);
  const catalog = useDigitalTwinStore(state => state.assetCatalog);
  const openTerminal = useDigitalTwinStore(state => state.openRackTerminal);
  const rack = catalog.find(asset => asset.id === detail?.id);
  const hasConsole = ['SERVER RACK', 'GPU SERVER RACK'].includes(rack?.type);
  return (
    <>
      <div
        className={uiClass(
          'asset-modal fixed inset-0 z-[110] flex items-center justify-center text-[#e8f3ff]'
        )}
        id="asset-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-modal-title"
        hidden
      >
        <div
          className={uiClass(
            'asset-modal-backdrop absolute inset-0 bg-[#010817e3] backdrop-blur-[10px]'
          )}
          data-asset-modal-close
        ></div>
        <div
          className={uiClass(
            'asset-modal-window relative flex w-[min(1510px,100%)] flex-col overflow-hidden border border-[#507aaac7] bg-[#071126] shadow-[0_24px_90px_#000b,0_0_0_1px_#9bcaff18]'
          )}
        >
          <div
            className={uiClass(
              'asset-modal-top flex h-[70px] min-h-[70px] items-center justify-between gap-2.5 border-b border-[#466d9a7a] bg-[#132746] px-6'
            )}
          >
            <div>
              <div className={uiClass('asset-modal-sub')}>KNU AIDC / 설비 점검</div>
              <h2 id="asset-modal-title">설비 상세</h2>
            </div>
            <div className={uiClass('asset-modal-actions flex shrink-0 items-center gap-2.5')}>
              <span className={uiClass('asset-modal-label')} id="asset-modal-status">
                정상
              </span>
              <button
                type="button"
                className={uiClass(
                  'asset-modal-close grid h-8 w-8 place-items-center rounded-[2px] border border-[#46688c] bg-[#152c4b] text-2xl leading-none text-[#b6d8f8] hover:bg-[#315880] hover:text-white'
                )}
                id="asset-modal-close"
                data-asset-modal-close
                aria-label="상세 모달 닫기"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div
            className={uiClass(
              'asset-modal-body grid min-h-0 flex-1 grid-cols-[minmax(300px,36%)_minmax(0,1fr)] gap-2.5 overflow-hidden p-3'
            )}
          >
            <section
              className={uiClass('asset-modal-card asset-model-pane')}
              aria-label="선택 설비 3D 모델"
            >
              <div className={uiClass('asset-pane-heading')}>
                <span id="asset-modal-device-id">설비</span>
              </div>
              <div className={uiClass('asset-modal-stage')} id="asset-modal-stage">
                <canvas
                  id="asset-preview-canvas"
                  tabIndex="0"
                  aria-label="설비 3D 모델. 드래그로 회전, 휠로 확대. 랙은 더블클릭으로 도어와 KVM 콘솔 개폐. GPU와 서버 서랍은 각각 클릭하여 개폐"
                ></canvas>
                <div className={uiClass('asset-modal-view-note')} id="asset-modal-view-note">
                  드래그로 회전 · 휠로 확대 · 랙 더블클릭으로 도어·KVM 콘솔 개폐
                </div>
              </div>
              <div className={uiClass('asset-modal-meta')}>
                <h3 id="asset-modal-name">설비 이름</h3>
                <p id="asset-modal-summary">설비 설명</p>
                <div className={uiClass('asset-meta-grid')}>
                  <span>설치 위치</span>
                  <strong id="asset-modal-location">-</strong>
                  <span>설비 유형</span>
                  <strong id="asset-modal-type">-</strong>
                </div>
                <button
                  type="button"
                  id="asset-modal-door"
                  className={uiClass('asset-modal-open-door')}
                  hidden
                >
                  도어 열기
                </button>
                {hasConsole && (
                  <button
                    type="button"
                    className={uiClass('asset-modal-open-door')}
                    onClick={() => openTerminal(rack)}
                  >
                    터미널 열기
                  </button>
                )}
              </div>
            </section>
            <div
              className={uiClass('agent-modal-report')}
              id="agent-modal-report"
              hidden
              aria-label="AI 에이전트 운영 정보"
            >
              <div className={uiClass('asset-modal-card agent-modal-header')}>
                <div className={uiClass('agent-modal-kicker')}>디지털 트윈 / AI 운영</div>
                <h3 id="agent-modal-role">운영 에이전트</h3>
                <p id="agent-modal-description"></p>
                <div className={uiClass('agent-status-line')}>
                  <span>현재 업무 상태</span>
                  <b id="agent-modal-status">정상 감시</b>
                </div>
              </div>
              <div className={uiClass('agent-modal-grid')}>
                <div className={uiClass('asset-modal-card agent-modal-tile')}>
                  <small>담당 구역</small>
                  <strong id="agent-modal-area">-</strong>
                </div>
                <div className={uiClass('asset-modal-card agent-modal-tile')}>
                  <small>연관 경보</small>
                  <strong id="agent-modal-alert-count">0건</strong>
                </div>
              </div>
              <div className={uiClass('asset-modal-card agent-modal-section')}>
                <h4>담당 감시 설비</h4>
                <div id="agent-modal-devices" className={uiClass('agent-modal-device-list')}></div>
              </div>
              <div className={uiClass('asset-modal-card agent-modal-section')}>
                <h4>현재 점검 및 이벤트</h4>
                <div id="agent-modal-events"></div>
              </div>
            </div>
            <div className={uiClass('asset-modal-report')} id="equipment-modal-report">
              <div className={uiClass('asset-modal-metrics')}>
                <div className={uiClass('asset-modal-card asset-signal-card')}>
                  <span className={uiClass('asset-signal-title')}>운영 상태</span>
                  <div className={uiClass('asset-signal-value')} id="asset-modal-state">
                    정상
                  </div>
                  <small className={uiClass('signal-foot')}>설비 상태</small>
                </div>
                <div className={uiClass('asset-modal-card asset-signal-card')}>
                  <span className={uiClass('asset-signal-title')}>장비 온도</span>
                  <div className={uiClass('asset-signal-value')} id="asset-modal-temp">
                    —
                  </div>
                  <small className={uiClass('signal-foot')}>장비 온도</small>
                </div>
                <div className={uiClass('asset-modal-card asset-signal-card')}>
                  <span className={uiClass('asset-signal-title')}>소비 전력</span>
                  <div className={uiClass('asset-signal-value')} id="asset-modal-power">
                    —
                  </div>
                  <small className={uiClass('signal-foot')}>소비 전력</small>
                </div>
                <div className={uiClass('asset-modal-card asset-signal-card')}>
                  <span className={uiClass('asset-signal-title')}>가동률 / 부하</span>
                  <div className={uiClass('asset-signal-value')} id="asset-modal-util">
                    —
                  </div>
                  <div className={uiClass('asset-mini-meter')}>
                    <i id="asset-modal-util-bar" className="w-0"></i>
                  </div>
                </div>
              </div>
              <AssetOperatingMetrics />
              <div className={uiClass('asset-modal-panels')}>
                <section className={uiClass('asset-modal-card asset-chart-card')}>
                  <div className={uiClass('asset-chart-title')}>
                    <strong>온도 변화 추세</strong>
                    <small>최근 60분</small>
                  </div>
                  <AssetTrendChart kind="temp" />
                </section>
                <section className={uiClass('asset-modal-card asset-chart-card')}>
                  <div className={uiClass('asset-chart-title')}>
                    <strong>소비 전력 추세</strong>
                    <small>최근 60분</small>
                  </div>
                  <AssetTrendChart kind="power" />
                </section>
                <section className={uiClass('asset-modal-card asset-modal-note')}>
                  <h3>설비 점검 · 관련 이벤트</h3>
                  <div id="asset-modal-events"></div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
