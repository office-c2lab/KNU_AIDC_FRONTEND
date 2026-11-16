import { lazy, Suspense, useMemo, useState } from 'react';
import {
  Activity,
  Cpu,
  Gauge,
  MapPin,
  Network,
  Server,
  ShieldCheck,
  Snowflake,
  Thermometer,
  Zap,
} from 'lucide-react';
import { SCENARIOS } from '../digital-twin/scene/config/scenarioConfig.js';
import { createIncidentSelectors } from '../digital-twin/scene/systems/createIncidentSelectors.js';
import { createAssetTrendData } from '../digital-twin/createAssetTrendData.js';
import './equipment-overview.css';
import EquipmentModelPreview from './EquipmentModelPreview.jsx';

const TrendChart = lazy(() => import('../digital-twin/components/AssetTrendChartView.jsx'));
const scenarioById = new Map(SCENARIOS.map(s => [s.id, s]));

function EquipmentIcon({ type = '', ...props }) {
  if (/COOL|CHILLER|HEAT/.test(type)) return <Snowflake {...props} />;
  if (/UPS|BATTERY|SWITCHGEAR|TRANSFORMER|GENERATOR/.test(type)) return <Zap {...props} />;
  if (/NETWORK/.test(type)) return <Network {...props} />;
  if (/SECURITY|CCTV/.test(type)) return <ShieldCheck {...props} />;
  return /GPU/.test(type) ? <Cpu {...props} /> : <Server {...props} />;
}

export default function EquipmentOverview({
  asset,
  incidents,
  facilityName,
  facilityAssets,
  stage,
}) {
  const [kind, setKind] = useState('temp');
  const detail = useMemo(() => {
    if (!asset) return null;
    const selectors = createIncidentSelectors({
      clock: { elapsedTime: 0 },
      activeIncidents: new Map(incidents.map(item => [item.id, item])),
      scenarioById,
    });
    const sensor = selectors.getSensor(asset);
    return {
      ...asset,
      ...sensor,
      status: selectors.getAssetStatus(asset),
      trend: createAssetTrendData(asset.id, sensor),
    };
  }, [asset, incidents]);
  if (!detail) return <div className="equipment-overview">설비를 선택하세요.</div>;
  const severity =
    detail.status === '정상' ? 'normal' : detail.status === '주의' ? 'warning' : 'fault';
  const metrics = [
    { label: '온도', value: `${detail.temp.toFixed(1)} °C`, Icon: Thermometer },
    { label: '소비 전력', value: `${detail.power.toFixed(2)} kW`, Icon: Zap },
    { label: '운영 용량', value: `${detail.capacity ?? 0}%`, Icon: Gauge },
    { label: '대응 단계', value: stage ?? '시나리오 미실행', Icon: Activity },
  ];
  const position = facilityAssets.findIndex(item => item.id === asset.id);
  return (
    <section className="equipment-overview" aria-label="선택 설비 현황">
      <header className="equipment-overview-heading">
        <div className="equipment-heading-icon">
          <EquipmentIcon type={detail.type} size={27} aria-hidden="true" />
        </div>
        <div className="equipment-heading-name">
          <h2>{detail.id}</h2>
          <p>{detail.name}</p>
        </div>
        <span className={`equipment-status ${severity}`}>{detail.status}</span>
        <div className="equipment-heading-meta">
          <span>
            <MapPin size={14} aria-hidden="true" />
            {detail.floor || '시설'} · {facilityName}
          </span>
          <span>
            <Server size={14} aria-hidden="true" />
            {detail.type}
          </span>
        </div>
      </header>
      <div className="equipment-overview-body">
        <EquipmentModelPreview asset={detail} />
        <div className="equipment-readings">
          <dl className="equipment-kpis">
            {metrics.map(({ label, value, Icon: MetricIcon }) => (
              <div key={label}>
                <MetricIcon size={24} aria-hidden="true" />
                <div>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              </div>
            ))}
          </dl>
          <div className="equipment-trend">
            <div className="equipment-trend-tools">
              <div role="group" aria-label="추이 지표 선택">
                <button
                  type="button"
                  aria-pressed={kind === 'temp'}
                  onClick={() => setKind('temp')}
                >
                  <Thermometer size={14} />
                  온도
                </button>
                <button
                  type="button"
                  aria-pressed={kind === 'power'}
                  onClick={() => setKind('power')}
                >
                  <Zap size={14} />
                  소비 전력
                </button>
              </div>
              <span>시뮬레이션 · 최근 1시간</span>
            </div>
            <Suspense fallback={<p className="dashboard-empty">그래프 준비 중…</p>}>
              <TrendChart kind={kind} detail={detail} />
            </Suspense>
          </div>
        </div>
        <div className="equipment-location">
          <div>
            <h3>설비 위치</h3>
            <strong>{detail.floor || (detail.zone === 'power' ? '전력' : '냉각')}</strong>
          </div>
          <svg
            viewBox="0 0 220 150"
            role="img"
            aria-label="선택 설비를 강조한 시설 개략도. 실제 배치와 다를 수 있습니다."
          >
            <path d="m16 92 92-67 98 48-91 66Z" fill="#223b53" stroke="#6a93af" />
            <path
              d="m16 92 99 47v8L16 100Zm99 47 91-66v8l-91 66Z"
              fill="#13293e"
              stroke="#3c5f79"
            />
            {facilityAssets.map((item, i) => {
              const x = 42 + (i % 6) * 18 + Math.floor(i / 6) * 9;
              const y = 83 - (i % 6) * 8 + Math.floor(i / 6) * 9;
              const selected = i === position;
              return (
                <g key={item.id}>
                  <path d={`m${x} ${y} 9-6 8 4-9 6Z`} fill={selected ? '#83b9ff' : '#7b99b2'} />
                  <path
                    d={`m${x} ${y} 8 4v-13l-8-4Zm8 4 9-6v-13l-9 6Z`}
                    fill={selected ? '#356895' : '#36536c'}
                  />
                  {selected && (
                    <circle
                      cx={x + 8}
                      cy={y - 23}
                      r="6"
                      fill="#83b9ff"
                      stroke="#dceefa"
                      strokeWidth="2"
                    />
                  )}
                </g>
              );
            })}
          </svg>
          <p>{detail.location}</p>
          <small>시설 개략도</small>
        </div>
      </div>
      <p className="equipment-overview-description">{detail.summary}</p>
    </section>
  );
}
