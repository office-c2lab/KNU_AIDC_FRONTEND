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
    getAssetModalId,
    mountAssetPreview,
    registry,
    updateAssetModal,
  } = context;
  const $ = query;
  // KNU AIDC V40: four distinct CC0 MakeHuman-derived humans, reused across seven roles.
  // Models include skin/clothing textures and native idle skeletal animations.
  // They are loaded from the official Innerscene public model library. Because the
  // Human GLB assets remain external to keep the application bundle lightweight.
  const REAL_HUMAN_LIBRARY = {
    jordan: {
      url: 'https://files.innerscene.com/library/idle-standing-jordan-3d-person-animated-1721c58f/1eda105547d9d25895f3/idle-standing-jordan-3d-person-animated.glb',
      page: 'https://www.innerscene.com/tools/library/3d-parts/idle-standing-jordan-3d-person-animated-1721c58f',
      size: '22.6 MB',
    },
    maya: {
      url: 'https://files.innerscene.com/library/idle-standing-maya-3d-person-animated-22b686d6/c3dbeb4f797ae0f00fce/idle-standing-maya-3d-person-animated.glb',
      page: 'https://www.innerscene.com/tools/library/3d-parts/idle-standing-maya-3d-person-animated-22b686d6',
      size: '19.6 MB',
    },
    harper: {
      url: 'https://files.innerscene.com/library/idle-standing-harper-3d-person-animated-ba9bc23f/a63c5f1eaa80d52e65c6/idle-standing-harper-3d-person-animated.glb',
      page: 'https://www.innerscene.com/tools/library/3d-parts/idle-standing-harper-3d-person-animated-ba9bc23f',
      size: '17.9 MB',
    },
    sam: {
      url: 'https://files.innerscene.com/library/idle-standing-sam-3d-person-animated-1f9f1217/4ca6054a9945f1c21da5/idle-standing-sam-3d-person-animated.glb',
      page: 'https://www.innerscene.com/tools/library/3d-parts/idle-standing-sam-3d-person-animated-1f9f1217',
      size: '20.1 MB',
    },
  };
  const AGENT_HUMAN_MAP = {
    'AI-SEC-01': 'harper',
    'AI-NET-01': 'sam',
    'AI-GPU-01': 'maya',
    'AI-NOC-01': 'jordan',
    'AI-SOC-01': 'harper',
    'AI-PWR-01': 'sam',
    'AI-CLG-01': 'maya',
  };
  const humanGltfLoader = new GLTFLoader();
  const humanTemplateCache = new Map();
  const humanAvatarStatus = { loaded: 0, total: 7, failed: 0 };
  function humanStatusText() {
    const el = $('#agent-human-loading');
    if (!el) return;
    el.classList.toggle('is-ready', humanAvatarStatus.loaded === 7);
    el.classList.toggle('is-error', humanAvatarStatus.failed > 0);
    if (humanAvatarStatus.loaded === 7) {
      el.textContent = '실사형 3D 인체 모델 7명 적용 · 모의 관제';
    } else if (humanAvatarStatus.failed) {
      el.textContent = `실사형 ${humanAvatarStatus.loaded}/7명 적용 · ${humanAvatarStatus.failed}명은 기존 모델로 대체 표시 (연결 확인)`;
    } else
      el.textContent = `실사형 3D 인체 모델 로딩 ${humanAvatarStatus.loaded}/7명 · 첫 실행 시 대용량 다운로드`;
  }
  function mountRealHuman(agent, gltf, avatarKey) {
    if (!agent || !gltf?.scene) return false;
    // SkeletonUtils copies skinned bones correctly, unlike Object3D.clone(true).
    const human = cloneSkinnedModel(gltf.scene);
    const bounds = new THREE.Box3().setFromObject(human, true);
    const dimensions = bounds.getSize(new THREE.Vector3());
    if (!Number.isFinite(dimensions.y) || dimensions.y < 0.1) return false;
    const pivot = new THREE.Group();
    pivot.name = 'agent-human-model';
    const scale = 1.73 / dimensions.y;
    const center = bounds.getCenter(new THREE.Vector3());
    human.scale.setScalar(scale);
    human.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    human.traverse(part => {
      if (part.isMesh) {
        part.castShadow = true;
        part.receiveShadow = true;
      }
      if (part.isSkinnedMesh) part.frustumCulled = false; // skeletal animation modifies bounds.
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
    prepareEquipmentPickBounds(); // refresh clickable dimensions for actual full-body geometry.
    if (getAssetModalId() === agent.id && !$('#asset-modal').hidden) {
      mountAssetPreview(registry.get(agent.id));
      updateAssetModal();
    }
    return true;
  }
  function loadRealHumanLibrary() {
    humanStatusText();
    const all = Object.entries(REAL_HUMAN_LIBRARY);
    // A single network load per character, then independent skeletal clones per operator.
    for (const [key, entry] of all) {
      const sources = [entry.url];
      if (location.protocol !== 'file:' && location.search.includes('localModels=1'))
        sources.unshift('/digital-twin/assets/humans/' + key + '.glb');
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
      promise
        .then(gltf => {
          for (const cfg of AI_AGENT_CONFIG) {
            if (AGENT_HUMAN_MAP[cfg.id] !== key) continue;
            const agent = aiAgents.get(cfg.id);
            try {
              if (mountRealHuman(agent, gltf, key)) humanAvatarStatus.loaded++;
              else humanAvatarStatus.failed++;
            } catch (err) {
              console.warn('[KNU AIDC] 인체 모델 배치 실패', cfg.id, err);
              humanAvatarStatus.failed++;
            }
            humanStatusText();
          }
        })
        .catch(error => {
          console.warn('[KNU AIDC] 실사형 3D 모델 로딩 실패; 대체 모델 사용', key, error);
          humanAvatarStatus.failed += AI_AGENT_CONFIG.filter(
            c => AGENT_HUMAN_MAP[c.id] === key
          ).length;
          humanStatusText();
        });
    }
  }

  return { loadRealHumanLibrary };
}
