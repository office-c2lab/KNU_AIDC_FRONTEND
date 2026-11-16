import AssetModal from '../features/digital-twin/components/AssetModal.jsx';
import BreadcrumbToolbar from '../features/digital-twin/components/BreadcrumbToolbar.jsx';
import FacilitySidebar from '../features/digital-twin/components/FacilitySidebar.jsx';
import OperationsSidebar from '../features/digital-twin/components/OperationsSidebar.jsx';
import SceneControls from '../features/digital-twin/components/SceneControls.jsx';
import SceneViewport from '../features/digital-twin/components/SceneViewport.jsx';
import useDigitalTwinScene from '../features/digital-twin/useDigitalTwinScene.js';
import '../features/digital-twin/incident-alerts.css';
import { useOutletContext } from 'react-router-dom';

export default function DigitalTwinPage() {
  const { sceneReady, onSceneSettled } = useOutletContext();
  const rootRef = useDigitalTwinScene(onSceneSettled);

  return (
    <div ref={rootRef} className="digital-twin-scene">
      <SceneViewport />
      <BreadcrumbToolbar ready={sceneReady} />
      <FacilitySidebar ready={sceneReady} />
      <OperationsSidebar ready={sceneReady} />
      <SceneControls ready={sceneReady} />
      <AssetModal />
    </div>
  );
}
