import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createEquipmentLocationModel(source, assetId) {
  const asset = source.layout.find(item => item.id === assetId);
  const template = asset && source.locations.get(asset.floor || asset.zone);
  if (!template) throw new Error(`설비 위치 모델을 찾을 수 없습니다: ${assetId}`);
  const root = new THREE.Group();
  const floor = template.clone(true);
  floor.position.set(0, 0, 0);
  root.add(floor);
  let selected;
  floor.traverse(part => {
    if (part.userData.entityId === assetId) selected = part;
    if (['ceiling', 'front'].includes(part.userData.architectureCutaway)) part.visible = false;
  });
  if (!selected) throw new Error(`층 모델에 설비가 없습니다: ${assetId}`);
  root.updateMatrixWorld(true);
  const floorBounds = new THREE.Box3().setFromObject(floor, true);
  const selectedBounds = new THREE.Box3().setFromObject(selected, true);
  const point = selectedBounds.getCenter(new THREE.Vector3());
  const shape = new THREE.Shape();
  shape.moveTo(0, -1.5);
  shape.bezierCurveTo(-0.3, -1, -1, -0.4, -1, 0.2);
  shape.bezierCurveTo(-1, 1.5, 1, 1.5, 1, 0.2);
  shape.bezierCurveTo(1, -0.4, 0.3, -1, 0, -1.5);
  const hole = new THREE.Path();
  hole.absarc(0, 0.25, 0.36, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({
    color: 0x2896ff,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: 0x071024,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const pin = new THREE.Mesh(geometry, material);
  const outline = new THREE.Mesh(geometry, outlineMaterial);
  outline.scale.setScalar(1.16);
  outline.renderOrder = 9;
  pin.add(outline);
  pin.name = 'selected-equipment-location-pin';
  pin.position.set(point.x, selectedBounds.max.y + 1.7, point.z);
  pin.renderOrder = 10;
  root.add(pin);
  root.position.sub(floorBounds.getCenter(new THREE.Vector3()));
  return {
    root,
    pin,
    selected,
    dispose: () => {
      geometry.dispose();
      material.dispose();
      outlineMaterial.dispose();
    },
  };
}

export function createEquipmentLocationPreview(host, source) {
  const canvas = document.createElement('canvas');
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '설비 위치 3D 미니어처. 드래그로 회전');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  host.appendChild(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xdbeeff, 0x1b3049, 3));
  const key = new THREE.DirectionalLight(0xe4f5ff, 3);
  key.position.set(-15, 30, 20);
  scene.add(key);
  const edge = new THREE.DirectionalLight(0x83b9ff, 1.8);
  edge.position.set(20, 16, -15);
  scene.add(edge);
  const camera = new THREE.OrthographicCamera(-20, 20, 20, -20, 0.1, 500);
  camera.position.set(36, 40, 42);
  camera.lookAt(0, 0, 0);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = Math.PI / 2.4;
  let model;
  const render = () => {
    if (model) model.pin.quaternion.copy(camera.quaternion);
    renderer.render(scene, camera);
  };
  const fit = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height || !model) return;
    renderer.setSize(width, height, false);
    model.pin.quaternion.copy(camera.quaternion);
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model.root, true);
    const projected = new THREE.Box2();
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z]) {
          const point = new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse);
          projected.expandByPoint(new THREE.Vector2(point.x, point.y));
        }
    const size = projected.getSize(new THREE.Vector2());
    const center = projected.getCenter(new THREE.Vector2());
    const viewHeight = Math.max(size.y, size.x / (width / height)) * 1.08;
    const viewWidth = (viewHeight * width) / height;
    camera.left = center.x - viewWidth / 2;
    camera.right = center.x + viewWidth / 2;
    camera.top = center.y + viewHeight / 2;
    camera.bottom = center.y - viewHeight / 2;
    camera.updateProjectionMatrix();
    render();
  };
  controls.addEventListener('change', render);
  const observer = new ResizeObserver(fit);
  observer.observe(canvas);
  return {
    setAsset(id) {
      if (model) {
        scene.remove(model.root);
        model.dispose();
      }
      model = createEquipmentLocationModel(source, id);
      scene.add(model.root);
      camera.position.set(36, 40, 42);
      controls.target.set(0, 0, 0);
      controls.update();
      fit();
    },
    dispose() {
      observer.disconnect();
      controls.removeEventListener('change', render);
      controls.dispose();
      model?.dispose();
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
