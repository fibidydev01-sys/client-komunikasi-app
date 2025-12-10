// ================================================
// FILE: src/shared/components/common/loading-spinner.tsx
// LoadingSpinner Component - Loading indicator
// ================================================

import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export const LoadingSpinner = ({
  size = 'md',
  className,
  text
}: LoadingSpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2
        className={cn(
          'animate-spin text-primary',
          sizeClasses[size],
          className
        )}
      />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
};

// Full page loading
export const LoadingPage = ({ text = 'Loading...' }: { text?: string }) => {
  return (
    <div className="flex h-screen items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};