// ================================================
// FILE: src/shared/components/layouts/app-layout.tsx
// AppLayout Component - WITH GLOBAL INCOMING CALL MODAL
// ================================================

import { ReactNode } from 'react';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { DesktopSidebar } from './desktop-sidebar';
import { MobileBottomNav } from './mobile-bottom-nav';
import { IncomingCallModal } from '@/features/call/components/incoming-call-modal';
import { useCall } from '@/features/call/hooks/use-call';
import { cn } from '@/shared/utils/cn';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export const AppLayout = ({ children, className }: AppLayoutProps) => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // ✅ ADD: Global incoming call handler
  const {
    incomingCall,
    answerCall,
    rejectCall,
  } = useCall();

  const handleAnswerCall = async () => {
    if (!incomingCall) return;
    try {
      await answerCall(incomingCall.id);
    } catch (error) {
      console.error('Failed to answer call:', error);
    }
  };

  const handleRejectCall = async () => {
    if (!incomingCall) return;
    try {
      await rejectCall(incomingCall.id);
    } catch (error) {
      console.error('Failed to reject call:', error);
    }
  };

  return (
    <>
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

      {/* ✅ GLOBAL INCOMING CALL MODAL */}
      <IncomingCallModal
        call={incomingCall}
        onAnswer={handleAnswerCall}
        onReject={handleRejectCall}
      />
    </>
  );
};