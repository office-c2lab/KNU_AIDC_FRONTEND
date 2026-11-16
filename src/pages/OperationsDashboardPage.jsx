import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useDigitalTwinStore } from '../stores/digitalTwinStore.js';
import { createIncidentSelectors } from '../features/digital-twin/scene/systems/createIncidentSelectors.js';
import { calculateFacilityPower } from '../features/digital-twin/calculateFacilityPower.js';
import { SCENARIOS } from '../features/digital-twin/scene/config/scenarioConfig.js';
import { panelEntrance } from '../utils/panelMotion.js';
import DashboardPanel from '../features/dashboard/DashboardPanel.jsx';
import '../features/dashboard/operations-dashboard.css';

const scenarioById = new Map(SCENARIOS.map(item => [item.id, item]));
const tones = { normal: '#73e1c0', warning: '#eac476', fault: '#ff8188' };
const groups = [
  ['1F', '1층', '보안·통신'],
  ['2F', '2층', '일반 서버'],
  ['3F', '3층', 'AI·GPU'],
  ['4F', '4층', '통합 관제'],
  ['power', '전력동', '전력 설비'],
  ['cooling', '냉각동', '냉각 설비'],
];
const average = values =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const formatTime = value =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));

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
      ...selectors.getSensor(asset),
      status: selectors.getAssetStatus(asset),
      values: selectors.getOperatingData(asset).values,
    }));
}

function Panel({ title, subtitle, extra, className = '', delay = 0, children }) {
  return (
    <DashboardPanel
      title={title}
      subtitle={subtitle}
      extra={extra}
      delay={delay}
      className={`ops-panel ${className}`}
    >
      {children}
    </DashboardPanel>
  );
}

export default function OperationsDashboardPage() {
  const [range, setRange] = useState(60);
  const [mapMode, setMapMode] = useState('status');
  const [inspectedId, setInspectedId] = useState(null);
  const chartId = useId().replace(/:/g, '');
  const assets = useDigitalTwinStore(state => state.assetCatalog);
  const incidents = useDigitalTwinStore(state => state.incidents);
  const simulationTime = useDigitalTwinStore(state => state.simulationTime);
  const events = useDigitalTwinStore(state => state.auditEvents);
  const readings = useMemo(
    () => readAssets(assets, incidents, simulationTime),
    [assets, incidents, simulationTime]
  );
  const power = useMemo(
    () => calculateFacilityPower(assets, incidents, simulationTime),
    [assets, incidents, simulationTime]
  );
  const counts = { normal: 0, warning: 0, fault: 0 };
  readings.forEach(
    item =>
      counts[item.status === '정상' ? 'normal' : item.status === '주의' ? 'warning' : 'fault']++
  );
  const total = readings.length;
  const abnormalCount = counts.warning + counts.fault;
  const statusData = [
    { name: '정상', value: counts.normal, color: tones.normal },
    { name: '주의', value: counts.warning, color: tones.warning },
    { name: '장애', value: counts.fault, color: tones.fault },
  ];
  const zoneData = groups.map(([id, label, description]) => {
    const members = readings.filter(item => item.floor === id || (!item.floor && item.zone === id));
    const faults = members.filter(item => !['정상', '주의'].includes(item.status)).length;
    const warnings = members.filter(item => item.status === '주의').length;
    return {
      id,
      label,
      description,
      members,
      faults,
      warnings,
      power: members.reduce((sum, item) => sum + item.power, 0),
      temp: members.length ? average(members.map(item => item.temp)) : null,
    };
  });
  const inspected =
    readings.find(item => item.id === inspectedId) ??
    readings.find(item => !['정상', '주의'].includes(item.status)) ??
    readings[0];
  const focusAsset = asset =>
    useDigitalTwinStore.getState().setNavigation({
      selectedId: asset.id,
      activeFloor: asset.floor ?? null,
      activeZone: asset.floor ? `f${asset.floor[0]}` : asset.zone,
    });
  const trend = useMemo(
    () =>
      Array.from({ length: 13 }, (_, index) => {
        const minute = (index - 12) * 5;
        const sample = readAssets(assets, incidents, simulationTime + minute * 60);
        const cpu = sample.filter(item => item.type === 'SERVER RACK');
        const gpu = sample.filter(item => item.type === 'GPU SERVER RACK');
        const memory = sample.filter(item => Number.isFinite(item.values.memoryTotalGiB));
        return {
          time: minute === 0 ? '현재' : `${minute}분`,
          CPU: cpu.length ? average(cpu.map(item => item.values.cpuPercent)) : null,
          GPU: gpu.length ? average(gpu.map(item => item.values.gpuPercent)) : null,
          메모리: memory.length
            ? average(
                memory.map(item => (item.values.memoryUsedGiB / item.values.memoryTotalGiB) * 100)
              )
            : null,
        };
      }),
    [assets, incidents, simulationTime]
  );
  const facilities = [
    [
      '전력 부하',
      average(
        readings
          .filter(item => ['SERVER RACK', 'GPU SERVER RACK'].includes(item.type))
          .map(item => item.values.loadPercent)
      ),
      '%',
      '#73e1c0',
    ],
    [
      'UPS 부하',
      average(readings.filter(item => item.type === 'UPS').map(item => item.values.upsLoadPercent)),
      '%',
      '#87bce9',
    ],
    [
      '냉각 부하',
      average(
        readings
          .filter(item =>
            ['CHILLER', 'COOLANT DISTRIBUTION UNIT', 'PRECISION AIR COOLING'].includes(item.type)
          )
          .map(item => item.values.loadPercent)
      ),
      '%',
      '#73e1c0',
    ],
    ['평균 온도', average(readings.map(item => item.temp)), '°C', '#87bce9'],
  ];
  const kpis = [
    ['전체 자산', total, '대', '관리 대상 장비', 'blue'],
    [
      '정상 운영률',
      total ? ((counts.normal / total) * 100).toFixed(1) : '0.0',
      '%',
      `정상 ${counts.normal}대`,
      'green',
    ],
    ['전체 소비 전력', power.totalKw.toFixed(1), 'kW', '실시간 가상 소비 전력', 'blue'],
    [
      '활성 경보',
      incidents.length,
      '건',
      `주의 ${counts.warning} · 장애 ${counts.fault}대`,
      incidents.length ? 'red' : 'quiet',
    ],
  ];

  return (
    <main className="operations-dashboard">
      <div className="ops-content">
        <div className="ops-kpis" aria-label="전체 운영 요약">
          {kpis.map(([title, value, unit, note, tone], index) => {
            return (
              <motion.section
                {...panelEntrance({ delay: index * 0.04 })}
                className={`ops-kpi ${tone}`}
                key={title}
              >
                <div className="ops-kpi-top">
                  <h2>{title}</h2>
                </div>
                <strong>
                  {value}
                  <small>{unit}</small>
                </strong>
                <p>{note}</p>
              </motion.section>
            );
          })}
        </div>
        <div className="ops-chart-row">
          <Panel
            title="인프라 자원 사용 추이"
            subtitle="가상 부하 모델 기준 · CPU / GPU / 메모리"
            extra={
              <div className="ops-range" role="group" aria-label="자원 추이 조회 기간">
                {[15, 30, 60].map(minutes => (
                  <button
                    type="button"
                    key={minutes}
                    aria-pressed={range === minutes}
                    onClick={() => setRange(minutes)}
                  >
                    {minutes === 60 ? '1시간' : `${minutes}분`}
                  </button>
                ))}
              </div>
            }
            delay={0.08}
            className="ops-trend-panel"
          >
            <div
              className="ops-line-chart"
              role="img"
              aria-label={`최근 ${range}분 가상 CPU, GPU 및 메모리 사용률 추이`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trend.filter((_, index) => index >= 12 - range / 5)}
                  margin={{ top: 16, right: 12, bottom: 8, left: -15 }}
                >
                  <defs>
                    {[
                      ['CPU', '#87bce9'],
                      ['GPU', '#73e1c0'],
                      ['메모리', '#eac476'],
                    ].map(([key, color]) => (
                      <linearGradient
                        key={key}
                        id={`${chartId}-${key}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={color} stopOpacity={0.24} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.01} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#41638a55" />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#b8cce3' }}
                    minTickGap={28}
                    tickMargin={12}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={value => `${value}%`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#b8cce3' }}
                  />
                  <Tooltip
                    formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
                    contentStyle={{
                      borderRadius: 4,
                      border: '1px solid #5274a2',
                      background: '#10213a',
                      color: '#edf5ff',
                      fontSize: 11,
                    }}
                    labelStyle={{ color: '#b8cce3' }}
                    cursor={{ stroke: '#8db7dc', strokeDasharray: '3 3' }}
                  />
                  {[
                    ['CPU', '#87bce9'],
                    ['GPU', '#73e1c0'],
                    ['메모리', '#eac476'],
                  ].map(([key, color]) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={color}
                      strokeWidth={2}
                      fill={`url(#${chartId}-${key})`}
                      dot={false}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="ops-chart-legend">
              {[
                ['CPU', '#87bce9'],
                ['GPU', '#73e1c0'],
                ['메모리', '#eac476'],
              ].map(([label, color]) => (
                <span key={label}>
                  <i style={{ background: color }} />
                  {label}
                  <strong>
                    {trend.at(-1)[label]?.toFixed(1) ?? '—'}
                    <small>%</small>
                  </strong>
                </span>
              ))}
            </div>
          </Panel>
          <Panel
            title="자산 운영 상태"
            subtitle={`${total}대 · 구역별 장비 맵`}
            delay={0.12}
            className={`ops-host-panel ${abnormalCount ? 'attention' : ''}`}
            extra={
              <div className="ops-range" role="group" aria-label="장비 맵 표시 기준">
                {[
                  ['status', '상태'],
                  ['load', '부하'],
                ].map(([mode, label]) => (
                  <button
                    type="button"
                    key={mode}
                    aria-pressed={mapMode === mode}
                    onClick={() => setMapMode(mode)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
          >
            <div className="ops-host-map" aria-label="구역별 장비 상태 맵">
              {zoneData.map(zone => (
                <div className="ops-host-group" key={zone.id}>
                  <div className="ops-host-group-title">
                    <span>{zone.label}</span>
                    <small>{zone.members.length}대</small>
                  </div>
                  <div className="ops-host-cells">
                    {zone.members.map(asset => {
                      const status =
                        asset.status === '정상'
                          ? 'normal'
                          : asset.status === '주의'
                            ? 'warning'
                            : 'fault';
                      const load = asset.values.loadPercent;
                      const color =
                        mapMode === 'status'
                          ? { normal: '#3c988a', warning: '#eac476', fault: '#ff8188' }[status]
                          : load >= 85
                            ? '#d5a451'
                            : load >= 60
                              ? '#4ca399'
                              : '#315972';
                      return (
                        <Link
                          to="/"
                          key={asset.id}
                          className={`ops-host-cell ${inspected?.id === asset.id ? 'inspected' : ''}`}
                          style={{ '--cell-color': color }}
                          aria-label={`${asset.id}, ${asset.status}, 부하 ${load.toFixed(1)}%, 3D에서 보기`}
                          title={`${asset.id} · ${asset.status} · ${load.toFixed(1)}%`}
                          onMouseEnter={() => setInspectedId(asset.id)}
                          onFocus={() => setInspectedId(asset.id)}
                          onClick={() => focusAsset(asset)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="ops-map-legend">
              {mapMode === 'status' ? (
                statusData.map(item => (
                  <span key={item.name}>
                    <i style={{ background: item.color }} />
                    {item.name}
                    <b>{item.value}</b>
                  </span>
                ))
              ) : (
                <>
                  <span>
                    <i style={{ background: '#315972' }} />
                    0–60%
                  </span>
                  <span>
                    <i style={{ background: '#4ca399' }} />
                    60–85%
                  </span>
                  <span>
                    <i style={{ background: '#d5a451' }} />
                    85–100%
                  </span>
                </>
              )}
            </div>
            {inspected && (
              <div className="ops-host-inspector">
                <span>
                  <strong>{inspected.id}</strong>
                  <small>{inspected.name.replace(inspected.id, '').trim()}</small>
                </span>
                <span>
                  <b>
                    {inspected.temp.toFixed(1)}
                    <small>°C</small>
                  </b>
                  <small>{inspected.power.toFixed(1)} kW</small>
                </span>
              </div>
            )}
          </Panel>
        </div>
        <div className="ops-facility-row">
          <Panel title="시설·환경 운영" subtitle="전력 및 냉각 인프라 현황" delay={0.16}>
            <div className="ops-facility-grid">
              {facilities.map(([label, value, unit, color]) => {
                return (
                  <div key={label} className="ops-facility-tile">
                    <span className="ops-facility-label">{label}</span>
                    <strong>
                      {value.toFixed(1)}
                      <small>{unit}</small>
                    </strong>
                    {unit === '%' && (
                      <div className="ops-meter">
                        <i style={{ width: `${Math.min(100, value)}%`, background: color }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="ops-footnote">전력 부하: 서버·GPU 장비 평균 가동 부하</p>
          </Panel>
          <Panel
            title="구역별 운영 현황"
            subtitle="전체 6개 구역의 설비 상태"
            extra={
              <Link className="dashboard-card-action" to="/">
                3D 보기
              </Link>
            }
            delay={0.2}
          >
            <div className="ops-table-scroll">
              <table className="ops-zone-table">
                <thead>
                  <tr>
                    <th>구역</th>
                    <th>장비</th>
                    <th>소비 전력</th>
                    <th>평균 온도</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {[...zoneData]
                    .sort((a, b) => b.faults - a.faults || b.warnings - a.warnings)
                    .map(zone => {
                      const tone = zone.faults ? 'fault' : zone.warnings ? 'warning' : 'normal';
                      return (
                        <tr key={zone.id} className={tone}>
                          <td>
                            <Link
                              to="/"
                              onClick={() =>
                                useDigitalTwinStore.getState().setNavigation({
                                  activeFloor: zone.id.endsWith('F') ? zone.id : null,
                                  activeZone: zone.id.endsWith('F') ? `f${zone.id[0]}` : zone.id,
                                })
                              }
                            >
                              <strong>{zone.label}</strong>
                              <small>{zone.description}</small>
                            </Link>
                          </td>
                          <td>
                            {zone.members.length}
                            <small>대</small>
                          </td>
                          <td>
                            <div className="ops-power-cell">
                              <span>
                                {zone.power.toFixed(1)}
                                <small>kW</small>
                              </span>
                              <i
                                style={{
                                  '--power-share': `${power.totalKw ? (zone.power / power.totalKw) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </td>
                          <td>
                            {zone.temp === null ? '—' : zone.temp.toFixed(1)}
                            <small>°C</small>
                          </td>
                          <td>
                            <span className={`ops-zone-status ${tone}`}>
                              {zone.faults
                                ? `장애 ${zone.faults}`
                                : zone.warnings
                                  ? `주의 ${zone.warnings}`
                                  : '정상'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
        <Panel
          title="최근 경보 및 이벤트"
          subtitle="운영 중 발생한 주요 이벤트"
          extra={<span className="ops-meta">최근 이벤트 {Math.min(events.length, 5)}건</span>}
          className="ops-events"
          delay={0.24}
        >
          {!events.length ? (
            <div className="ops-empty">
              <div>
                <strong>최근 발생한 경보 및 이벤트가 없습니다.</strong>
                <span>시나리오 실행·종료 이력이 이곳에 기록됩니다.</span>
              </div>
              <Link className="dashboard-card-action" to="/scenario-control">
                시나리오 제어로 이동
              </Link>
            </div>
          ) : (
            <div className="ops-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>발생 시각</th>
                    <th>장비명</th>
                    <th>이벤트 내용</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 5).map(event => {
                    const scenario = scenarioById.get(event.scenarioId);
                    return (
                      <tr key={event.id}>
                        <td>
                          <time dateTime={event.timestamp}>{formatTime(event.timestamp)}</time>
                        </td>
                        <td>{scenario?.asset ?? '전체 설비'}</td>
                        <td>{scenario ? `${scenario.title} · ${event.action}` : event.action}</td>
                        <td>
                          <span className={`ops-event-state ${event.kind}`}>
                            {event.kind === 'danger'
                              ? '경보'
                              : event.kind === 'success'
                                ? '완료'
                                : '정보'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </main>
  );
}
