// Virtual operating specifications, not manufacturer specifications or real telemetry.
// Capacity uses binary GiB/TiB; traffic uses Mbps; energy uses kWh.
const field = (key, label, unit = '', digits = 1, totalKey) => ({
  key,
  label,
  unit,
  digits,
  totalKey,
});
const profiles = {
  server: {
    title: '서버 운영',
    fields: [
      field('cpuPercent', 'CPU 사용률', '%'),
      field('memoryUsedGiB', '메모리', 'GiB', 1, 'memoryTotalGiB'),
      field('diskUsedTiB', '디스크', 'TiB', 2, 'diskTotalTiB'),
      field('operatingState', '가동 상태'),
    ],
  },
  storage: {
    title: '스토리지 운영',
    fields: [
      field('storageTotalTiB', '총용량', 'TiB', 0),
      field('storageUsedPercent', '사용률', '%'),
      field('readMiBps', '읽기 속도', 'MiB/s'),
      field('writeMiBps', '쓰기 속도', 'MiB/s'),
    ],
  },
  network: {
    title: '네트워크 운영',
    fields: [
      field('portsUp', '정상 포트', '개', 0, 'portsTotal'),
      field('receiveMbps', '수신 트래픽', 'Mbps'),
      field('transmitMbps', '송신 트래픽', 'Mbps'),
      field('linkState', '링크 연결'),
    ],
  },
  gpu: {
    title: 'GPU 운영',
    fields: [
      field('gpuPercent', 'GPU 사용률', '%'),
      field('vramUsedGiB', 'VRAM', 'GiB', 1, 'vramTotalGiB'),
      field('gpuChipTempC', 'GPU 칩 온도', '°C'),
      field('allocatedGpus', '자원 할당', 'GPU', 0, 'totalGpus'),
    ],
  },
  facility: {
    title: '시설 운영',
    fields: [
      field('humidityPercent', '상대 습도', '%'),
      field('energyKwh', '누적 전력량', 'kWh', 4),
      field('operatingState', '가동 상태'),
    ],
  },
  support: {
    title: '설비 운영',
    fields: [field('operatingState', '가동 상태'), field('energyKwh', '누적 전력량', 'kWh', 4)],
  },
};
export const AI_SERVICE_PROFILE = {
  title: '가상 AI 서비스',
  fields: [
    field('modelName', '모델명'),
    field('serviceState', '추론 서비스'),
    field('requestsPerMinute', '처리 요청량', '건/분', 0),
  ],
};
const facilityTypes = new Set([
  'UPS',
  'BATTERY',
  'SWITCHGEAR',
  'TRANSFORMER',
  'BACKUP GENERATOR',
  'PRECISION AIR COOLING',
  'COOLANT DISTRIBUTION UNIT',
  'CHILLER',
  'COOLING PUMP',
  'HEAT EXCHANGER',
]);
export const coolingTypes = new Set([
  'PRECISION AIR COOLING',
  'COOLANT DISTRIBUTION UNIT',
  'CHILLER',
  'COOLING PUMP',
  'HEAT EXCHANGER',
]);
export function getOperatingProfile(asset) {
  const category =
    asset.type === 'SERVER RACK'
      ? 'server'
      : asset.type === 'STORAGE RACK'
        ? 'storage'
        : asset.type === 'GPU SERVER RACK'
          ? 'gpu'
          : asset.type === 'NETWORK EQUIPMENT'
            ? 'network'
            : facilityTypes.has(asset.type)
              ? 'facility'
              : 'support';
  const base = profiles[category];
  const fields = [...base.fields];
  if (asset.type === 'UPS') fields.push(field('upsLoadPercent', 'UPS 부하', '%'));
  if (asset.type === 'BATTERY') fields.push(field('batteryPercent', '배터리 잔량', '%'));
  if (coolingTypes.has(asset.type))
    fields.push(
      field('coolingCop', '냉각 효율 (COP)', '', 2),
      field('flowLitersPerMinute', '냉각수 유량', 'L/min')
    );
  return { category, title: base.title, fields };
}
