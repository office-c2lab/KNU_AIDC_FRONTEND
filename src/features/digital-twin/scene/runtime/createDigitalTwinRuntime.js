/* eslint-disable no-unused-vars -- legacy geometry helpers are retained during modular migration */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinnedModel } from 'three/addons/utils/SkeletonUtils.js';
import { buildFloor1 } from '../floors/buildFloor1.js';
import { buildFloor2 } from '../floors/buildFloor2.js';
import { buildFloor3 } from '../floors/buildFloor3.js';
import { buildFloor4 } from '../floors/buildFloor4.js';
import { buildUtilityZones } from '../zones/buildUtilityZones.js';
import { createGeometryToolkit } from '../core/createGeometryToolkit.js';
import { createRenderingCore } from '../core/createRenderingCore.js';
import { createIncidentSelectors } from '../systems/createIncidentSelectors.js';
import { createAssetFactories } from '../assets/createAssetFactories.js';
import { createHumanModelLoader } from '../assets/createHumanModelLoader.js';
import { digitalTwinStore } from '../../../../stores/digitalTwinStore.js';
import { FLOOR_INFO, FLOOR_Y, zones } from '../config/facilityConfig.js';
import { SCENARIOS } from '../config/scenarioConfig.js';

export function initDigitalTwin(root) {
  /*
   * KNU AIDC Data Center Prototype V36 — cooling annex stray pipe cleanup; V35 facility picking retained.
   * 기존 KNU AIDC 시설 분류/자산 개념 참조, 수치 및 장애는 100% 프론트엔드 시뮬레이션.
   * 디테일 지오메트리(랙 프레임, 도어, 팬, CDU, 냉각기, UPS 등)는 JS에서 생성합니다.
   */
  const $ = q => root.querySelector(q);
  let disposed = false;
  const host = $('#render-host');
  const labelsHost = $('#world-labels');
  const clock = new THREE.Clock();
  const registry = new Map();
  const heatDisks = [];
  const leds = [];
  const doors = [];
  const flows = [];
  // Distance LOD: hide tiny floor-tile seams only when they become subpixel noise.
  const fineTileLines = [];
  let fineTileLinesVisible = true;
  const regionGroups = {};
  const modeButtons = [...root.querySelectorAll('[data-mode]')];
  const zoneButtons = [...root.querySelectorAll('[data-zone]')];
  const clamp = THREE.MathUtils.clamp;
  const palette = {
    structure: 0x5f7b8c,
    metal: 0x496376,
    steel: 0x20374a,
    deep: 0x101d2c,
    cyan: 0x61d9f0,
    blue: 0x3b9bc5,
    teal: 0x59dac4,
    green: 0x50d9a0,
    orange: 0xf1ab63,
    red: 0xff676f,
    purple: 0x9a8dfc,
    white: 0xe6f5fa,
  };
  const colors = {
    general: '#62c4e9',
    gpu: '#9c91f4',
    network: '#79d3bf',
    power: '#ffd05e',
    cooling: '#78dfff',
    noc: '#88bdd4',
  };

  const initialTwinState = digitalTwinStore.getState();
  let activeZone = initialTwinState.activeZone;
  let activeFloor = initialTwinState.activeFloor;
  // 0 = 층 적층 / 1 = 기본 분리 / 2 = 넓은 분리 (Three.js scene units).
  const FLOOR_SPACING = [0, 2.5, 6.5];
  const OVERVIEW_CAMERAS = [
    { position: [42, 36, 48], target: [0, 8, 0] },
    { position: [43, 40, 50], target: [0, 11, 0] },
    { position: [56, 61, 74], target: [0, 19, 0] },
  ];
  let splitLevel = initialTwinState.splitLevel;
  let floorTargets = { ...FLOOR_Y };
  const floorGroups = {};
  const floorBoundaries = [];
  let selectedHalo = null;
  let currentMode = initialTwinState.viewMode;
  // Independent visualization switches; network geometry is invisible by default.
  const utilityEnabled = { ...initialTwinState.utilities };
  let selectedId = initialTwinState.selectedId;
  let assetModalId = null;
  let lastEquipmentTap = null;
  // V6 fault scenarios: parallel incidents, independently acknowledged / resolved.
  const activeIncidents = new Map(
    initialTwinState.incidents.map(incident => [incident.id, incident])
  );
  const eventLog = [];
  let chosenScenarioId = initialTwinState.chosenScenarioId;
  let selectedIncidentId = initialTwinState.selectedIncidentId;
  let inspectorTab = 'asset';
  const issueMeshes = new Map();
  const issueLabels = new Map();
  const issueLinks = [];
  const deviceFx = new Map();
  const worldAlertsHost = $('#world-alerts');
  let hoveredId = null;
  let autoRotate = initialTwinState.autoRotate;
  let focusTween = null;
  let lastPointer = { x: 0, y: 0 };

  let highQuality = initialTwinState.highQuality;
  const twinActions = digitalTwinStore.getState();
  const syncIncidentStore = () => {
    twinActions.setScenarioState({ chosenScenarioId, selectedIncidentId });
    twinActions.setIncidents([...activeIncidents.values()]);
  };
  const { renderer, scene, camera, controls, applyRenderQuality } = createRenderingCore({
    THREE,
    OrbitControls,
    host,
    root,
    zones,
    getHighQuality: () => highQuality,
  });

  const {
    mat,
    M,
    box,
    instanceBoxes,
    cylinder,
    addEdges,
    pipe,
    line,
    glowStrip,
    makeText,
    textPlate,
    fxLed,
    fxPlane,
    fxSphere,
    registerFx,
    setFxColor,
    pulseOpacity,
    getScenarioIds,
  } = createGeometryToolkit({
    THREE,
    RoundedBoxGeometry,
    deviceFx,
  });

  // V15: high fidelity surfaces made procedurally without a DCC/modeling tool.
  const finishMaterials = {};
  const trimMaterials = {
    black: mat(0x142331, 0.72, 0.33),
    powder: mat(0x536c7a, 0.53, 0.48),
    satin: mat(0x90aabb, 0.75, 0.3),
    yellow: mat(0xd6af61, 0.25, 0.48),
    cyan: mat(0x5ab9da, 0.4, 0.38),
    violet: mat(0x9e95dc, 0.27, 0.45),
  };
  const screenMaterials = [];
  function seeded(n) {
    let x = n | 0;
    return () => {
      x = (x * 1664525 + 1013904223) | 0;
      return (x >>> 0) / 4294967296;
    };
  }
  function floorFinish(floor) {
    if (finishMaterials[floor]) return finishMaterials[floor];
    const p = {
      '1F': { base: '#384d5b', edge: '#7e98a7', inner: '#4d6672', cell: 1.12, rough: 0.69 },
      '2F': { base: '#40586a', edge: '#a1b7c5', inner: '#577082', cell: 0.88, rough: 0.53 },
      '3F': { base: '#354a5d', edge: '#819bad', inner: '#4b6380', cell: 0.88, rough: 0.56 },
      '4F': { base: '#304457', edge: '#7f9aae', inner: '#3b5266', cell: 1.32, rough: 0.82 },
    }[floor];
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');
    const rnd = seeded(floor.charCodeAt(0) * 231 + 69),
      sz = 384;
    ctx.fillStyle = p.base;
    ctx.fillRect(0, 0, sz, sz);
    const gradient = ctx.createLinearGradient(0, 0, sz, sz);
    gradient.addColorStop(0, '#ffffff17');
    gradient.addColorStop(0.46, '#00000004');
    gradient.addColorStop(1, '#00000023');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, sz, sz);
    // Distinct panel joint width, flush anti-static tile fasteners, and subtle metallic variation.
    ctx.lineWidth = floor === '4F' ? 6 : 8;
    ctx.strokeStyle = '#0b1c2aa9';
    ctx.strokeRect(2, 2, sz - 4, sz - 4);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = p.edge;
    ctx.strokeRect(10, 10, sz - 20, sz - 20);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = p.inner;
    ctx.strokeRect(18, 18, sz - 36, sz - 36);
    if (floor === '2F' || floor === '3F') {
      for (const [x, y] of [
        [26, 26],
        [sz - 26, 26],
        [26, sz - 26],
        [sz - 26, sz - 26],
      ]) {
        ctx.fillStyle = '#121f2b';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b5cbd4';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 17; i++) {
        const x = 35 + i * 19;
        ctx.strokeStyle = i % 2 ? '#ffffff07' : '#00000017';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 48);
        ctx.lineTo(x, sz - 48);
        ctx.stroke();
      }
    } else if (floor === '4F') {
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = '#adc6dd05';
        ctx.fillRect(i * 15, 0, 1, 384);
      }
    } else {
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#abbec41d';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(18, 42 + i * 56);
        ctx.lineTo(365, 42 + i * 56);
        ctx.stroke();
      }
    }
    for (let i = 0; i < 420; i++) {
      const v = rnd();
      ctx.fillStyle = v > 0.52 ? '#e5f3ff0c' : '#081a280e';
      ctx.fillRect(rnd() * sz, rnd() * sz, 1 + rnd() * 2, 1 + rnd() * 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(12, renderer.capabilities.getMaxAnisotropy());
    texture.repeat.set(23.6 / p.cell, 18.75 / p.cell);
    texture.needsUpdate = true;
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      metalness: floor === '4F' ? 0.09 : 0.28,
      roughness: p.rough,
      side: THREE.DoubleSide,
    });
    return (finishMaterials[floor] = material);
  }
  function luminousPanel(parent, x, y, z, w, h, color = 0x74c9e8) {
    box(parent, w + 0.14, h + 0.08, 0.092, x, y, z, trimMaterials.black, { cast: false });
    box(parent, w, h, 0.018, x, y, z + 0.062, mat(0x1d3b51, 0.09, 0.64), { cast: false });
    for (let k = 0; k < 4; k++)
      glowStrip(
        parent,
        w * 0.12,
        0.015,
        0.009,
        x - w * 0.32 + k * w * 0.2,
        y + h * 0.18,
        z + 0.077,
        color
      );
  }
  function floorDecal(parent, label, x, z, w = 3.2, bg = '#183347', color = '#dceef7') {
    const p = textPlate(parent, label, x, 0.49, z, w, 0.22, color, bg);
    p.rotation.x = -Math.PI / 2;
  }
  function finishFloor(parent, key) {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(23.55, 18.62), floorFinish(key));
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0.385;
    plane.receiveShadow = true;
    plane.name = key + ' / SURFACE';
    parent.add(plane);
    // Cutaway structural exposed rim and isolation rails.
    for (const z of [-9.25, 9.25]) {
      box(parent, 23.54, 0.082, 0.11, 0, 0.343, z, trimMaterials.satin, { cast: false });
      box(
        parent,
        23.54,
        0.02,
        0.037,
        0,
        0.397,
        z,
        key === '3F' ? trimMaterials.violet : trimMaterials.cyan,
        { cast: false }
      );
    }
    for (const x of [-11.65, 11.65])
      box(parent, 0.085, 0.085, 18.6, x, 0.339, 0, trimMaterials.powder, { cast: false });
    // Floor technical perimeter and keep-clear paths, without obstructing equipment.
    const accent =
      key === '3F' ? 0x9f9dec : key === '4F' ? 0x75c9c0 : key === '1F' ? 0xdab87d : 0x6ed4eb;
    for (const z of [-8.94, 8.94]) glowStrip(parent, 21.4, 0.014, 0.035, 0, 0.414, z, accent);
    // Visible floor-section identifier at the front/right corner.
    floorDecal(
      parent,
      `${key}  /  ${key === '4F' ? 'OPERATIONS' : key === '3F' ? 'AI COMPUTE' : key === '2F' ? 'DATA HALL' : 'ACCESS'}`,
      8.9,
      8.15,
      4.6,
      '#1c3246'
    );
  }
  function finishWall(parent, key) {
    const { back, left, front } = detailShells[key];
    const wallMat =
      key === '1F'
        ? mat(0x7a939e, 0.34, 0.64)
        : key === '2F'
          ? mat(0x617b91, 0.43, 0.52)
          : key === '3F'
            ? mat(0x6d789d, 0.43, 0.52)
            : mat(0x5b7892, 0.35, 0.62);
    const accent =
      key === '1F' ? 0xe8bd73 : key === '2F' ? 0x68c9ec : key === '3F' ? 0x9e9df9 : 0x77e1cf;
    // Segmented powder-coated architectural cassette wall behind equipment.
    for (let i = 0; i < 10; i++) {
      const x = -10.54 + i * 2.34;
      box(back, 2.2, 2.48, 0.038, x, 1.95, -9.235, wallMat, { cast: false });
      box(back, 2.19, 0.065, 0.045, x, 3.22, -9.204, trimMaterials.black, { cast: false });
      box(back, 2.19, 0.062, 0.046, x, 0.735, -9.204, trimMaterials.powder, { cast: false });
      box(back, 0.018, 2.48, 0.047, x + 1.1, 1.95, -9.2, trimMaterials.satin, { cast: false });
      if (i % 2 === 0) glowStrip(back, 0.03, 1.68, 0.015, x + 0.83, 2.2, -9.17, accent);
    }
    // A low skirting board + overhead cable conduit + wall-mounted devices.
    box(back, 23.0, 0.21, 0.12, 0, 0.52, -9.15, trimMaterials.black, { cast: false });
    box(back, 23.0, 0.13, 0.13, 0, 3.49, -9.12, trimMaterials.powder, { cast: false });
    for (const x of [-9.2, -3.8, 1.6, 7.0]) {
      box(back, 0.49, 0.4, 0.095, x, 2.75, -9.13, trimMaterials.black, { cast: false });
      glowStrip(back, 0.25, 0.03, 0.013, x, 2.78, -9.06, accent);
    }
    // Architectural joinery on existing partial side walls only.
    for (const z of [-8.2, -6.8, -5.4, -4.0]) {
      box(left, 0.045, 2.46, 1.23, -11.73, 1.86, z, wallMat, { cast: false });
      box(left, 0.047, 2.4, 0.02, -11.7, 1.86, z + 0.59, trimMaterials.satin, { cast: false });
    }
    // Front open side: thin handrail/safety posts, roofless to preserve interior visibility.
    for (const x of [-11.25, -4.8, 4.8, 11.25]) {
      box(front, 0.1, 1.36, 0.12, x, 1.08, 9.14, trimMaterials.powder, { cast: false });
      glowStrip(front, 0.1, 0.025, 0.12, x, 1.73, 9.14, accent);
    }
  }
  function finishServices(parent, key) {
    const accent =
      key === '1F' ? 0xe5c37e : key === '2F' ? 0x70cdec : key === '3F' ? 0x9e9cfa : 0x79d9c9;
    // Industrial modular LED fixtures suspended inside the open-roof cutaway.
    for (const x of [-8.4, -2.7, 2.7, 8.4]) {
      for (const z of [-5.9, 0.4, 6.5]) {
        box(parent, 1.2, 0.088, 0.36, x, 3.83, z, trimMaterials.powder, { cast: false });
        glowStrip(parent, 1.06, 0.014, 0.27, x, 3.78, z, 0xc3e8ff);
        for (const dx of [-0.49, 0.49])
          box(parent, 0.035, 0.4, 0.04, x + dx, 4.01, z, trimMaterials.satin, { cast: false });
      }
    }
    // Sprinkler mains and drops along a real service corridor.
    box(parent, 0.078, 0.08, 16.6, 0, 3.9, 0, trimMaterials.powder, { cast: false });
    for (const z of [-6.0, 0, 6.0]) {
      box(parent, 8.0, 0.075, 0.075, 0, 3.88, z, trimMaterials.powder, { cast: false });
      for (const x of [-4, 0, 4]) {
        box(parent, 0.046, 0.35, 0.045, x, 3.66, z, trimMaterials.satin, { cast: false });
        cylinder(parent, 0.082, 0.035, x, 3.47, z, trimMaterials.yellow, 10);
      }
    }
  }
  function finishRack(root, id, gpu) {
    // Physically separated rear power rails, extraction rail, perforated top and ID stencil.
    const liquid = id.startsWith('LIQ-');
    const metal = liquid ? trimMaterials.cyan : gpu ? trimMaterials.violet : trimMaterials.satin;
    for (const sx of [-0.5, 0.5])
      box(root, 0.05, 1.88, 0.1, sx, 1.34, -0.55, metal, { cast: false });
    const perforations = [];
    for (let x = -0.48; x <= 0.48; x += 0.16)
      for (let z = -0.4; z <= 0.4; z += 0.16) perforations.push([x, 2.686, z]);
    instanceBoxes(root, 0.085, 0.009, 0.085, perforations, trimMaterials.black);
    box(root, 1.01, 0.054, 0.07, 0, 2.5, 0.4, metal, { cast: false });
    textPlate(
      root,
      liquid ? 'DIRECT LIQUID' : gpu ? 'GPU CLUSTER' : 'COMPUTE NODE',
      0,
      2.47,
      0.686,
      1.05,
      0.12,
      '#d9f2ff',
      '#263c55'
    );
    for (const sx of [-0.6, 0.6]) {
      box(root, 0.035, 2.13, 0.04, sx, 1.27, 0.62, metal, { cast: false });
      box(root, 0.12, 0.09, 0.035, sx, 1.85, 0.66, trimMaterials.black, { cast: false });
    }
    if (liquid) {
      // Actual hose-like supply and return runs on rack sides, with quick-release couplings.
      for (const [i, col] of [
        [0, 0x55c8f4],
        [1, 0xe5aa71],
      ]) {
        const xpos = 0.69 + i * 0.07;
        pipe(
          root,
          [
            [xpos, 0.32, -0.52],
            [xpos, 1.36, -0.52],
            [xpos, 2.05, -0.44],
            [xpos, 2.35, -0.28],
          ],
          0.035,
          col,
          18
        );
        cylinder(root, 0.09, 0.065, xpos, 2.4, -0.28, metal, 12);
      }
      for (let i = 0; i < 4; i++)
        box(root, 0.045, 0.065, 0.055, 0.65, 0.72 + i * 0.35, 0.3, trimMaterials.cyan, {
          cast: false,
        });
    }
  }
  function finishCdu(root) {
    // CDU service hatch, manifold flange, mirrored pressure indicators and valve controls.
    for (const sx of [-0.48, 0.48]) {
      cylinder(root, 0.15, 0.045, sx, 1.12, 0.566, trimMaterials.black, 24).rotation.x =
        Math.PI / 2;
      const gauge = cylinder(root, 0.116, 0.052, sx, 1.12, 0.596, trimMaterials.satin, 24);
      gauge.rotation.x = Math.PI / 2;
      glowStrip(root, 0.055, 0.012, 0.012, sx, 1.13, 0.64, 0x86dbef);
    }
    box(root, 0.76, 0.055, 0.058, 0, 0.37, 0.559, trimMaterials.black, { cast: false });
    for (const sx of [-0.42, 0.42]) {
      cylinder(root, 0.16, 0.07, sx, 2.26, -0.38, trimMaterials.powder, 14);
      box(root, 0.32, 0.06, 0.045, sx, 2.36, -0.38, trimMaterials.yellow, { cast: false });
    }
    textPlate(root, 'FLOW   118 L/M', 0, 1.51, 0.565, 0.72, 0.12, '#b7eef9', '#193345');
  }
  function finishUps(root, kind) {
    // Separate maintenance breaker door, hinges, air inlets and accessible handle.
    for (const x of [-0.57, 0.57]) {
      box(root, 0.027, 1.62, 0.025, x, 1.12, 0.599, trimMaterials.powder, { cast: false });
      for (const y of [0.47, 1.69])
        box(root, 0.05, 0.11, 0.045, x, y, 0.627, trimMaterials.satin, { cast: false });
    }
    for (let i = 0; i < 4; i++) {
      box(root, 0.1, 0.1, 0.035, -0.39 + i * 0.24, 1.39, 0.63, trimMaterials.black, {
        cast: false,
      });
      glowStrip(
        root,
        0.05,
        0.018,
        0.015,
        -0.39 + i * 0.24,
        1.39,
        0.656,
        i === 0 ? 0x6edabb : 0x70c5e6
      );
    }
    box(root, 0.06, 0.38, 0.095, 0.56, 0.98, 0.637, trimMaterials.satin, { cast: false });
    box(root, 0.18, 0.05, 0.055, 0.56, 1.14, 0.695, trimMaterials.black, { cast: false });
    textPlate(
      root,
      kind === 'BATTERY' ? 'BATTERY BANK' : kind === 'SWITCHGEAR' ? 'POWER SWITCH' : 'UPS  /  A+B',
      0,
      2.04,
      0.63,
      1.0,
      0.12,
      '#d7edf2',
      '#2b4453'
    );
  }
  function finishChiller(root) {
    // Fan cowling rings, individual fasteners and compressor access hatches.
    for (const sx of [-0.93, 0.93]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.025, 8, 28), trimMaterials.black);
      ring.position.set(sx, 1.91, 0);
      ring.rotation.x = Math.PI / 2;
      root.add(ring);
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        glowStrip(
          root,
          0.028,
          0.026,
          0.025,
          sx + 0.41 * Math.cos(angle),
          1.91,
          0.41 * Math.sin(angle),
          0x789eae
        );
      }
    }
    for (const sx of [-0.95, 0.0, 0.95]) {
      box(root, 0.75, 0.64, 0.024, sx, 0.86, 0.845, trimMaterials.powder, { cast: false });
      box(root, 0.57, 0.44, 0.029, sx, 0.86, 0.869, trimMaterials.black, { cast: false });
      for (let i = 0; i < 5; i++)
        box(root, 0.49, 0.021, 0.015, sx, 0.68 + i * 0.075, 0.89, trimMaterials.satin, {
          cast: false,
        });
    }
  }
  // V17 -- code-modelled engineering-grade inner devices. Asset IDs and interaction stay stable.
  const engineeringMats = {
    graphite: mat(0x101b28, 0.52, 0.42),
    blackAnodized: mat(0x202e3d, 0.73, 0.27),
    silver: mat(0xadbfc6, 0.82, 0.23),
    titanium: mat(0x5e7889, 0.81, 0.31),
    pcb: mat(0x153b3f, 0.21, 0.55),
    copper: mat(0xbc7650, 0.82, 0.25),
    nickel: mat(0x8ea9b5, 0.8, 0.29),
    plastic: mat(0x2c4252, 0.15, 0.65),
    insulation: mat(0x132230, 0.05, 0.78),
    mesh: mat(0x263c4b, 0.42, 0.57),
    cyan: mat(0x4fc8e9, 0.47, 0.37),
    warm: mat(0xe2a365, 0.45, 0.42),
    green: mat(0x5abda7, 0.25, 0.42),
  };
  const engineeringDetails = [],
    engineeringDrawers = [],
    engineeringGauges = [],
    engineeringReadouts = [],
    coolantCircuitAnimations = [];
  function tubeCylinder(parent, r, len, x, y, z, material, axis = 'y', segs = 14) {
    const t = cylinder(parent, r, len, x, y, z, material, segs);
    if (axis === 'x') t.rotation.z = Math.PI / 2;
    if (axis === 'z') t.rotation.x = Math.PI / 2;
    return t;
  }
  function flange(parent, x, y, z, r = 0.12, axis = 'z') {
    tubeCylinder(parent, r, 0.055, x, y, z, engineeringMats.nickel, axis, 14);
    // Washer and captive bolts on the connection flange.
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      if (axis === 'z')
        tubeCylinder(
          parent,
          0.018,
          0.04,
          x + Math.cos(a) * r * 0.65,
          y + Math.sin(a) * r * 0.65,
          z + 0.027,
          engineeringMats.graphite,
          'z',
          7
        );
      else if (axis === 'y')
        tubeCylinder(
          parent,
          0.018,
          0.04,
          x + Math.cos(a) * r * 0.65,
          y + 0.026,
          z + Math.sin(a) * r * 0.65,
          engineeringMats.graphite,
          'y',
          7
        );
    }
  }
  function faceGauge(parent, x, y, z, unit = 'BAR', initial = 0.36) {
    const dial = new THREE.Group();
    dial.position.set(x, y, z);
    parent.add(dial);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.137, 0.018, 6, 28),
      engineeringMats.nickel
    );
    dial.add(ring);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.124, 24), engineeringMats.graphite);
    face.position.z = 0.005;
    dial.add(face);
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI * 0.78 + i * Math.PI * 0.195;
      const b = box(
        dial,
        0.007,
        0.024,
        0.005,
        Math.sin(a) * 0.099,
        Math.cos(a) * 0.099,
        0.013,
        engineeringMats.silver,
        { cast: false }
      );
      b.rotation.z = -a;
    }
    const pointer = box(dial, 0.01, 0.086, 0.008, 0, 0.036, 0.021, engineeringMats.warm, {
      cast: false,
    });
    pointer.geometry = pointer.geometry.clone();
    pointer.position.y = 0.036;
    const knob = tubeCylinder(dial, 0.021, 0.02, 0, 0, 0.023, engineeringMats.nickel, 'z', 12);
    // Needle pivot around the center, not around its geometry center.
    const needlePivot = new THREE.Group();
    dial.add(needlePivot);
    dial.remove(pointer);
    needlePivot.add(pointer);
    needlePivot.rotation.z = -1.08 + initial * 2.16;
    textPlate(dial, unit, 0, -0.077, 0.029, 0.14, 0.05, '#a7dcec', '#142a40');
    return { dial, needlePivot };
  }
  function instrumentReadout(parent, w, h, x, y, z, title, lines) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext('2d');
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const m = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    box(parent, w + 0.07, h + 0.06, 0.025, x, y, z - 0.015, engineeringMats.graphite, {
      cast: false,
    });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    panel.position.set(x, y, z + 0.018);
    parent.add(panel);
    const record = { texture, ctx, title, lines, state: '', panel };
    engineeringReadouts.push(record);
    paintEngineeringReadout(record, '정상');
    return record;
  }
  function paintEngineeringReadout(rec, status) {
    if (rec.state === status) return;
    rec.state = status;
    const { ctx, texture, title, lines } = rec;
    const bad = status === '장애' || status === '보안 경보',
      warn = status === '주의';
    ctx.fillStyle = '#071722';
    ctx.fillRect(0, 0, 512, 256);
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#0e3e50');
    grad.addColorStop(1, '#102a42');
    ctx.fillStyle = grad;
    ctx.fillRect(14, 12, 484, 44);
    ctx.fillStyle = '#bedff6';
    ctx.font = 'bold 29px monospace';
    ctx.fillText(title, 30, 44);
    ctx.fillStyle = bad ? '#ff7988' : warn ? '#ffd28d' : '#67edc9';
    ctx.fillRect(18, 72, 8, 148);
    ctx.font = 'bold 33px monospace';
    ctx.fillText(bad ? 'FAULT' : warn ? 'CHECK' : 'ONLINE', 42, 110);
    ctx.font = '26px monospace';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillStyle = i === 0 ? '#f3f8ff' : '#9ed1e7';
      ctx.fillText(lines[i], 42, 157 + i * 34);
    }
    ctx.fillStyle = '#1b556c';
    ctx.fillRect(26, 232, 460, 7);
    ctx.fillStyle = bad ? '#ec6677' : warn ? '#ebb46e' : '#71d8c4';
    ctx.fillRect(26, 232, 460 * (bad ? 0.25 : warn ? 0.62 : 0.88), 7);
    texture.needsUpdate = true;
  }
  function serviceDrawer(root, id, gpu, door) {
    const assembly = new THREE.Group();
    assembly.position.set(0, 1.252, 0);
    root.add(assembly);
    // Two vacant U slots used by a slide-out service sled; telescopic steel guide rails.
    for (const sx of [-0.47, 0.47]) {
      box(root, 0.035, 0.025, 0.85, sx, 1.12, 0.14, engineeringMats.silver, { cast: false });
      box(assembly, 0.039, 0.06, 0.77, sx, -0.03, 0.15, engineeringMats.titanium, { cast: false });
    }
    box(assembly, 1.04, 0.056, 0.82, 0, -0.086, 0.16, engineeringMats.blackAnodized, {
      cast: false,
    });
    box(assembly, 0.93, 0.024, 0.68, 0, -0.046, 0.13, engineeringMats.pcb, { cast: false });
    // Exposed compute board: copper cold plates for GPU, finned aluminium heatsinks for CPU.
    for (const x of [-0.25, 0.25]) {
      box(
        assembly,
        0.3,
        0.055,
        0.33,
        x,
        0.02,
        0.045,
        gpu ? engineeringMats.copper : engineeringMats.nickel,
        { cast: false }
      );
      for (let j = 0; j < 7; j++) {
        box(
          assembly,
          0.022,
          0.06,
          0.3,
          x - 0.126 + j * 0.041,
          0.076,
          0.045,
          gpu ? engineeringMats.copper : engineeringMats.silver,
          { cast: false }
        );
      }
      box(assembly, 0.036, 0.019, 0.4, x, 0.014, -0.27, engineeringMats.plastic, { cast: false });
    }
    // Cooling fans in the accessible forward end and individual DC power connectors.
    for (const x of [-0.33, 0, 0.33]) {
      const fan = new THREE.Mesh(
        new THREE.TorusGeometry(0.1, 0.019, 6, 20),
        engineeringMats.silver
      );
      fan.rotation.x = -Math.PI / 2;
      fan.position.set(x, 0.018, 0.33);
      assembly.add(fan);
      tubeCylinder(assembly, 0.025, 0.028, x, 0.03, 0.33, engineeringMats.titanium, 'y', 10);
      for (let a = 0; a < 5; a++) {
        const theta = (a * Math.PI * 2) / 5;
        const blade = box(
          assembly,
          0.034,
          0.012,
          0.09,
          x + Math.sin(theta) * 0.039,
          0.035,
          0.33 + Math.cos(theta) * 0.039,
          engineeringMats.mesh,
          { cast: false }
        );
        blade.rotation.y = -theta;
      }
    }
    box(assembly, 1.08, 0.18, 0.065, 0, -0.003, 0.605, engineeringMats.titanium, { cast: false });
    for (const x of [-0.46, 0.46]) {
      box(assembly, 0.12, 0.07, 0.09, x, 0, 0.666, engineeringMats.silver, { cast: false });
      tubeCylinder(assembly, 0.019, 0.027, x, 0, 0.715, engineeringMats.graphite, 'z', 8);
    }
    textPlate(
      assembly,
      gpu ? 'GPU SLED / 2U' : 'CPU SLED / 2U',
      0,
      0,
      0.646,
      0.66,
      0.1,
      '#c8eff6',
      '#1b354a'
    );
    const indicator = glowStrip(
      assembly,
      0.032,
      0.035,
      0.018,
      -0.38,
      0.04,
      0.65,
      gpu ? 0x8ebaf5 : 0x69e4b5
    );
    indicator.material = indicator.material.clone(); // independent status material (glowStrip normally shares a colour cache)
    engineeringDetails.push({ group: assembly, root, id, kind: 'drawer' });
    const rec = { group: assembly, door, id, indicator };
    engineeringDrawers.push(rec);
  }
  function engineeringRack(root, id, gpu, door) {
    const detail = new THREE.Group();
    detail.name = 'internal-machinery:' + id;
    root.add(detail);
    // Ventilated top cap with punched hole array, flange screws and inside 19-inch rails.
    for (const x of [-0.49, 0.49]) {
      box(detail, 0.038, 1.96, 0.043, x, 1.31, 0.39, engineeringMats.silver, { cast: false });
      for (let i = 0; i < 12; i++)
        tubeCylinder(
          detail,
          0.011,
          0.026,
          x,
          0.42 + i * 0.16,
          0.424,
          engineeringMats.graphite,
          'z',
          7
        );
    }
    for (const z of [-0.43, -0.06, 0.31]) {
      for (const x of [-0.47, 0.47]) {
        box(detail, 0.038, 1.8, 0.034, x, 1.29, z, engineeringMats.graphite, { cast: false });
      }
    }
    // Rear PDU with alternating IEC power outlets and a visible flexible cable loom.
    box(detail, 0.125, 1.71, 0.125, 0.53, 1.34, -0.475, engineeringMats.graphite, { cast: false });
    for (let i = 0; i < 8; i++) {
      box(detail, 0.073, 0.087, 0.016, 0.53, 0.5 + i * 0.19, -0.398, engineeringMats.plastic, {
        cast: false,
      });
      box(
        detail,
        0.024,
        0.022,
        0.019,
        0.53,
        0.5 + i * 0.19,
        -0.378,
        i % 3 ? engineeringMats.green : engineeringMats.warm,
        { cast: false }
      );
    }
    for (let i = 0; i < 4; i++) {
      const offset = i * 0.045;
      pipe(
        detail,
        [
          [0.54, 2.2, -0.52],
          [0.57 + offset, 1.92, -0.55],
          [0.39, 1.38 + offset, -0.5],
          [0.47, 1.05, -0.25],
        ],
        0.017,
        i % 2 ? 0xe6a76c : 0x65b7d7,
        11
      );
    }
    // Colour-coded liquid quick-disconnect block and supply/return hose on LIQ racks.
    if (id.startsWith('LIQ-')) {
      for (const [idx, color] of [
        [0, 0x67cde8],
        [1, 0xe6a76a],
      ]) {
        const x = 0.6 + idx * 0.085;
        pipe(
          detail,
          [
            [x, 2.13, -0.61],
            [x, 1.99, -0.84],
            [x, 1.45, -0.83],
            [x, 1.05, -0.67],
          ],
          0.037,
          color,
          23
        );
        for (const y of [1.06, 1.9]) {
          flange(detail, x, y, -0.77, 0.085, 'z');
          box(detail, 0.15, 0.055, 0.18, x, y + 0.06, -0.77, engineeringMats.nickel, {
            cast: false,
          });
        }
      }
      textPlate(detail, 'LC IN / OUT', 0.19, 2.2, -0.651, 0.65, 0.13, '#b8effe', '#174153');
    }
    engineeringDetails.push({ group: detail, root, id, kind: 'rack' });
    serviceDrawer(root, id, gpu, door);
  }
  function engineeringCdu(root, id) {
    const d = new THREE.Group();
    root.add(d);
    // Industrial inspection hatch with recessed pump bodies, filter and framed sightglass.
    box(d, 0.74, 1.08, 0.12, 0, 0.93, 0.595, engineeringMats.graphite, { cast: false });
    box(d, 0.61, 0.91, 0.026, 0, 0.94, 0.666, engineeringMats.blackAnodized, { cast: false });
    for (const x of [-0.2, 0.2]) {
      tubeCylinder(d, 0.16, 0.31, x, 0.91, 0.715, engineeringMats.titanium, 'z', 18);
      const rotor = new THREE.Mesh(
        new THREE.TorusGeometry(0.11, 0.025, 7, 20),
        engineeringMats.copper
      );
      rotor.position.set(x, 0.91, 0.895);
      d.add(rotor);
      for (let k = 0; k < 7; k++)
        box(d, 0.15, 0.013, 0.018, x, 0.84 + k * 0.025, 0.909, engineeringMats.mesh, {
          cast: false,
        });
    }
    const pane = box(
      d,
      0.69,
      1.01,
      0.013,
      0,
      0.94,
      0.932,
      new THREE.MeshPhysicalMaterial({
        color: 0x72acbe,
        metalness: 0.03,
        roughness: 0.13,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      { cast: false }
    );
    for (const x of [-0.36, 0.36])
      box(d, 0.028, 1.09, 0.036, x, 0.94, 0.926, engineeringMats.silver, { cast: false });
    for (const y of [0.39, 1.48])
      box(d, 0.75, 0.04, 0.036, 0, y, 0.926, engineeringMats.silver, { cast: false });
    // High contrast mechanical instruments are high enough to remain visible in isometric view.
    const inlet = faceGauge(d, -0.46, 1.85, 0.612, 'IN');
    const outlet = faceGauge(d, 0.46, 1.85, 0.612, 'OUT');
    for (const x of [-0.42, 0.42]) {
      tubeCylinder(d, 0.07, 0.4, x, 2.2, -0.62, engineeringMats.nickel, 'y', 14);
      flange(d, x, 2.42, -0.62, 0.11, 'y');
      const handle = box(d, 0.29, 0.04, 0.055, x, 2.5, -0.62, engineeringMats.warm, {
        cast: false,
      });
      handle.rotation.y = x > 0 ? Math.PI / 2 : 0;
    }
    const sight = tubeCylinder(
      d,
      0.105,
      0.53,
      0.61,
      0.77,
      0.665,
      new THREE.MeshPhysicalMaterial({
        color: 0x72e1ea,
        metalness: 0.0,
        roughness: 0.07,
        transparent: true,
        opacity: 0.29,
        depthWrite: false,
      }),
      'y',
      18
    );
    for (const y of [0.51, 1.03]) flange(d, 0.61, y, 0.665, 0.105, 'y');
    const flowLight = fxSphere(d, 0.038, 0.61, 0.68, 0.77, 0x66dff2, 0.9);
    const screen = instrumentReadout(d, 0.49, 0.29, 0, 1.73, 0.611, 'CDU / LOOP', [
      'FLOW 118 L/M',
      'PRESS 2.7 BAR',
    ]);
    engineeringDetails.push({ group: d, root, id, kind: 'cdu' });
    engineeringGauges.push({
      id,
      type: 'cdu',
      needles: [inlet.needlePivot, outlet.needlePivot],
      flowLight,
      screen,
    });
  }
  function engineeringUps(root, id, kind) {
    const d = new THREE.Group();
    root.add(d);
    // Segmented hinged front service doors, finger pulls, locking screws, numbered breakers.
    for (const x of [-0.66, 0.66]) {
      box(d, 0.033, 1.87, 0.05, x, 1.14, 0.625, engineeringMats.nickel, { cast: false });
      for (const y of [0.31, 1.96])
        tubeCylinder(d, 0.018, 0.022, x, y, 0.67, engineeringMats.titanium, 'z', 8);
    }
    const backing = box(d, 1.18, 0.51, 0.035, 0, 1.43, 0.672, engineeringMats.graphite, {
      cast: false,
    });
    for (let i = 0; i < 8; i++) {
      const x = -0.48 + (i % 4) * 0.32,
        y = 1.55 - Math.floor(i / 4) * 0.22;
      box(d, 0.23, 0.155, 0.032, x, y, 0.695, engineeringMats.blackAnodized, { cast: false });
      const lever = box(d, 0.043, 0.09, 0.077, x + 0.05, y, 0.741, engineeringMats.silver, {
        cast: false,
      });
      lever.rotation.x = i === 0 ? 0.22 : -0.15;
      box(
        d,
        0.15,
        0.014,
        0.015,
        x - 0.03,
        y - 0.048,
        0.748,
        i === 0 ? engineeringMats.green : engineeringMats.warm,
        { cast: false }
      );
    }
    for (const x of [-0.5, 0.5]) {
      box(d, 0.025, 1.4, 0.023, x, 0.92, 0.68, engineeringMats.nickel, { cast: false });
      box(d, 0.095, 0.26, 0.08, x, 1.04, 0.735, engineeringMats.titanium, { cast: false });
    }
    for (let i = 0; i < 15; i++)
      box(d, 0.95, 0.012, 0.016, 0, 0.37 + i * 0.049, 0.704, engineeringMats.mesh, { cast: false });
    for (let i = 0; i < 6; i++)
      tubeCylinder(d, 0.017, 0.025, -0.46 + i * 0.18, 0.33, 0.729, engineeringMats.silver, 'z', 7);
    // Top incoming feeder busbars, protective glands and aluminium conduit.
    for (const x of [-0.43, 0, 0.43]) {
      tubeCylinder(d, 0.075, 0.11, x, 2.33, -0.22, engineeringMats.graphite, 'y', 12);
      tubeCylinder(d, 0.045, 0.35, x, 2.55, -0.22, engineeringMats.copper, 'y', 12);
      flange(d, x, 2.37, -0.22, 0.105, 'y');
    }
    const title =
      kind === 'UPS' ? 'UPS INVERTER' : kind === 'BATTERY' ? 'BATTERY BANK' : 'ATS / SWITCH';
    const lines =
      kind === 'UPS'
        ? ['OUTPUT 380 V', 'LOAD 68% / A-B']
        : kind === 'BATTERY'
          ? ['SOC 100%', 'RUNTIME 47 MIN']
          : ['INPUT A / B', 'TRANSFER READY'];
    const screen = instrumentReadout(d, 0.58, 0.31, 0, 1.88, 0.67, title, lines);
    engineeringDetails.push({ group: d, root, id, kind: 'ups' });
    engineeringGauges.push({ id, type: 'ups', screen });
  }
  function engineeringChiller(root, id) {
    const d = new THREE.Group();
    root.add(d);
    // Extractable compressor cabinet, top service hatches, nameplate and vibration mounts.
    for (const x of [-1.24, 0, 1.24]) {
      box(d, 0.7, 0.058, 1.12, x, 1.77, 0.05, engineeringMats.titanium, { cast: false });
      for (const z of [-0.4, 0.4])
        tubeCylinder(d, 0.025, 0.025, x, 1.82, z, engineeringMats.graphite, 'y', 8);
    }
    for (const x of [-1.4, 1.4])
      for (const z of [-0.6, 0.6]) {
        box(d, 0.12, 0.12, 0.16, x, 0.11, z, engineeringMats.graphite, { cast: false });
        tubeCylinder(d, 0.044, 0.04, x, 0.12, z, engineeringMats.nickel, 'y', 9);
      }
    const g = faceGauge(d, 1.1, 0.92, 0.885, 'BAR');
    engineeringGauges.push({ id, type: 'chiller', needles: [g.needlePivot] });
    engineeringDetails.push({ group: d, root, id, kind: 'chiller' });
  }
  function coolingCircuit(parent, points, color, id, speed = 0.11) {
    const p = pipe(parent, points, 0.045, color, 33);
    const beads = [];
    for (let i = 0; i < 4; i++) {
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 8, 8),
        new THREE.MeshBasicMaterial({ color })
      );
      parent.add(bead);
      beads.push(bead);
    }
    coolantCircuitAnimations.push({ curve: p.curve, beads, id, speed, color });
    return p;
  }
  function updateEngineeringFx(t) {
    const near = highQuality ? 47 : 25;
    // Stage detail at close range; keep architectural and device shell geometry visible at all distances.
    for (const detail of engineeringDetails) {
      const asset = registry.get(detail.id);
      if (!asset) {
        detail.group.visible = false;
        continue;
      }
      asset.root.updateWorldMatrix(true, false);
      const world = asset.root.getWorldPosition(new THREE.Vector3());
      detail.group.visible = world.distanceTo(camera.position) < near || selectedId === detail.id;
    }
    for (const d of engineeringDrawers) {
      const state = getAssetStatus(registry.get(d.id));
      d.indicator.material.color.setHex(
        state === '장애' ? 0xf26b77 : state === '주의' ? 0xf1b56e : 0x6cdec3
      );
    }
    for (const g of engineeringGauges) {
      const st = getAssetStatus(registry.get(g.id));
      const incident = activeIncidents.size > 0 && st !== '정상';
      if (g.needles)
        g.needles.forEach(
          (p, i) =>
            (p.rotation.z = THREE.MathUtils.lerp(
              p.rotation.z,
              incident ? 0.64 + i * 0.2 : -0.32 + i * 0.2,
              0.07
            ))
        );
      if (g.flowLight) {
        g.flowLight.material.opacity = incident ? 0.35 + 0.27 * Math.sin(t * 5) : 0.86;
        g.flowLight.position.y = 0.68 + 0.18 * (0.5 + 0.5 * Math.sin(t * (incident ? 2 : 5)));
      }
      if (g.screen) paintEngineeringReadout(g.screen, st);
    }
    for (const path of coolantCircuitAnimations) {
      const issue = activeIncidents.has(path.id),
        speed = issue ? 0.016 : path.speed;
      for (let i = 0; i < path.beads.length; i++) {
        const orb = path.beads[i];
        orb.position.copy(path.curve.getPoint((t * speed + i / path.beads.length) % 1));
        orb.material.color.setHex(issue ? 0xf2a870 : path.color);
        orb.visible = utilityEnabled.coolant;
      }
    }
  }
  function screenDashboard(seed = 0) {
    if (screenMaterials[seed]) return screenMaterials[seed];
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext('2d');
    const rnd = seeded(seed * 4567 + 234);
    ctx.fillStyle = '#07182c';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#102e4b';
    ctx.fillRect(12, 12, 488, 30);
    ctx.fillStyle = '#84cbf2';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(
      seed === 1 ? 'SECURITY OPERATIONS' : seed === 2 ? 'POWER / THERMAL' : 'FACILITY TELEMETRY',
      25,
      34
    );
    ctx.strokeStyle = '#254867';
    ctx.lineWidth = 1;
    for (let k = 0; k < 6; k++) {
      ctx.beginPath();
      ctx.moveTo(20, 65 + k * 27);
      ctx.lineTo(490, 65 + k * 27);
      ctx.stroke();
    }
    for (let k = 0; k < 10; k++) {
      ctx.beginPath();
      ctx.moveTo(22 + k * 50, 58);
      ctx.lineTo(22 + k * 50, 230);
      ctx.stroke();
    }
    ctx.beginPath();
    for (let x = 24; x <= 480; x += 9) {
      const y =
        140 + Math.sin(x * 0.033 + seed) * 32 + Math.sin(x * 0.095 + seed * 7) * 14 + rnd() * 8;
      if (x === 24) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = seed === 1 ? '#8aa7ff' : '#72d9e9';
    ctx.lineWidth = 3;
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const h = 15 + rnd() * 50;
      ctx.fillStyle = i === 9 && seed === 1 ? '#e3a070' : '#5bb7cd';
      ctx.fillRect(28 + i * 39, 223 - h, 16, h);
    }
    ctx.fillStyle = '#a3efff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('UTIL   72.5%  |  PUE 1.32  |  OK', 24, 250);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return (screenMaterials[seed] = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  }
  function register(parent, id, props) {
    parent.userData.entityId = id;
    let ancestor = parent,
      floor = null;
    while (ancestor) {
      if (ancestor.userData?.floorKey) {
        floor = ancestor.userData.floorKey;
        break;
      }
      ancestor = ancestor.parent;
    }
    let location = props.location;
    if (floor && location?.startsWith('본관'))
      location = `본관 ${floor} · ${location.split('·').slice(1).join('·').trim()}`;
    if (floor && !location?.startsWith('본관'))
      location = `본관 ${floor} · ${floor === '1F' ? '시설 지원 구역' : location}`;
    registry.set(id, { ...props, id, root: parent, floor, location });
    return parent;
  }
  function getEntity(object) {
    let node = object;
    while (node) {
      if (node.userData?.entityId) return registry.get(node.userData.entityId);
      if (node.userData?.zoneKey) return { zone: node.userData.zoneKey, isZone: true };
      if (node.userData?.floorKey) return { floor: node.userData.floorKey, isFloor: true };
      node = node.parent;
    }
    return null;
  }
  function region(name) {
    const g = new THREE.Group();
    g.name = name;
    // V35: let non-equipment surfaces (floors, walls, parapets) select their facility.
    // Asset roots take priority in getEntity(), preserving individual equipment interactions.
    if (name === 'power' || name === 'cooling') g.userData.zoneKey = name;
    scene.add(g);
    regionGroups[name] = g;
    return g;
  }
  // Occluders used only for HTML labels (WebGL LED/FX use native depth testing).
  const architectureOccluders = [];
  const labelVisibilityRay = new THREE.Raycaster();
  const labelVisibilityDirection = new THREE.Vector3();
  function registerOccluder(mesh) {
    architectureOccluders.push(mesh);
    return mesh;
  }
  function isActuallyVisible(object) {
    for (let o = object; o; o = o.parent) if (!o.visible) return false;
    return true;
  }
  function isHiddenBehindArchitecture(worldPoint) {
    const origin = camera.position;
    labelVisibilityDirection.subVectors(worldPoint, origin);
    const distance = labelVisibilityDirection.length();
    if (distance <= 0.15) return false;
    labelVisibilityRay.set(origin, labelVisibilityDirection.multiplyScalar(1 / distance));
    labelVisibilityRay.near = 0.04;
    labelVisibilityRay.far = distance - 0.12;
    // Only opaque walls / partitions / structural slabs, not translucent glass.
    const candidates = architectureOccluders.filter(isActuallyVisible);
    return (
      candidates.length > 0 && labelVisibilityRay.intersectObjects(candidates, false).length > 0
    );
  }

  // Polished campus plinth, directional stripes, ground axes.
  const foundation = new THREE.Group();
  scene.add(foundation);
  function aidcFoundation(cx, cz, w, d) {
    const lower = box(
      foundation,
      w + 0.12,
      0.18,
      d + 0.12,
      cx,
      -0.39,
      cz,
      mat(0x0c1c31, 0.35, 0.8)
    );
    const base = box(foundation, w, 0.3, d, cx, -0.155, cz, mat(0x0c1c31, 0.35, 0.8));
    base.receiveShadow = true;
    // AIDC v4 originally uses lineBox(...,0x316292,.55); preserve that palette,
    // with a lighter rim to stay legible on the brighter environment.
    addEdges(foundation, lower, 0x316292, 0.62);
    addEdges(foundation, base, 0x6baff1, 0.86);
    const top = box(foundation, w - 0.1, 0.017, d - 0.1, cx, 0.002, cz, mat(0x1b3354, 0.24, 0.76));
    top.receiveShadow = true;
    const accent = mat(0x86caff, 0.08, 0.32, 0x3b8fd0, 0.65);
    // Narrow edge lights rather than the old solid bright panel underneath the facilities.
    box(foundation, w - 0.22, 0.024, 0.035, cx, 0.028, cz + d / 2 - 0.065, accent, { cast: false });
    box(foundation, w - 0.22, 0.024, 0.035, cx, 0.028, cz - d / 2 + 0.065, accent, { cast: false });
    box(foundation, 0.035, 0.024, d - 0.22, cx - w / 2 + 0.065, 0.028, cz, accent, { cast: false });
    box(foundation, 0.035, 0.024, d - 0.22, cx + w / 2 - 0.065, 0.028, cz, accent, { cast: false });
  }
  aidcFoundation(0, 0, 25.5, 22.0); // main four-storey hall
  aidcFoundation(-18, 0, 10.9, 12.35); // detached electrical wing
  aidcFoundation(18, -3, 10.9, 11.95); // detached cooling wing
  const grid = new THREE.GridHelper(105, 104, 0x2a5673, 0x1c394f);
  grid.position.y = -0.43;
  grid.material.transparent = true;
  grid.material.opacity = 0.08;
  scene.add(grid);

  const groundMaterial = mat(0x071220, 0.05, 1);
  groundMaterial.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vDeckPosition;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvDeckPosition = vec2(position.x, -position.y);'
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
   varying vec2 vDeckPosition;
   vec2 deckCell(vec2 point, float stepSize) {
    return (fract(point / stepSize + 0.5) - 0.5) * stepSize;
   }
   float deckGrid(vec2 point, float stepSize, float width, vec2 pixelSize) {
    vec2 lines = 1.0 - smoothstep(vec2(width), vec2(width) + pixelSize, abs(deckCell(point, stepSize)));
    return max(lines.x, lines.y);
   }
   float deckChevrons(vec2 point, vec2 origin, float facing) {
    vec2 offset = point - origin;
    float repeatX = mod(offset.x * facing + 0.72, 1.44) - 0.72;
    float stroke = 1.0 - smoothstep(0.055, 0.16, abs(repeatX + abs(offset.y) * 0.66 - 0.25));
    return stroke * (1.0 - smoothstep(0.48, 0.62, abs(offset.y)))
      * (1.0 - smoothstep(1.8, 2.68, abs(offset.x)));
   }
  `
      )
      .replace(
        '#include <opaque_fragment>',
        `
   vec2 deck = vDeckPosition;
   vec2 pixelSize = max(fwidth(deck), vec2(0.008));
   float detail = 1.0 - smoothstep(0.10, 0.47, max(pixelSize.x, pixelSize.y));
   float radius = length(deck);
   float stageFade = 1.0 - smoothstep(22.0, 58.0, radius);
   vec2 pool = (deck - vec2(0.0, 7.0)) / vec2(34.0, 26.0);
   float spill = exp(-dot(pool, pool) * 1.25);
   vec2 corePool = (deck - vec2(-6.0, 12.0)) / vec2(19.0, 17.0);
   float core = exp(-dot(corePool, corePool) * 1.7);
   float minorGrid = deckGrid(deck, 3.6, 0.012, pixelSize);
   float majorGrid = deckGrid(deck, 7.2, 0.033, pixelSize);
   vec2 pointCell = deckCell(deck, 1.2);
   float pointDistance = length(pointCell);
   float dots = 1.0 - smoothstep(0.052, 0.125 + 0.32 * length(pixelSize), pointDistance);
   vec2 crossingCell = deckCell(deck, 7.2);
   vec2 tile = floor(deck / 7.2 + 0.5);
   float crossingGain = 0.38 + 0.62 * fract(sin(dot(tile, vec2(26.1, 71.7))) * 125.6);
   float crossing = exp(-dot(crossingCell, crossingCell) * 21.0) * crossingGain;
   float ticks = 1.0 - smoothstep(0.16, 0.34, abs(fract(atan(deck.y, deck.x) * 28.0 + 0.5) - 0.5));
   float rimTicks = (1.0 - smoothstep(0.18, 0.53, abs(radius - 35.8))) * ticks;
   float rimLine = 1.0 - smoothstep(0.022, 0.11 + length(pixelSize), abs(radius - 36.7));
   float arrows = deckChevrons(deck, vec2(-10.4, 20.1), -1.0)
    + deckChevrons(deck, vec2(24.5, 13.3), 1.0)
    + deckChevrons(deck, vec2(19.5, -18.8), 1.0);
   outgoingLight *= 0.59;
   outgoingLight += vec3(0.012, 0.028, 0.102) * spill + vec3(0.006, 0.012, 0.047) * core;
   outgoingLight += vec3(0.025, 0.074, 0.22) * stageFade * (0.063 * minorGrid * detail + 0.22 * majorGrid * (0.36 + 0.64 * spill));
   outgoingLight += vec3(0.032, 0.085, 0.26) * stageFade * detail * (0.50 * dots * spill + 0.45 * crossing);
   outgoingLight += vec3(0.031, 0.10, 0.20) * detail * (0.31 * rimTicks + 0.19 * rimLine);
   outgoingLight += vec3(0.048, 0.20, 0.30) * detail * 0.39 * arrows;
   #include <opaque_fragment>
  `
      );
  };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(250, 250), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.49;
  ground.receiveShadow = true;
  scene.add(ground);

  function platform(g, cx, cz, w, d, accent = 0x64caed) {
    const base = registerOccluder(box(g, w, 0.38, d, cx, 0.13, cz, M.floor, { rounded: true }));
    addEdges(g, base, accent, 0.75);
    box(g, w - 0.24, 0.045, d - 0.24, cx, 0.345, cz, M.tile);
    // High contrast perimeter line + raised tile seams.
    for (let x = -w / 2 + 0.5; x < w / 2 - 0.2; x += 1.5)
      fineTileLines.push(
        line(
          g,
          [cx + x, 0.371, cz - d / 2 + 0.3],
          [cx + x, 0.371, cz + d / 2 - 0.3],
          0x8eb9ce,
          0.12
        )
      );
    for (let z = -d / 2 + 0.5; z < d / 2 - 0.2; z += 1.5)
      fineTileLines.push(
        line(
          g,
          [cx - w / 2 + 0.3, 0.372, cz + z],
          [cx + w / 2 - 0.3, 0.372, cz + z],
          0x8eb9ce,
          0.12
        )
      );
    const border = mat(accent, 0.2, 0.45, accent, 0.12);
    box(g, w, 0.055, 0.07, cx, 0.39, cz + d / 2 - 0.1, border, { cast: false });
    box(g, w, 0.055, 0.07, cx, 0.39, cz - d / 2 + 0.1, border, { cast: false });
    box(g, 0.07, 0.055, d, cx + w / 2 - 0.1, 0.39, cz, border, { cast: false });
    box(g, 0.07, 0.055, d, cx - w / 2 + 0.1, 0.39, cz, border, { cast: false });
    return base;
  }
  function wall(g, cx, cz, w, h, orientation = 'horizontal', glass = false) {
    const mesh =
      orientation === 'horizontal'
        ? box(g, w, h, 0.15, cx, h / 2 + 0.38, cz, glass ? M.glass : M.wall)
        : box(g, 0.15, h, w, cx, h / 2 + 0.38, cz, glass ? M.glass : M.wall);
    if (!glass) {
      registerOccluder(mesh);
      addEdges(g, mesh, 0xa5d1dc, 0.21);
    }
    return mesh;
  }
  function column(g, x, z, h = 3.2) {
    box(g, 0.27, h, 0.27, x, 0.38 + h / 2, z, M.brushed);
    box(g, 0.4, 0.12, 0.4, x, 0.48, z, M.edge);
    box(g, 0.4, 0.12, 0.4, x, h + 0.3, z, M.edge);
  }
  function labelAnchor(id, title, detail, world, zone, floor = null) {
    const label = document.createElement('button');
    label.className = 'world-label';
    label.innerHTML = `<strong>${title}</strong><small>${detail}</small>`;
    label.dataset.zone = zone;
    labelsHost.appendChild(label);
    label.addEventListener('click', e => {
      e.stopPropagation();
      setZone(zone);
    });
    return {
      label,
      world: typeof world === 'function' ? world : new THREE.Vector3(...world),
      zone,
      floor,
    };
  }
  const labelAnchors = [];

  const { rack, crac, cdu, networkCabinet, upsCabinet, hvacFan, chiller, pump } =
    createAssetFactories({
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
    });

  // ================================================================
  // MAIN BUILDING / THREE TRUE FLOORS
  // All rooms, slabs, doors, cable trays and equipment are procedural.
  // ================================================================
  const hall = region('hall'); // Main building root, used by raycaster.
  const siteBuilding = new THREE.Group();
  hall.add(siteBuilding);
  const floorList = ['1F', '2F', '3F', '4F'];
  // V21: cutaway groups are purely visual; floor layouts, devices and simulations do not move.
  const detailShells = {};
  const detailPartitionParts = [];
  const storyHeight = 4.55;
  const faceBlue = mat(0x7ca2b2, 0.54, 0.35);
  const partition = mat(0x86a8b5, 0.32, 0.58);
  const zoning = [mat(0x1f485e, 0.18, 0.76), mat(0x2c5262, 0.18, 0.68), mat(0x334a5f, 0.18, 0.7)];
  const glazing = new THREE.MeshPhysicalMaterial({
    color: 0xa4dded,
    roughness: 0.12,
    metalness: 0.08,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const beige = mat(0xa4a79b, 0.25, 0.7);

  function newFloor(key, index) {
    const g = new THREE.Group();
    g.name = `KNU AIDC_MAIN_${key}`;
    g.position.y = FLOOR_Y[key];
    g.userData.floorKey = key;
    siteBuilding.add(g);
    floorGroups[key] = g;
    const shell = {};
    for (const face of ['back', 'left', 'right', 'front', 'ceiling']) {
      const section = new THREE.Group();
      section.name = `${key} / DETAIL CUTAWAY / ${face.toUpperCase()}`;
      section.userData.architectureCutaway = face;
      g.add(section);
      shell[face] = section;
    }
    detailShells[key] = shell;
    platform(
      g,
      0,
      0,
      24,
      19,
      key === '4F' ? 0x82d6c1 : key === '3F' ? 0x958df0 : key === '2F' ? 0x5ec2e4 : 0x72c2ce
    );
    finishFloor(g, key);
    // Separate roof-height fixtures and architectural wall faces for camera-aware section view.
    box(shell.back, 23.85, 0.15, 0.2, 0, 0.28, -9.33, M.brushed);
    wall(shell.back, 0, -9.36, 23.8, 3.18);
    finishWall(g, key);
    finishServices(shell.ceiling, key);
    wall(shell.left, -11.83, -5.75, 7.15, 3.1, 'vertical', false);
    wall(shell.right, 11.83, -6.55, 5.55, 3.1, 'vertical', true);
    for (const x of [-11.6, -5.8, 0, 5.8, 11.6]) {
      column(shell.back, x, -9.25, 3.6);
      box(shell.front, 0.15, 3.24, 0.15, x, 2.15, 9.18, faceBlue);
      glowStrip(
        shell.ceiling,
        0.085,
        0.04,
        18.1,
        x,
        3.67,
        -0.15,
        index === 3 ? 0x75edcb : index === 2 ? 0x9c9dff : 0x62cde5
      );
    }
    box(shell.ceiling, 23.3, 0.15, 0.12, 0, 4.1, 9.15, faceBlue);
    box(shell.ceiling, 23.3, 0.14, 0.14, 0, 4.1, -9.2, faceBlue);
    for (const x of [-11.65, 11.65]) box(shell.ceiling, 0.12, 0.14, 18.5, x, 4.08, 0, faceBlue);
    // 1F alone has a real main entrance opening aligned with the security-access bay.
    // In the other floors the low façade remains unchanged.
    if (key === '1F') {
      box(shell.front, 3.5, 0.67, 0.1, -10.25, 0.8, 9.39, glazing, { cast: false });
      box(shell.front, 3.6, 0.67, 0.1, -4.2, 0.8, 9.39, glazing, { cast: false });
      // Glazed wings flank the entrance in exterior view, and disappear with the front cutaway.
      box(shell.front, 3.35, 2.58, 0.065, -10.28, 1.82, 9.23, glazing, { cast: false });
      box(shell.front, 3.45, 2.58, 0.065, -4.2, 1.82, 9.23, glazing, { cast: false });
    } else {
      box(shell.front, 9.6, 0.67, 0.1, -7.2, 0.8, 9.39, glazing, { cast: false });
    }
    box(shell.front, 9.6, 0.67, 0.1, 7.2, 0.8, 9.39, glazing, { cast: false });
    // Floor-specific circulation is added after walls and equipment are placed.
    // Floor number on near edge, physically attached to story.
    const plate = textPlate(g, key, -10.38, 0.67, 9.47, 1.4, 0.29, '#ddf9ff', '#1e465e');
    plate.rotation.x = -Math.PI / 4;
    return g;
  }
  const f1 = newFloor('1F', 0);
  const f2 = newFloor('2F', 1);
  const f3 = newFloor('3F', 2);
  const f4 = newFloor('4F', 3);

  // Room zoning: muted floor bands, low partitions, a deliberate open door gap.
  function area(g, name, x, z, w, d, color = 0x478ba5) {
    const group = new THREE.Group();
    group.name = name;
    g.add(group);
    const zoneTint = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    });
    box(group, w, 0.009, d, x, 0.427, z, zoneTint, { cast: false });
    for (const sx of [-1, 1]) {
      box(group, 0.045, 0.018, d, x + (sx * w) / 2, 0.445, z, mat(color, 0.2, 0.55), {
        cast: false,
      });
    }
    for (const sz of [-1, 1])
      box(group, w, 0.018, 0.045, x, 0.445, z + (sz * d) / 2, mat(color, 0.2, 0.55), {
        cast: false,
      });
    return group;
  }
  function partialPartition(g, x, z, length, dir = 'h', height = 2.5) {
    const mesh =
      dir === 'h'
        ? box(g, length, height, 0.11, x, 0.39 + height / 2, z, partition)
        : box(g, 0.11, height, length, x, 0.39 + height / 2, z, partition);
    registerOccluder(mesh);
    addEdges(g, mesh, 0xe4eef3, 0.2);
    return mesh;
  }
  function doorway(g, x, z, rot = 0) {
    const frame = new THREE.Group();
    frame.position.set(x, 0.4, z);
    frame.rotation.y = rot;
    g.add(frame);
    for (const side of [-1, 1]) box(frame, 0.09, 2.27, 0.16, side * 0.67, 1.14, 0, M.brushed);
    box(frame, 1.44, 0.13, 0.16, 0, 2.28, 0, M.brushed);
    const glass = box(frame, 1.25, 1.91, 0.04, 0, 1.04, 0, glazing, { cast: false });
    box(frame, 0.05, 0.22, 0.1, 0.48, 1.08, 0.075, M.edge);
    return glass;
  }
  // V20: the circulation is expressed through clear physical passages,
  // bounded rooms and door openings — no painted path/arrows or route overlay.
  function partitionSegment(g, x, z, length, dir = 'h', style = 'glass', height = 2.58) {
    const group = new THREE.Group();
    group.name = 'PARTITION ' + style;
    group.position.set(x, 0.39, z);
    group.rotation.y = dir === 'v' ? Math.PI / 2 : 0;
    g.add(group);
    detailPartitionParts.push({ floor: g.userData.floorKey, group, x, z, dir });
    // Structural kick panel, sill, head rail, and evenly spaced mullions.
    const infill = style === 'glass' ? glazing : partition;
    const lower = box(
      group,
      length,
      0.4,
      0.115,
      0,
      0.21,
      0,
      style === 'glass' ? M.cabinet : partition,
      { cast: false }
    );
    registerOccluder(lower);
    const panel = box(
      group,
      length,
      height - 0.59,
      0.076,
      0,
      0.41 + (height - 0.59) / 2,
      0,
      infill,
      {
        cast: false,
      }
    );
    if (style !== 'glass') registerOccluder(panel);
    box(group, length, 0.08, 0.13, 0, height - 0.025, 0, M.brushed, { cast: false });
    box(group, length, 0.055, 0.13, 0, 0.44, 0, M.edge, { cast: false });
    for (const side of [-1, 1])
      box(group, 0.07, height, 0.16, (side * length) / 2, height / 2, 0, M.brushed, {
        cast: false,
      });
    if (style === 'glass')
      for (let t = -length / 2 + 1.35; t < length / 2 - 0.4; t += 1.35)
        box(group, 0.042, height - 0.54, 0.085, t, 0.49 + (height - 0.54) / 2, 0, M.edge, {
          cast: false,
        });
    return group;
  }
  function portal(g, x, z, dir = 'h', label = 'ACCESS', tone = 0x82d4f1) {
    const p = new THREE.Group();
    p.name = label + ' / OPEN DOOR';
    p.position.set(x, 0.4, z);
    p.rotation.y = dir === 'v' ? Math.PI / 2 : 0;
    g.add(p);
    detailPartitionParts.push({ floor: g.userData.floorKey, group: p, x, z, dir });
    for (const side of [-1, 1]) {
      box(p, 0.085, 2.44, 0.14, side * 0.87, 1.22, 0, M.brushed, { cast: false });
      box(p, 0.12, 0.22, 0.2, side * 0.87, 0.14, 0, M.edge, { cast: false });
    }
    box(p, 1.83, 0.12, 0.16, 0, 2.47, 0, M.brushed, { cast: false });
    glowStrip(p, 1.61, 0.018, 0.04, 0, 2.42, 0.09, tone);
    // Sliding leaf is visibly retracted to the side; the 1.65-wide clear opening stays free.
    box(p, 0.22, 1.81, 0.041, -1.02, 1.11, -0.055, glazing, { cast: false });
    box(p, 1.67, 0.014, 0.42, 0, 0.025, 0, M.edge, { cast: false });
    return p;
  }
  function glassPartitionWithGap(
    g,
    low,
    high,
    fixed,
    opening,
    doorWidth,
    dir = 'h',
    style = 'glass',
    caption = 'ACCESS'
  ) {
    const start = opening - doorWidth / 2,
      end = opening + doorWidth / 2;
    if (start > low + 0.12)
      partitionSegment(
        g,
        dir === 'h' ? (low + start) / 2 : fixed,
        dir === 'h' ? fixed : (low + start) / 2,
        start - low,
        dir,
        style
      );
    if (high > end + 0.12)
      partitionSegment(
        g,
        dir === 'h' ? (end + high) / 2 : fixed,
        dir === 'h' ? fixed : (end + high) / 2,
        high - end,
        dir,
        style
      );
    portal(
      g,
      dir === 'h' ? opening : fixed,
      dir === 'h' ? fixed : opening,
      dir,
      caption,
      style === 'solid' ? 0xeac37f : 0x85d5e8
    );
  }

  // Two-sided room enclosure with independently selectable door locations.
  // Used for the secure NOC and rear rooms; never place an opening inside a solid panel.
  function multiDoorPartition(g, low, high, fixed, openings, dir = 'h', style = 'glass') {
    const doors = [...openings].sort((a, b) => a.pos - b.pos);
    let from = low;
    for (const d of doors) {
      const width = d.width || 1.9,
        start = d.pos - width / 2,
        end = d.pos + width / 2;
      if (start < from - 0.015 || end > high + 0.015)
        throw new Error('Invalid partition opening: ' + d.label);
      if (start - from > 0.14)
        partitionSegment(
          g,
          dir === 'h' ? (from + start) / 2 : fixed,
          dir === 'h' ? fixed : (from + start) / 2,
          start - from,
          dir,
          style
        );
      portal(
        g,
        dir === 'h' ? d.pos : fixed,
        dir === 'h' ? fixed : d.pos,
        dir,
        d.label,
        style === 'solid' ? 0xf2bf87 : 0x8ddaf2
      );
      from = end;
    }
    if (high - from > 0.14)
      partitionSegment(
        g,
        dir === 'h' ? (from + high) / 2 : fixed,
        dir === 'h' ? fixed : (from + high) / 2,
        high - from,
        dir,
        style
      );
  }
  // For architecture only: fit wall segments to equipment footprints and ensure
  // the portal is not placed on a rack/desk footprint. Floor-local +Z is the front.
  function station(g, id, x, z, label, type = 'workbench') {
    const root = new THREE.Group();
    root.position.set(x, 0.39, z);
    g.add(root);
    box(root, 2.3, 0.14, 1.05, 0, 0.86, 0, type === 'workbench' ? M.brushed : M.cabinet, {
      rounded: true,
    });
    for (const dx of [-1, 1])
      for (const dz of [-1, 1]) box(root, 0.11, 0.74, 0.1, dx * 1.02, 0.43, dz * 0.43, M.steel);
    if (type === 'scanner') {
      box(root, 0.9, 1.25, 0.09, -0.48, 1.56, -0.38, M.black);
      box(root, 0.8, 1.1, 0.02, -0.48, 1.56, -0.32, M.screen, { cast: false });
      box(root, 0.52, 0.48, 0.42, 0.75, 1.17, 0, M.brushed);
      glowStrip(root, 0.42, 0.04, 0.04, 0.75, 1.38, 0.25);
    } else if (type === 'workbench') {
      box(root, 1.23, 0.08, 0.75, -0.33, 1.24, -0.17, M.dark);
      box(root, 0.76, 0.42, 0.23, 0.63, 1.26, 0.05, M.cabinet);
      for (let k = 0; k < 4; k++) box(root, 0.12, 0.015, 0.02, 0.39 + k * 0.14, 1.36, 0.19, M.edge);
    } else {
      box(root, 1.05, 0.77, 0.6, 0, 1.31, -0.17, M.cabinet);
      for (let j = 0; j < 7; j++)
        box(root, 0.84, 0.022, 0.63, 0, 1.05 + j * 0.082, -0.18, M.vent, { cast: false });
    }
    textPlate(root, label, 0, 0.55, 0.55, 1.6, 0.22);
    register(root, id, {
      name: label,
      zone: 'f1',
      type:
        type === 'scanner'
          ? 'SECURITY WORKSTATION'
          : type === 'workbench'
            ? 'ASSET STAGING'
            : 'MAINTENANCE BENCH',
      temp: 23.4,
      power: 0.6,
      capacity: 52,
      location: '본관 · 장비 지원 공간',
      summary: '1F의 출입, 장비 검수 및 정비 지원 구역에서 사용하는 설비.',
    });
  }
  // V31: ground-floor main entrance. Exterior glazing, recessed sliding-door leaves,
  // access reader and a short landing are placed on the actual front façade (+Z).
  function makeMainEntrance(g) {
    const entry = new THREE.Group();
    entry.name = '1F / KNU AIDC 주출입구';
    entry.position.set(-7.25, 0.36, 9.19);
    g.add(entry);
    const darkFrame = mat(0x20394f, 0.75, 0.29),
      glassDoor = new THREE.MeshPhysicalMaterial({
        color: 0x91cee8,
        metalness: 0.08,
        roughness: 0.1,
        transparent: true,
        opacity: 0.36,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    // Real entry gap: the exterior window/parapet on 1F is split around x=-7.25.
    for (const x of [-1.27, 1.27]) {
      box(entry, 0.145, 2.98, 0.22, x, 1.51, 0, M.brushed, { cast: false });
      box(entry, 0.2, 0.28, 0.22, x, 0.24, 0, darkFrame, { cast: false });
    }
    box(entry, 2.72, 0.17, 0.23, 0, 3.02, 0, darkFrame, { cast: false });
    box(entry, 2.56, 0.07, 0.2, 0, 0.09, 0, M.edge, { cast: false });
    // Recessed automatic sliding doors: center seam, frame rails and glass surfaces.
    for (const side of [-1, 1]) {
      const leaf = new THREE.Group();
      leaf.position.x = side * 0.59;
      entry.add(leaf);
      box(leaf, 1.14, 2.67, 0.055, 0, 1.56, -0.025, glassDoor, { cast: false });
      box(leaf, 1.14, 0.045, 0.08, 0, 2.89, -0.005, M.edge, { cast: false });
      box(leaf, 1.14, 0.045, 0.08, 0, 0.23, -0.005, M.edge, { cast: false });
      box(leaf, 0.038, 2.67, 0.07, side * 0.53, 1.56, 0.012, M.edge, { cast: false });
      box(leaf, 0.042, 0.33, 0.076, side * -0.38, 1.29, 0.065, M.brushed, { cast: false });
    }
    // Lobby door header, entry canopy and LED-lit wayfinding sign.
    box(entry, 3.04, 0.2, 1.36, 0, 3.3, 0.58, M.steel, { cast: false });
    box(entry, 3.26, 0.07, 1.42, 0, 3.44, 0.58, M.brushed, { cast: false });
    glowStrip(entry, 2.62, 0.035, 0.06, 0, 3.24, 1.2, 0x87d7ed);
    textPlate(entry, 'KNU AIDC  /  MAIN ENTRANCE', 0, 3.04, 0.2, 2.52, 0.23, '#d9f5ff', '#1a3a50');
    // Card reader and status light, separated from the door clear width.
    box(entry, 0.17, 0.44, 0.17, 1.43, 1.33, 0.25, M.cabinet, { cast: false });
    box(entry, 0.11, 0.19, 0.018, 1.43, 1.4, 0.347, M.black, { cast: false });
    fxLed(entry, 0.06, 0.034, 0.025, 1.43, 1.51, 0.365, 0x51e5aa);
    // Landing bridges the exterior campus deck and the finished-floor threshold.
    box(entry, 2.83, 0.12, 1.62, 0, 0.02, 0.82, M.floor, { cast: false });
    box(entry, 2.65, 0.025, 1.5, 0, 0.095, 0.82, M.tile, { cast: false });
    for (const x of [-1.28, 1.28]) glowStrip(entry, 0.045, 0.023, 1.42, x, 0.119, 0.85, 0x70bbdf);
    for (const z of [1.26, 1.57])
      box(entry, 2.23, 0.015, 0.055, 0, 0.121, z, M.brushed, { cast: false });
    return entry;
  }

  // V32: photo-reference-style bullet CCTV with real wall/partition mount,
  // articulated arm, powder-white cylindrical housing, aluminum visor, black lens,
  // and an individually lit infrared (IR) diode ring. Emission is geometry-based:
  // depth testing remains enabled so lights never render through opaque walls.
  function installCCTV(g, id, x, z, tx, tz, location, mountFace = 'back', mountHeight = 3.02) {
    const root = new THREE.Group();
    root.name = `${id} / BULLET CCTV`;
    root.position.set(x, mountHeight, z);
    g.add(root);
    const polymer = mat(0xe9eef1, 0.08, 0.36),
      white = mat(0xf5f8fa, 0.05, 0.26);
    const trim = mat(0xaab7c1, 0.57, 0.32),
      jointMat = mat(0xcbd3d9, 0.42, 0.31);
    const black = mat(0x0a1018, 0.42, 0.26),
      rubber = mat(0x1e252d, 0.15, 0.77);
    const infraredMaterial = new THREE.MeshBasicMaterial({
      color: 0xa1e4ff,
      toneMapped: false,
      transparent: true,
      opacity: 0.94,
      depthTest: true,
      depthWrite: true,
    });
    const lampHaloMaterial = new THREE.MeshBasicMaterial({
      color: 0x64cfff,
      toneMapped: false,
      transparent: true,
      opacity: 0.24,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const statusMaterial = new THREE.MeshBasicMaterial({
      color: 0x55edac,
      toneMapped: false,
      depthTest: true,
      depthWrite: true,
    });
    // The circular base faces into the room and stays mechanically attached to a wall.
    // Mount face names refer to the direction of the accessible side of that wall.
    const mountNormals = { back: [0, 1], front: [0, -1], left: [1, 0], right: [-1, 0] };
    const normal = mountNormals[mountFace] || mountNormals.back;
    const bracket = new THREE.Group();
    bracket.rotation.y = Math.atan2(normal[0], normal[1]);
    root.add(bracket);
    function axialCylinder(parent, rFront, rBack, length, cx, cy, cz, material, segs = 36) {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(rFront, rBack, length, segs),
        material
      );
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(cx, cy, cz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }
    function mountBar(parent, a, b, r, material) {
      const v1 = new THREE.Vector3(...a),
        v2 = new THREE.Vector3(...b),
        diff = v2.clone().sub(v1);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, diff.length(), 12), material);
      mesh.position.copy(v1.add(v2).multiplyScalar(0.5));
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), diff.normalize());
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    }
    // Round wall plate, recessed base, visible fixing screws and articulated elbow.
    axialCylinder(bracket, 0.173, 0.173, 0.068, 0, 0, 0.027, polymer);
    axialCylinder(bracket, 0.153, 0.153, 0.018, 0, 0, 0.073, trim);
    axialCylinder(bracket, 0.123, 0.123, 0.038, 0, 0, 0.104, white);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), trim);
      bolt.position.set(Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0.091);
      bracket.add(bolt);
    }
    const a = [0, -0.025, 0.115],
      b = [0, -0.22, 0.37],
      c = [0, -0.22, 0.5];
    mountBar(bracket, a, b, 0.055, polymer);
    mountBar(bracket, b, c, 0.062, jointMat);
    const joint = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), white);
    joint.position.set(...b);
    bracket.add(joint);
    axialCylinder(bracket, 0.089, 0.089, 0.075, 0, -0.22, 0.5, trim);
    // Aim the entire body toward its assigned surveillance target; +Z is camera front.
    const direction = new THREE.Vector3(
      tx - x,
      (g.userData.floorKey ? 1.45 : 1.2) - mountHeight,
      tz - z
    ).normalize();
    const localDirection = direction.clone().applyQuaternion(bracket.quaternion.clone().invert());
    const head = new THREE.Group();
    head.position.set(0, -0.22, 0.5);
    head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), localDirection);
    bracket.add(head);
    // Offset the barrel forward of the pivot like an outdoor bullet camera.
    const barrel = new THREE.Group();
    barrel.position.z = 0.17;
    head.add(barrel);
    axialCylinder(barrel, 0.192, 0.199, 0.81, 0, 0, -0.025, white, 40);
    const tail = new THREE.Mesh(
      new THREE.SphereGeometry(0.189, 30, 18, 0, Math.PI * 2, 0, Math.PI * 0.6),
      polymer
    );
    tail.rotation.x = -Math.PI / 2;
    tail.position.z = -0.42;
    barrel.add(tail);
    // Dark body seams, tiny service screws and a recessed mounting collar.
    axialCylinder(barrel, 0.202, 0.202, 0.019, 0, 0, -0.355, trim);
    axialCylinder(barrel, 0.211, 0.211, 0.045, 0, 0, 0.384, black);
    for (const side of [-1, 1]) {
      const screw = new THREE.Mesh(new THREE.SphereGeometry(0.015, 10, 8), trim);
      screw.position.set(side * 0.172, -0.074, 0.12);
      barrel.add(screw);
    }
    // Metallic curved rain/sun visor, extended past the front glass.
    // An actual curved mesh (not a slab) follows the upper half of the cylindrical body.
    const vertices = [],
      indices = [];
    const n = 36;
    for (let i = 0; i <= n; i++) {
      const th = (i / n) * Math.PI;
      const px = Math.cos(th) * 0.231,
        py = Math.sin(th) * 0.231;
      vertices.push(px, py, -0.437, px, py, 0.535);
      if (i < n) {
        const k = i * 2;
        indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    const hoodGeo = new THREE.BufferGeometry();
    hoodGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    hoodGeo.setIndex(indices);
    hoodGeo.computeVertexNormals();
    const hood = new THREE.Mesh(
      hoodGeo,
      new THREE.MeshStandardMaterial({
        color: 0xf0f3f5,
        metalness: 0.18,
        roughness: 0.35,
        side: THREE.DoubleSide,
      })
    );
    hood.castShadow = true;
    barrel.add(hood);
    for (const edgeZ of [-0.437, 0.535]) {
      const arc = [];
      for (let i = 0; i <= n; i++) {
        const th = (i / n) * Math.PI;
        arc.push(new THREE.Vector3(0.231 * Math.cos(th), 0.231 * Math.sin(th), edgeZ));
      }
      const lineMesh = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(arc),
        new THREE.LineBasicMaterial({ color: 0xa3b3be, depthTest: true })
      );
      barrel.add(lineMesh);
    }
    // Front fascia: rubber rim, IR diode pockets, optical lens and glossy glass center.
    axialCylinder(barrel, 0.201, 0.201, 0.027, 0, 0, 0.405, rubber, 40);
    const darkFace = new THREE.Mesh(new THREE.CircleGeometry(0.182, 48), black);
    darkFace.position.z = 0.426;
    barrel.add(darkFace);
    const outerRim = new THREE.Mesh(new THREE.TorusGeometry(0.181, 0.013, 7, 48), trim);
    outerRim.position.z = 0.435;
    barrel.add(outerRim);
    const diodeRing = new THREE.Mesh(new THREE.TorusGeometry(0.143, 0.008, 7, 48), rubber);
    diodeRing.position.z = 0.439;
    barrel.add(diodeRing);
    const irLeds = [];
    const lampGeometry = new THREE.SphereGeometry(0.014, 12, 8);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const lx = Math.cos(a) * 0.143,
        ly = Math.sin(a) * 0.143;
      const hole = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), rubber);
      hole.position.set(lx, ly, 0.446);
      barrel.add(hole);
      const led = new THREE.Mesh(lampGeometry, infraredMaterial);
      led.position.set(lx, ly, 0.463);
      barrel.add(led);
      irLeds.push(led);
    }
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.144, 0.022, 4, 48), lampHaloMaterial);
    halo.position.z = 0.449;
    barrel.add(halo);
    axialCylinder(barrel, 0.086, 0.087, 0.029, 0, 0, 0.445, trim, 36);
    const lensOuter = new THREE.Mesh(new THREE.CircleGeometry(0.081, 40), rubber);
    lensOuter.position.z = 0.466;
    barrel.add(lensOuter);
    const iris = new THREE.Mesh(
      new THREE.CircleGeometry(0.063, 40),
      new THREE.MeshPhysicalMaterial({
        color: 0x101e30,
        metalness: 0.12,
        roughness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.09,
        side: THREE.DoubleSide,
      })
    );
    iris.position.z = 0.477;
    barrel.add(iris);
    const lensInner = new THREE.Mesh(
      new THREE.CircleGeometry(0.036, 32),
      new THREE.MeshBasicMaterial({ color: 0x1e4863, depthTest: true })
    );
    lensInner.position.z = 0.479;
    barrel.add(lensInner);
    const pupil = new THREE.Mesh(
      new THREE.CircleGeometry(0.015, 24),
      new THREE.MeshBasicMaterial({ color: 0x06121e })
    );
    pupil.position.z = 0.482;
    barrel.add(pupil);
    const glint = new THREE.Mesh(
      new THREE.CircleGeometry(0.012, 16),
      new THREE.MeshBasicMaterial({
        color: 0xb8e4f9,
        transparent: true,
        opacity: 0.8,
        depthTest: true,
        depthWrite: false,
      })
    );
    glint.position.set(-0.017, 0.019, 0.484);
    barrel.add(glint);
    // Small green running LED next to the lower edge of the front bezel.
    const statusSocket = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), rubber);
    statusSocket.position.set(0.145, -0.1, 0.444);
    barrel.add(statusSocket);
    const statusLed = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 8), statusMaterial);
    statusLed.position.set(0.145, -0.1, 0.458);
    barrel.add(statusLed);
    // The cable leaves the barrel and enters the bracket (never a free-floating wire).
    pipe(
      bracket,
      [
        [0.075, -0.24, 0.49],
        [0.14, -0.28, 0.39],
        [0.12, -0.17, 0.19],
      ],
      0.011,
      0x43535c,
      12
    );
    const floor = g.userData.floorKey || null;
    const facilityZone = floor ? 'f' + floor[0] : g === regionGroups.power ? 'power' : 'cooling';
    const facilityName = floor
      ? `본관 ${floor}`
      : facilityZone === 'power'
        ? '전력 설비동'
        : '냉각 설비동';
    register(root, id, {
      name: `${facilityName} CCTV`,
      zone: facilityZone,
      type: 'CCTV CAMERA',
      location: `${facilityName} · ${location}`,
      temp: 30.1,
      power: 0.08,
      capacity: 28,
      summary: `${location}의 벽면에 설치된 불릿형 보안 CCTV. 렌즈 주변 IR LED와 작동 LED가 점등됩니다. 수치 및 상태는 시연용이며 실제 영상은 연결되지 않습니다.`,
    });
    registerFx(id, { kind: 'cctv', irLeds, halo, statusLed, phase: Number(id.slice(-2)) * 0.75 });
    return root;
  }
  function securityGate(g, x, z, id) {
    const root = new THREE.Group();
    root.position.set(x, 0.39, z);
    g.add(root);
    for (const side of [-1, 1]) {
      box(root, 0.38, 1.26, 1.45, side * 0.64, 0.63, 0, M.brushed, { rounded: true });
      box(root, 0.2, 0.12, 0.29, side * 0.62, 1.34, 0.5, M.black);
      glowStrip(root, 0.12, 0.04, 0.2, side * 0.62, 1.35, 0.55, 0x57e2bb);
    }
    box(root, 1.07, 0.02, 0.58, 0, 0.96, -0.2, glazing, { cast: false });
    box(root, 0.24, 0.19, 0.14, 0, 1.15, 0, M.screen);
    register(root, id, {
      name: `출입 검색 게이트 ${id}`,
      zone: 'f1',
      type: 'SECURITY ACCESS',
      location: '본관 · 1F 보안 출입 통로',
      temp: 23.2,
      power: 0.25,
      capacity: 97,
      summary: '비인가 접근을 제한하는 출입 인증 및 맨트랩 전 단계의 통제 설비.',
    });
    const gateLeds = [
      fxLed(root, 0.13, 0.04, 0.02, -0.62, 1.35, 0.56, 0x59e2bb),
      fxLed(root, 0.13, 0.04, 0.02, 0.62, 1.35, 0.56, 0x59e2bb),
    ];
    const warningPanel = fxPlane(root, 1.18, 1.1, 0, 1.15, -0.18, 0xff6270, 0.0);
    warningPanel.visible = false;
    registerFx(id, { kind: 'security', gateLeds, warningPanel });
  }
  function shelf(g, x, z, id) {
    const root = new THREE.Group();
    root.position.set(x, 0.39, z);
    g.add(root);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) box(root, 0.08, 2.1, 0.1, sx * 1.02, 1.05, sz * 0.41, M.edge);
    for (let j = 0; j < 4; j++) {
      box(root, 2.2, 0.09, 0.95, 0, 0.25 + j * 0.55, 0, M.brushed);
      for (let k = 0; k < 3; k++)
        box(root, 0.47, 0.28, 0.6, -0.67 + k * 0.65, 0.45 + j * 0.55, 0, j % 2 ? M.cabinet : beige);
    }
    textPlate(root, id, 0, 2.2, 0.41, 1.1, 0.19);
    register(root, id, {
      name: `장비 예비품 랙 ${id}`,
      zone: 'f1',
      type: 'SPARE PARTS',
      location: '본관 · 1F 예비품 보관실',
      temp: 22.9,
      power: 0.1,
      capacity: 58,
      summary: '교체 모듈과 장비 부품을 식별 보관하는 예비품 랙.',
    });
  }
  function storageRack(g, x, z, id) {
    const root = new THREE.Group();
    root.position.set(x, 0.4, z);
    g.add(root);
    box(root, 1.37, 2.4, 1.21, 0, 1.2, 0, M.cabinet, { rounded: true });
    box(root, 1.25, 2.14, 0.04, 0, 1.18, 0.635, M.black, { cast: false });
    for (let i = 0; i < 15; i++) {
      box(root, 1.12, 0.107, 0.035, 0, 0.32 + i * 0.13, 0.667, M.server, { cast: false });
      for (let j = 0; j < 8; j++)
        glowStrip(
          root,
          0.047,
          0.022,
          0.02,
          -0.47 + j * 0.13,
          0.32 + i * 0.13,
          0.694,
          j % 3 ? 0x6ed5bd : 0x70c0e3
        );
    }
    textPlate(root, id, 0, 2.28, 0.684, 0.95, 0.18);
    register(root, id, {
      name: `스토리지 랙 ${id}`,
      zone: 'general',
      type: 'STORAGE RACK',
      location: '본관 · 2F 스토리지 존',
      temp: 22.2,
      power: 2.6,
      capacity: 58,
      summary: '백업 및 서비스 데이터를 보관하는 스토리지 장비의 랙.',
    });
  }
  function raisedAisle(g, x, z, w, d, color = 0x64c4e5) {
    box(g, w, 0.025, d, x, 0.455, z, mat(0x235269, 0.1, 0.52), { cast: false });
    for (const sx of [-1, 1]) {
      box(g, 0.055, 0.026, d, x + sx * (w / 2 - 0.08), 0.482, z, trimMaterials.cyan, {
        cast: false,
      });
    }
    for (let zz = -d / 2 + 0.55; zz < d / 2; zz += 1.05) {
      box(g, w - 0.35, 0.012, 0.02, x, 0.484, z + zz, trimMaterials.satin, { cast: false });
    }
    for (let i = -d / 2 + 0.32; i < d / 2; i += 0.57)
      for (let j = -w / 2 + 0.15; j < w / 2; j += 0.48) {
        box(g, 0.26, 0.012, 0.019, x + j, 0.475, z + i, M.vent, { cast: false });
      }
    // Clear end access: no full-width glass panels across service aisles.
    box(g, w, 0.042, 0.065, x, 0.492, z - d / 2, M.edge, { cast: false });
    box(g, w, 0.042, 0.065, x, 0.492, z + d / 2, M.edge, { cast: false });
    // High service-aisle light bar: do not draw above the equipment in detail view.
    const overhead = detailShells[g.userData?.floorKey]?.ceiling || g;
    glowStrip(overhead, w, 0.025, 0.09, x, 2.95, z, color);
  }
  function cableTray(g, x, z, w, d, axis = 'z') {
    // Ceiling-height trays belong to the overhead visual layer: visible in site
    // overview/exploded views, hidden only while examining the corresponding floor.
    const target = detailShells[g.userData?.floorKey]?.ceiling || g;
    const len = axis === 'z' ? d : w;
    box(target, axis === 'z' ? 0.58 : len, 0.09, axis === 'z' ? len : 0.58, x, 3.51, z, M.cabinet);
    for (const side of [-1, 1])
      box(
        target,
        axis === 'z' ? 0.05 : len,
        0.22,
        axis === 'z' ? len : 0.05,
        x + (axis === 'z' ? side * 0.27 : 0),
        3.61,
        z + (axis === 'z' ? 0 : side * 0.27),
        M.edge
      );
    for (let j = -len / 2 + 0.35; j < len / 2 - 0.22; j += 0.7) {
      box(
        target,
        axis === 'z' ? 0.54 : 0.05,
        0.04,
        axis === 'z' ? 0.06 : 0.54,
        x + (axis === 'z' ? 0 : j),
        3.69,
        z + (axis === 'z' ? j : 0),
        M.brushed
      );
    }
  }
  function shortText(g, text, x, z, w = 3, bg = '#20445a') {
    const plate = textPlate(g, text, x, 0.472, z, w, 0.3, '#d9eff6', bg);
    plate.rotation.x = -Math.PI / 2;
  }
  buildFloor1({
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
  });

  buildFloor2({
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
  });

  const f3CoolingOverlay = buildFloor3({
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
  });

  // V34: one CCTV per main-building floor, consistently mounted at the LEFT INSIDE CORNER.
  // The left (-X) wall stays visible in single-floor detail views; the front/right walls do not.
  // Use the rear-left interior wall, slightly clear of the back wall to avoid monitor walls,
  // network cabinets, storage racks, GPU racks and the main circulation aisles.
  // The back of the wall plate intersects the wall deliberately; the camera projects inward.
  // Schema: ID, wall-contact X/Z, target X/Z, purpose, exposed mounting face, mount height.
  const cctvLayouts = {
    '1F': [
      [
        'CCTV-1F-01',
        -11.71,
        -8.05,
        -6.7,
        4.2,
        '왼쪽 후면 내부 모서리 · 로비·보안 구역',
        'left',
        3.06,
      ],
    ],
    '2F': [
      ['CCTV-2F-01', -11.71, -8.05, -5.6, -1.8, '왼쪽 후면 내부 모서리 · 서버홀 A', 'left', 3.06],
    ],
    '3F': [
      [
        'CCTV-3F-01',
        -11.71,
        -8.05,
        -6.3,
        -1.65,
        '왼쪽 후면 내부 모서리 · 공랭 GPU 구역',
        'left',
        3.06,
      ],
    ],
    '4F': [['CCTV-4F-01', -11.71, -8.05, -6.4, -2.2, '왼쪽 후면 내부 모서리 · NOC', 'left', 3.06]],
  };
  for (const [floor, cameras] of Object.entries(cctvLayouts)) {
    for (const [id, x, z, targetX, targetZ, location, mountFace, mountHeight] of cameras)
      installCCTV(floorGroups[floor], id, x, z, targetX, targetZ, location, mountFace, mountHeight);
  }
  // Floor-by-floor vertical access shaft: roofless cutaway of shared riser.
  for (const key of floorList) {
    const fg = floorGroups[key];
    box(fg, 0.23, 2.67, 0.23, -11.12, 1.9, 7.73, M.brushed);
    box(fg, 1.0, 2.67, 0.08, -11.07, 1.9, 8.72, glazing, { cast: false });
    glowStrip(fg, 0.06, 2.4, 0.06, -11.0, 1.85, 8.74, 0x6cc9e5);
  }
  // World anchors are calculated from animated floor positions, rather than fixed Y.
  for (const key of floorList) {
    const n = Number(key[0]);
    labelAnchors.push(
      labelAnchor(
        key,
        key + ' · ' + FLOOR_INFO[key].name,
        FLOOR_INFO[key].sub,
        () => new THREE.Vector3(-12.1, floorGroups[key].position.y + 2.43, 7.25),
        'f' + n,
        key
      )
    );
  }
  labelAnchors.push(
    labelAnchor(
      'mdf',
      'MDF / 네트워크',
      '통신 인입·코어',
      () => new THREE.Vector3(-7.0, f1.position.y + 3.85, -5.55),
      'network',
      '1F'
    )
  );
  labelAnchors.push(
    labelAnchor(
      'datahall',
      '범용 서버실',
      '16 랙 · 2개 홀',
      () => new THREE.Vector3(0, f2.position.y + 3.9, -3.05),
      'general',
      '2F'
    )
  );
  labelAnchors.push(
    labelAnchor(
      'gpuhall',
      'AI / GPU 전산실',
      '공랭 · 액체냉각',
      () => new THREE.Vector3(0, f3.position.y + 3.9, -3.15),
      'gpu',
      '3F'
    )
  );

  const { powerZone, coolingZone } = buildUtilityZones({
    THREE,
    region,
    platform,
    wall,
    column,
    upsCabinet,
    box,
    M,
    cylinder,
    register,
    chiller,
    pump,
    pipe,
    installCCTV,
  });

  buildFloor4({
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
  });

  // Service routes, industrial site markings and simple water/generator mockups.
  for (const [x, z, w, d] of [
    [-12.6, 0, 1.3, 2.5],
    [12.6, -3, 1.3, 2.5],
  ]) {
    box(foundation, w, 0.03, d, x, -0.01, z, mat(0x486777, 0.23, 0.71));
    for (let p = -d / 2 + 0.3; p < d / 2; p += 0.63)
      box(foundation, 0.45, 0.02, 0.09, x, 0.012, z + p, M.edge, { cast: false });
  }
  box(powerZone, 3.7, 0.35, 2.15, -18, 0.2, 6.8, mat(0x48626e, 0.18, 0.8));
  const generator = new THREE.Group();
  generator.position.set(-18, 0.39, 6.8);
  powerZone.add(generator);
  box(generator, 3.0, 1.4, 1.45, 0, 0.73, 0, mat(0x718e88, 0.52, 0.45), { rounded: true });
  for (let i = 0; i < 13; i++)
    box(generator, 0.03, 0.75, 0.018, -1.18 + i * 0.19, 0.74, 0.74, M.dark, { cast: false });
  const exhaust = cylinder(generator, 0.24, 1.1, 1.0, 1.78, -0.3, M.brushed);
  textPlate(generator, 'GEN 01', 0, 0.35, 0.75, 1.2, 0.2);
  register(generator, 'GEN-01', {
    zone: 'power',
    type: 'BACKUP GENERATOR',
    name: '비상 발전기 GEN-01',
    location: '전력 설비동 · 외부 발전 구역',
    temp: 31.0,
    power: 0,
    capacity: 100,
    summary: '상용전원 장애 시 사용되는 비상 전력 공급 장치. 현재 대기 상태.',
  });

  // Seven simulated roles use approved GLBs after loading. No procedural/fallback
  // person is rendered during initial loading or after a failed model request.
  const AI_AGENT_CONFIG = [
    {
      id: 'AI-SEC-01',
      name: '보안 에이전트',
      role: '출입·물리 보안',
      area: '1F 보안 출입 구역',
      zone: 'f1',
      parent: f1,
      x: -5.7,
      z: 7.1,
      y: 0.4,
      angle: -0.25,
      tint: 0x58d6bf,
      intro: '출입 인증과 CCTV 상태를 모의 감시합니다.',
      monitor: ['GATE-01', 'GATE-02', 'CCTV-1F-01'],
      scenarios: ['access'],
    },
    {
      id: 'AI-NET-01',
      name: '서버·네트워크 에이전트',
      role: '서버·통신 운영',
      area: '2F 서버홀 전면 통로',
      zone: 'f2',
      parent: f2,
      x: -2.25,
      z: 8.43,
      y: 0.4,
      angle: -0.28,
      tint: 0x72b9ef,
      intro: '서버·네트워크 동작과 서비스 상태를 모의 분석합니다.',
      monitor: ['SRV-04', 'CORE-01', 'CRAC-01'],
      scenarios: ['server', 'network'],
    },
    {
      id: 'AI-GPU-01',
      name: 'GPU 에이전트',
      role: 'AI 컴퓨팅·액체냉각',
      area: '3F GPU 전면 점검 통로',
      zone: 'f3',
      parent: f3,
      x: 1.88,
      z: 8.45,
      y: 0.4,
      angle: 0.35,
      tint: 0xa99cf7,
      intro: 'GPU 부하, 온도 및 CDU 유량 상태를 모의 점검합니다.',
      monitor: ['GPU-03', 'LIQ-GPU-01', 'CDU-01'],
      scenarios: ['gpu', 'cdu'],
    },
    {
      id: 'AI-NOC-01',
      name: 'NOC 에이전트',
      role: '시설 통합 관제',
      area: '4F NOC 관제실',
      zone: 'noc',
      parent: f4,
      x: -10.1,
      z: 2.25,
      y: 0.4,
      angle: 1.1,
      tint: 0x74cfe0,
      intro: '시설 상태와 주요 운영 이벤트를 통합 모니터링합니다.',
      monitor: ['NOC-WALL-01', 'NOC-OPS-01', 'UPS-01'],
      scenarios: ['gpu', 'server', 'ups', 'cdu', 'chiller', 'noc'],
    },
    {
      id: 'AI-SOC-01',
      name: 'SOC 에이전트',
      role: '보안 이벤트 분석',
      area: '4F SOC 관제실',
      zone: 'noc',
      parent: f4,
      x: 9.85,
      z: 2.32,
      y: 0.4,
      angle: -1.0,
      tint: 0xf0b77a,
      intro: '출입·보안 관련 이벤트를 모의 분석합니다.',
      monitor: ['SOC-WALL-01', 'SOC-OPS-01', 'GATE-01'],
      scenarios: ['access', 'network'],
    },
    {
      id: 'AI-PWR-01',
      name: '전력 에이전트',
      role: '전력·UPS 운영',
      area: '전력 설비동 점검 통로',
      zone: 'power',
      parent: powerZone,
      x: -21.05,
      z: 3.55,
      y: 0.4,
      angle: -0.25,
      tint: 0xf2c36d,
      intro: 'UPS 이중화·축전지·배전 전원 상태를 모의 감시합니다.',
      monitor: ['UPS-01', 'UPS-02', 'BAT-01', 'SWGR-01'],
      scenarios: ['ups'],
    },
    {
      id: 'AI-CLG-01',
      name: '냉각 에이전트',
      role: '냉각·열관리 운영',
      area: '냉각 설비동 점검 통로',
      zone: 'cooling',
      parent: coolingZone,
      x: 13.48,
      z: 1.05,
      y: 0.4,
      angle: -0.55,
      tint: 0x75dcf4,
      intro: '냉동기·순환펌프·냉각수 상태를 모의 감시합니다.',
      monitor: ['CH-01', 'PUMP-01', 'HEX-01', 'CDU-01'],
      scenarios: ['chiller', 'cdu'],
    },
  ];
  const aiAgents = new Map();
  let agentsVisible = initialTwinState.agentsVisible;
  function makeOperatorAnchor(config) {
    const root = new THREE.Group();
    root.name = config.id + ' / AI OPERATOR';
    root.position.set(config.x, config.y, config.z);
    config.parent.add(root);

    const direction = new THREE.Group();
    direction.name = 'agent-direction';
    direction.rotation.y = config.angle;
    root.add(direction);

    // Location/status marker only. No procedural or fallback character is
    // created while the approved GLB is waiting or unavailable.
    const marker = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.3, 32),
      new THREE.MeshBasicMaterial({
        color: config.tint,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2,
        depthTest: true,
        depthWrite: false,
      })
    );
    marker.name = 'agent-ground-ring';
    marker.rotation.x = -Math.PI / 2;
    marker.position.y = 0.026;
    direction.add(marker);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 10, 8),
      new THREE.MeshBasicMaterial({
        color: 0xffb86b,
        transparent: true,
        opacity: 0,
        depthTest: true,
        depthWrite: false,
      })
    );
    beacon.name = 'agent-alert-beacon';
    beacon.position.set(0.4, 0.12, 0.02);
    beacon.visible = false;
    direction.add(beacon);

    register(root, config.id, {
      zone: config.zone,
      type: 'AI AGENT',
      name: config.name,
      location: config.area,
      summary: config.intro,
      markerLocal: [0, 0.08, 0],
      capacity: 100,
      temp: 0,
      power: 0,
      agentRole: config.role,
    });
    aiAgents.set(config.id, { ...config, root, direction, marker, beacon });
  }
  AI_AGENT_CONFIG.forEach(makeOperatorAnchor);

  const { loadRealHumanLibrary } = createHumanModelLoader({
    THREE,
    GLTFLoader,
    cloneSkinnedModel,
    query: $,
    aiAgents,
    AI_AGENT_CONFIG,
    prepareEquipmentPickBounds,
    isDisposed: () => disposed,
    getAssetModalId: () => assetModalId,
    mountAssetPreview,
    registry,
    updateAssetModal,
  });

  function agentRelatedIncidents(config) {
    return [...activeIncidents.values()].filter(v => config.scenarios.includes(v.id));
  }
  function agentIsBusy(config) {
    return agentRelatedIncidents(config).length > 0;
  }
  function agentWorkTitle(config) {
    const incidents = agentRelatedIncidents(config);
    return incidents.length
      ? `${SCENARIO_BY_ID.get(incidents[0].id)?.title || '이벤트'} · ${incidentSteps[incidents[0].stage]}`
      : '정상 감시 · 정기 점검';
  }
  function animateOperatorRig(root, config, t, busy) {
    if (config?.realLoaded && root === config.root) {
      if (config.revealMaterials) {
        const progress = clamp((performance.now() - config.revealStartedAt) / 220, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        for (const entry of config.revealMaterials) {
          entry.material.opacity = entry.opacity * eased;
        }
        if (progress >= 1) {
          for (const entry of config.revealMaterials) {
            entry.material.opacity = entry.opacity;
            entry.material.transparent = entry.transparent;
            entry.material.depthWrite = entry.depthWrite;
          }
          config.revealMaterials = null;
        }
      }
      if (config.mixer) {
        const delta = config.mixerLastTime
          ? Math.max(0, Math.min(0.08, t - config.mixerLastTime))
          : 0;
        config.mixerLastTime = t;
        config.mixerAccumulator = (config.mixerAccumulator || 0) + delta;
        // Idle poses do not need 60/120 Hz bone updates. Rendering stays at
        // full frame rate while skeleton animation runs at 30 Hz (15 Hz low).
        const mixerStep = 1 / (highQuality ? 30 : 15);
        if (config.mixerAccumulator >= mixerStep) {
          config.mixer.update(Math.min(config.mixerAccumulator, 0.08));
          config.mixerAccumulator = 0;
        }
      }
      // A subtle warning when a simulated event is active; no exaggerated bobbing.
      if (config.beacon) {
        config.beacon.visible = busy;
        config.beacon.material.opacity = busy ? 0.58 + 0.24 * Math.sin(t * 4) : 0;
      }
      return;
    }
    const ring = root.getObjectByName('agent-ground-ring');
    const beacon = root.getObjectByName('agent-alert-beacon');
    const seed = AI_AGENT_CONFIG.findIndex(a => a.id === config.id) * 0.9;
    if (ring) {
      ring.material.opacity = busy
        ? 0.5 + (0.23 * (1 + Math.sin(t * 3.1))) / 2
        : 0.28 + 0.1 * Math.sin(t * 1.3 + seed);
      ring.material.color.setHex(busy ? 0xffc075 : config.tint);
    }
    if (beacon) {
      beacon.visible = busy;
      beacon.material.opacity = busy ? 0.48 + (0.42 * (1 + Math.sin(t * 4.2))) / 2 : 0;
    }
  }
  function updateAgentShortcuts() {
    const el = $('#agent-shortcuts');
    if (!el) return;
    const busyCount = AI_AGENT_CONFIG.filter(agentIsBusy).length;
    $('#agent-quick-count').textContent = busyCount ? `07 / 점검 ${busyCount}명` : '07 / 정상 감시';
    el.innerHTML = AI_AGENT_CONFIG.map(a => {
      const busy = agentIsBusy(a);
      return `<button type="button" class="agent-shortcut ${selectedId === a.id ? 'active' : ''}" data-agent-id="${a.id}"><span><strong>${esc(a.name)}</strong><small>${esc(a.area)}</small></span><i class="agent-dot ${busy ? 'busy' : ''}"></i></button>`;
    }).join('');
  }
  function updateAgentModal(asset) {
    const config = aiAgents.get(asset.id);
    if (!config) return;
    const incidents = agentRelatedIncidents(config),
      busy = incidents.length > 0;
    $('#agent-modal-role').textContent = config.role;
    $('#agent-modal-description').textContent =
      config.intro + ' 실제 AI 의사결정이나 현장 제어 기능은 연결되지 않았습니다.';
    const status = $('#agent-modal-status');
    status.textContent = agentWorkTitle(config);
    status.classList.toggle('busy', busy);
    $('#agent-modal-area').textContent = config.area;
    $('#agent-modal-alert-count').textContent = incidents.length + '건';
    $('#agent-modal-devices').innerHTML = config.monitor
      .map(id => `<span>${esc(id)}</span>`)
      .join('');
    $('#agent-modal-events').innerHTML = incidents.length
      ? incidents
          .map(incident => {
            const data = SCENARIO_BY_ID.get(incident.id);
            return `<div class="agent-modal-event"><div><strong>${esc(data?.title || incident.id)}</strong><small>관련 설비: ${esc(data?.asset || '-')} · 모의 장애 시나리오</small></div><b>${esc(incidentSteps[incident.stage] || '확인')}</b></div>`;
          })
          .join('')
      : `<div class="agent-modal-empty">담당 구역에 진행 중인 모의 장애가 없습니다.<br>현재는 점검 대기 및 설비 상태 모니터링 동작을 수행하고 있습니다.</div>`;
    $('#asset-modal-title').textContent = `${config.name} · ${asset.id}`;
    $('#asset-modal-device-id').textContent = asset.id + ' · AI OPERATOR';
    $('#asset-modal-name').textContent = config.name;
    $('#asset-modal-summary').textContent = config.intro;
    $('#asset-modal-location').textContent = config.area;
    $('#asset-modal-type').textContent = config.role;
    $('#asset-modal-status').textContent = busy ? 'INSPECTING' : 'STANDBY';
    $('#asset-modal-status').classList.toggle('warning', busy);
    $('#asset-modal-door').hidden = true;
    $('#asset-modal-view-note').textContent = '드래그로 회전 · 휠로 확대 · 대기·점검 동작';
  }
  function setAgentVisibility(show) {
    twinActions.setAgentsVisible(Boolean(show));
  }
  function applyAgentVisibility(show) {
    agentsVisible = Boolean(show);
    for (const agent of aiAgents.values()) agent.root.visible = agentsVisible;
    const btn = $('#btn-agent-visibility');
    btn.classList.toggle('active', agentsVisible);
    btn.setAttribute('aria-pressed', String(agentsVisible));
    btn.textContent = agentsVisible ? '요원 ON' : '요원 OFF';
    if (!agentsVisible && selectedId && aiAgents.has(selectedId)) setZone(activeZone, null, false);
  }

  // V29. Floor-accurate utility network. These are physical cable/pipe models,
  // not painted guides. Floor-local branches inherit each floor's Y transform;
  // vertical telescopic risers span the live gap between adjacent animated floors.
  const utilityNetwork = new THREE.Group();
  utilityNetwork.name = '전력·냉각 통합 공급계통';
  scene.add(utilityNetwork);
  const powerFlow = new THREE.Group();
  powerFlow.name = '전력 흐름 입자';
  scene.add(powerFlow);
  const coolingFlow = new THREE.Group();
  coolingFlow.name = '냉각 흐름 입자';
  scene.add(coolingFlow);
  const coolantFlows = [];
  const utilityRouteMeshes = [];
  const utilityTelescopes = [];
  const utilityCouplings = [];
  const utilityFixtures = [];
  const utilityBeadMaterial = {};
  const FEED_CONFIG = {
    pa: { kind: 'power', name: '전력 A', x: -12.68, z: -8.06, color: 0xffd35d, ring: 0xffdf86 },
    pb: { kind: 'power', name: '전력 B', x: -13.08, z: -8.54, color: 0xd9a72b, ring: 0xf2c95d },
    cs: { kind: 'coolant', name: '냉수 공급', x: 12.7, z: -8.06, color: 0x78dfff, ring: 0xb2f1ff },
    cr: { kind: 'coolant', name: '냉수 회수', x: 13.1, z: -8.54, color: 0x369ecb, ring: 0x74c7ec },
  };
  function utilityPath(parent, points, feed, floorKey = null, radius = 0.062, showFlow = true) {
    const config = FEED_CONFIG[feed];
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const segCount = Math.max(16, Math.min(94, points.length * 12));
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.3,
      metalness: 0.48,
      emissive: config.color,
      emissiveIntensity: 0.035,
    });
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, segCount, radius, 8, false),
      material
    );
    tube.castShadow = false;
    tube.receiveShadow = false;
    tube.userData.utility = true;
    parent.add(tube);
    utilityRouteMeshes.push({ mesh: tube, feed, floor: floorKey, base: config.color });
    if (showFlow) {
      const dots = [];
      const group = config.kind === 'power' ? powerFlow : coolingFlow;
      // Particles live with the conduit so separated floors do not leave their animated flow behind.
      const dotParent = new THREE.Group();
      parent.add(dotParent);
      for (let i = 0; i < 3; i++) {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.105, 10, 9),
          new THREE.MeshBasicMaterial({ color: config.color, depthTest: true, depthWrite: false })
        );
        dotParent.add(dot);
        dots.push(dot);
      }
      (config.kind === 'power' ? flows : coolantFlows).push({
        curve,
        beads: dots,
        group,
        feed,
        floor: floorKey,
        dotParent,
      });
    }
    return tube;
  }
  function utilityBracket(parent, x, y, z, feed, dir = 'y') {
    const color = FEED_CONFIG[feed].ring;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.137, 0.033, 7, 20),
      new THREE.MeshStandardMaterial({ color: 0x9db2bd, metalness: 0.78, roughness: 0.29 })
    );
    ring.rotation.x = Math.PI / 2;
    if (dir === 'x') ring.rotation.set(0, Math.PI / 2, 0);
    if (dir === 'z') ring.rotation.set(0, 0, 0);
    ring.position.set(x, y, z);
    parent.add(ring);
    const seal = new THREE.Mesh(
      new THREE.TorusGeometry(0.113, 0.013, 5, 18),
      new THREE.MeshBasicMaterial({ color, depthTest: true })
    );
    seal.rotation.copy(ring.rotation);
    seal.position.copy(ring.position);
    parent.add(seal);
    utilityCouplings.push({ mesh: ring, feed }, { mesh: seal, feed });
    return ring;
  }
  function utilityVertical(floorBelow, floorAbove, feed) {
    const spec = FEED_CONFIG[feed];
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 1, 12, 1, false),
      new THREE.MeshStandardMaterial({
        color: spec.color,
        metalness: 0.6,
        roughness: 0.37,
        emissive: spec.color,
        emissiveIntensity: 0.04,
      })
    );
    // Geometry radius is 1; scale.x/z encode the actual pipe gauge.
    rod.scale.set(spec.kind === 'power' ? 0.084 : 0.12, 1, spec.kind === 'power' ? 0.084 : 0.12);
    rod.position.set(spec.x, 0, spec.z);
    rod.castShadow = false;
    utilityNetwork.add(rod);
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 1, 12, 1, false),
      new THREE.MeshStandardMaterial({
        color: 0x526b80,
        metalness: 0.75,
        roughness: 0.3,
        transparent: true,
        opacity: 0.68,
      })
    );
    sleeve.scale.set(
      spec.kind === 'power' ? 0.123 : 0.168,
      1,
      spec.kind === 'power' ? 0.123 : 0.168
    );
    sleeve.position.set(spec.x, 0, spec.z);
    utilityNetwork.add(sleeve);
    const signal = [];
    for (let j = 0; j < 2; j++) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 12, 10),
        new THREE.MeshBasicMaterial({ color: spec.color, depthTest: true, depthWrite: false })
      );
      utilityNetwork.add(dot);
      signal.push(dot);
    }
    utilityTelescopes.push({
      floorBelow,
      floorAbove,
      feed,
      rod,
      sleeve,
      signal,
      x: spec.x,
      z: spec.z,
    });
    utilityRouteMeshes.push({ mesh: rod, feed, floor: null, base: spec.color });
    return rod;
  }
  // Annex-to-building feeders are ground-referenced. Existing UPS/chillers retain their placement.
  utilityPath(
    utilityNetwork,
    [
      [-20.75, 2.76, -3.45],
      [-20.75, 2.76, -7.85],
      [-15.4, 2.9, -8.06],
      [-12.68, 3.02, -8.06],
    ],
    'pa',
    null,
    0.084
  );
  utilityPath(
    utilityNetwork,
    [
      [-18.2, 2.76, 0.25],
      [-17.9, 2.76, -7.25],
      [-15.7, 2.95, -8.54],
      [-13.08, 3.02, -8.54],
    ],
    'pb',
    null,
    0.084
  );
  utilityPath(
    utilityNetwork,
    [
      [16.24, 2.8, -5.44],
      [16.24, 2.8, -7.56],
      [14.1, 3.02, -8.06],
      [12.7, 3.02, -8.06],
    ],
    'cs',
    null,
    0.117
  );
  utilityPath(
    utilityNetwork,
    [
      [20.2, 2.7, 0.23],
      [20.65, 2.73, -7.0],
      [16.0, 2.96, -8.54],
      [13.1, 3.02, -8.54],
    ],
    'cr',
    null,
    0.117
  );
  // Four independently animated floor sections; feed-through collars move with their floor.
  const floorUtilityLocalY = 3.02;
  for (const key of floorList) {
    const f = floorGroups[key],
      first = Number(key[0]);
    for (const feed of Object.keys(FEED_CONFIG)) {
      const s = FEED_CONFIG[feed];
      const pier = new THREE.Group();
      pier.name = `${key} ${s.name} 인입 피팅`;
      f.add(pier);
      utilityFixtures.push({ object: pier, feed });
      utilityBracket(pier, s.x, floorUtilityLocalY, s.z, feed, 'y');
      const panelColor = s.kind === 'power' ? 0x31485c : 0x365b69;
      box(pier, 0.3, 0.25, 0.3, s.x, 2.96, s.z, mat(panelColor, 0.6, 0.35), { cast: false });
      if (feed === 'cs' || feed === 'cr') {
        const valve = new THREE.Mesh(
          new THREE.CylinderGeometry(0.17, 0.17, 0.07, 10),
          mat(s.color, 0.6, 0.35)
        );
        valve.rotation.z = Math.PI / 2;
        valve.position.set(s.x + 0.01, 3.19, s.z);
        pier.add(valve);
      }
    }
    // In-wall distribution remains local to the correct storey during explode animation.
    const powH = 3.07;
    for (const feed of ['pa', 'pb']) {
      const s = FEED_CONFIG[feed],
        offset = feed === 'pa' ? 0 : 0.29;
      const rear = -8.02 - offset;
      utilityPath(
        f,
        [
          [s.x, 3.02, s.z],
          [-11.3, powH, rear],
          [-10.78, powH, rear],
          [10.65, powH, rear],
        ],
        feed,
        key,
        0.055,
        false
      );
      // Metallic brackets every few meters and distinct A/B labels by the riser.
      for (let x = -9.3; x <= 9.2; x += 3.6) {
        const support = box(f, 0.11, 0.14, 0.26, x, powH + 0.09, rear, M.brushed, { cast: false });
        utilityFixtures.push({ object: support, feed });
      }
      const badge = textPlate(
        f,
        `${key}  ${feed === 'pa' ? 'PWR A' : 'PWR B'}`,
        -11.37,
        2.76,
        s.z + 0.2,
        1.6,
        0.2,
        '#c0eafa',
        '#203347'
      );
      badge.rotation.y = 0.18;
      utilityFixtures.push({ object: badge, feed });
    }
    // The server/GPU floors receive an A/B horizontal distribution tray above each rack row.
    if (key === '2F' || key === '3F') {
      const rows = key === '2F' ? [-4.2, 4.12] : [-4.15, 4.15];
      const xGroups =
        key === '2F'
          ? [
              [-10.05, -7.56, -5.07, -2.58],
              [2.6, 4.85, 7.1, 9.35],
            ]
          : [
              [-9.25, -6.75, -4.25],
              [3.65, 6.0],
            ];
      for (const feed of ['pa', 'pb']) {
        const adj = feed === 'pa' ? -0.1 : 0.11,
          deckZ = feed === 'pa' ? -8.02 : -8.31;
        for (const [i, xs] of xGroups.entries())
          for (const z of rows) {
            // Separate hall A/B power spines, not a diagonal wire passing through racks.
            const atX = i === 0 ? -10.75 : 10.54;
            utilityPath(
              f,
              [
                [atX, powH, deckZ],
                [atX, 3.14, z - 0.54 + adj],
                [xs[0] - 0.14, 3.14, z - 0.54 + adj],
                [xs[xs.length - 1] + 0.16, 3.14, z - 0.54 + adj],
              ],
              feed,
              key,
              0.046,
              true
            );
            for (const x of xs) {
              utilityPath(
                f,
                [
                  [x + 0.42, 3.14, z - 0.54 + adj],
                  [x + 0.42, 2.6, z - 0.54 + adj],
                  [x + 0.42, 2.52, z - 0.58],
                ],
                feed,
                key,
                0.025,
                false
              );
              utilityBracket(f, x + 0.42, 2.52, z - 0.58, feed, 'z');
            }
          }
      }
      // 3F cooling distribution to the CDU cabinet is handled below.
    } else if (key === '1F') {
      for (const [feed, z] of [
        ['pa', -5.85],
        ['pb', -2.72],
      ]) {
        const nearZ = feed === 'pa' ? -8.02 : -8.31;
        utilityPath(
          f,
          [
            [-10.85, 3.07, nearZ],
            [-10.92, 3.07, z - 0.62],
            [-2.05, 3.07, z - 0.62],
          ],
          feed,
          key,
          0.045,
          true
        );
        for (const x of [-9.5, -7.1, -4.7, -2.3])
          utilityPath(
            f,
            [
              [x, 3.07, z - 0.62],
              [x, 2.55, z - 0.62],
            ],
            feed,
            key,
            0.027,
            false
          );
      }
      // 1F maintained PDU at the right-hand service room.
      utilityPath(
        f,
        [
          [10.65, 3.07, -8.02],
          [10.67, 3.07, -5.82],
          [9.55, 2.78, -5.82],
        ],
        'pa',
        key,
        0.045,
        true
      );
    } else if (key === '4F') {
      // Compact feeds for NOC/SOC display walls and operator desks.
      for (const [feed, offset] of [
        ['pa', -0.17],
        ['pb', 0.17],
      ]) {
        utilityPath(
          f,
          [
            [-10.78, 3.08, -8.02],
            [-10.9, 3.1, -5.9 + offset],
            [-8.25, 3.1, -5.9 + offset],
            [-4.7, 3.1, -5.9 + offset],
          ],
          feed,
          key,
          0.041,
          true
        );
        utilityPath(
          f,
          [
            [10.65, 3.08, -8.31],
            [10.8, 3.1, -5.8 + offset],
            [8.1, 3.1, -5.8 + offset],
            [4.1, 3.1, -5.8 + offset],
          ],
          feed,
          key,
          0.041,
          true
        );
        for (const x of [-8.25, -4.7, 4.1, 8.1])
          utilityPath(
            f,
            [
              [x, 3.1, -5.8 + offset],
              [x, 2.4, -5.8 + offset],
            ],
            feed,
            key,
            0.022,
            false
          );
      }
    }
    // Cooling supply and return remain distinct, with floor-specific equipment endpoints.
    const coolY = 3.21;
    for (const feed of ['cs', 'cr']) {
      const s = FEED_CONFIG[feed],
        delta = feed === 'cs' ? -0.11 : 0.18;
      utilityPath(
        f,
        [
          [s.x, 3.02, s.z],
          [11.25, coolY, s.z],
          [11.25 + delta, coolY, -7.7],
        ],
        feed,
        key,
        0.077,
        true
      );
      if (key === '2F') {
        // 2F: independent chilled-water pairs to CRAC-01 and CRAC-02.
        for (const x of [-10.52, 10.54]) {
          const wallX = x < 0 ? -11.23 : 11.1 + delta;
          utilityPath(
            f,
            [
              [11.25 + delta, coolY, -7.7],
              [wallX, coolY, -7.7],
              [wallX, coolY, -0.35],
              [x, coolY, -0.35],
              [x, 2.7, -0.35],
            ],
            feed,
            key,
            0.066,
            true
          );
          utilityBracket(f, x, 2.7, -0.35, feed, 'y');
        }
      } else if (key === '3F') {
        // 3F: matched supply/return to the two real CDU cabinets.
        for (const z of [-4.1, 4.18]) {
          const edge = feed === 'cs' ? 10.72 : 11.2;
          utilityPath(
            f,
            [
              [11.25 + delta, coolY, -7.7],
              [edge, coolY, z - 0.64],
              [edge, 2.77, z - 0.64],
              [9.62, 2.74, z - 0.64],
            ],
            feed,
            key,
            0.066,
            true
          );
          utilityBracket(f, 9.62, 2.74, z - 0.64, feed, 'z');
        }
      } else if (key === '1F') {
        // 1F: cooling endpoints serve the MDF support and maintenance rooms.
        utilityPath(
          f,
          [
            [11.25 + delta, coolY, -7.7],
            [9.5, coolY, -8.25],
            [7.15, 2.88, -8.25],
          ],
          feed,
          key,
          0.057,
          true
        );
        utilityPath(
          f,
          [
            [11.25 + delta, coolY, -7.7],
            [-10.55, coolY, -8.25],
            [-10.55, 2.88, -6.8],
          ],
          feed,
          key,
          0.057,
          true
        );
      } else if (key === '4F') {
        // 4F: two side-wall terminal coils for the NOC and SOC; avoid monitor walls.
        utilityPath(
          f,
          [
            [11.25 + delta, coolY, -7.7],
            [10.85, coolY, 0.65],
            [10.78, 2.76, 1.64],
          ],
          feed,
          key,
          0.055,
          true
        );
        utilityPath(
          f,
          [
            [11.25 + delta, coolY, -7.7],
            [-11.12, coolY, -7.75],
            [-11.08, 2.76, 1.62],
          ],
          feed,
          key,
          0.055,
          true
        );
      }
    }
    // In-room cooling terminals are represented by compact grilles, not full new equipment assets.
    if (key === '1F' || key === '4F') {
      const terminalPositions =
        key === '1F'
          ? [
              [7.15, -8.35],
              [-10.55, -6.8],
            ]
          : [
              [10.82, 1.65],
              [-11.1, 1.65],
            ];
      for (const [x, z] of terminalPositions) {
        const terminal = new THREE.Group();
        terminal.name = `${key} 냉각 단말`;
        f.add(terminal);
        utilityFixtures.push({ object: terminal, feed: 'cs' });
        box(terminal, 0.72, 0.43, 0.37, x, 2.75, z, M.brushed, { cast: false });
        for (let j = 0; j < 5; j++)
          box(terminal, 0.6, 0.02, 0.03, x, 2.61 + j * 0.068, z + 0.19, M.cool, { cast: false });
      }
    }
  }
  // Extend four independent trunks from the actual per-floor attachment points.
  for (let i = 0; i < floorList.length - 1; i++) {
    for (const feed of ['pa', 'pb', 'cs', 'cr'])
      utilityVertical(floorList[i], floorList[i + 1], feed);
  }
  // V38: a selected floor is viewed without its lower storeys. Keep one physical
  // ground-to-selected-floor feeder per circuit so the utility line never looks broken.
  // These risers are NOT visible in the stacked / exploded building views: those
  // continue to use the original inter-floor telescopic sections above.
  const utilitySingleFloorRisers = [];
  for (const [feed, spec] of Object.entries(FEED_CONFIG)) {
    const radius = spec.kind === 'power' ? 0.084 : 0.12;
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 1, 12, 1, false),
      new THREE.MeshStandardMaterial({
        color: spec.color,
        metalness: 0.57,
        roughness: 0.33,
        emissive: spec.color,
        emissiveIntensity: 0.23,
      })
    );
    pipe.name = `상세층 직결 ${spec.name}`;
    pipe.scale.set(radius, 1, radius);
    pipe.position.set(spec.x, floorUtilityLocalY, spec.z);
    pipe.castShadow = false;
    pipe.receiveShadow = false;
    pipe.visible = false;
    utilityNetwork.add(pipe);
    const joints = [];
    for (let i = 0; i < 2; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 1.53, 0.031, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0x819aab, metalness: 0.78, roughness: 0.27 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(spec.x, floorUtilityLocalY, spec.z);
      ring.visible = false;
      utilityNetwork.add(ring);
      joints.push(ring);
    }
    const beads = [];
    for (let i = 0; i < 3; i++) {
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(spec.kind === 'power' ? 0.105 : 0.135, 10, 8),
        new THREE.MeshBasicMaterial({ color: spec.color, depthTest: true, depthWrite: false })
      );
      bead.visible = false;
      utilityNetwork.add(bead);
      beads.push(bead);
    }
    utilitySingleFloorRisers.push({ feed, spec, pipe, joints, beads });
  }
  // The collars stay attached to the respective floor; only the spans telescope.
  function updateUtilityRisers(t) {
    const powerMode = utilityEnabled.power,
      coolMode = utilityEnabled.coolant;
    const faultPowerA = activeIncidents.has('ups');
    const faultCool = activeIncidents.has('chiller');
    const faultCdu = activeIncidents.has('cdu');
    for (const section of utilityTelescopes) {
      const a = floorGroups[section.floorBelow].position.y + floorUtilityLocalY;
      const b = floorGroups[section.floorAbove].position.y + floorUtilityLocalY;
      const height = Math.max(0.02, b - a),
        middle = (a + b) * 0.5;
      section.rod.position.y = middle;
      section.rod.scale.y = height;
      section.sleeve.position.y = middle;
      section.sleeve.scale.y = Math.max(0.05, height * 0.46);
      section.sleeve.visible =
        section.feed === 'pa' || section.feed === 'pb' ? powerMode : coolMode;
      const kind = FEED_CONFIG[section.feed].kind;
      const selected = kind === 'power' ? powerMode : coolMode;
      const show = !activeFloor; // V38 uses a ground-to-selected-floor bypass when inspecting a single storey.
      section.rod.visible = show && selected;
      section.sleeve.visible = section.sleeve.visible && show;
      const failure =
        (section.feed === 'pa' && faultPowerA) || (section.feed === 'cs' && faultCool);
      for (let j = 0; j < section.signal.length; j++) {
        const dot = section.signal[j];
        dot.visible = show && selected;
        const progress = (t * (failure ? 0.09 : 0.22) + j * 0.5) % 1;
        dot.position.set(section.x, a + (b - a) * progress, section.z);
        dot.material.color.setHex(failure ? 0xff9d71 : FEED_CONFIG[section.feed].color);
      }
    }
    const visibleFeed = kind => (kind === 'power' ? powerMode : coolMode);
    // In a single-floor detail view the intermediate floors are hidden. Connect
    // the annex feeder at ground level directly to the *moving* selected storey.
    // 1F needs no vertical span because its feed and floor branch already meet.
    for (const link of utilitySingleFloorRisers) {
      const { feed, spec, pipe, joints, beads } = link;
      const bottom = floorUtilityLocalY;
      const top = activeFloor ? floorGroups[activeFloor].position.y + floorUtilityLocalY : bottom;
      const height = Math.max(0, top - bottom);
      const enabled = Boolean(activeFloor) && visibleFeed(spec.kind) && height > 0.08;
      const failure =
        (feed === 'pa' && faultPowerA) ||
        (feed === 'cs' && faultCool) ||
        (feed === 'cs' && activeFloor === '3F' && faultCdu);
      const displayColor = failure ? 0xff9d71 : spec.color;
      pipe.visible = enabled;
      pipe.position.y = (bottom + top) / 2;
      pipe.scale.y = Math.max(0.01, height);
      pipe.material.color.setHex(displayColor);
      pipe.material.emissive.setHex(displayColor);
      joints[0].visible = enabled;
      joints[1].visible = enabled;
      joints[0].position.y = bottom;
      joints[1].position.y = top;
      for (let i = 0; i < beads.length; i++) {
        const bead = beads[i];
        bead.visible = enabled;
        if (!enabled) continue;
        const progress = (t * (failure ? 0.07 : 0.21) + i / beads.length) % 1;
        bead.position.set(spec.x, bottom + height * progress, spec.z);
        bead.material.color.setHex(displayColor);
      }
    }
    for (const route of utilityRouteMeshes) {
      const kind = FEED_CONFIG[route.feed].kind,
        active = visibleFeed(kind);
      const failed =
        (route.feed === 'pa' && faultPowerA) ||
        (route.feed === 'cs' && faultCool) ||
        (route.feed === 'cs' && route.floor === '3F' && faultCdu);
      const material = route.mesh.material;
      material.color.setHex(failed && active ? 0xff9c67 : route.base);
      material.emissive.setHex(failed && active ? 0xff713f : route.base);
      material.emissiveIntensity = active ? 0.32 : 0.028;
      route.mesh.visible =
        active &&
        (!route.floor || !activeFloor || activeFloor === route.floor) &&
        (!utilityTelescopes.some(s => s.rod === route.mesh) || !activeFloor);
    }
    // Hanger frames, valve collars and distribution labels are part of the selected overlay.
    for (const item of utilityCouplings)
      item.mesh.visible = visibleFeed(FEED_CONFIG[item.feed].kind);
    for (const item of utilityFixtures)
      item.object.visible = visibleFeed(FEED_CONFIG[item.feed].kind);
    f3CoolingOverlay.visible = coolMode;
    // Smooth particles on floor-local routes; they stay exactly attached to the moving floor.
    for (const route of [...flows, ...coolantFlows]) {
      const kind = FEED_CONFIG[route.feed].kind;
      const active =
        visibleFeed(kind) && (!route.floor || !activeFloor || activeFloor === route.floor);
      route.dotParent.visible = active;
      if (!active) continue;
      const affected =
        (route.feed === 'pa' && faultPowerA) ||
        (route.feed === 'cs' && faultCool) ||
        (route.feed === 'cs' && route.floor === '3F' && faultCdu);
      for (let i = 0; i < route.beads.length; i++) {
        const pos = route.curve.getPoint(
          (t * (affected ? 0.055 : 0.15) + i / route.beads.length) % 1
        );
        route.beads[i].position.copy(pos);
        route.beads[i].material.color.setHex(affected ? 0xff9166 : FEED_CONFIG[route.feed].color);
      }
    }
  }
  // Old pre-V29 decorative particle groups stay hidden; only opt-in physical utility overlays render.
  powerFlow.visible = false;
  coolingFlow.visible = false;
  // Fixed labels for independent support buildings.
  labelAnchors.push(
    labelAnchor('power', '전력 설비동', 'UPS · BATTERY', [-18, 3.8, -1.5], 'power')
  );
  labelAnchors.push(
    labelAnchor('cooling', '냉각 설비동', 'CHILLER · PUMP', [18, 3.8, -4.5], 'cooling')
  );
  labelAnchors.push(
    labelAnchor(
      'noc',
      '4F · 통합 관제실',
      'NOC · SOC · 대응',
      () => new THREE.Vector3(0, f4.position.y + 3.95, -5.65),
      'noc',
      '4F'
    )
  );

  const initialRegistryCount = registry.size;
  // A monitor wall's mesh root is floor-centered; its visible body lives at a specific wall coordinate.
  function assetWorldPoint(asset) {
    asset.root.updateWorldMatrix(true, false);
    return asset.root.localToWorld(new THREE.Vector3(...(asset.markerLocal || [0, 0, 0])));
  }

  // Every scenario references asset IDs that actually exist in this scene.
  // A warning on another device represents a possible operational impact, not a confirmed second failure.
  const SCENARIO_BY_ID = new Map(SCENARIOS.map(s => [s.id, s]));
  for (const s of SCENARIOS) {
    if (!registry.has(s.asset)) console.warn('[KNU AIDC] 존재하지 않는 시나리오 주 설비', s.asset);
    for (const r of s.related)
      if (!registry.has(r.id)) console.warn('[KNU AIDC] 존재하지 않는 영향 설비', r.id);
  }
  const { getAssetIssues, severityRank, getAssetStatus, getSensor, statusHtml } =
    createIncidentSelectors({
      clock,
      activeIncidents,
      scenarioById: SCENARIO_BY_ID,
    });
  function writeEvent(message, kind = 'info') {
    eventLog.unshift({
      time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
      message,
      kind,
    });
    if (eventLog.length > 28) eventLog.length = 28;
  }
  const incidentSteps = ['감지', '확인', '원인 분석', '복구 조치', '정상 확인'];
  const incidentActions = ['경보 확인', '원인 분석 완료', '복구 조치 완료', '정상 확인 및 종료'];
  function setInspectorTab(tab) {
    inspectorTab = tab;
    $('#detail-view').hidden = tab !== 'asset';
    $('#scenario-view').hidden = tab !== 'scenario';
    $('.inspection-tip').hidden = tab !== 'asset';
    root.querySelectorAll('[data-inspector-tab]').forEach(b => {
      const active = b.dataset.inspectorTab === tab;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    });
    $('#v9-panel-details').open = true;
    $('#v9-detail-toggle').textContent =
      tab === 'scenario' ? '장애 시뮬레이션 접기' : '설비 상세 접기';
    if (tab === 'scenario') renderScenarioPanel();
    else updateInspector();
    requestAnimationFrame(() =>
      $('#v9-panel-details').scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    );
  }
  function runScenario(id) {
    const s = SCENARIO_BY_ID.get(id);
    if (!s) return;
    chosenScenarioId = id;
    selectedIncidentId = id;
    if (!activeIncidents.has(id)) {
      activeIncidents.set(id, { id, stage: 0, started: new Date() });
      writeEvent(`${s.title} · ${s.asset}에서 ${s.status} 발생`, 'danger');
      s.related.forEach(a => writeEvent(`${a.id} · ${a.why}`, 'warning'));
    } else writeEvent(`${s.title} · 이미 진행 중인 장애로 이동`);
    syncIncidentStore();
    refreshIncidents();
    if (s.mode === 'power' || s.mode === 'coolant' || s.mode === 'thermal') setMode(s.mode, true);
    focusAsset(s.asset);
    setInspectorTab('scenario');
  }
  function advanceIncident(id) {
    const item = activeIncidents.get(id);
    if (!item) return;
    const s = SCENARIO_BY_ID.get(id);
    if (item.stage >= 3) {
      activeIncidents.delete(id);
      writeEvent(`${s.title} · 정상 확인 완료, 장애 종료`, 'success');
      selectedIncidentId = activeIncidents.size ? [...activeIncidents.keys()][0] : null;
    } else {
      item.stage++;
      writeEvent(`${s.title} · ${incidentSteps[item.stage]} 단계 완료`, 'info');
    }
    syncIncidentStore();
    refreshIncidents();
  }
  function resetAllIncidents() {
    if (activeIncidents.size)
      writeEvent(`전체 시나리오 초기화 · ${activeIncidents.size}건 정리`, 'success');
    activeIncidents.clear();
    selectedIncidentId = null;
    syncIncidentStore();
    refreshIncidents();
    setMode('normal');
    setZone('overview');
  }
  function incidentCountForFloor(floor) {
    return [...activeIncidents.values()].filter(
      v => registry.get(SCENARIO_BY_ID.get(v.id).asset)?.floor === floor
    ).length;
  }
  function esc(s) {
    return String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  }
  function renderScenarioPanel() {
    const selected = SCENARIO_BY_ID.get(chosenScenarioId) || SCENARIOS[0],
      active = [...activeIncidents.values()];
    const caseInfo = activeIncidents.get(selected.id);
    const incidentList = active.length
      ? active
          .map(item => {
            const s = SCENARIO_BY_ID.get(item.id);
            return `<div class="active-case ${selectedIncidentId === item.id ? 'chosen' : ''}"><div><b>${esc(s.title)}</b><small>${esc(s.asset)} · ${incidentSteps[item.stage]} 진행</small></div><button data-case-focus="${s.id}">위치</button><button data-case-choose="${s.id}">상세</button></div>`;
          })
          .join('')
      : '<div class="scenario-empty">현재 진행 중인 장애가 없습니다. 아래 시나리오를 선택해 실행해보세요.</div>';
    $('#scenario-view').innerHTML = `
 <div class="scenario-topline"><span>INCIDENT SIMULATOR</span><strong>${active.length}건 진행 중</strong></div>
 <div class="scenario-section-title">진행 중인 장애</div><div class="active-cases">${incidentList}</div>
 <div class="scenario-section-title">장애 시나리오 선택 <small>8종</small></div>
 <div class="scenario-selector">${SCENARIOS.map(s => `<button data-scenario-id="${s.id}" class="scenario-choice ${selected.id === s.id ? 'chosen' : ''} ${activeIncidents.has(s.id) ? 'running' : ''}"><b>${esc(s.title)}</b><small>${esc(s.category)}</small></button>`).join('')}</div>
 <section class="scenario-detail"><div class="scenario-detail-top"><span class="scenario-category">${esc(selected.category)} / ${esc(selected.asset)}</span><span class="scenario-severity ${selected.level === '긴급' ? 'critical' : ''}">${selected.level}</span></div>
 <h3>${esc(selected.title)}</h3><p>${esc(selected.condition)}</p><div class="scenario-impact"><b>예상 영향</b><span>${esc(selected.impact)}</span></div>
 <div class="scenario-impact"><b>점검 방향</b><span>${esc(selected.cause)}</span></div>
 <div class="scenario-related"><b>연관 설비</b><span>${selected.related.length ? selected.related.map(r => `${esc(r.id)} · 영향 가능`).join(' / ') : '설비 외 서비스 영향 확인 필요'}</span></div>
 ${
   caseInfo
     ? `<div class="incident-progress"><div class="incident-step-head"><b>대응 프로세스</b><span>${caseInfo.stage + 1} / 5</span></div><div class="step-line">${incidentSteps.map((step, i) => `<span class="${i <= caseInfo.stage ? 'done' : ''}">${step}</span>`).join('')}</div><div class="scenario-checks">${selected.checks.map((v, i) => `<div><span>${i + 1}</span>${esc(v)}</div>`).join('')}</div><button class="scenario-primary" data-case-advance="${selected.id}">${incidentActions[caseInfo.stage]}</button></div>`
     : `<button class="scenario-primary" data-run-scenario="${selected.id}">이 장애 시나리오 실행</button>`
 }
 </section>
 <div class="scenario-section-title">관제 이벤트 이력 <small>모의 데이터</small></div><div class="event-history">${
   eventLog.length
     ? eventLog
         .slice(0, 10)
         .map(
           e =>
             `<div class="event-row ${e.kind}"><time>${esc(e.time)}</time><span>${esc(e.message)}</span></div>`
         )
         .join('')
     : '<div class="scenario-empty">발생한 이벤트가 없습니다.</div>'
 }</div>
 <div class="scenario-note">이 화면의 센서 값·장애·영향 분석·복구 단계는 모두 데모 시뮬레이션입니다. 실제 설비를 제어하거나 장애 원인을 자동 확정하지 않습니다.</div>`;
    $('#scenario-count').textContent = String(active.length);
  }

  function infoRow(a, b) {
    return `<div class="info-row"><span>${a}</span><strong>${b}</strong></div>`;
  }
  function roomList(floor) {
    return FLOOR_INFO[floor]?.spaces || [];
  }
  function assetInspector(asset) {
    if (asset.type === 'AI AGENT') {
      const agent = aiAgents.get(asset.id),
        busy = agentIsBusy(agent);
      return `<div class="section-overline">AI OPERATOR / ${esc(asset.id)}</div><h3 class="detail-title">${esc(asset.name)}</h3><p class="detail-summary">${esc(agent.intro)}</p>
  ${infoRow('담당 구역', esc(agent.area))}${infoRow('업무 상태', esc(agentWorkTitle(agent)))}${infoRow('관련 경보', agentRelatedIncidents(agent).length + '건')}
  <div class="section-label">에이전트 운영 <small>SIMULATION</small></div><button class="inspect-back" data-open-agent-modal="${asset.id}">AI 에이전트 상세 보기 →</button>`;
    }
    const state = getAssetStatus(asset),
      sensor = getSensor(asset),
      metric = clamp(asset.capacity ?? 68, 0, 100);
    const relatedIssues = getAssetIssues(asset.id);
    const primaryIncident = relatedIssues.find(issue => issue.primary);
    const specialMetrics = {
      gpu: [
        ['GPU 흡기 온도', `${sensor.temp.toFixed(1)} °C`],
        ['부하 상태', '임계치 초과'],
      ],
      server: [
        ['전원 모듈', '응답 없음'],
        ['호스트 상태', '서비스 확인'],
      ],
      network: [
        ['코어 업링크', 'LINK DOWN'],
        ['경로 상태', '우회 점검'],
      ],
      ups: [
        ['UPS 출력', 'A계통 이상'],
        ['이중화', 'UPS-02 정상'],
      ],
      cdu: [
        ['냉각수 유량', '41%'],
        ['2차 루프 압력', '저하'],
      ],
      chiller: [
        ['출수 온도', '15.4 °C'],
        ['예비 냉동기', 'CH-02 정상'],
      ],
      access: [
        ['비인가 시도', '1건 감지'],
        ['게이트 상태', '차단 유지'],
      ],
      noc: [
        ['영상 입력', '일부 중단'],
        ['대체 관제', 'NOC 콘솔 점검'],
      ],
    };
    const specialMarkup = primaryIncident
      ? `<div class="section-label">시나리오별 이상 지표 <small>모의 진단값</small></div><div class="scenario-metric-pair">${(specialMetrics[primaryIncident.scenario.id] || []).map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div><button class="inspect-back" data-open-scenario="${primaryIncident.scenario.id}">장애 대응 단계 보기 →</button>`
      : '';
    const works = relatedIssues.length
      ? relatedIssues.map(x => [
          x.primary ? x.scenario.title : x.reason,
          `${x.scenario.asset} · ${incidentSteps[x.incident.stage]} 단계 · ${x.primary ? '발생 설비' : '연관 설비'}`,
          severityRank(x.state) > 0 ? 'warning' : '',
        ])
      : [
          ['시설 상태 확인', '센서 범위 정상', ''],
          ['정기 점검', '예정된 작업 없음', ''],
        ];
    return `<div class="inspect-media"><span class="media-code">${asset.type.includes('GPU') ? 'GPU' : asset.type.includes('COOL') ? 'CDU' : 'DC'}</span><span class="media-text">KNU AIDC / ASSET INSPECTION</span></div>
 <button class="inspect-back" data-focus-zone="${asset.floor ? 'f' + asset.floor[0] : asset.zone}">← ${asset.floor ? asset.floor + ' 층별 정보' : '시설 정보'}로 돌아가기</button>
 <div class="section-overline">${asset.type} / ${asset.id}</div><h3 class="detail-title">${asset.name}</h3><p class="detail-summary">${asset.summary || ''}</p>${statusHtml(state)}
 <div class="section-label">장비 정보 <small>SIMULATION DATA</small></div>
 ${infoRow('자산 ID', asset.id)}${infoRow('설치 층', asset.floor || '별도 지원 시설')}${infoRow('설치 위치', asset.location)}${infoRow('운영 상태', state)}
 <div class="section-label">센서 모니터링 <small>모의 수치</small></div><div class="metric-grid">
 <div class="small-metric ${state === '장애' ? 'is-hot' : ''}"><span>장비 온도</span><strong>${sensor.temp.toFixed(1)}</strong><small>°C</small></div>
 <div class="small-metric"><span>소비 전력</span><strong>${sensor.power.toFixed(1)}</strong><small>kW</small></div></div>
 <div class="bar-card"><div class="bar-label"><span>가동률 / 부하 지표</span><b>${metric}%</b></div><div class="meter"><i style="width:${metric}%"></i></div></div>
 ${specialMarkup}
 <div class="section-label">최근 작업 및 이벤트</div>${works.map(([a, b, c]) => `<div class="work-item ${c}"><i class="work-bullet"></i><div><strong>${a}</strong><small>${b}</small></div></div>`).join('')}`;
  }
  function zoneInspector(zone) {
    const data = zones[zone];
    const all = [...registry.values()].filter(a => a.type !== 'AI AGENT');
    const ids = data.floor
      ? zone === 'f' + data.floor[0]
        ? all.filter(v => v.floor === data.floor)
        : all.filter(v => v.floor === data.floor && v.zone === zone)
      : all.filter(v => zone === 'overview' || (!v.floor && v.zone === zone));
    const problem = ids.filter(v => getAssetStatus(v) !== '정상').length;
    const faultCount =
      zone === 'overview' ? all.filter(v => getAssetStatus(v) !== '정상').length : problem;
    const activeHere = [...activeIncidents.values()]
      .map(v => SCENARIO_BY_ID.get(v.id))
      .filter(s => ids.some(a => a.id === s.asset));
    const statuses = activeHere.length
      ? activeHere.map(s => `${s.title} · ${s.asset} 확인 필요`)
      : faultCount
        ? ['연관 설비 상태 확인 필요']
        : ['시설 상태 모니터링 정상', '예정된 점검 작업 없음'];
    const floorMarkup =
      zone === 'overview'
        ? `<div class="section-label">메인 데이터센터 <small>4개 층</small></div><div class="quick-rooms">${floorList.map(key => `<button class="room-btn" data-focus-zone="f${key[0]}"><strong>${key} · ${FLOOR_INFO[key].name}</strong><small>${FLOOR_INFO[key].sub}</small></button>`).join('')}</div>`
        : data.floor
          ? `<div class="section-label">${data.floor} 내부 구역 <small>SPACE ZONING</small></div><div class="room-list">${roomList(
              data.floor
            )
              .map(
                (name, i) =>
                  `<div><span>${String(i + 1).padStart(2, '0')}</span><strong>${name}</strong></div>`
              )
              .join('')}</div>`
          : '';
    const cctv = ids.filter(a => a.type === 'CCTV CAMERA');
    const cctvMarkup =
      (data.floor || zone === 'power' || zone === 'cooling') && cctv.length
        ? `<div class="section-label">보안 CCTV <small>${cctv.length}대 · 클릭해서 위치로 이동</small></div><div class="asset-pick-list">${cctv.map(a => `<button data-focus-id="${a.id}"><span class="asset-indicator"></span><span><strong>${a.name}</strong><small>${a.location}</small></span><b>↗</b></button>`).join('')}</div>`
        : '';
    const assetMarkup = ids.length
      ? `<div class="section-label">주요 설비 <small>${ids.length}개 / 클릭하여 이동</small></div><div class="asset-pick-list">${ids
          .slice()
          .sort((a, b) => severityRank(getAssetStatus(b)) - severityRank(getAssetStatus(a)))
          .slice(0, 12)
          .map(
            a =>
              `<button data-focus-id="${a.id}"><span class="asset-indicator ${getAssetStatus(a) !== '정상' ? 'fault' : ''}"></span><span><strong>${a.name}</strong><small>${a.floor ? `${a.floor} · ` : ''}${a.id}</small></span><b>↗</b></button>`
          )
          .join('')}</div>`
      : '';
    return `<div class="inspect-media"><span class="media-code">${data.code}</span><span class="media-text">KNU AIDC / DIGITAL TWIN V40</span></div>
 <div class="section-overline">${data.code} / ${data.level}</div><h3 class="detail-title">${data.name}</h3><p class="detail-summary">${data.desc}</p>${statusHtml(faultCount ? (ids.some(a => severityRank(getAssetStatus(a)) === 3) ? '장애' : '주의') : '정상')}
 <div class="section-label">시설 정보 <small>OVERVIEW</small></div>${infoRow('구역', data.level)}${infoRow('등록된 설비', `${ids.length}개`)}${infoRow('주의 / 장애', `${faultCount}건`)}
 ${floorMarkup}
 ${data.floor ? '<div class="section-label">공간 구획 <small>출입구 · 파티션 · 설비 배치</small></div><p class="detail-summary">' + ({ '1F': '보안·반입·예비품 분리 / 후면 MDF·유지보수 출입구', '2F': '서버홀 A/B 차폐 / 전면 점검 공간과 출입 갤러리', '3F': '공랭·액체냉각·CDU 3구역 / 별도 CDU 출입구', '4F': 'NOC·SOC 방음 구획 / 중앙 복도와 독립 지원실' }[data.floor] || '층별 출입구와 설비 구획') + '</p>' : ''}
 ${zone === 'f4' ? '<button class="inspect-back" data-focus-zone="noc">4F 통합 관제실 상세 보기 →</button>' : ''}
 <div class="section-label">운영 지표 <small>모의 수치</small></div><div class="metric-grid">
 <div class="small-metric"><span>평균 온도</span><strong>${(data.temp + (data.floor === '3F' && incidentCountForFloor('3F') ? 1.8 : 0)).toFixed(1)}</strong><small>°C</small></div>
 <div class="small-metric"><span>참고 부하</span><strong>${data.power.toFixed(1)}</strong><small>kW</small></div></div>
 ${cctvMarkup}
 ${assetMarkup}
 <div class="section-label">진행 중 업무</div>${statuses.map((x, i) => `<div class="work-item ${faultCount && i === 0 ? 'warning' : ''}"><i class="work-bullet"></i><div><strong>${x}</strong><small>${faultCount && i === 0 ? '이상 이벤트 · 확인 필요' : '시설 운영 · 모의 데이터'}</small></div></div>`).join('')}`;
  }

  // V28 — interactive rack device modal with a separate, orbitable render of the REAL device geometry.
  let modalPreviewRenderer = null,
    modalPreviewScene = null,
    modalPreviewCamera = null;
  let modalPreviewControls = null,
    modalPreviewMount = null;
  let modalPreviewDoor = null,
    modalPreviewDrawers = [];
  let modalPreviewHumanMixer = null;
  // Locate the counterpart of a source component inside a deep-cloned equipment tree.
  function mirrorPreviewNode(sourceNode, sourceRoot, clonedRoot) {
    const path = [];
    let node = sourceNode;
    while (node && node !== sourceRoot) {
      if (!node.parent) return null;
      const index = node.parent.children.indexOf(node);
      if (index < 0) return null;
      path.push(index);
      node = node.parent;
    }
    if (node !== sourceRoot) return null;
    return path.reverse().reduce((current, index) => current?.children[index] || null, clonedRoot);
  }
  // Physical sequence: open the door before extending the drawer; retract the
  // drawer before closing the door. Used by BOTH the main scene and the modal.
  function animateRackMechanism(hinge, drawerGroups, open, dt) {
    if (!hinge) return;
    const safeDt = Math.min(Math.max(dt || 0, 0), 0.05);
    const hasExtendedDrawer = drawerGroups.some(group => group.position.z > 0.035);
    const doorTarget = open || hasExtendedDrawer ? -(Math.PI * 0.62) : 0;
    hinge.rotation.y = THREE.MathUtils.damp(hinge.rotation.y, doorTarget, 8, safeDt);
    const mayExtend = open && Math.abs(hinge.rotation.y) > 1.03;
    const drawerTarget = mayExtend ? 0.65 : 0;
    for (const group of drawerGroups) {
      group.position.z = THREE.MathUtils.damp(group.position.z, drawerTarget, 7.5, safeDt);
    }
  }
  function ensureModalPreview() {
    if (modalPreviewRenderer) return;
    const canvas = $('#asset-preview-canvas');
    modalPreviewRenderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    modalPreviewRenderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
    modalPreviewRenderer.setClearColor(0x000000, 0);
    modalPreviewRenderer.outputColorSpace = THREE.SRGBColorSpace;
    modalPreviewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    modalPreviewRenderer.toneMappingExposure = 1.65;
    modalPreviewScene = new THREE.Scene();
    modalPreviewScene.add(new THREE.HemisphereLight(0xdbeeff, 0x15253e, 3.0));
    const key = new THREE.DirectionalLight(0xe4f5ff, 3.0);
    key.position.set(5, 9, 12);
    modalPreviewScene.add(key);
    const edge = new THREE.DirectionalLight(0x49b8ff, 2.4);
    edge.position.set(-8, 5, -9);
    modalPreviewScene.add(edge);
    modalPreviewCamera = new THREE.PerspectiveCamera(36, 1, 0.04, 250);
    modalPreviewControls = new OrbitControls(modalPreviewCamera, canvas);
    modalPreviewControls.enableDamping = true;
    modalPreviewControls.dampingFactor = 0.09;
    modalPreviewControls.enablePan = false;
    modalPreviewControls.minPolarAngle = 0.1;
    modalPreviewControls.maxPolarAngle = Math.PI * 0.83;
    modalPreviewMount = new THREE.Group();
    modalPreviewScene.add(modalPreviewMount);
  }
  function mountAssetPreview(asset) {
    ensureModalPreview();
    modalPreviewMount.clear();
    modalPreviewDoor = null;
    modalPreviewDrawers = [];
    modalPreviewHumanMixer = null;
    // Clone only this asset's model — NOT the floor, partitions or all other racks.
    const isRealHuman = asset.type === 'AI AGENT' && aiAgents.get(asset.id)?.realLoaded;
    // Keep the preview empty for roles without an approved model. In particular,
    // do not manufacture a procedural placeholder in the detail modal.
    if (asset.type === 'AI AGENT' && !isRealHuman) {
      resizeAssetPreview();
      return;
    }
    const device = isRealHuman ? cloneSkinnedModel(asset.root) : asset.root.clone(true);
    // Engineering details are distance-culled in the main scene. The close-up modal
    // must show them even when the source is far from the main camera.
    device.traverse(part => {
      if (part.name?.startsWith('internal-machinery:')) part.visible = true;
    });
    modalPreviewMount.add(device);
    const bounds = new THREE.Box3().setFromObject(device, true);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    // Recenter the equipment in its own inspection frame.
    device.position.sub(center);
    const dimension = Math.max(size.x, size.y, size.z, 0.9);
    const radius = Math.max(size.x, size.z, 1.1) * 0.78;
    const deck = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 1.12, 0.1, 72),
      new THREE.MeshStandardMaterial({
        color: 0x173b65,
        metalness: 0.45,
        roughness: 0.43,
        emissive: 0x123d77,
        emissiveIntensity: 0.13,
      })
    );
    if (!isRealHuman) {
      deck.position.y = -size.y / 2 - 0.12;
      modalPreviewMount.add(deck);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.93, 0.018, 5, 80),
        new THREE.MeshBasicMaterial({ color: 0x5bbcf7, transparent: true, opacity: 0.7 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = deck.position.y + 0.068;
      modalPreviewMount.add(ring);
    }
    if (isRealHuman) {
      const agent = aiAgents.get(asset.id);
      const previewHuman = device.getObjectByName('agent-human-model');
      const model = previewHuman?.children[0];
      const idle =
        agent.realClips?.find(c => /idle|stand|rest/i.test(c.name)) || agent.realClips?.[0];
      if (model && idle) {
        modalPreviewHumanMixer = new THREE.AnimationMixer(model);
        modalPreviewHumanMixer.clipAction(idle).play();
      }
    }
    const camDistance = dimension * 2.0 + 1.5;
    modalPreviewCamera.position.set(camDistance * 0.5, camDistance * 0.48, camDistance * 0.85);
    modalPreviewCamera.near = Math.max(0.015, camDistance / 1000);
    modalPreviewCamera.far = camDistance * 15;
    modalPreviewCamera.updateProjectionMatrix();
    modalPreviewControls.target.set(0, 0, 0);
    modalPreviewControls.minDistance = dimension * 0.7 + 1;
    modalPreviewControls.maxDistance = dimension * 6 + 10;
    modalPreviewControls.update();
    const door = doors.find(d => d.id === asset.id);
    if (door) {
      // The preview is a deep clone, so synchronize BOTH moving assemblies through
      // the same child-index path. Unlike matching names, this also works for sub-groups.
      modalPreviewDoor = mirrorPreviewNode(door.hinge, asset.root, device);
      modalPreviewDrawers = engineeringDrawers
        .filter(entry => entry.id === asset.id)
        .map(entry => mirrorPreviewNode(entry.group, asset.root, device))
        .filter(Boolean);
      if (modalPreviewDoor) modalPreviewDoor.rotation.y = door.hinge.rotation.y;
    }
    resizeAssetPreview();
  }
  function resizeAssetPreview() {
    if (!modalPreviewRenderer || !assetModalId) return;
    const stage = $('#asset-modal-stage');
    const w = stage.clientWidth,
      h = stage.clientHeight;
    if (w <= 0 || h <= 0) return;
    modalPreviewRenderer.setSize(w, h, false);
    modalPreviewCamera.aspect = w / h;
    modalPreviewCamera.updateProjectionMatrix();
  }
  function assetTrendSVG(asset, kind) {
    const sensor = getSensor(asset);
    const isTemp = kind === 'temp';
    const base = isTemp ? sensor.temp : sensor.power;
    const seed = [...asset.id].reduce((n, ch) => n + ch.charCodeAt(0), 0);
    const amp = isTemp ? Math.max(0.28, base * 0.013) : Math.max(0.07, base * 0.04);
    const values = Array.from({ length: 17 }, (_, i) =>
      Math.max(
        0,
        base +
          Math.sin(i * 0.57 + seed * 0.31) * amp * 0.64 +
          Math.sin(i * 0.23 + seed) * amp * 0.35 +
          (i - 16) * amp * 0.012
      )
    );
    values[16] = base;
    let lower = Math.min(...values) - amp * 0.8,
      upper = Math.max(...values) + amp * 0.8;
    if (upper <= lower) upper = lower + 1;
    const scaleY = v => 13 + ((upper - v) / (upper - lower)) * 129;
    const points = values.map((v, i) => `${(28 + i * 19.0).toFixed(1)},${scaleY(v).toFixed(1)}`);
    const color = isTemp ? '#79d6fb' : '#6ce0c2';
    const guid = isTemp ? 'assetChartTemp' : 'assetChartPower';
    const textValue = v => v.toFixed(1);
    return `<defs><linearGradient id="${guid}Fill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${color}" stop-opacity=".30"/><stop offset="1" stop-color="${color}" stop-opacity=".01"/></linearGradient></defs>
 <g>${[16, 55, 95, 135].map(y => `<path class="chart-grid" d="M28 ${y} H339"/>`).join('')}${[28, 104, 180, 256, 332].map(x => `<path class="chart-grid" d="M${x} 9 V144"/>`).join('')}</g>
 <path d="M${points.join(' L')} L332 143 L28 143Z" fill="url(#${guid}Fill)"/><polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round"/><circle cx="332" cy="${scaleY(base).toFixed(1)}" r="3.4" fill="#ecfaff" stroke="${color}" stroke-width="1.5"/>
 <text x="3" y="18">${textValue(upper)}</text><text x="3" y="137">${textValue(lower)}</text><text x="27" y="164">−60m</text><text x="173" y="164">−30m</text><text x="310" y="164">NOW</text>`;
  }
  function updateAssetModal() {
    if (!assetModalId) return;
    const asset = registry.get(assetModalId);
    if (!asset) return;
    const isAgent = asset.type === 'AI AGENT';
    $('#agent-modal-report').hidden = !isAgent;
    $('#equipment-modal-report').hidden = isAgent;
    $('.asset-modal-sub').textContent = isAgent
      ? 'KNU AIDC / AI OPERATOR · SIMULATION'
      : 'KNU AIDC / EQUIPMENT INSPECTION · SIMULATION';
    if (isAgent) {
      updateAgentModal(asset);
      return;
    }
    const sensor = getSensor(asset),
      status = getAssetStatus(asset);
    const issues = getAssetIssues(asset.id),
      util = clamp(asset.capacity ?? 68, 0, 100);
    $('#asset-modal-title').textContent =
      `${asset.floor ? asset.floor + ' · ' : ''}${asset.name} / ${asset.id}`;
    $('#asset-modal-device-id').textContent = asset.id + ' · ' + asset.type;
    $('#asset-modal-name').textContent = asset.name;
    $('#asset-modal-summary').textContent =
      asset.summary || '선택 설비의 상태와 시뮬레이션 지표를 표시합니다.';
    $('#asset-modal-location').textContent = asset.location || 'KNU AIDC';
    $('#asset-modal-type').textContent = asset.type;
    const state = $('#asset-modal-status');
    state.textContent =
      status === '정상'
        ? 'NORMAL'
        : status === '주의'
          ? 'WARNING'
          : status === '보안 경보'
            ? 'SECURITY ALERT'
            : 'ALARM';
    state.classList.toggle('is-warning', status === '주의');
    state.classList.toggle('is-critical', severityRank(status) >= 3);
    $('#asset-modal-state').textContent = status;
    $('#asset-modal-temp').innerHTML = `${sensor.temp.toFixed(1)}<small>°C</small>`;
    $('#asset-modal-power').innerHTML = `${sensor.power.toFixed(1)}<small>kW</small>`;
    $('#asset-modal-util').innerHTML = `${util.toFixed(0)}<small>%</small>`;
    $('#asset-modal-util-bar').style.width = util + '%';
    $('#asset-modal-temp-chart').innerHTML = assetTrendSVG(asset, 'temp');
    $('#asset-modal-power-chart').innerHTML = assetTrendSVG(asset, 'power');
    const events = issues.length
      ? issues.map(issue => [
          issue.primary ? issue.scenario.title : issue.reason,
          issue.primary
            ? '발생 설비 · ' + incidentSteps[issue.incident.stage]
            : '연관 설비 · ' + issue.state,
        ])
      : [
          ['시설 상태 확인', '모의 센서 범위 정상'],
          ['정기 점검', '예정된 점검 작업 없음'],
        ];
    $('#asset-modal-events').innerHTML = events
      .map(
        ([title, value]) =>
          `<div class="asset-modal-note-row"><span>${esc(title)}</span><b>${esc(value)}</b></div>`
      )
      .join('');
    const door = doors.find(d => d.id === asset.id);
    const doorButton = $('#asset-modal-door');
    doorButton.hidden = !door;
    if (door) {
      doorButton.textContent = door.open ? '도어·서비스 서랍 닫기' : '도어·서비스 서랍 열기';
      doorButton.setAttribute('aria-pressed', String(door.open));
      $('#asset-modal-view-note').textContent =
        '드래그: 회전 · 휠: 확대 · 더블클릭: 도어·서랍 ' + (door.open ? '닫기' : '열기');
    } else {
      doorButton.removeAttribute('aria-pressed');
      const modalAgent = asset.type === 'AI AGENT' ? aiAgents.get(asset.id) : null;
      $('#asset-modal-view-note').textContent =
        asset.type === 'AI AGENT'
          ? modalAgent?.realLoaded
            ? '실사형 3D 인체 · 드래그 회전 · 휠 확대'
            : modalAgent?.realExpected
              ? 'AI 운영요원 모델 로딩 중 · 완료 전에는 인체 미표시'
              : '현장 AI 역할 · 3D 인체 모델 미사용'
          : '드래그로 회전 · 휠로 확대';
    }
  }
  function openAssetModal(id) {
    const asset = registry.get(id);
    if (!asset) return;
    if (assetModalId === id && !$('#asset-modal').hidden) return;
    assetModalId = id;
    $('#asset-modal').hidden = false;
    updateAssetModal();
    try {
      mountAssetPreview(asset);
    } catch (err) {
      console.warn('[KNU AIDC] 별도 3D 미리보기 생성 실패', err);
      $('#asset-modal-view-note').textContent = '3D 미리보기를 사용할 수 없습니다.';
    }
    $('#asset-modal-close')?.focus();
  }
  function closeAssetModal() {
    if (!assetModalId) return;
    assetModalId = null;
    $('#asset-modal').hidden = true;
    if (modalPreviewMount) modalPreviewMount.clear();
    modalPreviewHumanMixer = null;
    modalPreviewDoor = null;
    modalPreviewDrawers = [];
    $('#open-asset-modal')?.focus({ preventScroll: true });
  }
  function renderAssetPreview(dt) {
    if (!assetModalId || !modalPreviewRenderer) return;
    const a = registry.get(assetModalId);
    const d = a ? doors.find(x => x.id === a.id) : null;
    if (a?.type === 'AI AGENT' && modalPreviewMount?.children.length) {
      const agent = aiAgents.get(a.id),
        clone = modalPreviewMount.children[0];
      if (modalPreviewHumanMixer) modalPreviewHumanMixer.update(Math.min(0.06, dt || 0));
      else if (agent && clone)
        animateOperatorRig(clone, agent, clock.elapsedTime, agentIsBusy(agent));
    }
    if (modalPreviewDoor && d)
      animateRackMechanism(modalPreviewDoor, modalPreviewDrawers, d.open, dt);
    modalPreviewControls.update();
    modalPreviewRenderer.render(modalPreviewScene, modalPreviewCamera);
  }
  $('#asset-modal').addEventListener('click', e => {
    if (e.target.closest('[data-asset-modal-close]')) closeAssetModal();
  });
  function toggleModalRack() {
    if (!assetModalId) return;
    if (!doors.some(d => d.id === assetModalId)) return;
    toggleDoor(assetModalId);
    updateAssetModal();
  }
  // A double-click on the orbitable 3D model restores the original rack interaction.
  // This is deliberately separate from the main-scene double-click that opens the modal.
  $('#asset-preview-canvas').addEventListener('dblclick', e => {
    e.preventDefault();
    e.stopPropagation();
    toggleModalRack();
  });
  $('#asset-preview-canvas').addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && doors.some(d => d.id === assetModalId)) {
      e.preventDefault();
      toggleModalRack();
    }
  });
  $('#asset-modal-door').addEventListener('click', toggleModalRack);
  $('#open-asset-modal').addEventListener('click', () => {
    if (selectedId) openAssetModal(selectedId);
  });
  window.addEventListener('resize', resizeAssetPreview);

  function updateInspector() {
    const asset = selectedId ? registry.get(selectedId) : null;
    $('#detail-view').innerHTML = asset ? assetInspector(asset) : zoneInspector(activeZone);
    updateAIDCPanel();
  }
  function updateSummary() {
    const values = [...registry.values()].filter(a => a.type !== 'AI AGENT');
    const errors = values.filter(x => getAssetStatus(x) !== '정상').length;
    $('#stat-assets').textContent = String(values.length).padStart(2, '0');
    $('#stat-healthy').textContent = String(values.length - errors).padStart(2, '0');
    $('#stat-alerts').textContent = String(errors).padStart(2, '0');
    $('#scenario-count').textContent = String(activeIncidents.size);
    updateAIDCPanel();
  }
  function animateCamera(position, target, duration = 900) {
    focusTween = {
      fromPos: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPos: new THREE.Vector3(...position),
      toTarget: new THREE.Vector3(...target),
      started: performance.now(),
      duration,
    };
  }
  // V21: fixed two-side section for single-floor inspection (not camera-dependent).
  // +Z is the front façade; +X is the right façade from the default isometric view.
  // Rear/left walls, room partitions and all doors remain visible from every camera angle.
  function updateDetailCutaway() {
    for (const floor of floorList) {
      const shell = detailShells[floor];
      const inspectingThisFloor = activeFloor === floor;
      shell.ceiling.visible = !inspectingThisFloor; // roof-height lighting, trays, decorative rails
      shell.front.visible = !inspectingThisFloor; // front (+Z) outer façade
      shell.right.visible = !inspectingThisFloor; // right (+X) outer façade
      shell.back.visible = true; // retain rear (-Z) wall
      shell.left.visible = true; // retain left (-X) wall
    }
    // Keep interior zoning visible, except the front access-gallery partitions on 2F/3F.
    // Those front partitions sit on the positive-Z edge and should also disappear in floor detail.
    for (const part of detailPartitionParts) {
      const hideFrontPartition =
        activeFloor &&
        (activeFloor === '2F' || activeFloor === '3F') &&
        part.floor === activeFloor &&
        part.z > 7.0;
      part.group.visible = !hideFrontPartition;
    }
  }
  function updateFloorLayout() {
    const spacing = FLOOR_SPACING[splitLevel];
    for (const key of floorList) {
      floorGroups[key].visible = !activeFloor || activeFloor === key;
      // 1F remains anchored. Each storey gains an additional vertical gap.
      floorTargets[key] = FLOOR_Y[key] + (!activeFloor ? (Number(key[0]) - 1) * spacing : 0);
    }
    document
      .querySelectorAll('[data-floor]')
      .forEach(btn => btn.classList.toggle('active', btn.dataset.floor === (activeFloor || 'all')));
    const splitNames = ['쌓아 보기', '분리 1단계', '분리 2단계'];
    $('#floor-state').textContent = activeFloor
      ? `${activeFloor} 단독 보기`
      : splitNames[splitLevel];
    root.querySelectorAll('[data-split-level]').forEach(btn => {
      const isSelected = !activeFloor && Number(btn.dataset.splitLevel) === splitLevel;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-pressed', String(isSelected));
      // Available from a floor-detail view as well: the click handler returns to the full building.
    });
    const descriptions = [
      '본관 4개 층을 원래 위치에 쌓아 표시합니다.',
      '층 사이를 기본 간격으로 분리해 내부 배치를 봅니다.',
      '층 사이 간격을 더 넓히고 전체가 보이도록 시야를 확장합니다.',
    ];
    $('#floor-separation-hint').textContent = activeFloor
      ? `${activeFloor} 단독 보기 중 · 전체 시설 선택 시 분리 설정 적용`
      : descriptions[splitLevel];

    // Keep fog disabled at every separation level. Fine detail visibility is distance-based.
    updateDetailCutaway();
    updateDistanceDetails();
    updateLabels();
  }
  function moveTo(zone) {
    const z = zone === 'overview' ? OVERVIEW_CAMERAS[splitLevel] : zones[zone];
    animateCamera(z.position, z.target, zone === 'overview' && splitLevel === 2 ? 1100 : 900);
  }
  function setSplitLevel(nextLevel) {
    if (activeFloor) return;
    const level = clamp(Math.trunc(nextLevel), 0, 2);
    if (activeZone !== 'overview' || selectedId) setZone('overview', null, false);
    twinActions.setSplitLevel(level);
  }
  function setZone(zone, assetId = null, move = true) {
    if (!zones[zone]) return;
    activeZone = zone;
    selectedId = assetId;
    const asset = assetId ? registry.get(assetId) : null;
    activeFloor = asset?.floor || zones[zone].floor || null;
    zoneButtons.forEach(b => {
      const isActive = activeFloor
        ? b.dataset.zone === 'f' + activeFloor[0]
        : b.dataset.zone === zone;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', String(isActive));
    });
    $('#view-title').textContent = asset
      ? `${asset.floor ? asset.floor + ' · ' : ''}${asset.name}`
      : zones[zone].title;
    $('#crumb-current').textContent = asset
      ? (asset.floor ? asset.floor + ' / ' : '') + asset.id
      : zones[zone].name || zones[zone].title;
    $('#view-subtitle').textContent = asset
      ? asset.floor
        ? FLOOR_INFO[asset.floor].sub
        : zones[zone].sub
      : zones[zone].sub;
    twinActions.setNavigation({ activeZone, activeFloor, selectedId });
    twinActions.setAutoRotate(false);
    updateFloorLayout();
    if (move) moveTo(zone);
    updateInspector();
    updateAgentShortcuts();
  }
  function syncModeControls() {
    const power = utilityEnabled.power,
      cooling = utilityEnabled.coolant;
    modeButtons.forEach(b => {
      const name = b.dataset.mode;
      const active =
        name === 'normal'
          ? currentMode === 'normal' && !power && !cooling
          : name === 'thermal'
            ? currentMode === 'thermal'
            : name === 'power'
              ? power
              : cooling;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
      if (name === 'power' || name === 'coolant')
        b.textContent = `${name === 'power' ? '전력' : '냉각'} ${active ? 'ON' : 'OFF'}`;
    });
    const overlays = [power ? '전력(노란색) ON' : null, cooling ? '냉각(하늘색) ON' : null].filter(
      Boolean
    );
    $('#mode-hint').textContent =
      currentMode === 'thermal'
        ? '온도 분포 · 과열 설비 강조'
        : overlays.length
          ? overlays.join(' · ') + ' · 다시 누르면 OFF · 층 분리 시 자동 연결'
          : '전력·냉각 OFF · 버튼을 눌러 계통 표시 · 설비 클릭: 선택/상세';
    for (const d of heatDisks) {
      const a = registry.get(d.entityId),
        t = getSensor(a).temp;
      d.mesh.material.color.setHex(t > 31 ? 0xff5558 : t > 25 ? 0xf3b569 : 0x58d2c7);
      d.mesh.material.opacity =
        currentMode === 'thermal' ? (t > 31 ? 0.55 : t > 25 ? 0.31 : 0.19) : 0;
      d.mesh.visible = currentMode === 'thermal';
    }
    updateUtilityRisers(clock.elapsedTime); // Hide all unused physical routes immediately.
  }
  function setMode(mode, forceOn = false) {
    twinActions.selectVisualization(mode, forceOn);
  }

  const unsubscribeTwinStore = digitalTwinStore.subscribe((state, previous) => {
    if (state.splitLevel !== previous.splitLevel) {
      splitLevel = state.splitLevel;
      // Utility risers telescope between live floor heights, so keep active layers connected.
      updateFloorLayout();
      moveTo('overview');
    }
    if (state.viewMode !== previous.viewMode || state.utilities !== previous.utilities) {
      currentMode = state.viewMode;
      utilityEnabled.power = state.utilities.power;
      utilityEnabled.coolant = state.utilities.coolant;
      syncModeControls();
    }
    if (state.agentsVisible !== previous.agentsVisible) applyAgentVisibility(state.agentsVisible);
    if (state.autoRotate !== previous.autoRotate) {
      autoRotate = state.autoRotate;
      controls.autoRotate = autoRotate;
      $('#btn-auto').classList.toggle('is-on', autoRotate);
    }
    if (state.highQuality !== previous.highQuality) {
      highQuality = state.highQuality;
      applyRenderQuality();
      updateDistanceDetails();
    }
  });
  function toggleDoor(id) {
    const door = doors.find(d => d.id === id);
    if (door) door.open = !door.open;
  }
  // V6 three-layer alert UI: physical device beacon, constant-size screen label, floor edge.
  const floorAlertOutlines = new Map();
  for (const key of floorList) {
    const pts = [
      [-12.0, 3.52, -9.4],
      [12.0, 3.52, -9.4],
      [12.0, 3.52, 9.3],
      [-12.0, 3.52, 9.3],
      [-12.0, 3.52, -9.4],
    ].map(p => new THREE.Vector3(...p));
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const strip = new THREE.Line(
      geom,
      new THREE.LineBasicMaterial({
        color: 0xff697b,
        transparent: true,
        opacity: 0.85,
        depthTest: true,
        depthWrite: false,
      })
    );
    strip.visible = false;
    strip.renderOrder = 0;
    floorGroups[key].add(strip);
    floorAlertOutlines.set(key, strip);
  }
  function renderIncidentOverlay() {
    const incidents = [...activeIncidents.values()];
    const overlay = $('#incident-overlay');
    if (!incidents.length) {
      overlay.innerHTML =
        '<div class="overlay-healthy"><i></i> 현재 발생한 장애 없음 <small>모의 관제</small></div>';
      overlay.classList.remove('has-incidents');
    } else {
      overlay.classList.add('has-incidents');
      overlay.innerHTML = `<div class="overlay-title"><span>진행 중 장애</span><b>${incidents.length}건</b></div>${incidents
        .slice(0, 4)
        .map(v => {
          const s = SCENARIO_BY_ID.get(v.id);
          return `<button data-overlay-focus="${s.id}"><i></i><span><strong>${esc(s.title)}</strong><small>${esc(s.asset)} · ${incidentSteps[v.stage]}</small></span><b>위치</b></button>`;
        })
        .join(
          ''
        )}${incidents.length > 4 ? `<button data-overlay-all="true" class="overlay-more">나머지 ${incidents.length - 4}건 보기</button>` : ''}`;
    }
    root.querySelectorAll('.zone-nav [data-zone]').forEach(b => {
      const key = b.dataset.zone;
      const count = key.startsWith('f')
        ? incidentCountForFloor(key.slice(1) + 'F')
        : incidents.filter(v => SCENARIO_BY_ID.get(v.id).zone === key).length;
      let tag = b.querySelector('.zone-issue-num');
      if (count) {
        if (!tag) {
          tag = document.createElement('span');
          tag.className = 'zone-issue-num';
          b.appendChild(tag);
        }
        tag.textContent = String(count);
      } else tag?.remove();
    });
  }
  const nocCanvas = document.createElement('canvas');
  nocCanvas.width = 1024;
  nocCanvas.height = 110;
  const nocCtx = nocCanvas.getContext('2d');
  const nocTexture = new THREE.CanvasTexture(nocCanvas);
  nocTexture.colorSpace = THREE.SRGBColorSpace;
  const nocBanner = new THREE.Mesh(
    new THREE.PlaneGeometry(4.15, 0.38),
    new THREE.MeshBasicMaterial({
      map: nocTexture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    })
  );
  nocBanner.position.set(-5.94, 2.98, -8.46);
  nocBanner.renderOrder = 0;
  registry.get('NOC-WALL-01')?.root.add(nocBanner);
  function updateNocWall() {
    const count = activeIncidents.size;
    nocCtx.fillStyle = count ? '#5f2734' : '#163f47';
    nocCtx.fillRect(0, 0, 1024, 110);
    nocCtx.fillStyle = count ? '#ff9ea6' : '#7ff1c8';
    nocCtx.fillRect(0, 0, 9, 110);
    nocCtx.fillStyle = '#f2fbff';
    nocCtx.textBaseline = 'middle';
    nocCtx.font = 'bold 37px sans-serif';
    const incidentName = count
      ? SCENARIO_BY_ID.get([...activeIncidents.keys()][0])?.title || '시설 경보'
      : '';
    nocCtx.fillText(
      count ? `관제 경보 ${count}건  |  ${incidentName}` : 'NOC 실시간 관제  |  정상',
      34,
      55
    );
    nocTexture.needsUpdate = true;
  }
  function clearIssueMeshes() {
    for (const o of issueMeshes.values()) {
      o.root.remove(o.group);
      o.group.traverse(child => {
        if (child.isMesh) {
          child.geometry.dispose();
          child.material.dispose?.();
        }
      });
    }
    issueMeshes.clear();
    for (const label of issueLabels.values()) label.remove();
    issueLabels.clear();
    for (const item of issueLinks) {
      scene.remove(item.line);
      item.line.geometry.dispose();
      item.line.material.dispose();
    }
    issueLinks.length = 0;
  }
  function updateIssueVisuals() {
    clearIssueMeshes();
    const impacted = [...registry.values()].filter(a => getAssetStatus(a) !== '정상');
    for (const a of impacted) {
      const issues = getAssetIssues(a.id),
        main = issues.find(i => i.primary) || issues[0],
        primary = Boolean(issues.find(i => i.primary)),
        isCritical = severityRank(getAssetStatus(a)) === 3;
      const color = isCritical ? 0xff6475 : 0xf1b76e,
        g = new THREE.Group();
      g.name = 'fault-beacon:' + a.id;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.86, 0.05, 8, 48),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.85,
          depthTest: true,
          depthWrite: false,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;
      ring.renderOrder = 0;
      g.add(ring);
      const tipY = a.type.includes('PUMP')
        ? 1.73
        : a.type.includes('SECURITY ACCESS')
          ? 1.62
          : 2.65;
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.63, 8),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.63,
          depthTest: true,
          depthWrite: false,
        })
      );
      stem.position.y = tipY - 0.3;
      g.add(stem);
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(primary ? 0.18 : 0.12, 16, 12),
        new THREE.MeshBasicMaterial({ color, depthTest: true, depthWrite: false })
      );
      orb.position.y = tipY;
      orb.renderOrder = 0;
      g.add(orb);
      if (a.markerLocal) g.position.set(...a.markerLocal);
      a.root.add(g);
      issueMeshes.set(a.id, { group: g, root: a.root, ring, orb, primary });
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `world-alert ${isCritical ? 'critical' : 'warning'} ${primary ? 'primary' : ''}`;
      btn.innerHTML = `<i></i><span><b>${esc(a.id)}</b>${primary ? `<small>${esc(main.scenario.title)}</small>` : '<small>영향 가능 · 확인</small>'}</span>`;
      btn.addEventListener('click', e => {
        e.stopPropagation();
        focusAsset(a.id);
        setInspectorTab('asset');
      });
      worldAlertsHost.appendChild(btn);
      issueLabels.set(a.id, btn);
    }
    for (const v of activeIncidents.values()) {
      const s = SCENARIO_BY_ID.get(v.id),
        primary = registry.get(s.asset);
      for (const dep of s.related) {
        const affected = registry.get(dep.id);
        if (!primary || !affected) continue;
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(),
          new THREE.Vector3(),
        ]);
        const line = new THREE.Line(
          geo,
          new THREE.LineBasicMaterial({
            color: 0xf2ae6d,
            transparent: true,
            opacity: 0.5,
            depthTest: true,
            depthWrite: false,
          })
        );
        line.renderOrder = 0;
        scene.add(line);
        issueLinks.push({ line, primary, affected });
      }
    }
    for (const key of floorList) {
      const floorIssues = impacted.filter(a => a.floor === key);
      const outline = floorAlertOutlines.get(key);
      outline.visible = floorIssues.length > 0;
      outline.material.color.setHex(
        floorIssues.some(a => severityRank(getAssetStatus(a)) === 3) ? 0xff697b : 0xf0b36e
      );
    }
    for (const l of leds) {
      if (!l.originalMaterial) l.originalMaterial = l.mesh.material;
      l.mesh.material =
        getAssetStatus(registry.get(l.id)) === '장애' ? M.error : l.originalMaterial;
    }
    updateNocWall();
  }
  function updateAlertLabels() {
    const bounds = host.getBoundingClientRect(),
      distance = camera.position.distanceTo(controls.target);
    for (const [id, btn] of issueLabels) {
      const a = registry.get(id),
        issue = issueMeshes.get(id);
      if (!a || !issue) continue;
      const isVisible = !activeFloor || a.floor === activeFloor;
      const include = !activeFloor && distance > 56 ? issue.primary : true;
      const pos = assetWorldPoint(a);
      pos.y += a.type.includes('PUMP') ? 2.05 : 3.0;
      const p = pos.clone().project(camera),
        visible =
          isVisible &&
          include &&
          p.z > -0.95 &&
          p.z < 1 &&
          p.x > -0.93 &&
          p.x < 0.93 &&
          p.y > -0.93 &&
          p.y < 0.9 &&
          !isHiddenBehindArchitecture(pos);
      btn.style.display = visible ? 'flex' : 'none';
      if (visible) {
        btn.style.left = `${(p.x * 0.5 + 0.5) * bounds.width}px`;
        btn.style.top = `${(-p.y * 0.5 + 0.5) * bounds.height}px`;
      }
    }
    for (const entry of issueLinks) {
      const a = assetWorldPoint(entry.primary),
        b = assetWorldPoint(entry.affected);
      a.y += 1.6;
      b.y += 1.6;
      const attr = entry.line.geometry.attributes.position;
      attr.setXYZ(0, a.x, a.y, a.z);
      attr.setXYZ(1, b.x, b.y, b.z);
      attr.needsUpdate = true;
      entry.line.geometry.computeBoundingSphere();
      entry.line.visible =
        !activeFloor ||
        (entry.primary.floor === activeFloor && entry.affected.floor === activeFloor);
    }
  }
  function refreshIncidents() {
    updateAgentShortcuts();
    updateIssueVisuals();
    updateSummary();
    renderIncidentOverlay();
    renderScenarioPanel();
    updateInspector();
    syncModeControls();
    updateAssetModal();
  }

  function focusAsset(id) {
    const asset = registry.get(id);
    if (!asset) return;
    setZone(asset.zone, id, false);
    const v = assetWorldPoint(asset);
    // A storey may still be moving down from an exploded overview.
    // Frame the equipment at the floor's DESTINATION, not its current animated position.
    if (asset.floor) {
      const floor = floorGroups[asset.floor];
      v.y += floorTargets[asset.floor] - floor.position.y;
    }
    const pick = pickBounds.get(id);
    const dimensions = pick ? pick.getSize(new THREE.Vector3()) : new THREE.Vector3(1.5, 2.5, 1.5);
    const large = Math.max(dimensions.x, dimensions.z);
    // Front-facing racks share +Z; an elevated oblique angle clears neighbouring rack rows.
    // Larger consoles/screens get enough distance to avoid cropping.
    const distance = clamp(5.5 + large * 0.55, 6.4, 17);
    const target = [v.x, v.y + clamp(dimensions.y * 0.42, 0.8, 2.4), v.z];
    const position = [v.x + distance * 0.42, target[1] + distance * 0.93, v.z + distance * 0.88];
    // Avoid the camera jumping all the way across the room when focusing another device.
    animateCamera(position, target, 950);
  }

  function updateInfrastructurePanel() {
    const idState = id => getAssetStatus(registry.get(id));
    const rank = id => severityRank(idState(id));
    const formatState = r => (r >= 3 ? 'ALARM' : r === 2 ? 'WARNING' : 'NORMAL');
    const updateLed = (el, id) => {
      const r = rank(id);
      el.classList.toggle('fault', r >= 3);
      el.classList.toggle('warning', r === 2);
      el.parentElement.title = id + ' · ' + idState(id);
    };
    const powerIds = ['UPS-01', 'UPS-02', 'BAT-01', 'ATS-01', 'SWGR-01', 'GEN-01'];
    const coolingIds = ['CH-01', 'CH-02', 'PUMP-01', 'PUMP-02', 'HEX-01', 'CDU-01', 'CDU-02'];
    const powerRank = Math.max(...powerIds.map(rank));
    const coolingRank = Math.max(...coolingIds.map(rank));
    for (const [type, r] of [
      ['power', powerRank],
      ['cooling', coolingRank],
    ]) {
      const el = document.getElementById('infra-' + type + '-state');
      el.textContent = formatState(r);
      el.classList.toggle('fault', r >= 3);
      el.classList.toggle('warning', r === 2);
      const sec = root.querySelector('[data-infra-panel="' + type + '"]');
      sec.classList.toggle('is-fault', r >= 3);
      const chosen =
        type === 'power'
          ? activeZone === 'power'
          : activeZone === 'cooling' || selectedId?.startsWith('CDU-');
      sec.classList.toggle('is-focused', chosen);
    }
    const upsFault = activeIncidents.has('ups'),
      cduFault = activeIncidents.has('cdu'),
      chillerFault = activeIncidents.has('chiller');
    // Synthetic readings for prototype demonstrations only, not telemetry.
    const battery = upsFault ? 71 : 96;
    const powerLoad = upsFault ? 87 : 68;
    const supply = chillerFault ? 24.7 : cduFault ? 19.3 : 18.2;
    const flow = cduFault ? 82 : chillerFault ? 131 : 148;
    const coolingLoad = chillerFault ? 87 : cduFault ? 78 : 61;
    const upsLabel = r => (r >= 3 ? '이상' : r === 2 ? '주의' : '정상');
    document.getElementById('infra-ups-status').textContent =
      upsLabel(rank('UPS-01')) + ' / ' + upsLabel(rank('UPS-02'));
    document.getElementById('infra-battery').innerHTML = battery + '<em>%</em>';
    document.getElementById('infra-power-load').innerHTML = powerLoad + '<em>%</em>';
    document.getElementById('infra-power-pct').textContent = powerLoad + '%';
    document.getElementById('infra-power-bar').style.width = powerLoad + '%';
    document.getElementById('infra-supply-temp').innerHTML = supply.toFixed(1) + '<em>°C</em>';
    document.getElementById('infra-cdu-flow').innerHTML = flow + '<em>L/min</em>';
    document.getElementById('infra-cooling-load').innerHTML = coolingLoad + '<em>%</em>';
    document.getElementById('infra-cooling-pct').textContent = coolingLoad + '%';
    document.getElementById('infra-cooling-bar').style.width = coolingLoad + '%';
    for (const [led, id] of [
      ['infra-led-ups', 'UPS-01'],
      ['infra-led-bat', 'BAT-01'],
      ['infra-led-ats', 'ATS-01'],
      ['infra-led-ch', 'CH-01'],
      ['infra-led-pump', 'PUMP-01'],
      ['infra-led-cdu', 'CDU-01'],
    ])
      updateLed(document.getElementById(led), id);
  }

  // v9 adaptation layer for original AIDC v4 HTML panels.
  function updateAIDCPanel() {
    if (!registry.size) return;
    updateInfrastructurePanel();
    const all = [...registry.values()].filter(a => a.type !== 'AI AGENT');
    const activeAsset = selectedId ? registry.get(selectedId) : null;
    const group = activeAsset
      ? [activeAsset]
      : activeFloor
        ? all.filter(x => x.floor === activeFloor)
        : activeZone !== 'overview'
          ? all.filter(x => x.zone === activeZone)
          : all;
    const zone = zones[activeZone] || zones.overview;
    const bad = group.filter(a => getAssetStatus(a) !== '정상').length;
    const status = activeAsset
      ? getAssetStatus(activeAsset)
      : group.some(a => severityRank(getAssetStatus(a)) === 3)
        ? '장애'
        : bad
          ? '주의'
          : '정상';
    $('#device-kicker').textContent = activeAsset
      ? activeAsset.type + ' / ' + activeAsset.id
      : (zone.code || 'CAMPUS') + ' / ' + (activeFloor || 'SITE');
    $('#device-title').textContent = activeAsset ? activeAsset.name : zone.name || zone.title;
    $('#device-location').textContent = activeAsset
      ? activeAsset.location
      : zone.sub || 'KNU AIDC 데이터센터 · 모의 데이터';
    $('#device-id-short').textContent = activeAsset ? activeAsset.id : activeFloor || 'ALL';
    const state = $('#device-state');
    state.classList.toggle('warning', status === '주의');
    state.classList.toggle('alert-state', severityRank(status) === 3);
    state.textContent =
      status === '정상' ? '● NORMAL' : status === '주의' ? '● WARNING' : '● ALARM';
    const sensor = activeAsset ? getSensor(activeAsset) : null;
    const sum = group.reduce((v, a) => v + getSensor(a).power, 0);
    const metrics = activeAsset
      ? [
          ['Equipment Temp.', sensor.temp.toFixed(1), '°C'],
          ['Power Draw', sensor.power.toFixed(1), 'kW'],
          ['Operating Load', String(activeAsset.capacity ?? 68), '%'],
          ['Status', status, ''],
        ]
      : [
          ['Devices', String(group.length), ''],
          ['Normal', String(group.length - bad), ''],
          ['Alerts', String(bad), ''],
          ['Power (demo)', sum.toFixed(1), 'kW'],
        ];
    $('#device-grid').innerHTML = metrics
      .map(
        ([k, v, u]) =>
          `<div class="metric"><span>${esc(k)}</span><strong>${esc(v)}<em>${esc(u)}</em></strong></div>`
      )
      .join('');
    const modalTrigger = $('#open-asset-modal');
    modalTrigger.disabled = !activeAsset;
    modalTrigger.firstElementChild.textContent = activeAsset
      ? '선택 설비 상세 보기'
      : '설비를 선택하면 상세 보기';
    for (const floor of floorList) {
      const problems = incidentCountForFloor(floor);
      const el = $('#health-' + floor);
      if (!el) continue;
      el.textContent = problems ? `장애 ${problems}` : '정상';
      el.classList.toggle('warn', Boolean(problems));
      el.classList.toggle('error', Boolean(problems));
    }
    for (const key of ['power', 'cooling']) {
      const count = [...activeIncidents.values()].filter(
        c => SCENARIO_BY_ID.get(c.id)?.zone === key
      ).length;
      const el = $('#health-' + key);
      if (el) {
        el.textContent = count ? '장애 ' + count : '정상';
        el.classList.toggle('error', Boolean(count));
        el.classList.toggle('warn', Boolean(count));
      }
    }
    const tempMap = { '4F': '22.4', '3F': '24.6', '2F': '23.1', '1F': '22.8' };
    const humMap = { '4F': '47.5', '3F': '44.1', '2F': '46.8', '1F': '48.2' };
    const loadMap = { '4F': '38', '3F': '86', '2F': '71', '1F': '64' };
    $('#env-body').innerHTML = [...floorList]
      .reverse()
      .map(f => {
        const count = incidentCountForFloor(f),
          temp = (Number(tempMap[f]) + (f === '3F' && count ? 1.8 : 0)).toFixed(1);
        return `<tr data-env-floor="${f}" class="${activeFloor === f ? 'selected' : ''}"><td class="${count ? 'attention' : ''}">${f}</td><td class="good">${temp}<small> °C</small></td><td>${humMap[f]}<small>%</small></td><td>${loadMap[f]}<small>%</small></td></tr>`;
      })
      .join('');
    const alarmIds = [...activeIncidents.values()].map(i => ({
      scenario: SCENARIO_BY_ID.get(i.id),
      incident: i,
    }));
    $('#alarm-count').textContent = String(alarmIds.length).padStart(2, '0');
    $('#header-alarm-count').textContent = alarmIds.length;
    $('#header-alarm-count').style.display = alarmIds.length ? 'inline-block' : 'none';
    $('#alarm-list').innerHTML = alarmIds.length
      ? alarmIds
          .map(
            ({ scenario: s, incident: i }) =>
              `<li class="alarm-item" data-level="critical" data-scenario-focus="${s.id}"><span class="alarm-level"></span><div class="alarm-copy"><b>${esc(s.title)}</b><small>${esc(s.asset)} · ${esc(incidentSteps[i.stage])}</small></div><div class="alarm-meta"><time class="alarm-time">${new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(i.started)}</time><span class="alarm-severity">ALARM</span></div></li>`
          )
          .join('')
      : '<li class="alarm-item" data-level="resolved"><span class="alarm-level"></span><div class="alarm-copy"><b>전체 설비 모니터링 정상</b><small>실제 연동이 아닌 시뮬레이션 데이터입니다.</small></div><div class="alarm-meta"><span class="alarm-severity">NORMAL</span></div></li>';
    if (activeAsset?.type === 'AI AGENT') {
      const agent = aiAgents.get(activeAsset.id),
        busy = agentIsBusy(agent);
      $('#device-kicker').textContent = 'AI OPERATOR / ' + agent.id;
      $('#device-title').textContent = agent.name;
      $('#device-location').textContent = agent.area;
      $('#device-id-short').textContent = agent.id;
      $('#device-state').textContent = busy ? '● INSPECTING' : '● STANDBY';
      $('#device-state').classList.toggle('warning', busy);
      $('#device-state').classList.remove('alert-state');
      $('#device-grid').innerHTML = [
        ['담당 업무', agent.role, ''],
        ['연관 경보', String(agentRelatedIncidents(agent).length), '건'],
      ]
        .map(
          ([k, v, u]) =>
            `<div class="metric"><span>${esc(k)}</span><strong style="font-size:12px;white-space:normal">${esc(v)}<em>${esc(u)}</em></strong></div>`
        )
        .join('');
      $('#open-asset-modal').firstElementChild.textContent = 'AI 에이전트 상세 보기';
    }
    updateAgentShortcuts();
  }

  // V26: the picking system checks visibility, honours solid walls, and gives equipment
  // a small invisible geometric selection volume, so a thin cable/LED isn't required to click it.
  // No selection proxy is rendered; the real visual geometry and all its shadows stay unchanged.
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const pickBounds = new Map();
  const pickScratch = new THREE.Box3();
  const pickHit = new THREE.Vector3();
  const opaqueOccluders = new Set(architectureOccluders);
  function prepareEquipmentPickBounds(assetId = null) {
    scene.updateMatrixWorld(true);
    const assets = assetId ? [registry.get(assetId)].filter(Boolean) : registry.values();
    for (const asset of assets) {
      const bounds = new THREE.Box3().setFromObject(asset.root, true);
      if (bounds.isEmpty()) continue;
      const inverse = asset.root.matrixWorld.clone().invert();
      const local = new THREE.Box3().makeEmpty();
      for (const x of [bounds.min.x, bounds.max.x])
        for (const y of [bounds.min.y, bounds.max.y])
          for (const z of [bounds.min.z, bounds.max.z])
            local.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(inverse));
      local.expandByVector(new THREE.Vector3(0.17, 0.12, 0.17));
      pickBounds.set(asset.id, local);
    }
  }
  prepareEquipmentPickBounds();
  function hitTest(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    mouse.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    scene.updateMatrixWorld(true);
    // Keep both utility annexes pickable even while a main-building floor is selected.
    const candidates = activeFloor
      ? [floorGroups[activeFloor], powerZone, coolingZone]
      : [hall, powerZone, coolingZone];
    const hits = raycaster.intersectObjects(candidates, true);
    let firstGeometryAsset = null,
      firstFallback = null,
      wallDistance = Infinity;
    for (const h of hits) {
      // Raycaster itself can intersect meshes inside groups hidden by the floor cutaway.
      if (!isActuallyVisible(h.object)) continue;
      const entity = getEntity(h.object);
      if (entity?.id && !firstGeometryAsset)
        firstGeometryAsset = { asset: entity, distance: h.distance };
      if (entity && !firstFallback) firstFallback = entity;
      // Invisible cutaway geometry is ignored, but a visible solid wall prevents through-wall selection.
      if (opaqueOccluders.has(h.object) && h.object.material?.transparent !== true) {
        wallDistance = Math.min(wallDistance, h.distance);
      }
    }
    if (firstGeometryAsset && firstGeometryAsset.distance <= wallDistance + 0.07)
      return firstGeometryAsset.asset;
    // Fallback to a volume around each device: this makes small pumps, racks and panels easier to pick.
    let best = null,
      nearest = Infinity;
    for (const asset of registry.values()) {
      if (!isActuallyVisible(asset.root)) continue;
      if (asset.floor && activeFloor && asset.floor !== activeFloor) continue;
      if (!asset.floor && activeFloor) continue;
      const local = pickBounds.get(asset.id);
      if (!local) continue;
      pickScratch.copy(local).applyMatrix4(asset.root.matrixWorld);
      if (raycaster.ray.intersectBox(pickScratch, pickHit)) {
        const distance = raycaster.ray.origin.distanceTo(pickHit);
        if (distance < nearest && distance < wallDistance + 0.07) {
          best = asset;
          nearest = distance;
        }
      }
    }
    if (best) return best;
    // Clicking an already open floor shouldn't throw the camera back to the overview.
    return firstFallback;
  }
  let downAt = null;
  renderer.domElement.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
  });
  renderer.domElement.addEventListener('pointermove', e => {
    if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 7) focusTween = null;
  });
  renderer.domElement.addEventListener('pointerup', e => {
    if (!downAt || e.button !== 0) return;
    const movement = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (movement > 7) {
      lastEquipmentTap = null;
      return;
    }
    const now = performance.now();
    const repeated =
      lastEquipmentTap &&
      now - lastEquipmentTap.time < 460 &&
      Math.hypot(e.clientX - lastEquipmentTap.x, e.clientY - lastEquipmentTap.y) < 20;
    const hit = hitTest(e);
    // The camera starts animating on first click; the second click may hit a different pixel-space mesh.
    // Within the double-click interval, keep the originally chosen device unless a different device is clearly selected later.
    const id = repeated ? lastEquipmentTap.id : hit?.id || null;
    if (id && registry.has(id)) {
      const wasSelected = selectedId === id;
      if (!wasSelected)
        focusAsset(id); // first click: original selection + camera movement
      else openAssetModal(id); // second click: inspect, no new camera movement
      hoveredId = id;
      lastEquipmentTap = { id, x: e.clientX, y: e.clientY, time: now };
    } else if (hit?.isZone && zones[hit.zone]) {
      lastEquipmentTap = null;
      setZone(hit.zone);
    } else if (hit?.isFloor && activeFloor !== hit.floor) {
      lastEquipmentTap = null;
      setZone('f' + hit.floor[0]);
    } else {
      lastEquipmentTap = null;
    }
  });
  renderer.domElement.addEventListener('pointercancel', () => {
    downAt = null;
    lastEquipmentTap = null;
  });
  renderer.domElement.addEventListener('dblclick', e => {
    e.preventDefault();
    const hit = hitTest(e);
    const last = lastEquipmentTap;
    const fromFirstTap =
      last &&
      performance.now() - last.time < 700 &&
      Math.hypot(e.clientX - last.x, e.clientY - last.y) < 24;
    const id = (fromFirstTap ? last.id : null) || hit?.id || null;
    if (id && registry.has(id)) {
      if (selectedId !== id) focusAsset(id);
      openAssetModal(id); // direct double-click, including the first interaction with that equipment
    } else if (hit?.isFloor && activeFloor !== hit.floor) {
      setZone('f' + hit.floor[0]);
    }
  });
  let lastHoverTime = 0;
  renderer.domElement.addEventListener('pointermove', e => {
    const now = performance.now();
    if (now - lastHoverTime < 40) return;
    lastHoverTime = now;
    const hit = hitTest(e),
      tip = $('#hover-tooltip');
    if (hit) {
      let name = hit.id
        ? hit.name
        : hit.isFloor
          ? `${hit.floor} · ${FLOOR_INFO[hit.floor].name}`
          : zones[hit.zone]?.name || '시설';
      tip.style.display = 'block';
      tip.style.left = `${e.clientX - host.getBoundingClientRect().left + 13}px`;
      tip.style.top = `${e.clientY - host.getBoundingClientRect().top + 14}px`;
      tip.textContent = `${name} · ${hit.id ? (selectedId === hit.id ? '한 번 더 클릭해 상세 보기' : '클릭해서 이동 · 더블클릭 상세') : '클릭하여 이동'}`;
      renderer.domElement.style.cursor = 'pointer';
    } else {
      tip.style.display = 'none';
      renderer.domElement.style.cursor = 'grab';
    }
  });
  renderer.domElement.addEventListener('pointerleave', () => {
    $('#hover-tooltip').style.display = 'none';
  });
  zoneButtons.forEach(btn => btn.addEventListener('click', () => setZone(btn.dataset.zone)));
  modeButtons.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
  document
    .querySelectorAll('[data-floor]')
    .forEach(btn =>
      btn.addEventListener('click', () =>
        setZone(btn.dataset.floor === 'all' ? 'overview' : 'f' + btn.dataset.floor[0])
      )
    );
  root.querySelectorAll('[data-split-level]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (activeFloor) setZone('overview', null, false);
      setSplitLevel(Number(btn.dataset.splitLevel));
    })
  );
  $('#detail-view').addEventListener('click', e => {
    const agentButton = e.target.closest('[data-open-agent-modal]');
    if (agentButton) {
      openAssetModal(agentButton.dataset.openAgentModal);
      return;
    }
    const assetButton = e.target.closest('[data-focus-id]');
    const zoneButton = e.target.closest('[data-focus-zone]');
    const scenarioButton = e.target.closest('[data-open-scenario]');
    if (assetButton) focusAsset(assetButton.dataset.focusId);
    else if (zoneButton) setZone(zoneButton.dataset.focusZone);
    else if (scenarioButton) {
      chosenScenarioId = scenarioButton.dataset.openScenario;
      twinActions.setScenarioState({ chosenScenarioId });
      setInspectorTab('scenario');
    }
  });
  $('#btn-agent-visibility').addEventListener('click', twinActions.toggleAgentsVisible);
  $('#agent-shortcuts').addEventListener('click', e => {
    const item = e.target.closest('[data-agent-id]');
    if (item) {
      if (!agentsVisible) setAgentVisibility(true);
      focusAsset(item.dataset.agentId);
    }
  });
  $('#btn-fit').addEventListener('click', () => setZone('overview'));
  $('#btn-auto').addEventListener('click', () => {
    twinActions.toggleAutoRotate();
  });
  root.querySelectorAll('[data-quality]').forEach(button =>
    button.addEventListener('click', () => {
      twinActions.setHighQuality(button.dataset.quality === 'high');
    })
  );
  // AIDC v4 navigation and header buttons, backed by the real v8 3D interactions.
  root.querySelectorAll('[data-topnav]').forEach(b =>
    b.addEventListener('click', () => {
      root.querySelectorAll('[data-topnav]').forEach(x => x.classList.toggle('active', x === b));
      const mode = b.dataset.topnav;
      if (mode === 'facility') {
        setZone('overview');
        setMode('normal');
      } else if (mode === 'power') {
        setMode('power', true);
        setZone('power');
      } else {
        setZone('f3');
        setMode('thermal');
      }
    })
  );
  $('#header-alarm').addEventListener('click', () => setInspectorTab('scenario'));
  $('#topChip').addEventListener('click', () => {
    const target = activeFloor ? [0, FLOOR_Y[activeFloor] + 1, 0] : [0, 8, 0];
    animateCamera([0, activeFloor ? FLOOR_Y[activeFloor] + 41 : 85, 0.2], target, 900);
  });
  $('#btn-view-reset').addEventListener('click', () => {
    if (activeFloor) setZone('f' + activeFloor[0]);
    else setZone('overview');
  });
  $('#env-body').addEventListener('click', e => {
    const r = e.target.closest('[data-env-floor]');
    if (r) setZone('f' + r.dataset.envFloor[0]);
  });
  root.querySelector('.right-panel').addEventListener('click', e => {
    const zoneButton = e.target.closest('[data-infra-focus]');
    const assetButton = e.target.closest('[data-infra-asset]');
    if (zoneButton) setZone(zoneButton.dataset.infraFocus);
    else if (assetButton) {
      focusAsset(assetButton.dataset.infraAsset);
    }
  });
  $('#alarm-list').addEventListener('click', e => {
    const item = e.target.closest('[data-scenario-focus]');
    if (item) {
      chosenScenarioId = item.dataset.scenarioFocus;
      twinActions.setScenarioState({ chosenScenarioId });
      setInspectorTab('scenario');
      focusAsset(SCENARIO_BY_ID.get(chosenScenarioId).asset);
    }
  });
  $('#v9-panel-details').addEventListener('toggle', () => {
    if (!$('#v9-panel-details').open) $('#v9-detail-toggle').textContent = '운영 상세 펼치기';
  });

  $('#btn-alarm').addEventListener('click', () => runScenario(chosenScenarioId));
  $('#btn-reset').addEventListener('click', resetAllIncidents);
  root
    .querySelectorAll('[data-inspector-tab]')
    .forEach(btn => btn.addEventListener('click', () => setInspectorTab(btn.dataset.inspectorTab)));
  $('#scenario-view').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.scenarioId) {
      chosenScenarioId = btn.dataset.scenarioId;
      twinActions.setScenarioState({ chosenScenarioId });
      renderScenarioPanel();
    } else if (btn.dataset.runScenario) runScenario(btn.dataset.runScenario);
    else if (btn.dataset.caseAdvance) advanceIncident(btn.dataset.caseAdvance);
    else if (btn.dataset.caseFocus) focusAsset(SCENARIO_BY_ID.get(btn.dataset.caseFocus).asset);
    else if (btn.dataset.caseChoose) {
      selectedIncidentId = btn.dataset.caseChoose;
      chosenScenarioId = btn.dataset.caseChoose;
      twinActions.setScenarioState({ chosenScenarioId, selectedIncidentId });
      renderScenarioPanel();
    }
  });
  $('#incident-overlay').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.overlayFocus) {
      const s = SCENARIO_BY_ID.get(b.dataset.overlayFocus);
      focusAsset(s.asset);
      chosenScenarioId = s.id;
      selectedIncidentId = s.id;
      twinActions.setScenarioState({ chosenScenarioId, selectedIncidentId });
      setInspectorTab('scenario');
    } else if (b.dataset.overlayAll) setInspectorTab('scenario');
  });
  const handleGlobalKeydown = e => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (assetModalId) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeAssetModal();
      }
      return;
    }
    if (e.key === '0' || e.key.toLowerCase() === 'r' || e.key === 'Escape') setZone('overview');
    if (['1', '2', '3', '4'].includes(e.key)) setZone('f' + e.key);
    if (e.key.toLowerCase() === 'x' && !activeFloor) setSplitLevel((splitLevel + 1) % 3);
    if (e.key.toLowerCase() === 'h') setMode('thermal');
    if (e.key.toLowerCase() === 'p') setMode('power');
  };
  window.addEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('resize', resize);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    applyRenderQuality(w, h);
  }
  function updateDistanceDetails() {
    const distance = camera.position.distanceTo(controls.target);
    // Hysteresis avoids flicker on the visibility boundary while orbiting.
    const visible = fineTileLinesVisible ? distance <= 62 : distance < 54;
    if (visible === fineTileLinesVisible) return;
    fineTileLinesVisible = visible;
    for (const seam of fineTileLines) seam.visible = visible;
    grid.visible = visible;
  }
  function updateLabels() {
    if (!renderer?.domElement) return;
    const hostRect = host.getBoundingClientRect(),
      w = hostRect.width,
      h = hostRect.height;
    for (const a of labelAnchors) {
      const display = a.floor
        ? activeFloor
          ? activeFloor === a.floor
          : a.zone === 'f' + a.floor[0]
        : activeFloor
          ? false
          : true;
      const world = (typeof a.world === 'function' ? a.world() : a.world).clone();
      const p = world.clone().project(camera);
      const visible =
        display &&
        p.z > -0.95 &&
        p.z < 1 &&
        p.x > -1.1 &&
        p.x < 1.1 &&
        p.y > -1.1 &&
        p.y < 1.1 &&
        !isHiddenBehindArchitecture(world);
      a.label.style.display = visible ? 'block' : 'none';
      if (visible) {
        a.label.style.left = `${(p.x * 0.5 + 0.5) * w}px`;
        a.label.style.top = `${(-p.y * 0.5 + 0.5) * h}px`;
        a.label.style.opacity = '1';
      }
    }
  }
  const haloGeom = new THREE.TorusGeometry(1.05, 0.035, 8, 60);
  selectedHalo = new THREE.Mesh(
    haloGeom,
    new THREE.MeshBasicMaterial({
      color: 0x69e2f2,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    })
  );
  selectedHalo.rotation.x = -Math.PI / 2;
  selectedHalo.visible = false;
  scene.add(selectedHalo);

  function syncDeviceFx(t) {
    for (const [id, fx] of deviceFx) {
      const asset = registry.get(id);
      if (!asset) continue;
      const issues = getAssetIssues(id);
      const level = issues.reduce((m, v) => Math.max(m, severityRank(v.state)), 0);
      const critical = level >= 3,
        active = level > 0;
      const pulseCritical = 0xff6b76,
        pulseWarn = 0xf0b46d;
      const primaryIds = getScenarioIds(issues.filter(x => x.primary));
      const activeColor = critical ? pulseCritical : pulseWarn;
      switch (fx.kind) {
        case 'serverRack':
        case 'gpuRack':
          {
            fx.statusLeds?.forEach((led, i) => {
              setFxColor(
                led,
                active
                  ? critical && (Math.floor(t * 8) + i) % 2 === 0
                    ? pulseCritical
                    : pulseWarn
                  : fx.kind === 'gpuRack'
                    ? 0x9ca7ff
                    : 0x64e6c3
              );
              led.material.opacity = active
                ? pulseOpacity(0.35, 0.55, t, critical ? 8 : 5, i)
                : 0.96;
            });
            if (fx.alarmLens) {
              fx.alarmLens.visible = active;
              setFxColor(fx.alarmLens, activeColor);
              fx.alarmLens.material.opacity = active
                ? pulseOpacity(0.3, 0.6, t, critical ? 8 : 4)
                : 0;
            }
            if (fx.heatBeacon) {
              const show = active;
              fx.heatBeacon.visible = show;
              setFxColor(fx.heatBeacon, primaryIds.includes('gpu') ? pulseCritical : activeColor);
              fx.heatBeacon.material.opacity = show ? pulseOpacity(0.18, 0.55, t, 6) : 0;
              fx.heatBeacon.scale.setScalar(
                show
                  ? primaryIds.includes('gpu')
                    ? 1.0 + 0.18 * Math.sin(t * 5)
                    : 0.85 + 0.12 * Math.sin(t * 4)
                  : 1
              );
            }
            fx.slotOverlays?.forEach((p, idx) => {
              const show = active;
              p.visible = show;
              setFxColor(p, critical ? pulseCritical : pulseWarn);
              p.material.opacity = show
                ? critical
                  ? pulseOpacity(0.08, 0.14, t, 7, idx)
                  : 0.08
                : 0;
            });
          }
          break;
        case 'network':
          {
            fx.portFault?.forEach((p, i) => {
              const show = active;
              p.visible = show;
              const c = critical && (Math.floor(t * 10) + i) % 2 === 0 ? pulseCritical : pulseWarn;
              setFxColor(p, c);
              p.material.opacity = show ? pulseOpacity(0.16, 0.78, t, 10, i * 0.4) : 0;
            });
            if (fx.uplinkGlow) {
              fx.uplinkGlow.visible = active;
              setFxColor(fx.uplinkGlow, activeColor);
              fx.uplinkGlow.material.opacity = active ? (critical ? 0.42 : 0.28) : 0;
            }
            if (fx.linkArc) {
              fx.linkArc.visible = active;
              fx.linkArc.material.opacity = active ? (critical ? 0.8 : 0.45) : 0;
              fx.linkArc.material.color.setHex(activeColor);
            }
          }
          break;
        case 'ups':
        case 'battery':
        case 'switchgear':
          {
            const normal = fx.kind === 'battery' ? 0xa7dd6e : 0x67e3cb;
            fx.statusBars?.forEach((bar, i) => {
              setFxColor(bar, active ? (critical && i === 0 ? pulseCritical : pulseWarn) : normal);
              bar.material.opacity = active ? pulseOpacity(0.28, 0.6, t, 6, i) : 0.95;
            });
            if (fx.screenGlow) {
              fx.screenGlow.visible = active;
              setFxColor(fx.screenGlow, activeColor);
              fx.screenGlow.material.opacity = active ? (critical ? 0.5 : 0.3) : 0;
            }
            if (fx.beacon) {
              fx.beacon.visible = active;
              setFxColor(fx.beacon, activeColor);
              fx.beacon.material.opacity = active ? pulseOpacity(0.18, 0.65, t, 7) : 0;
            }
          }
          break;
        case 'cdu':
          {
            const criticalC = primaryIds.includes('cdu');
            fx.flowLeds?.forEach((led, i) => {
              setFxColor(
                led,
                active
                  ? criticalC && (Math.floor(t * 7) + i) % 3 === 0
                    ? pulseCritical
                    : 0x79eaf5
                  : 0x6ce2ef
              );
              led.material.opacity = active ? pulseOpacity(0.22, 0.65, t, 7, i * 0.2) : 0.92;
            });
            if (fx.panelGlow) {
              fx.panelGlow.visible = active;
              setFxColor(fx.panelGlow, activeColor);
              fx.panelGlow.material.opacity = active ? (criticalC ? 0.45 : 0.22) : 0;
            }
            fx.leakDrops?.forEach((d, i) => {
              const show = criticalC;
              d.visible = show;
              d.position.y = 0.45 - i * 0.13 - (show ? (t * 1.6 + i * 0.2) % 0.12 : 0);
              d.material.opacity = show ? pulseOpacity(0.18, 0.55, t, 6, i) : 0;
            });
            if (fx.beacon) {
              fx.beacon.visible = active;
              setFxColor(fx.beacon, activeColor);
              fx.beacon.material.opacity = active ? pulseOpacity(0.18, 0.55, t, 6) : 0;
            }
          }
          break;
        case 'chiller':
          {
            if (fx.panelGlow) {
              fx.panelGlow.visible = active;
              setFxColor(fx.panelGlow, activeColor);
              fx.panelGlow.material.opacity = active ? (critical ? 0.5 : 0.22) : 0;
            }
            fx.fanAlerts?.forEach((fan, i) => {
              fan.visible = active;
              setFxColor(
                fan,
                critical && (Math.floor(t * 8) + i) % 2 === 0 ? pulseCritical : pulseWarn
              );
              fan.material.opacity = active ? pulseOpacity(0.12, 0.7, t, 8, i) : 0;
              fan.scale.setScalar(1 + 0.1 * Math.sin(t * 5 + i));
            });
            if (fx.beacon) {
              fx.beacon.visible = active;
              setFxColor(fx.beacon, activeColor);
              fx.beacon.material.opacity = active ? pulseOpacity(0.22, 0.58, t, 7) : 0;
            }
          }
          break;
        case 'cctv':
          {
            // IR LEDs are bright, slightly breathing; no PointLight or forced front rendering.
            // Normal state remains green, warning/error states switch the small status LED.
            const irOpacity = 0.84 + 0.12 * (0.5 + 0.5 * Math.sin(t * 2.15 + fx.phase));
            fx.irLeds?.forEach(led => {
              led.material.opacity = irOpacity;
            });
            if (fx.halo)
              fx.halo.material.opacity = 0.15 + 0.11 * (0.5 + 0.5 * Math.sin(t * 2.15 + fx.phase));
            if (fx.statusLed)
              fx.statusLed.material.color.setHex(
                critical ? 0xff5e69 : active ? 0xffc56a : 0x55edac
              );
          }
          break;
        case 'security':
          {
            fx.gateLeds?.forEach((led, i) => {
              setFxColor(
                led,
                active && (Math.floor(t * 10) + i) % 2 === 0
                  ? pulseCritical
                  : active
                    ? pulseWarn
                    : 0x59e2bb
              );
              led.material.opacity = active ? pulseOpacity(0.32, 0.55, t, 9, i) : 0.96;
            });
            if (fx.warningPanel) {
              fx.warningPanel.visible = active;
              setFxColor(fx.warningPanel, pulseCritical);
              fx.warningPanel.material.opacity = active ? pulseOpacity(0.06, 0.14, t, 10) : 0;
            }
          }
          break;
        case 'videoWall':
          {
            fx.faultTiles?.forEach((tile, i) => {
              const show = active;
              tile.visible = show;
              setFxColor(
                tile,
                critical && (Math.floor(t * 7) + i) % 2 === 0 ? pulseCritical : 0x203040
              );
              tile.material.opacity = show
                ? critical
                  ? pulseOpacity(0.12, 0.25, t, 7, i)
                  : 0.18
                : 0;
            });
            if (fx.headerStrip) {
              fx.headerStrip.visible = active;
              setFxColor(fx.headerStrip, activeColor);
              fx.headerStrip.material.opacity = active ? (critical ? 0.42 : 0.24) : 0;
            }
          }
          break;
        case 'operatorConsole':
          {
            if (fx.statusStrip) {
              fx.statusStrip.visible = active;
              setFxColor(fx.statusStrip, activeColor);
              fx.statusStrip.material.opacity = active ? (critical ? 0.38 : 0.24) : 0;
            }
            if (fx.deskBeacon) {
              fx.deskBeacon.visible = active;
              setFxColor(fx.deskBeacon, activeColor);
              fx.deskBeacon.material.opacity = active ? pulseOpacity(0.16, 0.48, t, 6) : 0;
            }
          }
          break;
      }
    }
  }
  let animationFrameId;
  function draw() {
    animationFrameId = requestAnimationFrame(draw);
    const dt = Math.min(clock.getDelta(), 0.05),
      t = clock.elapsedTime;
    for (const key of floorList)
      floorGroups[key].position.y = THREE.MathUtils.damp(
        floorGroups[key].position.y,
        floorTargets[key],
        5,
        dt
      );
    if (focusTween) {
      const pct = clamp((performance.now() - focusTween.started) / focusTween.duration, 0, 1);
      const eased = pct < 0.5 ? 4 * pct * pct * pct : 1 - Math.pow(-2 * pct + 2, 3) / 2;
      camera.position.lerpVectors(focusTween.fromPos, focusTween.toPos, eased);
      controls.target.lerpVectors(focusTween.fromTarget, focusTween.toTarget, eased);
      if (pct >= 1) focusTween = null;
    }
    controls.update();
    for (const d of doors) {
      const drawers = engineeringDrawers
        .filter(entry => entry.door === d)
        .map(entry => entry.group);
      animateRackMechanism(d.hinge, drawers, d.open, dt);
    }
    for (const agent of aiAgents.values())
      if (agent.root.visible) animateOperatorRig(agent.root, agent, t, agentIsBusy(agent));
    for (const l of leds) {
      const status = getAssetStatus(registry.get(l.id));
      l.mesh.visible = severityRank(status) === 3 ? Math.sin(t * 8) > -0.05 : true;
    }
    for (const o of issueMeshes.values()) {
      o.orb.scale.setScalar(o.primary ? 1 + Math.sin(t * 5) * 0.18 : 1);
      o.ring.material.opacity = 0.66 + 0.2 * Math.sin(t * 3);
    }
    for (const strip of floorAlertOutlines.values())
      if (strip.visible) strip.material.opacity = 0.53 + 0.34 * Math.sin(t * 2.7);
    updateUtilityRisers(t); // Follow the current interpolated floor positions during the separation animation.
    if (currentMode === 'thermal' && activeIncidents.size) {
      for (const disk of heatDisks) {
        const a = registry.get(disk.entityId);
        if (getSensor(a).temp > 31) disk.mesh.material.opacity = 0.45 + Math.sin(t * 4) * 0.12;
      }
    }
    const selected = selectedId && registry.get(selectedId);
    selectedHalo.visible = Boolean(selected);
    if (selected) {
      const v = assetWorldPoint(selected);
      selectedHalo.position.set(v.x, v.y + 0.07, v.z);
      selectedHalo.material.color.setHex(getAssetStatus(selected) === '장애' ? 0xff6872 : 0x69e2f2);
      selectedHalo.rotation.z = t * 0.3;
    }
    updateDistanceDetails();
    updateLabels();
    updateAlertLabels();
    syncDeviceFx(t);
    updateEngineeringFx(t);
    renderer.render(scene, camera);
    renderAssetPreview(dt);
  }
  function refreshClock() {
    const d = new Date();
    $('#clock').textContent = new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d);
  }
  refreshClock();
  const clockInterval = window.setInterval(refreshClock, 1000);
  updateFloorLayout();
  updateInspector();
  updateSummary();
  updateAgentShortcuts();
  syncModeControls();
  applyAgentVisibility(agentsVisible);
  controls.autoRotate = autoRotate;
  $('#btn-auto').classList.toggle('is-on', autoRotate);
  renderScenarioPanel();
  renderIncidentOverlay();
  updateNocWall();
  resize();
  loadRealHumanLibrary();
  const loading = $('#loading');
  loading.remove();
  draw();
  console.info('[KNU AIDC Three.js V40] initialized', {
    assets: initialRegistryCount,
    floors: floorList,
    regions: Object.keys(zones).length,
  });

  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    window.clearInterval(clockInterval);
    window.removeEventListener('keydown', handleGlobalKeydown);
    window.removeEventListener('resize', resize);
    window.removeEventListener('resize', resizeAssetPreview);
    resizeObserver.disconnect();
    unsubscribeTwinStore();
    controls.dispose();
    renderer.dispose();
    modalPreviewControls?.dispose();
    modalPreviewRenderer?.dispose();
    renderer.domElement.remove();
  };
}
