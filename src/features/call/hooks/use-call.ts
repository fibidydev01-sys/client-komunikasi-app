// ================================================
// FILE: src/features/call/hooks/use-call.ts
// CLEANED: Removed useCallSocket (moved to SocketProvider)
// ================================================

import { useEffect, useRef, useCallback } from 'react';
import { useCallStore } from '../store/call.store';
import { logger } from '@/shared/utils/logger';
import type { InitiateCallInput } from '../types/call.types';

let GLOBAL_CALL_HISTORY_FETCHED = false;

export const useCall = () => {
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

  // ✅ REMOVED: useCallSocket() - now handled in SocketProvider

  const isAnsweringRef = useRef(false);
  const isRejectingRef = useRef(false);
  const isEndingRef = useRef(false);
  const isInitiatingRef = useRef(false);

  useEffect(() => {
    if (!GLOBAL_CALL_HISTORY_FETCHED) {
      logger.debug('useCall: Fetching call history (first time only)');
      fetchCallHistory();
      GLOBAL_CALL_HISTORY_FETCHED = true;
    }
  }, [fetchCallHistory]);

  const handleInitiateCall = useCallback(async (data: InitiateCallInput) => {
    if (isInitiatingRef.current) {
      logger.warn('useCall: Initiate already in progress, ignoring...');
      return null;
    }

    if (activeCall) {
      logger.warn('useCall: Already in a call, ignoring...');
      return null;
    }

    isInitiatingRef.current = true;

    try {
      logger.debug('useCall: Initiating call...');
      const call = await initiateCall(data);
      logger.success('useCall: Call created');
      return call;
    } catch (error) {
      logger.error('useCall: Failed to initiate call:', error);
      throw error;
    } finally {
      setTimeout(() => {
        isInitiatingRef.current = false;
      }, 1000);
    }
  }, [activeCall, initiateCall]);

  const handleAnswerCall = useCallback(async (callId: string) => {
    if (isAnsweringRef.current) {
      logger.warn('useCall: Answer already in progress, ignoring...');
      return;
    }

    isAnsweringRef.current = true;

    try {
      logger.debug('useCall: Answering call:', callId);
      await answerCall(callId);
      logger.success('useCall: Call answered');
    } catch (error) {
      logger.error('useCall: Failed to answer call:', error);
      throw error;
    } finally {
      setTimeout(() => {
        isAnsweringRef.current = false;
      }, 2000);
    }
  }, [answerCall]);

  const handleRejectCall = useCallback(async (callId: string) => {
    if (isRejectingRef.current) {
      logger.warn('useCall: Reject already in progress, ignoring...');
      return;
    }

    isRejectingRef.current = true;

    try {
      logger.debug('useCall: Rejecting call:', callId);
      await rejectCall(callId);
      logger.success('useCall: Call rejected');
    } catch (error) {
      logger.error('useCall: Failed to reject call:', error);
      throw error;
    } finally {
      setTimeout(() => {
        isRejectingRef.current = false;
      }, 1000);
    }
  }, [rejectCall]);

  const handleEndCall = useCallback(async (callId: string, duration?: number) => {
    if (isEndingRef.current) {
      logger.warn('useCall: End already in progress, ignoring...');
      return;
    }

    isEndingRef.current = true;

    try {
      logger.debug('useCall: Ending call:', callId);
      await endCall(callId, duration);
      logger.success('useCall: Call ended');
    } catch (error) {
      logger.error('useCall: Failed to end call:', error);
      throw error;
    } finally {
      setTimeout(() => {
        isEndingRef.current = false;
      }, 1000);
    }
  }, [endCall]);

  const handleDeleteCallLog = useCallback(async (callId: string) => {
    try {
      logger.debug('useCall: Deleting call log:', callId);
      await deleteCallLog(callId);
      logger.success('useCall: Call log deleted');
    } catch (error) {
      logger.error('useCall: Failed to delete call log:', error);
      throw error;
    }
  }, [deleteCallLog]);

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