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
import CampusPreview from '../features/dashboard/CampusPreview.jsx';
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
  const [selectedZoneId, setSelectedZoneId] = useState('3F');
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
  const selectedZone = zoneData.find(zone => zone.id === selectedZoneId) ?? zoneData[0];
  const issues = useMemo(
    () =>
      new Map(
        readings.filter(asset => asset.status !== '정상').map(asset => [asset.id, asset.status])
      ),
    [readings]
  );
  const selectZoneForTwin = () =>
    useDigitalTwinStore.getState().setNavigation({
      activeFloor: selectedZone.id.endsWith('F') ? selectedZone.id : null,
      activeZone: selectedZone.id.endsWith('F') ? `f${selectedZone.id[0]}` : selectedZone.id,
      selectedId: null,
    });
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
        <div className="ops-campus-row">
          <Panel
            title="시설 운영 현황"
            subtitle="본관 4개 층 · 전력·냉각 설비동"
            className="ops-campus-panel"
            delay={0.06}
            extra={
              <Link to="/" onClick={selectZoneForTwin} className="dashboard-card-action">
                3D 관제 화면 열기
              </Link>
            }
          >
            <div className="ops-campus-body">
              <CampusPreview
                zone={selectedZoneId}
                onSelectZone={setSelectedZoneId}
                issues={issues}
              />
              <nav className="ops-campus-floors" aria-label="시설 개요 구역 선택">
                {[...zoneData]
                  .sort((a, b) => {
                    const order = ['4F', '3F', '2F', '1F', 'power', 'cooling'];
                    return order.indexOf(a.id) - order.indexOf(b.id);
                  })
                  .map(zone => {
                    const tone = zone.faults ? 'fault' : zone.warnings ? 'warning' : 'normal';
                    return (
                      <button
                        key={zone.id}
                        type="button"
                        className={`ops-campus-floor ${tone}`}
                        aria-pressed={selectedZoneId === zone.id}
                        onClick={() => setSelectedZoneId(zone.id)}
                      >
                        <b>{zone.id.endsWith('F') ? zone.id : zone.id === 'power' ? 'P' : 'C'}</b>
                        <span>
                          {zone.description}
                          <small>{zone.members.length}대 관리</small>
                        </span>
                        <i style={{ background: tones[tone] }} />
                      </button>
                    );
                  })}
              </nav>
            </div>
            <div className="ops-campus-readings">
              <div>
                <span>선택 구역</span>
                <strong>
                  {selectedZone.label} · {selectedZone.description}
                </strong>
              </div>
              <div>
                <span>소비 전력</span>
                <strong>
                  {selectedZone.power.toFixed(1)}
                  <small>kW</small>
                </strong>
              </div>
              <div>
                <span>평균 장비 온도</span>
                <strong>
                  {selectedZone.temp === null ? '—' : selectedZone.temp.toFixed(1)}
                  <small>°C</small>
                </strong>
              </div>
              <div>
                <span>설비 상태</span>
                <strong
                  className={
                    selectedZone.faults ? 'fault' : selectedZone.warnings ? 'warning' : 'normal'
                  }
                >
                  {selectedZone.faults
                    ? `장애 ${selectedZone.faults}대`
                    : selectedZone.warnings
                      ? `주의 ${selectedZone.warnings}대`
                      : '정상 운영'}
                </strong>
              </div>
            </div>
          </Panel>
          <Panel
            title="운영 점검"
            subtitle="진행 중 장애 및 전력 사용 구성"
            className="ops-operations-panel"
            delay={0.1}
          >
            <div className="ops-incident-heading">
              <h3>진행 중 시나리오</h3>
              <span className={incidents.length ? 'fault' : ''}>{incidents.length}건</span>
            </div>
            <div className="ops-current-incidents">
              {incidents.length ? (
                incidents.map(incident => {
                  const scenario = scenarioById.get(incident.id);
                  const asset = readings.find(item => item.id === scenario?.asset);
                  if (!scenario) return null;
                  return (
                    <Link
                      to="/"
                      onClick={() => asset && focusAsset(asset)}
                      className="ops-current-incident"
                      key={incident.id}
                    >
                      <div>
                        <strong>{scenario.title}</strong>
                        <span>{scenario.level}</span>
                      </div>
                      <p>
                        {scenario.asset} · {scenario.condition}
                      </p>
                    </Link>
                  );
                })
              ) : (
                <div className="ops-no-incidents">
                  <span>진행 중인 장애가 없습니다.</span>
                  <small>
                    {abnormalCount
                      ? `주의·장애 설비 ${abnormalCount}대를 확인하세요.`
                      : `전체 ${total}대 설비가 정상 상태입니다.`}
                  </small>
                </div>
              )}
            </div>
            <div className="ops-power-heading">
              <h3>전력 사용 구성</h3>
              <span>
                추정 PUE <b>{power.pueEstimate?.toFixed(2) ?? '—'}</b>
              </span>
            </div>
            <div className="ops-power-breakdown">
              {power.rows.map((row, index) => (
                <div key={row.id}>
                  <span>
                    <i
                      style={{ background: ['#87bce9', '#73e1c0', '#eac476', '#9da9c9'][index] }}
                    />
                    {row.label}
                  </span>
                  <div className="ops-power-track">
                    <i
                      style={{
                        width: `${row.share}%`,
                        background: ['#87bce9', '#73e1c0', '#eac476', '#9da9c9'][index],
                      }}
                    />
                  </div>
                  <strong>
                    {row.kw.toFixed(1)}
                    <small>kW</small>
                  </strong>
                </div>
              ))}
            </div>
            <Link className="dashboard-card-action ops-scenario-link" to="/scenario-control">
              시나리오 제어 열기
            </Link>
          </Panel>
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
