// ================================================
// FILE: src/features/call/components/incoming-call-modal.tsx
// IncomingCallModal Component - Incoming call notification
// ================================================

import { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { UserAvatar } from '@/shared/components/common/user-avatar';
import type { CallWithDetails } from '../types/call.types';

interface IncomingCallModalProps {
  call: CallWithDetails | null;
  onAnswer: () => void;
  onReject: () => void;
}

export const IncomingCallModal = ({
  call,
  onAnswer,
  onReject,
}: IncomingCallModalProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play ringtone when call comes in
  useEffect(() => {
    if (call) {
      // Create and play ringtone
      try {
        audioRef.current = new Audio('/sounds/ringtone.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(() => { });
      } catch (e) {
        // Ignore audio errors
      }
    }

    return () => {
      // Stop ringtone when modal closes
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, [call]);

  const handleAnswer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onAnswer();
  };

  const handleReject = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onReject();
  };

  if (!call) return null;

  const isVideo = call.type === 'VIDEO';

  return (
    <Dialog open={!!call} onOpenChange={() => { }}>
      <DialogContent
        className="sm:max-w-md bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center gap-6 py-6">
          {/* Animated ring around avatar */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full animate-ping bg-green-500/30" />
            <div className="absolute inset-0 rounded-full animate-pulse bg-green-500/20" />
            <UserAvatar
              src={call.caller.avatar}
              name={call.caller.name}
              size="xl"
              className="relative z-10 w-28 h-28"
            />
          </div>

          {/* Call info */}
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-white">
              {call.caller.name}
            </h3>
            <p className="text-gray-400 mt-1">
              {isVideo ? '📹 Incoming Video Call...' : '📞 Incoming Voice Call...'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-8 mt-4">
            {/* Reject */}
            <div className="flex flex-col items-center gap-2">
              <Button
                size="lg"
                variant="destructive"
                onClick={handleReject}
                className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 animate-bounce"
                style={{ animationDuration: '2s' }}
              >
                <PhoneOff className="h-7 w-7" />
              </Button>
              <span className="text-sm text-gray-400">Decline</span>
            </div>

            {/* Answer */}
            <div className="flex flex-col items-center gap-2">
              <Button
                size="lg"
                onClick={handleAnswer}
                className="h-16 w-16 rounded-full bg-green-600 hover:bg-green-700 animate-bounce"
                style={{ animationDuration: '2s', animationDelay: '0.5s' }}
              >
                {isVideo ? (
                  <Video className="h-7 w-7" />
                ) : (
                  <Phone className="h-7 w-7" />
                )}
              </Button>
              <span className="text-sm text-gray-400">Accept</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};