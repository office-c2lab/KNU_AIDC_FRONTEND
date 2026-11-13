import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import DigitalTwinPage from '../pages/DigitalTwinPage.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DigitalTwinPage />,
      },
    ],
  },
]);

export default router;
