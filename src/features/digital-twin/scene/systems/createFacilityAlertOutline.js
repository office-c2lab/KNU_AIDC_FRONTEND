import * as THREE from 'three';

// The outline lives in the facility's local space so it follows floor separation.
export function createFacilityAlertOutline(group, key) {
  group.updateWorldMatrix(true, true);
  const worldBounds = new THREE.Box3().setFromObject(group, true);
  const localBounds = new THREE.Box3();
  const inverse = group.matrixWorld.clone().invert();
  for (const x of [worldBounds.min.x, worldBounds.max.x])
    for (const y of [worldBounds.min.y, worldBounds.max.y])
      for (const z of [worldBounds.min.z, worldBounds.max.z])
        localBounds.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(inverse));
  const size = localBounds.getSize(new THREE.Vector3()).addScalar(0.12);
  const box = new THREE.BoxGeometry(size.x, size.y, size.z);
  const geometry = new THREE.EdgesGeometry(box);
  box.dispose();
  const outline = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({
      color: 0xff526b,
      transparent: true,
      opacity: 0.88,
      depthTest: true,
      depthWrite: false,
      toneMapped: false,
    })
  );
  outline.name = `incident-facility-outline:${key}`;
  outline.position.copy(localBounds.getCenter(new THREE.Vector3()));
  outline.renderOrder = 20;
  outline.visible = false;
  group.add(outline);
  return outline;
}
