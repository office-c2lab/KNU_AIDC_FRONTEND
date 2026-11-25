import { uiClass } from '../../../styles/interfaceStyles.js';
import { useMemo } from 'react';
import { Building2, ChevronDown, Snowflake, Zap } from 'lucide-react';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore.js';
import { SCENARIOS } from '../scene/config/scenarioConfig.js';
import { FLOOR_INFO, zones } from '../scene/config/facilityConfig.js';
import { panelSurface, panelTab } from './uiStyles.js';
import { calculateFacilityPower } from '../calculateFacilityPower.js';

const scenarioById = new Map(SCENARIOS.map(scenario => [scenario.id, scenario]));

const rail = `${panelSurface} flex flex-none flex-col gap-[8px] p-[7px] rounded-[7px]`;
const railButton = `${panelTab} relative grid h-[46px] w-[46px] flex-none place-items-center rounded-[4px] [&_svg]:h-[18px] [&_svg]:w-[18px]`;
const metricSurface = panelSurface;

function StatusDot({ fault }) {
  return (
    <span
      role="img"
      aria-label={fault ? '장애' : '정상'}
      className={uiClass(
        `absolute left-[5px] top-[5px] h-[5px] w-[5px] rounded-full ${fault ? 'bg-[#ff808b]' : 'bg-[#73e1c0]'}`
      )}
    />
  );
}

function MetricSummary({ label, value, unit, expanded, onClick, controls }) {
  return (
    <div className={uiClass(`${metricSurface} w-[280px] max-w-full rounded-full`)}>
      <button
        type="button"
        className={uiClass(
          `${panelTab} flex h-[42px] w-full items-center justify-between gap-[10px] rounded-full px-[14px]`
        )}
        aria-label={`${label} 상세`}
        aria-expanded={expanded}
        aria-controls={controls}
        onClick={onClick}
      >
        <span className={uiClass('text-[14px] whitespace-nowrap')}>{label}</span>
        <span className={uiClass('ml-auto flex items-baseline gap-[6px] whitespace-nowrap')}>
          <strong className={uiClass('text-[16px] font-semibold tabular-nums text-[#edf6ff]')}>
            {value}
          </strong>
          {unit && <span className={uiClass('text-[12px] text-[#a9bfd9]')}>{unit}</span>}
        </span>
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={uiClass(`flex-none transition-transform${expanded ? ' rotate-180' : ''}`)}
        />
      </button>
    </div>
  );
}

const powerTones = {
  it: '#83c7ff',
  cooling: '#70d4cb',
  power: '#edca79',
  other: '#8da9ba',
};
function PowerWidget({ power }) {
  return (
    <div
      id="compact-power-card"
      role="region"
      aria-label="소비 전력 분류별 상세, 단위 kW"
      className={uiClass(`${metricSurface} rounded-[8px]`)}
    >
      <div className={uiClass('px-[12px] py-[14px]')}>
        <div
          className={uiClass('relative flex h-[10px] rounded-[1px] bg-[#15283f]')}
          role="img"
          aria-label={power.rows.map(row => `${row.label} ${row.kw.toFixed(2)} kW`).join(', ')}
        >
          {power.rows.map(row => (
            <span
              key={row.id}
              className={uiClass('relative')}
              style={{
                width: `${row.share}%`,
                background: `linear-gradient(0deg, ${powerTones[row.id]}99, ${powerTones[row.id]})`,
                boxShadow: `0 0 7px ${powerTones[row.id]}33`,
              }}
            >
              {row.share > 0 && (
                <i
                  aria-hidden="true"
                  className={uiClass('absolute -top-px -bottom-px right-0 z-[1] w-px')}
                  style={{
                    background: powerTones[row.id],
                    boxShadow: `0 0 5px ${powerTones[row.id]}`,
                  }}
                />
              )}
            </span>
          ))}
          <span
            className={uiClass(
              'absolute inset-0 [background:repeating-linear-gradient(90deg,transparent_0_18px,#0a132899_18px_20px)]'
            )}
          />
        </div>
        <div className={uiClass('mt-[12px] flex flex-wrap gap-x-[14px] gap-y-[8px]')}>
          {power.rows.map(row => (
            <div
              key={row.id}
              className={uiClass('flex items-center gap-[5px] text-[12px] text-[#b8cce3]')}
            >
              <span
                className={uiClass('h-[6px] w-[6px] flex-none rounded-[1px]')}
                style={{
                  background: powerTones[row.id],
                  boxShadow: `0 0 5px ${powerTones[row.id]}99`,
                }}
              />
              <span>
                {{ it: 'IT 부하', cooling: '냉각', power: '전력', other: '기타' }[row.id]}
              </span>
              <strong className={uiClass('font-semibold tabular-nums text-[#edf6ff]')}>
                {row.kw.toFixed(2)}
              </strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CompactPanelControls({ openPanel, onPanelChange }) {
  const activeZone = useDigitalTwinStore(state => state.activeZone);
  const incidents = useDigitalTwinStore(state => state.incidents);
  const assets = useDigitalTwinStore(state => state.assetCatalog);
  const simulationTime = useDigitalTwinStore(state => state.simulationTime);
  const power = useMemo(
    () => calculateFacilityPower(assets, incidents, simulationTime),
    [assets, incidents, simulationTime]
  );
  const affectedAssets = incidents
    .map(incident => scenarioById.get(incident.id))
    .filter(Boolean)
    .map(scenario => assets.find(asset => asset.id === scenario.asset))
    .filter(Boolean);
  const togglePanel = panel => onPanelChange(openPanel === panel ? null : panel);

  return (
    <>
      <div
        className={uiClass(
          'fixed z-[19] top-[104px] left-[26px] flex w-[380px] max-w-[calc(100%_-_52px)] flex-col gap-[10px]'
        )}
        role="toolbar"
        aria-label="시설 정보"
      >
        <div
          className={uiClass(
            `${metricSurface} flex h-[42px] w-fit items-center gap-[12px] rounded-full px-[16px]`
          )}
          aria-label={`PUE ${power.pueEstimate === null ? '산출 불가' : power.pueEstimate.toFixed(2)}`}
        >
          <Zap
            size={16}
            aria-hidden="true"
            className={uiClass(
              'block flex-none text-[#8cddff] [filter:drop-shadow(0_0_5px_#27afff)]'
            )}
          />
          <span className={uiClass('flex items-center gap-[8px] whitespace-nowrap leading-none')}>
            <span className={uiClass('text-[13px] leading-none text-[#b8cce3]')}>PUE</span>
            <strong
              className={uiClass(
                'text-[16px] leading-none font-semibold tabular-nums text-[#edf6ff]'
              )}
            >
              {power.pueEstimate === null ? '—' : power.pueEstimate.toFixed(2)}
            </strong>
          </span>
        </div>
        <MetricSummary
          label="소비 전력"
          value={power.totalKw.toFixed(2)}
          unit="kW"
          expanded={openPanel === 'power'}
          onClick={() => togglePanel('power')}
          controls="compact-power-card"
        />
        {openPanel === 'power' && <PowerWidget power={power} />}
      </div>
      <div
        className={uiClass(
          `${rail} fixed z-[19] top-1/2 left-[26px] -translate-y-1/2 ${openPanel === 'power' ? 'max-h-[max(100px,calc(100%_-_580px))]' : 'max-h-[max(100px,calc(100%_-_480px))]'} overflow-y-auto [scrollbar-width:none]`
        )}
        role="toolbar"
        aria-label="층 및 외부 시설 선택"
      >
        <button
          type="button"
          className={uiClass(`${railButton}${activeZone === 'overview' ? ' active' : ''}`)}
          data-zone="overview"
          aria-label="전체 시설 보기"
          title="전체 시설 보기"
          aria-pressed={activeZone === 'overview'}
          onClick={() => onPanelChange(null)}
        >
          <Building2 aria-hidden="true" />
        </button>
        {[4, 3, 2, 1].map(floor => (
          <button
            key={floor}
            type="button"
            className={uiClass(`${railButton}${activeZone === `f${floor}` ? ' active' : ''}`)}
            data-zone={`f${floor}`}
            aria-label={`${floor}층 선택`}
            title={`${floor}F · ${FLOOR_INFO[`${floor}F`].name}`}
            aria-pressed={activeZone === `f${floor}`}
            onClick={() => onPanelChange(null)}
          >
            <span className={uiClass('text-[14px] font-semibold')}>{floor}F</span>
            <StatusDot fault={affectedAssets.some(asset => asset.floor === `${floor}F`)} />
          </button>
        ))}
        <div className={uiClass('mx-[6px] my-[7px] h-px bg-[#557aa452]')} />
        {[
          { zone: 'power', label: '전력 설비동 선택', icon: Zap },
          { zone: 'cooling', label: '냉각 설비동 선택', icon: Snowflake },
        ].map(({ zone, label, icon: Icon }) => (
          <button
            key={zone}
            type="button"
            className={uiClass(`${railButton}${activeZone === zone ? ' active' : ''}`)}
            data-zone={zone}
            aria-label={label}
            title={zones[zone].name}
            aria-pressed={activeZone === zone}
            onClick={() => onPanelChange(null)}
          >
            <Icon aria-hidden="true" />
            <StatusDot fault={affectedAssets.some(asset => asset.zone === zone)} />
          </button>
        ))}
      </div>
    </>
  );
}
