import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <div className="page-loading">Loading…</div>;
  }

  if (status === 'guest') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
