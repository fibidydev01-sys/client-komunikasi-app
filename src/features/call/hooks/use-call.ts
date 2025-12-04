// src/features/call/hooks/use-call.ts
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCallStore } from '../store/call.store';
import { useCallSocket } from './use-call-socket';
import { ROUTE_PATHS } from '@/shared/constants/route-paths';
import { logger } from '@/shared/utils/logger';
import type { InitiateCallInput } from '../types/call.types';

let GLOBAL_CALL_HISTORY_FETCHED = false;

export const useCall = () => {
  const navigate = useNavigate();
  const {
    activeCall,
    incomingCall,
    callHistory,
    isLoading,
    error,
    isMuted,
    isVideoEnabled,
    isConnected,
    connectionState,
    localStream,
    remoteStream,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    fetchCallHistory,
    deleteCallLog,
    toggleMute,
    toggleVideo,
    cleanupStreams,
    clearError,
  } = useCallStore();

  useCallSocket();

  useEffect(() => {
    if (!GLOBAL_CALL_HISTORY_FETCHED) {
      logger.debug('useCall: Fetching call history (first time only)');
      fetchCallHistory();
      GLOBAL_CALL_HISTORY_FETCHED = true;
    }
  }, [fetchCallHistory]);

  // ✅ FIX: JANGAN navigate langsung! Biarkan modal yang handle
  const handleInitiateCall = async (data: InitiateCallInput) => {
    try {
      logger.debug('useCall: Initiating call...');

      // Create call in database
      const call = await initiateCall(data);

      logger.success('useCall: Call created, activeCall will trigger modal');

      // ❌ HAPUS NAVIGATE! Modal akan muncul otomatis via activeCall state
      // navigate(ROUTE_PATHS.ACTIVE_CALL);

      return call;
    } catch (error) {
      logger.error('useCall: Failed to initiate call:', error);
      throw error;
    }
  };

  // ✅ FIX: Answer call TANPA navigate
  const handleAnswerCall = async (callId: string) => {
    try {
      logger.debug('useCall: Answering call:', callId);

      // Stop ringtone
      const audio = (window as any).__incomingCallAudio;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        (window as any).__incomingCallAudio = null;
      }

      // Answer call - modal akan muncul otomatis
      await answerCall(callId);

      logger.success('useCall: Call answered, modal will show automatically');
    } catch (error) {
      logger.error('useCall: Failed to answer call:', error);
      throw error;
    }
  };

  const handleRejectCall = async (callId: string) => {
    try {
      logger.debug('useCall: Rejecting call:', callId);

      const audio = (window as any).__incomingCallAudio;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        (window as any).__incomingCallAudio = null;
      }

      await rejectCall(callId);
      logger.success('useCall: Call rejected');
    } catch (error) {
      logger.error('useCall: Failed to reject call:', error);
      throw error;
    }
  };

  // ✅ FIX: End call TANPA navigate (modal akan close sendiri)
  const handleEndCall = async (callId: string, duration?: number) => {
    try {
      logger.debug('useCall: Ending call:', callId);
      await endCall(callId, duration);

      // ❌ HAPUS NAVIGATE! Modal akan close otomatis
      // navigate(ROUTE_PATHS.CALLS);

      logger.success('useCall: Call ended');
    } catch (error) {
      logger.error('useCall: Failed to end call:', error);
      throw error;
    }
  };

  const handleDeleteCallLog = async (callId: string) => {
    try {
      logger.debug('useCall: Deleting call log:', callId);
      await deleteCallLog(callId);
      logger.success('useCall: Call log deleted');
    } catch (error) {
      logger.error('useCall: Failed to delete call log:', error);
      throw error;
    }
  };

  return {
    activeCall,
    incomingCall,
    callHistory,
    isLoading,
    error,
    isMuted,
    isVideoEnabled,
    isConnected,
    connectionState,
    localStream,
    remoteStream,
    initiateCall: handleInitiateCall,
    answerCall: handleAnswerCall,
    rejectCall: handleRejectCall,
    endCall: handleEndCall,
    deleteCallLog: handleDeleteCallLog,
    toggleMute,
    toggleVideo,
    cleanupStreams,
    clearError,
  };
};

export const resetCallFetch = () => {
  GLOBAL_CALL_HISTORY_FETCHED = false;
  logger.debug('useCall: Reset fetch flag');
};