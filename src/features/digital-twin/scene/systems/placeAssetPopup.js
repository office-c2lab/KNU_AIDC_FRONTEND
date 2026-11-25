// Place the card entirely outside the selected equipment's projected rectangle.
export function placeAssetPopup(bounds, card, viewport) {
  const gap = 28;
  const margin = { left: 16, right: viewport.width - 16, top: 104, bottom: viewport.height - 100 };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const centerX = (bounds.left + bounds.right) / 2;
  const centerY = (bounds.top + bounds.bottom) / 2;
  const left = clamp(centerX - card.width / 2, margin.left, margin.right - card.width);
  const top = clamp(centerY - card.height / 2, margin.top, margin.bottom - card.height);
  const candidates = [
    { side: 'right', left: bounds.right + gap, top },
    { side: 'left', left: bounds.left - gap - card.width, top },
    { side: 'top', left, top: bounds.top - gap - card.height },
    { side: 'bottom', left, top: bounds.bottom + gap },
  ];
  if (bounds.left - margin.left > margin.right - bounds.right) {
    [candidates[0], candidates[1]] = [candidates[1], candidates[0]];
  }
  return (
    candidates.find(
      candidate =>
        candidate.left >= margin.left &&
        candidate.top >= margin.top &&
        candidate.left + card.width <= margin.right &&
        candidate.top + card.height <= margin.bottom
    ) ?? null
  );
}
