// ================================================
// FILE: src/shared/components/layouts/chat-layout.tsx
// ChatLayout Component - Layout for chat pages
// ================================================

import { ReactNode } from 'react';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { cn } from '@/shared/utils/cn';

interface ChatLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  showSidebar?: boolean;
}

export const ChatLayout = ({
  sidebar,
  main,
  showSidebar = true
}: ChatLayoutProps) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // On mobile, show either sidebar or main based on showSidebar prop
  if (!isDesktop) {
    return (
      <div className="h-full">
        {showSidebar ? sidebar : main}
      </div>
    );
  }

  // On desktop, show both
  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 border-r bg-background overflow-y-auto">
        {sidebar}
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-background">
        {main}
      </div>
    </div>
  );
};