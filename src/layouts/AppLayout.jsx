import { Outlet, useLocation } from 'react-router-dom';
import AppHeader from '../features/digital-twin/components/AppHeader.jsx';
import NotificationsPanel from '../features/digital-twin/components/NotificationsPanel.jsx';
import '../features/digital-twin/digital-twin.css';
import '../features/digital-twin/typography.css';

export default function AppLayout() {
  const location = useLocation();
  const dashboardMode = location.pathname === '/scenario-control';

  return (
    <div
      className={`digital-twin-root relative min-h-dvh w-full overflow-hidden bg-[#071024] text-slate-100${dashboardMode ? ' dashboard-root' : ''}`}
    >
      <AppHeader />
      <NotificationsPanel dashboardMode={dashboardMode} />
      <Outlet />
      <div className="scanlines" aria-hidden="true"></div>
      <div className="frame" aria-hidden="true"></div>
      <i className="corner tl" aria-hidden="true"></i>
      <i className="corner tr" aria-hidden="true"></i>
      <i className="corner bl" aria-hidden="true"></i>
      <i className="corner br" aria-hidden="true"></i>
    </div>
  );
}
