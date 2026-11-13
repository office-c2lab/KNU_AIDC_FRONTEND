export function buildFloor1(context) {
  const {
    f1,
    area,
    glassPartitionWithGap,
    partitionSegment,
    box,
    M,
    station,
    securityGate,
    makeMainEntrance,
    shelf,
    networkCabinet,
    upsCabinet,
    shortText,
    cableTray,
  } = context;
  // 1F: secured pedestrian arrival, logistics staging, MDF access and spare-parts maintenance.
  area(f1, 'SECURITY', -7.6, 4.25, 7.7, 9.4, 0x244b61);
  area(f1, 'LOADING / STAGING', 0.25, 4.25, 7.4, 9.4, 0x2b5164);
  area(f1, 'SPARE INVENTORY', 7.65, 4.25, 7.45, 9.4, 0x2f5362);
  area(f1, 'MDF NETWORK', -5.56, -5.25, 11.15, 7.8, 0x255365);
  area(f1, 'FACILITY SUPPORT', 5.78, -5.25, 10.75, 7.8, 0x25465b);
  // Public-side rooms: security, equipment receiving and spares are three separated bays.
  // Door openings at z=4.95 keep the workstation footprints clear.
  for (const x of [-3.75, 3.95]) {
    glassPartitionWithGap(
      f1,
      1.3,
      9.03,
      x,
      4.9,
      1.9,
      'v',
      'glass',
      x < 0 ? 'SECURE ENTRY' : 'SPARES ACCESS'
    );
    // Close the unprotected rear skirt; otherwise visitors could bypass the security bays.
    partitionSegment(f1, x, 0.18, 2.34, 'v', 'solid');
  }
  // Rear technical line: MDF and plant support are independent enclosed rooms.
  // The interior divider is moved to x=+0.35, away from the rear MDF rack row.
  glassPartitionWithGap(f1, -8.94, -0.91, 0.35, -3.3, 1.75, 'v', 'solid', 'TECH STAFF ONLY');
  // Physical controlled doors from the staging/receiving front into each rear room.
  glassPartitionWithGap(f1, -11.23, 0.25, -0.91, -1.12, 1.74, 'h', 'solid', 'MDF CONTROL');
  glassPartitionWithGap(f1, 0.47, 11.22, -0.91, 7.08, 1.9, 'h', 'glass', 'MAINTENANCE');
  // Metal kick guards beside the logistics entrance, leaving the passage unobstructed.
  for (const x of [-3.54, 3.72])
    box(f1, 0.12, 0.88, 0.3, x, 0.84, 8.42, M.brushed, { cast: false });
  station(f1, 'SEC-DESK-01', -9.8, 6.25, '보안 안내 데스크', 'scanner');
  securityGate(f1, -7.95, 1.6, 'GATE-01');
  securityGate(f1, -5.72, 1.6, 'GATE-02');
  // Public approach: front entrance → security reception → access gates.
  makeMainEntrance(f1);
  station(f1, 'STAGE-01', -1.65, 5.1, '장비 반입 검수', 'workbench');
  station(f1, 'STAGE-02', 2.05, 5.1, '장비 초기 설정', 'maintenance');
  // Spare rack faces stay toward the inspection aisle; move racks to the eastern wall.
  for (let i = 0; i < 3; i++) shelf(f1, 9.55, 2.65 + i * 2.15, `SPARE-0${i + 1}`);
  for (let i = 0; i < 4; i++)
    networkCabinet(f1, -9.5 + i * 2.4, -5.85, ['MDF-01', 'CORE-01', 'FW-01', 'PATCH-01'][i]);
  for (let i = 0; i < 3; i++)
    networkCabinet(f1, -9.5 + i * 2.4, -2.72, ['WAN-01', 'SEC-SW-01', 'NTP-01'][i]);
  station(f1, 'SUPPORT-01', 6.65, -4.9, '유지보수 작업대', 'workbench');
  upsCabinet(f1, 9.35, -5.2, 'EDGE-PDU-01', 'SWITCHGEAR');
  for (const [n, x, z] of [
    ['출입·보안', -8.3, 8.0],
    ['장비 검수', -0.1, 8.0],
    ['예비품 보관', 7.6, 8.0],
    ['MDF · 네트워크', -6.7, -8.1],
    ['설비 지원', 6.8, -8.1],
  ])
    shortText(f1, n, x, z, 3.6);
  cableTray(f1, -5.9, -5.6, 5, 5, 'x');
}
