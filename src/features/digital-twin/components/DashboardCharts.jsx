import { useDigitalTwinStore } from '../../../stores/digitalTwinStore.js';

export function PowerTotal() {
  const power = useDigitalTwinStore(state => state.energy.power);
  return (
    <>
      <strong>{power.reduce((sum, item) => sum + item.value, 0).toFixed(2)}</strong>
      <span className="unit">MW</span>
    </>
  );
}

export function PowerUsageChart() {
  const power = useDigitalTwinStore(state => state.energy.power);
  const total = power.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="power-list power-usage-chart">
      {power.map(item => (
        <div className="power-row" key={item.name}>
          <span>{item.name}</span>
          <LoadBar
            value={item.value}
            maximum={total || 1}
            label={item.name}
            unit="MW"
            color={item.color}
          />
          <b>{item.value.toFixed(2)}</b>
        </div>
      ))}
    </div>
  );
}

export function PueEfficiencyChart() {
  const pue = useDigitalTwinStore(state => state.energy.pue);
  const marker = Math.max(0, Math.min(100, (pue - 1) * 100));
  const good = pue <= 1.4;
  return (
    <div className="pue-scale-card">
      <div className="pue-scale-value">
        <strong aria-label={`PUE ${pue}`}>{pue.toFixed(2)}</strong>
        <span className={`status-tag stable${good ? '' : ' warning'}`}>
          {good ? '효율 양호' : '효율 확인'}
        </span>
      </div>
      <div
        className="pue-scale"
        role="meter"
        aria-label="전력 사용 효율 PUE"
        aria-valuemin={1}
        aria-valuemax={Math.max(2, pue)}
        aria-valuenow={pue}
        aria-valuetext={`${pue}, 1.0에 가까울수록 효율적`}
        style={{ '--pue-position': `${marker}%` }}
      >
        <div className="pue-scale-track" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span className="pue-scale-marker" aria-hidden="true"></span>
      </div>
      <div className="pue-scale-labels">
        <span>1.0 · 효율적</span>
        <span>2.0 · 비효율적</span>
      </div>
    </div>
  );
}

function LoadBar({ value, label, color = '#79c7e8', maximum = 100, unit = '%' }) {
  const percentage = Math.max(0, Math.min(100, (value / maximum) * 100));
  return (
    <div
      className="css-load-bar"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.max(maximum, value)}
      aria-valuenow={value}
      aria-valuetext={`${value} ${unit}`}
      title={`${label} ${value} ${unit}`}
      style={{ '--load-width': `${percentage}%`, '--load-color': color }}
    >
      <span aria-hidden="true"></span>
    </div>
  );
}

export function InfrastructureLoadChart({ type }) {
  const value = useDigitalTwinStore(state => state.infrastructureLoads[type]);
  return (
    <LoadBar
      value={value}
      label={type === 'power' ? 'UPS 부하율' : '냉각 부하율'}
      color={type === 'power' ? '#ceaf74' : '#79c7e8'}
    />
  );
}

export function AssetLoadChart() {
  const detail = useDigitalTwinStore(state => state.assetDetail);
  return detail ? <LoadBar value={detail.utilization} label="가동률" /> : null;
}
