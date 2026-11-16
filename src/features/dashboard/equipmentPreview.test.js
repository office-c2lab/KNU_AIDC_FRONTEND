import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { initDigitalTwin } from '../digital-twin/scene/runtime/createDigitalTwinRuntime.js';
import { DEFAULT_ASSET_CATALOG } from '../digital-twin/scene/config/assetCatalog.js';
import { digitalTwinStore } from '../../stores/digitalTwinStore.js';
import { createEquipmentLocationModel } from './createEquipmentLocationPreview.js';

// Model construction needs text textures, not a browser or a WebGL context.
function element() {
  const gradient = { addColorStop() {} };
  const context = new Proxy(
    {},
    {
      get(target, key) {
        if (key in target) return target[key];
        if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient;
        if (key === 'measureText') return text => ({ width: String(text).length * 10 });
        return () => {};
      },
    }
  );
  return {
    dataset: {},
    style: {},
    getContext: () => context,
    querySelector: () => null,
    querySelectorAll: () => [],
    appendChild() {},
    addEventListener() {},
    replaceChildren() {},
  };
}

test('preview builds every real equipment model without changing application state', () => {
  const originalDocument = globalThis.document;
  const before = digitalTwinStore.getState();
  globalThis.document = { createElement: element };
  let library;
  try {
    library = initDigitalTwin(element(), { modelsOnly: true });
    assert.equal(library.models.size, DEFAULT_ASSET_CATALOG.length);
    assert.equal(digitalTwinStore.getState(), before);
    assert.equal(library.layout.length, DEFAULT_ASSET_CATALOG.length);
    for (const placement of library.layout) {
      assert.ok(Number.isFinite(placement.x) && Number.isFinite(placement.z), placement.id);
      assert.ok(placement.width > 0 && placement.depth > 0, placement.id);
    }
    const gpu1 = library.layout.find(item => item.id === 'GPU-01');
    const gpu3 = library.layout.find(item => item.id === 'GPU-03');
    const gpu4 = library.layout.find(item => item.id === 'GPU-04');
    assert.equal(gpu3.floor, '3F');
    assert.ok(Math.abs(gpu3.x - gpu1.x - 5) < 1e-6, 'GPU row spacing matches the scene');
    assert.ok(Math.abs(gpu4.z - gpu1.z - 8.3) < 1e-6, 'GPU aisle spacing matches the scene');
    assert.equal(library.locations.size, 6);
    for (const id of ['GATE-01', 'SRV-04', 'GPU-03', 'NOC-NET-01', 'UPS-01', 'CH-01']) {
      const miniature = createEquipmentLocationModel(library, id);
      miniature.root.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(miniature.selected, true);
      const center = bounds.getCenter(new THREE.Vector3());
      const pinPosition = miniature.pin.getWorldPosition(new THREE.Vector3());
      assert.equal(miniature.selected.userData.entityId, id);
      assert.ok(Math.abs(pinPosition.x - center.x) < 1e-6, `${id}: pin X matches equipment`);
      assert.ok(Math.abs(pinPosition.z - center.z) < 1e-6, `${id}: pin Z matches equipment`);
      assert.ok(pinPosition.y > bounds.max.y, `${id}: pin is above equipment`);
      assert.equal(library.models.get(id).parent, null, 'miniature does not move preview models');
      miniature.dispose();
    }
    for (const asset of DEFAULT_ASSET_CATALOG) {
      const model = library.models.get(asset.id);
      assert.ok(model, asset.id);
      assert.equal(model.parent, null);
      const bounds = new THREE.Box3().setFromObject(model, true);
      assert.ok(!bounds.isEmpty(), `${asset.id}: empty model`);
      assert.ok(bounds.getSize(new THREE.Vector3()).length() > 0, asset.id);
    }
    let disposed = 0;
    const geometry = library.models.get('GPU-03').children.find(child => child.geometry)?.geometry;
    assert.ok(geometry);
    geometry.addEventListener('dispose', () => {
      disposed++;
    });
    library.dispose();
    library = null;
    assert.equal(disposed, 1, 'shared geometry is disposed exactly once');
  } finally {
    library?.dispose();
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
