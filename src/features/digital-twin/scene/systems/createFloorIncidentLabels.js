import * as THREE from 'three';

export function createFloorIncidentLabels({
  host,
  container,
  groups,
  outlines,
  getScenario,
  getAsset,
  onSelect,
  leftPanel,
}) {
  const entries = new Map();
  const point = new THREE.Vector3();
  const boundsByKey = new Map();
  for (const [key, outline] of outlines) {
    outline.geometry.computeBoundingBox();
    boundsByKey.set(key, outline.geometry.boundingBox.clone().translate(outline.position));
  }

  function sync(incidents) {
    const grouped = new Map();
    for (const incident of incidents) {
      const scenario = getScenario(incident.id);
      const asset = scenario && getAsset(scenario.asset);
      const key = asset?.floor || asset?.zone;
      if (!scenario || !groups[key]) continue;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push({ incident, scenario, asset });
    }
    for (const [key, entry] of entries) {
      if (!grouped.has(key)) {
        entry.button.remove();
        entries.delete(key);
      }
    }
    for (const [key, items] of grouped) {
      let entry = entries.get(key);
      if (!entry) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'floor-incident-label';
        button.dataset.incidentFloor = key;
        const heading = document.createElement('span');
        heading.className = 'floor-incident-label-heading';
        const dot = document.createElement('i');
        dot.setAttribute('aria-hidden', 'true');
        const floor = document.createElement('strong');
        const count = document.createElement('span');
        count.className = 'floor-incident-label-count';
        heading.append(dot, floor, count);
        const title = document.createElement('span');
        title.className = 'floor-incident-label-title';
        button.append(heading, title);
        entry = { button, floor, count, title, items };
        button.addEventListener('pointerdown', event => event.stopPropagation());
        button.addEventListener('click', event => {
          event.stopPropagation();
          onSelect(entry.items[0].scenario);
        });
        container.appendChild(button);
        entries.set(key, entry);
      }
      entry.items = items;
      const name = key === 'power' ? '전력동' : key === 'cooling' ? '냉각동' : key;
      const critical = items.some(item => item.scenario.status !== '주의');
      entry.button.classList.toggle('warning', !critical);
      entry.floor.textContent = `${name} ${critical ? '장애' : '주의'}`;
      entry.count.textContent = `${items.length}건`;
      const first = items[0];
      const firstTitle = first.scenario.title.includes(first.asset.id)
        ? first.scenario.title
        : `${first.asset.id} · ${first.scenario.title}`;
      entry.title.textContent = `${firstTitle}${items.length > 1 ? ` 외 ${items.length - 1}건` : ''}`;
      entry.button.title = items
        .map(item => `${item.asset.id} · ${item.scenario.title}`)
        .join('\n');
      entry.button.setAttribute(
        'aria-label',
        `${name} 시나리오 ${items.length}건, ${entry.button.title.replaceAll('\n', ', ')}, 발생 설비 보기`
      );
    }
  }

  function update(camera, activeFloor) {
    if (!entries.size) return;
    const width = host.clientWidth;
    const height = host.clientHeight;
    const hostRect = host.getBoundingClientRect();
    const panelRect = leftPanel?.getBoundingClientRect();
    const safeLeft = panelRect?.width
      ? ((panelRect.right - hostRect.left) * width) / hostRect.width + 12
      : 16;
    const placed = [];
    for (const [key, entry] of entries) {
      const group = groups[key];
      const bounds = boundsByKey.get(key);
      if (!group.visible || (activeFloor && key !== activeFloor) || !bounds) {
        entry.button.hidden = true;
        continue;
      }
      group.updateWorldMatrix(true, false);
      let minX = Infinity;
      let maxX = -Infinity;
      let anchorY = 0;
      let inFront = false;
      const middleY = (bounds.min.y + bounds.max.y) / 2;
      for (const x of [bounds.min.x, bounds.max.x]) {
        for (const z of [bounds.min.z, bounds.max.z]) {
          point.set(x, middleY, z).applyMatrix4(group.matrixWorld).project(camera);
          if (point.z <= -1 || point.z >= 1) continue;
          inFront = true;
          const screenX = (point.x * 0.5 + 0.5) * width;
          if (screenX < minX) {
            minX = screenX;
            anchorY = (-point.y * 0.5 + 0.5) * height;
          }
          maxX = Math.max(maxX, screenX);
        }
      }
      if (!inFront || maxX < safeLeft || minX > width || anchorY < 0 || anchorY > height) {
        entry.button.hidden = true;
        continue;
      }
      entry.button.hidden = false;
      const available = minX - safeLeft - 14;
      const labelWidth = Math.min(196, Math.max(130, available));
      entry.button.style.width = `${labelWidth}px`;
      entry.height ??= entry.button.offsetHeight;
      placed.push({
        entry,
        left: Math.max(safeLeft, minX - 14 - labelWidth),
        y: Math.max(112, Math.min(height - 100, anchorY)),
        height: entry.height,
      });
    }
    placed.sort((a, b) => a.y - b.y);
    let bottom = 100;
    for (const item of placed) {
      item.top = Math.max(item.y - item.height / 2, bottom + 5);
      bottom = item.top + item.height;
    }
    let limit = height - 84;
    for (let i = placed.length - 1; i >= 0; i--) {
      const item = placed[i];
      item.top = Math.min(item.top, limit - item.height);
      item.entry.button.style.transform = `translate3d(${item.left}px, ${item.top}px, 0)`;
      limit = item.top - 5;
    }
  }

  return {
    sync,
    update,
    dispose() {
      for (const entry of entries.values()) entry.button.remove();
      entries.clear();
    },
  };
}
