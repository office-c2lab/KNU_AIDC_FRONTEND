import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { initDigitalTwin } from '../digital-twin/scene/runtime/createDigitalTwinRuntime.js';

export function createCampusModel(library) {
  const root = new THREE.Group();
  const zones = new Map();
  for (const [id, template] of library.locations) {
    const group = template.clone(true);
    group.userData.previewZone = id;
    if (id.endsWith('F')) group.position.y = (Number(id[0]) - 1) * 7;
    group.traverse(part => {
      if (['ceiling', 'front'].includes(part.userData.architectureCutaway)) part.visible = false;
    });
    root.add(group);
    zones.set(id, group);
  }
  root.updateMatrixWorld(true);
  return { root, zones };
}

export function createCampusPreview(host, onSelectZone) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute(
    'aria-label',
    '데이터센터 층별 3D 개요. 드래그로 회전하며 옆의 시설 목록으로도 구역을 선택할 수 있습니다.'
  );
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  let library;
  let controls;
  let observer;
  try {
    library = initDigitalTwin(document.createElement('div'), { modelsOnly: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.setClearColor(0, 0);
    const scene = new THREE.Scene();
    const model = createCampusModel(library);
    scene.add(model.root);
    scene.add(new THREE.HemisphereLight(0xc6e2ff, 0x122238, 3));
    const light = new THREE.DirectionalLight(0xe4f5ff, 3);
    light.position.set(-30, 60, 40);
    scene.add(light);
    const edge = new THREE.DirectionalLight(0x83b9ff, 1.5);
    edge.position.set(35, 25, -20);
    scene.add(edge);
    const bounds = new THREE.Box3().setFromObject(model.root, true);
    const center = bounds.getCenter(new THREE.Vector3());
    const radius = bounds.getSize(new THREE.Vector3()).length() / 2;
    const camera = new THREE.OrthographicCamera(-50, 50, 50, -50, 0.1, 1000);
    camera.position.copy(center).add(new THREE.Vector3(65, 48, 75));
    controls = new OrbitControls(camera, canvas);
    controls.target.copy(center);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = 0.3;
    controls.maxPolarAngle = Math.PI / 2.4;
    controls.update();
    const markers = new THREE.Group();
    scene.add(markers);
    const selection = new THREE.Box3Helper(new THREE.Box3(), 0x87bce9);
    selection.material.transparent = true;
    selection.material.opacity = 0.55;
    scene.add(selection);
    const render = () => renderer.render(scene, camera);
    const fit = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      const aspect = width / height;
      const halfHeight = (radius / Math.min(1, aspect)) * 0.9;
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      render();
    };
    const clearMarkers = () => {
      for (const marker of [...markers.children]) {
        markers.remove(marker);
        marker.geometry.dispose();
        marker.material.dispose();
      }
    };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down;
    const pointerDown = event => {
      down = [event.clientX, event.clientY];
    };
    const pointerUp = event => {
      if (!down || Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 5) return;
      down = null;
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      let object = raycaster.intersectObject(model.root, true)[0]?.object;
      while (object && !object.userData.previewZone) object = object.parent;
      if (object) onSelectZone(object.userData.previewZone);
    };
    host.appendChild(canvas);
    controls.addEventListener('change', render);
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointerup', pointerUp);
    observer = new ResizeObserver(fit);
    observer.observe(host);
    fit();
    return {
      update(zone, issues) {
        const selected = model.zones.get(zone);
        selection.visible = Boolean(selected);
        if (selected) selection.box.setFromObject(selected, true);
        clearMarkers();
        model.root.traverse(part => {
          const status = issues.get(part.userData.entityId);
          if (!status) return;
          const marker = new THREE.Box3Helper(
            new THREE.Box3().setFromObject(part, true),
            status === '주의' ? 0xeac476 : 0xff8188
          );
          marker.material.depthTest = false;
          marker.renderOrder = 10;
          markers.add(marker);
        });
        render();
      },
      dispose() {
        observer.disconnect();
        controls.removeEventListener('change', render);
        controls.dispose();
        canvas.removeEventListener('pointerdown', pointerDown);
        canvas.removeEventListener('pointerup', pointerUp);
        clearMarkers();
        selection.geometry.dispose();
        selection.material.dispose();
        scene.clear();
        library.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
      },
    };
  } catch (error) {
    observer?.disconnect();
    controls?.dispose();
    library?.dispose();
    renderer.dispose();
    canvas.remove();
    throw error;
  }
}
