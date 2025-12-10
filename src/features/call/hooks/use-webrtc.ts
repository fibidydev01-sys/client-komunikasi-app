// ================================================
// FILE: src/features/call/hooks/use-webrtc.ts
// FIXED: Prevent duplicate peer connection
// ================================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { socketClient } from '@/lib/socket-client';
import { useCallStore } from '../store/call.store';
import { SOCKET_EVENTS } from '@/shared/constants/socket-events';
import { toastHelper } from '@/shared/utils/toast-helper';

// ✅ XIRSYS TURN SERVERS
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    {
      urls: 'turn:ss-turn1.xirsys.com:80?transport=udp',
      username: 'UQMNbgnssp2Y96Fa4Qx7IL6LQ1nPymFsba7oeZqmzpklsZ5-Rfqu8o28ZyM7UfiYAAAAAGk4z5dmaWJpZHk=',
      credential: '3b91477e-d569-11f0-afc7-0242ac140004',
    },
    {
      urls: 'turn:ss-turn1.xirsys.com:3478?transport=udp',
      username: 'UQMNbgnssp2Y96Fa4Qx7IL6LQ1nPymFsba7oeZqmzpklsZ5-Rfqu8o28ZyM7UfiYAAAAAGk4z5dmaWJpZHk=',
      credential: '3b91477e-d569-11f0-afc7-0242ac140004',
    },
    {
      urls: 'turn:ss-turn1.xirsys.com:80?transport=tcp',
      username: 'UQMNbgnssp2Y96Fa4Qx7IL6LQ1nPymFsba7oeZqmzpklsZ5-Rfqu8o28ZyM7UfiYAAAAAGk4z5dmaWJpZHk=',
      credential: '3b91477e-d569-11f0-afc7-0242ac140004',
    },
    {
      urls: 'turn:ss-turn1.xirsys.com:3478?transport=tcp',
      username: 'UQMNbgnssp2Y96Fa4Qx7IL6LQ1nPymFsba7oeZqmzpklsZ5-Rfqu8o28ZyM7UfiYAAAAAGk4z5dmaWJpZHk=',
      credential: '3b91477e-d569-11f0-afc7-0242ac140004',
    },
    {
      urls: 'turns:ss-turn1.xirsys.com:443?transport=tcp',
      username: 'UQMNbgnssp2Y96Fa4Qx7IL6LQ1nPymFsba7oeZqmzpklsZ5-Rfqu8o28ZyM7UfiYAAAAAGk4z5dmaWJpZHk=',
      credential: '3b91477e-d569-11f0-afc7-0242ac140004',
    },
    {
      urls: 'turns:ss-turn1.xirsys.com:5349?transport=tcp',
      username: 'UQMNbgnssp2Y96Fa4Qx7IL6LQ1nPymFsba7oeZqmzpklsZ5-Rfqu8o28ZyM7UfiYAAAAAGk4z5dmaWJpZHk=',
      credential: '3b91477e-d569-11f0-afc7-0242ac140004',
    },
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'relay', // Force TURN
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
  const hasAddedTracksRef = useRef(false); // ✅ NEW: Track if tracks already added

  const [isInitialized, setIsInitialized] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const isCallAnswered = activeCall?.status === 'ANSWERED';

  const getUserMedia = useCallback(async () => {
    if (isCleanedUpRef.current) {
      throw new Error('WebRTC already cleaned up');
    }

    try {
      console.log('🎤 WebRTC: Requesting user media...');

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

      console.log('✅ WebRTC: User media obtained -', stream.getTracks().map(t => t.kind).join(', '));
      return stream;
    } catch (error: any) {
      console.error('❌ WebRTC: Failed to get user media:', error);
      setMediaError('Failed to access camera/microphone');
      toastHelper.error('Failed to access camera/microphone');
      throw error;
    }
  }, [isVideoCall, setLocalStream]);

  const createPeerConnection = useCallback(() => {
    // ✅ CRITICAL: Return existing if already created
    if (peerConnectionRef.current) {
      console.log('♻️ WebRTC: Reusing existing peer connection');
      return peerConnectionRef.current;
    }

    if (isCleanedUpRef.current) {
      console.warn('⚠️ WebRTC: Cannot create peer connection - already cleaned up');
      return null;
    }

    console.log('🔧 WebRTC: Creating NEW peer connection...');
    console.log('🔧 WebRTC: ICE Servers:', JSON.stringify(ICE_SERVERS.iceServers?.map(s => typeof s === 'string' ? s : s.urls), null, 2));

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (isCleanedUpRef.current) return;

      if (event.candidate) {
        console.log('🧊 WebRTC: Sending ICE candidate to:', otherUserId);

        socketClient.emit(SOCKET_EVENTS.WEBRTC_ICE, {
          callId,
          signal: event.candidate.toJSON(),
          to: otherUserId,
        });
      } else {
        console.log('🧊 WebRTC: ICE gathering complete');
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log('🔌 WebRTC: ICE connection state:', state);

      if (isCleanedUpRef.current) return;

      if (state === 'connected' || state === 'completed') {
        setIsConnected(true);
        console.log('✅ WebRTC: ICE Connected!');
        toastHelper.success('Call connected!');
      } else if (state === 'disconnected') {
        setIsConnected(false);
        console.warn('⚠️ WebRTC: ICE Disconnected');
      } else if (state === 'failed') {
        setIsConnected(false);
        console.error('❌ WebRTC: ICE Connection failed');
        toastHelper.error('Connection failed - please try again');
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('📡 WebRTC: Connection state:', state);

      if (isCleanedUpRef.current) return;

      setConnectionState(state);

      if (state === 'connected') {
        setIsConnected(true);
      } else if (state === 'failed') {
        setIsConnected(false);
        toastHelper.error('Connection failed');
      }
    };

    pc.ontrack = (event) => {
      if (isCleanedUpRef.current) return;

      console.log('🎥 WebRTC: Remote track received:', event.track.kind);
      if (event.streams && event.streams[0]) {
        console.log('✅ WebRTC: Setting remote stream');
        setRemoteStream(event.streams[0]);
      }
    };

    console.log('✅ WebRTC: Peer connection created');
    return pc;
  }, [callId, otherUserId, setIsConnected, setConnectionState, setRemoteStream]);

  // ✅ NEW: Add tracks to peer connection (with duplicate check)
  const addTracksToConnection = useCallback((pc: RTCPeerConnection, stream: MediaStream) => {
    if (hasAddedTracksRef.current) {
      console.log('⚠️ WebRTC: Tracks already added, skipping...');
      return;
    }

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
      console.log('➕ WebRTC: Added track:', track.kind);
    });

    hasAddedTracksRef.current = true;
    console.log('✅ WebRTC: All tracks added to peer connection');
  }, []);

  const createAndSendOffer = useCallback(async () => {
    if (isCleanedUpRef.current) {
      console.warn('⚠️ WebRTC: Cannot send offer - cleaned up');
      return;
    }

    if (hasCreatedOfferRef.current) {
      console.warn('⚠️ WebRTC: Offer already created, skipping...');
      return;
    }

    const pc = peerConnectionRef.current;
    if (!pc) {
      console.error('❌ WebRTC: No peer connection for offer');
      return;
    }

    try {
      hasCreatedOfferRef.current = true;
      console.log('📤 WebRTC: Creating offer...');

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideoCall,
      });

      if (isCleanedUpRef.current) {
        console.warn('⚠️ WebRTC: Cleaned up during offer creation');
        return;
      }

      await pc.setLocalDescription(offer);

      console.log('📤 WebRTC: Sending offer to:', otherUserId);

      socketClient.emit(SOCKET_EVENTS.WEBRTC_OFFER, {
        callId,
        signal: offer,
        to: otherUserId,
      });

      console.log('✅ WebRTC: Offer sent!');
    } catch (error) {
      hasCreatedOfferRef.current = false;
      console.error('❌ WebRTC: Failed to create offer:', error);
      toastHelper.error('Failed to establish connection');
    }
  }, [callId, otherUserId, isVideoCall]);

  const handleOffer = useCallback(async (data: WebRTCSignalData) => {
    if (data.callId !== callId) return;
    if (!('type' in data.signal) || data.signal.type !== 'offer') return;
    if (isCleanedUpRef.current) return;

    console.log('📥 WebRTC: Received offer from caller');

    // ✅ CRITICAL: Use existing peer connection or create new one
    let pc = peerConnectionRef.current;

    if (!pc) {
      console.log('🔧 WebRTC: Creating peer connection for incoming offer...');

      if (!localStreamRef.current) {
        try {
          await getUserMedia();
        } catch (error) {
          console.error('❌ WebRTC: Failed to get media for answer:', error);
          return;
        }
      }

      pc = createPeerConnection();
      if (!pc) {
        console.error('❌ WebRTC: Failed to create peer connection');
        return;
      }
    }

    // ✅ Add tracks if not already added
    if (localStreamRef.current && !hasAddedTracksRef.current) {
      addTracksToConnection(pc, localStreamRef.current);
    }

    try {
      console.log('📥 WebRTC: Setting remote description (offer)...');
      await pc.setRemoteDescription(new RTCSessionDescription(data.signal as RTCSessionDescriptionInit));

      // Add pending ICE candidates
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
        console.log('✅ WebRTC: Added pending ICE candidate');
      }
      pendingCandidatesRef.current = [];

      if (isCleanedUpRef.current) return;

      console.log('📤 WebRTC: Creating answer...');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log('📤 WebRTC: Sending answer to:', otherUserId);

      socketClient.emit(SOCKET_EVENTS.WEBRTC_ANSWER, {
        callId,
        signal: answer,
        to: otherUserId,
      });

      console.log('✅ WebRTC: Answer sent!');
    } catch (error) {
      console.error('❌ WebRTC: Failed to handle offer:', error);
    }
  }, [callId, otherUserId, getUserMedia, createPeerConnection, addTracksToConnection]);

  const handleAnswer = useCallback(async (data: WebRTCSignalData) => {
    if (data.callId !== callId) return;
    if (!('type' in data.signal) || data.signal.type !== 'answer') return;
    if (isCleanedUpRef.current) return;

    const pc = peerConnectionRef.current;
    if (!pc) {
      console.error('❌ WebRTC: No peer connection for handling answer');
      return;
    }

    try {
      console.log('📥 WebRTC: Received answer from receiver');

      await pc.setRemoteDescription(new RTCSessionDescription(data.signal as RTCSessionDescriptionInit));

      // Add pending ICE candidates
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
        console.log('✅ WebRTC: Added pending ICE candidate');
      }
      pendingCandidatesRef.current = [];

      console.log('✅ WebRTC: Answer applied, connection should establish...');
    } catch (error) {
      console.error('❌ WebRTC: Failed to handle answer:', error);
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
        console.log('✅ WebRTC: ICE candidate added');
      } else {
        pendingCandidatesRef.current.push(candidate);
        console.log('📦 WebRTC: ICE candidate queued (waiting for remote description)');
      }
    } catch (error) {
      console.error('❌ WebRTC: Failed to add ICE candidate:', error);
    }
  }, [callId]);

  const initializeCall = useCallback(async () => {
    if (isInitialized) {
      console.warn('⚠️ WebRTC: Already initialized');
      return;
    }

    if (isCleanedUpRef.current) {
      console.warn('⚠️ WebRTC: Cannot initialize - already cleaned up');
      return;
    }

    try {
      console.log('🚀 WebRTC: Initializing...', { isCaller, isVideoCall, callId });

      const stream = await getUserMedia();

      const pc = createPeerConnection();
      if (!pc) {
        throw new Error('Failed to create peer connection');
      }

      // ✅ Add tracks to connection
      addTracksToConnection(pc, stream);

      setIsInitialized(true);

      if (isCaller) {
        console.log('📞 WebRTC: Caller ready, waiting for receiver to answer...');
      } else {
        console.log('📞 WebRTC: Receiver ready, waiting for offer...');
      }

      console.log('✅ WebRTC: Initialization complete');
    } catch (error) {
      console.error('❌ WebRTC: Failed to initialize:', error);
    }
  }, [isInitialized, isCaller, isVideoCall, callId, getUserMedia, createPeerConnection, addTracksToConnection]);

  useEffect(() => {
    if (isCaller && isInitialized && isCallAnswered && !hasCreatedOfferRef.current && !isCleanedUpRef.current) {
      console.log('🎯 WebRTC: Call ANSWERED! Caller sending offer in 1 second...');

      const timeout = setTimeout(() => {
        if (!isCleanedUpRef.current && !hasCreatedOfferRef.current) {
          createAndSendOffer();
        }
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [isCaller, isInitialized, isCallAnswered, createAndSendOffer]);

  const cleanup = useCallback(() => {
    console.log('🧹 WebRTC: Cleaning up...');

    isCleanedUpRef.current = true;
    hasCreatedOfferRef.current = false;
    hasAddedTracksRef.current = false; // ✅ Reset

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

    console.log('✅ WebRTC: Cleanup complete');
  }, []);

  useEffect(() => {
    isCleanedUpRef.current = false;
    hasCreatedOfferRef.current = false;
    hasAddedTracksRef.current = false; // ✅ Reset on callId change
  }, [callId]);

  useEffect(() => {
    console.log('👂 WebRTC: Setting up socket listeners for callId:', callId);

    socketClient.on(SOCKET_EVENTS.WEBRTC_OFFER, handleOffer);
    socketClient.on(SOCKET_EVENTS.WEBRTC_ANSWER, handleAnswer);
    socketClient.on(SOCKET_EVENTS.WEBRTC_ICE, handleICE);

    return () => {
      socketClient.off(SOCKET_EVENTS.WEBRTC_OFFER, handleOffer);
      socketClient.off(SOCKET_EVENTS.WEBRTC_ANSWER, handleAnswer);
      socketClient.off(SOCKET_EVENTS.WEBRTC_ICE, handleICE);
    };
  }, [callId, handleOffer, handleAnswer, handleICE]);

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