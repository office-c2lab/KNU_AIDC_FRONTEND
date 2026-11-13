import { assertContext } from '../core/assertContext.js';

export function createIncidentSelectors({ clock, activeIncidents, scenarioById }) {
  assertContext(
    { clock, activeIncidents, scenarioById },
    ['clock', 'activeIncidents', 'scenarioById'],
    'createIncidentSelectors'
  );
  function getAssetIssues(id) {
    const result = [];
    for (const incident of activeIncidents.values()) {
      const scenario = scenarioById.get(incident.id);
      if (scenario.asset === id) {
        result.push({
          scenario,
          incident,
          state: scenario.status,
          primary: true,
          reason: scenario.condition,
        });
      }
      for (const related of scenario.related) {
        if (related.id === id) {
          result.push({
            scenario,
            incident,
            state: related.state,
            primary: false,
            reason: related.why,
          });
        }
      }
    }
    return result;
  }

  function severityRank(state) {
    return state === '장애' || state === '보안 경보' ? 3 : state === '주의' ? 2 : 0;
  }

  function getAssetStatus(asset) {
    if (!asset) return '정상';
    return getAssetIssues(asset.id).reduce(
      (best, item) => (severityRank(item.state) > severityRank(best) ? item.state : best),
      '정상'
    );
  }

  function getSensor(asset) {
    const time = clock.elapsedTime;
    let tempDelta = 0;
    let powerDelta = 0;

    for (const issue of getAssetIssues(asset.id)) {
      const scenario = issue.scenario;
      if (issue.primary) {
        tempDelta += scenario.temp || 0;
        powerDelta += scenario.power || 0;
      } else if (scenario.id === 'cdu' && asset.id.startsWith('LIQ-GPU')) tempDelta += 5.7;
      else if (scenario.id === 'chiller' && asset.id === 'CDU-01') tempDelta += 3.8;
      else if (scenario.id === 'gpu' && asset.id === 'GPU-02') tempDelta += 2.5;
    }

    return {
      temp: (asset.temp || 22) + tempDelta + Math.sin(time * 0.24 + asset.id.length) * 0.16,
      power: Math.max(0, (asset.power || 0) + powerDelta),
    };
  }

  function statusHtml(status) {
    const className = severityRank(status) === 3 ? 'danger' : status === '주의' ? 'warning' : '';
    const label =
      status === '장애'
        ? '장애 발생'
        : status === '보안 경보'
          ? '보안 경보'
          : status === '주의'
            ? '주의 필요'
            : '정상 운영 중';
    return `<span class="state-pill ${className}">${label}</span>`;
  }

  return { getAssetIssues, severityRank, getAssetStatus, getSensor, statusHtml };
}
