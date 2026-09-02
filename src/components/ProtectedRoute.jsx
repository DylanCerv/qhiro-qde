import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner" />
        <p>Cargando sesión…</p>
      </div>
    );
  }
  if (!isAuthenticated || !isAdmin) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return <Outlet />;
}
