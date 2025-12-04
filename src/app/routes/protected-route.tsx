// ================================================
// FILE: src/app/routes/protected-route.tsx
// ProtectedRoute - Require authentication
// ================================================

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { LoadingPage } from '@/shared/components/common/loading-spinner';
import { ROUTE_PATHS } from '@/shared/constants/route-paths';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingPage text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.LOGIN} replace />;
  }

  return <>{children}</>;
};