// ================================================
// FILE: src/features/call/components/active-call-modal.tsx
// FIXED V3: Added audio element for voice calls
// ================================================

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  AlertCircle,
  Loader2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { UserAvatar } from '@/shared/components/common/user-avatar';
import { useCallStore } from '../store/call.store';
import { useWebRTC } from '../hooks/use-webrtc';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { logger } from '@/shared/utils/logger';

interface ActiveCallModalProps {
  open: boolean;
  onClose: () => void;
}

export const ActiveCallModal = ({ open, onClose }: ActiveCallModalProps) => {
  const { user } = useAuthStore();
  const {
    activeCall,
    endCall,
    isMuted,
    isVideoEnabled,
    toggleMute,
    toggleVideo,
    localStream,
    remoteStream,
    isConnected,
    connectionState,
    cleanupStreams,
    isEnding,
  } = useCallStore();

  const [callDuration, setCallDuration] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null); // ✅ Audio element for voice calls
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const webrtcCleanupRef = useRef<(() => void) | null>(null);
  const hasInitializedRef = useRef(false);

  // Determine call details
  const isCaller = activeCall?.callerId === user?.id;
  const otherParticipant = isCaller ? activeCall?.receiver : activeCall?.caller;
  const isVideoCall = activeCall?.type === 'VIDEO';

  // Initialize WebRTC hook
  const { initializeCall, cleanup, isInitialized, mediaError } = useWebRTC({
    callId: activeCall?.id || '',
    otherUserId: otherParticipant?.id || '',
    isCaller,
    isVideoCall: isVideoCall || false,
  });

  // Store cleanup reference
  useEffect(() => {
    webrtcCleanupRef.current = cleanup;
  }, [cleanup]);

  // ✅ Initialize WebRTC when modal opens - BOTH caller and receiver
  useEffect(() => {
    if (open && activeCall && !hasInitializedRef.current && !isInitialized) {
      hasInitializedRef.current = true;
      setIsInitializing(true);

      logger.debug('Active Call Modal: Initializing WebRTC...', {
        isCaller,
        callId: activeCall.id,
        status: activeCall.status,
      });

      initializeCall().finally(() => {
        setIsInitializing(false);
      });
    }
  }, [open, activeCall, isInitialized, initializeCall, isCaller]);

  // Reset hasInitialized when modal closes
  useEffect(() => {
    if (!open) {
      hasInitializedRef.current = false;
    }
  }, [open]);

  // Attach local stream to video element
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      logger.debug('Active Call Modal: Local stream attached');
    }
  }, [localStream]);

  // ✅ CRITICAL: Attach remote stream to BOTH video AND audio elements
  useEffect(() => {
    if (remoteStream) {
      logger.debug('Active Call Modal: Remote stream received', {
        audioTracks: remoteStream.getAudioTracks().length,
        videoTracks: remoteStream.getVideoTracks().length,
      });

      // For video calls - attach to video element
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        logger.debug('Active Call Modal: Remote stream attached to video element');
      }

      // ✅ For ALL calls (including voice) - attach to audio element
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;

        // Force play audio
        remoteAudioRef.current.play()
          .then(() => {
            setAudioPlaying(true);
            logger.success('Active Call Modal: ✅ Remote audio playing!');
          })
          .catch((err) => {
            logger.error('Active Call Modal: ❌ Failed to play remote audio:', err);
            setAudioPlaying(false);
          });
      }
    }
  }, [remoteStream]);

  // Call duration timer - start when connected
  useEffect(() => {
    if (isConnected && !callStartTimeRef.current) {
      callStartTimeRef.current = Date.now();
      logger.debug('Active Call Modal: Starting call timer');

      callTimerRef.current = setInterval(() => {
        if (callStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
          setCallDuration(elapsed);
        }
      }, 1000);
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [isConnected]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get connection status text
  const getConnectionStatus = () => {
    if (isInitializing) {
      return '📡 Initializing...';
    }

    if (isConnected) {
      return formatDuration(callDuration);
    }

    switch (connectionState) {
      case 'connecting':
        return '📞 Connecting...';
      case 'new':
        return '📞 Starting call...';
      case 'failed':
        return '❌ Connection failed';
      case 'disconnected':
        return '⚠️ Reconnecting...';
      default:
        return isCaller ? '📞 Calling...' : '📞 Connecting...';
    }
  };

  // Handle end call
  const handleEndCall = useCallback(async () => {
    if (!activeCall || isEnding) {
      logger.warn('Active Call Modal: Cannot end call - no call or already ending');
      return;
    }

    try {
      logger.debug('Active Call Modal: Ending call...');

      // Stop timer
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }

      // Calculate duration
      const duration = callStartTimeRef.current
        ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
        : 0;

      // Cleanup WebRTC
      if (webrtcCleanupRef.current) {
        webrtcCleanupRef.current();
      }
      cleanupStreams();

      // End call on server
      await endCall(activeCall.id, duration);

      // Reset refs
      callStartTimeRef.current = null;
      hasInitializedRef.current = false;
      setCallDuration(0);

      logger.success('Active Call Modal: Call ended');
    } catch (error) {
      logger.error('Active Call Modal: Failed to end call:', error);
    }
  }, [activeCall, isEnding, cleanupStreams, endCall]);

  // Handle external call end
  useEffect(() => {
    if (open && !activeCall) {
      logger.debug('Active Call Modal: Call ended externally');

      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }

      if (webrtcCleanupRef.current) {
        webrtcCleanupRef.current();
      }

      callStartTimeRef.current = null;
      hasInitializedRef.current = false;
      setCallDuration(0);
    }
  }, [open, activeCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, []);

  if (!open || !activeCall) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* ✅ CRITICAL: Hidden audio element for remote audio playback */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-center flex-col">
          <h2 className="text-xl font-semibold text-white">
            {otherParticipant?.name || 'Unknown'}
          </h2>
          <p className="text-lg text-gray-300 mt-1">
            {getConnectionStatus()}
          </p>

          {/* Audio status indicator */}
          {isConnected && !isVideoCall && (
            <div className="mt-2 flex items-center gap-2">
              {audioPlaying ? (
                <Volume2 className="h-4 w-4 text-green-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-yellow-400" />
              )}
              <span className="text-xs text-gray-400">
                {audioPlaying ? 'Audio active' : 'Waiting for audio...'}
              </span>
            </div>
          )}

          {mediaError && (
            <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-full">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-yellow-400">{mediaError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Video/Audio Area */}
      <div className="flex-1 relative">
        {isVideoCall ? (
          <>
            {/* Remote Video (full screen) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover bg-gray-800"
            />

            {/* Local Video (PIP) */}
            <div className="absolute bottom-24 right-4 w-32 h-48 md:w-48 md:h-64 rounded-lg overflow-hidden shadow-lg border-2 border-white/20 bg-gray-700">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />

              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoOff className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Waiting for remote video */}
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <UserAvatar
                    src={otherParticipant?.avatar}
                    name={otherParticipant?.name || 'Unknown'}
                    size="xl"
                    className="mx-auto mb-4 w-32 h-32"
                  />
                  <p className="text-white text-lg">
                    {isConnected ? 'Camera off' : 'Waiting for video...'}
                  </p>
                  {!isConnected && (
                    <div className="mt-4 flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Voice Call UI */
          <div className="flex items-center justify-center h-full bg-gradient-to-b from-gray-800 to-gray-900">
            <div className="text-center">
              <div className={`relative ${isConnected ? '' : 'animate-pulse'}`}>
                <UserAvatar
                  src={otherParticipant?.avatar}
                  name={otherParticipant?.name || 'Unknown'}
                  size="xl"
                  className="w-40 h-40 mx-auto"
                />

                {/* Audio wave indicator when connected */}
                {isConnected && audioPlaying && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="flex gap-1 items-end">
                      <div className="w-1 bg-green-500 rounded-full animate-pulse" style={{ height: '8px', animationDelay: '0ms' }} />
                      <div className="w-1 bg-green-500 rounded-full animate-pulse" style={{ height: '16px', animationDelay: '100ms' }} />
                      <div className="w-1 bg-green-500 rounded-full animate-pulse" style={{ height: '12px', animationDelay: '200ms' }} />
                      <div className="w-1 bg-green-500 rounded-full animate-pulse" style={{ height: '20px', animationDelay: '300ms' }} />
                      <div className="w-1 bg-green-500 rounded-full animate-pulse" style={{ height: '14px', animationDelay: '400ms' }} />
                      <div className="w-1 bg-green-500 rounded-full animate-pulse" style={{ height: '10px', animationDelay: '500ms' }} />
                    </div>
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-semibold text-white mt-8">
                {otherParticipant?.name || 'Unknown'}
              </h2>

              <p className="text-gray-400 mt-2">
                {isConnected ? '🎤 Voice Call Connected' : '🎤 Voice Call'}
              </p>

              {/* Status indicators */}
              <div className="mt-4 flex justify-center gap-4">
                {isMuted && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full">
                    <MicOff className="h-3 w-3 text-red-400" />
                    <span className="text-xs text-red-400">Muted</span>
                  </div>
                )}

                {isConnected && !audioPlaying && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-full">
                    <VolumeX className="h-3 w-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400">No audio</span>
                  </div>
                )}
              </div>

              {/* Loading indicator */}
              {!isConnected && (
                <div className="mt-6 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-6">
          {/* Mute */}
          <Button
            size="lg"
            variant={isMuted ? 'destructive' : 'secondary'}
            onClick={toggleMute}
            disabled={isEnding}
            className="h-16 w-16 rounded-full"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
          </Button>

          {/* Video (only for video calls) */}
          {isVideoCall && (
            <Button
              size="lg"
              variant={!isVideoEnabled ? 'destructive' : 'secondary'}
              onClick={toggleVideo}
              disabled={isEnding}
              className="h-16 w-16 rounded-full"
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? <Video className="h-7 w-7" /> : <VideoOff className="h-7 w-7" />}
            </Button>
          )}

          {/* End Call */}
          <Button
            size="lg"
            variant="destructive"
            onClick={handleEndCall}
            disabled={isEnding}
            className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700"
            title="End call"
          >
            {isEnding ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : (
              <PhoneOff className="h-7 w-7" />
            )}
          </Button>
        </div>

        {/* Connection status */}
        <div className="mt-4 flex justify-center">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isConnected
              ? 'bg-green-500/20 text-green-400'
              : 'bg-yellow-500/20 text-yellow-400'
            }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected
                ? 'bg-green-500'
                : 'bg-yellow-500 animate-pulse'
              }`} />
            <span className="text-sm">
              {isEnding
                ? 'Ending...'
                : isConnected
                  ? 'Connected'
                  : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};