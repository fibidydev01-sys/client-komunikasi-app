// ================================================
// FILE: src/features/call/hooks/use-webrtc.ts
// FIXED: Added proper cleanup, call state validation, and abort handling
// ================================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { socketClient } from '@/lib/socket-client';
import { useCallStore } from '../store/call.store';
import { SOCKET_EVENTS } from '@/shared/constants/socket-events';
import { toastHelper } from '@/shared/utils/toast-helper';
import { logger } from '@/shared/utils/logger';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

interface UseWebRTCProps {
  callId: string;
  otherUserId: string;
  isCaller: boolean;
  isVideoCall: boolean;
}

interface WebRTCSignalData {
  callId: string;
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
  to: string;
}

export const useWebRTC = ({ callId, otherUserId, isCaller, isVideoCall }: UseWebRTCProps) => {
  const {
    setLocalStream,
    setRemoteStream,
    setIsConnected,
    setConnectionState,
    activeCall, // ✅ ADD: Get activeCall to check if call is still valid
  } = useCallStore();

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const offerTimeoutRef = useRef<NodeJS.Timeout | null>(null); // ✅ ADD: Track offer timeout
  const isCleanedUpRef = useRef(false); // ✅ ADD: Track cleanup state

  const [isInitialized, setIsInitialized] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // ✅ ADD: Check if call is still valid
  const isCallValid = useCallback(() => {
    const valid = activeCall?.id === callId && activeCall?.status !== 'ENDED';
    if (!valid) {
      logger.warn('WebRTC: Call is no longer valid, callId:', callId);
    }
    return valid;
  }, [activeCall, callId]);

  const getUserMedia = useCallback(async () => {
    // ✅ CHECK: Don't proceed if cleaned up
    if (isCleanedUpRef.current) {
      throw new Error('WebRTC already cleaned up');
    }

    try {
      logger.debug('WebRTC: 🎤 Requesting user media...');

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: isVideoCall ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // ✅ CHECK: Don't set if cleaned up during await
      if (isCleanedUpRef.current) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('WebRTC cleaned up during media acquisition');
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setMediaError(null);

      logger.success('WebRTC: ✅ User media obtained');
      return stream;
    } catch (error: any) {
      logger.error('WebRTC: ❌ Failed to get user media:', error);
      setMediaError('Failed to access camera/microphone');
      toastHelper.error('Failed to access camera/microphone');
      throw error;
    }
  }, [isVideoCall, setLocalStream]);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      logger.warn('WebRTC: Peer connection already exists');
      return peerConnectionRef.current;
    }

    if (isCleanedUpRef.current) {
      logger.warn('WebRTC: Cannot create peer connection - already cleaned up');
      return null;
    }

    logger.debug('WebRTC: 🔧 Creating peer connection...');

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      // ✅ CHECK: Don't send if cleaned up or call invalid
      if (isCleanedUpRef.current || !isCallValid()) {
        logger.warn('WebRTC: Ignoring ICE candidate - call ended');
        return;
      }

      if (event.candidate) {
        logger.debug('WebRTC: 📤 Sending ICE candidate to:', otherUserId);

        socketClient.emit(SOCKET_EVENTS.WEBRTC_ICE, {
          callId,
          signal: event.candidate.toJSON(),
          to: otherUserId,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      logger.debug('WebRTC: ICE state:', state);

      if (isCleanedUpRef.current) return;

      if (state === 'connected' || state === 'completed') {
        setIsConnected(true);
        logger.success('WebRTC: ✅ Connected!');
      } else if (state === 'disconnected') {
        setIsConnected(false);
        logger.warn('WebRTC: ⚠️ Disconnected');
      } else if (state === 'failed') {
        setIsConnected(false);
        logger.error('WebRTC: ❌ Connection failed');
        toastHelper.error('Connection failed');
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      logger.debug('WebRTC: Connection state:', state);

      if (isCleanedUpRef.current) return;

      setConnectionState(state);

      if (state === 'connected') {
        setIsConnected(true);
        toastHelper.success('Call connected!');
      } else if (state === 'failed') {
        setIsConnected(false);
        toastHelper.error('Connection failed');
      }
    };

    pc.ontrack = (event) => {
      if (isCleanedUpRef.current) return;

      logger.success('WebRTC: 🎥 Remote track received');
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    logger.success('WebRTC: ✅ Peer connection created');
    return pc;
  }, [callId, otherUserId, setIsConnected, setConnectionState, setRemoteStream, isCallValid]);

  const createAndSendOffer = useCallback(async () => {
    // ✅ CHECK: Don't proceed if cleaned up or call invalid
    if (isCleanedUpRef.current || !isCallValid()) {
      logger.warn('WebRTC: Cannot send offer - call ended or cleaned up');
      return;
    }

    const pc = peerConnectionRef.current;
    if (!pc) {
      logger.error('WebRTC: No peer connection for offer');
      return;
    }

    try {
      logger.debug('WebRTC: 📤 Creating offer...');

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideoCall,
      });

      // ✅ CHECK again after await
      if (isCleanedUpRef.current || !isCallValid()) {
        logger.warn('WebRTC: Call ended during offer creation');
        return;
      }

      await pc.setLocalDescription(offer);

      logger.debug('WebRTC: 📤 Sending offer to:', otherUserId);

      socketClient.emit(SOCKET_EVENTS.WEBRTC_OFFER, {
        callId,
        signal: offer,
        to: otherUserId,
      });

      logger.success('WebRTC: ✅ Offer sent');
    } catch (error) {
      logger.error('WebRTC: ❌ Failed to create offer:', error);
      if (!isCleanedUpRef.current) {
        toastHelper.error('Failed to establish connection');
      }
    }
  }, [callId, otherUserId, isVideoCall, isCallValid]);

  const handleOffer = useCallback(async (data: WebRTCSignalData) => {
    if (data.callId !== callId) return;
    if (!('type' in data.signal) || data.signal.type !== 'offer') return;
    if (isCleanedUpRef.current || !isCallValid()) return;

    const pc = peerConnectionRef.current;
    if (!pc) {
      logger.error('WebRTC: No peer connection for handling offer');
      return;
    }

    try {
      logger.debug('WebRTC: 📥 Received offer, creating answer...');

      await pc.setRemoteDescription(new RTCSessionDescription(data.signal as RTCSessionDescriptionInit));

      // Process pending candidates
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];

      // ✅ CHECK after await
      if (isCleanedUpRef.current || !isCallValid()) return;

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      logger.debug('WebRTC: 📤 Sending answer to:', otherUserId);

      socketClient.emit(SOCKET_EVENTS.WEBRTC_ANSWER, {
        callId,
        signal: answer,
        to: otherUserId,
      });

      logger.success('WebRTC: ✅ Answer sent');
    } catch (error) {
      logger.error('WebRTC: ❌ Failed to handle offer:', error);
    }
  }, [callId, otherUserId, isCallValid]);

  const handleAnswer = useCallback(async (data: WebRTCSignalData) => {
    if (data.callId !== callId) return;
    if (!('type' in data.signal) || data.signal.type !== 'answer') return;
    if (isCleanedUpRef.current) return;

    const pc = peerConnectionRef.current;
    if (!pc) {
      logger.error('WebRTC: No peer connection for handling answer');
      return;
    }

    try {
      logger.debug('WebRTC: 📥 Received answer');

      await pc.setRemoteDescription(new RTCSessionDescription(data.signal as RTCSessionDescriptionInit));

      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];

      logger.success('WebRTC: ✅ Answer applied');
    } catch (error) {
      logger.error('WebRTC: ❌ Failed to handle answer:', error);
    }
  }, [callId]);

  const handleICE = useCallback(async (data: WebRTCSignalData) => {
    if (data.callId !== callId) return;
    if (!('candidate' in data.signal)) return;
    if (isCleanedUpRef.current) return;

    const pc = peerConnectionRef.current;

    try {
      const candidate = new RTCIceCandidate(data.signal as RTCIceCandidateInit);

      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(candidate);
        logger.debug('WebRTC: ✅ ICE candidate added');
      } else {
        pendingCandidatesRef.current.push(candidate);
        logger.debug('WebRTC: 📦 ICE candidate queued');
      }
    } catch (error) {
      logger.error('WebRTC: ❌ Failed to add ICE candidate:', error);
    }
  }, [callId]);

  const initializeCall = useCallback(async () => {
    if (isInitialized) {
      logger.warn('WebRTC: Already initialized');
      return;
    }

    if (isCleanedUpRef.current) {
      logger.warn('WebRTC: Cannot initialize - already cleaned up');
      return;
    }

    try {
      logger.debug('WebRTC: 🚀 Initializing call...', { isCaller, isVideoCall });

      const stream = await getUserMedia();
      const pc = createPeerConnection();

      if (!pc) {
        throw new Error('Failed to create peer connection');
      }

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
        logger.debug('WebRTC: ➕ Added track:', track.kind);
      });

      setIsInitialized(true);

      // ✅ FIXED: Only caller sends offer, with cancellable timeout
      if (isCaller) {
        logger.debug('WebRTC: Caller waiting 2 seconds before sending offer...');

        // Clear any existing timeout
        if (offerTimeoutRef.current) {
          clearTimeout(offerTimeoutRef.current);
        }

        offerTimeoutRef.current = setTimeout(async () => {
          // ✅ CHECK before sending offer
          if (!isCleanedUpRef.current && isCallValid()) {
            await createAndSendOffer();
          } else {
            logger.warn('WebRTC: Offer cancelled - call ended');
          }
        }, 2000);
      }

      logger.success('WebRTC: ✅ Call initialized');
    } catch (error) {
      logger.error('WebRTC: ❌ Failed to initialize call:', error);
    }
  }, [isInitialized, isCaller, isVideoCall, getUserMedia, createPeerConnection, createAndSendOffer, isCallValid]);

  const cleanup = useCallback(() => {
    logger.debug('WebRTC: 🧹 Cleaning up...');

    // ✅ SET cleanup flag first to prevent any new operations
    isCleanedUpRef.current = true;

    // ✅ Cancel pending offer timeout
    if (offerTimeoutRef.current) {
      clearTimeout(offerTimeoutRef.current);
      offerTimeoutRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    pendingCandidatesRef.current = [];
    setIsInitialized(false);

    logger.debug('WebRTC: ✅ Cleanup complete');
  }, []);

  // ✅ ADD: Reset cleanup flag when callId changes (new call)
  useEffect(() => {
    isCleanedUpRef.current = false;
  }, [callId]);

  // Socket listeners
  useEffect(() => {
    logger.debug('WebRTC: 👂 Setting up socket listeners...');

    socketClient.on(SOCKET_EVENTS.WEBRTC_OFFER, handleOffer);
    socketClient.on(SOCKET_EVENTS.WEBRTC_ANSWER, handleAnswer);
    socketClient.on(SOCKET_EVENTS.WEBRTC_ICE, handleICE);

    return () => {
      socketClient.off(SOCKET_EVENTS.WEBRTC_OFFER, handleOffer);
      socketClient.off(SOCKET_EVENTS.WEBRTC_ANSWER, handleAnswer);
      socketClient.off(SOCKET_EVENTS.WEBRTC_ICE, handleICE);
    };
  }, [handleOffer, handleAnswer, handleICE]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    initializeCall,
    cleanup,
    isInitialized,
    mediaError,
  };
};