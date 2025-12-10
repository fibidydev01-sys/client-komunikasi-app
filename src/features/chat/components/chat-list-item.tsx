// ================================================
// FILE: src/features/chat/components/chat-list-item.tsx
// ChatListItem Component - Single chat item in list
// ================================================

import { UserAvatar } from '@/shared/components/common/user-avatar';
import { dateFormatter } from '@/shared/utils/date-formatter';
import { stringHelper } from '@/shared/utils/string-helper';
import { cn } from '@/shared/utils/cn';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { ChatWithDetails } from '../types/chat.types';

interface ChatListItemProps {
  chat: ChatWithDetails;
  onClick?: () => void;
  active?: boolean;
}

export const ChatListItem = ({ chat, onClick, active }: ChatListItemProps) => {
  const { user: currentUser } = useAuthStore();

  // Get other participant (for 1-on-1 chat)
  const otherParticipant = chat.participants.find(
    (p) => p.id !== currentUser?.id
  );

  const lastMessage = chat.messages?.[0];
  const displayName = chat.isGroup
    ? chat.groupName
    : otherParticipant?.name || 'Unknown';

  const displayAvatar = chat.isGroup
    ? chat.groupAvatar
    : otherParticipant?.avatar;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-muted/50',
        active && 'bg-muted'
      )}
    >
      <UserAvatar
        src={displayAvatar}
        name={displayName || 'Chat'}
        size="lg"
        online={otherParticipant?.isOnline}
      />

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <h4 className="truncate font-semibold text-foreground">
            {displayName}
          </h4>

          {lastMessage && (
            <span className="text-xs text-muted-foreground">
              {dateFormatter.chatListTime(lastMessage.createdAt)}
            </span>
          )}
        </div>

        {lastMessage && (
          <p className="truncate text-sm text-muted-foreground">
            {lastMessage.type === 'text'
              ? stringHelper.truncate(lastMessage.content, 50)
              : `${lastMessage.type.charAt(0).toUpperCase() + lastMessage.type.slice(1)}`
            }
          </p>
        )}
      </div>

      {lastMessage && !lastMessage.read && (
        <div className="h-2 w-2 rounded-full bg-primary" />
      )}
    </div>
  );
};