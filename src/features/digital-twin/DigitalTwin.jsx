import { useEffect, useRef } from 'react';
import DigitalTwinMarkup from './DigitalTwinMarkup.jsx';
import './digital-twin.css';

export default function DigitalTwin() {
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

  return (
    <main ref={rootRef} className="digital-twin-root">
      <DigitalTwinMarkup />
    </main>
  );
}
