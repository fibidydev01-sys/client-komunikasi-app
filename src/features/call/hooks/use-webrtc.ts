// ================================================
// FILE: src/features/call/hooks/use-webrtc.ts
// FIXED V3: Proper cleanup before new call + wait for cleanup
// ================================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { socketClient } from '@/lib/socket-client';
import { useCallStore } from '../store/call.store';
import { SOCKET_EVENTS } from '@/shared/constants/socket-events';
import { axiosClient } from '@/lib/axios-client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';

// Fallback ICE servers
const FALLBACK_ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

// Fetch fresh TURN credentials
const fetchIceServers = async (): Promise<RTCConfiguration> => {
  try {
    console.log('🔄 Fetching fresh TURN credentials...');
    const response = await axiosClient.get(API_ENDPOINTS.TURN.CREDENTIALS);
    const { iceServers, provider } = response.data.data;
    console.log(`✅ Got ${iceServers.length} ICE servers from ${provider}`);
    return { iceServers, iceCandidatePoolSize: 10 };
  } catch (error) {
    console.error('❌ Failed to fetch TURN credentials:', error);
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
  const iceConfigRef = useRef<RTCConfiguration | null>(null);
  const callSessionRef = useRef<string | null>(null);
  const hasCreatedOfferRef = useRef(false);
  const hasAddedTracksRef = useRef(false);
  const isNegotiatingRef = useRef(false);
  const isCleaningUpRef = useRef(false); // ✅ NEW: Track cleanup state

  const [isInitialized, setIsInitialized] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const isCallAnswered = activeCall?.status === 'ANSWERED';

  const isSessionValid = useCallback(() => {
    return callSessionRef.current === callId && callId !== '';
  }, [callId]);

  // ✅ IMPROVED CLEANUP - Now returns a Promise
  const cleanup = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (isCleaningUpRef.current) {
        console.log('⏳ WebRTC: Cleanup already in progress...');
        resolve();
        return;
      }

      isCleaningUpRef.current = true;
      console.log('🧹 WebRTC: Cleaning up...');

      // 1. Close peer connection
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.onicecandidate = null;
          peerConnectionRef.current.oniceconnectionstatechange = null;
          peerConnectionRef.current.onconnectionstatechange = null;
          peerConnectionRef.current.ontrack = null;
          peerConnectionRef.current.onnegotiationneeded = null;

          // Close all senders
          peerConnectionRef.current.getSenders().forEach(sender => {
            try {
              peerConnectionRef.current?.removeTrack(sender);
            } catch (e) {
              // Ignore errors
            }
          });

          peerConnectionRef.current.close();
          console.log('🧹 WebRTC: Peer connection closed');
        } catch (e) {
          console.warn('🧹 WebRTC: Error closing peer connection:', e);
        }
        peerConnectionRef.current = null;
      }

      // 2. Stop local stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('🧹 WebRTC: Stopped track:', track.kind);
        });
        localStreamRef.current = null;
      }

      // 3. Reset all refs
      callSessionRef.current = null;
      pendingCandidatesRef.current = [];
      hasCreatedOfferRef.current = false;
      hasAddedTracksRef.current = false;
      isNegotiatingRef.current = false;
      iceConfigRef.current = null;

      // 4. Reset state
      setIsInitialized(false);
      setMediaError(null);
      setLocalStream(null);
      setRemoteStream(null);
      setIsConnected(false);
      setConnectionState('new');

      isCleaningUpRef.current = false;
      console.log('✅ WebRTC: Cleanup complete');

      // ✅ Small delay to ensure browser releases resources
      setTimeout(resolve, 100);
    });
  }, [setLocalStream, setRemoteStream, setIsConnected, setConnectionState]);

  // ✅ GET USER MEDIA
  const getUserMedia = useCallback(async () => {
    if (!isSessionValid()) throw new Error('Invalid session');

    // Return existing stream if available AND active
    if (localStreamRef.current && localStreamRef.current.active) {
      const tracks = localStreamRef.current.getTracks();
      const allTracksLive = tracks.every(t => t.readyState === 'live');

      if (allTracksLive) {
        console.log('♻️ WebRTC: Reusing existing local stream');
        return localStreamRef.current;
      } else {
        console.log('⚠️ WebRTC: Existing stream has dead tracks, getting new one');
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
    }

    try {
      console.log('🎤 WebRTC: Requesting user media...');

      const constraints: MediaStreamConstraints = {
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: isVideoCall ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!isSessionValid()) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('Session invalidated');
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setMediaError(null);

      console.log('✅ WebRTC: Got media -', `audio:${stream.getAudioTracks().length > 0}, video:${stream.getVideoTracks().length > 0}`);
      return stream;
    } catch (error: any) {
      console.error('❌ WebRTC: getUserMedia failed:', error);
      setMediaError(error.message || 'Camera/mic access failed');
      throw error;
    }
  }, [isVideoCall, setLocalStream, isSessionValid]);

  // ✅ CREATE PEER CONNECTION
  const createPeerConnection = useCallback(async () => {
    if (!isSessionValid()) return null;

    // ✅ IMPORTANT: Always create fresh peer connection
    if (peerConnectionRef.current) {
      console.log('⚠️ WebRTC: Closing existing peer connection before creating new one');
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Fetch ICE servers (always fresh for new connection)
    console.log('🔄 WebRTC: Fetching ICE servers...');
    iceConfigRef.current = await fetchIceServers();

    console.log('🔧 WebRTC: Creating peer connection...');
    const pc = new RTCPeerConnection(iceConfigRef.current);
    peerConnectionRef.current = pc;

    // ICE candidate handler
    pc.onicecandidate = (event) => {
      if (!isSessionValid() || !event.candidate) return;

      console.log('🧊 ICE candidate:', event.candidate.type, event.candidate.protocol);
      socketClient.emit(SOCKET_EVENTS.WEBRTC_ICE, {
        callId,
        signal: event.candidate.toJSON(),
        to: otherUserId,
      });
    };

    // Connection state handlers
    pc.oniceconnectionstatechange = () => {
      if (!isSessionValid()) return;
      const state = pc.iceConnectionState;
      console.log('🔌 ICE state:', state);

      if (state === 'connected' || state === 'completed') {
        setIsConnected(true);
        console.log('✅ WebRTC: Connected!');
      } else if (state === 'failed') {
        setIsConnected(false);
        console.error('❌ WebRTC: Connection failed');
      } else if (state === 'disconnected') {
        console.warn('⚠️ WebRTC: Connection disconnected');
      }
    };

    pc.onconnectionstatechange = () => {
      if (!isSessionValid()) return;
      console.log('📡 Connection state:', pc.connectionState);
      setConnectionState(pc.connectionState);
    };

    // ✅ CRITICAL: Remote track handler
    pc.ontrack = (event) => {
      if (!isSessionValid()) return;

      console.log('🎥 WebRTC: Remote track received:', event.track.kind, 'enabled:', event.track.enabled);
      console.log('🎥 WebRTC: Streams:', event.streams.length);

      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];
        console.log('🎥 WebRTC: Setting remote stream with tracks:',
          `audio:${remoteStream.getAudioTracks().length > 0}, video:${remoteStream.getVideoTracks().length > 0}`
        );
        setRemoteStream(remoteStream);
      }
    };

    console.log('✅ WebRTC: Peer connection created');
    return pc;
  }, [callId, otherUserId, setIsConnected, setConnectionState, setRemoteStream, isSessionValid]);

  // ✅ ADD TRACKS TO CONNECTION
  const addTracksToConnection = useCallback((pc: RTCPeerConnection, stream: MediaStream) => {
    if (hasAddedTracksRef.current) {
      console.log('⚠️ WebRTC: Tracks already added');
      return;
    }

    const senders = pc.getSenders();

    stream.getTracks().forEach((track) => {
      const existingSender = senders.find(s => s.track?.kind === track.kind);
      if (existingSender) {
        console.log('♻️ WebRTC: Track already exists:', track.kind);
        return;
      }

      pc.addTrack(track, stream);
      console.log('➕ WebRTC: Added track:', track.kind, 'enabled:', track.enabled);
    });

    hasAddedTracksRef.current = true;
    console.log('✅ WebRTC: All tracks added. Senders:', pc.getSenders().length);
  }, []);

  // ✅ CREATE AND SEND OFFER (Caller only)
  const createAndSendOffer = useCallback(async () => {
    if (!isSessionValid() || hasCreatedOfferRef.current || isNegotiatingRef.current) {
      console.warn('⚠️ WebRTC: Cannot create offer - invalid state');
      return;
    }

    const pc = peerConnectionRef.current;
    if (!pc) {
      console.error('❌ WebRTC: No peer connection for offer');
      return;
    }

    if (!hasAddedTracksRef.current && localStreamRef.current) {
      addTracksToConnection(pc, localStreamRef.current);
    }

    try {
      isNegotiatingRef.current = true;
      hasCreatedOfferRef.current = true;

      console.log('📤 WebRTC: Creating offer...');
      console.log('📤 WebRTC: Senders before offer:', pc.getSenders().map(s => s.track?.kind));

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideoCall,
      });

      if (!isSessionValid()) return;

      await pc.setLocalDescription(offer);

      console.log('📤 WebRTC: Sending offer to:', otherUserId);
      socketClient.emit(SOCKET_EVENTS.WEBRTC_OFFER, {
        callId,
        signal: offer,
        to: otherUserId,
      });

      console.log('✅ WebRTC: Offer sent!');
    } catch (error) {
      console.error('❌ WebRTC: Offer failed:', error);
      hasCreatedOfferRef.current = false;
    } finally {
      isNegotiatingRef.current = false;
    }
  }, [callId, otherUserId, isVideoCall, isSessionValid, addTracksToConnection]);

  // ✅ HANDLE INCOMING OFFER (Receiver only)
  const handleOffer = useCallback(async (data: WebRTCSignalData) => {
    if (data.callId !== callId || !isSessionValid()) return;
    if (!('type' in data.signal) || data.signal.type !== 'offer') return;
    if (isNegotiatingRef.current) {
      console.warn('⚠️ WebRTC: Already negotiating, ignoring offer');
      return;
    }

    console.log('📥 WebRTC: Received offer from:', data.from);

    try {
      isNegotiatingRef.current = true;

      let stream = localStreamRef.current;
      if (!stream || !stream.active) {
        console.log('📥 WebRTC: Getting media before answering...');
        stream = await getUserMedia();
      }

      let pc = peerConnectionRef.current;
      if (!pc || pc.connectionState === 'closed') {
        pc = await createPeerConnection();
        if (!pc) throw new Error('Failed to create peer connection');
      }

      if (!hasAddedTracksRef.current && stream) {
        addTracksToConnection(pc, stream);
      }

      console.log('📥 WebRTC: Senders before answer:', pc.getSenders().map(s => s.track?.kind));

      await pc.setRemoteDescription(new RTCSessionDescription(data.signal as RTCSessionDescriptionInit));

      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
        console.log('✅ WebRTC: Added pending ICE candidate');
      }
      pendingCandidatesRef.current = [];

      if (!isSessionValid()) return;

      console.log('📤 WebRTC: Creating answer...');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketClient.emit(SOCKET_EVENTS.WEBRTC_ANSWER, {
        callId,
        signal: answer,
        to: otherUserId,
      });

      console.log('✅ WebRTC: Answer sent!');
      console.log('✅ WebRTC: Senders after answer:', pc.getSenders().map(s => s.track?.kind));

    } catch (error) {
      console.error('❌ WebRTC: Handle offer failed:', error);
    } finally {
      isNegotiatingRef.current = false;
    }
  }, [callId, otherUserId, getUserMedia, createPeerConnection, addTracksToConnection, isSessionValid]);

  // ✅ HANDLE ANSWER (Caller only)
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
      console.error('❌ WebRTC: Handle answer failed:', error);
    }
  }, [callId, isSessionValid]);

  // ✅ HANDLE ICE CANDIDATE
  const handleICE = useCallback(async (data: WebRTCSignalData) => {
    if (data.callId !== callId || !isSessionValid()) return;
    if (!('candidate' in data.signal)) return;

    const pc = peerConnectionRef.current;

    try {
      const candidate = new RTCIceCandidate(data.signal as RTCIceCandidateInit);

      if (pc?.remoteDescription) {
        await pc.addIceCandidate(candidate);
        console.log('✅ WebRTC: ICE candidate added');
      } else {
        pendingCandidatesRef.current.push(candidate);
        console.log('📦 WebRTC: ICE candidate queued');
      }
    } catch (error) {
      console.error('❌ WebRTC: ICE candidate failed:', error);
    }
  }, [callId, isSessionValid]);

  // ✅ FIXED: INITIALIZE CALL - Now properly waits for cleanup
  const initializeCall = useCallback(async () => {
    // ✅ FIX: ALWAYS cleanup before starting new call
    if (peerConnectionRef.current || localStreamRef.current || callSessionRef.current) {
      console.log('🧹 WebRTC: Cleaning up before new call...');
      await cleanup();
      // ✅ Extra wait to ensure browser releases resources
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Set new session
    callSessionRef.current = callId;
    hasCreatedOfferRef.current = false;
    hasAddedTracksRef.current = false;
    isNegotiatingRef.current = false;
    pendingCandidatesRef.current = [];

    if (isInitialized && peerConnectionRef.current) {
      console.warn('⚠️ WebRTC: Already initialized');
      return;
    }

    try {
      console.log('🚀 WebRTC: Initializing...', { isCaller, isVideoCall, callId });

      // Step 1: Get media
      const stream = await getUserMedia();
      if (!isSessionValid()) return;

      // Step 2: Create peer connection
      const pc = await createPeerConnection();
      if (!pc) throw new Error('Failed to create peer connection');

      // Step 3: Add tracks immediately
      addTracksToConnection(pc, stream);

      setIsInitialized(true);
      console.log('✅ WebRTC: Initialization complete');

    } catch (error) {
      console.error('❌ WebRTC: Initialization failed:', error);
      await cleanup();
    }
  }, [callId, isInitialized, isCaller, isVideoCall, getUserMedia, createPeerConnection, addTracksToConnection, cleanup, isSessionValid]);

  // ✅ Caller sends offer when call is answered
  useEffect(() => {
    if (!isCaller || !isInitialized || !isCallAnswered || hasCreatedOfferRef.current) return;
    if (!isSessionValid()) return;

    console.log('🎯 WebRTC: Call answered, sending offer in 500ms...');

    const timeout = setTimeout(() => {
      if (isSessionValid() && !hasCreatedOfferRef.current) {
        createAndSendOffer();
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [isCaller, isInitialized, isCallAnswered, createAndSendOffer, isSessionValid]);

  // ✅ Socket listeners
  useEffect(() => {
    if (!callId) return;

    console.log('👂 WebRTC: Setting up listeners for:', callId);

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

  return { initializeCall, cleanup, isInitialized, mediaError };
};