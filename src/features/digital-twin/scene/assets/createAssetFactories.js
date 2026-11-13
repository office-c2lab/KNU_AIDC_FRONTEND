/* eslint-disable no-unused-vars -- decorative meshes are created for side effects */
import { assertContext } from '../core/assertContext.js';

export function createAssetFactories(context) {
  assertContext(
    context,
    [
      'THREE',
      'box',
      'line',
      'register',
      'finishRack',
      'engineeringRack',
      'instanceBoxes',
      'fxSphere',
    ],
    'createAssetFactories'
  );
  const {
    THREE,
    box,
    M,
    mat,
    glowStrip,
    textPlate,
    register,
    finishRack,
    engineeringRack,
    doors,
    heatDisks,
    registerFx,
    fxPlane,
    fxLed,
    finishCdu,
    engineeringCdu,
    pipe,
    finishUps,
    engineeringUps,
    cylinder,
    finishChiller,
    engineeringChiller,
    leds,
    instanceBoxes,
    fxSphere,
    line,
    addEdges,
  } = context;
  function rack(g, id, x, z, gpu = false) {
    // Convention: every rack front faces +Z, independent of row/location.
    const rackRoot = new THREE.Group();
    rackRoot.position.set(x, 0.42, z);
    rackRoot.rotation.y = 0;
    g.add(rackRoot);
    const w = 1.36,
      h = 2.49,
      d = 1.3,
      metal = gpu ? M.purple : M.cabinet;
    // Steel rack skeleton with separate panels and raised feet.
    box(rackRoot, w - 0.12, h - 0.13, 0.075, 0, h / 2 + 0.1, -0.55, M.black);
    box(rackRoot, w - 0.11, 0.13, d - 0.13, 0, 2.43, 0.0, M.black);
    box(rackRoot, w - 0.11, 0.13, d - 0.13, 0, 0.3, 0.0, M.black);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        box(rackRoot, 0.096, h, 0.095, sx * 0.645, h / 2 + 0.13, sz * 0.612, metal);
        box(rackRoot, 0.23, 0.13, 0.22, sx * 0.51, 0.09, sz * 0.45, M.brushed);
      }
    box(rackRoot, w, 0.11, d, 0, h + 0.1, 0, metal);
    box(rackRoot, w, 0.12, d, 0, 0.18, 0, metal);
    box(rackRoot, 0.08, h, 0.13, -0.64, h / 2 + 0.13, 0, M.edge);
    box(rackRoot, 0.08, h, 0.13, 0.64, h / 2 + 0.13, 0, M.edge);
    box(rackRoot, 1.12, 2.06, 0.1, 0, 1.33, -0.63, mat(0x19293a, 0.3, 0.5));
    // Individual hot-swappable server drawers; vent slits share a single draw call.
    const frontSlits = [];
    for (let i = 0; i < 12; i++) {
      if (i === 5 || i === 6) continue; // service sled occupies two contiguous U slots
      const y = 0.36 + i * 0.163;
      const caseMesh = box(
        rackRoot,
        1.12,
        0.134,
        0.68,
        0,
        y,
        0.19,
        i % 4 === 0 ? M.cabinet : M.server
      );
      box(rackRoot, 1.085, 0.11, 0.026, 0, y, 0.55, M.black, { cast: false });
      for (let j = 0; j < 10; j++) frontSlits.push([-0.44 + j * 0.095, y, 0.571]);
      box(rackRoot, 0.095, 0.076, 0.027, 0.43, y, 0.575, M.brushed, { cast: false });
      const led = glowStrip(
        rackRoot,
        0.037,
        0.037,
        0.017,
        -0.53,
        y,
        0.579,
        gpu ? 0x9ca7ff : 0x67e8c3
      );
      if (i % 3 === 0) leds.push({ mesh: led, id, type: 'rack' });
      // Pull handles on the edges.
      box(rackRoot, 0.043, 0.07, 0.045, -0.535, y, 0.58, M.brushed, { cast: false });
    }
    instanceBoxes(rackRoot, 0.053, 0.044, 0.014, frontSlits, M.vent);
    // Side vent slits + realistic fan silhouettes on the back.
    const sideSlits = [];
    for (const sx of [-1, 1]) {
      box(rackRoot, 0.02, 1.68, 0.95, sx * 0.674, 1.29, -0.03, mat(0x355065, 0.2, 0.7));
      for (let v = 0; v < 12; v++) sideSlits.push([sx * 0.687, 0.58 + v * 0.12, -0.05]);
    }
    instanceBoxes(rackRoot, 0.021, 0.018, 0.74, sideSlits, M.black);
    for (let v = 0; v < 3; v++) {
      const fan = cylinder(rackRoot, 0.15, 0.012, -0.3 + v * 0.3, 2.17, -0.656, M.black, 16);
      fan.rotation.x = Math.PI / 2;
      for (let k = 0; k < 5; k++) {
        const a = (k * 2 * Math.PI) / 5;
        const blade = box(
          rackRoot,
          0.042,
          0.14,
          0.018,
          -0.3 + v * 0.3 + Math.sin(a) * 0.055,
          2.17 + Math.cos(a) * 0.055,
          -0.668,
          M.edge,
          { cast: false }
        );
        blade.rotation.z = -a;
      }
    }
    // Nameplate with selectable ID.
    const name = textPlate(rackRoot, id, 0, 2.31, 0.672, 1.06, 0.26, '#b4f3ff', '#213a4e');
    // Door pivot on the rack front hinge, opened via double click.
    const hinge = new THREE.Group();
    hinge.position.set(-0.64, 0, 0.735);
    rackRoot.add(hinge);
    box(hinge, 1.27, 2.18, 0.042, 0.635, 1.24, 0, M.glass, { cast: false });
    box(hinge, 1.32, 0.064, 0.08, 0.66, 2.35, 0, metal);
    box(hinge, 1.32, 0.064, 0.08, 0.66, 0.16, 0, metal);
    box(hinge, 0.065, 2.19, 0.08, 0.025, 1.255, 0, metal);
    box(hinge, 0.065, 2.19, 0.08, 1.29, 1.255, 0, metal);
    for (let k = 0; k < 8; k++)
      box(hinge, 1.14, 0.018, 0.03, 0.665, 0.36 + k * 0.25, 0.055, M.edge, { cast: false });
    box(hinge, 0.038, 0.29, 0.08, 1.18, 1.24, 0.084, M.brushed);
    const rackDoor = { hinge, open: false, id };
    doors.push(rackDoor);
    finishRack(rackRoot, id, gpu);
    engineeringRack(rackRoot, id, gpu, rackDoor);
    const info = {
      name: `${gpu ? 'GPU' : '표준'} 서버 랙 ${id}`,
      zone: gpu ? 'gpu' : 'general',
      type: gpu ? 'GPU SERVER RACK' : 'SERVER RACK',
      temp: gpu
        ? 25.6 + (id.charCodeAt(id.length - 1) % 4) * 0.6
        : 21.9 + (id.charCodeAt(id.length - 1) % 5) * 0.45,
      power: gpu ? 8.2 : 3.6,
      capacity: gpu ? 86 : 62,
      location: `본관 · ${gpu ? 'AI 전산실' : '일반 서버실'}`,
      summary: gpu
        ? 'GPU 학습·추론 워크로드가 실행되는 고밀도 랙. 후면 냉각 계통과 CDU 연계.'
        : '가상화·스토리지·업무 시스템을 위한 표준 서버 랙.',
      work: ['정기 상태 점검 완료', '전원 및 온도 모니터링 중'],
    };
    register(rackRoot, id, info);
    const statusLeds = [];
    for (let i = 0; i < 4; i++)
      statusLeds.push(
        fxLed(
          rackRoot,
          0.055,
          0.05,
          0.018,
          -0.25 + i * 0.17,
          2.15,
          0.676,
          gpu ? 0x9ca7ff : 0x64e6c3
        )
      );
    const alarmLens = fxLed(rackRoot, 0.11, 0.05, 0.018, 0.43, 2.15, 0.676, 0xf2b56a);
    alarmLens.visible = false;
    const heatBeacon = fxSphere(rackRoot, 0.11, 0, 2.54, 0.26, 0xff6e78, 0.86);
    heatBeacon.visible = false;
    const slotOverlays = [];
    for (let i = 0; i < 2; i++) {
      const ov = fxPlane(rackRoot, 1.0, 0.16, 0, 0.86 + i * 1.02, 0.606, 0xff6a75, 0.0);
      ov.visible = false;
      slotOverlays.push(ov);
    }
    registerFx(id, {
      kind: gpu ? 'gpuRack' : 'serverRack',
      statusLeds,
      alarmLens,
      heatBeacon,
      slotOverlays,
    });
    const disk = new THREE.Mesh(
      new THREE.CircleGeometry(1.12, 40),
      new THREE.MeshBasicMaterial({
        color: gpu ? 0xe1a86d : 0x5dd0c5,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    disk.rotation.x = -Math.PI / 2;
    disk.position.set(x, 0.415, z);
    g.add(disk);
    heatDisks.push({ mesh: disk, entityId: id });
    return rackRoot;
  }
  function crac(g, x, z, id) {
    const root = new THREE.Group();
    root.position.set(x, 0.39, z);
    g.add(root);
    box(root, 1.28, 2.27, 0.84, 0, 1.135, 0, mat(0xabc4cf, 0.45, 0.38), { rounded: true });
    box(root, 1.03, 1.54, 0.035, 0, 1.33, 0.441, M.cool);
    for (let i = 0; i < 17; i++)
      box(root, 0.96, 0.016, 0.038, 0, 0.67 + i * 0.077, 0.463, M.dark, { cast: false });
    box(root, 0.43, 0.26, 0.04, 0, 2.02, 0.464, M.screen);
    box(root, 0.22, 0.035, 0.01, -0.06, 2.02, 0.488, M.accent, { cast: false });
    textPlate(root, id, 0, 2.14, 0.466, 0.61, 0.12, '#c5faff', '#2a4c5c');
    register(root, id, {
      zone: 'cooling',
      type: 'PRECISION AIR COOLING',
      name: `정밀 공조기 ${id}`,
      location: '본관 · 전산실 후면',
      temp: 20.4,
      power: 3.1,
      capacity: 72,
      summary: '차가운 공기를 전산실 바닥 및 콜드아일로 공급하는 정밀 공조 장치.',
    });
  }
  function cdu(g, x, z, id) {
    const root = new THREE.Group();
    root.position.set(x, 0.38, z);
    g.add(root);
    box(root, 1.5, 2.05, 1.0, 0, 1.03, 0, mat(0xb5cad0, 0.55, 0.36), { rounded: true });
    box(root, 1.3, 1.57, 0.03, 0, 1.02, 0.517, M.cool);
    for (let k = 0; k < 12; k++)
      box(root, 0.95, 0.016, 0.039, 0, 0.49 + k * 0.078, 0.537, M.dark, { cast: false });
    box(root, 0.55, 0.36, 0.04, 0, 1.73, 0.544, M.screen);
    for (let k = 0; k < 3; k++)
      glowStrip(
        root,
        0.08,
        0.04,
        0.01,
        -0.14 + k * 0.14,
        1.72,
        0.57,
        k === 2 ? 0x47e8b5 : 0x4dc1ef
      );
    for (const sx of [-0.38, 0.38])
      pipe(
        root,
        [
          [sx, 2.1, -0.45],
          [sx, 2.7, -0.45],
          [sx, 2.7, -1.25],
        ],
        0.07,
        sx < 0 ? 0x65dcea : 0xebaa65,
        16
      );
    finishCdu(root);
    engineeringCdu(root, id);
    register(root, id, {
      zone: 'gpu',
      type: 'COOLANT DISTRIBUTION UNIT',
      name: `냉각 분배 장치 ${id}`,
      location: '본관 · AI 전산실',
      temp: 21.7,
      power: 2.1,
      capacity: 77,
      summary: '액체냉각 계통의 유량·온도·압력을 관리하는 CDU. GPU 랙에 냉각수를 공급합니다.',
    });
    const panelGlow = fxPlane(root, 0.5, 0.3, 0, 1.73, 0.585, 0x62d7ec, 0.35);
    panelGlow.visible = false;
    const flowLeds = [];
    for (let i = 0; i < 4; i++)
      flowLeds.push(fxLed(root, 0.09, 0.035, 0.012, -0.22 + i * 0.15, 1.72, 0.575, 0x6ce2ef));
    const leakDrops = [];
    for (let i = 0; i < 3; i++) {
      const d = fxSphere(root, 0.05, 0.5, 0.45 - i * 0.13, 0.36, 0x7ae9f4, 0.75);
      d.visible = false;
      leakDrops.push(d);
    }
    const beacon = fxSphere(root, 0.1, 0, 2.22, 0.18, 0xff6d77, 0.88);
    beacon.visible = false;
    registerFx(id, { kind: 'cdu', panelGlow, flowLeds, leakDrops, beacon });
  }
  function networkCabinet(g, x, z, id) {
    const root = new THREE.Group();
    root.position.set(x, 0.39, z);
    g.add(root);
    box(root, 1.1, 2.0, 0.7, 0, 1, 0, M.cabinet, { rounded: true });
    box(root, 0.96, 1.75, 0.08, 0, 1.04, 0.388, M.black);
    for (let i = 0; i < 11; i++) {
      box(root, 0.85, 0.1, 0.018, 0, 0.36 + i * 0.137, 0.449, i < 4 ? M.cool : M.server, {
        cast: false,
      });
      for (let j = 0; j < 11; j++)
        glowStrip(
          root,
          0.018,
          0.027,
          0.008,
          -0.35 + j * 0.061,
          0.36 + i * 0.137,
          0.466,
          (i + j) % 3 === 0 ? 0x60ebcb : 0x50aed5
        );
    }
    textPlate(root, id, 0, 1.91, 0.44, 0.9, 0.18);
    register(root, id, {
      zone: 'network',
      type: 'NETWORK EQUIPMENT',
      name: `네트워크 장비 ${id}`,
      location: '본관 · MDF 네트워크 구역',
      temp: 22.1,
      power: 1.5,
      capacity: 47,
      summary: '코어 네트워크 및 데이터센터 내부 서비스 구간을 담당하는 장비.',
    });
    const uplinkGlow = fxPlane(root, 0.44, 0.12, 0, 1.82, 0.474, 0xff6f79, 0.0);
    uplinkGlow.visible = false;
    const portFault = [];
    for (let i = 0; i < 8; i++)
      portFault.push(fxLed(root, 0.03, 0.025, 0.012, -0.3 + i * 0.085, 1.81, 0.479, 0xf2b56c));
    const linkArc = line(root, [0, 1.7, 0.48], [0, 2.18, 0.15], 0xff8d78, 0.0);
    linkArc.visible = false;
    registerFx(id, { kind: 'network', uplinkGlow, portFault, linkArc });
  }
  function upsCabinet(g, x, z, id, kind = 'UPS') {
    const root = new THREE.Group();
    root.position.set(x, 0.39, z);
    g.add(root);
    const body = box(root, 1.55, 2.28, 1.1, 0, 1.14, 0, mat(0x91a5ad, 0.53, 0.36), {
      rounded: true,
    });
    addEdges(root, body, 0xc4d6dc, 0.55);
    box(root, 1.42, 2, 0.035, 0, 1.22, 0.57, mat(0xa9bec6, 0.3, 0.45));
    box(root, 0.62, 0.36, 0.04, 0, 1.86, 0.594, M.screen);
    glowStrip(root, 0.27, 0.03, 0.02, 0, 1.88, 0.62, 0x7ae5da);
    for (let i = 0; i < 12; i++)
      box(root, 1.06, 0.025, 0.05, 0, 0.42 + i * 0.09, 0.609, M.steel, { cast: false });
    textPlate(root, id, 0, 2.16, 0.597, 0.9, 0.18, '#d7f7ff', '#49636f');
    finishUps(root, kind);
    engineeringUps(root, id, kind);
    const info = {
      zone: 'power',
      type: kind,
      name: `${kind === 'BATTERY' ? '배터리 저장 장치' : kind === 'SWITCHGEAR' ? '수배전반' : '무정전 전원 장치'} ${id}`,
      location: '전력 설비동',
      temp: kind === 'BATTERY' ? 24.4 : 25.1,
      power: kind === 'UPS' ? 1.4 : 0.5,
      capacity: kind === 'BATTERY' ? 89 : 74,
      summary: '전력 공급 안정성과 이중화 상황을 관리하는 전기 지원 설비.',
    };
    register(root, id, info);
    const statusBars = [];
    for (let i = 0; i < 4; i++)
      statusBars.push(
        fxLed(
          root,
          0.18,
          0.035,
          0.014,
          -0.31 + i * 0.2,
          1.67,
          0.62,
          kind === 'BATTERY' ? 0xa7dd6e : 0x67e3cb
        )
      );
    const screenGlow = fxPlane(root, 0.48, 0.2, 0, 1.86, 0.618, 0xf1b66d, 0.0);
    screenGlow.visible = false;
    const beacon = fxSphere(root, 0.1, 0, 2.32, 0.15, 0xff6d77, 0.86);
    beacon.visible = false;
    registerFx(id, {
      kind: kind === 'BATTERY' ? 'battery' : kind === 'SWITCHGEAR' ? 'switchgear' : 'ups',
      statusBars,
      screenGlow,
      beacon,
    });
    return root;
  }
  function hvacFan(g, x, y, z, r = 0.53) {
    const surround = cylinder(g, r, 0.1, x, y, z, M.brushed, 32);
    const disc = cylinder(g, r * 0.84, 0.06, x, y + 0.08, z, M.black, 32);
    for (let j = 0; j < 6; j++) {
      const blade = box(
        g,
        0.15,
        0.03,
        r * 0.68,
        x + Math.cos((j * Math.PI) / 3) * 0.13,
        y + 0.13,
        z + Math.sin((j * Math.PI) / 3) * 0.13,
        M.cool
      );
      blade.rotation.y = (j * Math.PI) / 3;
    }
    cylinder(g, 0.12, 0.08, x, y + 0.16, z, M.edge, 24);
    return { surround, disc };
  }
  function chiller(g, x, z, id) {
    const root = new THREE.Group();
    root.position.set(x, 0.39, z);
    g.add(root);
    box(root, 3.4, 1.68, 1.65, 0, 0.89, 0, mat(0x9bb5bd, 0.48, 0.44), { rounded: true });
    for (const sx of [-0.93, 0.93]) hvacFan(root, sx, 1.81, 0, 0.53);
    for (let k = 0; k < 18; k++)
      box(root, 0.025, 1.05, 0.012, -1.45 + k * 0.17, 0.86, 0.838, M.steel, { cast: false });
    box(root, 0.46, 0.42, 0.04, 1.2, 1.14, 0.85, M.screen);
    textPlate(root, id, 0, 0.28, 0.84, 1.45, 0.23, '#c0f6ff', '#4a6573');
    pipe(
      root,
      [
        [-1.25, 0.3, -0.85],
        [-1.25, 0.3, -1.38],
        [-2.05, 0.3, -1.38],
      ],
      0.12,
      0x54c7e3,
      12
    );
    pipe(
      root,
      [
        [1.25, 0.3, -0.85],
        [1.25, 0.3, -1.38],
        [2, 0.3, -1.38],
      ],
      0.12,
      0xe2a673,
      12
    );
    finishChiller(root);
    engineeringChiller(root, id);
    register(root, id, {
      zone: 'cooling',
      type: 'CHILLER',
      name: `냉동기 ${id}`,
      location: '냉각 설비동',
      temp: 18.8,
      power: 3.2,
      capacity: 68,
      summary: '전산실과 GPU 액체냉각 계통에 필요한 냉수를 생산하는 냉동 설비.',
    });
    const panelGlow = fxPlane(root, 0.4, 0.28, 1.2, 1.14, 0.875, 0xff6d77, 0.0);
    panelGlow.visible = false;
    const fanAlerts = [
      fxSphere(root, 0.08, -0.93, 1.81, 0.58, 0xf0b36e, 0.0),
      fxSphere(root, 0.08, 0.93, 1.81, 0.58, 0xf0b36e, 0.0),
    ];
    fanAlerts.forEach(x => (x.visible = false));
    const beacon = fxSphere(root, 0.1, 0, 2.15, 0.18, 0xff6d77, 0.86);
    beacon.visible = false;
    registerFx(id, { kind: 'chiller', panelGlow, fanAlerts, beacon });
  }
  function pump(g, x, z, id) {
    const root = new THREE.Group();
    root.position.set(x, 0.39, z);
    g.add(root);
    box(root, 1.25, 0.24, 1.05, 0, 0.15, 0, M.brushed, { rounded: true });
    const motor = cylinder(root, 0.37, 0.94, 0, 0.72, 0, M.cool, 24);
    box(root, 0.8, 0.25, 0.83, 0, 1.23, 0, M.cabinet);
    pipe(
      root,
      [
        [-0.75, 0.4, 0],
        [-0.42, 0.4, 0],
        [0.45, 0.4, 0],
        [0.78, 0.4, 0],
      ],
      0.11,
      0x68d9e6,
      15
    );
    textPlate(root, id, 0, 1.48, 0.05, 0.82, 0.19, '#d3fdff', '#2b5868');
    register(root, id, {
      zone: 'cooling',
      type: 'COOLING PUMP',
      name: `순환 펌프 ${id}`,
      location: '냉각 설비동',
      temp: 20.2,
      power: 0.8,
      capacity: 65,
      summary: '냉각수 순환을 유지하고 설비 간 유량을 조절하는 펌프.',
    });
  }

  return { rack, crac, cdu, networkCabinet, upsCabinet, hvacFan, chiller, pump };
}
