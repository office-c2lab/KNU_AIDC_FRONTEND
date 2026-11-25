import {
  Battery,
  BatteryCharging,
  Bot,
  Box,
  Camera,
  ChevronRight,
  CircuitBoard,
  ClipboardList,
  Cpu,
  Database,
  DoorOpen,
  Droplets,
  Fan,
  Fuel,
  Gauge,
  Monitor,
  MonitorCog,
  Network,
  Package,
  PanelsTopLeft,
  Server,
  ShieldCheck,
  Siren,
  Snowflake,
  Waves,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore.js';
import useAssetTelemetry from '../useAssetTelemetry.js';
import { panelSurface, panelTab } from './uiStyles.js';
import './SelectedAssetPopup.css';

const equipmentIcons = {
  'SERVER RACK': Server,
  'GPU SERVER RACK': Cpu,
  'STORAGE RACK': Database,
  'NETWORK EQUIPMENT': Network,
  UPS: BatteryCharging,
  BATTERY: Battery,
  SWITCHGEAR: CircuitBoard,
  TRANSFORMER: Zap,
  'BACKUP GENERATOR': Fuel,
  'PRECISION AIR COOLING': Fan,
  'COOLANT DISTRIBUTION UNIT': Droplets,
  CHILLER: Snowflake,
  'COOLING PUMP': Gauge,
  'HEAT EXCHANGER': Waves,
  'CCTV CAMERA': Camera,
  'SECURITY ACCESS': DoorOpen,
  'SECURITY WORKSTATION': ShieldCheck,
  'NOC OPERATOR CONSOLE': MonitorCog,
  'SOC OPERATOR CONSOLE': ShieldCheck,
  'NOC FACILITY WALL': PanelsTopLeft,
  'NOC VIDEO WALL': PanelsTopLeft,
  'SOC SECURITY WALL': ShieldCheck,
  'SOC VIDEO WALL': PanelsTopLeft,
  'INCIDENT RESPONSE': Siren,
  'OPERATIONS SUPPORT': ClipboardList,
  'MAINTENANCE BENCH': Wrench,
  'ASSET STAGING': Box,
  'SPARE PARTS': Package,
  'AI AGENT': Bot,
};

export default function SelectedAssetPopup() {
  const selectedId = useDigitalTwinStore(state => state.selectedId);
  const assets = useDigitalTwinStore(state => state.assetCatalog);
  const asset = assets.find(item => item.id === selectedId);
  const EquipmentIcon = equipmentIcons[asset?.type] ?? Monitor;
  const data = useAssetTelemetry(asset);
  const values = data?.operatingData?.values ?? {};
  const cpu = values.cpuPercent ?? values.gpuPercent;
  const memory = values.memoryTotalGiB
    ? (values.memoryUsedGiB / values.memoryTotalGiB) * 100
    : values.vramTotalGiB
      ? (values.vramUsedGiB / values.vramTotalGiB) * 100
      : null;
  const metrics = [
    {
      label: cpu == null ? '장비 온도' : values.gpuPercent != null ? 'GPU 사용률' : 'CPU 사용률',
      value: cpu ?? data?.temp,
      unit: cpu == null ? '°C' : '%',
      percent: cpu,
    },
    {
      label: memory == null ? '부하율' : '메모리 사용률',
      value: memory ?? values.loadPercent,
      unit: '%',
      percent: memory ?? values.loadPercent,
    },
    { label: '소비 전력', value: data?.power, unit: 'kW' },
  ];
  const status = data?.status ?? '정상';
  const tone = status === '정상' ? '#54dda9' : status === '주의' ? '#edc879' : '#ff818b';
  return (
    <section
      id="selected-asset-popup"
      className={`${panelSurface} selected-asset-popup`}
      hidden={!asset}
      aria-label="선택 장비 요약"
      style={{ '--popup-tone': tone }}
    >
      <header>
        <EquipmentIcon size={24} aria-hidden="true" />
        <div className="selected-asset-copy">
          <h3>{asset?.name}</h3>
          <p>{asset?.id}</p>
        </div>
        <span className="selected-asset-status">
          <i />
          {status}
        </span>
        <button
          id="selected-asset-close"
          type="button"
          className={panelTab}
          aria-label="장비 선택 해제"
        >
          <X size={14} />
        </button>
      </header>
      <div className="selected-asset-metrics">
        {metrics.map(metric => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <strong>
              {Number.isFinite(metric.value)
                ? metric.value.toFixed(metric.unit === 'kW' ? 2 : 0)
                : '—'}
              <small>{metric.unit}</small>
            </strong>
            {Number.isFinite(metric.percent) && (
              <div className="selected-asset-track">
                <i style={{ width: `${Math.max(0, Math.min(100, metric.percent))}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        id="selected-asset-details"
        type="button"
        className={`${panelTab} selected-asset-details`}
      >
        상세 보기
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </section>
  );
}
