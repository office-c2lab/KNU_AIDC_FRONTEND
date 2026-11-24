// Illustrative historical workload shapes. The last sample is the unchanged
// current operating reading; these shapes are not recorded telemetry.
const profiles = {
  CPU: [0.8, 0.83, 0.78, 1.02, 0.94, 0.99, 0.87, 1.12, 0.97, 1.14, 0.98, 1.04, 1],
  메모리: [0.82, 0.87, 0.86, 0.94, 0.9, 1, 0.95, 1.02, 0.98, 1.05, 1, 1.03, 1],
  스토리지: [0.72, 0.75, 0.78, 0.77, 0.81, 0.8, 0.84, 0.87, 0.86, 0.91, 0.92, 0.96, 1],
  GPU: [0.96, 1.04, 0.95, 0.9, 1.01, 1.05, 0.97, 0.88, 0.99, 1.03, 0.92, 0.98, 1],
  'GPU 메모리': [0.86, 0.9, 0.93, 0.89, 0.98, 0.91, 0.95, 1.02, 0.94, 1.04, 0.97, 1.01, 1],
  수신: [0.62, 0.68, 0.57, 0.9, 0.74, 1.18, 0.82, 0.78, 1.12, 0.94, 1.4, 1.08, 1],
  송신: [0.6, 0.73, 0.64, 0.88, 0.7, 1.05, 0.82, 0.9, 1.18, 0.78, 1.15, 0.97, 1],
};

export function applyDashboardTrendProfile(sample, index) {
  return Object.fromEntries(
    Object.entries(sample).map(([key, value]) => {
      if (!profiles[key] || !Number.isFinite(value) || index === 12) return [key, value];
      const adjusted = Math.max(0, value * profiles[key][index]);
      return [key, key === '수신' || key === '송신' ? adjusted : Math.min(100, adjusted)];
    })
  );
}
