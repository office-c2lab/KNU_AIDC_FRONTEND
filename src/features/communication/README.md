# AI communication map

The `/ai-network` view uses d3-geo for orthographic globe and Mercator map projections, with an on-demand Three.js WebGL surface. The shader projects the Earth imagery using the same geographic transform as the SVG overlay; changing projections does not create a new WebGL context. Select a destination or route to show the flat map and connection details. Drag the globe to rotate; use the view buttons to switch projections. When WebGL or textures are unavailable, the vector surface remains usable.

`networkData.js` contains illustrative connections only, not observed network activity or provider endpoint locations. Replace these records with verified telemetry before representing them as live traffic.

`land.json` contains rounded polygon coordinates from Natural Earth's public-domain 1:50m land dataset: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_land.geojson . `countries.json` contains geometries from its 1:110m admin-0 countries dataset: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson . These generalized outlines are for geographic context, not precise borders or routing. Geographic lines represent conceptual service connections, not physical cable paths.

`public/maps/earth-blue-marble.jpg` and `public/maps/earth-topology.png` are local copies of the Earth textures distributed in the MIT-licensed three-globe examples, version 2.45.6: https://github.com/vasturiano/three-globe/tree/master/example/img . Blue Marble imagery originates from NASA. No external tile service, API key, or runtime CDN request is required. The texture is a composite geographic illustration, not live satellite imagery.

The globe surface includes directional shading, relief, water highlights, and atmospheric scattering. Great-circle connections are lifted above the sphere and occluded at its horizon. The flat map uses the available panel bounds without stretching its projection. Rendering occurs only when coordinates or viewport dimensions change; animation preferences are respected by the SVG overlay.
