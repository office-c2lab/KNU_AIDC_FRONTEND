export function buildFloor2(context) {
  const {
    f2,
    area,
    glassPartitionWithGap,
    multiDoorPartition,
    raisedAisle,
    rack,
    crac,
    storageRack,
    cableTray,
    box,
    M,
    floorDecal,
    shortText,
  } = context;
  // 2F: all +Z-facing rack fronts now have two real cold/service aisles per hall.
  area(f2, 'SERVER HALL A', -5.9, 0, 11.1, 16.7, 0x23495d);
  area(f2, 'SERVER HALL B', 6.05, 0, 10.7, 16.7, 0x254d65);
  // Two properly enclosed server halls separated by a clear door at the service spine.
  glassPartitionWithGap(f2, -9.12, 7.67, 0, 0.5, 2.16, 'v', 'glass', 'HALL A / B');
  // Front shared access gallery (z 7.65-9.2) is separated from the rack inspection floor.
  // Both entries face an empty access aisle, never a rack or CRAC.
  multiDoorPartition(
    f2,
    -11.17,
    11.17,
    7.67,
    [
      { pos: -6.02, width: 2.1, label: 'HALL A ENTRY' },
      { pos: 6.18, width: 2.1, label: 'HALL B ENTRY' },
    ],
    'h',
    'glass'
  );
  for (const x of [-5.85, 6.05]) {
    raisedAisle(f2, x, -2.3, 9.8, 1.3);
    raisedAisle(f2, x, 6.13, 9.8, 1.46);
  }
  for (let i = 0; i < 4; i++) {
    const xs = [-10.05, -7.56, -5.07, -2.58][i];
    rack(f2, `SRV-${String(i + 1).padStart(2, '0')}`, xs, -4.2, false);
    rack(f2, `SRV-${String(i + 5).padStart(2, '0')}`, xs, 4.12, false);
    const x2 = [2.6, 4.85, 7.1, 9.35][i];
    rack(f2, `SRV-${String(i + 9).padStart(2, '0')}`, x2, -4.2, false);
    rack(f2, `SRV-${String(i + 13).padStart(2, '0')}`, x2, 4.12, false);
  }
  crac(f2, -10.52, 0.2, 'CRAC-01');
  crac(f2, 10.54, 0.2, 'CRAC-02');
  storageRack(f2, -7.8, -7.73, 'STO-01');
  storageRack(f2, -5.75, -7.73, 'STO-02');
  storageRack(f2, 4.3, -7.73, 'BAK-01');
  storageRack(f2, 6.35, -7.73, 'BAK-02');
  for (const x of [-6.6, 5.9]) cableTray(f2, x, -0.15, 0.6, 16);
  for (let x = -9; x <= 9; x += 3)
    box(f2, 0.85, 0.035, 0.2, x, 0.426, 8.7, M.cool, { cast: false });
  floorDecal(f2, 'COLD AISLE', -5.9, -2.3, 3.2, '#1c4960');
  floorDecal(f2, 'COLD AISLE', 6.05, -2.3, 3.2, '#1c4960');
  shortText(f2, 'SERVER HALL A', -6.3, 8.38, 4.1);
  shortText(f2, 'SERVER HALL B', 6.3, 8.38, 4.1);
}
