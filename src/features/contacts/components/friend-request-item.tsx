// ================================================
// FILE: src/features/contacts/components/friend-request-item.tsx
// FriendRequestItem Component - Friend request card
// ================================================

import { Check, X } from 'lucide-react';
import { UserAvatar } from '@/shared/components/common/user-avatar';
import { Button } from '@/shared/components/ui/button';
import { dateFormatter } from '@/shared/utils/date-formatter';
import type { FriendRequestWithDetails } from '../types/contact.types';

interface FriendRequestItemProps {
  request: FriendRequestWithDetails;
  type: 'received' | 'sent';
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
}

export const FriendRequestItem = ({
  request,
  type,
  onAccept,
  onReject,
  onCancel,
}: FriendRequestItemProps) => {
  const user = type === 'received' ? request.sender : request.receiver;

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
      <UserAvatar
        src={user.avatar}
        name={user.name}
        size="lg"
      />

      <div className="flex-1 overflow-hidden">
        <h4 className="truncate font-semibold text-foreground">
          {user.name}
        </h4>

        <p className="truncate text-sm text-muted-foreground">
          {user.username ? `@${user.username}` : user.email}
        </p>

        <p className="text-xs text-muted-foreground mt-1">
          {dateFormatter.relativeTime(request.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {type === 'received' ? (
          <>
            <Button
              size="icon"
              variant="ghost"
              onClick={onReject}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-5 w-5" />
            </Button>

            <Button
              size="icon"
              onClick={onAccept}
              className="bg-green-500 hover:bg-green-600"
            >
              <Check className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};