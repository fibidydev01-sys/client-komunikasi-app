// ================================================
// FILE: src/features/call/store/call.store.ts
// FIXED V2: Proper state management with operation locks
// ================================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { callService } from '../services/call.service';
import { toastHelper } from '@/shared/utils/toast-helper';
import { logger } from '@/shared/utils/logger';
import type {
  CallWithDetails,
  InitiateCallInput,
} from '../types/call.types';

interface CallState {
  // State
  activeCall: CallWithDetails | null;
  incomingCall: CallWithDetails | null;
  callHistory: CallWithDetails[];
  isLoading: boolean;
  error: string | null;

  // WebRTC state
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isConnected: boolean;
  connectionState: string;

  // Operation locks
  isAnswering: boolean;
  isRejecting: boolean;
  isEnding: boolean;
  isInitiating: boolean;

  // Actions - Call
  initiateCall: (data: InitiateCallInput) => Promise<CallWithDetails>;
  answerCall: (callId: string) => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  endCall: (callId: string, duration?: number) => Promise<void>;
  setIncomingCall: (call: CallWithDetails | null) => void;
  setActiveCall: (call: CallWithDetails | null) => void;

  // Actions - Call History
  fetchCallHistory: () => Promise<void>;
  deleteCallLog: (callId: string) => Promise<void>;

  // Actions - WebRTC
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setIsConnected: (connected: boolean) => void;
  setConnectionState: (state: string) => void;
  toggleMute: () => void;
  toggleVideo: () => void;

  // Utils
  clearError: () => void;
  reset: () => void;
  cleanupStreams: () => void;
}

export const useCallStore = create<CallState>()(
  devtools(
    (set, get) => ({
      // Initial state
      activeCall: null,
      incomingCall: null,
      callHistory: [],
      isLoading: false,
      error: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoEnabled: true,
      isConnected: false,
      connectionState: 'new',
      isAnswering: false,
      isRejecting: false,
      isEnding: false,
      isInitiating: false,

      // Initiate call
      initiateCall: async (data) => {
        const state = get();

        if (state.isInitiating) {
          logger.warn('Call Store: Initiate already in progress');
          throw new Error('Call initiation already in progress');
        }

        if (state.activeCall) {
          logger.warn('Call Store: Already in a call');
          throw new Error('Already in a call');
        }

        set({ isInitiating: true, isLoading: true, error: null });

        try {
          logger.debug('Call Store: Initiating call...');
          const call = await callService.initiateCall(data);

          toastHelper.success('Calling...');

          set({
            activeCall: call,
            isLoading: false,
            isInitiating: false,
          });

          logger.success('Call Store: Call initiated:', call.id);
          return call;
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to initiate call';

          logger.error('Call Store: Initiate call failed:', error);
          toastHelper.error(errorMsg);

          set({
            error: errorMsg,
            isLoading: false,
            isInitiating: false,
          });
          throw error;
        }
      },

      // Answer call
      answerCall: async (callId) => {
        const state = get();

        if (state.isAnswering) {
          logger.warn('Call Store: Answer already in progress');
          return;
        }

        set({ isAnswering: true, isLoading: true, error: null });

        try {
          logger.debug('Call Store: Answering call:', callId);
          const call = await callService.answerCall(callId);

          toastHelper.success('Call connected!');

          set({
            activeCall: call,
            incomingCall: null,
            isLoading: false,
            isAnswering: false,
          });

          logger.success('Call Store: Call answered:', call.id);
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to answer call';

          logger.error('Call Store: Answer call failed:', error);
          toastHelper.error(errorMsg);

          set({
            error: errorMsg,
            isLoading: false,
            isAnswering: false,
          });
          throw error;
        }
      },

      // Reject call
      rejectCall: async (callId) => {
        const state = get();

        if (state.isRejecting) {
          logger.warn('Call Store: Reject already in progress');
          return;
        }

        set({ isRejecting: true });

        try {
          logger.debug('Call Store: Rejecting call:', callId);
          await callService.rejectCall(callId);

          toastHelper.success('Call rejected');

          set({
            incomingCall: null,
            isRejecting: false,
          });

          logger.success('Call Store: Call rejected');
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to reject call';

          logger.error('Call Store: Reject call failed:', error);
          toastHelper.error(errorMsg);

          set({
            error: errorMsg,
            isRejecting: false,
          });
          throw error;
        }
      },

      // End call
      endCall: async (callId, duration) => {
        const state = get();

        if (state.isEnding) {
          logger.warn('Call Store: End already in progress');
          return;
        }

        set({ isEnding: true });

        try {
          logger.debug('Call Store: Ending call:', callId, 'duration:', duration);

          // Cleanup streams first
          get().cleanupStreams();

          await callService.endCall(callId, duration);

          toastHelper.success('Call ended');

          set({
            activeCall: null,
            incomingCall: null,
            isConnected: false,
            connectionState: 'closed',
            isEnding: false,
          });

          logger.success('Call Store: Call ended');
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to end call';

          logger.error('Call Store: End call failed:', error);

          // Still cleanup even on error
          get().cleanupStreams();

          set({
            activeCall: null,
            incomingCall: null,
            error: errorMsg,
            isEnding: false,
          });
        }
      },

      // Set incoming call
      setIncomingCall: (call) => {
        const state = get();

        // Don't set if already in a call
        if (call && state.activeCall) {
          logger.warn('Call Store: Cannot set incoming call - already in a call');
          return;
        }

        logger.debug('Call Store: Setting incoming call:', call?.id);
        set({ incomingCall: call });
      },

      // Set active call
      setActiveCall: (call) => {
        logger.debug('Call Store: Setting active call:', call?.id);

        // If clearing active call, also reset connection state
        if (!call) {
          set({
            activeCall: null,
            isConnected: false,
            connectionState: 'new',
          });
        } else {
          set({ activeCall: call });
        }
      },

      // Fetch call history
      fetchCallHistory: async () => {
        set({ isLoading: true, error: null });
        try {
          logger.debug('Call Store: Fetching call history...');
          const history = await callService.getCallHistory();

          set({ callHistory: history, isLoading: false });

          logger.success('Call Store: Call history fetched:', history.length);
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to fetch call history';

          logger.error('Call Store: Fetch call history failed:', error);

          set({
            error: errorMsg,
            isLoading: false,
          });
        }
      },

      // Delete call log
      deleteCallLog: async (callId) => {
        try {
          logger.debug('Call Store: Deleting call log:', callId);
          await callService.deleteCallLog(callId);

          toastHelper.success('Call log deleted');

          set((state) => ({
            callHistory: state.callHistory.filter((c) => c.id !== callId),
          }));

          logger.success('Call Store: Call log deleted');
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to delete call log';

          logger.error('Call Store: Delete call log failed:', error);
          toastHelper.error(errorMsg);

          set({ error: errorMsg });
          throw error;
        }
      },

      // Set local stream
      setLocalStream: (stream) => {
        logger.debug('Call Store: Setting local stream:', stream ? 'present' : 'null');
        set({ localStream: stream });
      },

      // Set remote stream
      setRemoteStream: (stream) => {
        logger.debug('Call Store: Setting remote stream:', stream ? 'present' : 'null');
        set({ remoteStream: stream });
      },

      // Set connection status
      setIsConnected: (connected) => {
        logger.debug('Call Store: Setting isConnected:', connected);
        set({ isConnected: connected });
      },

      // Set connection state
      setConnectionState: (state) => {
        logger.debug('Call Store: Setting connectionState:', state);
        set({ connectionState: state });
      },

      // Toggle mute
      toggleMute: () => {
        const { localStream, isMuted } = get();
        if (localStream) {
          localStream.getAudioTracks().forEach((track) => {
            track.enabled = isMuted; // If muted, enable. If not muted, disable.
          });

          logger.debug('Call Store: Toggled mute:', !isMuted);
          set({ isMuted: !isMuted });
        }
      },

      // Toggle video
      toggleVideo: () => {
        const { localStream, isVideoEnabled } = get();
        if (localStream) {
          localStream.getVideoTracks().forEach((track) => {
            track.enabled = !isVideoEnabled;
          });

          logger.debug('Call Store: Toggled video:', !isVideoEnabled);
          set({ isVideoEnabled: !isVideoEnabled });
        }
      },

      // Cleanup streams
      cleanupStreams: () => {
        const { localStream, remoteStream } = get();

        logger.debug('Call Store: Cleaning up streams...');

        if (localStream) {
          localStream.getTracks().forEach((track) => {
            track.stop();
            logger.debug('Call Store: Stopped local track:', track.kind);
          });
        }

        if (remoteStream) {
          remoteStream.getTracks().forEach((track) => {
            track.stop();
            logger.debug('Call Store: Stopped remote track:', track.kind);
          });
        }

        set({
          localStream: null,
          remoteStream: null,
          isMuted: false,
          isVideoEnabled: true,
          isConnected: false,
          connectionState: 'closed',
        });

        logger.debug('Call Store: Streams cleaned up');
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Reset store
      reset: () => {
        get().cleanupStreams();

        logger.debug('Call Store: Reset');

        set({
          activeCall: null,
          incomingCall: null,
          callHistory: [],
          isLoading: false,
          error: null,
          localStream: null,
          remoteStream: null,
          isMuted: false,
          isVideoEnabled: true,
          isConnected: false,
          connectionState: 'new',
          isAnswering: false,
          isRejecting: false,
          isEnding: false,
          isInitiating: false,
        });
      },
    }),
    { name: 'CallStore' }
  )
);