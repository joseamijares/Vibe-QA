import { ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/database.types';
import { useOrganization } from '@/hooks/useOrganization';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { session, loading: authLoading } = useAuth();
  const { membership, loading: orgLoading } = useOrganization();

  // Show loading spinner while auth or org data is loading
  if (authLoading || (session && orgLoading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!session) {
    return <Redirect to="/login" />;
  }

  // Check role-based access if required
  if (requiredRole && membership) {
    const hasRequiredRole = requiredRole.includes(membership.role);
    if (!hasRequiredRole) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
