// ================================================
// FILE: src/features/chat/components/chat-room.tsx
// ChatRoom Component - Single chat room view (WITH CALL BUTTONS)
// ================================================

import { useEffect, useRef } from 'react';
import { ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { UserAvatar } from '@/shared/components/common/user-avatar';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { LoadingSpinner } from '@/shared/components/common/loading-spinner';
import { useChat } from '../hooks/use-chat';
import { useCall } from '@/features/call/hooks/use-call'; // ✅ IMPORT CALL HOOK
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ROUTE_PATHS } from '@/shared/constants/route-paths';
import { CallType } from '@/features/call/types/call.types'; // ✅ IMPORT CALL TYPE
import { logger } from '@/shared/utils/logger';

export const ChatRoom = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    activeChat,
    messages,
    isLoading,
    sendMessage,
    startTyping,
    stopTyping
  } = useChat();

  // ✅ ADD: Call hook
  const { initiateCall } = useCall();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner text="Loading messages..." />
      </div>
    );
  }

  if (!activeChat) {
    return null;
  }

  const otherParticipant = activeChat.participants.find(
    (p) => p.id !== user?.id
  );

  const displayName = activeChat.isGroup
    ? activeChat.groupName
    : otherParticipant?.name || 'Unknown';

  // ✅ ADD: Handle voice call
  const handleVoiceCall = async () => {
    if (!otherParticipant) {
      logger.error('ChatRoom: Cannot initiate call - No participant found');
      return;
    }

    try {
      logger.debug('ChatRoom: Initiating voice call to:', otherParticipant.name);

      await initiateCall({
        receiverId: otherParticipant.id,
        type: CallType.VOICE,
      });

      logger.success('ChatRoom: Voice call initiated');
    } catch (error) {
      logger.error('ChatRoom: Failed to initiate voice call:', error);
    }
  };

  // ✅ ADD: Handle video call
  const handleVideoCall = async () => {
    if (!otherParticipant) {
      logger.error('ChatRoom: Cannot initiate call - No participant found');
      return;
    }

    try {
      logger.debug('ChatRoom: Initiating video call to:', otherParticipant.name);

      await initiateCall({
        receiverId: otherParticipant.id,
        type: CallType.VIDEO,
      });

      logger.success('ChatRoom: Video call initiated');
    } catch (error) {
      logger.error('ChatRoom: Failed to initiate video call:', error);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-background p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(ROUTE_PATHS.CHATS)}
          className="lg:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <UserAvatar
          src={activeChat.isGroup ? activeChat.groupAvatar : otherParticipant?.avatar}
          name={displayName || 'Chat'}
          size="md"
          online={otherParticipant?.isOnline}
        />

        <div className="flex-1">
          <h2 className="font-semibold">{displayName}</h2>
          {otherParticipant?.isOnline && (
            <p className="text-sm text-green-500">Online</p>
          )}
        </div>

        {/* ✅ FIXED: Call buttons with actual functionality */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceCall}
            disabled={activeChat.isGroup} // ✅ Disable for group chats
            title="Voice Call"
          >
            <Phone className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleVideoCall}
            disabled={activeChat.isGroup} // ✅ Disable for group chats
            title="Video Call"
          >
            <Video className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.senderId === user?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={(content) => sendMessage(content)}
        onTyping={startTyping}
        onStopTyping={stopTyping}
        chatId={activeChat.id}
      />
    </div>
  );
};