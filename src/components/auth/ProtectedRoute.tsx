import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'analyst' | 'researcher' | 'viewer';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  console.log('ProtectedRoute state:', { user, profile, loading });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading authentication...</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {user ? 'User logged in, loading profile...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // If user exists but profile is still loading, show loading
  if (!profile && user) {
    console.log('User exists but profile is loading');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading user profile...</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Setting up your account...
          </p>
        </div>
      </div>
    );
  }

  // Check role permissions only if profile exists and role is required
  if (requiredRole && profile) {
    const hasPermission = (() => {
      switch (requiredRole) {
        case 'admin':
          return profile.role === 'admin';
        case 'analyst':
          return ['admin', 'analyst'].includes(profile.role);
        case 'researcher':
          return ['admin', 'analyst', 'researcher'].includes(profile.role);
        case 'viewer':
          return ['admin', 'analyst', 'researcher', 'viewer'].includes(profile.role);
        default:
          return true;
      }
    })();

    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}; 