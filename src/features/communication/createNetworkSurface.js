import * as THREE from 'three';

// One on-demand WebGL surface shares the exact coordinates used by the SVG overlay.
// The globe uses an orthographic sphere normal; the map uses inverse Mercator.
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uEarth;
  uniform sampler2D uRelief;
  uniform vec2 uSpan;
  uniform vec2 uRotation;
  uniform vec2 uTexel;
  uniform float uScale;
  uniform float uCenterLat;
  uniform bool uGlobe;
  const float PI = 3.141592653589793;

  void main() {
    vec2 position = (vUv - .5) * uSpan;
    if (uGlobe && (abs(position.x) > 480.0 || abs(position.y) > 330.0)) discard;
    vec2 geo;
    vec3 normal = vec3(0.0, 0.0, 1.0);
    float radius = 0.0;
    float edgeAlpha = 1.0;
    if (uGlobe) {
      vec2 surface = position / uScale;
      radius = length(surface);
      float edgeWidth = max(fwidth(radius), .0001);
      if (radius > 1.0 + edgeWidth) discard;
      edgeAlpha = 1.0 - smoothstep(1.0 - edgeWidth, 1.0 + edgeWidth, radius);
      normal = vec3(surface / max(radius, 1.0), sqrt(max(0.0, 1.0 - dot(surface, surface))));
      // Invert d3's longitude rotation followed by its latitude rotation.
      float cy = cos(uRotation.y), sy = sin(uRotation.y);
      float cx = cos(uRotation.x), sx = sin(uRotation.x);
      vec3 unpitched = vec3(normal.x, normal.y * cy - normal.z * sy, normal.y * sy + normal.z * cy);
      vec3 world = vec3(unpitched.x * cx - unpitched.z * sx, unpitched.y, unpitched.x * sx + unpitched.z * cx);
      geo = vec2(atan(world.x, world.z), asin(clamp(world.y, -1.0, 1.0)));
    } else {
      float mercatorY = position.y / uScale + log(tan(PI / 4.0 + uCenterLat / 2.0));
      geo = vec2(position.x / uScale - uRotation.x, 2.0 * atan(exp(mercatorY)) - PI / 2.0);
    }
    vec2 uv = vec2(fract(geo.x / (2.0 * PI) + .5), clamp(geo.y / PI + .5, .001, .999));
    vec3 earth = texture2D(uEarth, uv).rgb;
    vec3 color;
    if (uGlobe) {
      float dx = texture2D(uRelief, uv + vec2(uTexel.x, 0.0)).r - texture2D(uRelief, uv - vec2(uTexel.x, 0.0)).r;
      float dy = texture2D(uRelief, uv + vec2(0.0, uTexel.y)).r - texture2D(uRelief, uv - vec2(0.0, uTexel.y)).r;
      vec3 reliefNormal = normalize(normal + vec3(-dx, -dy, 0.0) * .36);
      vec3 light = normalize(vec3(-.55, .65, 1.2));
      float diffuse = max(0.0, dot(reliefNormal, light));
      float water = smoothstep(.015, .08, earth.b - earth.r);
      float specular = pow(max(0.0, dot(reliefNormal, normalize(light + vec3(0.0, 0.0, 1.0)))), 48.0) * water;
      color = earth * (.42 + diffuse * .88) + vec3(.18, .26, .32) * specular * .12;
    } else {
      color = earth * .96;
    }
    gl_FragColor = vec4(color, edgeAlpha);
    #include <colorspace_fragment>
  }
`;

export async function createNetworkSurface(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.debug.onShaderError = () => {
    throw new Error('Earth shader could not be compiled');
  };
  const loader = new THREE.TextureLoader();
  const loaded = await Promise.allSettled([
    loader.loadAsync('/maps/earth-blue-marble.jpg'),
    loader.loadAsync('/maps/earth-topology.png'),
  ]);
  if (loaded.some(result => result.status === 'rejected')) {
    loaded.forEach(result => {
      if (result.status === 'fulfilled') result.value.dispose();
    });
    renderer.dispose();
    renderer.forceContextLoss();
    throw new Error('Earth textures could not be loaded');
  }
  const [earth, relief] = loaded.map(result => result.value);
  earth.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [earth, relief]) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  }
  const uniforms = {
    uEarth: { value: earth },
    uRelief: { value: relief },
    uSpan: { value: new THREE.Vector2(960, 660) },
    uRotation: { value: new THREE.Vector2() },
    uTexel: { value: new THREE.Vector2(1 / relief.image.width, 1 / relief.image.height) },
    uScale: { value: 274 },
    uCenterLat: { value: 0 },
    uGlobe: { value: true },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: false,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(geometry, material));
  const camera = new THREE.Camera();
  let disposed = false;
  let lastWidth = 0;
  let lastHeight = 0;
  return {
    update({ mode, projection }) {
      if (disposed) return;
      const width = canvas.parentElement.clientWidth;
      const height = canvas.parentElement.clientHeight;
      if (!width || !height) return;
      if (width !== lastWidth || height !== lastHeight) {
        renderer.setSize(width, height, false);
        lastWidth = width;
        lastHeight = height;
      }
      const aspect = width / height;
      if (mode === 'globe') {
        uniforms.uSpan.value.set(Math.max(960, 660 * aspect), Math.max(660, 960 / aspect));
      } else {
        uniforms.uSpan.value.set(Math.min(960, 660 * aspect), Math.min(660, 960 / aspect));
      }
      const rotation = projection.rotate();
      uniforms.uRotation.value.set((rotation[0] * Math.PI) / 180, (rotation[1] * Math.PI) / 180);
      uniforms.uScale.value = projection.scale();
      uniforms.uCenterLat.value = (projection.center()[1] * Math.PI) / 180;
      uniforms.uGlobe.value = mode === 'globe';
      renderer.render(scene, camera);
    },
    dispose() {
      disposed = true;
      geometry.dispose();
      material.dispose();
      earth.dispose();
      relief.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
