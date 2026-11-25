import { uiClass } from '../../../styles/interfaceStyles.js';
import { Activity, Building2, Snowflake, Zap } from 'lucide-react';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore.js';
import { SCENARIOS } from '../scene/config/scenarioConfig.js';

const scenarioById = new Map(SCENARIOS.map(scenario => [scenario.id, scenario]));

const rail =
  'flex flex-none flex-col gap-[8px] p-[7px] rounded-[7px] border border-[#557aa4a6] bg-[#0b192ee8] shadow-[0_10px_30px_#02081788] backdrop-blur-[12px]';
const railButton =
  'relative grid h-[46px] w-[46px] place-items-center rounded-[4px] border border-transparent bg-transparent text-[#aec8e5] transition-colors hover:border-[#527aa5] hover:bg-[#1b3858] hover:text-white [&.active]:border-[#75a9d9] [&.active]:bg-[#23517b] [&.active]:text-white [&_svg]:h-[18px] [&_svg]:w-[18px]';

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

function RailButton({ active = false, label, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      className={uiClass(`${railButton}${active ? ' active' : ''}`)}
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}

export default function CompactPanelControls({ openPanel, onPanelChange }) {
  const activeZone = useDigitalTwinStore(state => state.activeZone);
  const incidents = useDigitalTwinStore(state => state.incidents);
  const assets = useDigitalTwinStore(state => state.assetCatalog);
  const affectedAssets = incidents
    .map(incident => scenarioById.get(incident.id))
    .filter(Boolean)
    .map(scenario => assets.find(asset => asset.id === scenario.asset))
    .filter(Boolean);
  const togglePanel = panel => onPanelChange(openPanel === panel ? null : panel);

  return (
    <div
      className={uiClass(
        'fixed z-[19] top-[104px] bottom-[108px] left-[26px] flex flex-col items-start gap-[16px] overflow-y-auto [scrollbar-width:none]'
      )}
    >
      <div className={uiClass(rail)} role="toolbar" aria-label="시설 정보">
        <RailButton
          active={openPanel === 'efficiency'}
          label="시설 효율 현황"
          icon={Activity}
          onClick={() => togglePanel('efficiency')}
        />
        <RailButton
          active={openPanel === 'power'}
          label="전력 사용 현황"
          icon={Zap}
          onClick={() => togglePanel('power')}
        />
      </div>
      <div className={uiClass(rail)} role="toolbar" aria-label="층 및 외부 시설 선택">
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
            title={`${floor}층 선택`}
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
            title={label}
            aria-pressed={activeZone === zone}
            onClick={() => onPanelChange(null)}
          >
            <Icon aria-hidden="true" />
            <StatusDot fault={affectedAssets.some(asset => asset.zone === zone)} />
          </button>
        ))}
      </div>
    </div>
  );
}
