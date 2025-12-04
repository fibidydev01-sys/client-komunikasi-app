// ================================================
// FILE: src/features/chat/components/message-bubble.tsx
// MessageBubble Component - Single message bubble
// ================================================

import { UserAvatar } from '@/shared/components/common/user-avatar';
import { dateFormatter } from '@/shared/utils/date-formatter';
import { cn } from '@/shared/utils/cn';
import { Check, CheckCheck } from 'lucide-react';
import type { MessageWithDetails } from '../types/chat.types';

interface MessageBubbleProps {
  message: MessageWithDetails;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

export const MessageBubble = ({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true,
}: MessageBubbleProps) => {
  return (
    <div
      className={cn(
        'flex gap-2',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {showAvatar && !isOwn && (
        <UserAvatar
          src={message.sender.avatar}
          name={message.sender.name}
          size="sm"
        />
      )}

      <div
        className={cn(
          'flex max-w-[70%] flex-col gap-1',
          isOwn && 'items-end'
        )}
      >
        {/* Reply To */}
        {message.replyTo && (
          <div className={cn(
            'rounded-lg border-l-4 bg-muted/50 px-3 py-2 text-xs',
            isOwn ? 'border-primary' : 'border-muted-foreground'
          )}>
            <p className="font-semibold text-foreground">
              {message.replyTo.sender.name}
            </p>
            <p className="truncate text-muted-foreground">
              {message.replyTo.content}
            </p>
          </div>
        )}

        {/* Message Content */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2',
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          {message.type === 'image' && message.image && (
            <img
              src={message.image}
              alt="Message"
              className="mb-2 max-h-64 rounded-lg object-cover"
            />
          )}

          <p className="break-words text-sm">
            {message.content}
          </p>

          {showTimestamp && (
            <div className={cn(
              'mt-1 flex items-center gap-1 text-xs',
              isOwn ? 'justify-end text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              <span>
                {dateFormatter.messageTime(message.createdAt)}
              </span>

              {isOwn && (
                message.read ? (
                  <CheckCheck className="h-3 w-3" />
                ) : (
                  <Check className="h-3 w-3" />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};