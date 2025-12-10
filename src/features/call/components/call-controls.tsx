// ================================================
// FILE: src/features/call/components/call-controls.tsx
// CallControls Component - In-call controls
// ================================================

import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

interface CallControlsProps {
  isMuted: boolean;
  isVideoEnabled: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  isVideoCall?: boolean;
}

export const CallControls = ({
  isMuted,
  isVideoEnabled,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  isVideoCall = false,
}: CallControlsProps) => {
  return (
    <div className="flex items-center justify-center gap-4 rounded-lg bg-background/80 p-4 backdrop-blur">
      {/* Mute/Unmute */}
      <Button
        size="lg"
        variant={isMuted ? 'destructive' : 'secondary'}
        onClick={onToggleMute}
        className="h-14 w-14 rounded-full"
      >
        {isMuted ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>

      {/* Video Toggle (only for video calls) */}
      {isVideoCall && (
        <Button
          size="lg"
          variant={!isVideoEnabled ? 'destructive' : 'secondary'}
          onClick={onToggleVideo}
          className="h-14 w-14 rounded-full"
        >
          {isVideoEnabled ? (
            <Video className="h-6 w-6" />
          ) : (
            <VideoOff className="h-6 w-6" />
          )}
        </Button>
      )}

      {/* End Call */}
      <Button
        size="lg"
        variant="destructive"
        onClick={onEndCall}
        className="h-14 w-14 rounded-full"
      >
        <PhoneOff className="h-6 w-6" />
      </Button>
    </div>
  );
};