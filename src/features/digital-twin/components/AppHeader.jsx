import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore.js';
import HeaderFrame from './HeaderFrame.jsx';
import UserMenu from './UserMenu.jsx';
import { useUserPreferencesStore } from '../../../stores/userPreferencesStore.js';
const clockFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});
function HeaderClock() {
  const showClock = useUserPreferencesStore(state => state.showClock);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  if (!showClock) return null;
  return (
    <time
      className="shrink-0 text-[11px] font-medium text-[#9fb8d4] tabular-nums max-[1200px]:hidden"
      id="clock"
      dateTime={now.toISOString()}
      title="한국 표준시 (KST)"
    >
      {clockFormatter.format(now)}
    </time>
  );
}
function HeaderLink({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className="group relative inline-flex h-10 shrink-0 items-center justify-center px-2.5 text-[14px] font-semibold whitespace-nowrap outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#9dccff] max-[1300px]:px-1.5 max-[1300px]:text-[12px] max-[700px]:text-[11px]"
    >
      {({ isActive }) => (
        <>
          <span
            className={`relative transition-colors ${isActive ? 'text-[#fff8e6]' : 'text-[#b9cee5] group-hover:text-[#eff7ff]'}`}
          >
            {children}
          </span>
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-3 bottom-0 h-[5px] bg-[radial-gradient(ellipse,#fffbe9_0%,#ffe397cc_15%,#e6af484d_38%,transparent_70%)] blur-[0.5px] transition-opacity duration-150 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-80 group-focus-visible:opacity-80'}`}
          />
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-3 bottom-0.5 h-px bg-linear-to-r from-transparent via-[#fffdf0] to-transparent shadow-[0_0_2px_#fff0b8,0_0_4px_#ffc85ba6] transition-opacity duration-150 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}
          />
        </>
      )}
    </NavLink>
  );
}
export default function AppHeader() {
  const notificationsOpen = useDigitalTwinStore(state => state.notificationsOpen);
  const setNotificationsOpen = useDigitalTwinStore(state => state.setNotificationsOpen);
  const incidentCount = useDigitalTwinStore(state => state.incidents.length);
  return (
    <header className="fixed inset-x-[10px] top-[9px] z-20 grid h-[76px] grid-cols-[minmax(0,1fr)_48%_minmax(0,1fr)] items-center isolate rounded-t-[22px] bg-linear-to-b from-[#06101ee8] via-[#071528f5] to-[#030d1bf5] shadow-[0_8px_24px_#01050f40] before:pointer-events-none before:absolute before:inset-x-[24px] before:top-px before:h-px before:bg-linear-to-r before:from-[#1476bca6] before:via-[#97d8ff] before:to-[#1476bca6] before:shadow-[0_0_7px_#148aff66] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-[5px] after:h-px after:bg-[linear-gradient(90deg,#275c85_0%,#dca43c_8%,#fff1bb_13%,#bc862e_19%,#249ce9_28%,#249ce9_72%,#bc862e_81%,#fff1bb_88%,#dca43c_94%,#275c85_100%)] after:shadow-[0_0_5px_#d6ac5559] max-[1100px]:grid-cols-[minmax(0,1fr)_43%_minmax(0,1fr)] max-[1000px]:grid-cols-[minmax(0,1fr)_auto]">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-px left-[4%] h-[10px] w-[18%] bg-[radial-gradient(ellipse,#fff7d5_0%,#ffd36d80_12%,#b77e2633_40%,transparent_72%)] blur-[1.5px]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[2%] bottom-px h-[10px] w-[18%] bg-[radial-gradient(ellipse,#fff7d5_0%,#ffd36d80_12%,#b77e2633_40%,transparent_72%)] blur-[1.5px]"
      />
      <nav
        className="relative z-10 flex min-w-0 items-center justify-start gap-1.5 pr-7 pl-3 max-[1400px]:gap-1 max-[1300px]:gap-0.5 max-[1300px]:pr-4 max-[1300px]:pl-2 max-[700px]:pr-2"
        aria-label="사용자 메뉴"
      >
        <HeaderLink to="/dashboard">대시보드</HeaderLink>
        <HeaderLink to="/ai-network">AI 통신 지도</HeaderLink>
        <HeaderLink to="/" end>
          디지털 트윈
        </HeaderLink>
        <HeaderLink to="/scenario-control">시스템 제어</HeaderLink>
      </nav>

      <div className="relative flex h-[76px] min-w-0 flex-col items-center justify-center pb-2 max-[1000px]:hidden">
        <HeaderFrame />
        <div className="relative flex min-w-0 flex-col items-center gap-1.5 px-9 text-center max-[1100px]:gap-1 max-[1100px]:px-5">
          <strong className="text-[clamp(16px,1.3vw,23px)] leading-tight font-semibold whitespace-nowrap text-[#f0f5fd] [text-shadow:0_2px_6px_#010713] max-[1100px]:text-[13px]">
            <span className="bg-linear-to-b from-[#fff1c2] via-[#edcc84] to-[#c89948] bg-clip-text text-transparent [text-shadow:none] drop-shadow-[0_0_6px_#e5b75a26]">
              KNU AIDC
            </span>{' '}
            Infrastructure Management System
          </strong>
          <div className="flex w-full items-center justify-center gap-3 max-[1100px]:gap-2">
            <span
              className="h-px w-12 bg-linear-to-r from-transparent to-[#9ac8ef99] max-[1400px]:w-6 max-[1100px]:hidden"
              aria-hidden="true"
            />
            <span className="text-[11px] leading-normal tracking-[0.13em] whitespace-nowrap text-[#b9defa] max-[1400px]:text-[10px] max-[1100px]:text-[8px] max-[1100px]:tracking-[0.08em]">
              3D DIGITAL TWIN CONTROL CENTER
            </span>
            <span
              className="h-px w-12 bg-linear-to-l from-transparent to-[#9ac8ef99] max-[1400px]:w-6 max-[1100px]:hidden"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex min-w-0 items-center justify-end gap-4 pr-5 pl-10 max-[1400px]:gap-3 max-[1400px]:pl-7 max-[1100px]:gap-2 max-[1100px]:pr-3 max-[1100px]:pl-3 max-[700px]:gap-1 max-[700px]:pl-1">
        <HeaderClock />
        <button
          type="button"
          className={`relative grid size-8 shrink-0 place-items-center rounded-[3px] border transition-colors ${notificationsOpen ? 'border-[#e6bc5f] bg-[#493d214d] text-[#ffe4a5]' : 'border-[#3c638673] bg-[#11253d80] text-[#aacae5] hover:border-[#76b9ed] hover:bg-[#193553] hover:text-[#ecf7ff]'}`}
          id="header-alarm"
          aria-expanded={notificationsOpen}
          aria-controls="notifications-panel"
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          title="알림 및 이벤트 보기"
          aria-label="알림 및 이벤트 보기"
        >
          <Bell size={16} aria-hidden="true" />
          <span
            className={`absolute -top-1 -right-1 min-w-[15px] rounded-full border border-[#eda2aa66] bg-[#b94b60] px-1 text-center text-[9px] leading-[14px] font-semibold text-white ${incidentCount ? 'block' : 'hidden'}`}
            id="header-alarm-count"
          >
            {incidentCount}
          </span>
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
