// ================================================
// FILE: src/features/call/components/active-call-modal.tsx
// ActiveCallModal - FULL SCREEN MODAL (no navigation needed!)
// ================================================

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  AlertCircle,
  Loader2
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
  } = useCallStore();

  const [callDuration, setCallDuration] = useState(0);
  const [isEnding, setIsEnding] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callStartTimeRef = useRef<number | null>(null);

  // Determine call details
  const isCaller = activeCall?.callerId === user?.id;
  const otherParticipant = isCaller ? activeCall?.receiver : activeCall?.caller;
  const isVideoCall = activeCall?.type === 'VIDEO';

  // Initialize WebRTC
  const { initializeCall, cleanup, isInitialized, mediaError } = useWebRTC({
    callId: activeCall?.id || '',
    otherUserId: otherParticipant?.id || '',
    isCaller,
    isVideoCall: isVideoCall || false,
  });

  // Initialize WebRTC when modal opens
  useEffect(() => {
    if (open && activeCall && !isInitialized) {
      logger.debug('Active Call Modal: Initializing WebRTC...');
      initializeCall();
    }
  }, [open, activeCall, isInitialized, initializeCall]);

  // Attach local stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      logger.debug('Active Call Modal: Local stream attached');
    }
  }, [localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      logger.debug('Active Call Modal: Remote stream attached');
    }
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

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get connection status
  const getConnectionStatus = () => {
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
        return '📞 Calling...';
    }
  };

  // Handle end call
  // Ganti bagian handleEndCall di active-call-modal.tsx

  const handleEndCall = useCallback(async () => {
    if (!activeCall || isEnding) return;

    setIsEnding(true);

    try {
      logger.debug('Active Call Modal: Ending call...');

      // ✅ CLEANUP DULU
      cleanup();
      cleanupStreams();

      // ✅ HITUNG DURATION
      const duration = callStartTimeRef.current
        ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
        : 0;

      // ✅ END CALL DI SERVER
      await endCall(activeCall.id, duration);

      // ✅ CLOSE MODAL (onClose sudah jadi no-op, jadi aman)
      logger.success('Active Call Modal: Call ended successfully');

    } catch (error) {
      logger.error('Active Call Modal: Failed to end call:', error);
      setIsEnding(false);
    }
  }, [activeCall, isEnding, cleanup, cleanupStreams, endCall]);

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
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-center flex-col">
          <h2 className="text-xl font-semibold text-white">
            {otherParticipant?.name || 'Unknown'}
          </h2>
          <p className="text-lg text-gray-300 mt-1">
            {getConnectionStatus()}
          </p>
          {mediaError && (
            <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-full">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-yellow-400">{mediaError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {isVideoCall ? (
          <>
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Local Video (PIP) */}
            <div className="absolute bottom-24 right-4 w-32 h-48 md:w-48 md:h-64 rounded-lg overflow-hidden shadow-lg border-2 border-white/20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoOff className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* No remote fallback */}
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <UserAvatar
                    src={otherParticipant?.avatar}
                    name={otherParticipant?.name || 'Unknown'}
                    size="xl"
                    className="mx-auto mb-4"
                  />
                  <p className="text-white text-lg">
                    {isConnected ? 'Camera off' : 'Waiting for video...'}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Voice Call UI */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className={`relative ${isConnected ? 'animate-none' : 'animate-pulse'}`}>
                <UserAvatar
                  src={otherParticipant?.avatar}
                  name={otherParticipant?.name || 'Unknown'}
                  size="xl"
                  className="w-40 h-40 mx-auto"
                />
                {isConnected && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-semibold text-white mt-6">
                {otherParticipant?.name || 'Unknown'}
              </h2>

              <p className="text-gray-400 mt-2">
                {isVideoCall ? '📹 Video Call' : '🎤 Voice Call'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-6">
          {/* Mute/Unmute */}
          <Button
            size="lg"
            variant={isMuted ? 'destructive' : 'secondary'}
            onClick={toggleMute}
            className="h-16 w-16 rounded-full"
          >
            {isMuted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
          </Button>

          {/* Video Toggle */}
          {isVideoCall && (
            <Button
              size="lg"
              variant={!isVideoEnabled ? 'destructive' : 'secondary'}
              onClick={toggleVideo}
              className="h-16 w-16 rounded-full"
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
          >
            {isEnding ? <Loader2 className="h-7 w-7 animate-spin" /> : <PhoneOff className="h-7 w-7" />}
          </Button>
        </div>

        {/* Connection indicator */}
        <div className="mt-4 flex justify-center">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
              }`} />
            <span className="text-sm">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};