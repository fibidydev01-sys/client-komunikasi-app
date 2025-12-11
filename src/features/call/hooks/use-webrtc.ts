// ================================================
// FILE: src/features/call/hooks/use-webrtc.ts
// FIXED: Clean State Management + No Race Condition
// ================================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { socketClient } from '@/lib/socket-client';
import { useCallStore } from '../store/call.store';
import { SOCKET_EVENTS } from '@/shared/constants/socket-events';
import { toastHelper } from '@/shared/utils/toast-helper';

import { axiosClient } from '@/lib/axios-client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';

// ✅ FALLBACK ICE SERVERS (STUN only - used if API fails)
const FALLBACK_ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

// ✅ Fetch fresh TURN credentials from backend
const fetchIceServers = async (): Promise<RTCConfiguration> => {
  try {
    console.log('🔄 Fetching fresh TURN credentials...');

    const response = await axiosClient.get(API_ENDPOINTS.TURN.CREDENTIALS);
    const { iceServers, provider } = response.data.data;

    console.log(`✅ Got ${iceServers.length} ICE servers from ${provider}`);

    return {
      iceServers,
      iceCandidatePoolSize: 10,
    };
  } catch (error) {
    console.error('❌ Failed to fetch TURN credentials, using fallback:', error);
    return FALLBACK_ICE_SERVERS;
  }
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

  // ✅ Use callId-specific ref to prevent cross-call interference
  const callSessionRef = useRef<string | null>(null);
  const hasCreatedOfferRef = useRef(false);
  const hasAddedTracksRef = useRef(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const isCallAnswered = activeCall?.status === 'ANSWERED';

  // ✅ Helper: Check if current session is still valid
  const isSessionValid = useCallback(() => {
    return callSessionRef.current === callId && callId !== '';
  }, [callId]);

  // ✅ FULL CLEANUP - Nuclear option, bersih total
  const cleanup = useCallback(() => {
    console.log('🧹 WebRTC: Cleaning up for callId:', callSessionRef.current);

    // 1. Invalidate session FIRST
    callSessionRef.current = null;

    // 2. Close peer connection
    if (peerConnectionRef.current) {
      // Remove all event handlers first
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicegatheringstatechange = null;

      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // 3. Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 WebRTC: Stopped track:', track.kind);
      });
      localStreamRef.current = null;
    }

    // 4. Clear all refs
    pendingCandidatesRef.current = [];
    hasCreatedOfferRef.current = false;
    hasAddedTracksRef.current = false;
    iceConfigRef.current = null; // ✅ Clear ICE config for fresh fetch next call

    // 5. Reset all state
    setIsInitialized(false);
    setMediaError(null);

    // 6. Clear store state
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    setConnectionState('new');

    console.log('✅ WebRTC: Cleanup complete - ready for new call');
  }, [setLocalStream, setRemoteStream, setIsConnected, setConnectionState]);

  const getUserMedia = useCallback(async () => {
    if (!isSessionValid()) {
      throw new Error('Invalid session - aborting getUserMedia');
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

      // ✅ Double-check session still valid after async operation
      if (!isSessionValid()) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('Session invalidated during media acquisition');
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setMediaError(null);

      console.log('✅ WebRTC: User media obtained -', stream.getTracks().map(t => t.kind).join(', '));
      return stream;
    } catch (error: any) {
      console.error('❌ WebRTC: Failed to get user media:', error);
      setMediaError(error.message || 'Failed to access camera/microphone');
      throw error;
    }
  }, [isVideoCall, setLocalStream, isSessionValid]);

  // ✅ Store ICE config in ref (fetched once per call)
  const iceConfigRef = useRef<RTCConfiguration | null>(null);

  const createPeerConnection = useCallback(async () => {
    if (!isSessionValid()) {
      console.warn('⚠️ WebRTC: Cannot create peer connection - invalid session');
      return null;
    }

    if (peerConnectionRef.current) {
      console.log('♻️ WebRTC: Reusing existing peer connection');
      return peerConnectionRef.current;
    }

    // ✅ Fetch fresh ICE servers if not already fetched
    if (!iceConfigRef.current) {
      iceConfigRef.current = await fetchIceServers();
    }

    console.log('🔧 WebRTC: Creating NEW peer connection for callId:', callId);
    console.log('🔧 WebRTC: ICE Servers:', iceConfigRef.current.iceServers?.length);

    const pc = new RTCPeerConnection(iceConfigRef.current);
    peerConnectionRef.current = pc;

    // ✅ All handlers check session validity
    pc.onicegatheringstatechange = () => {
      if (!isSessionValid()) return;
      console.log('🔄 WebRTC: ICE gathering state:', pc.iceGatheringState);
    };

    pc.onicecandidate = (event) => {
      if (!isSessionValid()) return;

      if (event.candidate) {
        console.log('🧊 WebRTC: ICE Candidate:', {
          type: event.candidate.type,
          protocol: event.candidate.protocol,
        });

        socketClient.emit(SOCKET_EVENTS.WEBRTC_ICE, {
          callId,
          signal: event.candidate.toJSON(),
          to: otherUserId,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (!isSessionValid()) return;

      const state = pc.iceConnectionState;
      console.log('🔌 WebRTC: ICE connection state:', state);

      switch (state) {
        case 'connected':
        case 'completed':
          setIsConnected(true);
          console.log('✅ WebRTC: ICE Connected!');
          break;
        case 'disconnected':
          console.warn('⚠️ WebRTC: ICE Disconnected');
          // Don't set isConnected false yet - might reconnect
          break;
        case 'failed':
          setIsConnected(false);
          console.error('❌ WebRTC: ICE Connection failed');
          toastHelper.error('Connection failed');
          break;
      }
    };

    pc.onconnectionstatechange = () => {
      if (!isSessionValid()) return;

      const state = pc.connectionState;
      console.log('📡 WebRTC: Connection state:', state);
      setConnectionState(state);

      if (state === 'connected') {
        setIsConnected(true);
      } else if (state === 'failed' || state === 'closed') {
        setIsConnected(false);
      }
    };

    pc.ontrack = (event) => {
      if (!isSessionValid()) return;

      console.log('🎥 WebRTC: Remote track received:', event.track.kind);
      if (event.streams?.[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    console.log('✅ WebRTC: Peer connection created');
    return pc;
  }, [callId, otherUserId, setIsConnected, setConnectionState, setRemoteStream, isSessionValid]);

  const addTracksToConnection = useCallback((pc: RTCPeerConnection, stream: MediaStream) => {
    if (hasAddedTracksRef.current) {
      console.log('⚠️ WebRTC: Tracks already added');
      return;
    }

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
      console.log('➕ WebRTC: Added track:', track.kind);
    });

    hasAddedTracksRef.current = true;
  }, []);

  const createAndSendOffer = useCallback(async () => {
    if (!isSessionValid()) {
      console.warn('⚠️ WebRTC: Cannot send offer - invalid session');
      return;
    }

    if (hasCreatedOfferRef.current) {
      console.warn('⚠️ WebRTC: Offer already created');
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

      // ✅ Check session after async
      if (!isSessionValid()) {
        console.warn('⚠️ WebRTC: Session invalid after offer creation');
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
    }
  }, [callId, otherUserId, isVideoCall, isSessionValid]);

  const handleOffer = useCallback(async (data: WebRTCSignalData) => {
    // ✅ Strict validation
    if (data.callId !== callId || !isSessionValid()) {
      console.log('⚠️ WebRTC: Ignoring offer - wrong callId or invalid session');
      return;
    }
    if (!('type' in data.signal) || data.signal.type !== 'offer') return;

    console.log('📥 WebRTC: Received offer from caller');

    let pc = peerConnectionRef.current;

    if (!pc) {
      if (!localStreamRef.current) {
        try {
          await getUserMedia();
        } catch (error) {
          console.error('❌ WebRTC: Failed to get media for answer');
          return;
        }
      }

      pc = await createPeerConnection();
      if (!pc) return;
    }

    if (localStreamRef.current && !hasAddedTracksRef.current) {
      addTracksToConnection(pc, localStreamRef.current);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.signal as RTCSessionDescriptionInit));

      // Process pending candidates
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];

      if (!isSessionValid()) return;

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketClient.emit(SOCKET_EVENTS.WEBRTC_ANSWER, {
        callId,
        signal: answer,
        to: otherUserId,
      });

      console.log('✅ WebRTC: Answer sent!');
    } catch (error) {
      console.error('❌ WebRTC: Failed to handle offer:', error);
    }
  }, [callId, otherUserId, getUserMedia, createPeerConnection, addTracksToConnection, isSessionValid]);

  const handleAnswer = useCallback(async (data: WebRTCSignalData) => {
    if (data.callId !== callId || !isSessionValid()) return;
    if (!('type' in data.signal) || data.signal.type !== 'answer') return;

    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      console.log('📥 WebRTC: Received answer');
      await pc.setRemoteDescription(new RTCSessionDescription(data.signal as RTCSessionDescriptionInit));

      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];

      console.log('✅ WebRTC: Answer applied');
    } catch (error) {
      console.error('❌ WebRTC: Failed to handle answer:', error);
    }
  }, [callId, isSessionValid]);

  const handleICE = useCallback(async (data: WebRTCSignalData) => {
    if (data.callId !== callId || !isSessionValid()) return;
    if (!('candidate' in data.signal)) return;

    const pc = peerConnectionRef.current;

    try {
      const candidate = new RTCIceCandidate(data.signal as RTCIceCandidateInit);

      if (pc?.remoteDescription) {
        await pc.addIceCandidate(candidate);
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    } catch (error) {
      console.error('❌ WebRTC: Failed to add ICE candidate:', error);
    }
  }, [callId, isSessionValid]);

  // ✅ INITIALIZE - Fresh start setiap call
  const initializeCall = useCallback(async () => {
    // 1. Clean any previous state FIRST
    if (callSessionRef.current && callSessionRef.current !== callId) {
      console.log('🔄 WebRTC: Different call detected, cleaning previous...');
      cleanup();
    }

    // 2. Set new session
    callSessionRef.current = callId;
    hasCreatedOfferRef.current = false;
    hasAddedTracksRef.current = false;
    pendingCandidatesRef.current = [];

    if (isInitialized && peerConnectionRef.current) {
      console.warn('⚠️ WebRTC: Already initialized for this call');
      return;
    }

    try {
      console.log('🚀 WebRTC: Initializing...', { isCaller, isVideoCall, callId });

      const stream = await getUserMedia();

      if (!isSessionValid()) {
        console.warn('⚠️ WebRTC: Session invalid after getUserMedia');
        return;
      }

      const pc = await createPeerConnection();
      if (!pc) throw new Error('Failed to create peer connection');

      addTracksToConnection(pc, stream);
      setIsInitialized(true);

      console.log('✅ WebRTC: Initialization complete');
    } catch (error) {
      console.error('❌ WebRTC: Failed to initialize:', error);
      cleanup();
    }
  }, [callId, isInitialized, isCaller, isVideoCall, getUserMedia, createPeerConnection, addTracksToConnection, cleanup, isSessionValid]);

  // ✅ Caller sends offer when call is answered
  useEffect(() => {
    if (!isCaller || !isInitialized || !isCallAnswered || hasCreatedOfferRef.current) return;
    if (!isSessionValid()) return;

    console.log('🎯 WebRTC: Call ANSWERED! Sending offer in 500ms...');

    const timeout = setTimeout(() => {
      if (isSessionValid() && !hasCreatedOfferRef.current) {
        createAndSendOffer();
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [isCaller, isInitialized, isCallAnswered, createAndSendOffer, isSessionValid]);

  // ✅ Socket listeners - ONLY when callId is valid
  useEffect(() => {
    if (!callId) {
      console.warn('⚠️ WebRTC: No callId - skipping socket setup');
      return;
    }

    console.log('👂 WebRTC: Setting up socket listeners for callId:', callId);

    const onOffer = (data: WebRTCSignalData) => handleOffer(data);
    const onAnswer = (data: WebRTCSignalData) => handleAnswer(data);
    const onICE = (data: WebRTCSignalData) => handleICE(data);

    socketClient.on(SOCKET_EVENTS.WEBRTC_OFFER, onOffer);
    socketClient.on(SOCKET_EVENTS.WEBRTC_ANSWER, onAnswer);
    socketClient.on(SOCKET_EVENTS.WEBRTC_ICE, onICE);

    return () => {
      console.log('👂 WebRTC: Removing socket listeners for callId:', callId);
      socketClient.off(SOCKET_EVENTS.WEBRTC_OFFER, onOffer);
      socketClient.off(SOCKET_EVENTS.WEBRTC_ANSWER, onAnswer);
      socketClient.off(SOCKET_EVENTS.WEBRTC_ICE, onICE);
    };
  }, [callId, handleOffer, handleAnswer, handleICE]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🔌 WebRTC: Component unmounting - cleanup');
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