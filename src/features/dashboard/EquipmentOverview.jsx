import { uiClass } from '../../styles/interfaceStyles.js';
import { lazy, Suspense, useState } from 'react';
import useAssetTelemetry from '../digital-twin/useAssetTelemetry.js';
import OperatingMetrics from '../digital-twin/components/OperatingMetrics.jsx';
import EquipmentModelPreview from './EquipmentModelPreview.jsx';
import EquipmentLocationPreview from './EquipmentLocationPreview.jsx';
const TrendChart = lazy(() => import('../digital-twin/components/AssetTrendChartView.jsx'));
export default function EquipmentOverview({ asset, stage }) {
  const [kind, setKind] = useState('temp');
  const [range, setRange] = useState(60);
  const [modelSource, setModelSource] = useState(null);
  const detail = useAssetTelemetry(asset);
  if (!detail) return <div className={uiClass('equipment-overview')}>설비를 선택하세요.</div>;
  const severity =
    detail.status === '정상' ? 'normal' : detail.status === '주의' ? 'warning' : 'fault';
  const metrics = [
    {
      label: '온도',
      value: `${detail.temp.toFixed(1)} °C`,
    },
    {
      label: '소비 전력',
      value: `${detail.power.toFixed(2)} kW`,
    },
    {
      label: '가동 부하',
      value: `${detail.operatingData.values.loadPercent.toFixed(1)}%`,
    },
    {
      label: '대응 단계',
      value: stage ?? '미실행',
    },
  ];
  return (
    <section className={uiClass('equipment-overview')} aria-label="선택 설비 현황">
      <header className={uiClass('equipment-overview-heading')}>
        <div className={uiClass('equipment-heading-name')}>
          <h2>{detail.id}</h2>
          <p>{detail.name.replace(detail.id, '').trim()}</p>
        </div>
        <span className={uiClass(`equipment-status ${severity}`)}>{detail.status}</span>
      </header>
      <p className={uiClass('equipment-description')}>{detail.summary}</p>
      <div className={uiClass('equipment-overview-body')}>
        <div className={uiClass('equipment-identity')} aria-label="설비 모델 및 주요 정보">
          <EquipmentModelPreview asset={detail} onLayout={setModelSource} />
          <dl className={uiClass('equipment-metric-list')}>
            {metrics.map(({ label, value }) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className={uiClass('equipment-readings')}>
          <div className={uiClass('equipment-trend')}>
            <div className={uiClass('equipment-trend-tools')}>
              <div role="group" aria-label="추이 지표 선택">
                <button
                  type="button"
                  aria-pressed={kind === 'temp'}
                  onClick={() => setKind('temp')}
                >
                  온도
                </button>
                <button
                  type="button"
                  aria-pressed={kind === 'power'}
                  onClick={() => setKind('power')}
                >
                  소비 전력
                </button>
              </div>
              <div role="group" aria-label="조회 기간">
                {[15, 30, 60].map(minutes => (
                  <button
                    key={minutes}
                    type="button"
                    aria-pressed={range === minutes}
                    onClick={() => setRange(minutes)}
                  >
                    {minutes === 60 ? '1시간' : `${minutes}분`}
                  </button>
                ))}
              </div>
            </div>
            <div className={uiClass('equipment-trend-heading')}>
              <h3>{kind === 'temp' ? '온도' : '소비 전력'} 추이</h3>
            </div>
            <Suspense fallback={<p className={uiClass('dashboard-empty')}>그래프 준비 중…</p>}>
              <TrendChart kind={kind} detail={detail} range={range} />
            </Suspense>
          </div>
        </div>
        <div className={uiClass('equipment-location')}>
          <div>
            <h3>설치 위치</h3>
            <strong>{detail.floor || (detail.zone === 'power' ? '전력' : '냉각')}</strong>
          </div>
          <EquipmentLocationPreview source={modelSource} asset={detail} />
        </div>
      </div>
      <OperatingMetrics data={detail.operatingData} />
    </section>
  );
}
