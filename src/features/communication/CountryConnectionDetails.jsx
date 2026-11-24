import { ArrowLeft, ArrowUpRight, Globe2, MapPin } from 'lucide-react';
import { origin, getConnectionStatus } from './networkData.js';

const coordinates = ([lon, lat]) =>
  `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
const flowNames = { inbound: '수신', outbound: '송신', bidirectional: '송수신' };

export default function CountryConnectionDetails({
  country,
  sites,
  selected,
  originFocused,
  onSelect,
  onSelectOrigin,
  onCountry,
  onOverview,
}) {
  const local = country?.properties.code === origin.countryCode;
  const site = selected ?? (originFocused ? origin : null);
  const route = selected
    ? selected.flow === 'inbound'
      ? `${selected.city} → ${origin.city}`
      : `${origin.city} ${selected.flow === 'bidirectional' ? '↔' : '→'} ${selected.city}`
    : null;
  return (
    <aside
      className="network-detail network-info-panel"
      aria-label="국가 및 통신 지점 상세"
      aria-live="polite"
    >
      <header>
        <h2>{site ? '통신 지점' : country ? '국가별 통신' : '연결 상세'}</h2>
        {country && <span>{country.properties.name}</span>}
      </header>
      {!country ? (
        <div className="network-detail-placeholder">
          <Globe2 size={30} />
          <strong>국가별 연결 보기</strong>
          <p>
            나라를 선택하면 지역과
            <br />
            송수신 지점을 확인할 수 있습니다.
          </p>
        </div>
      ) : (
        <>
          <div className="network-country-summary">
            <span>선택 국가</span>
            <h3>{country.properties.name}</h3>
            <p>
              {local && `${origin.city} 출발지 · `}
              {sites.length}개 통신 지점
            </p>
          </div>
          {site ? (
            <>
              <button
                type="button"
                className="network-country-back"
                onClick={() => onCountry(country.properties.code)}
              >
                <ArrowLeft size={13} />
                국가 전체 보기
              </button>
              <div className="network-location-path">
                <MapPin size={14} />
                <span>
                  {site.region} · {site.city}
                </span>
              </div>
              <dl>
                {[
                  ['위치', site.location],
                  ['좌표', coordinates(site.coordinates)],
                  ['상태', getConnectionStatus(site.status).label],
                  ...(selected
                    ? [
                        ['송수신', flowNames[selected.flow]],
                        ['통신 경로', route],
                        ['서비스', selected.service],
                        ['응답 지연', `${selected.latency} ms`],
                      ]
                    : [['연결 역할', '출발지']]),
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <>
              {local && (
                <button type="button" className="network-country-site" onClick={onSelectOrigin}>
                  <MapPin size={16} />
                  <span>
                    <strong>
                      {origin.city} · {origin.name}
                    </strong>
                    <small>{origin.region} · 출발지</small>
                  </span>
                  <ArrowUpRight size={14} />
                </button>
              )}
              {sites.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className="network-country-site"
                  onClick={() => onSelect(item)}
                >
                  <MapPin size={16} style={{ color: getConnectionStatus(item.status).color }} />
                  <span>
                    <strong>
                      {item.region} · {item.city}
                    </strong>
                    <small>
                      {flowNames[item.flow]} · {item.service}
                    </small>
                  </span>
                  <ArrowUpRight size={14} />
                </button>
              ))}
              {!local && !sites.length && (
                <p className="network-empty">등록된 통신 지점이 없습니다.</p>
              )}
            </>
          )}
          <p className="network-location-note">예시 좌표이며 실제 서버 위치는 미연결입니다.</p>
          <button type="button" className="network-back" onClick={onOverview}>
            <ArrowLeft size={14} />
            전체 국가 보기
          </button>
        </>
      )}
    </aside>
  );
}
