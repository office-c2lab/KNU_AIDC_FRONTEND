export function equipmentStatusKey(status) {
  return status === '정상' ? 'normal' : status === '주의' ? 'warning' : 'fault';
}

export const equipmentStatusLabels = {
  all: '전체',
  normal: '정상',
  warning: '주의',
  fault: '장애',
};
