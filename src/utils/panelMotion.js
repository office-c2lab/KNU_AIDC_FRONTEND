const easeOut = [0.22, 1, 0.36, 1];

export function panelEntrance({ x = 0, y = 18, delay = 0, ready = true } = {}) {
  const initial = { opacity: 0, x, y };
  return {
    initial,
    animate: ready ? { opacity: 1, x: 0, y: 0 } : initial,
    transition: { duration: 0.48, delay, ease: easeOut },
  };
}
