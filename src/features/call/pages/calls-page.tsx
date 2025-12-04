// ================================================
// FILE: src/features/call/pages/calls-page.tsx
// CallsPage - WITHOUT INCOMING CALL MODAL (moved to AppLayout)
// ================================================

import { Phone } from 'lucide-react';
import { AppLayout } from '@/shared/components/layouts/app-layout';
import { PageLayout } from '@/shared/components/common/page-layout';
import { EmptyState } from '@/shared/components/common/empty-state';
import { LoadingSpinner } from '@/shared/components/common/loading-spinner';
import { CallHistoryItem } from '../components/call-history-item';
import { useCall } from '../hooks/use-call';
import { useAuthStore } from '@/features/auth/store/auth.store';

export const CallsPage = () => {
  const { user } = useAuthStore();
  const { callHistory, isLoading } = useCall();

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
    </AppLayout>
  );
};