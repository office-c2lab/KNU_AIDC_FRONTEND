import { uiClass } from '../styles/interfaceStyles.js';
import { useInterfaceScale } from '../hooks/useInterfaceScale.js';
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useDigitalTwinStore } from '../stores/digitalTwinStore.js';
import AppHeader from '../features/digital-twin/components/AppHeader.jsx';
import ScreenFrame from '../features/digital-twin/components/ScreenFrame.jsx';
import CampusBackdrop from '../components/CampusBackdrop.jsx';
import NotificationsPanel from '../features/digital-twin/components/NotificationsPanel.jsx';
export default function AppLayout() {
  const scaleClass = useInterfaceScale();
  const location = useLocation();
  const twinMode = location.pathname === '/';
  const systemMode = location.pathname === '/scenario-control';
  const dashboardMode = ['/scenario-control', '/dashboard'].includes(location.pathname);
  const advanceSimulation = useDigitalTwinStore(state => state.advanceSimulation);
  useEffect(() => {
    const interval = setInterval(() => advanceSimulation(2), 2000);
    return () => clearInterval(interval);
  }, [advanceSimulation]);
  return (
    <div
      className={uiClass(
        `digital-twin-root relative overflow-hidden bg-[#071024] [scrollbar-width:thin] [scrollbar-color:#55779a_transparent] [&_*]:[scrollbar-width:thin] [&_*]:[scrollbar-color:#55779a_transparent] [&_:where(button,a[href],summary,select,label[for],input[type=button],input[type=submit],input[type=reset],input[type=checkbox],input[type=radio],[role=button],[role=tab],[role=menuitem],[role=menuitemradio],[role=menuitemcheckbox],[data-asset-modal-close],[data-scenario-focus]):not(:disabled):not([aria-disabled=true])]:cursor-pointer [&_[aria-disabled=true]]:cursor-default [&.dashboard-root]:text-dashboard-text ${scaleClass}${dashboardMode ? ' dashboard-root' : ''}`
      )}
    >
      {location.pathname === '/dashboard' && <CampusBackdrop fixed />}
      <AppHeader
        key={twinMode ? `twin-${location.key}` : systemMode ? `system-${location.key}` : 'app'}
      />
      <NotificationsPanel dashboardMode={dashboardMode} />
      <Outlet />
      <div className={uiClass('scanlines')} aria-hidden="true"></div>
      <ScreenFrame />
    </div>
  );
}
