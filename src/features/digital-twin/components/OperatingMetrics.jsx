import { useDigitalTwinStore } from '../../../stores/digitalTwinStore.js';
import useAssetTelemetry from '../useAssetTelemetry.js';
import '../operating-metrics.css';

export default function OperatingMetrics({ data, compact = false }) {
  if (!data) return null;
  return (
    <div className={`operating-metrics${compact ? ' compact' : ''}`} aria-label="가상 운영 지표">
      <header>
        <h3>운영 지표</h3>
      </header>
      <div className="operating-metric-groups">
        {(compact ? data.groups.slice(0, 1) : data.groups).map(group => (
          <section key={group.title}>
            <h4>{group.title}</h4>
            <dl>
              {(compact ? group.metrics.slice(0, 3) : group.metrics).map(metric => (
                <div key={metric.key}>
                  <dt>{metric.label}</dt>
                  <dd>{metric.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}

export function AssetOperatingMetrics() {
  const detail = useDigitalTwinStore(state => state.assetDetail);
  return <OperatingMetrics data={detail?.operatingData} />;
}

export function SelectedOperatingMetrics() {
  const selectedId = useDigitalTwinStore(state => state.selectedId);
  const assets = useDigitalTwinStore(state => state.assetCatalog);
  const asset = assets.find(item => item.id === selectedId);
  const detail = useAssetTelemetry(asset);
  return <OperatingMetrics data={detail?.operatingData} compact />;
}
