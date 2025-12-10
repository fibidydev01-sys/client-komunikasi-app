// ================================================
// FILE: src/app/providers/index.tsx
// Combined Providers - All providers in one
// ================================================

import { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import { AuthProvider } from './auth-provider';
import { SocketProvider } from './socket-provider';
import { ErrorBoundary } from '@/shared/components/common/error-boundary';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ErrorBoundary>
    <ThemeProvider defaultTheme= "system" >
    <AuthProvider>
    <SocketProvider>
    { children }
    </SocketProvider>
    </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
};

// Re-export individual providers
export { ThemeProvider, useTheme } from './theme-provider';
export { AuthProvider } from './auth-provider';
export { SocketProvider } from './socket-provider';