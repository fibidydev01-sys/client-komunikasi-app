// ================================================
// FILE: src/features/call/hooks/use-call.ts
// FIXED: Added state locking to prevent race conditions
// ================================================

import { useEffect, useRef, useCallback } from 'react';
import { useCallStore } from '../store/call.store';
import { useCallSocket } from './use-call-socket';
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

  useCallSocket();

  // ✅ ADD: Refs to prevent duplicate operations
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

  // ✅ FIXED: Prevent duplicate initiate calls
  const handleInitiateCall = useCallback(async (data: InitiateCallInput) => {
    // Prevent duplicate calls
    if (isInitiatingRef.current) {
      logger.warn('useCall: Initiate already in progress, ignoring...');
      return null;
    }

    // Prevent if already in a call
    if (activeCall) {
      logger.warn('useCall: Already in a call, ignoring...');
      return null;
    }

    isInitiatingRef.current = true;

    try {
      logger.debug('useCall: Initiating call...');
      const call = await initiateCall(data);
      logger.success('useCall: Call created, activeCall will trigger modal');
      return call;
    } catch (error) {
      logger.error('useCall: Failed to initiate call:', error);
      throw error;
    } finally {
      // Reset after a small delay to prevent rapid re-clicks
      setTimeout(() => {
        isInitiatingRef.current = false;
      }, 1000);
    }
  }, [activeCall, initiateCall]);

  // ✅ FIXED: Prevent duplicate answer calls
  const handleAnswerCall = useCallback(async (callId: string) => {
    // Prevent duplicate answers
    if (isAnsweringRef.current) {
      logger.warn('useCall: Answer already in progress, ignoring...');
      return;
    }

    isAnsweringRef.current = true;

    try {
      logger.debug('useCall: Answering call:', callId);

      // Stop ringtone
      const audio = (window as any).__incomingCallAudio;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        (window as any).__incomingCallAudio = null;
      }

      await answerCall(callId);
      logger.success('useCall: Call answered, modal will show automatically');
    } catch (error) {
      logger.error('useCall: Failed to answer call:', error);
      throw error;
    } finally {
      // Reset after a delay
      setTimeout(() => {
        isAnsweringRef.current = false;
      }, 2000);
    }
  }, [answerCall]);

  // ✅ FIXED: Prevent duplicate reject calls
  const handleRejectCall = useCallback(async (callId: string) => {
    if (isRejectingRef.current) {
      logger.warn('useCall: Reject already in progress, ignoring...');
      return;
    }

    isRejectingRef.current = true;

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
    } finally {
      setTimeout(() => {
        isRejectingRef.current = false;
      }, 1000);
    }
  }, [rejectCall]);

  // ✅ FIXED: Prevent duplicate end calls
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