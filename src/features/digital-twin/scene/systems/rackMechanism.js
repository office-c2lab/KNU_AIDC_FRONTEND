import { MathUtils } from 'three';

// Advance the source rack once per frame: door, drawer, then LCD. Close in reverse.
export function animateRackMechanism(hinge, drawerRecords, open, dt) {
  if (!hinge) return;
  const safeDt = Math.min(Math.max(dt || 0, 0), 0.05);
  const records = drawerRecords.map(record => (record?.group ? record : { group: record }));
  const hasExtendedDrawer = records.some(record => record.group.position.z > 0.035);
  const doorTarget = open || hasExtendedDrawer ? -(Math.PI * 0.62) : 0;
  hinge.rotation.y = MathUtils.damp(hinge.rotation.y, doorTarget, 8, safeDt);
  for (const record of records) {
    const screen = record.screenPivot;
    const requestedOpen = open && (screen ? true : (record.source || record).open === true);
    const mayExtend = requestedOpen && Math.abs(hinge.rotation.y) > 1.03;
    const clearance = screen ? 1.04 : 0.54;
    const screenTarget = requestedOpen && record.group.position.z > clearance ? -0.08 : Math.PI / 2;
    if (screen) screen.rotation.x = MathUtils.damp(screen.rotation.x, screenTarget, 7.5, safeDt);
    const screenFolded = !screen || Math.abs(screen.rotation.x - Math.PI / 2) < 0.08;
    const keepOutWhileFolding =
      !requestedOpen && !screenFolded && record.group.position.z > clearance;
    const drawerTarget = mayExtend || keepOutWhileFolding ? (screen ? 1.15 : 0.65) : 0;
    record.group.position.z = MathUtils.damp(record.group.position.z, drawerTarget, 7.5, safeDt);
  }
}

// A preview is a view of the source mechanism, never a second animation clock.
export function syncRackPreview(door, previewHinge, previewDrawers) {
  if (!door || !previewHinge) return;
  previewHinge.rotation.copy(door.hinge.rotation);
  for (const record of previewDrawers) {
    if (!record.source || !record.group) continue;
    record.group.position.copy(record.source.group.position);
    if (record.screenPivot && record.source.screenPivot)
      record.screenPivot.rotation.copy(record.source.screenPivot.rotation);
  }
}
