export const OPERATING_SAMPLE_SECONDS = 2;
export const HISTORY_RETENTION_SECONDS = 3600;
export const HISTORY_MAX_SAMPLES = HISTORY_RETENTION_SECONDS / OPERATING_SAMPLE_SECONDS + 1;

function appendSample(history, point, now) {
  const last = history.at(-1);
  // Never rewrite old samples, even if a scenario changes at the same virtual time.
  if (last && last.simulationTime >= point.simulationTime) return history;
  return [
    ...history.filter(item => item.simulationTime >= now - HISTORY_RETENTION_SECONDS),
    point,
  ].slice(-HISTORY_MAX_SAMPLES);
}

export function recordOperatingHistory(previous, snapshot, simulationTime) {
  const byAsset = {};
  for (const reading of Object.values(snapshot.byAsset)) {
    const point = { simulationTime, temp: reading.temp, power: reading.power };
    if (Number.isFinite(reading.cpuPercent)) point.cpuPercent = reading.cpuPercent;
    if (Number.isFinite(reading.gpuPercent)) point.gpuPercent = reading.gpuPercent;
    byAsset[reading.id] = appendSample(previous.byAsset[reading.id] ?? [], point, simulationTime);
  }
  const {
    total,
    normal,
    warning,
    fault,
    averageCpuPercent,
    averageGpuPercent,
    totalPowerKw,
    alarmCount,
  } = snapshot.summary;
  const summary = appendSample(
    previous.summary,
    {
      simulationTime,
      total,
      normal,
      warning,
      fault,
      averageCpuPercent,
      averageGpuPercent,
      totalPowerKw,
      alarmCount,
    },
    simulationTime
  );
  return { byAsset, summary };
}

export function reconcileOperatingHistory(previous, snapshot, simulationTime) {
  const byAsset = {};
  for (const id of Object.keys(snapshot.byAsset)) {
    const existing = previous.byAsset[id];
    if (existing) byAsset[id] = existing;
    else
      byAsset[id] = recordOperatingHistory(
        { byAsset: {}, summary: [] },
        { ...snapshot, byAsset: { [id]: snapshot.byAsset[id] } },
        simulationTime
      ).byAsset[id];
  }
  return { byAsset, summary: previous.summary };
}
