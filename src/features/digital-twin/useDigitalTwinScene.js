import { useEffect, useRef } from 'react';

export default function useDigitalTwinScene(enabled = true) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let disposeScene;
    let firstFrame;
    let secondFrame;

    const initialize = () =>
      import('./scene.js')
        .then(({ initDigitalTwin }) => {
          if (active && rootRef.current) {
            disposeScene = initDigitalTwin(rootRef.current);
          }
        })
        .catch(error => {
          if (!active) return;

          const loading = rootRef.current?.querySelector('#loading');
          if (loading) {
            loading.classList.add('error');
            loading.innerHTML = `<strong>3D 화면 초기화 실패</strong><span>${error.message}</span>`;
          }
          console.error('[KNU AIDC] Three.js scene initialization failed', error);
        });

    // Let the static UI paint before importing/building the heavy scene.
    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(initialize);
    });

    return () => {
      active = false;
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      disposeScene?.();
    };
  }, [enabled]);

  return rootRef;
}
