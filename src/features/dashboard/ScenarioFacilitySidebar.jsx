import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SCENARIOS } from '../digital-twin/scene/config/scenarioConfig.js';

export default function ScenarioFacilitySidebar({
  facilityGroups,
  assetCatalog,
  selectedAssetId,
  runningIds,
  onSelectAsset,
}) {
  const [expandedFacilityId, setExpandedFacilityId] = useState('3F');
  return (
    <aside
      className="flex min-h-0 flex-col overflow-hidden border border-[#324f72] bg-[#0a1629]"
      aria-label="시설 및 설비 탐색"
    >
      <header className="shrink-0 border-b border-[#2c4666] bg-[#142641] px-3.5 py-3">
        <h2 className="mt-1 text-[13px] font-semibold text-[#ecf4ff]">
          시설·설비 탐색{' '}
          <small className="ml-2 text-[10px] text-[#89a9c9]">{assetCatalog.length}개</small>
        </h2>
      </header>
      <nav
        className="grid min-h-0 grid-cols-1 gap-1 overflow-y-auto p-2 [scrollbar-width:thin] [scrollbar-color:#41658c_transparent]"
        aria-label="층 및 지원 시설"
      >
        {facilityGroups.map(group => {
          const assets = assetCatalog.filter(asset => group.matches(asset));
          const expanded = expandedFacilityId === group.id;
          return (
            <div key={group.id}>
              <button
                type="button"
                className={`grid min-h-10 w-full min-w-0 grid-cols-[30px_1fr_auto_12px] items-center gap-[5px] border px-2.5 py-2 text-left hover:border-[#4e7298] hover:bg-[#182d49] ${expanded ? 'border-[#365d82] bg-[#193953] text-white' : 'border-transparent bg-transparent text-[#8da7c2]'}`}
                aria-expanded={expanded}
                aria-controls={`facility-assets-${group.id}`}
                onClick={() => setExpandedFacilityId(expanded ? null : group.id)}
              >
                <b className="text-[11px] text-[#9fd2ff]">{group.id}</b>
                <span className="truncate text-[10px]">{group.name}</span>
                <small className="text-[10px] text-[#89a9c9]">{assets.length}</small>
                <ChevronDown
                  size={12}
                  aria-hidden="true"
                  className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                id={`facility-assets-${group.id}`}
                hidden={!expanded}
                className="ml-3.5 border-l border-[#294463] pt-[5px] pb-[9px] pl-3"
              >
                <div className="scenario-facility-assets">
                  {assets.length ? (
                    assets.map(asset => {
                      const scenario = SCENARIOS.find(item => item.asset === asset.id);
                      const running = scenario && runningIds.has(scenario.id);
                      return (
                        <button
                          type="button"
                          key={asset.id}
                          className={`${selectedAssetId === asset.id ? 'selected' : ''}${running ? ' running' : ''}`}
                          aria-pressed={selectedAssetId === asset.id}
                          onClick={() => {
                            onSelectAsset(group.id, asset);
                          }}
                        >
                          <i />
                          <span>
                            <strong>{asset.id}</strong>
                            <small>{asset.name || asset.type}</small>
                          </span>
                          <em>{running ? '장애' : scenario ? '제어 가능' : '정상'}</em>
                        </button>
                      );
                    })
                  ) : (
                    <p className="dashboard-empty">등록된 설비가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
