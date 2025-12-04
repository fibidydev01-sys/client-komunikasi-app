// ================================================
// FILE: src/features/call/hooks/use-call-socket.ts
// useCallSocket Hook - Handle real-time call events
// ================================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketClient } from '@/lib/socket-client';
import { useCallStore } from '../store/call.store';
import { SOCKET_EVENTS } from '@/shared/constants/socket-events';
import { ROUTE_PATHS } from '@/shared/constants/route-paths';
import { toastHelper } from '@/shared/utils/toast-helper';
import { logger } from '@/shared/utils/logger';
import type { CallWithDetails } from '../types/call.types';

export const useCallSocket = () => {
  const navigate = useNavigate();
  const {
    setIncomingCall,
    setActiveCall,
    cleanupStreams,
    activeCall,
  } = useCallStore();

  // ============================================
  // INCOMING CALL
  // ============================================
  useEffect(() => {
    const handleIncomingCall = (data: { call: CallWithDetails }) => {
      logger.info('Call Socket: 📞 INCOMING CALL from:', data.call.caller.name);

      setIncomingCall(data.call);

      // Show notification toast
      toastHelper.info(`📞 Incoming call from ${data.call.caller.name}`);

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

      // Play ringtone sound (optional)
      try {
        const audio = new Audio('/sounds/ringtone.mp3');
        audio.loop = true;
        audio.play().catch(() => { });

        // Store audio reference for stopping later
        (window as any).__incomingCallAudio = audio;
      } catch (e) {
        // Ignore audio errors
      }
    };

    socketClient.on(SOCKET_EVENTS.CALL_INCOMING, handleIncomingCall);

    return () => {
      socketClient.off(SOCKET_EVENTS.CALL_INCOMING, handleIncomingCall);
    };
  }, [setIncomingCall]);

  // ============================================
  // CALL ANSWERED (other person picked up)
  // ============================================
  useEffect(() => {
    const handleCallAnswered = (data: { call: CallWithDetails }) => {
      logger.success('Call Socket: ✅ Call ANSWERED by:', data.call.receiver.name);

      // Stop ringtone if playing
      const audio = (window as any).__incomingCallAudio;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        (window as any).__incomingCallAudio = null;
      }

      setActiveCall(data.call);
      setIncomingCall(null);

      toastHelper.success(`${data.call.receiver.name} answered the call`);
    };

    socketClient.on(SOCKET_EVENTS.CALL_ANSWERED, handleCallAnswered);

    return () => {
      socketClient.off(SOCKET_EVENTS.CALL_ANSWERED, handleCallAnswered);
    };
  }, [setActiveCall, setIncomingCall]);

  // ============================================
  // CALL REJECTED
  // ============================================
  useEffect(() => {
    const handleCallRejected = (data: { call: CallWithDetails }) => {
      logger.info('Call Socket: ❌ Call REJECTED by:', data.call.receiver.name);

      // Stop ringtone if playing
      const audio = (window as any).__incomingCallAudio;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        (window as any).__incomingCallAudio = null;
      }

      cleanupStreams();
      setIncomingCall(null);
      setActiveCall(null);

      toastHelper.warning(`${data.call.receiver.name} declined the call`);

      // Navigate back to calls page
      navigate(ROUTE_PATHS.CALLS);
    };

    socketClient.on(SOCKET_EVENTS.CALL_REJECTED, handleCallRejected);

    return () => {
      socketClient.off(SOCKET_EVENTS.CALL_REJECTED, handleCallRejected);
    };
  }, [setIncomingCall, setActiveCall, cleanupStreams, navigate]);

  // ============================================
  // CALL ENDED (other person hung up)
  // ============================================
  useEffect(() => {
    const handleCallEnded = (data: { call: CallWithDetails }) => {
      logger.info('Call Socket: 📞 Call ENDED:', data.call.id);

      // Only handle if this is our active call
      if (activeCall?.id === data.call.id) {
        cleanupStreams();
        setActiveCall(null);
        setIncomingCall(null);

        toastHelper.info('Call ended');

        // Navigate back to calls page
        navigate(ROUTE_PATHS.CALLS);
      }
    };

    socketClient.on(SOCKET_EVENTS.CALL_ENDED, handleCallEnded);

    return () => {
      socketClient.off(SOCKET_EVENTS.CALL_ENDED, handleCallEnded);
    };
  }, [activeCall, cleanupStreams, setActiveCall, setIncomingCall, navigate]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
};