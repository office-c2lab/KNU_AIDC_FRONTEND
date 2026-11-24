import { uiClass } from '../../styles/interfaceStyles.js';
import { ChevronDown, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { SCENARIOS } from '../digital-twin/scene/config/scenarioConfig.js';
import { panelEntrance } from '../../utils/panelMotion.js';
import { equipmentStatusLabels } from './equipmentStatus.js';
import {
  floorButton,
  floorNumber,
  panelBase,
  panelScroll,
  subTitle,
} from '../digital-twin/components/uiStyles.js';
export default function ScenarioFacilitySidebar({
  facilityGroups,
  assetCatalog,
  summary,
  selectedAssetId,
  runningIds,
  onSelectAsset,
  selectedFacilityId,
  onSelectFacility,
  expandedFacilityId,
  onExpandedFacilityChange: setExpandedFacilityId,
  search,
  onSearchChange: setSearch,
  navigationRef,
  overview = false,
  onShowOverview,
  statusFilter,
  onStatusFilterChange,
}) {
  const query = search.trim().toLocaleLowerCase();
  const groups = facilityGroups
    .map(group => ({
      ...group,
      assets: assetCatalog.filter(
        asset =>
          group.matches(asset) &&
          (!query ||
            [asset.id, asset.name, asset.type].some(value =>
              String(value ?? '')
                .toLocaleLowerCase()
                .includes(query)
            ))
      ),
    }))
    .filter(group => !query || group.assets.length);
  const resultCount = groups.reduce((count, group) => count + group.assets.length, 0);
  return (
    <motion.aside
      {...panelEntrance({
        x: -24,
        y: 0,
        delay: 0.48,
      })}
      ref={navigationRef}
      className={uiClass(
        `${panelBase} relative! top-auto! bottom-auto! z-auto! flex min-h-0 flex-col`
      )}
      aria-label="시설 및 설비 탐색"
    >
      <div
        className={uiClass(
          'scenario-status-filters relative z-[3] flex shrink-0 items-center justify-between gap-1 border-b border-[#45678d68] px-4 py-3.5 text-xs tabular-nums'
        )}
        aria-label="전체 설비 운영 현황"
        role="group"
      >
        {['all', 'normal', 'warning', 'fault'].map(status => (
          <button
            key={status}
            type="button"
            className={uiClass(status)}
            aria-pressed={statusFilter === status}
            onClick={() => onStatusFilterChange(status)}
          >
            {equipmentStatusLabels[status]}{' '}
            <strong>{summary[status === 'all' ? 'total' : status]}</strong>
          </button>
        ))}
      </div>
      <div
        className={uiClass('relative z-[3] shrink-0 border-b border-[#45678d68] px-4 pt-4 pb-3')}
      >
        <label
          className={uiClass(
            'flex h-10 items-center gap-2 border border-[#43628b] bg-[#0a162b] px-3 focus-within:border-[#8fc3ff]'
          )}
        >
          <Search size={16} className={uiClass('shrink-0 text-[#a7bfdc]')} aria-hidden="true" />
          <span className={uiClass('sr-only')}>설비명 또는 ID 검색</span>
          <input
            type="text"
            value={search}
            onChange={event => setSearch(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Escape') setSearch('');
            }}
            placeholder="설비명 또는 ID 검색"
            className={uiClass(
              'min-w-0 flex-1 border-0 bg-transparent text-[length:var(--type-body)] text-[#e9f2ff] outline-none placeholder:text-[#93accb]'
            )}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="검색 지우기"
              className={uiClass(
                'flex h-6 w-6 shrink-0 items-center justify-center text-[#b9cce6] hover:text-white'
              )}
            >
              <X size={14} />
            </button>
          )}
        </label>
        {query && (
          <p role="status" className={uiClass('mt-2 mb-0 text-xs text-[#b9cce6]')}>
            검색 결과 {resultCount}개 설비
          </p>
        )}
      </div>
      <nav
        className={uiClass(`${panelScroll} grid min-h-0 grid-cols-1 content-start gap-1.5`)}
        aria-label="층 및 지원 시설"
      >
        <button
          type="button"
          className={uiClass(`${floorButton} scenario-overview-button${overview ? ' active' : ''}`)}
          aria-pressed={overview}
          onClick={onShowOverview}
        >
          <span className={uiClass(floorNumber)}>전체</span>
          <span className={uiClass('floor-copy')}>
            <strong>전체 보기</strong>
          </span>
          <span className={uiClass('text-xs text-[#b9cce6]')}>{summary.total}개</span>
        </button>
        {groups.map(group => {
          const assets = group.assets;
          const expanded = query ? true : expandedFacilityId === group.id;
          return (
            <div key={group.id}>
              {!query && (group.id === '4F' || group.id === 'P') && (
                <div className={uiClass(subTitle)}>
                  <h3 className={uiClass('m-0 text-[13px] font-semibold')}>
                    {group.id === '4F' ? '층별 현황' : '지원 시설'}
                  </h3>
                </div>
              )}
              <button
                type="button"
                className={uiClass(
                  `${floorButton}${selectedFacilityId === group.id ? ' active' : ''}`
                )}
                aria-pressed={selectedFacilityId === group.id}
                aria-expanded={expanded}
                aria-controls={`facility-assets-${group.id}`}
                onClick={() => {
                  onSelectFacility(group.id);
                  if (!query) setExpandedFacilityId(expanded ? null : group.id);
                }}
              >
                <span className={uiClass(floorNumber)}>{group.id}</span>
                <span className={uiClass('floor-copy min-w-0')}>
                  <strong>{group.name}</strong>
                </span>
                <span className={uiClass('flex items-center gap-2')}>
                  <span
                    className={uiClass('whitespace-nowrap text-xs tabular-nums text-[#b9cce6]')}
                  >
                    {assets.length}개
                  </span>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={uiClass(`transition-transform ${expanded ? 'rotate-180' : ''}`)}
                  />
                </span>
              </button>
              <div
                id={`facility-assets-${group.id}`}
                hidden={!expanded}
                className={uiClass('pt-1 pb-2')}
              >
                <div className={uiClass('scenario-facility-assets')}>
                  {assets.length ? (
                    assets.map(asset => {
                      const scenario = SCENARIOS.find(item => item.asset === asset.id);
                      const running = scenario && runningIds.has(scenario.id);
                      return (
                        <button
                          type="button"
                          key={asset.id}
                          className={uiClass(
                            `${selectedAssetId === asset.id ? 'selected' : ''}${running ? ' running' : ''}`
                          )}
                          aria-pressed={selectedAssetId === asset.id}
                          onClick={() => {
                            onSelectAsset(group.id, asset);
                          }}
                        >
                          <i aria-label={running ? '시나리오 발생' : '정상'} />
                          <span>
                            <strong>{asset.id}</strong>
                            <small>{asset.name || asset.type}</small>
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <p className={uiClass('dashboard-empty')}>
                      {statusFilter === 'all'
                        ? '등록된 설비가 없습니다.'
                        : '선택한 상태의 설비가 없습니다.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {query && !resultCount && (
          <p className={uiClass('py-6 text-center text-[13px] leading-6 text-[#b9cce6]')}>
            일치하는 설비가 없습니다.
            <br />
            설비명이나 ID를 다시 확인해주세요.
          </p>
        )}
      </nav>
    </motion.aside>
  );
}
