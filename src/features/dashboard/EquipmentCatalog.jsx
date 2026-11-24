import { uiClass } from '../../styles/interfaceStyles.js';
import { useEffect, useMemo, useState } from 'react';
import { SCENARIOS } from '../digital-twin/scene/config/scenarioConfig.js';
import { createIncidentSelectors } from '../digital-twin/scene/systems/createIncidentSelectors.js';
import { equipmentStatusLabels } from './equipmentStatus.js';
const scenarioById = new Map(SCENARIOS.map(item => [item.id, item]));
export default function EquipmentCatalog({
  facilityGroups,
  assets,
  incidents,
  search,
  onSelectAsset,
  title = '전체 설비',
  visibleAssets = assets,
  statusFilter = 'all',
}) {
  const [thumbnails, setThumbnails] = useState({});
  const [thumbnailState, setThumbnailState] = useState('loading');
  const selectors = useMemo(
    () =>
      createIncidentSelectors({
        clock: {
          elapsedTime: 0,
        },
        activeIncidents: new Map(incidents.map(item => [item.id, item])),
        scenarioById,
      }),
    [incidents]
  );
  const query = search.trim().toLocaleLowerCase();
  const groups = facilityGroups.map(group => ({
    ...group,
    assets: visibleAssets.filter(
      asset =>
        group.matches(asset) &&
        (!query ||
          [asset.id, asset.name, asset.type].some(value =>
            String(value ?? '')
              .toLocaleLowerCase()
              .includes(query)
          ))
    ),
  }));
  useEffect(() => {
    let cancelled = false;
    let generator;
    let frame;
    import('./createEquipmentThumbnails.js')
      .then(({ createEquipmentThumbnails }) => {
        if (cancelled) return;
        generator = createEquipmentThumbnails();
        let index = 0;
        const captureBatch = () => {
          if (cancelled) return;
          const batch = {};
          for (let count = 0; count < 2 && index < assets.length; count++, index++) {
            const asset = assets[index];
            try {
              batch[asset.id] = generator.capture(asset.id);
            } catch {
              batch[asset.id] = null;
            }
          }
          setThumbnails(previous => ({
            ...previous,
            ...batch,
          }));
          if (index < assets.length) frame = requestAnimationFrame(captureBatch);
          else {
            generator.dispose();
            generator = null;
            setThumbnailState('ready');
          }
        };
        frame = requestAnimationFrame(captureBatch);
      })
      .catch(error => {
        if (cancelled) return;
        console.error('전체 설비 썸네일 생성 실패', error);
        generator?.dispose();
        generator = null;
        setThumbnailState('error');
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      generator?.dispose();
    };
  }, [assets]);
  const resultCount = groups.reduce((sum, group) => sum + group.assets.length, 0);
  return (
    <div className={uiClass('equipment-catalog')} aria-label="전체 층 및 시설별 설비">
      <div className={uiClass('equipment-catalog-heading')}>
        <h2>{title}</h2>
        {statusFilter !== 'all' && (
          <span className={uiClass(`equipment-catalog-filter ${statusFilter}`)}>
            {equipmentStatusLabels[statusFilter]} 설비
          </span>
        )}
        <span>
          {query
            ? `검색 결과 ${resultCount}개`
            : `${statusFilter === 'all' ? facilityGroups.length : groups.filter(group => group.assets.length).length}개 구역 · ${resultCount}개 설비`}
        </span>
      </div>
      {groups
        .filter(group => (!query && statusFilter === 'all') || group.assets.length)
        .map(group => (
          <section
            className={uiClass('equipment-catalog-group')}
            key={group.id}
            aria-labelledby={`catalog-${group.id}`}
          >
            <header>
              <span>{group.id}</span>
              <div>
                <h3 id={`catalog-${group.id}`}>{group.name}</h3>
                <small>{group.assets.length}개 설비</small>
              </div>
            </header>
            <div className={uiClass('equipment-catalog-assets')}>
              {group.assets.map(asset => {
                const status = selectors.getAssetStatus(asset);
                const tone = status === '정상' ? 'normal' : status === '주의' ? 'warning' : 'fault';
                return (
                  <button
                    type="button"
                    key={asset.id}
                    data-asset-id={asset.id}
                    className={uiClass(`equipment-catalog-asset ${tone}`)}
                    onClick={() => onSelectAsset(group.id, asset)}
                    aria-label={`${asset.id}, ${asset.name}, ${status}, 상세 보기`}
                  >
                    <div className={uiClass('equipment-catalog-asset-name')}>
                      <strong>{asset.id}</strong>
                      <small>{asset.name.replace(asset.id, '').trim() || asset.type}</small>
                    </div>
                    <div className={uiClass('equipment-catalog-model')}>
                      {thumbnails[asset.id] ? (
                        <img
                          src={thumbnails[asset.id]}
                          alt=""
                          width="220"
                          height="180"
                          loading="lazy"
                        />
                      ) : (
                        <span>
                          {thumbnailState === 'loading' && !(asset.id in thumbnails)
                            ? '모델 준비 중'
                            : asset.type}
                        </span>
                      )}
                    </div>
                    <span className={uiClass('equipment-catalog-status')}>
                      <i />
                      {status}
                    </span>
                  </button>
                );
              })}
              {!group.assets.length && (
                <p className={uiClass('equipment-catalog-empty')}>등록된 설비가 없습니다.</p>
              )}
            </div>
          </section>
        ))}
      {!resultCount && (query || statusFilter !== 'all') && (
        <p className={uiClass('equipment-catalog-empty')} role="status">
          {query
            ? '검색 조건과 일치하는 설비가 없습니다.'
            : `선택한 구역에 ${equipmentStatusLabels[statusFilter]} 상태의 설비가 없습니다.`}
        </p>
      )}
    </div>
  );
}
