import AssetModal from '../features/digital-twin/components/AssetModal.jsx';
import RackTerminalModal from '../features/digital-twin/components/RackTerminalModal.jsx';
import BreadcrumbToolbar from '../features/digital-twin/components/BreadcrumbToolbar.jsx';
import FacilitySidebar from '../features/digital-twin/components/FacilitySidebar.jsx';
import OperationsSidebar from '../features/digital-twin/components/OperationsSidebar.jsx';
import SceneControls from '../features/digital-twin/components/SceneControls.jsx';
import SceneViewport from '../features/digital-twin/components/SceneViewport.jsx';
import useDigitalTwinScene from '../features/digital-twin/useDigitalTwinScene.js';
import '../features/digital-twin/incident-alerts.css';
import { useCallback, useState } from 'react';

export default function DigitalTwinPage() {
  const [startScene, setStartScene] = useState(false);
  const onInterfaceReady = useCallback(() => setStartScene(true), []);
  const rootRef = useDigitalTwinScene(startScene);

  return (
    <div ref={rootRef} className="digital-twin-scene">
      <SceneViewport />
      <BreadcrumbToolbar />
      <FacilitySidebar />
      <OperationsSidebar />
      <SceneControls onEntranceComplete={onInterfaceReady} />
      <AssetModal />
      <RackTerminalModal />
    </div>
  );
}
