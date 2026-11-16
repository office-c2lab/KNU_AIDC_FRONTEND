import { AI_SERVICE_PROFILE, getOperatingProfile } from '../config/operatingProfiles.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export function createOperatingTelemetry(
  asset,
  { time = 0, sensor, status, issues = [], energyKwh = 0 }
) {
  if (asset.type === 'AI AGENT') return null;
  const profile = getOperatingProfile(asset);
  const seed = [...asset.id].reduce((hash, ch) => (hash * 31 + ch.charCodeAt(0)) >>> 0, 17);
  const wave = (base, amplitude, speed = 0.13) =>
    base + Math.sin(time * speed + (seed % 100)) * amplitude;
  const severity = status === '정상' ? 0 : status === '주의' ? 1 : 2;
  const primaryFailure = issues.some(issue => issue.primary && issue.state !== '정상');
  const stopped = sensor.power <= 0 || (profile.category === 'server' && primaryFailure);
  const load = clamp(wave(asset.capacity ?? 60, 4) + severity * 3, 0, 100);
  const values = {
    loadPercent: stopped ? 0 : load,
    operatingState: stopped
      ? asset.type === 'BACKUP GENERATOR' && !severity
        ? '대기'
        : '정지'
      : severity
        ? '성능 저하'
        : '운영 중',
    energyKwh: Math.max(0, energyKwh),
  };
  if (profile.category === 'support' && !stopped && severity) {
    values.operatingState = status === '보안 경보' ? '보안 확인' : '점검 필요';
  }
  if (profile.category === 'server') {
    values.cpuPercent = stopped ? 0 : clamp(wave(45 + (seed % 30), 8) + severity * 8, 0, 100);
    values.memoryTotalGiB = seed % 2 ? 256 : 512;
    values.memoryUsedGiB =
      (values.memoryTotalGiB * (stopped ? 0 : clamp(wave(58, 4) + severity * 5, 0, 100))) / 100;
    values.diskTotalTiB = seed % 2 ? 8 : 16;
    values.diskUsedTiB = (values.diskTotalTiB * clamp(wave(62, 0.5, 0.003), 0, 100)) / 100;
  } else if (profile.category === 'storage') {
    values.storageTotalTiB = seed % 2 ? 128 : 256;
    values.storageUsedPercent = clamp(wave(58 + (seed % 20), 0.6, 0.005), 0, 100);
    const availability = stopped ? 0 : severity === 2 ? 0.15 : severity ? 0.6 : 1;
    values.readMiBps = Math.max(0, wave(1200 + (seed % 800), 180)) * availability;
    values.writeMiBps = Math.max(0, wave(700 + (seed % 500), 110, 0.17)) * availability;
  } else if (profile.category === 'network') {
    values.portsTotal = seed % 2 ? 24 : 48;
    values.portsUp = Math.max(0, values.portsTotal - (severity === 2 ? 4 : severity ? 1 : 0));
    values.linkState = severity === 2 || stopped ? '단절' : severity ? '불안정' : '연결';
    const availability = values.linkState === '단절' ? 0 : severity ? 0.6 : 1;
    values.receiveMbps = clamp(wave(1800 + (seed % 2000), 350), 0, 10000) * availability;
    values.transmitMbps = clamp(wave(1100 + (seed % 1400), 240, 0.19), 0, 10000) * availability;
    if (stopped) values.portsUp = 0;
  } else if (profile.category === 'gpu') {
    values.gpuPercent = stopped ? 0 : load;
    values.totalGpus = 8;
    values.allocatedGpus = stopped
      ? 0
      : Math.min(Math.ceil((load / 100) * values.totalGpus), severity === 2 ? 4 : severity ? 6 : 8);
    values.vramTotalGiB = values.totalGpus * 80;
    values.vramUsedGiB =
      (values.vramTotalGiB * (stopped ? 0 : clamp(wave(70, 5) + severity * 4, 0, 100))) / 100;
    // Chip temperature is a distinct virtual sensor from the existing rack/inlet reading.
    values.gpuChipTempC = clamp(
      45 + load * 0.35 + (sensor.temp - (asset.temp ?? 22)) * 2.4,
      20,
      115
    );
    values.modelName = `가상 추론 모델 ${(seed % 3) + 1}`;
    values.serviceState = stopped ? '중단' : severity ? '지연' : '정상';
    values.requestsPerMinute = stopped
      ? 0
      : Math.max(0, Math.round(wave(1800 + (seed % 1000), 160) * (severity ? 0.4 : 1)));
  } else if (profile.category === 'facility') {
    values.humidityPercent = clamp(wave(46 + (seed % 4), 1.2, 0.04) + severity * 1.5, 0, 100);
    values.upsLoadPercent = stopped ? 0 : load;
    values.batteryPercent = clamp(wave(severity ? 71 : 96, 0.4, 0.02), 0, 100);
    values.coolingCop = Math.max(0, stopped ? 0 : wave(4.4, 0.15, 0.07) - severity * 1.1);
    values.flowLitersPerMinute = Math.max(
      0,
      stopped ? 0 : wave(148, 5) * (severity === 2 ? 0.45 : severity ? 0.75 : 1)
    );
  }
  const makeGroup = ({ title, fields }) => ({
    title,
    metrics: fields.map(field => ({
      key: field.key,
      label: field.label,
      value:
        typeof values[field.key] === 'number'
          ? `${values[field.key].toFixed(field.digits)}${field.totalKey ? ` / ${values[field.totalKey].toFixed(field.digits)}` : ''}${field.unit ? ` ${field.unit}` : ''}`
          : values[field.key],
    })),
  });
  const groups = [makeGroup(profile)];
  // No standalone AI-service assets exist: represent a virtual hosted service on GPU racks.
  if (profile.category === 'gpu') groups.push(makeGroup(AI_SERVICE_PROFILE));
  return { category: profile.category, simulated: true, simulationTime: time, values, groups };
}
