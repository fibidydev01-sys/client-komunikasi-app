// ================================================
// FILE: src/shared/components/layouts/app-layout.tsx
// AppLayout Component - Main application layout
// ================================================

import { ReactNode } from 'react';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { DesktopSidebar } from './desktop-sidebar';
import { MobileBottomNav } from './mobile-bottom-nav';
import { cn } from '@/shared/utils/cn';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export const AppLayout = ({ children, className }: AppLayoutProps) => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      {isDesktop && <DesktopSidebar />}

      {/* Main Content */}
      <main className={cn(
        'flex-1 overflow-hidden',
        !isDesktop && 'pb-16', // Add padding for mobile bottom nav
        className
      )}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {!isDesktop && <MobileBottomNav />}
    </div>
  );
};