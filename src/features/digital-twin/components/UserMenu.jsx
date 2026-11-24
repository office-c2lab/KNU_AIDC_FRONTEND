import { ChevronDown, LockKeyhole, LogOut, Settings2, UserRound, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore.js';
import { useUserPreferencesStore } from '../../../stores/userPreferencesStore.js';

const itemClass =
  'flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left text-[14px] font-medium text-[#d6e4f3] transition-colors hover:bg-[#28415d80] hover:text-white focus-visible:bg-[#28415d80] focus-visible:outline-2 focus-visible:outline-[#80b5e5] disabled:text-[#788ca3] disabled:hover:bg-transparent disabled:hover:text-[#788ca3]';

function PreferenceToggle({ checked, onChange, children, description }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-6 py-4">
      <span>
        <span className="block text-[14px] font-medium text-[#e3eefb]">{children}</span>
        <span className="mt-1 block text-[12px] leading-relaxed text-[#9cb2cc]">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`relative h-[22px] w-10 shrink-0 rounded-full border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-[#80b5e5] ${checked ? 'border-[#7eb6e6] bg-[#457ca8]' : 'border-[#425b76] bg-[#16263a]'}`}
      >
        <span
          className={`absolute top-[3px] size-[14px] rounded-full bg-[#e3f0ff] shadow-sm transition-transform ${checked ? 'translate-x-[21px]' : 'translate-x-[3px]'}`}
        />
      </span>
    </label>
  );
}

export default function UserMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState(null);
  const menuId = useId();
  const titleId = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const dialogRef = useRef(null);
  const initialFocusRef = useRef(0);
  const closeNotifications = useDigitalTwinStore(state => state.setNotificationsOpen);
  const showClock = useUserPreferencesStore(state => state.showClock);
  const reducePanelMotion = useUserPreferencesStore(state => state.reducePanelMotion);
  const setShowClock = useUserPreferencesStore(state => state.setShowClock);
  const setReducePanelMotion = useUserPreferencesStore(state => state.setReducePanelMotion);

  useEffect(() => {
    if (!open) return;
    const closeOutside = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const frame = requestAnimationFrame(() => {
      const items = menuRef.current?.querySelectorAll('[role="menuitem"]:not(:disabled)');
      items?.[initialFocusRef.current === -1 ? items.length - 1 : 0]?.focus();
    });
    document.addEventListener('pointerdown', closeOutside);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', closeOutside);
    };
  }, [open]);

  useEffect(() => {
    if (dialog) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [dialog]);

  const showMenu = last => {
    initialFocusRef.current = last ? -1 : 0;
    closeNotifications(false);
    setOpen(true);
  };
  const openDialog = name => {
    setOpen(false);
    setDialog(name);
  };
  const closeDialog = () => {
    setDialog(null);
    triggerRef.current?.focus();
  };

  return (
    <>
      <div className="relative shrink-0" ref={rootRef}>
        <button
          type="button"
          ref={triggerRef}
          aria-label="사용자 메뉴"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => (open ? setOpen(false) : showMenu(false))}
          onKeyDown={event => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              showMenu(event.key === 'ArrowUp');
            }
          }}
          className={`flex h-9 items-center gap-2 rounded-full border py-0.5 pr-2.5 pl-0.5 text-[#cfdfef] transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#80b5e5] max-[700px]:gap-1 max-[700px]:pr-1.5 ${open ? 'border-[#7ca5cc80] bg-[#19304a]' : 'border-[#55739126] bg-[#020a1459] hover:border-[#7ca5cc66] hover:bg-[#192e47]'}`}
        >
          <span className="grid size-[29px] place-items-center rounded-full border border-[#6c8daf4d] bg-linear-to-b from-[#2b415a] to-[#17283e] shadow-[inset_0_1px_#b5d6f21a]">
            <UserRound size={20} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {open && (
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label="사용자 메뉴"
            className="absolute top-[calc(100%+12px)] right-0 z-50 w-[224px] rounded-xl border border-[#55739180] bg-linear-to-b from-[#182a40fa] to-[#0c192bfA] p-1.5 shadow-[0_14px_36px_#01071399,inset_0_1px_#b5d6f210] backdrop-blur-xl"
            onKeyDown={event => {
              const items = [
                ...menuRef.current.querySelectorAll('[role="menuitem"]:not(:disabled)'),
              ];
              const index = items.indexOf(document.activeElement);
              if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                event.preventDefault();
                const next =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? items.length - 1
                      : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) %
                        items.length;
                items[next]?.focus();
              } else if (event.key === 'Escape' || event.key === 'Tab') {
                if (event.key === 'Escape') event.preventDefault();
                setOpen(false);
                triggerRef.current?.focus();
              }
            }}
          >
            <button role="menuitem" className={itemClass} onClick={() => openDialog('profile')}>
              <UserRound size={18} aria-hidden="true" />내 정보
            </button>
            <button
              role="menuitem"
              className={itemClass}
              disabled
              title="계정 연동 후 사용할 수 있습니다."
            >
              <LockKeyhole size={18} aria-hidden="true" />
              비밀번호 변경
            </button>
            <button role="menuitem" className={itemClass} onClick={() => openDialog('settings')}>
              <Settings2 size={18} aria-hidden="true" />
              사용자 설정
            </button>
            <div className="mx-2 my-1 border-t border-[#49647d66]" role="separator" />
            <button
              role="menuitem"
              className={itemClass}
              onClick={() => {
                setOpen(false);
                closeNotifications(false);
                navigate('/login', { replace: true });
              }}
            >
              <LogOut size={18} aria-hidden="true" />
              로그아웃
            </button>
          </div>
        )}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={closeDialog}
        onClick={event => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            dialogRef.current.close();
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-48px)] w-[440px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-xl border border-[#55739180] bg-[#101f33] p-0 text-[#dce9f8] shadow-[0_24px_80px_#01071399] backdrop:bg-[#010711b3] backdrop:backdrop-blur-sm"
      >
        <header className="flex items-center justify-between border-b border-[#344e6a] px-6 py-4">
          <h2 id={titleId} className="text-[17px] font-semibold">
            {dialog === 'settings' ? '사용자 설정' : '내 정보'}
          </h2>
          <button
            type="button"
            aria-label="사용자 창 닫기"
            onClick={closeDialog}
            className="grid size-8 place-items-center rounded-md text-[#a8bfd8] hover:bg-[#27405c] hover:text-white"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="px-6 py-2">
          {dialog === 'settings' ? (
            <div className="divide-y divide-[#344e6a80]">
              <PreferenceToggle
                checked={showClock}
                onChange={setShowClock}
                description="넓은 화면에서 현재 시각을 표시합니다."
              >
                헤더 시계 표시
              </PreferenceToggle>
              <PreferenceToggle
                checked={reducePanelMotion}
                onChange={setReducePanelMotion}
                description="패널이 나타날 때 이동 효과를 줄입니다."
              >
                패널 이동 효과 줄이기
              </PreferenceToggle>
              <p className="py-4 text-[12px] text-[#93abc5]">
                설정은 이 브라우저에 자동 저장됩니다.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-7 text-center">
              <span className="grid size-14 place-items-center rounded-full border border-[#48647f] bg-[#21364e]">
                <UserRound size={28} aria-hidden="true" />
              </span>
              <p className="text-[15px] font-medium">연결된 계정 정보가 없습니다.</p>
              <p className="max-w-[300px] text-[13px] leading-relaxed text-[#9cb2cc]">
                계정 연동 후 내 정보 확인과 비밀번호 변경을 이용할 수 있습니다.
              </p>
              <Link
                to="/login"
                onClick={closeDialog}
                className="mt-2 rounded-md border border-[#5786ad] bg-[#1d4264] px-4 py-2 text-[13px] font-medium text-[#e3f2ff] hover:bg-[#2b5a80]"
              >
                로그인 화면으로 이동
              </Link>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
