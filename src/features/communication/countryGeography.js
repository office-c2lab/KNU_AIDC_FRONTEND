import { geoCentroid, geoMercator, geoPath } from 'd3-geo';
import countries from './countries.json';
import metadata from './countryMeta.json';
import singapore from './singapore.json';

const aliases = { AU: '호주', CN: '중국', RU: '러시아', KR: '대한민국' };
export const countryFeatures = metadata.map(country => ({
  type: 'Feature',
  id: country.id,
  properties: {
    ...country,
    code: country.code && country.code !== '-99' ? country.code : country.id,
    name: aliases[country.code] ?? country.name,
  },
  geometry: countries.geometries[country.index],
}));
countryFeatures.push({
  type: 'Feature',
  id: 'SGP',
  properties: { code: 'SG', name: '싱가포르' },
  geometry: singapore,
});
export const countryByCode = new Map(
  countryFeatures.map(country => [country.properties.code, country])
);

export function countryView(country, aspect, sideInset) {
  const centroid = geoCentroid(country);
  const reference = geoMercator().rotate([-centroid[0], 0]).scale(1).translate([0, 0]);
  const bounds = geoPath(reference).bounds(country);
  const center = reference.invert([
    (bounds[0][0] + bounds[1][0]) / 2,
    (bounds[0][1] + bounds[1][1]) / 2,
  ]);
  const width = Math.min(960, 660 * aspect) * (1 - 2 * sideInset) - 100;
  const height = Math.min(660, 960 / aspect) - 170;
  return {
    center: [center[0], Math.max(-80, Math.min(80, center[1]))],
    scale:
      Math.min(
        900,
        Math.max(
          40,
          Math.min(
            Math.max(100, width) / Math.max(0.001, bounds[1][0] - bounds[0][0]),
            Math.max(100, height) / Math.max(0.001, bounds[1][1] - bounds[0][1])
          )
        )
      ) * 0.9,
  };
}
