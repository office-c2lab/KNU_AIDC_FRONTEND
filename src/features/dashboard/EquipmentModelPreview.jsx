import { useEffect, useRef, useState } from 'react';

export default function EquipmentModelPreview({ asset }) {
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const assetIdRef = useRef(asset.id);
  const [state, setState] = useState('loading');

  useEffect(() => {
    assetIdRef.current = asset.id;
    const frame = requestAnimationFrame(() => {
      if (!viewerRef.current) return;
      try {
        viewerRef.current.setAsset(asset.id);
        setState('ready');
      } catch {
        setState('error');
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [asset.id]);

  useEffect(() => {
    let cancelled = false;
    import('./createEquipmentPreview.js')
      .then(({ createEquipmentPreview }) => {
        if (cancelled) return;
        const viewer = createEquipmentPreview(canvasRef.current);
        viewerRef.current = viewer;
        viewer.setAsset(assetIdRef.current);
        setState('ready');
      })
      .catch(error => {
        if (cancelled) return;
        viewerRef.current?.dispose();
        viewerRef.current = null;
        console.error('설비 3D 미리보기 초기화 실패', error);
        setState('error');
      });
    return () => {
      cancelled = true;
      viewerRef.current?.dispose();
      viewerRef.current = null;
    };
  }, []);

  return (
    <div className="equipment-model-preview">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        aria-label={`${asset.name} 3D 모델. 드래그로 회전, 휠로 확대할 수 있습니다.`}
      />
      {state !== 'ready' && (
        <p role="status">
          {state === 'loading' ? '3D 모델 준비 중…' : '3D 모델을 표시할 수 없습니다.'}
        </p>
      )}
      {state === 'ready' && <small>드래그 회전 · 휠 확대</small>}
    </div>
  );
}
