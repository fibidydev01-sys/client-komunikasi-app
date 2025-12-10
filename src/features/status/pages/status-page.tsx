// ================================================
// FILE: src/features/status/pages/status-page.tsx
// StatusPage - Status/Story page (CLEANED)
// ================================================

import { useState } from 'react';
import { Plus, Camera } from 'lucide-react';
import { AppLayout } from '@/shared/components/layouts/app-layout';
import { PageLayout } from '@/shared/components/common/page-layout';
import { Button } from '@/shared/components/ui/button';
import { EmptyState } from '@/shared/components/common/empty-state';
import { LoadingSpinner } from '@/shared/components/common/loading-spinner';
import { StatusCard } from '../components/status-card';
import { StatusViewer } from '../components/status-viewer';
import { StatusUploadModal } from '../components/status-upload-modal';
import { useStatus } from '../hooks/use-status';
import { logger } from '@/shared/utils/logger';

export const StatusPage = () => {
  const {
    contactsStatuses,
    myStatuses,
    isLoading,
    viewStatus,
  } = useStatus();

  const [viewingStatuses, setViewingStatuses] = useState<any[] | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const header = (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Status</h1>
      <Button onClick={() => setShowUploadModal(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Status
      </Button>
    </div>
  );

  const handleViewStatus = (statuses: any[], index: number) => {
    logger.debug('Status Page: Viewing status at index:', index);
    setViewingStatuses(statuses);
    setViewingIndex(index);
  };

  const handleCloseViewer = () => {
    logger.debug('Status Page: Closing status viewer');
    setViewingStatuses(null);
    setViewingIndex(0);
  };

  return (
    <AppLayout>
      <PageLayout header={header}>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner text="Loading statuses..." />
          </div>
        ) : (
          <div className="space-y-6">
            {/* My Status */}
            <div>
              <h2 className="mb-3 text-lg font-semibold">My Status</h2>
              {myStatuses.length > 0 ? (
                <div className="space-y-2">
                  {myStatuses.map((status, index) => (
                    <StatusCard
                      key={status.id}
                      status={status}
                      onClick={() => handleViewStatus(myStatuses, index)}
                    />
                  ))}
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowUploadModal(true)}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Create your first status
                </Button>
              )}
            </div>

            {/* Recent Updates */}
            <div>
              <h2 className="mb-3 text-lg font-semibold">Recent Updates</h2>
              {contactsStatuses.length > 0 ? (
                <div className="space-y-2">
                  {contactsStatuses.map((status, index) => (
                    <StatusCard
                      key={status.id}
                      status={status}
                      onClick={() => handleViewStatus(contactsStatuses, index)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Camera}
                  title="No recent updates"
                  description="Status updates from your contacts will appear here"
                />
              )}
            </div>
          </div>
        )}
      </PageLayout>

      {/* Status Viewer */}
      {viewingStatuses && (
        <StatusViewer
          statuses={viewingStatuses}
          initialIndex={viewingIndex}
          onClose={handleCloseViewer}
          onView={viewStatus}
        />
      )}

      {/* Upload Modal */}
      <StatusUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
      />
    </AppLayout>
  );
};