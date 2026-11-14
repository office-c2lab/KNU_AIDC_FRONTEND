import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import DigitalTwinPage from '../pages/DigitalTwinPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DigitalTwinPage />,
      },
      {
        path: 'scenario-control',
        element: <DashboardPage />,
      },
      {
        path: 'dashboard',
        element: <Navigate to="/scenario-control" replace />,
      },
    ],
  },
]);

export default router;
