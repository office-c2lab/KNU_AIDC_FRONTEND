import AssetModal from '../features/digital-twin/components/AssetModal.jsx';
import BreadcrumbToolbar from '../features/digital-twin/components/BreadcrumbToolbar.jsx';
import FacilitySidebar from '../features/digital-twin/components/FacilitySidebar.jsx';
import OperationsSidebar from '../features/digital-twin/components/OperationsSidebar.jsx';
import SceneControls from '../features/digital-twin/components/SceneControls.jsx';
import SceneViewport from '../features/digital-twin/components/SceneViewport.jsx';
import useDigitalTwinScene from '../features/digital-twin/useDigitalTwinScene.js';

export default function DigitalTwinPage() {
  const rootRef = useDigitalTwinScene();

  return (
    <div ref={rootRef} className="digital-twin-scene">
      <SceneViewport />
      <BreadcrumbToolbar />
      <FacilitySidebar />
      <OperationsSidebar />
      <SceneControls />
      <AssetModal />
    </div>
  );
}
