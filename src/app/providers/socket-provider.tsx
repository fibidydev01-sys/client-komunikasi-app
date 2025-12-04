// ================================================
// FILE: src/app/providers/socket-provider.tsx
// SocketProvider - Handle socket & listeners (FINAL)
// ================================================

import { useEffect, useRef, ReactNode } from 'react';
import { socketClient } from '@/lib/socket-client';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useChatStore } from '@/features/chat/store/chat.store';
import { authService } from '@/features/auth/services/auth.service';
import { SOCKET_EVENTS } from '@/shared/constants/socket-events';
import { toastHelper } from '@/shared/utils/toast-helper';
import { logger } from '@/shared/utils/logger';
import type { MessageWithDetails } from '@/features/chat/types/chat.types';

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const { isAuthenticated } = useAuthStore();
  const { addMessage, setTyping } = useChatStore();
  const hasConnected = useRef(false); // ✅ Track if already connected

  useEffect(() => {
    // ✅ Only connect if authenticated AND not already connected
    if (isAuthenticated && !hasConnected.current && !socketClient.isConnected()) {
      const token = authService.getToken();

      if (!token) {
        logger.warn('Socket Provider: No token found, skipping connection');
        return;
      }

      try {
        hasConnected.current = true; // ✅ Mark as connected BEFORE connecting
        logger.debug('Socket Provider: Connecting to socket...');

        socketClient.connect(token);

        logger.success('Socket Provider: Socket connected');

        // ✅ REGISTER LISTENERS HERE (ONCE ONLY!)
        const handleMessageReceive = (message: MessageWithDetails) => {
          logger.debug('Socket Provider: Message received:', message.id);
          addMessage(message);
        };

        const handleTypingStart = (data: { userId: string; chatId: string }) => {
          logger.debug('Socket Provider: Typing start:', data);
          setTyping(data.chatId, data.userId, true);
        };

        const handleTypingStop = (data: { userId: string; chatId: string }) => {
          logger.debug('Socket Provider: Typing stop:', data);
          setTyping(data.chatId, data.userId, false);
        };

        socketClient.on(SOCKET_EVENTS.MESSAGE_RECEIVE, handleMessageReceive);
        socketClient.on(SOCKET_EVENTS.TYPING_START, handleTypingStart);
        socketClient.on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);

        logger.success('Socket Provider: Socket listeners registered');

      } catch (error) {
        logger.error('Socket Provider: Socket connection failed:', error);
        toastHelper.error('Failed to connect to server');
        hasConnected.current = false; // ✅ Reset on error
      }
    }

    // ✅ CLEANUP: Only disconnect when user logs out
    return () => {
      if (!isAuthenticated && hasConnected.current) {
        logger.debug('Socket Provider: User logged out, disconnecting socket');
        socketClient.off(SOCKET_EVENTS.MESSAGE_RECEIVE);
        socketClient.off(SOCKET_EVENTS.TYPING_START);
        socketClient.off(SOCKET_EVENTS.TYPING_STOP);
        socketClient.disconnect();
        hasConnected.current = false;
      }
    };
  }, [isAuthenticated, addMessage, setTyping]); // ✅ Only re-run when isAuthenticated changes

  return <>{children}</>;
};