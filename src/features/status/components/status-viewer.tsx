// ================================================
// FILE: src/features/status/components/status-viewer.tsx
// StatusViewer Component - Full screen status viewer
// ================================================

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserAvatar } from '@/shared/components/common/user-avatar';
import { Button } from '@/shared/components/ui/button';
import { dateFormatter } from '@/shared/utils/date-formatter';
import type { StatusWithDetails } from '../types/status.types';

interface StatusViewerProps {
  statuses: StatusWithDetails[];
  initialIndex?: number;
  onClose: () => void;
  onView?: (statusId: string) => void;
}

export const StatusViewer = ({
  statuses,
  initialIndex = 0,
  onClose,
  onView,
}: StatusViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const currentStatus = statuses[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === statuses.length - 1;

  // Auto progress
  useEffect(() => {
    const duration = 5000; // 5 seconds
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);

      if (elapsed >= duration) {
        if (!isLast) {
          handleNext();
        } else {
          onClose();
        }
      }
    }, interval);

    // Mark as viewed
    if (currentStatus && onView) {
      onView(currentStatus.id);
    }

    return () => clearInterval(timer);
  }, [currentIndex, currentStatus, isLast, onClose, onView]);

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (!isLast) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    }
  };

  if (!currentStatus) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2">
        {statuses.map((_, index) => (
          <div
            key={index}
            className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
          >
            <div
              className="h-full bg-white transition-all"
              style={{
                width: index === currentIndex ? `${progress}%` : index < currentIndex ? '100%' : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            src={currentStatus.user.avatar}
            name={currentStatus.user.name}
            size="md"
          />
          <div>
            <h3 className="font-semibold text-white">
              {currentStatus.user.name}
            </h3>
            <p className="text-sm text-white/80">
              {dateFormatter.relativeTime(currentStatus.createdAt)}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Status Content */}
      <div className="flex h-full items-center justify-center p-4">
        {currentStatus.type === 'TEXT' && (
          <div
            className="max-w-2xl rounded-lg p-8 text-center"
            style={{ backgroundColor: currentStatus.backgroundColor }}
          >
            <p className="text-2xl font-semibold text-white">
              {currentStatus.content}
            </p>
          </div>
        )}

        {currentStatus.type === 'IMAGE' && currentStatus.mediaUrl && (
          <img
            src={currentStatus.mediaUrl}
            alt="Status"
            className="max-h-full max-w-full object-contain"
          />
        )}

        {currentStatus.type === 'VIDEO' && currentStatus.mediaUrl && (
          <video
            src={currentStatus.mediaUrl}
            autoPlay
            loop
            className="max-h-full max-w-full"
          />
        )}
      </div>

      {/* Navigation */}
      <div className="absolute inset-y-0 left-0 flex items-center">
        {!isFirst && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="ml-4 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}
      </div>

      <div className="absolute inset-y-0 right-0 flex items-center">
        {!isLast && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="mr-4 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </div>
    </div>
  );
};