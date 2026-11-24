import { uiClass } from '../../styles/interfaceStyles.js';
import { useState } from 'react';
import DetailBackNavigation from '../../components/DetailBackNavigation.jsx';
import { getConnectionStatus } from './networkData.js';
import { connectionHistory, formatHistoryTime } from './networkHistory.js';
const latestBySite = new Map();
for (const event of connectionHistory) {
  if (!latestBySite.has(event.connectionId)) latestBySite.set(event.connectionId, event);
}
const priority = {
  error: 0,
  warning: 1,
  normal: 2,
};
export default function ConnectionSummaryList({ country, sites, onSelect, onOverview }) {
  const scopeKey = country?.properties.code ?? 'all';
  const [filter, setFilter] = useState({
    scope: scopeKey,
    status: 'all',
  });
  const active = filter.scope === scopeKey ? filter.status : 'all';
  const cards = sites
    .filter(site => active === 'all' || site.status === active)
    .toSorted((a, b) => priority[a.status] - priority[b.status]);
  return (
    <aside className={uiClass('network-detail network-info-panel')} aria-label="AI 통신 연결 목록">
      <header>
        <h2>AI 통신이력</h2>
      </header>
      {country && (
        <DetailBackNavigation onBack={onOverview} label="통신 목록 탐색">
          전체 통신 목록으로 돌아가기
        </DetailBackNavigation>
      )}
      <div className={uiClass('network-connection-list-heading')}>
        <div>
          <h3>{country ? country.properties.name : '전체 통신 연결'}</h3>
          <span>{sites.length}개 지점 · 이상 우선</span>
        </div>
        <div
          className={uiClass('network-connection-filters')}
          role="group"
          aria-label="통신 상태 필터"
        >
          {[
            ['all', '전체 상태'],
            ['error', '이상'],
            ['warning', '지연'],
          ].map(([status, label]) => (
            <button
              key={status}
              type="button"
              aria-pressed={active === status}
              onClick={() =>
                setFilter({
                  scope: scopeKey,
                  status,
                })
              }
            >
              {label}
              <span>
                {status === 'all'
                  ? sites.length
                  : sites.filter(site => site.status === status).length}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className={uiClass('network-connection-cards')} aria-label="통신 요약 목록">
        {cards.map(site => {
          const status = getConnectionStatus(site.status);
          const latest = latestBySite.get(site.id);
          return (
            <button
              key={site.id}
              type="button"
              className={uiClass('network-connection-card')}
              data-status={site.status}
              onClick={() => onSelect(site)}
              aria-label={`${site.city} 통신 상세 보기`}
            >
              <div className={uiClass('network-connection-card-top')}>
                <span
                  style={{
                    color: status.color,
                  }}
                >
                  <i
                    style={{
                      background: status.color,
                    }}
                  />
                  {status.label}
                </span>
                <time dateTime={formatHistoryTime(latest.time)}>
                  {formatHistoryTime(latest.time)}
                </time>
              </div>
              <h4>
                {site.city} · {site.service}
              </h4>
              <p className={uiClass('network-connection-card-location')}>
                {site.country} · {site.region}
              </p>
              <div className={uiClass('network-connection-card-footer')}>
                <span>
                  {site.latency} ms · {site.traffic} Mbps
                </span>
              </div>
            </button>
          );
        })}
        {!cards.length && <p className={uiClass('network-empty')}>해당 상태의 연결이 없습니다.</p>}
      </div>
    </aside>
  );
}
