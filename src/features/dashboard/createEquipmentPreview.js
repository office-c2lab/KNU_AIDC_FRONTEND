import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { initDigitalTwin } from '../digital-twin/scene/runtime/createDigitalTwinRuntime.js';

export function createEquipmentPreview(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  let library;
  try {
    library = initDigitalTwin(document.createElement('div'), { modelsOnly: true });
  } catch (error) {
    renderer.dispose();
    throw error;
  }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 200);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  scene.add(new THREE.HemisphereLight(0xdbeeff, 0x15253e, 3));
  const key = new THREE.DirectionalLight(0xe4f5ff, 3);
  key.position.set(5, 9, 12);
  scene.add(key);
  const edge = new THREE.DirectionalLight(0x83b9ff, 2);
  edge.position.set(-8, 5, -9);
  scene.add(edge);
  let model;
  let radius = 1;
  let disposed = false;
  let frame;
  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const fit = () => {
    const vertical = THREE.MathUtils.degToRad(camera.fov);
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect);
    const distance = (radius / Math.sin(Math.min(vertical, horizontal) / 2)) * 1.08;
    camera.position.copy(new THREE.Vector3(0.7, 0.38, 1).normalize().multiplyScalar(distance));
    controls.target.set(0, 0, 0);
    controls.minDistance = radius * 1.3;
    controls.maxDistance = distance * 2.5;
    controls.update();
  };
  const observer = new ResizeObserver(() => {
    resize();
    if (model) fit();
  });
  observer.observe(canvas);
  const render = () => {
    if (disposed) return;
    controls.update();
    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  };
  render();
  return {
    setAsset(id) {
      if (model) scene.remove(model);
      model = library.models.get(id);
      if (!model) throw new Error(`설비 3D 모델을 찾을 수 없습니다: ${id}`);
      model.position.set(0, 0, 0);
      model.updateWorldMatrix(true, true);
      const bounds = new THREE.Box3().setFromObject(model, true);
      const center = bounds.getCenter(new THREE.Vector3());
      radius = Math.max(bounds.getSize(new THREE.Vector3()).length() / 2, 0.35);
      model.position.sub(center);
      scene.add(model);
      resize();
      fit();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      library.dispose();
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
