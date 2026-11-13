import { useEffect, useRef } from 'react';

export default function useDigitalTwinScene() {
  const rootRef = useRef(null);

  useEffect(() => {
    let active = true;
    let disposeScene;

    import('./scene.js')
      .then(({ initDigitalTwin }) => {
        if (active && rootRef.current) disposeScene = initDigitalTwin(rootRef.current);
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

    return () => {
      active = false;
      disposeScene?.();
    };
  }, []);

  return rootRef;
}
