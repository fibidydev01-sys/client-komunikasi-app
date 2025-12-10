// ================================================
// FILE: src/features/call/components/call-history-item.tsx
// CallHistoryItem Component - Single call history item
// ================================================

import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed
} from 'lucide-react';
import { UserAvatar } from '@/shared/components/common/user-avatar';
import { dateFormatter } from '@/shared/utils/date-formatter';
import { cn } from '@/shared/utils/cn';
import type { CallWithDetails } from '../types/call.types';

interface CallHistoryItemProps {
  call: CallWithDetails;
  currentUserId: string;
  onClick?: () => void;
}

export const CallHistoryItem = ({
  call,
  currentUserId,
  onClick,
}: CallHistoryItemProps) => {
  const isIncoming = call.receiverId === currentUserId;
  const isMissed = call.status === 'MISSED';
  const isRejected = call.status === 'REJECTED';
  const isVideo = call.type === 'VIDEO';

  const otherUser = isIncoming ? call.caller : call.receiver;

  const getIcon = () => {
    if (isMissed || isRejected) {
      return <PhoneMissed className="h-5 w-5 text-destructive" />;
    }
    if (isIncoming) {
      return <PhoneIncoming className="h-5 w-5 text-green-500" />;
    }
    return <PhoneOutgoing className="h-5 w-5 text-blue-500" />;
  };

  const getStatusText = () => {
    if (isMissed) return 'Missed';
    if (isRejected) return 'Rejected';
    if (call.duration) {
      return dateFormatter.callDuration(call.duration);
    }
    return call.status;
  };

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-muted/50"
    >
      <UserAvatar
        src={otherUser.avatar}
        name={otherUser.name}
        size="lg"
      />

      <div className="flex-1">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h4 className="font-semibold text-foreground">
            {otherUser.name}
          </h4>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isVideo && <Video className="h-4 w-4" />}
          <span>{getStatusText()}</span>
          <span>•</span>
          <span>{dateFormatter.relativeTime(call.createdAt)}</span>
        </div>
      </div>

      <Phone className="h-5 w-5 text-muted-foreground" />
    </div>
  );
};