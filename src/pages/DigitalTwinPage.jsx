import { useState } from 'react';
import { uiClass } from '../styles/interfaceStyles.js';
import AssetModal from '../features/digital-twin/components/AssetModal.jsx';
import RackTerminalModal from '../features/digital-twin/components/RackTerminalModal.jsx';
import FacilitySidebar from '../features/digital-twin/components/FacilitySidebar.jsx';
import OperationsSidebar from '../features/digital-twin/components/OperationsSidebar.jsx';
import SceneControls from '../features/digital-twin/components/SceneControls.jsx';
import SceneViewport from '../features/digital-twin/components/SceneViewport.jsx';
import CompactPanelControls from '../features/digital-twin/components/CompactPanelControls.jsx';
import ControlTooltip from '../features/digital-twin/components/ControlTooltip.jsx';
import useDigitalTwinScene from '../features/digital-twin/useDigitalTwinScene.js';
export default function DigitalTwinPage() {
  const rootRef = useDigitalTwinScene();
  const [openPanel, setOpenPanel] = useState(null);
  return (
    <div ref={rootRef} className={uiClass('digital-twin-scene')}>
      <SceneViewport />
      <CompactPanelControls openPanel={openPanel} onPanelChange={setOpenPanel} />
      <FacilitySidebar
        open={openPanel === 'efficiency'}
        section={openPanel}
        onClose={() => setOpenPanel(null)}
      />
      <OperationsSidebar open={openPanel === 'details'} onClose={() => setOpenPanel(null)} />
      <SceneControls />
      <ControlTooltip rootRef={rootRef} />
      <AssetModal />
      <RackTerminalModal />
    </div>
  );
}
