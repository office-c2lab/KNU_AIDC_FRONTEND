const asset = (id, name, type, floor, zone, temp, power, capacity, summary) => ({
  id,
  name,
  type,
  floor,
  zone,
  location: floor ? `본관 ${floor}` : zone === 'power' ? '전력 설비동' : '냉각 설비동',
  temp,
  power,
  capacity,
  summary,
});

const serverRacks = Array.from({ length: 16 }, (_, index) => {
  const id = `SRV-${String(index + 1).padStart(2, '0')}`;
  return asset(
    id,
    `표준 서버 랙 ${id}`,
    'SERVER RACK',
    '2F',
    'general',
    22.4,
    3.6,
    62,
    '가상화·스토리지·업무 시스템을 위한 표준 서버 랙.'
  );
});

const gpuRacks = [
  ...Array.from({ length: 6 }, (_, index) => `GPU-0${index + 1}`),
  ...Array.from({ length: 4 }, (_, index) => `LIQ-GPU-0${index + 1}`),
].map(id =>
  asset(
    id,
    `GPU 서버 랙 ${id}`,
    'GPU SERVER RACK',
    '3F',
    'gpu',
    26.2,
    8.2,
    86,
    'GPU 학습·추론 워크로드가 실행되는 고밀도 랙.'
  )
);

const cctv = (id, floor, zone, name) =>
  asset(id, name, 'CCTV CAMERA', floor, zone, 30.1, 0.08, 28, '시설 상태를 감시하는 보안 CCTV.');

export const DEFAULT_ASSET_CATALOG = [
  asset(
    'SEC-DESK-01',
    '보안 안내 데스크',
    'SECURITY WORKSTATION',
    '1F',
    'f1',
    23.4,
    0.6,
    52,
    '출입 인증과 보안 상태를 확인하는 설비.'
  ),
  ...['GATE-01', 'GATE-02'].map(id =>
    asset(
      id,
      `출입 검색 게이트 ${id}`,
      'SECURITY ACCESS',
      '1F',
      'f1',
      23.2,
      0.25,
      97,
      '비인가 접근을 제한하는 출입 통제 설비.'
    )
  ),
  asset(
    'STAGE-01',
    '장비 반입 검수',
    'ASSET STAGING',
    '1F',
    'f1',
    23.4,
    0.6,
    52,
    '반입 장비를 검수하는 작업 설비.'
  ),
  asset(
    'STAGE-02',
    '장비 초기 설정',
    'MAINTENANCE BENCH',
    '1F',
    'f1',
    23.4,
    0.6,
    52,
    '장비 초기 설정과 정비를 지원하는 설비.'
  ),
  ...['SPARE-01', 'SPARE-02', 'SPARE-03'].map(id =>
    asset(
      id,
      `장비 예비품 랙 ${id}`,
      'SPARE PARTS',
      '1F',
      'f1',
      22.9,
      0.1,
      58,
      '교체 모듈과 장비 부품을 보관하는 예비품 랙.'
    )
  ),
  ...['MDF-01', 'CORE-01', 'FW-01', 'PATCH-01', 'WAN-01', 'SEC-SW-01', 'NTP-01'].map(id =>
    asset(
      id,
      `네트워크 장비 ${id}`,
      'NETWORK EQUIPMENT',
      '1F',
      'network',
      22.1,
      1.5,
      47,
      '코어 네트워크 및 내부 서비스 구간을 담당하는 장비.'
    )
  ),
  asset(
    'SUPPORT-01',
    '유지보수 작업대',
    'ASSET STAGING',
    '1F',
    'f1',
    23.4,
    0.6,
    52,
    '설비 유지보수 작업을 지원하는 설비.'
  ),
  asset(
    'EDGE-PDU-01',
    '수배전반 EDGE-PDU-01',
    'SWITCHGEAR',
    '1F',
    'power',
    25.1,
    0.5,
    74,
    '1F 지원 설비에 전원을 분배하는 장치.'
  ),
  cctv('CCTV-1F-01', '1F', 'f1', '본관 1F CCTV'),
  ...serverRacks,
  ...['CRAC-01', 'CRAC-02'].map(id =>
    asset(
      id,
      `정밀 공조기 ${id}`,
      'PRECISION AIR COOLING',
      '2F',
      'cooling',
      20.4,
      3.1,
      72,
      '서버실에 냉기를 공급하는 정밀 공조 장치.'
    )
  ),
  ...['STO-01', 'STO-02', 'BAK-01', 'BAK-02'].map(id =>
    asset(
      id,
      `스토리지 랙 ${id}`,
      'STORAGE RACK',
      '2F',
      'general',
      22.2,
      2.6,
      58,
      '서비스 및 백업 데이터를 보관하는 스토리지 랙.'
    )
  ),
  cctv('CCTV-2F-01', '2F', 'general', '본관 2F CCTV'),
  ...gpuRacks,
  asset(
    'CRAC-03',
    '정밀 공조기 CRAC-03',
    'PRECISION AIR COOLING',
    '3F',
    'cooling',
    20.4,
    3.1,
    72,
    'GPU 전산실에 냉기를 공급하는 정밀 공조 장치.'
  ),
  ...['CDU-01', 'CDU-02'].map(id =>
    asset(
      id,
      `냉각 분배 장치 ${id}`,
      'COOLANT DISTRIBUTION UNIT',
      '3F',
      'gpu',
      21.7,
      2.1,
      77,
      'GPU 랙에 냉각수를 공급하는 냉각 분배 장치.'
    )
  ),
  cctv('CCTV-3F-01', '3F', 'gpu', '본관 3F CCTV'),
  asset(
    'F4-ACCESS-01',
    '출입 검색 게이트 F4-ACCESS-01',
    'SECURITY ACCESS',
    '4F',
    'noc',
    23.2,
    0.25,
    97,
    '통합 관제층 출입을 통제하는 설비.'
  ),
  asset(
    'NOC-NET-01',
    '네트워크 장비 NOC-NET-01',
    'NETWORK EQUIPMENT',
    '4F',
    'noc',
    22.1,
    1.5,
    47,
    '통합 관제 시스템의 네트워크 장비.'
  ),
  asset(
    'NOC-WALL-01',
    'NOC FACILITY WALL',
    'NOC VIDEO WALL',
    '4F',
    'noc',
    23.7,
    1.9,
    88,
    '시설 운영 지표를 표시하는 NOC 상황판.'
  ),
  asset(
    'SOC-WALL-01',
    'SOC SECURITY WALL',
    'SOC VIDEO WALL',
    '4F',
    'noc',
    23.7,
    1.9,
    88,
    '보안 운영 지표를 표시하는 SOC 상황판.'
  ),
  ...['NOC-OPS-01', 'NOC-OPS-02', 'NOC-OPS-03', 'NOC-OPS-04'].map(id =>
    asset(
      id,
      `NOC 운영 콘솔 ${id}`,
      'NOC OPERATOR CONSOLE',
      '4F',
      'noc',
      23.1,
      0.75,
      75,
      '시설 운영자가 사용하는 NOC 워크스테이션.'
    )
  ),
  ...['SOC-OPS-01', 'SOC-OPS-02', 'SOC-OPS-03'].map(id =>
    asset(
      id,
      `SOC 운영 콘솔 ${id}`,
      'SOC OPERATOR CONSOLE',
      '4F',
      'noc',
      23.1,
      0.75,
      75,
      '보안 운영자가 사용하는 SOC 워크스테이션.'
    )
  ),
  asset(
    'INCIDENT-01',
    '상황 대응·협업실',
    'INCIDENT RESPONSE',
    '4F',
    'noc',
    23.2,
    0.55,
    95,
    '장애 조치와 협업을 지원하는 상황 대응 설비.'
  ),
  asset(
    'SHIFT-01',
    '교대 인계·운영 지원 데스크',
    'OPERATIONS SUPPORT',
    '4F',
    'noc',
    23.1,
    0.65,
    80,
    '교대 인계와 작업 지시를 지원하는 설비.'
  ),
  cctv('CCTV-4F-01', '4F', 'noc', '본관 4F CCTV'),
  ...[
    ['UPS-01', '무정전 전원 장치 UPS-01', 'UPS'],
    ['BAT-01', '배터리 저장 장치 BAT-01', 'BATTERY'],
    ['SWGR-01', '수배전반 SWGR-01', 'SWITCHGEAR'],
    ['ATS-01', '수배전반 ATS-01', 'SWITCHGEAR'],
    ['UPS-02', '무정전 전원 장치 UPS-02', 'UPS'],
  ].map(([id, name, type]) =>
    asset(
      id,
      name,
      type,
      null,
      'power',
      25.1,
      type === 'UPS' ? 1.4 : 0.5,
      74,
      '전력 공급 안정성과 이중화를 관리하는 설비.'
    )
  ),
  asset(
    'TR-01',
    '변압기 TR-01',
    'TRANSFORMER',
    null,
    'power',
    35.2,
    0.8,
    66,
    '데이터센터 전원 분배 설비에 전력을 공급하는 변압기.'
  ),
  asset(
    'GEN-01',
    '비상 발전기 GEN-01',
    'BACKUP GENERATOR',
    null,
    'power',
    31,
    0,
    100,
    '상용전원 장애 시 사용하는 비상 발전기.'
  ),
  cctv('CCTV-PWR-01', null, 'power', '전력 설비동 CCTV'),
  ...['CH-01', 'CH-02'].map(id =>
    asset(
      id,
      `냉동기 ${id}`,
      'CHILLER',
      null,
      'cooling',
      18.8,
      3.2,
      68,
      '데이터센터 냉각 계통에 필요한 냉수를 생산하는 설비.'
    )
  ),
  ...['PUMP-01', 'PUMP-02'].map(id =>
    asset(
      id,
      `순환 펌프 ${id}`,
      'COOLING PUMP',
      null,
      'cooling',
      20.2,
      0.8,
      65,
      '냉각수 순환과 유량을 조절하는 펌프.'
    )
  ),
  asset(
    'HEX-01',
    '열교환기 HEX-01',
    'HEAT EXCHANGER',
    null,
    'cooling',
    20.1,
    0.4,
    72,
    '냉각 회로 사이에서 열을 전달하는 열교환기.'
  ),
  cctv('CCTV-CLG-01', null, 'cooling', '냉각 설비동 CCTV'),
];
