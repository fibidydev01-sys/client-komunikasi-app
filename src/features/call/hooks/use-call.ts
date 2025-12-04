// ================================================
// FILE: src/features/call/hooks/use-call.ts
// useCall Hook - FIXED: Navigate AFTER WebRTC setup
// ================================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCallStore } from '../store/call.store';
import { useCallSocket } from './use-call-socket';
import { ROUTE_PATHS } from '@/shared/constants/route-paths';
import { logger } from '@/shared/utils/logger';
import type { InitiateCallInput } from '../types/call.types';

// Global flag to prevent multiple fetches
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

  // Initialize socket listeners
  useCallSocket();

  // Fetch call history only once
  useEffect(() => {
    if (!GLOBAL_CALL_HISTORY_FETCHED) {
      logger.debug('useCall: Fetching call history (first time only)');
      fetchCallHistory();
      GLOBAL_CALL_HISTORY_FETCHED = true;
    }
  }, [fetchCallHistory]);

  // ✅ FIX: Navigate AFTER WebRTC offer is sent
  const handleInitiateCall = async (data: InitiateCallInput) => {
    try {
      logger.debug('useCall: Initiating call...');

      // Create call in database
      const call = await initiateCall(data);

      logger.success('useCall: Call created in DB:', call.id);

      // ✅ FIX: Wait for WebRTC negotiation to start BEFORE navigating
      // Give time for offer/ice to be sent (500ms should be enough)
      await new Promise(resolve => setTimeout(resolve, 500));

      // NOW navigate to active call page
      navigate(ROUTE_PATHS.ACTIVE_CALL);

      logger.success('useCall: Navigated to active call page');

      return call;
    } catch (error) {
      logger.error('useCall: Failed to initiate call:', error);
      throw error;
    }
  };

  // Handle answer call - DON'T navigate
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

      // Answer call - modal will open automatically via activeCall state
      await answerCall(callId);

      logger.success('useCall: Call answered, modal will open automatically');
    } catch (error) {
      logger.error('useCall: Failed to answer call:', error);
      throw error;
    }
  };

  // Handle reject call
  const handleRejectCall = async (callId: string) => {
    try {
      logger.debug('useCall: Rejecting call:', callId);

      // Stop ringtone if playing
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

  // Handle end call
  const handleEndCall = async (callId: string, duration?: number) => {
    try {
      logger.debug('useCall: Ending call:', callId);
      await endCall(callId, duration);
      navigate(ROUTE_PATHS.CALLS);
      logger.success('useCall: Call ended, navigating to calls page');
    } catch (error) {
      logger.error('useCall: Failed to end call:', error);
      throw error;
    }
  };

  // Handle delete call log
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

// Reset function for logout
export const resetCallFetch = () => {
  GLOBAL_CALL_HISTORY_FETCHED = false;
  logger.debug('useCall: Reset fetch flag');
};