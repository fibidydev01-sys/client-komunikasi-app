// ================================================
// FILE: src/features/status/components/status-upload-modal.tsx
// StatusUploadModal Component - Upload status/story
// ================================================

import { useState, useRef, ChangeEvent } from 'react';
import { X, Image, Type, Video } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { useStatus } from '../hooks/use-status';
import { useMedia } from '@/features/media/hooks/use-media';
import { StatusType } from '../types/status.types';
import { LoadingSpinner } from '@/shared/components/common/loading-spinner';

interface StatusUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BACKGROUND_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

export const StatusUploadModal = ({
  open,
  onOpenChange,
}: StatusUploadModalProps) => {
  const { createStatus, isLoading } = useStatus();
  const { uploadFile, isUploading, uploadProgress } = useMedia();

  const [statusType, setStatusType] = useState<StatusType>(StatusType.TEXT);
  const [content, setContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_COLORS[0]);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Set type based on file
    if (file.type.startsWith('image/')) {
      setStatusType(StatusType.IMAGE);
    } else if (file.type.startsWith('video/')) {
      setStatusType(StatusType.VIDEO);
    }
  };

  const handleSubmit = async () => {
    try {
      let mediaUrl: string | undefined;

      // Upload media if exists
      if (mediaFile) {
        const media = await uploadFile(mediaFile);
        mediaUrl = media.url;
      }

      // Create status
      await createStatus({
        type: statusType,
        content: content || undefined,
        mediaUrl,
        backgroundColor: statusType === StatusType.TEXT ? backgroundColor : undefined,
      });

      // Reset form
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create status:', error);
    }
  };

  const resetForm = () => {
    setStatusType(StatusType.TEXT);
    setContent('');
    setBackgroundColor(BACKGROUND_COLORS[0]);
    setMediaPreview(null);
    setMediaFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type Selection */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={statusType === StatusType.TEXT ? 'default' : 'outline'}
              onClick={() => {
                setStatusType(StatusType.TEXT);
                setMediaPreview(null);
                setMediaFile(null);
              }}
              className="flex-1"
            >
              <Type className="mr-2 h-4 w-4" />
              Text
            </Button>

            <Button
              type="button"
              variant={statusType === StatusType.IMAGE ? 'default' : 'outline'}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Image className="mr-2 h-4 w-4" />
              Image
            </Button>

            <Button
              type="button"
              variant={statusType === StatusType.VIDEO ? 'default' : 'outline'}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Video className="mr-2 h-4 w-4" />
              Video
            </Button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative">
              {statusType === StatusType.IMAGE && (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="w-full max-h-64 object-contain rounded-lg"
                />
              )}
              {statusType === StatusType.VIDEO && (
                <video
                  src={mediaPreview}
                  controls
                  className="w-full max-h-64 rounded-lg"
                />
              )}
              <Button
                type="button"
                size="icon"
                variant="destructive"
                onClick={() => {
                  setMediaPreview(null);
                  setMediaFile(null);
                  setStatusType(StatusType.TEXT);
                }}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Text Content */}
          {statusType === StatusType.TEXT && (
            <>
              <div className="space-y-2">
                <Label>Status Text</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="min-h-32"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {content.length}/200
                </p>
              </div>

              {/* Background Color Selector */}
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex gap-2">
                  {BACKGROUND_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBackgroundColor(color)}
                      className="h-10 w-10 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: color,
                        borderColor: backgroundColor === color ? '#fff' : 'transparent',
                        transform: backgroundColor === color ? 'scale(1.1)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div
                className="rounded-lg p-6 text-center"
                style={{ backgroundColor }}
              >
                <p className="text-white font-semibold">
                  {content || 'Your status preview...'}
                </p>
              </div>
            </>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading || isUploading}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1"
              disabled={
                isLoading ||
                isUploading ||
                (statusType === StatusType.TEXT && !content.trim()) ||
                (statusType !== StatusType.TEXT && !mediaFile)
              }
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create Status'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};