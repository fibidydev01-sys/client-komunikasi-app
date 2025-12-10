// ================================================
// FILE: src/features/call/components/call-button.tsx
// CallButton Component - Initiate call button
// ================================================

import { Phone, Video } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { CallType } from '../types/call.types';

interface CallButtonProps {
  type: 'voice' | 'video';
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export const CallButton = ({
  type,
  onClick,
  disabled,
  size = 'icon'
}: CallButtonProps) => {
  const Icon = type === 'voice' ? Phone : Video;

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={onClick}
      disabled={disabled}
      className="text-muted-foreground hover:text-primary"
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
};