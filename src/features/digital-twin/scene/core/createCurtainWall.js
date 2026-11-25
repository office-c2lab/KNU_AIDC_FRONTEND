// Each face belongs to its existing cutaway group, so floor inspection also
// removes the corresponding glazing, mullions and exterior lighting.
export function createCurtainWall({ THREE, shell, box, groundFloor }) {
  const frame = new THREE.MeshStandardMaterial({
    color: 0x82949d,
    metalness: 0.82,
    roughness: 0.27,
  });
  const fascia = new THREE.MeshStandardMaterial({
    color: 0x34424c,
    metalness: 0.7,
    roughness: 0.32,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xa4c5ce,
    metalness: 0.12,
    roughness: 0.08,
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
    side: THREE.DoubleSide,
    envMapIntensity: 0.7,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  const light = new THREE.MeshStandardMaterial({
    color: 0xd7efff,
    emissive: 0xb4dfff,
    emissiveIntensity: 2.3,
    metalness: 0.15,
    roughness: 0.3,
  });
  const warm = new THREE.MeshStandardMaterial({
    color: 0xffe6bf,
    emissive: 0xffcc86,
    emissiveIntensity: 1.8,
  });
  for (const [face, span, fixed, sideways] of [
    ['front', 23.6, 9.48, false],
    ['back', 23.6, -9.48, false],
    ['right', 19, 11.94, true],
    ['left', 19, -11.94, true],
  ]) {
    const parent = shell[face];
    const beam = (length, height, depth, along, y, material) =>
      sideways
        ? box(parent, depth, height, length, fixed, y, along, material, { cast: false })
        : box(parent, length, height, depth, along, y, fixed, material, { cast: false });
    const bays = sideways ? 8 : 10;
    const pitch = span / bays;
    for (let i = 0; i <= bays; i++) {
      beam(0.055, 3.85, 0.11, -span / 2 + i * pitch, 2.27, frame);
    }
    for (let i = 0; i < bays; i++) {
      const along = -span / 2 + (i + 0.5) * pitch;
      // The real sliding entrance occupies the front-left access bay.
      if (!(groundFloor && face === 'front' && along > -8.4 && along < -2.3)) {
        beam(pitch - 0.06, 3.51, 0.018, along, 2.19, glass);
      }
    }
    beam(span + 0.12, 0.19, 0.22, 0, 0.42, fascia);
    beam(span + 0.12, 0.16, 0.19, 0, 4.15, frame);
    beam(span, 0.045, 0.12, 0, 1.25, frame);
    beam(span - 0.16, 0.035, 0.13, 0, 3.99, groundFloor ? warm : light);
    // Small, recessed interior downlights provide depth without a light per bay.
    for (let i = 0; i < bays; i += 2) {
      beam(pitch * 0.65, 0.035, 0.08, -span / 2 + (i + 0.5) * pitch, 3.76, light);
    }
  }
}
