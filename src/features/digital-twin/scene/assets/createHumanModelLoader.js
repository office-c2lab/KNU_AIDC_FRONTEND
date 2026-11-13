import { assertContext } from '../core/assertContext.js';

export function createHumanModelLoader(context) {
  assertContext(
    context,
    [
      'THREE',
      'GLTFLoader',
      'cloneSkinnedModel',
      'query',
      'aiAgents',
      'AI_AGENT_CONFIG',
      'prepareEquipmentPickBounds',
      'isDisposed',
      'mountAssetPreview',
      'registry',
      'updateAssetModal',
    ],
    'createHumanModelLoader'
  );
  const {
    THREE,
    GLTFLoader,
    cloneSkinnedModel,
    query,
    aiAgents,
    AI_AGENT_CONFIG,
    prepareEquipmentPickBounds,
    isDisposed,
    getAssetModalId,
    mountAssetPreview,
    registry,
    updateAssetModal,
  } = context;
  const $ = query;
  // Approved GLBs are shown for all seven roles. Until a GLB is ready (or when
  // it fails), only the location marker remains — no procedural character.
  const REAL_HUMAN_LIBRARY = {
    technician: {
      url: 'https://files.innerscene.com/library/drew-3d-person-construction-worker-with-hard-hat-and-hi-vis-a4aa98af/f241b97e471bb3c1b95a/drew-3d-person-construction-worker-with-hard-hat-and-hi-vis.glb',
      page: 'https://www.innerscene.com/tools/library/3d-parts/drew-3d-person-construction-worker-with-hard-hat-and-hi-vis-a4aa98af',
      size: '22.8 MB',
    },
    security: {
      url: 'https://files.innerscene.com/library/drew-3d-person-security-guard-in-unmarked-uniform-b3c77830/8bd52a033eabe4ee207d/drew-3d-person-security-guard-in-unmarked-uniform.glb',
      page: 'https://www.innerscene.com/tools/library/3d-parts/drew-3d-person-security-guard-in-unmarked-uniform-b3c77830',
      size: '14.4 MB',
    },
    jordan: {
      url: 'https://files.innerscene.com/library/idle-standing-jordan-3d-person-animated-1721c58f/1eda105547d9d25895f3/idle-standing-jordan-3d-person-animated.glb',
      page: 'https://www.innerscene.com/tools/library/3d-parts/idle-standing-jordan-3d-person-animated-1721c58f',
      size: '22.6 MB',
    },
    harper: {
      url: 'https://files.innerscene.com/library/idle-standing-harper-3d-person-animated-ba9bc23f/a63c5f1eaa80d52e65c6/idle-standing-harper-3d-person-animated.glb',
      page: 'https://www.innerscene.com/tools/library/3d-parts/idle-standing-harper-3d-person-animated-ba9bc23f',
      size: '17.9 MB',
    },
  };
  const AGENT_HUMAN_MAP = {
    'AI-SEC-01': 'security',
    'AI-NET-01': 'technician',
    'AI-GPU-01': 'technician',
    'AI-NOC-01': 'jordan',
    'AI-SOC-01': 'harper',
    'AI-PWR-01': 'technician',
    'AI-CLG-01': 'technician',
  };
  const humanGltfLoader = new GLTFLoader();
  const humanTemplateCache = new Map();
  const humanLayoutCache = new Map();
  const localAssetVersion = 'runtime-20261113-dc2';
  const humanAvatarStatus = {
    loaded: 0,
    total: Object.keys(AGENT_HUMAN_MAP).length,
    failed: 0,
  };
  for (const cfg of AI_AGENT_CONFIG) {
    const agent = aiAgents.get(cfg.id);
    if (agent) {
      agent.realExpected = Boolean(AGENT_HUMAN_MAP[cfg.id]);
      if (agent.realExpected) agent.marker.visible = false;
    }
  }
  function humanStatusText() {
    const el = $('#agent-human-loading');
    if (!el) return;
    el.classList.toggle('is-ready', humanAvatarStatus.loaded === humanAvatarStatus.total);
    el.classList.toggle('is-error', humanAvatarStatus.failed > 0);
    if (humanAvatarStatus.loaded === humanAvatarStatus.total) {
      el.textContent = '층별 AI 운영요원 7명 적용 · 대체 캐릭터 미사용';
    } else if (humanAvatarStatus.failed) {
      el.textContent = `AI 운영요원 ${humanAvatarStatus.loaded}/${humanAvatarStatus.total}명 적용 · 실패 모델 숨김`;
    } else
      el.textContent = `AI 운영요원 ${humanAvatarStatus.loaded}/${humanAvatarStatus.total}명 · 순차 적용 중`;
  }

  function waitForNextFrame() {
    return new Promise(resolve => window.requestAnimationFrame(resolve));
  }

  let humanMountQueue = Promise.resolve();
  function enqueueHumanMount(task) {
    const queued = humanMountQueue.then(waitForNextFrame).then(task);
    // Keep the queue usable even if an individual mount unexpectedly fails.
    humanMountQueue = queued.catch(() => {});
    return queued;
  }

  function mountRealHuman(agent, gltf, avatarKey) {
    if (!agent || !gltf?.scene) return false;
    let layout = humanLayoutCache.get(avatarKey);
    if (!layout) {
      const bounds = new THREE.Box3().setFromObject(gltf.scene, true);
      const dimensions = bounds.getSize(new THREE.Vector3());
      if (!Number.isFinite(dimensions.y) || dimensions.y < 0.1) return false;
      const center = bounds.getCenter(new THREE.Vector3());
      layout = { height: dimensions.y, center: center.clone(), minY: bounds.min.y };
      humanLayoutCache.set(avatarKey, layout);
    }
    // SkeletonUtils copies skinned bones correctly, unlike Object3D.clone(true).
    const human = cloneSkinnedModel(gltf.scene);
    const pivot = new THREE.Group();
    pivot.name = 'agent-human-model';
    const scale = 1.73 / layout.height;
    human.scale.setScalar(scale);
    human.position.set(-layout.center.x * scale, -layout.minY * scale, -layout.center.z * scale);
    const revealMaterials = [];
    human.traverse(part => {
      if (part.isMesh) {
        // Avoid drawing every skinned mesh again in the directional-light
        // shadow pass. People still receive the building's scene lighting.
        part.castShadow = false;
        part.receiveShadow = true;
        const materials = Array.isArray(part.material) ? part.material : [part.material];
        const cloned = materials.map(material => {
          const nextMaterial = material.clone();
          revealMaterials.push({
            material: nextMaterial,
            opacity: nextMaterial.opacity,
            transparent: nextMaterial.transparent,
            depthWrite: nextMaterial.depthWrite,
          });
          nextMaterial.transparent = true;
          nextMaterial.depthWrite = false;
          nextMaterial.opacity = 0;
          return nextMaterial;
        });
        part.material = Array.isArray(part.material) ? cloned : cloned[0];
      }
      // The models use compact idle poses, so their supplied bounds are safe
      // and let Three.js skip people outside the camera frustum.
      if (part.isSkinnedMesh) part.frustumCulled = true;
      if (part.material && part.material.side === THREE.DoubleSide)
        part.material.side = THREE.FrontSide;
    });
    pivot.add(human);
    // Keep the small pickable status ring/beacon, remove all toy-like geometry.
    const marker = agent.marker,
      beacon = agent.beacon;
    for (const child of [...agent.direction.children]) {
      if (child !== marker && child !== beacon) agent.direction.remove(child);
    }
    agent.direction.add(pivot);
    agent.realLoaded = true;
    agent.realKey = avatarKey;
    agent.realPivot = pivot;
    agent.realClips = gltf.animations || [];
    agent.mixer = null;
    agent.mixerLastTime = 0;
    agent.mixerAccumulator = 0;
    agent.revealMaterials = revealMaterials;
    // Leave one fully transparent frame for shader/texture preparation, then
    // reveal without the abrupt first-frame pop seen during initial loading.
    agent.revealStartedAt = performance.now() + 32;
    const idle = agent.realClips.find(c => /idle|stand|rest/i.test(c.name)) || agent.realClips[0];
    if (idle) {
      const mixer = new THREE.AnimationMixer(human);
      const action = mixer.clipAction(idle);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
      // Offsetting duplicated characters avoids mechanical synchronized motion.
      const offset =
        Math.max(
          0,
          AI_AGENT_CONFIG.findIndex(a => a.id === agent.id)
        ) * 0.61;
      mixer.setTime(offset);
      agent.mixer = mixer;
    }
    marker.visible = false; // no figurine pedestal; selected halo from the existing system still works.
    prepareEquipmentPickBounds(agent.id); // refresh only this operator's clickable bounds.
    if (getAssetModalId() === agent.id && !$('#asset-modal').hidden) {
      mountAssetPreview(registry.get(agent.id));
      updateAssetModal();
    }
    return true;
  }
  async function loadRealHumanLibrary() {
    humanStatusText();
    const requiredModels = new Set(Object.values(AGENT_HUMAN_MAP));
    const all = Object.entries(REAL_HUMAN_LIBRARY).filter(([key]) => requiredModels.has(key));
    // The runtime assets are now small enough to fetch in parallel. Mounting is
    // still serialized at one operator per animation frame to avoid a long task.
    const loadAndMount = async ([key, entry]) => {
      if (isDisposed()) return;
      // Version the public URL so browsers do not reuse the former 18–24 MB files.
      const localUrl = `/digital-twin/assets/humans/${key}.glb?v=${localAssetVersion}`;
      const sources = location.protocol === 'file:' ? [entry.url] : [localUrl, entry.url];
      const next = async (index = 0) => {
        if (index >= sources.length) throw new Error('외부 모델 파일 접근 실패: ' + key);
        try {
          return await humanGltfLoader.loadAsync(sources[index]);
        } catch (e) {
          if (index + 1 < sources.length) return next(index + 1);
          throw e;
        }
      };
      const promise = next();
      humanTemplateCache.set(key, promise);
      try {
        const gltf = await promise;
        if (isDisposed()) return;
        const configs = AI_AGENT_CONFIG.filter(cfg => AGENT_HUMAN_MAP[cfg.id] === key);
        await Promise.all(
          configs.map(cfg =>
            enqueueHumanMount(() => {
              if (isDisposed()) return;
              const agent = aiAgents.get(cfg.id);
              try {
                if (mountRealHuman(agent, gltf, key)) humanAvatarStatus.loaded++;
                else humanAvatarStatus.failed++;
              } catch (err) {
                console.warn('[KNU AIDC] 인체 모델 배치 실패', cfg.id, err);
                humanAvatarStatus.failed++;
              }
              humanStatusText();
            })
          )
        );
      } catch (error) {
        console.warn('[KNU AIDC] 운영요원 GLB 로딩 실패; 해당 인체 모델 숨김', key, error);
        humanAvatarStatus.failed += AI_AGENT_CONFIG.filter(
          c => AGENT_HUMAN_MAP[c.id] === key
        ).length;
        humanStatusText();
      }
    };
    await Promise.all(all.map(loadAndMount));
  }

  return { loadRealHumanLibrary };
}
