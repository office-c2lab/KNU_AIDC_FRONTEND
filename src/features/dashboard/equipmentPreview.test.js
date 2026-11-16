import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { initDigitalTwin } from '../digital-twin/scene/runtime/createDigitalTwinRuntime.js';
import { DEFAULT_ASSET_CATALOG } from '../digital-twin/scene/config/assetCatalog.js';
import { digitalTwinStore } from '../../stores/digitalTwinStore.js';

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
