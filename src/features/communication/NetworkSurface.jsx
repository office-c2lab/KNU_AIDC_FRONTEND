import { uiClass } from '../../styles/interfaceStyles.js';
import { useEffect, useRef } from 'react';
export default function NetworkSurface({ mode, projection, onReady }) {
  const canvasRef = useRef(null);
  const surfaceRef = useRef(null);
  const latestRef = useRef({
    mode,
    projection,
  });
  useEffect(() => {
    latestRef.current = {
      mode,
      projection,
    };
    surfaceRef.current?.update(latestRef.current);
  }, [mode, projection]);
  useEffect(() => {
    let cancelled = false;
    let surface;
    const canvas = canvasRef.current;
    const onContextLost = event => {
      event.preventDefault();
      onReady(false);
    };
    const onContextRestored = () => {
      if (surface) {
        surface.update(latestRef.current);
        onReady(true);
      }
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);
    const observer = new ResizeObserver(() => surface?.update(latestRef.current));
    observer.observe(canvas.parentElement);
    import('./createNetworkSurface.js')
      .then(({ createNetworkSurface }) => (cancelled ? null : createNetworkSurface(canvas)))
      .then(result => {
        if (!result) return;
        if (cancelled) {
          result.dispose();
          return;
        }
        surface = result;
        surfaceRef.current = surface;
        surface.update(latestRef.current);
        onReady(true);
      })
      .catch(error => {
        surface?.dispose();
        surfaceRef.current = null;
        if (!cancelled) {
          onReady(false);
          console.warn('지구 표면 렌더링을 사용할 수 없어 벡터 지도를 표시합니다.', error);
        }
      });
    return () => {
      cancelled = true;
      observer.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      surface?.dispose();
      surfaceRef.current = null;
    };
  }, [onReady]);
  return <canvas ref={canvasRef} className={uiClass('network-earth-surface')} aria-hidden="true" />;
}
