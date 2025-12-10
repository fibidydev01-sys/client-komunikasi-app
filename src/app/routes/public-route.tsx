// ================================================
// FILE: src/app/routes/public-route.tsx
// PublicRoute - Redirect if authenticated
// ================================================

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ROUTE_PATHS } from '@/shared/constants/route-paths';

interface PublicRouteProps {
  children: ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.CHATS} replace />;
  }

  return <>{children}</>;
};