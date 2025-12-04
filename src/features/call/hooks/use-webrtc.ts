// ================================================
// FILE: src/features/call/hooks/use-webrtc.ts
// useWebRTC Hook - Complete WebRTC Implementation
// ================================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { socketClient } from '@/lib/socket-client';
import { useCallStore } from '../store/call.store';
import { SOCKET_EVENTS } from '@/shared/constants/socket-events';
import { toastHelper } from '@/shared/utils/toast-helper';
import { logger } from '@/shared/utils/logger';

// ICE Servers configuration (STUN servers for NAT traversal)
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
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
    localStream,
  } = useCallStore();

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const isNegotiatingRef = useRef(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // ============================================
  // GET USER MEDIA
  // ============================================
  const getUserMedia = useCallback(async () => {
    try {
      logger.debug('WebRTC: 🎤 Requesting user media...', { video: isVideoCall });

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: isVideoCall ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user',
          frameRate: { ideal: 30, max: 60 },
        } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      localStreamRef.current = stream;
      setLocalStream(stream);
      setMediaError(null);

      logger.success('WebRTC: ✅ User media obtained:', {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
      });

      return stream;
    } catch (error: any) {
      logger.error('WebRTC: ❌ Failed to get user media:', error);

      let errorMessage = 'Failed to access media devices';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera/Microphone permission denied. Please allow access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera/microphone found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera/Microphone is being used by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support the requested quality.';
      }

      setMediaError(errorMessage);
      toastHelper.error(errorMessage);
      throw error;
    }
  }, [isVideoCall, setLocalStream]);

  // ============================================
  // CREATE PEER CONNECTION
  // ============================================
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      logger.warn('WebRTC: Peer connection already exists');
      return peerConnectionRef.current;
    }

    logger.debug('WebRTC: 🔧 Creating peer connection...');

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // ICE Candidate handler - send to other peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        logger.debug('WebRTC: 📤 Sending ICE candidate');

        socketClient.emit(SOCKET_EVENTS.WEBRTC_ICE, {
          callId,
          signal: event.candidate.toJSON(),
          to: otherUserId,
        });
      }
    };

    // ICE Connection state change
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      logger.debug('WebRTC: ICE connection state:', state);

      if (state === 'connected' || state === 'completed') {
        setIsConnected(true);
        logger.success('WebRTC: ✅ ICE Connected!');
      } else if (state === 'disconnected') {
        setIsConnected(false);
        logger.warn('WebRTC: ⚠️ ICE Disconnected');
      } else if (state === 'failed') {
        setIsConnected(false);
        logger.error('WebRTC: ❌ ICE Failed');
        toastHelper.error('Connection failed. Please try again.');
      }
    };

    // Connection state change
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      logger.debug('WebRTC: Connection state:', state);
      setConnectionState(state);

      if (state === 'connected') {
        setIsConnected(true);
        toastHelper.success('Call connected!');
      } else if (state === 'failed') {
        setIsConnected(false);
        toastHelper.error('Connection failed');
      }
    };

    // Remote track received
    pc.ontrack = (event) => {
      logger.success('WebRTC: 🎥 Remote track received:', event.track.kind);

      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        logger.success('WebRTC: ✅ Remote stream set!');
      }
    };

    // Negotiation needed
    pc.onnegotiationneeded = async () => {
      if (isNegotiatingRef.current) {
        logger.warn('WebRTC: Already negotiating, skipping...');
        return;
      }

      if (isCaller) {
        try {
          isNegotiatingRef.current = true;
          await createAndSendOffer();
        } finally {
          isNegotiatingRef.current = false;
        }
      }
    };

    logger.success('WebRTC: ✅ Peer connection created');
    return pc;
  }, [callId, otherUserId, isCaller, setIsConnected, setConnectionState, setRemoteStream]);

  // ============================================
  // CREATE AND SEND OFFER (Caller)
  // ============================================
  const createAndSendOffer = useCallback(async () => {
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
      toastHelper.error('Failed to establish connection');
    }
  }, [callId, otherUserId, isVideoCall]);

  // ============================================
  // HANDLE INCOMING OFFER (Receiver)
  // ============================================
  const handleOffer = useCallback(async (data: WebRTCSignalData) => {
    if (data.callId !== callId) return;
    if (!('type' in data.signal) || data.signal.type !== 'offer') return;

    const pc = peerConnectionRef.current;
    if (!pc) {
      logger.error('WebRTC: No peer connection for handling offer');
      return;
    }

    try {
      logger.debug('WebRTC: 📥 Received offer, creating answer...');

      await pc.setRemoteDescription(new RTCSessionDescription(data.signal as RTCSessionDescriptionInit));

      // Add any pending ICE candidates
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];

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
  }, [callId, otherUserId]);

  // ============================================
  // HANDLE INCOMING ANSWER (Caller)
  // ============================================
  const handleAnswer = useCallback(async (data: WebRTCSignalData) => {
    if (data.callId !== callId) return;
    if (!('type' in data.signal) || data.signal.type !== 'answer') return;

    const pc = peerConnectionRef.current;
    if (!pc) {
      logger.error('WebRTC: No peer connection for handling answer');
      return;
    }

    try {
      logger.debug('WebRTC: 📥 Received answer');

      await pc.setRemoteDescription(new RTCSessionDescription(data.signal as RTCSessionDescriptionInit));

      // Add any pending ICE candidates
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];

      logger.success('WebRTC: ✅ Answer applied');
    } catch (error) {
      logger.error('WebRTC: ❌ Failed to handle answer:', error);
    }
  }, [callId]);

  // ============================================
  // HANDLE ICE CANDIDATE
  // ============================================
  const handleICE = useCallback(async (data: WebRTCSignalData) => {
    if (data.callId !== callId) return;
    if (!('candidate' in data.signal)) return;

    const pc = peerConnectionRef.current;

    try {
      const candidate = new RTCIceCandidate(data.signal as RTCIceCandidateInit);

      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(candidate);
        logger.debug('WebRTC: ✅ ICE candidate added');
      } else {
        // Queue candidate if remote description not set yet
        pendingCandidatesRef.current.push(candidate);
        logger.debug('WebRTC: 📦 ICE candidate queued');
      }
    } catch (error) {
      logger.error('WebRTC: ❌ Failed to add ICE candidate:', error);
    }
  }, [callId]);

  // ============================================
  // INITIALIZE CALL
  // ============================================
  const initializeCall = useCallback(async () => {
    if (isInitialized) {
      logger.warn('WebRTC: Already initialized');
      return;
    }

    try {
      logger.debug('WebRTC: 🚀 Initializing call...', { isCaller, isVideoCall });

      // Step 1: Get user media
      const stream = await getUserMedia();

      // Step 2: Create peer connection
      const pc = createPeerConnection();

      // Step 3: Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
        logger.debug('WebRTC: ➕ Added track:', track.kind);
      });

      setIsInitialized(true);

      // Step 4: If caller, create and send offer
      if (isCaller) {
        // Small delay to ensure everything is set up
        setTimeout(async () => {
          await createAndSendOffer();
        }, 500);
      }

      logger.success('WebRTC: ✅ Call initialized');
    } catch (error) {
      logger.error('WebRTC: ❌ Failed to initialize call:', error);
    }
  }, [isInitialized, isCaller, isVideoCall, getUserMedia, createPeerConnection, createAndSendOffer]);

  // ============================================
  // CLEANUP
  // ============================================
  const cleanup = useCallback(() => {
    logger.debug('WebRTC: 🧹 Cleaning up...');

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    pendingCandidatesRef.current = [];
    isNegotiatingRef.current = false;
    setIsInitialized(false);

    logger.debug('WebRTC: ✅ Cleanup complete');
  }, []);

  // ============================================
  // SOCKET EVENT LISTENERS
  // ============================================
  useEffect(() => {
    logger.debug('WebRTC: 👂 Setting up socket listeners...');

    // Listen for WebRTC offer (receiver only)
    socketClient.on(SOCKET_EVENTS.WEBRTC_OFFER, handleOffer);

    // Listen for WebRTC answer (caller only)
    socketClient.on(SOCKET_EVENTS.WEBRTC_ANSWER, handleAnswer);

    // Listen for ICE candidates (both)
    socketClient.on(SOCKET_EVENTS.WEBRTC_ICE, handleICE);

    return () => {
      socketClient.off(SOCKET_EVENTS.WEBRTC_OFFER, handleOffer);
      socketClient.off(SOCKET_EVENTS.WEBRTC_ANSWER, handleAnswer);
      socketClient.off(SOCKET_EVENTS.WEBRTC_ICE, handleICE);
    };
  }, [handleOffer, handleAnswer, handleICE]);

  // ============================================
  // CLEANUP ON UNMOUNT
  // ============================================
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