import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const configuration = {
  temp: { label: '장비 온도', unit: '°C', color: '#79d6fb' },
  power: { label: '소비 전력', unit: 'kW', color: '#6ce0c2' },
};
const timeLabel = minute => (minute === 0 ? '현재' : `${Math.abs(minute)}분 전`);
const valueDomain = [
  min => Math.max(0, Math.floor((min - Math.max(0.1, Math.abs(min) * 0.01)) * 10) / 10),
  max => Math.ceil((max + Math.max(0.1, Math.abs(max) * 0.01)) * 10) / 10,
];

export default function AssetTrendChartView({ kind, detail }) {
  const gradientId = useId().replace(/:/g, '');
  if (!detail) return null;
  const { label, unit, color } = configuration[kind];

  return (
    <div
      className="asset-trend-chart"
      role="img"
      aria-label={`${detail.name} ${label} 최근 60분 추세. 현재 ${detail[kind].toFixed(1)} ${unit}`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={detail.trend} margin={{ top: 12, right: 14, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#41638a55" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="minute"
            type="number"
            domain={[-60, 0]}
            ticks={[-60, -30, 0]}
            tickFormatter={timeLabel}
            tick={{ fill: '#b8cce3', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis
            domain={valueDomain}
            tickCount={4}
            width={44}
            tickFormatter={value => value.toFixed(1)}
            tick={{ fill: '#b8cce3', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            labelFormatter={timeLabel}
            formatter={value => [`${Number(value).toFixed(1)} ${unit}`, label]}
            contentStyle={{
              background: '#10213a',
              border: '1px solid #5274a2',
              borderRadius: 4,
              fontSize: 11,
              color: '#edf5ff',
            }}
            labelStyle={{ color: '#b8cce3' }}
            cursor={{ stroke: '#8db7dc', strokeDasharray: '3 3' }}
          />
          <Area
            type="monotone"
            dataKey={kind}
            name={label}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
