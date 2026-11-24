import { useSyncExternalStore } from 'react';

const scaleClasses = {
  0.76: '[--ui-scale:0.76]',
  0.8: '[--ui-scale:0.8]',
  0.84: '[--ui-scale:0.84]',
  0.9: '[--ui-scale:0.9]',
};

function currentScale() {
  const { innerWidth: width, innerHeight: height } = window;
  if (width >= 931 && height <= 740) return 0.76;
  if (width >= 1101 && (width <= 1440 || height <= 800)) return 0.8;
  if (width >= 1101 && (width <= 1600 || height <= 900)) return 0.84;
  if (width >= 701 && width <= 1100) return 0.84;
  return 0.9;
}

function subscribe(listener) {
  window.addEventListener('resize', listener);
  return () => window.removeEventListener('resize', listener);
}

export function useInterfaceScale() {
  const scale = useSyncExternalStore(subscribe, currentScale, () => 0.9);
  return scaleClasses[scale];
}
