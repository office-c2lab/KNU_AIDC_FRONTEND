import { useMemo } from 'react';
import { Server } from 'lucide-react';
import { geoDistance, geoInterpolate } from 'd3-geo';
import { connections, origin, getConnectionStatus } from './networkData.js';

function globeArc(projection, destination, rotation, inbound) {
  const interpolate = inbound
    ? geoInterpolate(destination, origin.coordinates)
    : geoInterpolate(origin.coordinates, destination);
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
function mapArc(projection, destination, inbound) {
  const [x1, y1] = projection(inbound ? destination : origin.coordinates);
  const [x2, y2] = projection(inbound ? origin.coordinates : destination);
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
      {hub ? (
        <g className="network-origin-server" transform={`scale(${labelScale})`}>
          <rect
            x="-15"
            y="-15"
            width="30"
            height="30"
            rx="6"
            fill="#071423"
            stroke={color}
            strokeWidth="1"
          />
          <Server x={-10} y={-10} size={20} color={color} strokeWidth={1.5} />
        </g>
      ) : (
        <circle r="5" fill={color} transform={`scale(${labelScale})`} />
      )}
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
        <circle cx="7" cy="12" r="2" fill={color} />
        <text className="network-point-name" x="15" y="16" fill="#eef7ff">
          {label}
        </text>
        <text className="network-point-detail" x="15" y="30" fill={color}>
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
  onSelectOrigin,
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
          ? globeArc(projection, item.coordinates, rotation, item.flow === 'inbound')
          : mapArc(projection, item.coordinates, item.flow === 'inbound'),
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
            x1={item.flow === 'inbound' ? point[0] : originPoint[0]}
            y1={item.flow === 'inbound' ? point[1] : originPoint[1]}
            x2={item.flow === 'inbound' ? originPoint[0] : point[0]}
            y2={item.flow === 'inbound' ? originPoint[1] : point[1]}
          >
            <stop stopColor={getConnectionStatus(item.status).color} stopOpacity=".65" />
            <stop
              offset=".35"
              stopColor={getConnectionStatus(item.status).color}
              stopOpacity=".8"
            />
            <stop offset="1" stopColor={getConnectionStatus(item.status).color} />
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
                '--connection-color': getConnectionStatus(item.status).color,
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
                stroke={getConnectionStatus(item.status).color}
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
                    stroke={getConnectionStatus(item.status).color}
                    strokeWidth="3.5"
                    strokeOpacity=".35"
                    strokeDasharray="4 96"
                  />
                  <path
                    className="network-route-flow"
                    d={path}
                    fill="none"
                    pathLength="100"
                    stroke={getConnectionStatus(item.status).color}
                    strokeWidth={selected ? 1.8 : 1.4}
                    strokeDasharray="1 99"
                  />
                  {item.flow === 'bidirectional' && (
                    <path
                      className="network-route-flow network-route-reverse"
                      d={path}
                      fill="none"
                      pathLength="100"
                      stroke={getConnectionStatus(item.status).color}
                      strokeOpacity=".8"
                      strokeWidth="1.2"
                      strokeDasharray="1 99"
                    />
                  )}
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
                detail={`${item.latency} ms · ${item.status === 'warning' ? '지연 주의' : item.flow === 'inbound' ? '수신' : item.flow === 'outbound' ? '송신' : '송수신'}`}
                color={getConnectionStatus(item.status).color}
                selected={item.id === selectedId}
                compact={mode === 'map'}
                screenScale={screenScale}
              />
            </g>
          ))}
        {visible(origin.coordinates) && (
          <g className="network-origin-point" onClick={onSelectOrigin}>
            <NetworkPoint
              point={originPoint}
              label={origin.name}
              detail={`출발지 · ${origin.city}`}
              color="#9fdcff"
              hub
              compact={mode === 'map'}
              screenScale={screenScale}
            />
          </g>
        )}
      </g>
    </>
  );
}
