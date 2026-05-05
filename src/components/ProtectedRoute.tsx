import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { canAccessRoute } from '@/utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-muted">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si hay un permiso requerido, verificar acceso
  if (requiredPermission && user) {
    const hasAccess = canAccessRoute(user.role, requiredPermission);
    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
