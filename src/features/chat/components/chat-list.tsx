// ================================================
// FILE: src/features/chat/components/chat-list.tsx
// ChatList Component - Display list of chats
// ================================================

import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { ChatListItem } from './chat-list-item';
import { EmptyState } from '@/shared/components/common/empty-state';
import { LoadingSpinner } from '@/shared/components/common/loading-spinner';
import { Button } from '@/shared/components/ui/button';
import { buildRoute } from '@/shared/constants/route-paths';
import type { ChatWithDetails } from '../types/chat.types';

interface ChatListProps {
  chats: ChatWithDetails[];
  isLoading?: boolean;
  onNewChat?: () => void;
}

export const ChatList = ({ chats, isLoading, onNewChat }: ChatListProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner text="Loading chats..." />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No chats yet"
        description="Start a conversation with your contacts"
        action={
          onNewChat && (
            <Button onClick={onNewChat}>
              Start New Chat
            </Button>
          )
        }
      />
    );
  }

  return (
    <div className="divide-y">
      {chats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          onClick={() => navigate(buildRoute.chatDetail(chat.id))}
        />
      ))}
    </div>
  );
};