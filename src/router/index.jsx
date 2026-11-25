import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import DemoSessionGate from '../components/DemoSessionGate.jsx';
import DigitalTwinPage from '../pages/DigitalTwinPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';

const router = createBrowserRouter([
  {
    path: '/login',
    lazy: async () => ({
      Component: (await import('../pages/LoginPage.jsx')).default,
    }),
  },
  {
    path: '/',
    element: (
      <DemoSessionGate>
        <AppLayout />
      </DemoSessionGate>
    ),
    children: [
      {
        path: 'ai-network',
        lazy: async () => ({
          Component: (await import('../pages/AiNetworkPage.jsx')).default,
        }),
      },
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
        lazy: async () => ({
          Component: (await import('../pages/OperationsDashboardPage.jsx')).default,
        }),
      },
    ],
  },
]);

export default router;
