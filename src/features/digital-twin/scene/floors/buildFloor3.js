export function buildFloor3(context) {
  const {
    THREE,
    f3,
    area,
    glassPartitionWithGap,
    multiDoorPartition,
    raisedAisle,
    rack,
    crac,
    cdu,
    pipe,
    coolingCircuit,
    flange,
    box,
    engineeringMats,
    tubeCylinder,
    cableTray,
    floorDecal,
    shortText,
  } = context;
  // 3F: separation between air-cooled GPU, liquid GPU and the CDU service lane.
  area(f3, 'AIR GPU', -5.35, 0, 11.35, 16.55, 0x34385d);
  area(f3, 'LIQUID GPU', 4.42, 0, 7.15, 16.55, 0x244b60);
  area(f3, 'CDU MAINTENANCE', 9.67, 0, 2.95, 16.55, 0x1f5462);
  // Hall-to-hall access and a lockable CDU service bay, both with clear openings.
  glassPartitionWithGap(f3, -9.12, 7.68, 0.77, 0.55, 2.06, 'v', 'glass', 'GPU ZONE ACCESS');
  glassPartitionWithGap(f3, -9.12, 7.68, 8.12, 0.48, 1.94, 'v', 'solid', 'CDU AUTHORIZED');
  // Each technical zone is reached from a shared 1.7 m front service gallery.
  // All three doors lead into empty inspection space, not into GPU racks or the CDU housing.
  multiDoorPartition(
    f3,
    -11.2,
    11.2,
    7.68,
    [
      { pos: -6.12, width: 2.04, label: 'AIR GPU ENTRY' },
      { pos: 4.4, width: 2.04, label: 'LIQUID GPU ENTRY' },
      { pos: 9.58, width: 1.74, label: 'CDU SERVICE ENTRY' },
    ],
    'h',
    'glass'
  );
  for (const [x, w] of [
    [-6.3, 9.4],
    [4.55, 6.15],
  ]) {
    raisedAisle(f3, x, -2.33, w, 1.3, 0x8d90f5);
    raisedAisle(f3, x, 6.13, w, 1.38, 0x63d4e7);
  }
  for (let i = 0; i < 3; i++) {
    const x = -9.25 + i * 2.5;
    rack(f3, `GPU-0${i + 1}`, x, -4.15, true);
    rack(f3, `GPU-0${i + 4}`, x, 4.15, true);
  }
  for (let i = 0; i < 2; i++) {
    const x = 3.65 + i * 2.35;
    rack(f3, `LIQ-GPU-0${i + 1}`, x, -4.15, true);
    rack(f3, `LIQ-GPU-0${i + 3}`, x, 4.15, true);
  }
  crac(f3, -10.47, 0.22, 'CRAC-03');
  cdu(f3, 9.6, -4.1, 'CDU-01');
  cdu(f3, 9.6, 4.18, 'CDU-02');
  // 3F overhead manifolds are visualized only with the cooling network enabled.
  const f3CoolingOverlay = new THREE.Group();
  f3CoolingOverlay.name = '3F 냉각 계통';
  f3.add(f3CoolingOverlay);
  // Upper liquid return/supply manifolds, tied visually to the CDU corridor.
  for (const [dx, col] of [
    [0, 0x78dfff],
    [0.28, 0x369ecb],
  ]) {
    pipe(
      f3CoolingOverlay,
      [
        [9.68 + dx, 2.66, -6.3],
        [9.68 + dx, 3.4, -5.75],
        [9.68 + dx, 3.4, 5.6],
      ],
      0.075,
      col,
      42
    );
    for (const z of [-4.1, 4.18])
      pipe(
        f3CoolingOverlay,
        [
          [9.68 + dx, 3.4, z],
          [8.0, 3.4, z],
          [6.04, 3.1, z],
        ],
        0.055,
        col,
        21
      );
  }
  // Liquid loop distribution: overhead dual-pipe supply/return, isolation valves and rack-side drops.
  for (const [z, sourceId] of [
    [-4.1, 'cdu'],
    [4.18, 'cdu'],
  ]) {
    for (const [off, col] of [
      [-0.2, 0x78dfff],
      [0.2, 0x369ecb],
    ]) {
      coolingCircuit(
        f3CoolingOverlay,
        [
          [9.08, 3.02, z + off],
          [7.62, 3.13, z + off],
          [5.23, 3.13, z + off],
          [3.65, 3.01, z + off],
        ],
        col,
        sourceId,
        0.12
      );
      for (const x of [3.65, 6.0]) {
        pipe(
          f3CoolingOverlay,
          [
            [x, 3.12, z + off],
            [x, 2.73, z + off],
            [x, 2.53, z - 0.32],
          ],
          0.034,
          col,
          14
        );
        flange(f3CoolingOverlay, x, 2.56, z - 0.32, 0.078, 'y');
      }
      // Real bracket clamps on long trunk lines.
      for (const x of [4.4, 6.2, 8.5]) {
        box(f3CoolingOverlay, 0.09, 0.4, 0.08, x, 3.3, z + off, engineeringMats.titanium, {
          cast: false,
        });
        tubeCylinder(
          f3CoolingOverlay,
          0.072,
          0.065,
          x,
          3.12,
          z + off,
          engineeringMats.silver,
          'x',
          12
        );
      }
    }
  }
  for (const x of [-6.5, 5.5]) cableTray(f3, x, 0, 0.6, 15);
  floorDecal(f3, 'AIR-COOLED GPU', -6.3, -2.3, 3.6, '#32395c');
  floorDecal(f3, 'DIRECT LIQUID COOLING', 5.55, -2.3, 3.4, '#204a60');
  shortText(f3, '공랭 GPU 존', -6.5, 8.3, 3.2, '#393a68');
  shortText(f3, '액체냉각 GPU 존', 6.2, 8.3, 4.3, '#275569');

  return f3CoolingOverlay;
}
