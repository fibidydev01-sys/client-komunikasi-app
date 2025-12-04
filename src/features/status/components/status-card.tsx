// ================================================
// FILE: src/features/status/components/status-card.tsx
// StatusCard Component - Status/Story card
// ================================================

import { UserAvatar } from '@/shared/components/common/user-avatar';
import { dateFormatter } from '@/shared/utils/date-formatter';
import { cn } from '@/shared/utils/cn';
import type { StatusWithDetails } from '../types/status.types';

interface StatusCardProps {
  status: StatusWithDetails;
  onClick?: () => void;
  viewed?: boolean;
}

export const StatusCard = ({ status, onClick, viewed }: StatusCardProps) => {
  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50"
    >
      {/* Avatar with ring */}
      <div className={cn(
        'relative rounded-full p-0.5',
        !viewed && 'bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500'
      )}>
        <div className="rounded-full bg-background p-0.5">
          <UserAvatar
            src={status.user.avatar || status.user.profilePhoto}
            name={status.user.name}
            size="lg"
          />
        </div>
      </div>

      {/* Status Info */}
      <div className="flex-1 overflow-hidden">
        <h4 className={cn(
          'truncate font-semibold',
          !viewed ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {status.user.name}
        </h4>

        <p className="truncate text-sm text-muted-foreground">
          {dateFormatter.relativeTime(status.createdAt)}
        </p>
      </div>

      {/* View Count (for own status) */}
      {status.viewCount > 0 && (
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">
            {status.viewCount}
          </p>
          <p className="text-xs text-muted-foreground">
            {status.viewCount === 1 ? 'view' : 'views'}
          </p>
        </div>
      )}
    </div>
  );
};