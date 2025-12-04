// ================================================
// FILE: src/shared/components/common/page-layout.tsx
// PageLayout Component - Reusable page wrapper
// ================================================

import { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

interface PageLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export const PageLayout = ({
  children,
  header,
  footer,
  className,
  maxWidth = 'full',
}: PageLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      {header && (
        <header className="sticky top-0 z-10 border-b bg-background">
          <div className={cn('mx-auto px-4 py-3', maxWidthClasses[maxWidth])}>
            {header}
          </div>
        </header>
      )}

      <main className={cn('flex-1', className)}>
        <div className={cn('mx-auto h-full px-4 py-6', maxWidthClasses[maxWidth])}>
          {children}
        </div>
      </main>

      {footer && (
        <footer className="border-t bg-background">
          <div className={cn('mx-auto px-4 py-4', maxWidthClasses[maxWidth])}>
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
};