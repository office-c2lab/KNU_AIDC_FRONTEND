import { assertContext } from './assertContext.js';

export function createRenderingCore({ THREE, OrbitControls, host, root, zones, getHighQuality }) {
  assertContext(
    { THREE, OrbitControls, host, root, zones, getHighQuality },
    ['THREE', 'OrbitControls', 'host', 'root', 'zones', 'getHighQuality'],
    'createRenderingCore'
  );
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  const maxRenderPixels = 7_000_000;

  function applyRenderQuality(w = host.clientWidth, h = host.clientHeight) {
    if (!w || !h) return;

    const highQuality = getHighQuality();
    const nativeDpr = window.devicePixelRatio || 1;
    // Avoid forced supersampling on standard 1x displays. A 1.6 minimum made
    // the whole scene render 2.56x as many pixels without a useful visual gain.
    const requestedDpr = highQuality ? Math.min(nativeDpr, 1.5) : Math.min(nativeDpr, 1);
    const budgetDpr = Math.sqrt(maxRenderPixels / (w * h));
    const chosenDpr = Math.max(0.75, Math.min(requestedDpr, budgetDpr));

    renderer.setPixelRatio(chosenDpr);
    renderer.setSize(w, h, false);
    root.querySelectorAll('[data-quality]').forEach(button => {
      const active = (button.dataset.quality === 'high') === highQuality;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.37;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x0a1928, 1);
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1928);
  scene.fog = null;

  const camera = new THREE.PerspectiveCamera(
    42,
    Math.max(1, host.clientWidth) / Math.max(1, host.clientHeight),
    0.1,
    260
  );
  camera.position.set(...zones.overview.position);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...zones.overview.target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.085;
  controls.minDistance = 4;
  controls.maxDistance = 145;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.autoRotateSpeed = 0.45;
  controls.screenSpacePanning = true;
  controls.update();

  scene.add(new THREE.HemisphereLight(0xb4d9fa, 0x1b3445, 2.2));
  const keyLight = new THREE.DirectionalLight(0xe1f2ff, 3.4);
  keyLight.position.set(-24, 34, 20);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.radius = 1.25;
  keyLight.shadow.camera.left = -38;
  keyLight.shadow.camera.right = 38;
  keyLight.shadow.camera.top = 32;
  keyLight.shadow.camera.bottom = -32;
  keyLight.shadow.bias = -0.00012;
  scene.add(keyLight);

  const edgeLight = new THREE.DirectionalLight(0x6dcfff, 1.5);
  edgeLight.position.set(14, 17, -22);
  scene.add(edgeLight);

  const warmLight = new THREE.PointLight(0x76cef3, 65, 40, 2);
  warmLight.position.set(0, 14, 0);
  scene.add(warmLight);

  return { renderer, scene, camera, controls, applyRenderQuality };
}
