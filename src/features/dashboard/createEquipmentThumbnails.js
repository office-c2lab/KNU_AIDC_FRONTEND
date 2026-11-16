import * as THREE from 'three';
import { initDigitalTwin } from '../digital-twin/scene/runtime/createDigitalTwinRuntime.js';

// One short-lived renderer produces every catalog image, avoiding a context per card.
export function createEquipmentThumbnails() {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  let library;
  try {
    library = initDigitalTwin(document.createElement('div'), { modelsOnly: true });
    renderer.setSize(220, 180);
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xdbeeff, 0x15253e, 3));
    const key = new THREE.DirectionalLight(0xe4f5ff, 3);
    key.position.set(5, 9, 12);
    scene.add(key);
    const edge = new THREE.DirectionalLight(0x83b9ff, 2);
    edge.position.set(-8, 5, -9);
    scene.add(edge);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 500);
    let current;
    return {
      capture(id) {
        if (current) scene.remove(current);
        current = library.models.get(id);
        if (!current) return null;
        current.position.set(0, 0, 0);
        current.updateWorldMatrix(true, true);
        const bounds = new THREE.Box3().setFromObject(current, true);
        const center = bounds.getCenter(new THREE.Vector3());
        const radius = Math.max(bounds.getSize(new THREE.Vector3()).length() / 2, 0.2);
        current.position.sub(center);
        scene.add(current);
        camera.position.set(radius * 2.2, radius * 1.3, radius * 3);
        camera.lookAt(0, 0, 0);
        const halfHeight = radius * 1.1;
        camera.left = (-halfHeight * 220) / 180;
        camera.right = (halfHeight * 220) / 180;
        camera.top = halfHeight;
        camera.bottom = -halfHeight;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
        return renderer.domElement.toDataURL('image/png');
      },
      dispose() {
        scene.clear();
        library.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
      },
    };
  } catch (error) {
    library?.dispose();
    renderer.dispose();
    throw error;
  }
}
