import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight, House, RotateCcw, RotateCw } from 'lucide-react';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore.js';

const chip = 'chip control-menu-trigger';
const menuItem = 'control-menu-item';

function Menu({ id, label, summary, openMenu, setOpenMenu, children }) {
  const isOpen = openMenu === id;

  return (
    <div className="control-menu">
      <button
        type="button"
        className={`${chip}${isOpen ? ' active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={`${id}-menu`}
        onClick={() => setOpenMenu(isOpen ? null : id)}
      >
        <span>{label}</span>
        <small>{summary}</small>
        <ChevronDown size={13} aria-hidden="true" />
      </button>
      <div
        className="control-menu-popover"
        id={`${id}-menu`}
        role="menu"
        aria-label={label}
        hidden={!isOpen}
        onClick={() => setOpenMenu(null)}
      >
        {children}
      </div>
    </div>
  );
}

function SelectedMark({ selected }) {
  return selected ? <Check size={13} aria-hidden="true" /> : <span aria-hidden="true" />;
}

export default function BreadcrumbToolbar() {
  const [openMenu, setOpenMenu] = useState(null);
  const toolbarRef = useRef(null);
  const splitLevel = useDigitalTwinStore(state => state.splitLevel);
  const activeFloor = useDigitalTwinStore(state => state.activeFloor);
  const autoRotate = useDigitalTwinStore(state => state.autoRotate);
  const highQuality = useDigitalTwinStore(state => state.highQuality);
  const splitLabels = ['기본', '분리 1단계', '분리 2단계'];

  useEffect(() => {
    if (!openMenu) return undefined;
    const closeOnOutsideClick = event => {
      if (!toolbarRef.current?.contains(event.target)) setOpenMenu(null);
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
        toolbarRef.current?.querySelector('[aria-expanded="true"]')?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openMenu]);

  return (
    <div className="breadcrumbs">
      <div className="crumb-path">
        <House size={14} aria-hidden="true" />
        <ChevronRight className="sep" size={12} aria-hidden="true" />
        <span>KNU AIDC</span>
        <ChevronRight className="sep" size={12} aria-hidden="true" />
        <b id="crumb-current">시설 전체</b>
      </div>
      <div
        ref={toolbarRef}
        className="view-actions"
        role="toolbar"
        aria-label="시설 층 배치, 시점 및 보기 설정"
      >
        <Menu
          id="layout-control"
          label="층 배치"
          summary={activeFloor ? '층 단독 보기' : splitLabels[splitLevel]}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
        >
          {splitLabels.map((label, level) => {
            const selected = !activeFloor && splitLevel === level;
            return (
              <button
                type="button"
                className={`${menuItem}${selected ? ' active' : ''}`}
                data-split-level={level}
                aria-pressed={selected}
                role="menuitemradio"
                aria-checked={selected}
                key={label}
              >
                <SelectedMark selected={selected} />
                <span>{label}</span>
              </button>
            );
          })}
        </Menu>

        <Menu
          id="camera-control"
          label="시점"
          summary={autoRotate ? '자동 회전 중' : '카메라'}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
        >
          <button type="button" className={menuItem} id="topChip" role="menuitem">
            <span aria-hidden="true" />
            <span>위에서 보기</span>
          </button>
          <button
            type="button"
            className={`${menuItem}${autoRotate ? ' active' : ''}`}
            id="btn-auto"
            aria-pressed={autoRotate}
            role="menuitemcheckbox"
            aria-checked={autoRotate}
          >
            <RotateCw size={13} aria-hidden="true" />
            <span>자동 회전</span>
          </button>
          <button type="button" className={menuItem} id="btn-view-reset" role="menuitem">
            <RotateCcw size={13} aria-hidden="true" />
            <span>시점 초기화</span>
          </button>
        </Menu>

        <Menu
          id="quality-control"
          label="보기 설정"
          summary={highQuality ? '고화질' : '성능'}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
        >
          <button
            type="button"
            className={`${menuItem}${!highQuality ? ' active' : ''}`}
            id="quality-low"
            data-quality="low"
            aria-pressed={!highQuality}
            role="menuitemradio"
            aria-checked={!highQuality}
          >
            <SelectedMark selected={!highQuality} />
            <span>성능</span>
          </button>
          <button
            type="button"
            className={`${menuItem}${highQuality ? ' active' : ''}`}
            id="quality-high"
            data-quality="high"
            aria-pressed={highQuality}
            role="menuitemradio"
            aria-checked={highQuality}
          >
            <SelectedMark selected={highQuality} />
            <span>고화질</span>
          </button>
        </Menu>
      </div>
    </div>
  );
}
