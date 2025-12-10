// ================================================
// FILE: src/features/call/hooks/use-webrtc.ts
// FIXED V2: Caller waits for call to be ANSWERED before sending offer
// ================================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { socketClient } from '@/lib/socket-client';
import { useCallStore } from '../store/call.store';
import { SOCKET_EVENTS } from '@/shared/constants/socket-events';
import { toastHelper } from '@/shared/utils/toast-helper';
import { logger } from '@/shared/utils/logger';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    // STUN servers (gratis, no signup)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },

    // ✅ TURN servers (gratis, no signup)
    // OpenRelay
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },

    // ✅ Twilio FREE TURN (public test servers)
    {
      urls: 'turn:global.turn.twilio.com:3478?transport=udp',
      username: 'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27f3d3',
      credential: 'w1uxM55V9yVoqyVFjt+meu6P9H6R3ABkWbMW1j9a+2s=',
    },
    {
      urls: 'turn:global.turn.twilio.com:443?transport=tcp',
      username: 'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27f3d3',
      credential: 'w1uxM55V9yVoqyVFjt+meu6P9H6R3ABkWbMW1j9a+2s=',
    },
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
  from?: string;
}

export const useWebRTC = ({ callId, otherUserId, isCaller, isVideoCall }: UseWebRTCProps) => {
  const {
    setLocalStream,
    setRemoteStream,
    setIsConnected,
    setConnectionState,
    activeCall,
  } = useCallStore();

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const isCleanedUpRef = useRef(false);
  const hasCreatedOfferRef = useRef(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // ✅ Check if call is answered
  const isCallAnswered = activeCall?.status === 'ANSWERED';

  const getUserMedia = useCallback(async () => {
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
      if (isCleanedUpRef.current) return;

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
        logger.success('WebRTC: ✅ ICE Connected!');
      } else if (state === 'disconnected') {
        setIsConnected(false);
        logger.warn('WebRTC: ⚠️ ICE Disconnected');
      } else if (state === 'failed') {
        setIsConnected(false);
        logger.error('WebRTC: ❌ ICE Connection failed');
        toastHelper.error('Connection failed - please try again');
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

      logger.success('WebRTC: 🎥 Remote track received:', event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    logger.success('WebRTC: ✅ Peer connection created');
    return pc;
  }, [callId, otherUserId, setIsConnected, setConnectionState, setRemoteStream]);

  // ✅ Create and send offer
  const createAndSendOffer = useCallback(async () => {
    if (isCleanedUpRef.current) {
      logger.warn('WebRTC: Cannot send offer - cleaned up');
      return;
    }

    if (hasCreatedOfferRef.current) {
      logger.warn('WebRTC: Offer already created, skipping...');
      return;
    }

    const pc = peerConnectionRef.current;
    if (!pc) {
      logger.error('WebRTC: No peer connection for offer');
      return;
    }

    try {
      hasCreatedOfferRef.current = true;
      logger.debug('WebRTC: 📤 Creating offer...');

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideoCall,
      });

      if (isCleanedUpRef.current) {
        logger.warn('WebRTC: Cleaned up during offer creation');
        return;
      }

      await pc.setLocalDescription(offer);

      logger.debug('WebRTC: 📤 Sending offer to:', otherUserId);

      socketClient.emit(SOCKET_EVENTS.WEBRTC_OFFER, {
        callId,
        signal: offer,
        to: otherUserId,
      });

      logger.success('WebRTC: ✅ Offer sent!');
    } catch (error) {
      hasCreatedOfferRef.current = false;
      logger.error('WebRTC: ❌ Failed to create offer:', error);
      toastHelper.error('Failed to establish connection');
    }
  }, [callId, otherUserId, isVideoCall]);

  // ✅ Handle incoming offer (for RECEIVER)
  const handleOffer = useCallback(async (data: WebRTCSignalData) => {
    if (data.callId !== callId) return;
    if (!('type' in data.signal) || data.signal.type !== 'offer') return;
    if (isCleanedUpRef.current) return;

    logger.debug('WebRTC: 📥 Received offer from caller');

    let pc = peerConnectionRef.current;

    // If no peer connection, create one and add tracks
    if (!pc) {
      logger.debug('WebRTC: Creating peer connection for incoming offer...');

      if (!localStreamRef.current) {
        try {
          await getUserMedia();
        } catch (error) {
          logger.error('WebRTC: Failed to get media for answer:', error);
          return;
        }
      }

      pc = createPeerConnection();
      if (!pc) {
        logger.error('WebRTC: Failed to create peer connection');
        return;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc!.addTrack(track, localStreamRef.current!);
          logger.debug('WebRTC: ➕ Added track to PC:', track.kind);
        });
      }
    }

    try {
      logger.debug('WebRTC: Setting remote description (offer)...');
      await pc.setRemoteDescription(new RTCSessionDescription(data.signal as RTCSessionDescriptionInit));

      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
        logger.debug('WebRTC: ✅ Added pending ICE candidate');
      }
      pendingCandidatesRef.current = [];

      if (isCleanedUpRef.current) return;

      logger.debug('WebRTC: Creating answer...');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      logger.debug('WebRTC: 📤 Sending answer to:', otherUserId);

      socketClient.emit(SOCKET_EVENTS.WEBRTC_ANSWER, {
        callId,
        signal: answer,
        to: otherUserId,
      });

      logger.success('WebRTC: ✅ Answer sent!');
    } catch (error) {
      logger.error('WebRTC: ❌ Failed to handle offer:', error);
    }
  }, [callId, otherUserId, getUserMedia, createPeerConnection]);

  // ✅ Handle incoming answer (for CALLER)
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
      logger.debug('WebRTC: 📥 Received answer from receiver');

      await pc.setRemoteDescription(new RTCSessionDescription(data.signal as RTCSessionDescriptionInit));

      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
        logger.debug('WebRTC: ✅ Added pending ICE candidate');
      }
      pendingCandidatesRef.current = [];

      logger.success('WebRTC: ✅ Answer applied, connection should establish...');
    } catch (error) {
      logger.error('WebRTC: ❌ Failed to handle answer:', error);
    }
  }, [callId]);

  // ✅ Handle ICE candidates
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

  // ✅ Initialize - different for caller vs receiver
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
      logger.debug('WebRTC: 🚀 Initializing...', { isCaller, isVideoCall });

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

      // ✅ CALLER: Wait for answer, don't send offer yet
      // ✅ RECEIVER: Wait for offer
      if (isCaller) {
        logger.debug('WebRTC: 📞 Caller ready, waiting for receiver to answer...');
      } else {
        logger.debug('WebRTC: 📞 Receiver ready, waiting for offer...');
      }

      logger.success('WebRTC: ✅ Initialization complete');
    } catch (error) {
      logger.error('WebRTC: ❌ Failed to initialize:', error);
    }
  }, [isInitialized, isCaller, isVideoCall, getUserMedia, createPeerConnection]);

  // ✅ CRITICAL: Caller sends offer ONLY when call is ANSWERED
  useEffect(() => {
    if (isCaller && isInitialized && isCallAnswered && !hasCreatedOfferRef.current && !isCleanedUpRef.current) {
      logger.debug('WebRTC: 🎯 Call ANSWERED! Caller sending offer now...');

      // Small delay to ensure receiver has time to initialize
      const timeout = setTimeout(() => {
        if (!isCleanedUpRef.current && !hasCreatedOfferRef.current) {
          createAndSendOffer();
        }
      }, 1000); // 1 second delay

      return () => clearTimeout(timeout);
    }
  }, [isCaller, isInitialized, isCallAnswered, createAndSendOffer]);

  // Cleanup function
  const cleanup = useCallback(() => {
    logger.debug('WebRTC: 🧹 Cleaning up...');

    isCleanedUpRef.current = true;
    hasCreatedOfferRef.current = false;

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

  // Reset when callId changes
  useEffect(() => {
    isCleanedUpRef.current = false;
    hasCreatedOfferRef.current = false;
  }, [callId]);

  // Socket listeners
  useEffect(() => {
    logger.debug('WebRTC: 👂 Setting up socket listeners for callId:', callId);

    socketClient.on(SOCKET_EVENTS.WEBRTC_OFFER, handleOffer);
    socketClient.on(SOCKET_EVENTS.WEBRTC_ANSWER, handleAnswer);
    socketClient.on(SOCKET_EVENTS.WEBRTC_ICE, handleICE);

    return () => {
      socketClient.off(SOCKET_EVENTS.WEBRTC_OFFER, handleOffer);
      socketClient.off(SOCKET_EVENTS.WEBRTC_ANSWER, handleAnswer);
      socketClient.off(SOCKET_EVENTS.WEBRTC_ICE, handleICE);
    };
  }, [callId, handleOffer, handleAnswer, handleICE]);

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