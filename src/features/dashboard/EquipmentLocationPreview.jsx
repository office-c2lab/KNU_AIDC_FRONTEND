import { useEffect, useRef, useState } from 'react';

export default function EquipmentLocationPreview({ source, asset }) {
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const assetIdRef = useRef(asset.id);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    assetIdRef.current = asset.id;
    const frame = requestAnimationFrame(() => {
      if (!viewerRef.current) return;
      try {
        viewerRef.current.setAsset(asset.id);
        setFailed(false);
      } catch {
        setFailed(true);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [asset.id]);
  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    let viewer;
    import('./createEquipmentLocationPreview.js')
      .then(({ createEquipmentLocationPreview }) => {
        if (cancelled) return;
        viewer = createEquipmentLocationPreview(canvasRef.current, source);
        viewerRef.current = viewer;
        viewer.setAsset(assetIdRef.current);
        setFailed(false);
      })
      .catch(error => {
        if (cancelled) return;
        viewer?.dispose();
        viewer = null;
        viewerRef.current = null;
        console.error('설비 위치 3D 미리보기 초기화 실패', error);
        setFailed(true);
      });
    return () => {
      cancelled = true;
      viewer?.dispose();
      viewerRef.current = null;
    };
  }, [source]);
  return (
    <div className="equipment-location-preview">
      <div
        className="equipment-location-canvas"
        ref={canvasRef}
        aria-label={`${asset.name}의 실제 배치와 위치 핀을 보여주는 3D 층 미니어처. 드래그로 회전할 수 있습니다.`}
      />
      {(!source || failed) && (
        <p role="status">{failed ? '위치 모델을 표시할 수 없습니다.' : '위치 모델 준비 중…'}</p>
      )}
    </div>
  );
}
