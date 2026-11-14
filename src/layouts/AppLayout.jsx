import { Outlet } from 'react-router-dom';
import AppHeader from '../features/digital-twin/components/AppHeader.jsx';
import AssetModal from '../features/digital-twin/components/AssetModal.jsx';
import BreadcrumbToolbar from '../features/digital-twin/components/BreadcrumbToolbar.jsx';
import FacilitySidebar from '../features/digital-twin/components/FacilitySidebar.jsx';
import OperationsSidebar from '../features/digital-twin/components/OperationsSidebar.jsx';
import NotificationsPanel from '../features/digital-twin/components/NotificationsPanel.jsx';
import SceneControls from '../features/digital-twin/components/SceneControls.jsx';
import useDigitalTwinScene from '../features/digital-twin/useDigitalTwinScene.js';
import '../features/digital-twin/digital-twin.css';
import '../features/digital-twin/typography.css';

export default function AppLayout() {
  const rootRef = useDigitalTwinScene();

  return (
    <div
      ref={rootRef}
      className="digital-twin-root relative h-dvh min-h-[560px] w-full overflow-hidden bg-[#071024] text-slate-100"
    >
      <Outlet />
      <AppHeader />
      <NotificationsPanel />
      <BreadcrumbToolbar />
      <FacilitySidebar />
      <OperationsSidebar />
      <SceneControls />
      <AssetModal />
    </div>
  );
}
