// ================================================
// FILE: src/shared/components/layouts/app-layout.tsx
// AppLayout Component - WITH GLOBAL INCOMING CALL MODAL (FIXED)
// ================================================

import { ReactNode } from 'react';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { DesktopSidebar } from './desktop-sidebar';
import { MobileBottomNav } from './mobile-bottom-nav';
import { IncomingCallModal } from '@/features/call/components/incoming-call-modal';
import { ActiveCallModal } from '@/features/call/components/active-call-modal';
import { useCall } from '@/features/call/hooks/use-call';
import { useCallStore } from '@/features/call/store/call.store';
import { cn } from '@/shared/utils/cn';
import { logger } from '@/shared/utils/logger';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export const AppLayout = ({ children, className }: AppLayoutProps) => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // ✅ Global incoming call handler
  const {
    incomingCall,
    activeCall,
    answerCall,
    rejectCall,
  } = useCall();

  // ✅ Handle answer call
  const handleAnswerCall = async () => {
    if (!incomingCall) {
      logger.warn('AppLayout: No incoming call to answer');
      return;
    }

    try {
      logger.debug('AppLayout: Answering incoming call:', incomingCall.id);
      await answerCall(incomingCall.id);
      logger.success('AppLayout: Call answered successfully');
    } catch (error) {
      logger.error('AppLayout: Failed to answer call:', error);
    }
  };

  // ✅ Handle reject call
  const handleRejectCall = async () => {
    if (!incomingCall) {
      logger.warn('AppLayout: No incoming call to reject');
      return;
    }

    try {
      logger.debug('AppLayout: Rejecting incoming call:', incomingCall.id);
      await rejectCall(incomingCall.id);
      logger.success('AppLayout: Call rejected successfully');
    } catch (error) {
      logger.error('AppLayout: Failed to reject call:', error);
    }
  };

  // ✅ Handle close active call modal (reset state)
  const handleCloseActiveCall = () => {
    logger.debug('AppLayout: Closing active call modal');

    // Reset activeCall di store untuk close modal
    const { setActiveCall } = useCallStore.getState();
    setActiveCall(null);

    logger.success('AppLayout: Active call modal closed');
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        {isDesktop && <DesktopSidebar />}

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 overflow-hidden',
            !isDesktop && 'pb-16', // Add padding for mobile bottom nav
            className
          )}
        >
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

      {/* ✅ GLOBAL ACTIVE CALL MODAL (WITH PROPER CLOSE HANDLER) */}
      <ActiveCallModal
        open={!!activeCall}
        onClose={handleCloseActiveCall} // ← FIXED: Proper close handler
      />
    </>
  );
};