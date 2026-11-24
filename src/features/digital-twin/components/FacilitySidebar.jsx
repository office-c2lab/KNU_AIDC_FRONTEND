import { uiClass } from '../../../styles/interfaceStyles.js';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore.js';
import { panelEntrance } from '../../../utils/panelMotion.js';
import { calculateFacilityPower } from '../calculateFacilityPower.js';
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
export default function FacilitySidebar({ ready = true }) {
  const assets = useDigitalTwinStore(state => state.assetCatalog);
  const incidents = useDigitalTwinStore(state => state.incidents);
  const simulationTime = useDigitalTwinStore(state => state.simulationTime);
  const power = useMemo(
    () => calculateFacilityPower(assets, incidents, simulationTime),
    [assets, incidents, simulationTime]
  );
  const pue = power.pueEstimate;
  const pueMax = Math.max(2, Math.ceil(pue ?? 2));
  const pueText = pue === null ? '—' : pue.toFixed(2);
  return (
    <>
      <motion.aside
        {...panelEntrance({
          x: -28,
          y: 0,
          delay: 0.48,
          ready,
        })}
        className={uiClass(`${panelBase} will-change-[transform,opacity] left-panel left-[26px]`)}
        aria-label="시설 현황 및 층 탐색"
      >
        <div className={uiClass(panelScroll)}>
          <section className={uiClass('facility-section')} aria-labelledby="facility-heading">
            <div className={uiClass(subTitle)}>
              <h2 id="facility-heading">전력 사용 효율</h2>
            </div>
            <div className={uiClass(`${instrumentCard} pue-scale-card`)}>
              <div className={uiClass('pue-scale-value')}>
                <strong aria-label={`추정 PUE ${pueText}`}>{pueText}</strong>
                <span className={uiClass(moduleReadout)}>가상 추정 PUE</span>
              </div>
              {pue !== null ? (
                <>
                  <div
                    className={uiClass('pue-scale')}
                    role="meter"
                    aria-label="전력 사용 효율 PUE"
                    aria-valuemin={1}
                    aria-valuemax={pueMax}
                    aria-valuenow={Number(pueText)}
                    aria-valuetext={`${pueText}, 가상 소비 전력 기준 추정값. 낮을수록 효율적입니다.`}
                    style={{
                      '--pue-position': `${Math.min(100, Math.max(0, ((pue - 1) / (pueMax - 1)) * 100))}%`,
                    }}
                  >
                    <div className={uiClass('pue-scale-track')} aria-hidden="true">
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className={uiClass('pue-scale-marker')} aria-hidden="true"></span>
                  </div>
                  <div className={uiClass('pue-scale-labels')} aria-hidden="true">
                    <span>1.0 · 효율적</span>
                    <span>{pueMax.toFixed(1)} · 비효율적</span>
                  </div>
                </>
              ) : (
                <p className={uiClass('pue-scale-note')}>IT 부하가 없어 산출할 수 없습니다.</p>
              )}
              <p className={uiClass('pue-scale-note')}>총 소비 전력 ÷ IT 소비 전력 · 가상 데이터</p>
            </div>
          </section>

          <section className={uiClass('power-section')} aria-labelledby="power-heading">
            <div className={uiClass(subTitle)}>
              <h2 id="power-heading">전력 사용 현황</h2>
              <span className={uiClass(moduleReadout)}>
                <span className={uiClass('power-total-label')}>총 전력</span>
                <strong>{power.totalKw.toFixed(2)}</strong>
                <span className={uiClass('unit')}>kW</span>
              </span>
            </div>
            <div
              className={uiClass(`${instrumentCard} power-list`)}
              aria-label="분류별 소비 전력, 단위 kW"
            >
              {power.rows.map(row => (
                <div className={uiClass('power-row')} key={row.id}>
                  <span>{row.label}</span>
                  <div
                    className={uiClass(`bar ${row.tone}`)}
                    style={{
                      '--load': `${row.share}%`,
                    }}
                    aria-hidden="true"
                  >
                    <div className={uiClass('bar-track')}>
                      <i></i>
                    </div>
                  </div>
                  <b aria-label={`${row.kw.toFixed(2)} kW`}>{row.kw.toFixed(2)}</b>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="floor-heading">
            <div className={uiClass(subTitle)}>
              <h2 id="floor-heading">층별 현황</h2>
            </div>
            <div className={uiClass(floorList)} id="floor-list">
              <button type="button" className={uiClass(floorButton)} data-floor="4F">
                <span className={uiClass(floorNumber)}>4F</span>
                <span className={uiClass('floor-copy')}>
                  <strong>통합 관제층</strong>
                </span>
                <span className={uiClass(healthStatus)} id="health-4F">
                  정상
                </span>
              </button>
              <button type="button" className={uiClass(floorButton)} data-floor="3F">
                <span className={uiClass(floorNumber)}>3F</span>
                <span className={uiClass('floor-copy')}>
                  <strong>AI / GPU 전산층</strong>
                </span>
                <span className={uiClass(healthStatus)} id="health-3F">
                  정상
                </span>
              </button>
              <button type="button" className={uiClass(floorButton)} data-floor="2F">
                <span className={uiClass(floorNumber)}>2F</span>
                <span className={uiClass('floor-copy')}>
                  <strong>일반 서버 전산층</strong>
                </span>
                <span className={uiClass(healthStatus)} id="health-2F">
                  정상
                </span>
              </button>
              <button type="button" className={uiClass(floorButton)} data-floor="1F">
                <span className={uiClass(floorNumber)}>1F</span>
                <span className={uiClass('floor-copy')}>
                  <strong>보안·통신·장비 반입</strong>
                </span>
                <span className={uiClass(healthStatus)} id="health-1F">
                  정상
                </span>
              </button>
            </div>
          </section>
          <section className={uiClass('support-section')} aria-labelledby="support-heading">
            <div className={uiClass(subTitle)}>
              <h2 id="support-heading">지원 시설</h2>
            </div>
            <div
              className={uiClass('floor-list facility-support')}
              aria-label="전력·냉각 외부 지원 시설"
            >
              <button
                type="button"
                className={uiClass(floorButton)}
                data-zone="power"
                aria-pressed="false"
              >
                <span className={uiClass(floorNumber)}>P</span>
                <span className={uiClass('floor-copy')}>
                  <strong>전력 설비동</strong>
                </span>
                <span className={uiClass(healthStatus)} id="health-power">
                  정상
                </span>
              </button>
              <button
                type="button"
                className={uiClass(floorButton)}
                data-zone="cooling"
                aria-pressed="false"
              >
                <span className={uiClass(floorNumber)}>C</span>
                <span className={uiClass('floor-copy')}>
                  <strong>냉각 설비동</strong>
                </span>
                <span className={uiClass(healthStatus)} id="health-cooling">
                  정상
                </span>
              </button>
            </div>
          </section>
        </div>
      </motion.aside>
    </>
  );
}
