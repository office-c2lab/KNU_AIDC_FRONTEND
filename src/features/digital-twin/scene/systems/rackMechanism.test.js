import test from 'node:test';
import assert from 'node:assert/strict';
import { Group } from 'three';
import { animateRackMechanism, syncRackPreview } from './rackMechanism.js';

function rack() {
  const door = { hinge: new Group(), open: false };
  const console = { group: new Group(), screenPivot: new Group(), door };
  console.group.position.y = 0.9305;
  console.screenPivot.rotation.x = Math.PI / 2;
  const compute = { group: new Group(), open: false, door };
  compute.group.position.y = 1.8;
  return { door, console, compute, drawers: [console, compute] };
}

function preview(source) {
  return {
    hinge: new Group(),
    drawers: source.drawers.map(record => ({
      source: record,
      group: new Group(),
      screenPivot: record.screenPivot ? new Group() : null,
    })),
  };
}

function advance(source, frames = 1) {
  for (let i = 0; i < frames; i++)
    animateRackMechanism(source.door.hinge, source.drawers, source.door.open, 1 / 60);
}

function assertSynced(source, view) {
  assert.deepEqual(view.hinge.rotation.toArray(), source.door.hinge.rotation.toArray());
  for (const record of view.drawers) {
    assert.deepEqual(record.group.position.toArray(), record.source.group.position.toArray());
    if (record.screenPivot)
      assert.deepEqual(
        record.screenPivot.rotation.toArray(),
        record.source.screenPivot.rotation.toArray()
      );
  }
}

test('detail mirrors source transforms exactly through opening, closing and reversal', () => {
  const source = rack();
  const view = preview(source);
  for (let frame = 0; frame < 360; frame++) {
    if (frame === 0 || frame === 165) {
      source.door.open = true;
      source.compute.open = true;
    }
    if (frame === 110 || frame === 250) {
      source.door.open = false;
      source.compute.open = false;
    }
    animateRackMechanism(
      source.door.hinge,
      source.drawers,
      source.door.open,
      frame % 3 ? 1 / 60 : 0.04
    );
    syncRackPreview(source.door, view.hinge, view.drawers);
    assertSynced(source, view);
  }
});

test('leaving an open detail and reopening it during closure preserves the current mechanism state', () => {
  const source = rack();
  source.door.open = true;
  source.compute.open = true;
  advance(source, 180);
  assert.ok(source.console.group.position.z > 1.1);
  assert.ok(source.console.screenPivot.rotation.x < 0);
  assert.ok(source.compute.group.position.z > 0.6);

  // Closing a detail discards only its clone; the source rack remains open.
  let view = preview(source);
  syncRackPreview(source.door, view.hinge, view.drawers);
  assertSynced(source, view);
  advance(source, 30);
  assert.equal(source.door.open, true);
  source.door.open = false;
  source.compute.open = false;
  advance(source, 16);
  view = preview(source);
  syncRackPreview(source.door, view.hinge, view.drawers);
  assertSynced(source, view);
  assert.ok(source.console.screenPivot.rotation.x > 0);
  assert.ok(source.console.group.position.z > 1.04, 'console remains extended while LCD folds');

  advance(source, 240);
  syncRackPreview(source.door, view.hinge, view.drawers);
  assertSynced(source, view);
  assert.ok(Math.abs(source.door.hinge.rotation.y) < 0.001);
  assert.ok(source.drawers.every(record => record.group.position.z < 0.001));
  assert.ok(Math.abs(source.console.screenPivot.rotation.x - Math.PI / 2) < 0.001);
});

test('closing keeps the door open until drawers retract and the LCD folds before the console retracts', () => {
  const source = rack();
  source.door.open = true;
  source.compute.open = true;
  advance(source, 180);
  source.door.open = false;
  source.compute.open = false;
  for (let frame = 0; frame < 240; frame++) {
    const previousDoor = Math.abs(source.door.hinge.rotation.y);
    const extended = source.drawers.some(record => record.group.position.z > 0.035);
    const previousConsole = source.console.group.position.z;
    advance(source);
    const folded = Math.abs(source.console.screenPivot.rotation.x - Math.PI / 2) < 0.08;
    if (extended) assert.ok(Math.abs(source.door.hinge.rotation.y) >= previousDoor - 1e-10);
    if (!folded && previousConsole > 1.04)
      assert.ok(source.console.group.position.z >= previousConsole - 1e-10);
  }
});
