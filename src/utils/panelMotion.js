const easeOut = [0.22, 1, 0.36, 1];

export function panelEntrance({ x = 0, y = 18, delay = 0 } = {}) {
  return {
    initial: { opacity: 0, x, y, scale: 0.985 },
    animate: { opacity: 1, x: 0, y: 0, scale: 1 },
    transition: { duration: 0.48, delay, ease: easeOut },
  };
}
