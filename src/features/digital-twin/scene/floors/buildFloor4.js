export function buildFloor4(context) {
  const {
    THREE,
    f4,
    area,
    glassPartitionWithGap,
    multiDoorPartition,
    partitionSegment,
    portal,
    box,
    M,
    securityGate,
    networkCabinet,
    floorDecal,
    shortText,
    mat,
    screenDashboard,
    glowStrip,
    textPlate,
    register,
    fxPlane,
    registerFx,
    fxSphere,
    cylinder,
    cableTray,
    detailShells,
  } = context;
  // 4F: one public central access spine, two secure control rooms and rear meeting/support spaces.
  area(f4, 'NOC CONTROL', -6.0, -2.55, 11.15, 12.15, 0x1e505c);
  area(f4, 'SOC SECURITY', 6.0, -2.55, 10.95, 12.15, 0x284b58);
  area(f4, 'INCIDENT RESPONSE', -6.9, 6.28, 9.6, 4.35, 0x294b5c);
  area(f4, 'SHIFT HANDOVER', 1.15, 6.28, 6.05, 4.35, 0x2b5260);
  area(f4, 'ACCESS / CONTROL', 8.3, 6.28, 5.25, 4.35, 0x26585a);
  // Two acoustically separated control rooms, joined only by an internal secure portal.
  glassPartitionWithGap(f4, -9.11, 3.93, 0, -0.74, 1.96, 'v', 'solid', 'NOC / SOC STAFF');
  // Public operations gallery: continuous partition, two real controlled entrances.
  multiDoorPartition(
    f4,
    -11.2,
    11.2,
    3.93,
    [
      { pos: -6.55, width: 2.0, label: 'NOC ACCESS' },
      { pos: 6.55, width: 2.0, label: 'SOC ACCESS' },
    ],
    'h',
    'glass'
  );
  // A 1.7m-deep shared gallery between the control rooms and the rear support rooms.
  // Separate meeting, shift-handover and security offices have doors to this gallery.
  multiDoorPartition(
    f4,
    -11.2,
    11.2,
    5.64,
    [
      { pos: -6.6, width: 1.95, label: 'RESPONSE ROOM' },
      { pos: 1.05, width: 1.95, label: 'SHIFT ROOM' },
      { pos: 8.18, width: 1.95, label: 'SECURE ROOM' },
    ],
    'h',
    'glass'
  );
  partitionSegment(f4, -2.1, 7.35, 3.53, 'v', 'glass');
  partitionSegment(f4, 4.35, 7.35, 3.53, 'v', 'solid');
  // The east side of the gallery is the main building entrance from the open cutaway.
  portal(f4, 11.25, 4.78, 'v', 'MAIN ACCESS');
  for (const x of [-6.8, 1.3, 8.0])
    box(f4, 3.25, 0.09, 0.11, x, 3.25, 4.4, M.brushed, { cast: false });
  securityGate(f4, 8.7, 7.45, 'F4-ACCESS-01');
  networkCabinet(f4, 10.2, 7.8, 'NOC-NET-01');
  floorDecal(f4, 'FACILITY NOC', -6.5, 0.9, 3.2, '#20414b');
  floorDecal(f4, 'SECURITY SOC', 6.2, 0.9, 3.2, '#20384e');
  shortText(f4, 'NOC 시설 관제', -6.5, 2.85, 3.6, '#275c62');
  shortText(f4, 'SOC 보안 관제', 6.2, 2.85, 3.6, '#344968');
  shortText(f4, '상황 대응실', -6.5, 8.4, 3.0, '#31516a');
  shortText(f4, '교대 · 운영 지원', 1.05, 8.4, 3.75, '#315a60');
  shortText(f4, '보안 · 통신', 8.2, 8.4, 2.8, '#235f5e');

  function monitorWall(g, id, x0, x1, z, title, accent = 0x66d5f2) {
    const root = new THREE.Group();
    root.position.set(0, 0.4, 0);
    g.add(root);
    // Serviceable array attached to the rear wall, with status & telemetry geometry.
    const columns = 4,
      rows = 2,
      w = (x1 - x0 - 0.18) / columns,
      screenH = 0.82;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < columns; i++) {
        const x = x0 + w * (i + 0.5),
          y = 1.25 + (rows - 1 - j) * 0.92;
        box(root, w - 0.08, screenH + 0.06, 0.11, x, y, z, M.black, { cast: false });
        box(
          root,
          w - 0.19,
          screenH - 0.06,
          0.019,
          x,
          y,
          z + 0.07,
          screenDashboard(i % 3 === 1 ? 1 : 0),
          { cast: false }
        );
        // Miniature dashboards: utilization bars, alarm traces, status tiles.
        for (let k = 0; k < 5; k++) {
          const hh = 0.06 + ((i * 3 + j * 7 + k * 5) % 6) * 0.048;
          glowStrip(
            root,
            0.085,
            hh,
            0.015,
            x - w * 0.33 + k * 0.18,
            y - 0.2 + hh * 0.5,
            z + 0.088,
            (i + j + k) % 11 === 0 ? 0xe9aa68 : accent
          );
        }
        glowStrip(root, w - 0.3, 0.018, 0.018, x, y + 0.26, z + 0.088, accent);
        for (let k = 0; k < 3; k++)
          glowStrip(
            root,
            0.19,
            0.018,
            0.019,
            x - w * 0.26 + k * 0.24,
            y - 0.31,
            z + 0.09,
            0x5d94ab
          );
      }
    box(root, x1 - x0 + 0.22, 0.16, 0.22, (x1 + x0) / 2, 2.88, z - 0.06, M.brushed);
    textPlate(root, title, (x0 + x1) / 2, 3.15, z + 0.12, 3.35, 0.26, '#e4f6ff', '#1d4756');
    register(root, id, {
      zone: 'noc',
      type: title.startsWith('NOC') ? 'NOC VIDEO WALL' : 'SOC VIDEO WALL',
      name: title,
      location: '본관 · 4F 통합 관제실',
      temp: 23.7,
      power: 1.9,
      capacity: 88,
      summary: '전산실·전력·냉각·보안 운영 지표를 표시하는 상황판.',
      markerLocal: [(x0 + x1) / 2, 0, z],
    });
    const faultTiles = [];
    for (const [tx, ty] of [
      [x0 + w * 0.5, 2.17],
      [x0 + w * 1.5, 1.25],
      [x0 + w * 2.5, 2.17],
    ]) {
      const tile = fxPlane(root, w - 0.23, screenH - 0.1, tx, ty, z + 0.091, 0xff5f6d, 0.0);
      tile.visible = false;
      faultTiles.push(tile);
    }
    const headerStrip = fxPlane(root, 2.8, 0.14, (x0 + x1) / 2, 2.58, z + 0.1, 0xf1b56f, 0.0);
    headerStrip.visible = false;
    registerFx(id, { kind: 'videoWall', faultTiles, headerStrip });
  }
  function operatorConsole(g, id, x, z, team = 'NOC') {
    const root = new THREE.Group();
    root.position.set(x, 0.4, z);
    g.add(root);
    box(root, 2.44, 0.12, 1.18, 0, 0.78, 0, mat(0x4b6979, 0.35, 0.42), { rounded: true });
    for (const px of [-1.0, 1.0])
      for (const pz of [-0.45, 0.45]) box(root, 0.11, 0.7, 0.12, px, 0.43, pz, M.edge);
    box(root, 2.15, 0.08, 0.14, 0, 1.02, -0.48, M.brushed);
    for (const cx of [-0.61, 0.61]) {
      box(root, 1.0, 0.62, 0.07, cx, 1.38, -0.41, M.black);
      box(root, 0.91, 0.52, 0.012, cx, 1.38, -0.365, screenDashboard(team === 'SOC' ? 1 : 2), {
        cast: false,
      });
      for (let k = 0; k < 4; k++)
        glowStrip(
          root,
          0.1 + k * 0.025,
          0.028,
          0.015,
          cx - 0.29 + k * 0.17,
          1.4 + (k % 3) * 0.08,
          -0.352,
          k === 3 ? 0xefb071 : 0x72d9e4
        );
      box(root, 0.31, 0.045, 0.28, cx, 0.99, -0.32, M.brushed);
    }
    box(root, 0.55, 0.035, 0.19, 0, 0.885, 0.19, M.vent);
    // Chair, castors and armrests.
    cylinder(root, 0.3, 0.075, 0, 0.27, 1.05, M.black);
    cylinder(root, 0.058, 0.42, 0, 0.48, 1.05, M.brushed);
    box(root, 0.67, 0.15, 0.62, 0, 0.57, 1.05, M.cabinet, { rounded: true });
    box(root, 0.68, 0.74, 0.13, 0, 1.04, 1.3, M.cabinet, { rounded: true });
    for (const arm of [-0.35, 0.35]) box(root, 0.09, 0.075, 0.44, arm, 0.8, 1.09, M.edge);
    box(root, 0.12, 0.032, 0.85, 0, 0.12, 1.05, M.brushed);
    textPlate(root, id, 0, 0.63, 0.65, 1.5, 0.22, '#d6f5fc', '#21465c');
    register(root, id, {
      zone: 'noc',
      type: team + ' OPERATOR CONSOLE',
      name: team + ' 운영 콘솔 ' + id,
      location: '본관 · 4F ' + (team === 'NOC' ? '시설 관제실' : '보안 관제실'),
      temp: 23.1,
      power: 0.75,
      capacity: 75,
      summary:
        team === 'NOC'
          ? '시설·전력·냉각·서버 장애에 대한 NOC 운영자 워크스테이션.'
          : '보안 경보와 침해 이벤트를 확인하는 SOC 운영자 워크스테이션.',
    });
    const statusStrip = fxPlane(root, 1.8, 0.1, 0, 1.03, -0.34, 0xf1b66d, 0.0);
    statusStrip.visible = false;
    const deskBeacon = fxSphere(root, 0.08, 0, 1.72, -0.3, 0xf0b36e, 0.0);
    deskBeacon.visible = false;
    registerFx(id, { kind: 'operatorConsole', statusStrip, deskBeacon });
  }
  function incidentTable(g) {
    const root = new THREE.Group();
    root.position.set(-6.4, 0.4, 7.47);
    g.add(root);
    box(root, 4.0, 0.17, 1.55, 0, 0.83, 0, mat(0x5b7884, 0.4, 0.43), { rounded: true });
    for (const sx of [-1, 1]) box(root, 0.12, 0.78, 1.21, sx * 1.72, 0.44, 0, M.steel);
    for (const x of [-1.15, 0, 1.15]) {
      box(root, 0.78, 0.49, 0.06, x, 1.43, -0.45, M.black);
      box(root, 0.69, 0.39, 0.014, x, 1.43, -0.407, M.screen, { cast: false });
    }
    for (const x of [-1.25, 0, 1.25])
      for (const z of [-0.96, 0.96]) {
        cylinder(root, 0.26, 0.08, x, 0.26, z, M.black);
        box(root, 0.46, 0.54, 0.13, x, 0.9, z + (z < 0 ? -0.17 : 0.17), M.cabinet, {
          rounded: true,
        });
      }
    register(root, 'INCIDENT-01', {
      zone: 'noc',
      type: 'INCIDENT RESPONSE',
      name: '상황 대응·협업실',
      location: '본관 · 4F 상황 대응실',
      temp: 23.2,
      power: 0.55,
      capacity: 95,
      summary: '장애 인지, 담당자 지정, 조치 승인 및 교대 회의를 지원하는 별도 구획의 상황 대응실.',
    });
  }
  function handoverDesk(g) {
    const root = new THREE.Group();
    root.position.set(1.65, 0.4, 7.45);
    g.add(root);
    box(root, 3.35, 0.14, 1.36, 0, 0.84, 0, M.brushed, { rounded: true });
    for (const sx of [-1, 1]) box(root, 0.13, 0.78, 1.05, sx * 1.49, 0.45, 0, M.steel);
    for (const x of [-1.0, 0, 1.0]) {
      box(root, 0.79, 0.54, 0.08, x, 1.35, -0.4, M.black);
      box(root, 0.69, 0.45, 0.012, x, 1.35, -0.352, M.screen, { cast: false });
      box(root, 0.55, 0.05, 0.22, x, 0.98, 0.15, M.edge, { cast: false });
    }
    register(root, 'SHIFT-01', {
      zone: 'noc',
      type: 'OPERATIONS SUPPORT',
      name: '교대 인계·운영 지원 데스크',
      location: '본관 · 4F 운영 지원실',
      temp: 23.1,
      power: 0.65,
      capacity: 80,
      summary: '교대 인계, 작업 지시, 장애 티켓 기록 등을 수행하는 운영 지원 공간.',
    });
  }
  monitorWall(f4, 'NOC-WALL-01', -10.7, -1.17, -8.7, 'NOC FACILITY WALL', 0x74d4ed);
  monitorWall(f4, 'SOC-WALL-01', 1.2, 10.69, -8.7, 'SOC SECURITY WALL', 0x85b8fc);
  for (const [id, x, z] of [
    ['NOC-OPS-01', -8.25, -4.75],
    ['NOC-OPS-02', -4.7, -4.75],
    ['NOC-OPS-03', -8.25, -0.9],
    ['NOC-OPS-04', -4.7, -0.9],
  ])
    operatorConsole(f4, id, x, z, 'NOC');
  for (const [id, x, z] of [
    ['SOC-OPS-01', 4.1, -4.75],
    ['SOC-OPS-02', 8.1, -4.75],
    ['SOC-OPS-03', 6.1, -0.9],
  ])
    operatorConsole(f4, id, x, z, 'SOC');
  incidentTable(f4);
  handoverDesk(f4);
  // Overhead services along the central aisle with floor-level emergency markings.
  cableTray(f4, 0, -3.1, 0.6, 10.8);
  for (const x of [-10.25, -1.68, 1.65, 10.25])
    glowStrip(detailShells['4F'].ceiling, 0.13, 0.043, 9.5, x, 3.55, -3.2, 0x82d3cc);
  // See path4 for access lanes; keep floor clear of diagonal construction hatch stripes.
}
