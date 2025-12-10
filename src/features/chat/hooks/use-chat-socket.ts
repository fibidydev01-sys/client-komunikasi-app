// ================================================
// FILE: src/features/chat/hooks/use-chat-socket.ts
// useChatSocket - Only for EMITTING (CLEANED)
// ================================================

import { useCallback } from 'react';
import { socketClient } from '@/lib/socket-client';
import { SOCKET_EVENTS } from '@/shared/constants/socket-events';
import { toastHelper } from '@/shared/utils/toast-helper';
import { logger } from '@/shared/utils/logger';

export const useChatSocket = () => {
  // ✅ ONLY EMIT FUNCTIONS, NO LISTENERS!

  // Send message via socket
  const sendMessage = useCallback((data: {
    chatId: string;
    content: string;
    type?: string;
    image?: string;
    replyToId?: string;
  }) => {
    if (!socketClient.isConnected()) {
      logger.error('useChatSocket: Cannot send message - Socket not connected');
      toastHelper.error('Not connected to server');
      return;
    }

    logger.debug('useChatSocket: Sending message to chat:', data.chatId);
    socketClient.emit(SOCKET_EVENTS.MESSAGE_SEND, data);
  }, []);

  // Start typing
  const startTyping = useCallback((chatId: string) => {
    if (socketClient.isConnected()) {
      logger.debug('useChatSocket: Start typing in chat:', chatId);
      socketClient.emit(SOCKET_EVENTS.TYPING_START, { chatId });
    }
  }, []);

  // Stop typing
  const stopTyping = useCallback((chatId: string) => {
    if (socketClient.isConnected()) {
      logger.debug('useChatSocket: Stop typing in chat:', chatId);
      socketClient.emit(SOCKET_EVENTS.TYPING_STOP, { chatId });
    }
  }, []);

  return {
    sendMessage,
    startTyping,
    stopTyping,
  };
};