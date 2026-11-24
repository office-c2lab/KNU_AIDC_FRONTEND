import { connections, origin } from './networkData.js';

// Fixed example events, not observed traffic. No polling or simulated live timer.
const exampleTime = 14 * 3600 + 32 * 60 + 8;
export const connectionHistory = connections
  .flatMap((site, index) =>
    [0, 90, 180, 270, 360].flatMap(offset => {
      const time = exampleTime - index * 7 - offset;
      const inbound = site.flow === 'inbound';
      const bidirectional = site.flow === 'bidirectional';
      const requestRoute = inbound
        ? `${site.city} → ${origin.city}`
        : `${origin.city} → ${site.city}`;
      const responseRoute = bidirectional ? `${site.city} → ${origin.city}` : requestRoute;
      return [
        {
          id: `${site.id}-${offset}-start`,
          connectionId: site.id,
          time: time - 2,
          status: 'normal',
          title: inbound ? '데이터 수신 시작' : bidirectional ? '요청 송신' : '데이터 전송 시작',
          route: requestRoute,
          detail: site.service,
        },
        {
          id: `${site.id}-${offset}-result`,
          connectionId: site.id,
          time,
          status: site.status,
          title:
            site.status === 'error'
              ? '응답 시간 초과'
              : site.status === 'warning'
                ? '응답 지연'
                : inbound
                  ? '데이터 수신 완료'
                  : bidirectional
                    ? '응답 수신 완료'
                    : '데이터 전송 완료',
          route: responseRoute,
          detail:
            site.status === 'error'
              ? `${site.service} · 처리 실패`
              : `${site.service} · ${site.latency} ms`,
        },
      ];
    })
  )
  .sort((a, b) => b.time - a.time || a.id.localeCompare(b.id));

export const formatHistoryTime = seconds =>
  [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
    .map(value => String(value).padStart(2, '0'))
    .join(':');
