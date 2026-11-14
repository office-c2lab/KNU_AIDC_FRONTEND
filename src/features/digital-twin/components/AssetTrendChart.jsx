import { lazy, Suspense } from 'react';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore.js';

const AssetTrendChartView = lazy(() => import('./AssetTrendChartView.jsx'));

export default function AssetTrendChart({ kind }) {
  const detail = useDigitalTwinStore(state => state.assetDetail);
  if (!detail) return null;
  return (
    <Suspense
      fallback={
        <div className="asset-trend-chart chart-loading" role="status">
          그래프 준비 중…
        </div>
      }
    >
      <AssetTrendChartView key={detail.id} kind={kind} detail={detail} />
    </Suspense>
  );
}
