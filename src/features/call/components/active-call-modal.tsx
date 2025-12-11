// ================================================
// FILE: src/features/call/components/active-call-modal.tsx
// FIXED V5: Reset initialization when activeCall changes
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
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const webrtcCleanupRef = useRef<(() => Promise<void>) | null>(null);

  // ✅ Track which callId we initialized for
  const initializedCallIdRef = useRef<string | null>(null);

  const isCaller = activeCall?.callerId === user?.id;
  const otherParticipant = isCaller ? activeCall?.receiver : activeCall?.caller;
  const isVideoCall = activeCall?.type === 'VIDEO';

  const { initializeCall, cleanup, isInitialized, mediaError } = useWebRTC({
    callId: activeCall?.id || '',
    otherUserId: otherParticipant?.id || '',
    isCaller,
    isVideoCall: isVideoCall || false,
  });

  // Store cleanup function
  useEffect(() => {
    webrtcCleanupRef.current = cleanup;
  }, [cleanup]);

  // ✅ FIXED: Initialize WebRTC - check against callId, not just boolean
  useEffect(() => {
    const currentCallId = activeCall?.id;

    // Skip if no call or modal not open
    if (!open || !activeCall || !currentCallId) {
      return;
    }

    // ✅ KEY FIX: Check if we already initialized THIS specific call
    if (initializedCallIdRef.current === currentCallId) {
      logger.debug('Active Call Modal: Already initialized for this call:', currentCallId);
      return;
    }

    // ✅ If we have a different call initialized, cleanup first
    if (initializedCallIdRef.current && initializedCallIdRef.current !== currentCallId) {
      logger.debug('Active Call Modal: Different call detected, will reinitialize');
      // Don't need to manually cleanup here - useWebRTC handles it
    }

    // Mark this call as being initialized
    initializedCallIdRef.current = currentCallId;
    setIsInitializing(true);

    logger.debug('Active Call Modal: Initializing WebRTC...', {
      isCaller,
      callId: currentCallId,
      status: activeCall.status,
    });

    initializeCall().finally(() => {
      setIsInitializing(false);
    });

  }, [open, activeCall?.id, activeCall?.status, initializeCall, isCaller]);

  // ✅ FIXED: Reset when modal closes OR when activeCall becomes null
  useEffect(() => {
    if (!open || !activeCall) {
      logger.debug('Active Call Modal: Resetting state (open:', open, ', activeCall:', !!activeCall, ')');

      initializedCallIdRef.current = null;
      setHasRemoteVideo(false);
      setAudioPlaying(false);
      setCallDuration(0);
      setIsInitializing(false);

      // Reset call timer
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      callStartTimeRef.current = null;
    }
  }, [open, activeCall]);

  // Attach local stream to video element
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      logger.debug('Active Call Modal: Attaching local stream to video element');

      const video = localVideoRef.current;

      if (video.srcObject !== localStream) {
        video.srcObject = localStream;
        video.play().catch((err) => {
          logger.warn('Active Call Modal: Local video autoplay blocked:', err);
        });
      }

      logger.debug('Active Call Modal: Local stream attached', {
        videoTracks: localStream.getVideoTracks().length,
        audioTracks: localStream.getAudioTracks().length,
      });
    }
  }, [localStream]);

  // Attach remote stream to video AND audio elements
  useEffect(() => {
    if (!remoteStream) {
      setHasRemoteVideo(false);
      return;
    }

    logger.debug('Active Call Modal: Remote stream received', {
      audioTracks: remoteStream.getAudioTracks().length,
      videoTracks: remoteStream.getVideoTracks().length,
      active: remoteStream.active,
    });

    const videoTracks = remoteStream.getVideoTracks();
    const hasActiveVideo = videoTracks.length > 0 && videoTracks.some(t => t.enabled && t.readyState === 'live');
    setHasRemoteVideo(hasActiveVideo);

    logger.debug('Active Call Modal: Video tracks status', {
      count: videoTracks.length,
      hasActiveVideo,
      tracks: videoTracks.map(t => ({ enabled: t.enabled, readyState: t.readyState, muted: t.muted })),
    });

    // Attach to video element
    if (remoteVideoRef.current) {
      const video = remoteVideoRef.current;

      if (video.srcObject !== remoteStream) {
        logger.debug('Active Call Modal: Setting remote video srcObject');
        video.srcObject = remoteStream;

        video.onloadedmetadata = () => {
          logger.debug('Active Call Modal: Remote video metadata loaded');
          video.play()
            .then(() => {
              logger.success('Active Call Modal: ✅ Remote video playing!');
              setHasRemoteVideo(true);
            })
            .catch((err) => {
              logger.error('Active Call Modal: ❌ Remote video play failed:', err);
            });
        };

        video.play().catch(() => {
          // Will retry on loadedmetadata
        });
      }
    }

    // Attach to audio element
    if (remoteAudioRef.current) {
      const audio = remoteAudioRef.current;

      if (audio.srcObject !== remoteStream) {
        audio.srcObject = remoteStream;

        audio.play()
          .then(() => {
            setAudioPlaying(true);
            logger.success('Active Call Modal: ✅ Remote audio playing!');
          })
          .catch((err) => {
            logger.error('Active Call Modal: ❌ Remote audio play failed:', err);
            setAudioPlaying(false);
          });
      }
    }

    // Listen for track changes
    remoteStream.getVideoTracks().forEach(track => {
      track.onended = () => {
        logger.warn('Active Call Modal: Remote video track ended');
        setHasRemoteVideo(false);
      };
      track.onmute = () => {
        logger.warn('Active Call Modal: Remote video track muted');
      };
      track.onunmute = () => {
        logger.debug('Active Call Modal: Remote video track unmuted');
        setHasRemoteVideo(true);
      };
    });

    return () => {
      remoteStream.getVideoTracks().forEach(track => {
        track.onended = null;
        track.onmute = null;
        track.onunmute = null;
      });
    };
  }, [remoteStream]);

  // Call duration timer
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionStatus = () => {
    if (isInitializing) return '📡 Initializing...';
    if (isConnected) return formatDuration(callDuration);

    switch (connectionState) {
      case 'connecting': return '📞 Connecting...';
      case 'new': return '📞 Starting call...';
      case 'failed': return '❌ Connection failed';
      case 'disconnected': return '⚠️ Reconnecting...';
      default: return isCaller ? '📞 Calling...' : '📞 Connecting...';
    }
  };

  const handleEndCall = useCallback(async () => {
    if (!activeCall || isEnding) return;

    try {
      logger.debug('Active Call Modal: Ending call...');

      // Stop timer
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }

      const duration = callStartTimeRef.current
        ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
        : 0;

      // Cleanup WebRTC
      if (webrtcCleanupRef.current) {
        await webrtcCleanupRef.current();
      }
      cleanupStreams();

      // End call via API
      await endCall(activeCall.id, duration);

      // Reset local state
      callStartTimeRef.current = null;
      initializedCallIdRef.current = null;
      setCallDuration(0);
      setHasRemoteVideo(false);
      setAudioPlaying(false);

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
      initializedCallIdRef.current = null;
      setCallDuration(0);
      setHasRemoteVideo(false);
      setAudioPlaying(false);
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
      {/* Hidden audio element for remote audio */}
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

          {/* Debug info */}
          {isConnected && (
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
              <span>Audio: {audioPlaying ? '✅' : '❌'}</span>
              <span>Video: {hasRemoteVideo ? '✅' : '❌'}</span>
              <span>Connected: {isConnected ? '✅' : '❌'}</span>
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
              style={{ display: hasRemoteVideo ? 'block' : 'none' }}
            />

            {/* Placeholder when no remote video */}
            {!hasRemoteVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <UserAvatar
                    src={otherParticipant?.avatar}
                    name={otherParticipant?.name || 'Unknown'}
                    size="xl"
                    className="mx-auto mb-4 w-32 h-32"
                  />
                  <p className="text-white text-lg">
                    {isConnected ? 'Camera off or loading...' : 'Waiting for video...'}
                  </p>
                  {!isConnected && (
                    <div className="mt-4 flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
              </div>
            )}

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

                {isConnected && audioPlaying && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="flex gap-1 items-end">
                      {[8, 16, 12, 20, 14, 10].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 bg-green-500 rounded-full animate-pulse"
                          style={{ height: `${h}px`, animationDelay: `${i * 100}ms` }}
                        />
                      ))}
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
          <Button
            size="lg"
            variant={isMuted ? 'destructive' : 'secondary'}
            onClick={toggleMute}
            disabled={isEnding}
            className="h-16 w-16 rounded-full"
          >
            {isMuted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
          </Button>

          {isVideoCall && (
            <Button
              size="lg"
              variant={!isVideoEnabled ? 'destructive' : 'secondary'}
              onClick={toggleVideo}
              disabled={isEnding}
              className="h-16 w-16 rounded-full"
            >
              {isVideoEnabled ? <Video className="h-7 w-7" /> : <VideoOff className="h-7 w-7" />}
            </Button>
          )}

          <Button
            size="lg"
            variant="destructive"
            onClick={handleEndCall}
            disabled={isEnding}
            className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700"
          >
            {isEnding ? <Loader2 className="h-7 w-7 animate-spin" /> : <PhoneOff className="h-7 w-7" />}
          </Button>
        </div>

        <div className="mt-4 flex justify-center">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
              }`} />
            <span className="text-sm">
              {isEnding ? 'Ending...' : isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};