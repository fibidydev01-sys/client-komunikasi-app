// ================================================
// FILE: src/app/providers/socket-provider.tsx
// SocketProvider - Handle socket & ALL listeners (FIXED)
// ================================================

import { useEffect, useRef, ReactNode } from 'react';
// ❌ HAPUS: import { useNavigate } from 'react-router-dom';
import { socketClient } from '@/lib/socket-client';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useChatStore } from '@/features/chat/store/chat.store';
import { useCallStore } from '@/features/call/store/call.store';
import { authService } from '@/features/auth/services/auth.service';
import { SOCKET_EVENTS } from '@/shared/constants/socket-events';
// ❌ HAPUS: import { ROUTE_PATHS } from '@/shared/constants/route-paths';
import { toastHelper } from '@/shared/utils/toast-helper';
import { logger } from '@/shared/utils/logger';
import type { MessageWithDetails } from '@/features/chat/types/chat.types';
import type { CallWithDetails } from '@/features/call/types/call.types';

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  // ❌ HAPUS: const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addMessage, setTyping } = useChatStore();
  const {
    setIncomingCall,
    setActiveCall,
    cleanupStreams,
    activeCall
  } = useCallStore();

  const hasConnected = useRef(false);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isAuthenticated && !hasConnected.current && !socketClient.isConnected()) {
      const token = authService.getToken();

      if (!token) {
        logger.warn('Socket Provider: No token found, skipping connection');
        return;
      }

      try {
        hasConnected.current = true;
        logger.debug('Socket Provider: Connecting to socket...');

        socketClient.connect(token);

        logger.success('Socket Provider: ✅ Socket connected');

        // ============================================
        // CHAT LISTENERS
        // ============================================
        const handleMessageReceive = (message: MessageWithDetails) => {
          logger.debug('Socket: 💬 Message received:', message.id);
          addMessage(message);
        };

        const handleTypingStart = (data: { userId: string; chatId: string }) => {
          logger.debug('Socket: ⌨️ Typing start:', data);
          setTyping(data.chatId, data.userId, true);
        };

        const handleTypingStop = (data: { userId: string; chatId: string }) => {
          logger.debug('Socket: ⌨️ Typing stop:', data);
          setTyping(data.chatId, data.userId, false);
        };

        // ============================================
        // CALL LISTENERS
        // ============================================
        const handleIncomingCall = (data: { call: CallWithDetails }) => {
          logger.info('Socket: 📞 INCOMING CALL from:', data.call.caller.name);

          setIncomingCall(data.call);
          toastHelper.info(`📞 Incoming call from ${data.call.caller.name}`);

          // Play ringtone
          try {
            ringtoneRef.current = new Audio('/sounds/ringtone.mp3');
            ringtoneRef.current.loop = true;
            ringtoneRef.current.volume = 0.5;
            ringtoneRef.current.play().catch(() => {
              logger.warn('Socket: Ringtone autoplay blocked');
            });
          } catch (e) {
            logger.warn('Socket: Failed to load ringtone');
          }

          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('Incoming Call', {
              body: `${data.call.caller.name} is calling you`,
              icon: data.call.caller.avatar || '/phone-icon.png',
              tag: 'incoming-call',
              requireInteraction: true,
            });

            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          }
        };

        const handleCallAnswered = (data: { call: CallWithDetails }) => {
          logger.success('Socket: ✅ Call ANSWERED by:', data.call.receiver.name);

          // Stop ringtone
          if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
            ringtoneRef.current = null;
          }

          setActiveCall(data.call);
          setIncomingCall(null);
          toastHelper.success(`${data.call.receiver.name} answered the call`);
        };

        const handleCallRejected = (data: { call: CallWithDetails }) => {
          logger.info('Socket: ❌ Call REJECTED by:', data.call.receiver.name);

          // Stop ringtone
          if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
            ringtoneRef.current = null;
          }

          cleanupStreams();
          setIncomingCall(null);
          setActiveCall(null);
          toastHelper.warning(`${data.call.receiver.name} declined the call`);
          // ❌ HAPUS: navigate(ROUTE_PATHS.CALLS);
          // ✅ Navigation akan di-handle oleh component yang listen ke activeCall
        };

        const handleCallEnded = (data: { call: CallWithDetails }) => {
          logger.info('Socket: 📞 Call ENDED:', data.call.id);

          // Stop ringtone
          if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
            ringtoneRef.current = null;
          }

          cleanupStreams();
          setActiveCall(null);
          setIncomingCall(null);
          toastHelper.info('Call ended');
          // ❌ HAPUS: navigate(ROUTE_PATHS.CALLS);
          // ✅ Navigation akan di-handle oleh component yang listen ke activeCall
        };

        // ============================================
        // REGISTER ALL LISTENERS
        // ============================================

        // Chat listeners
        socketClient.on(SOCKET_EVENTS.MESSAGE_RECEIVE, handleMessageReceive);
        socketClient.on(SOCKET_EVENTS.TYPING_START, handleTypingStart);
        socketClient.on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);

        // Call listeners
        socketClient.on(SOCKET_EVENTS.CALL_INCOMING, handleIncomingCall);
        socketClient.on(SOCKET_EVENTS.CALL_ANSWERED, handleCallAnswered);
        socketClient.on(SOCKET_EVENTS.CALL_REJECTED, handleCallRejected);
        socketClient.on(SOCKET_EVENTS.CALL_ENDED, handleCallEnded);

        logger.success('Socket Provider: ✅ All listeners registered');

      } catch (error) {
        logger.error('Socket Provider: Socket connection failed:', error);
        toastHelper.error('Failed to connect to server');
        hasConnected.current = false;
      }
    }

    // Cleanup on logout
    return () => {
      if (!isAuthenticated && hasConnected.current) {
        logger.debug('Socket Provider: User logged out, disconnecting socket');

        // Remove all listeners
        socketClient.off(SOCKET_EVENTS.MESSAGE_RECEIVE);
        socketClient.off(SOCKET_EVENTS.TYPING_START);
        socketClient.off(SOCKET_EVENTS.TYPING_STOP);
        socketClient.off(SOCKET_EVENTS.CALL_INCOMING);
        socketClient.off(SOCKET_EVENTS.CALL_ANSWERED);
        socketClient.off(SOCKET_EVENTS.CALL_REJECTED);
        socketClient.off(SOCKET_EVENTS.CALL_ENDED);

        // Stop ringtone
        if (ringtoneRef.current) {
          ringtoneRef.current.pause();
          ringtoneRef.current = null;
        }

        socketClient.disconnect();
        hasConnected.current = false;
      }
    };
  }, [
    isAuthenticated,
    addMessage,
    setTyping,
    setIncomingCall,
    setActiveCall,
    cleanupStreams,
    activeCall,
    // ❌ HAPUS: navigate dari dependencies
  ]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return <>{children}</>;
};