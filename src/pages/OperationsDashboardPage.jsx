import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useDigitalTwinStore } from '../stores/digitalTwinStore.js';
import { createIncidentSelectors } from '../features/digital-twin/scene/systems/createIncidentSelectors.js';
import { calculateFacilityPower } from '../features/digital-twin/calculateFacilityPower.js';
import { SCENARIOS } from '../features/digital-twin/scene/config/scenarioConfig.js';
import DashboardPanel from '../features/dashboard/DashboardPanel.jsx';
import { applyDashboardTrendProfile } from '../features/dashboard/dashboardTrend.js';
import { createMockOperationLogs } from '../features/dashboard/mockOperationLogs.js';
import '../features/dashboard/operations-dashboard.css';

const scenarioById = new Map(SCENARIOS.map(item => [item.id, item]));
const colors = {
  CPU: '#9dd1ff',
  메모리: '#73e1c0',
  스토리지: '#eac476',
  GPU: '#73e1c0',
  'GPU 메모리': '#9dd1ff',
  수신: '#9dd1ff',
  송신: '#73e1c0',
};
const powerColors = ['#87bce9', '#73e1c0', '#eac476', '#9da9c9'];
const powerColorByLabel = Object.fromEntries(
  ['IT 부하', '냉각 부하', '전력 설비', '기타·지원'].map((label, index) => [
    label,
    powerColors[index],
  ])
);
const formatTime = value =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));
const formatLogTimestamp = value => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(value))
      .map(({ type, value: part }) => [type, part])
  );
  return `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};
const average = values => {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
};
const display = (value, digits = 1) => (Number.isFinite(value) ? value.toFixed(digits) : '—');
function ChartTooltip({ active, payload, label, unit = '%' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ops-chart-tooltip">
      <div className="ops-chart-tooltip-heading">
        {unit === 'kW' ? '전력 구성' : `${label} · 운영 추이`}
      </div>
      {payload
        .filter(item => Number.isFinite(item.value))
        .map((item, index) => (
          <div className="ops-chart-tooltip-row" key={item.dataKey ?? item.name}>
            <span>
              <i
                style={{
                  background:
                    colors[item.name] ?? powerColorByLabel[item.name] ?? powerColors[index],
                }}
              />
              {item.name}
            </span>
            <strong>
              {display(item.value)}
              <small>{unit}</small>
            </strong>
            {unit === 'kW' && <em>{display(item.payload.share)}%</em>}
          </div>
        ))}
    </div>
  );
}

function LatestPoint({ cx, cy, index, lastIndex, color }) {
  return index === lastIndex && Number.isFinite(cx) && Number.isFinite(cy) ? (
    <circle cx={cx} cy={cy} r={3} fill={color} stroke="#101e32" strokeWidth={1.5} />
  ) : (
    <g />
  );
}

function readAssets(assets, incidents, time) {
  const selectors = createIncidentSelectors({
    clock: { elapsedTime: time },
    activeIncidents: new Map(incidents.map(item => [item.id, item])),
    scenarioById,
  });
  return assets
    .filter(asset => asset.type !== 'AI AGENT')
    .map(asset => ({
      ...asset,
      status: selectors.getAssetStatus(asset),
      values: selectors.getOperatingData(asset).values,
    }));
}
function summarize(readings, time) {
  const cpu = readings.filter(item => item.type === 'SERVER RACK');
  const gpu = readings.filter(item => item.type === 'GPU SERVER RACK');
  const storage = readings.filter(item => item.type === 'STORAGE RACK');
  const network = readings.filter(item => item.type === 'NETWORK EQUIPMENT');
  return {
    time,
    CPU: average(cpu.map(item => item.values.cpuPercent)),
    메모리: average(
      cpu.map(item =>
        item.values.memoryTotalGiB > 0
          ? (item.values.memoryUsedGiB / item.values.memoryTotalGiB) * 100
          : null
      )
    ),
    스토리지: average(storage.map(item => item.values.storageUsedPercent)),
    GPU: average(gpu.map(item => item.values.gpuPercent)),
    'GPU 메모리': average(
      gpu.map(item =>
        item.values.vramTotalGiB > 0
          ? (item.values.vramUsedGiB / item.values.vramTotalGiB) * 100
          : null
      )
    ),
    수신: network.length
      ? network.reduce((sum, item) => sum + (item.values.receiveMbps ?? 0), 0) / 1000
      : null,
    송신: network.length
      ? network.reduce((sum, item) => sum + (item.values.transmitMbps ?? 0), 0) / 1000
      : null,
  };
}
function Axes({ percent = true, ticks }) {
  return (
    <>
      <CartesianGrid strokeDasharray="2 5" vertical={false} stroke="#58729355" />
      <XAxis
        dataKey="time"
        ticks={ticks}
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 13, fontWeight: 500, fill: '#bfd1e5' }}
        tickMargin={8}
        minTickGap={22}
      />
      <YAxis
        domain={percent ? [0, 100] : [0, 'auto']}
        ticks={percent ? [0, 25, 50, 75, 100] : undefined}
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 13, fontWeight: 500, fill: '#bfd1e5' }}
        tickFormatter={value => (percent ? `${value}%` : value)}
        width={48}
      />
      <Tooltip
        content={<ChartTooltip unit={percent ? '%' : 'Gbps'} />}
        cursor={{ stroke: '#bddbf4', strokeWidth: 1, strokeDasharray: '3 4', fill: '#87bce90b' }}
        wrapperStyle={{ outline: 'none', zIndex: 10 }}
      />
    </>
  );
}
function Legend({ keys, current, percent = true, showValues = true }) {
  return (
    <div className="ops-chart-legend">
      {keys.map(key => (
        <span key={key} data-series={key}>
          <i style={{ background: colors[key] }} />
          {key}
          {showValues && (
            <strong>
              {display(current[key])}
              {percent ? '%' : ' Gbps'}
            </strong>
          )}
        </span>
      ))}
    </div>
  );
}
function TrendChart({ data, keys, chartId, percent = true, label }) {
  return (
    <div className="ops-line-chart" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, right: 20, bottom: 2, left: 0 }}>
          <defs>
            {keys.map(key => (
              <linearGradient key={key} id={`${chartId}-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[key]} stopOpacity={0.25} />
                <stop offset="80%" stopColor={colors[key]} stopOpacity={0.04} />
                <stop offset="100%" stopColor={colors[key]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <Axes percent={percent} ticks={[data[0].time, data[6].time, data[12].time]} />
          {keys.map(key => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[key]}
              strokeWidth={key === keys[0] ? 2.6 : 1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={percent && key !== 'CPU' ? 'none' : `url(#${chartId}-${key})`}
              dot={<LatestPoint lastIndex={data.length - 1} color={colors[key]} />}
              activeDot={{ r: 4.5, stroke: '#e9f5ff', strokeWidth: 2, fill: colors[key] }}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
function Panel({ title, children, extra, className = '' }) {
  return (
    <DashboardPanel title={title} extra={extra} className={`ops-panel ${className}`}>
      {children}
    </DashboardPanel>
  );
}
function eventCategory(event, scenario, assets) {
  const asset = assets.find(item => item.id === scenario?.asset);
  if (asset?.zone === 'security' || /보안|출입/.test(scenario?.category ?? '')) return '보안';
  if (['power', 'cooling'].includes(asset?.zone) || /전력|냉각|UPS/.test(scenario?.category ?? ''))
    return '시설';
  return '시스템';
}

export default function OperationsDashboardPage() {
  const assets = useDigitalTwinStore(state => state.assetCatalog);
  const incidents = useDigitalTwinStore(state => state.incidents);
  const simulationTime = useDigitalTwinStore(state => state.simulationTime);
  const events = useDigitalTwinStore(state => state.auditEvents);
  const [chartEpoch] = useState(() => Date.now() - simulationTime * 1000);
  const [eventFilter, setEventFilter] = useState('전체');
  const [allLogs, setAllLogs] = useState(false);
  const [mockLogs] = useState(() => createMockOperationLogs(Date.now()));
  const assetLabels = useMemo(
    () => new Map(assets.map(asset => [asset.id, asset.name.replace(asset.id, '').trim()])),
    [assets]
  );
  const readings = useMemo(
    () => readAssets(assets, incidents, simulationTime),
    [assets, incidents, simulationTime]
  );
  const power = useMemo(
    () => calculateFacilityPower(assets, incidents, simulationTime),
    [assets, incidents, simulationTime]
  );
  const trend = useMemo(
    () =>
      Array.from({ length: 13 }, (_, index) => {
        const time = simulationTime + (index - 12) * 300;
        return applyDashboardTrendProfile(
          summarize(
            index === 12 ? readings : readAssets(assets, incidents, time),
            formatTime(chartEpoch + time * 1000).slice(0, 5)
          ),
          index
        );
      }),
    [assets, incidents, simulationTime, readings, chartEpoch]
  );
  const current = trend.at(-1);
  const total = readings.length;
  const normal = readings.filter(item => item.status === '정상').length;
  const warnings = readings.filter(item => item.status === '주의').length;
  const faults = total - normal - warnings;
  const kpis = [
    ['전체 관리 자산', total, '대', '6개 시설 구역', ''],
    [
      '정상 운영률',
      display(total ? (normal / total) * 100 : null),
      '%',
      `정상 ${normal}대 / 장애 ${faults}대`,
      'green',
    ],
    [
      '전체 소비 전력',
      display(power.totalKw),
      'kW',
      `추정 PUE ${display(power.pueEstimate, 2)}`,
      '',
    ],
    [
      '활성 장애',
      incidents.length,
      '건',
      `주의 ${warnings}건 · 장애 ${faults}건`,
      incidents.length ? 'red' : '',
    ],
  ];
  const logs = events
    .map(event => {
      const scenario = scenarioById.get(event.scenarioId);
      return {
        ...event,
        category: eventCategory(event, scenario, assets),
        asset: scenario?.asset ?? '전체 설비',
        description: scenario ? `${scenario.title} · ${event.action}` : event.action,
      };
    })
    .concat(mockLogs)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 50);
  const filteredLogs = logs.filter(
    event =>
      eventFilter === '전체' ||
      (eventFilter === '장애' ? event.kind === 'danger' : event.category === eventFilter)
  );

  return (
    <main className="operations-dashboard" aria-label="운영 대시보드">
      <div className="ops-content">
        <div className="ops-kpis" aria-label="전체 운영 요약">
          {kpis.map(([title, value, unit, note, tone]) => (
            <section className={`ops-kpi ${tone}`} key={title}>
              <h2>{title}</h2>
              <strong>
                {value}
                <small>{unit}</small>
              </strong>
              <p>{note}</p>
            </section>
          ))}
        </div>
        <div className="ops-chart-grid">
          <Panel title="GPU 자원 사용 현황">
            <p className="ops-chart-summary green">
              <strong>
                {display(current.GPU)}
                <small>%</small>
              </strong>
              평균 GPU 사용률
            </p>
            <div
              className="ops-line-chart"
              role="img"
              aria-label="최근 1시간 가상 GPU 사용률과 GPU 메모리 사용률"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trend} margin={{ top: 14, right: 20, bottom: 2, left: 0 }}>
                  <defs>
                    <linearGradient id="ops-gpu-bars" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#86f1ce" stopOpacity={0.96} />
                      <stop offset="100%" stopColor="#38a88b" stopOpacity={0.48} />
                    </linearGradient>
                  </defs>
                  <Axes ticks={[trend[0].time, trend[6].time, trend[12].time]} />
                  <Bar
                    dataKey="GPU"
                    fill="url(#ops-gpu-bars)"
                    maxBarSize={26}
                    radius={[4, 4, 1, 1]}
                    background={{ fill: '#87bce907', radius: 4 }}
                    activeBar={{ fill: '#8bf3d0', stroke: '#baffeb', strokeWidth: 1 }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="GPU 메모리"
                    stroke={colors['GPU 메모리']}
                    strokeWidth={2.2}
                    dot={<LatestPoint lastIndex={trend.length - 1} color={colors['GPU 메모리']} />}
                    activeDot={{ r: 4.5, stroke: '#e9f5ff', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <Legend keys={['GPU', 'GPU 메모리']} current={current} showValues={false} />
          </Panel>
          <Panel title="전력 및 냉각 현황" className="ops-power-panel">
            <div className="ops-power-body">
              <div
                className="ops-power-donut"
                role="img"
                aria-label={`총 소비 전력 ${display(power.totalKw)} kW`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {powerColors.map((color, index) => (
                        <linearGradient
                          key={color}
                          id={`ops-power-${index}`}
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop offset="0%" stopColor={color} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={[{ kw: 1 }]}
                      dataKey="kw"
                      innerRadius="70%"
                      outerRadius="94%"
                      fill="#23374e"
                      stroke="none"
                      isAnimationActive={false}
                      tooltipType="none"
                    />
                    <Pie
                      data={power.totalKw > 0 ? power.rows : [{ id: 'empty', kw: 1 }]}
                      dataKey="kw"
                      nameKey="label"
                      innerRadius="70%"
                      outerRadius="94%"
                      startAngle={90}
                      endAngle={-270}
                      stroke="#101e32"
                      strokeWidth={1.5}
                      paddingAngle={2}
                      cornerRadius={4}
                      isAnimationActive={false}
                    >
                      {(power.totalKw > 0 ? power.rows : [{ id: 'empty' }]).map((row, index) => (
                        <Cell
                          key={row.id}
                          fill={power.totalKw > 0 ? `url(#ops-power-${index})` : '#29405a'}
                        />
                      ))}
                    </Pie>
                    {power.totalKw > 0 && (
                      <Tooltip
                        content={<ChartTooltip unit="kW" />}
                        wrapperStyle={{ outline: 'none', zIndex: 10 }}
                      />
                    )}
                  </PieChart>
                </ResponsiveContainer>
                <div className="ops-power-donut-total">
                  <span>총 소비 전력</span>
                  <strong>{display(power.totalKw)}</strong>
                  <small>kW</small>
                </div>
              </div>
              <div className="ops-power-legend">
                {power.rows.map((row, index) => (
                  <div key={row.id}>
                    <span>
                      <i style={{ background: powerColors[index] }} />
                      {row.label}
                    </span>
                    <strong>
                      {display(row.kw)}
                      <small>kW</small>
                      <em className="ops-power-percentage">{display(row.share)}%</em>
                    </strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="ops-power-pue">
              <span>전력효율지수 (PUE)</span>
              <strong>{display(power.pueEstimate, 2)}</strong>
            </div>
          </Panel>
          <Panel title="서버 자원 사용 현황">
            <p className="ops-chart-summary">
              <strong>
                {display(current.CPU)}
                <small>%</small>
              </strong>
              평균 CPU 사용률
            </p>
            <TrendChart
              data={trend}
              keys={['CPU', '메모리', '스토리지']}
              chartId="ops-server"
              label="최근 1시간 가상 서버 CPU·메모리·스토리지 사용률"
            />
            <Legend keys={['CPU', '메모리', '스토리지']} current={current} />
          </Panel>
          <Panel title="네트워크 트래픽 현황">
            <p className="ops-chart-summary">
              <strong>
                {display(current.수신)}
                <small>Gbps</small>
              </strong>
              수신 트래픽
            </p>
            <TrendChart
              data={trend}
              keys={['수신', '송신']}
              chartId="ops-network"
              percent={false}
              label="최근 1시간 가상 네트워크 수신·송신 트래픽 합계"
            />
            <Legend keys={['수신', '송신']} current={current} percent={false} showValues={false} />
          </Panel>
        </div>
        <Panel
          title="최근 운영 및 이벤트 로그"
          className="ops-events"
          extra={
            <button
              type="button"
              className="ops-all-logs"
              aria-expanded={allLogs}
              onClick={() => setAllLogs(value => !value)}
            >
              {allLogs ? '최근 로그 보기' : '전체 로그 보기'}
            </button>
          }
        >
          <div className="ops-log-toolbar">
            <div className="ops-log-filters" role="group" aria-label="이벤트 구분 필터">
              {['전체', '시스템', '시설', '보안', '장애'].map(filter => (
                <button
                  type="button"
                  key={filter}
                  aria-pressed={eventFilter === filter}
                  onClick={() => setEventFilter(filter)}
                >
                  {filter}
                  <span>
                    {
                      logs.filter(
                        event =>
                          filter === '전체' ||
                          (filter === '장애' ? event.kind === 'danger' : event.category === filter)
                      ).length
                    }
                  </span>
                </button>
              ))}
            </div>
            <span className="ops-log-order">최신순</span>
          </div>
          <div className="ops-table-scroll">
            <table aria-label="최근 운영 및 이벤트 로그">
              <thead>
                <tr>
                  <th scope="col">발생 시각</th>
                  <th scope="col">구분</th>
                  <th scope="col">대상 장비</th>
                  <th scope="col">이벤트 내용</th>
                  <th scope="col">상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.slice(0, allLogs ? 50 : 4).map(event => (
                  <tr key={event.id} data-kind={event.kind}>
                    <td>
                      <time dateTime={event.timestamp}>{formatLogTimestamp(event.timestamp)}</time>
                    </td>
                    <td>
                      <span className="ops-log-category">{event.category}</span>
                    </td>
                    <td>
                      <span className="ops-log-asset">
                        <strong>{event.asset}</strong>
                        {assetLabels.get(event.asset) && (
                          <small>{assetLabels.get(event.asset)}</small>
                        )}
                      </span>
                    </td>
                    <td>
                      <strong className="ops-log-description">{event.description}</strong>
                    </td>
                    <td>
                      <span className={`ops-event-state ${event.kind}`}>
                        <i aria-hidden="true" />
                        {event.statusLabel ??
                          (event.kind === 'danger'
                            ? '장애'
                            : event.kind === 'success'
                              ? '완료'
                              : '정보')}
                      </span>
                    </td>
                  </tr>
                ))}
                {!filteredLogs.length && (
                  <tr>
                    <td className="ops-empty-cell" colSpan={5}>
                      <div className="ops-log-empty">
                        <ListChecks size={26} strokeWidth={1.5} aria-hidden="true" />
                        <strong>
                          {eventFilter === '전체'
                            ? '아직 기록된 이벤트가 없습니다.'
                            : `${eventFilter} 이벤트가 없습니다.`}
                        </strong>
                        <span>
                          {logs.length
                            ? '다른 구분을 선택해 로그를 확인하세요.'
                            : '시나리오 실행과 종료 이력이 이곳에 기록됩니다.'}
                        </span>
                        {!logs.length && <Link to="/scenario-control">시스템 제어로 이동</Link>}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="ops-log-footer">
            <span>
              {Math.min(filteredLogs.length, allLogs ? 50 : 4)} / {filteredLogs.length}건 표시
            </span>
          </div>
        </Panel>
      </div>
    </main>
  );
}
