import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useRef } from 'react';
import ConnectionSummaryList from './ConnectionSummaryList.jsx';
import { connections, origin, getConnectionStatus } from './networkData.js';
import { connectionHistory, formatHistoryTime } from './networkHistory.js';

const sitesById = new Map(connections.map(site => [site.id, site]));
const flowNames = { inbound: '수신', outbound: '송신', bidirectional: '송수신' };

export default function CountryConnectionDetails({
  country,
  sites,
  selected,
  originFocused,
  onSelect,
  onCountry,
  onOverview,
}) {
  const listOrigin = useRef(null);
  const site = selected ?? (originFocused ? origin : null);
  const scope = originFocused || !country ? connections : sites;
  const scopeIds = new Set((selected ? [selected] : scope).map(item => item.id));
  const history = connectionHistory.filter(event => scopeIds.has(event.connectionId)).slice(0, 10);
  const errorCount = scope.filter(item => item.status === 'error').length;
  const status = getConnectionStatus(
    site?.status ??
      (!scope.length
        ? 'unknown'
        : errorCount
          ? 'error'
          : scope.some(item => item.status === 'warning')
            ? 'warning'
            : 'normal')
  );
  const route = selected
    ? selected.flow === 'inbound'
      ? `${selected.city} → ${origin.city}`
      : `${origin.city} ${selected.flow === 'bidirectional' ? '↔' : '→'} ${selected.city}`
    : null;

  if (!site) {
    return (
      <ConnectionSummaryList
        country={country}
        sites={scope}
        onOverview={onOverview}
        onSelect={target => {
          listOrigin.current = { siteId: target.id, countryCode: country?.properties.code ?? null };
          onSelect(target);
        }}
      />
    );
  }
  const backToList = () => {
    const previous = listOrigin.current;
    listOrigin.current = null;
    const fromCard = previous && selected && previous.siteId === selected.id;
    if (fromCard && !previous.countryCode) onOverview();
    else onCountry(fromCard ? previous.countryCode : country.properties.code);
  };

  return (
    <aside className="network-detail network-info-panel" aria-label="AI 통신 현황 및 이력">
      <header>
        <h2>통신 상세</h2>
      </header>
      <button type="button" className="network-detail-list-back" onClick={backToList}>
        <ArrowLeft size={13} />
        연결 목록 보기
      </button>
      <div className="network-activity-summary">
        <span className="network-activity-scope">
          {site ? `${site.country} · ${site.region}` : country ? '선택 국가' : '전체 연결'}
        </span>
        <h3>{site ? site.city : country ? country.properties.name : '전체 통신 현황'}</h3>
        <span className="network-activity-status" style={{ color: status.color }}>
          <i style={{ background: status.color }} />
          {status.label}
        </span>
        {selected ? (
          <dl className="network-activity-facts">
            {[
              ['서비스', selected.service],
              ['통신 경로', route],
              ['방향', flowNames[selected.flow]],
              ['응답 지연', `${selected.latency} ms`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="network-activity-metrics">
            <div>
              <span>통신 지점</span>
              <strong>
                {scope.length}
                <small>곳</small>
              </strong>
            </div>
            <div>
              <span>통신 이상</span>
              <strong
                style={{ color: errorCount ? getConnectionStatus('error').color : undefined }}
              >
                {errorCount}
                <small>곳</small>
              </strong>
            </div>
          </div>
        )}
        {originFocused && (
          <p className="network-activity-origin">{origin.name} · 출발지의 전체 송수신 이력</p>
        )}
      </div>
      <section className="network-history" aria-label="최근 통신 이력">
        <header>
          <h3>최근 통신</h3>
          <span>최근 {history.length}건</span>
        </header>
        {history.length ? (
          <ol className="network-history-list">
            {history.map(event => {
              const target = sitesById.get(event.connectionId);
              const eventStatus = getConnectionStatus(event.status);
              return (
                <li key={event.id} style={{ '--event-color': eventStatus.color }}>
                  <button
                    type="button"
                    onClick={() => onSelect(target)}
                    aria-label={`${target.city} ${event.title} 상세`}
                  >
                    <div className="network-history-event-top">
                      <time dateTime={formatHistoryTime(event.time)}>
                        {formatHistoryTime(event.time)}
                      </time>
                      <span style={{ color: eventStatus.color }}>{event.title}</span>
                    </div>
                    <strong>{event.route}</strong>
                    <p>{event.detail}</p>
                    {!selected && (
                      <small>
                        {target.country} · {target.region}
                      </small>
                    )}
                    <ArrowUpRight
                      className="network-history-event-arrow"
                      size={12}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="network-empty">등록된 통신 이력이 없습니다.</p>
        )}
      </section>
    </aside>
  );
}
