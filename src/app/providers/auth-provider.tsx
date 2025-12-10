// ================================================
// FILE: src/app/providers/auth-provider.tsx
// AuthProvider - Initialize authentication
// ================================================

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { LoadingPage } from '@/shared/components/common/loading-spinner';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { checkAuth, isLoading } = useAuthStore();

  // FIXED: Only run once on mount, no dependencies
  useEffect(() => {
    console.log('🔐 AuthProvider: Initial auth check...');
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← Empty array = run once only!

  if (isLoading) {
    return <LoadingPage text="Loading..." />;
  }

  return <>{children}</>;
};