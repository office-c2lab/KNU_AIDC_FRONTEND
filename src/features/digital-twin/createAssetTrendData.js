// Keep the existing trend series calculation independent of how charts are drawn.
export function createAssetTrendData(assetId, sensor) {
  const seed = [...assetId].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  const series = (base, minAmplitude, ratio) => {
    const amplitude = Math.max(minAmplitude, base * ratio);
    return Array.from({ length: 17 }, (_, i) =>
      i === 16
        ? base
        : Math.max(
            0,
            base +
              Math.sin(i * 0.57 + seed * 0.31) * amplitude * 0.64 +
              Math.sin(i * 0.23 + seed) * amplitude * 0.35 +
              (i - 16) * amplitude * 0.012
          )
    );
  };
  const temperatures = series(sensor.temp, 0.28, 0.013);
  const powers = series(sensor.power, 0.07, 0.04);
  return temperatures.map((temp, index) => ({
    minute: -60 + index * 3.75,
    temp,
    power: powers[index],
  }));
}
