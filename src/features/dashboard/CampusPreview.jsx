import { uiClass } from '../../styles/interfaceStyles.js';
import { useEffect, useRef, useState } from 'react';
export default function CampusPreview({ zone, onSelectZone, issues }) {
  const hostRef = useRef(null);
  const viewerRef = useRef(null);
  const latestRef = useRef({
    zone,
    issues,
    onSelectZone,
  });
  const [state, setState] = useState('loading');
  useEffect(() => {
    latestRef.current = {
      zone,
      issues,
      onSelectZone,
    };
    viewerRef.current?.update(zone, issues);
  }, [zone, issues, onSelectZone]);
  useEffect(() => {
    let cancelled = false;
    let viewer;
    import('./createCampusPreview.js')
      .then(({ createCampusPreview }) => {
        if (cancelled) return;
        viewer = createCampusPreview(hostRef.current, id => latestRef.current.onSelectZone(id));
        viewerRef.current = viewer;
        viewer.update(latestRef.current.zone, latestRef.current.issues);
        setState('ready');
      })
      .catch(error => {
        if (cancelled) return;
        viewer?.dispose();
        viewer = null;
        viewerRef.current = null;
        console.error('시설 개요 미리보기 초기화 실패', error);
        setState('error');
      });
    return () => {
      cancelled = true;
      viewer?.dispose();
      viewerRef.current = null;
    };
  }, []);
  return (
    <div className={uiClass('ops-campus-canvas')} ref={hostRef}>
      {state !== 'ready' && (
        <div className={uiClass('ops-campus-placeholder')} role="status">
          <strong>
            {state === 'loading' ? '시설 모델 준비 중' : '시설 모델을 표시할 수 없습니다'}
          </strong>
          <span>
            {state === 'loading'
              ? '디지털 트윈의 실제 설비 배치를 불러옵니다.'
              : '오른쪽 시설 목록에서 구역별 현황을 확인할 수 있습니다.'}
          </span>
        </div>
      )}
      {state === 'ready' && (
        <span className={uiClass('ops-campus-help')}>드래그 회전 · 층 선택</span>
      )}
    </div>
  );
}
