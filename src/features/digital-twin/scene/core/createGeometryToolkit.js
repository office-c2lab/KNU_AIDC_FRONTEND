export function createGeometryToolkit({ THREE, RoundedBoxGeometry, deviceFx }) {
  function mat(color, metalness = 0.1, roughness = 0.5, emissive = 0x000000, intensity = 0) {
    return new THREE.MeshStandardMaterial({
      color,
      metalness,
      roughness,
      emissive,
      emissiveIntensity: intensity,
    });
  }
  const M = {
    floor: mat(0x304b60, 0.26, 0.73),
    tile: mat(0x3c576b, 0.25, 0.7),
    dark: mat(0x142739, 0.36, 0.62),
    cabinet: mat(0x283b4b, 0.65, 0.29),
    edge: mat(0x819baa, 0.7, 0.3),
    black: mat(0x101a26, 0.46, 0.32),
    vent: mat(0x4b6977, 0.4, 0.45),
    server: mat(0x203141, 0.65, 0.31),
    brushed: mat(0x9cb4bf, 0.72, 0.34),
    screen: mat(0x0b2534, 0.13, 0.22, 0x0a7c9d, 0.3),
    gold: mat(0xa87b4c, 0.6, 0.35),
    cool: mat(0x5c99a7, 0.53, 0.32),
    tube: mat(0x5ca9bc, 0.72, 0.3),
    purple: mat(0x655ab5, 0.4, 0.34),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x83a9bb,
      metalness: 0.04,
      roughness: 0.1,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    accent: new THREE.MeshBasicMaterial({ color: 0x67e0f3 }),
    green: new THREE.MeshBasicMaterial({ color: 0x46e5ac }),
    warning: new THREE.MeshBasicMaterial({ color: 0xf8ba70 }),
    error: new THREE.MeshBasicMaterial({ color: 0xff6f7b }),
    steel: mat(0x41596a, 0.58, 0.36),
    wall: mat(0x738c9d, 0.33, 0.52),
  };
  const geometryCache = new Map();
  const glowCache = new Map();
  function box(parent, w, h, d, x, y, z, material = M.cabinet, opts = {}) {
    const cacheKey = `${w}/${h}/${d}/${opts.rounded ? 'r' : 'b'}`;
    let geo = geometryCache.get(cacheKey);
    if (!geo) {
      geo = opts.rounded
        ? new RoundedBoxGeometry(w, h, d, 2, Math.min(0.09, w * 0.15, h * 0.15, d * 0.15))
        : new THREE.BoxGeometry(w, h, d);
      geometryCache.set(cacheKey, geo);
    }
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = opts.cast !== false && w * h * d > 0.025;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function instanceBoxes(parent, w, h, d, positions, material) {
    if (!positions.length) return null;
    const key = `${w}/${h}/${d}/b`;
    let geo = geometryCache.get(key);
    if (!geo) {
      geo = new THREE.BoxGeometry(w, h, d);
      geometryCache.set(key, geo);
    }
    const mesh = new THREE.InstancedMesh(geo, material, positions.length),
      matrix = new THREE.Matrix4();
    positions.forEach((p, i) => {
      matrix.makeTranslation(p[0], p[1], p[2]);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(parent, r, h, x, y, z, material, segments = 24) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function addEdges(parent, mesh, color = 0x75a4b5, opacity = 0.28) {
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity })
    );
    edge.position.copy(mesh.position);
    edge.rotation.copy(mesh.rotation);
    edge.scale.copy(mesh.scale);
    parent.add(edge);
    return edge;
  }
  function pipe(parent, points, r = 0.07, color = 0x75ddec, seg = 36) {
    const curve = new THREE.CatmullRomCurve3(points.map(v => new THREE.Vector3(...v)));
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, seg, r, 8, false),
      mat(color, 0.7, 0.28)
    );
    parent.add(mesh);
    mesh.castShadow = true;
    return { curve, mesh };
  }
  function line(parent, start, end, color = 0x5e94b0, opacity = 0.6) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...start),
      new THREE.Vector3(...end),
    ]);
    const ln = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity })
    );
    parent.add(ln);
    return ln;
  }
  function glowStrip(parent, w, h, d, x, y, z, color = 0x7bdbea) {
    if (!glowCache.has(color)) glowCache.set(color, new THREE.MeshBasicMaterial({ color }));
    return box(parent, w, h, d, x, y, z, glowCache.get(color), { cast: false });
  }
  function makeText(text, color = '#d3f4ff', bg = '#193449') {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 384, 96);
    ctx.fillStyle = color;
    ctx.font = '800 36px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 192, 48);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
  }
  function textPlate(parent, text, x, y, z, w = 1.4, h = 0.33, color = '#d3f4ff', bg = '#193449') {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), makeText(text, color, bg));
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function fxLed(parent, w, h, d, x, y, z, color = 0x66e8c8) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.96,
        depthTest: true,
        depthWrite: false,
      })
    );
    mesh.position.set(x, y, z);
    mesh.renderOrder = 0;
    parent.add(mesh);
    return mesh;
  }
  function fxPlane(parent, w, h, x, y, z, color = 0xff6c77, opacity = 0.7) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
      })
    );
    mesh.position.set(x, y, z);
    mesh.renderOrder = 0;
    parent.add(mesh);
    return mesh;
  }
  function fxSphere(parent, r, x, y, z, color = 0xff6c77, opacity = 0.92) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(r, 18, 16),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthTest: true,
        depthWrite: false,
      })
    );
    mesh.position.set(x, y, z);
    mesh.renderOrder = 0;
    parent.add(mesh);
    return mesh;
  }
  function registerFx(id, data) {
    deviceFx.set(id, data);
    return data;
  }
  function setFxColor(target, color) {
    if (!target) return;
    const setOne = obj => {
      if (obj?.material?.color) obj.material.color.setHex(color);
    };
    Array.isArray(target) ? target.forEach(setOne) : setOne(target);
  }
  function pulseOpacity(base, amp, time, speed = 6, phase = 0) {
    return base + amp * (0.5 + 0.5 * Math.sin(time * speed + phase));
  }
  function getScenarioIds(issues) {
    return issues.map(x => x.scenario.id);
  }

  return {
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
  };
}
