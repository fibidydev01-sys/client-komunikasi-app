// ================================================
// FILE: src/features/call/pages/calls-page.tsx
// CallsPage - WITH INCOMING CALL MODAL
// ================================================

import { Phone } from 'lucide-react';
import { AppLayout } from '@/shared/components/layouts/app-layout';
import { PageLayout } from '@/shared/components/common/page-layout';
import { EmptyState } from '@/shared/components/common/empty-state';
import { LoadingSpinner } from '@/shared/components/common/loading-spinner';
import { CallHistoryItem } from '../components/call-history-item';
import { IncomingCallModal } from '../components/incoming-call-modal';
import { useCall } from '../hooks/use-call';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { logger } from '@/shared/utils/logger';

export const CallsPage = () => {
  const { user } = useAuthStore();
  const {
    callHistory,
    incomingCall,
    isLoading,
    answerCall,
    rejectCall,
  } = useCall();

  const handleAnswerCall = async () => {
    if (!incomingCall) return;

    try {
      logger.debug('Calls Page: 📞 Answering incoming call:', incomingCall.id);
      await answerCall(incomingCall.id);
      logger.success('Calls Page: ✅ Call answered successfully');
    } catch (error) {
      logger.error('Calls Page: ❌ Failed to answer call:', error);
    }
  };

  const handleRejectCall = async () => {
    if (!incomingCall) return;

    try {
      logger.debug('Calls Page: ❌ Rejecting incoming call:', incomingCall.id);
      await rejectCall(incomingCall.id);
      logger.success('Calls Page: ✅ Call rejected successfully');
    } catch (error) {
      logger.error('Calls Page: ❌ Failed to reject call:', error);
    }
  };

  const header = (
    <div>
      <h1 className="text-2xl font-bold">Calls</h1>
      <p className="text-muted-foreground">Your call history</p>
    </div>
  );

  return (
    <AppLayout>
      <PageLayout header={header}>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner text="Loading calls..." />
          </div>
        ) : callHistory.length === 0 ? (
          <EmptyState
            icon={Phone}
            title="No calls yet"
            description="Your call history will appear here"
          />
        ) : (
          <div className="divide-y">
            {callHistory.map((call) => (
              <CallHistoryItem
                key={call.id}
                call={call}
                currentUserId={user?.id || ''}
              />
            ))}
          </div>
        )}
      </PageLayout>

      {/* Incoming Call Modal */}
      <IncomingCallModal
        call={incomingCall}
        onAnswer={handleAnswerCall}
        onReject={handleRejectCall}
      />
    </AppLayout>
  );
};