import { Navigate } from 'react-router-dom';
import { useDemoSessionStore } from '../stores/demoSessionStore.js';

export default function DemoSessionGate({ children }) {
  const hasEntered = useDemoSessionStore(state => state.hasEntered);
  return hasEntered ? children : <Navigate to="/login" replace />;
}
