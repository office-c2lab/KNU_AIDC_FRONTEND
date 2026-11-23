import { useMemo } from 'react';
import { geoDistance, geoInterpolate } from 'd3-geo';
import { connections, origin } from './networkData.js';

function globeArc(projection, destination, rotation) {
  const interpolate = geoInterpolate(origin.coordinates, destination);
  const distance = geoDistance(origin.coordinates, destination);
  let drawing = false;
  let result = '';
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const coordinates = interpolate(t);
    const lift = 1 + Math.sin(t * Math.PI) * Math.min(0.22, distance * 0.1);
    const angle = geoDistance(coordinates, [-rotation[0], -rotation[1]]);
    if (angle >= Math.PI / 2 && lift * Math.sin(angle) <= 1.001) {
      drawing = false;
      continue;
    }
    const [x, y] = projection(coordinates);
    result += `${drawing ? 'L' : 'M'}${(480 + (x - 480) * lift).toFixed(2)},${(330 + (y - 330) * lift).toFixed(2)}`;
    drawing = true;
  }
  return result || undefined;
}

// Map links are conceptual connections, not geographic cable routes. Draw in
// projected space so an antimeridian cut cannot split a visible endpoint pair.
function mapArc(projection, destination) {
  const [x1, y1] = projection(origin.coordinates);
  const [x2, y2] = projection(destination);
  const bend = Math.min(55, Math.hypot(x2 - x1, y2 - y1) * 0.14);
  return `M${x1.toFixed(2)},${y1.toFixed(2)}Q${((x1 + x2) / 2).toFixed(2)},${((y1 + y2) / 2 - bend).toFixed(2)},${x2.toFixed(2)},${y2.toFixed(2)}`;
}

function NetworkPoint({
  point,
  label,
  detail,
  color,
  hub = false,
  selected = false,
  compact = false,
  screenScale = 1,
}) {
  const width = Math.max(100, label.length * 14 + 32);
  const labelScale = 1 / Math.max(0.1, screenScale);
  const gap = compact ? 18 : 24;
  const left = hub || (point[0] < 480 && point[0] > 130) || point[0] > 810;
  const labelX = left ? -width * labelScale - gap : gap;
  const labelY = hub ? (compact ? 13 : 17) : -39 * labelScale;
  return (
    <g
      className={`network-point${hub ? ' hub' : ''}${selected ? ' selected' : ''}`}
      transform={`translate(${point.join(',')})`}
      style={{ '--connection-color': color }}
    >
      <circle r="20" fill="transparent" className="network-point-target" />
      <circle
        className="network-node-pulse"
        r={hub ? 18 : 13}
        fill="none"
        stroke={color}
        strokeOpacity=".3"
        strokeWidth=".8"
      />
      <circle
        r={hub ? 13 : 9}
        fill="#071423"
        stroke={color}
        strokeOpacity={hub || selected ? '.95' : '.65'}
        strokeWidth="1"
      />
      {hub ? (
        <>
          <rect
            x="-5"
            y="-5"
            width="10"
            height="10"
            rx="1.5"
            transform="rotate(45)"
            fill="#c5efff"
          />
          <circle r="2.4" fill="#2a6a8d" />
          <path d="M-18 0h3M15 0h3M0-18v3M0 15v3" fill="none" stroke="#bce8ff" strokeWidth="1" />
        </>
      ) : (
        <>
          <circle r="4" fill={color} />
          <circle cx="-1" cy="-1" r="1.2" fill="#fff" fillOpacity=".85" />
          {selected && (
            <circle r="13" fill="none" stroke={color} strokeWidth="1" strokeDasharray="3 3" />
          )}
        </>
      )}
      <path
        d={
          hub
            ? `M${left ? -12 : 12} 8L${left ? -gap : gap} ${compact ? 22 : 24}`
            : `M${left ? -9 : 9} -5L${left ? -gap + 4 : gap - 4} ${-19 * labelScale}H${left ? -gap : gap}`
        }
        fill="none"
        stroke={color}
        strokeOpacity=".6"
        strokeWidth=".8"
      />
      <g
        className="network-point-label"
        transform={`translate(${labelX},${labelY}) scale(${labelScale})`}
      >
        <rect
          className="network-point-label-bg"
          width={width}
          height="39"
          rx="4"
          fill="#071422"
          fillOpacity=".94"
          stroke={color}
          strokeOpacity={hub || selected ? '.65' : '.28'}
          strokeWidth=".7"
        />
        <rect x="0" y="10" width="2" height="19" rx="1" fill={color} />
        <text className="network-point-name" x="11" y="16" fill="#eef7ff">
          {label}
        </text>
        <text className="network-point-detail" x="11" y="30" fill={color}>
          {detail}
        </text>
      </g>
    </g>
  );
}

export default function ConnectionOverlay({
  projection,
  mode,
  rotation,
  selectedId,
  onSelect,
  idPrefix,
  screenScale = 1,
}) {
  const originPoint = projection(origin.coordinates);
  const visible = coordinates =>
    mode === 'map' || geoDistance(coordinates, [-rotation[0], -rotation[1]]) < Math.PI / 2;
  const routes = useMemo(() => {
    return connections.map((item, index) => ({
      item,
      index,
      point: projection(item.coordinates),
      path:
        mode === 'globe'
          ? globeArc(projection, item.coordinates, rotation)
          : mapArc(projection, item.coordinates),
    }));
  }, [projection, mode, rotation]);

  return (
    <>
      <defs>
        {routes.map(({ item, point }) => (
          <linearGradient
            key={item.id}
            id={`${idPrefix}-route-${item.id}`}
            gradientUnits="userSpaceOnUse"
            x1={originPoint[0]}
            y1={originPoint[1]}
            x2={point[0]}
            y2={point[1]}
          >
            <stop stopColor="#a8ddff" stopOpacity=".65" />
            <stop offset=".35" stopColor={item.color} stopOpacity=".8" />
            <stop offset="1" stopColor={item.color} />
          </linearGradient>
        ))}
      </defs>
      <g className="network-connections">
        {routes.map(({ item, index, path }) => {
          const selected = item.id === selectedId;
          return (
            <g
              key={item.id}
              className={`network-route${selected ? ' selected' : ''}`}
              data-destination={item.id}
              opacity={!selectedId || selected ? 1 : 0.24}
              onClick={() => onSelect(item)}
              style={{
                '--connection-color': item.color,
                '--flow-duration': `${3.2 + index * 0.5}s`,
                '--flow-delay': `${-index * 0.7}s`,
              }}
            >
              <path
                className="network-route-target"
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth="20"
              />
              <path
                d={path}
                fill="none"
                stroke="#020a13"
                strokeOpacity=".75"
                strokeWidth={selected ? 4.7 : 3.8}
              />
              <path
                d={path}
                fill="none"
                stroke={item.color}
                strokeWidth={selected ? 5 : 3}
                strokeOpacity={selected ? '.15' : '.08'}
              />
              <path
                className="network-route-line"
                d={path}
                fill="none"
                stroke={`url(#${idPrefix}-route-${item.id})`}
                strokeWidth={selected ? 2 : 1.3}
                strokeDasharray={item.status === 'warning' ? '6 4' : undefined}
              />
              {path && (
                <>
                  <path
                    className="network-route-flow network-route-tail"
                    d={path}
                    fill="none"
                    pathLength="100"
                    stroke={item.color}
                    strokeWidth="3.5"
                    strokeOpacity=".35"
                    strokeDasharray="4 96"
                  />
                  <path
                    className="network-route-flow"
                    d={path}
                    fill="none"
                    pathLength="100"
                    stroke="#edfbff"
                    strokeWidth={selected ? 1.8 : 1.4}
                    strokeDasharray="1 99"
                  />
                </>
              )}
            </g>
          );
        })}
      </g>
      <g className="network-points">
        {routes
          .filter(({ item }) => visible(item.coordinates))
          .map(({ item, point }) => (
            <g
              key={item.id}
              className="network-destination-point"
              data-destination={item.id}
              opacity={!selectedId || item.id === selectedId ? 1 : 0.3}
              onClick={() => onSelect(item)}
            >
              <NetworkPoint
                point={point}
                label={item.city}
                detail={`${item.latency} ms${item.status === 'warning' ? ' · 지연 주의' : ' · 연결됨'}`}
                color={item.color}
                selected={item.id === selectedId}
                compact={mode === 'map'}
                screenScale={screenScale}
              />
            </g>
          ))}
        {visible(origin.coordinates) && (
          <NetworkPoint
            point={originPoint}
            label="KNU AIDC"
            detail="출발지 · 대구"
            color="#9fdcff"
            hub
            compact={mode === 'map'}
            screenScale={screenScale}
          />
        )}
      </g>
    </>
  );
}
