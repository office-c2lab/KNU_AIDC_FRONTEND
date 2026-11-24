import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { geoContains, geoGraticule10, geoMercator, geoOrthographic, geoPath } from 'd3-geo';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Globe2,
  Map,
  Minus,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';
import land from '../features/communication/land.json';
import countries from '../features/communication/countries.json';
import NetworkSurface from '../features/communication/NetworkSurface.jsx';
import ConnectionOverlay from '../features/communication/ConnectionOverlay.jsx';
import CountryConnectionDetails from '../features/communication/CountryConnectionDetails.jsx';
import {
  countryByCode,
  countryFeatures,
  countryView,
} from '../features/communication/countryGeography.js';
import { connections, origin, getConnectionStatus } from '../features/communication/networkData.js';
import '../features/communication/network.css';

const geography = { type: 'MultiPolygon', coordinates: land };
const coastline = { type: 'MultiLineString', coordinates: land.flatMap(polygon => polygon) };
const countryBorders = {
  type: 'MultiLineString',
  coordinates: countries.geometries.flatMap(geometry =>
    geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()
  ),
};
const sphere = { type: 'Sphere' };
const graticule = geoGraticule10();
const MIN_ZOOM = 0.8;
const MAX_ZOOM = 1.6;
const clampZoom = value => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
const countryLabels = [
  ['대한민국', [127.5, 37.5]],
  ['중국', [101, 35]],
  ['일본', [139, 39]],
  ['러시아', [100, 61]],
  ['인도', [79, 23]],
  ['몽골', [103, 47]],
  ['인도네시아', [118, -4]],
  ['호주', [134, -25]],
  ['태국', [100, 17]],
  ['미국', [-103, 39]],
  ['캐나다', [-110, 57]],
  ['브라질', [-53, -12]],
  ['독일', [10, 52]],
  ['프랑스', [2, 46]],
  ['사우디아라비아', [44, 24]],
  ['이집트', [29, 27]],
  ['남아프리카', [25, -29]],
  ['멕시코', [-102, 24]],
];
const stars = Array.from({ length: 80 }, (_, i) => ({
  x: (i * 173.31 + 27) % 960,
  y: (i * 97.73 + 11) % 660,
  r: i % 7 === 0 ? 1.1 : 0.55,
}));

export default function AiNetworkPage() {
  const clipId = useId().replace(/:/g, '');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState(null);
  const [originFocused, setOriginFocused] = useState(false);
  const [mode, setMode] = useState('globe');
  const [rotation, setRotation] = useState([-112, -23]);
  const [zoom, setZoom] = useState(1);
  const [mapCenter, setMapCenter] = useState(null);
  const [query, setQuery] = useState('');
  const [surfaceReady, setSurfaceReady] = useState(false);
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const [mapAspect, setMapAspect] = useState(960 / 660);
  const [stageSize, setStageSize] = useState([960, 660]);
  const [mapSideInset, setMapSideInset] = useState(0.2);
  useEffect(() => {
    const stage = stageRef.current;
    let zoomFrame = 0;
    let pendingDelta = 0;
    const onWheel = event => {
      if (event.ctrlKey || !event.deltaY) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1;
      pendingDelta += Math.max(-120, Math.min(120, event.deltaY * unit));
      if (zoomFrame) return;
      zoomFrame = requestAnimationFrame(() => {
        const factor = Math.exp(-pendingDelta * 0.0015);
        pendingDelta = 0;
        zoomFrame = 0;
        setZoom(value => clampZoom(value * factor));
      });
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    const observer = new ResizeObserver(() => {
      if (stage.clientHeight) {
        setMapAspect(stage.clientWidth / stage.clientHeight);
        const panel = stage.closest('.network-workspace').querySelector('.network-destinations');
        const bounds = stage.getBoundingClientRect();
        setStageSize([bounds.width, bounds.height]);
        setMapSideInset(
          getComputedStyle(panel).position === 'absolute'
            ? Math.min(0.4, (panel.getBoundingClientRect().right - bounds.left + 24) / bounds.width)
            : 0.04
        );
      }
    });
    observer.observe(stage);
    return () => {
      observer.disconnect();
      stage.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(zoomFrame);
    };
  }, []);
  const selected = connections.find(item => item.id === selectedId);
  const selectedCountry = countryByCode.get(selectedCountryCode);
  const countrySites = connections.filter(item => item.countryCode === selectedCountryCode);
  const filtered = connections.filter(item =>
    `${item.city} ${item.country} ${item.region} ${item.service}`.includes(query.trim())
  );
  const countryGroups = [
    ...new Set([origin.countryCode, ...filtered.map(item => item.countryCode)]),
  ]
    .filter(
      code =>
        code !== origin.countryCode ||
        filtered.some(item => item.countryCode === code) ||
        !query.trim() ||
        `${origin.country} ${origin.city} ${origin.region}`.includes(query.trim())
    )
    .map(code => ({
      country: countryByCode.get(code),
      sites: filtered.filter(item => item.countryCode === code),
      status: getConnectionStatus(
        connections.some(item => item.countryCode === code && item.status === 'error')
          ? 'error'
          : connections.some(item => item.countryCode === code && item.status === 'warning')
            ? 'warning'
            : code === origin.countryCode
              ? origin.status
              : 'normal'
      ),
    }));
  const projection = useMemo(() => {
    if (mode === 'globe') {
      const spanX = Math.max(960, 660 * mapAspect);
      const spanY = Math.max(660, 960 / mapAspect);
      // Reserve space for the floating panels, labels, header and elevated arcs.
      const radius = Math.max(
        100,
        Math.min(210, (spanX * (1 - 2 * mapSideInset)) / 2 - 100, (spanY - 200) / (2 * 1.22))
      );
      return geoOrthographic()
        .translate([480, 330])
        .scale(radius * zoom)
        .rotate(rotation);
    }
    let midpoint;
    let scale;
    if (selectedCountry) {
      const view = countryView(selectedCountry, mapAspect, mapSideInset);
      midpoint = view.center;
      scale = view.scale;
    } else {
      const reference = geoMercator().rotate([-37, 0]).scale(1).translate([0, 0]);
      const bounds = geoPath(reference).bounds({
        type: 'MultiPoint',
        coordinates: [origin, ...connections].map(item => item.coordinates),
      });
      midpoint = reference.invert([
        (bounds[0][0] + bounds[1][0]) / 2,
        (bounds[0][1] + bounds[1][1]) / 2,
      ]);
      const spanX = Math.min(960, 660 * mapAspect);
      const spanY = Math.min(660, 960 / mapAspect);
      scale =
        0.8 *
        Math.min(
          Math.max(100, spanX * (1 - 2 * mapSideInset) - 220) / (bounds[1][0] - bounds[0][0]),
          Math.max(100, spanY - 180) / (bounds[1][1] - bounds[0][1])
        );
    }
    const center = mapCenter ?? midpoint;
    return geoMercator()
      .translate([480, 330])
      .scale(scale * zoom)
      .rotate([-center[0], 0])
      .center([0, center[1]])
      .clipExtent([
        [480 - Math.min(960, 660 * mapAspect) / 2, 330 - Math.min(660, 960 / mapAspect) / 2],
        [480 + Math.min(960, 660 * mapAspect) / 2, 330 + Math.min(660, 960 / mapAspect) / 2],
      ]);
  }, [mode, rotation, zoom, selectedCountry, mapAspect, mapCenter, mapSideInset]);
  const outlines = useMemo(() => {
    const draw = geoPath(projection);
    return {
      land: mode === 'map' || !surfaceReady ? draw(surfaceReady ? coastline : geography) : null,
      countries: mode === 'map' || !surfaceReady ? draw(countryBorders) : null,
      grid: draw(graticule),
      sphere: draw(sphere),
    };
  }, [projection, mode, surfaceReady]);
  const select = item => {
    setSelectedId(item.id);
    setSelectedCountryCode(item.countryCode);
    setOriginFocused(false);
    setMode('map');
    setMapCenter(null);
    setZoom(1);
  };
  const selectCountry = code => {
    if (!countryByCode.has(code)) return;
    setSelectedCountryCode(code);
    setSelectedId(null);
    setOriginFocused(false);
    setMode('map');
    setMapCenter(null);
    setZoom(1);
    setQuery('');
  };
  const selectOrigin = () => {
    selectCountry(origin.countryCode);
    setOriginFocused(true);
  };
  const showAll = () => {
    setRotation([-112, -23]);
    setZoom(1);
    setSelectedId(null);
    setSelectedCountryCode(null);
    setOriginFocused(false);
    setMapCenter(null);
    setQuery('');
  };
  const reset = () => {
    setMode('globe');
    showAll();
  };

  return (
    <main className="network-page" aria-label="AI 통신 지도">
      <div className="network-workspace">
        <section
          className="network-visual"
          aria-label={mode === 'globe' ? 'AI 통신 지구본' : 'AI 통신 평면지도'}
        >
          <div className="network-map-heading">
            <div className="network-view-switch" role="group" aria-label="지도 표시 방식">
              <button
                type="button"
                aria-pressed={mode === 'globe'}
                onClick={() => {
                  setMode('globe');
                  setZoom(1);
                }}
              >
                <Globe2 size={15} />
                지구본
              </button>
              <button
                type="button"
                aria-pressed={mode === 'map'}
                onClick={() => {
                  setMode('map');
                  setZoom(1);
                }}
              >
                <Map size={15} />
                평면지도
              </button>
            </div>
          </div>
          <div
            ref={stageRef}
            className={`network-map-stage ${mode}${surfaceReady ? ' surface-ready' : ''}`}
          >
            <NetworkSurface mode={mode} projection={projection} onReady={setSurfaceReady} />
            <svg
              className={`network-map ${mode}`}
              viewBox="0 0 960 660"
              preserveAspectRatio={mode === 'map' ? 'xMidYMid slice' : 'xMidYMid meet'}
              role="img"
              aria-label={`KNU AIDC에서 ${connections.map(item => item.city).join(', ')}에 연결되는 예시 경로. 아래 목적지 목록에서 선택할 수 있습니다.`}
              onPointerDown={event => {
                if (event.button !== 0 || !event.isPrimary) return;
                dragRef.current = {
                  pointerId: event.pointerId,
                  x: event.clientX,
                  y: event.clientY,
                  projection,
                  rotation,
                  moved: false,
                };
              }}
              onPointerMove={event => {
                const drag = dragRef.current;
                if (!drag || drag.pointerId !== event.pointerId) return;
                const dx = event.clientX - drag.x;
                const dy = event.clientY - drag.y;
                if (!drag.moved && Math.hypot(dx, dy) < 4) return;
                drag.moved = true;
                event.currentTarget.setPointerCapture(event.pointerId);
                event.currentTarget.dataset.dragging = 'true';
                if (mode === 'globe') {
                  setRotation([
                    drag.rotation[0] + dx * 0.3,
                    Math.max(-80, Math.min(80, drag.rotation[1] - dy * 0.3)),
                  ]);
                } else {
                  const matrix = event.currentTarget.getScreenCTM();
                  if (!matrix) return;
                  const inverse = matrix.inverse();
                  const start = new DOMPoint(drag.x, drag.y).matrixTransform(inverse);
                  const end = new DOMPoint(event.clientX, event.clientY).matrixTransform(inverse);
                  const center = drag.projection.invert([
                    480 - (end.x - start.x),
                    330 - (end.y - start.y),
                  ]);
                  setMapCenter([center[0], Math.max(-80, Math.min(80, center[1]))]);
                }
              }}
              onPointerUp={event => {
                if (event.currentTarget.hasPointerCapture(event.pointerId))
                  event.currentTarget.releasePointerCapture(event.pointerId);
                delete event.currentTarget.dataset.dragging;
                if (!dragRef.current?.moved) dragRef.current = null;
              }}
              onPointerCancel={event => {
                dragRef.current = null;
                delete event.currentTarget.dataset.dragging;
              }}
              onPointerLeave={event => {
                if (!event.currentTarget.hasPointerCapture(event.pointerId)) dragRef.current = null;
              }}
              onClickCapture={event => {
                if (dragRef.current?.moved) {
                  event.preventDefault();
                  event.stopPropagation();
                  dragRef.current = null;
                }
              }}
              onClick={event => {
                if (event.target.closest('[data-destination], .network-origin-point')) return;
                const matrix = event.currentTarget.getScreenCTM();
                if (!matrix) return;
                const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
                  matrix.inverse()
                );
                if (
                  mode === 'globe' &&
                  Math.hypot(point.x - 480, point.y - 330) > projection.scale()
                )
                  return;
                const coordinates = projection.invert([point.x, point.y]);
                if (!coordinates || coordinates.some(value => !Number.isFinite(value))) return;
                const country = countryFeatures.find(feature => geoContains(feature, coordinates));
                if (country) selectCountry(country.properties.code);
              }}
            >
              <defs>
                <clipPath id={clipId}>
                  <rect width="960" height="660" />
                </clipPath>
                <radialGradient id={`${clipId}-ocean`} cx="35%" cy="30%">
                  <stop stopColor="#285f85" />
                  <stop offset="1" stopColor="#12344f" />
                </radialGradient>
                <linearGradient id={`${clipId}-land`} x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#6e9d9b" />
                  <stop offset="1" stopColor="#315a73" />
                </linearGradient>
              </defs>
              <g clipPath={`url(#${clipId})`}>
                {mode === 'globe' && (
                  <g aria-hidden="true" className="network-stars">
                    {stars
                      .filter(
                        star => Math.hypot(star.x - 480, star.y - 330) > projection.scale() + 22
                      )
                      .map((star, index) => (
                        <circle
                          key={index}
                          cx={star.x}
                          cy={star.y}
                          r={star.r}
                          fill="#b3d3f2"
                          opacity={index % 3 === 0 ? 0.45 : 0.2}
                        />
                      ))}
                  </g>
                )}
                <path
                  className="network-ocean"
                  d={outlines.sphere}
                  fill={surfaceReady ? 'none' : `url(#${clipId}-ocean)`}
                  stroke={mode === 'globe' && !surfaceReady ? '#94d5fa' : 'none'}
                  strokeOpacity=".5"
                  strokeWidth="1"
                />
                <path
                  d={outlines.grid}
                  fill="none"
                  stroke="#9cc8e4"
                  strokeOpacity={mode === 'globe' ? '.08' : '.13'}
                  strokeWidth=".6"
                />
                <path
                  d={outlines.land}
                  fill={surfaceReady ? 'none' : `url(#${clipId}-land)`}
                  stroke="#b4d6df"
                  strokeOpacity={surfaceReady ? '.27' : '.7'}
                  strokeWidth=".55"
                />
                <path
                  d={outlines.countries}
                  fill="none"
                  stroke="#b6d8e0"
                  strokeOpacity={mode === 'globe' ? '.13' : '.32'}
                  strokeWidth=".55"
                  strokeDasharray={mode === 'map' ? '2 2' : undefined}
                />
                {mode === 'map' && selectedCountry && (
                  <path
                    d={geoPath(projection)(selectedCountry)}
                    className="network-country-highlight"
                    fill="#78bbf11a"
                    stroke="#9dd6ff"
                    strokeWidth=".9"
                    pointerEvents="none"
                  />
                )}
                {mode === 'map' && (
                  <g className="network-country-labels" aria-hidden="true">
                    {countryLabels.map(([name, coordinates]) => {
                      const point = projection(coordinates);
                      if (
                        point[0] < 30 ||
                        point[0] > 930 ||
                        point[1] < 50 ||
                        point[1] > 630 ||
                        [origin, ...connections].some(item => {
                          const p = projection(item.coordinates);
                          return Math.hypot(p[0] - point[0], p[1] - point[1]) < 45;
                        })
                      )
                        return null;
                      return (
                        <text key={name} x={point[0]} y={point[1]} textAnchor="middle">
                          {name}
                        </text>
                      );
                    })}
                  </g>
                )}
                <ConnectionOverlay
                  projection={projection}
                  mode={mode}
                  rotation={rotation}
                  selectedId={selectedId}
                  onSelect={select}
                  onSelectOrigin={selectOrigin}
                  idPrefix={clipId}
                  screenScale={
                    mode === 'map'
                      ? Math.max(stageSize[0] / 960, stageSize[1] / 660)
                      : Math.min(stageSize[0] / 960, stageSize[1] / 660)
                  }
                />
              </g>
            </svg>
          </div>
          <div className="network-map-footer">
            <div className="network-map-tools">
              <button
                type="button"
                aria-label="지도 확대"
                disabled={zoom >= MAX_ZOOM}
                onClick={() => setZoom(value => clampZoom(value + 0.2))}
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                aria-label="지도 축소"
                disabled={zoom <= MIN_ZOOM}
                onClick={() => setZoom(value => clampZoom(value - 0.2))}
              >
                <Minus size={16} />
              </button>
              <button type="button" aria-label="전체 지구본으로 초기화" onClick={reset}>
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </section>
        <aside className="network-destinations network-info-panel" aria-label="통신 목적지">
          <header>
            <h2>국가 · 통신 지점</h2>
            <span>{countryGroups.length}개 국가</span>
          </header>
          <label className="network-search">
            <Search size={16} aria-hidden="true" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="지역 또는 서비스 검색"
              aria-label="통신 목적지 검색"
            />
          </label>
          <button
            type="button"
            className="network-overview-button"
            aria-pressed={!selectedCountryCode}
            onClick={showAll}
          >
            <Globe2 size={17} aria-hidden="true" />
            <span>전체 보기</span>
            <small>
              {new Set([origin.countryCode, ...connections.map(item => item.countryCode)]).size}개
              국가
            </small>
          </button>
          <div className="network-destination-list network-country-list">
            {countryGroups.map(({ country, sites, status }) => (
              <section key={country.properties.code} className="network-country-group">
                <button
                  type="button"
                  className="network-country-trigger"
                  aria-pressed={selectedCountryCode === country.properties.code}
                  onClick={() => selectCountry(country.properties.code)}
                >
                  <i style={{ background: status.color }} aria-hidden="true" />
                  <span>
                    <strong>{country.properties.name}</strong>
                    <span>
                      {sites.length}개 통신 지점
                      {' · '}
                      <span style={{ color: status.color }}>{status.label}</span>
                    </span>
                  </span>
                  {selectedCountryCode === country.properties.code || query.trim() ? (
                    <ChevronDown size={14} aria-hidden="true" />
                  ) : (
                    <ChevronRight size={14} aria-hidden="true" />
                  )}
                </button>
                {(selectedCountryCode === country.properties.code || query.trim()) && (
                  <div className="network-country-locations">
                    {country.properties.code === origin.countryCode && (
                      <button type="button" aria-pressed={originFocused} onClick={selectOrigin}>
                        <i style={{ background: getConnectionStatus(origin.status).color }} />
                        <span>
                          <strong>{origin.city}</strong>
                          <span>{origin.name} · 출발지</span>
                        </span>
                        <ArrowUpRight size={14} />
                      </button>
                    )}
                    {sites.map(item => (
                      <button
                        type="button"
                        key={item.id}
                        aria-pressed={selectedId === item.id}
                        onClick={() => select(item)}
                      >
                        <i style={{ background: getConnectionStatus(item.status).color }} />
                        <span>
                          <strong>{item.city}</strong>
                          <span>
                            {item.region} · {item.service}
                          </span>
                        </span>
                        <ArrowUpRight size={14} />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            ))}
            {!countryGroups.length && <p className="network-empty">검색 결과가 없습니다.</p>}
          </div>
        </aside>
        <CountryConnectionDetails
          country={selectedCountry}
          sites={countrySites}
          selected={selected}
          originFocused={originFocused}
          onSelect={select}
          onSelectOrigin={selectOrigin}
          onCountry={selectCountry}
          onOverview={showAll}
        />
      </div>
    </main>
  );
}
