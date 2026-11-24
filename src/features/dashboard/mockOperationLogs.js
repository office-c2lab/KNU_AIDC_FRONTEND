// Display-only examples. Never write these into the incident/audit store.
const examples = [
  ['시스템', 'GPU-03', '자원 상태 수집 완료', 'normal', '정상', 12],
  ['시설', 'CRAC-03', '냉각수 온도 상태 확인 완료', 'normal', '정상', 67],
  ['보안', 'FW-01', '보안 정책 정기 검사 완료', 'normal', '정상', 155],
  ['시스템', 'CORE-01', '업링크 응답 지연 감지 · 우회 경로 확인 중', 'warning', '주의', 238],
  ['시스템', 'STO-01', '야간 백업 작업 완료 · 무결성 검사 통과', 'success', '완료', 365],
  ['시설', 'UPS-01', 'UPS 배터리 충전 및 전원 상태 정상', 'normal', '정상', 485],
  ['보안', 'GATE-01', '비인가 출입 시도 감지 · 출입 차단', 'danger', '장애', 620],
  ['시설', 'CRAC-02', '공조 필터 점검 권고 · 풍량 저하 감지', 'warning', '주의', 785],
  ['시스템', 'SRV-04', '서버 재시작 완료 · 서비스 응답 확인', 'success', '완료', 945],
  ['시스템', 'WAN-01', '외부 회선 연결 상태 확인 완료', 'normal', '정상', 1160],
  ['시설', 'UPS-02', '전원 이중화 자동 점검 완료', 'info', '정보', 1385],
  ['보안', 'GATE-02', '출입 권한 동기화 완료', 'success', '완료', 1595],
];

export function createMockOperationLogs(baseTime) {
  return examples.map(([category, asset, description, kind, statusLabel, seconds], index) => ({
    id: `mock-operation-${index}`,
    timestamp: new Date(baseTime - seconds * 1000).toISOString(),
    category,
    asset,
    description,
    kind,
    statusLabel,
    actor: 'SYSTEM',
    mock: true,
  }));
}
