// ================================================
// FILE: src/features/media/hooks/use-media.ts
// useMedia Hook - Handle media upload & management
// ================================================

import { useState } from 'react';
import { mediaService } from '../services/media.service';
import { fileHelper } from '@/shared/utils/file-helper';

export const useMedia = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Upload image
  const uploadImage = async (file: File) => {
    // Validate
    const validation = fileHelper.validateImage(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid image');
      throw new Error(validation.error);
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Upload to Cloudinary
      const cloudinaryResult = await mediaService.uploadToCloudinary(
        file,
        (progress) => setUploadProgress(progress)
      );

      // Save to database
      const media = await mediaService.uploadMedia({
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        url: cloudinaryResult.url,
        thumbnailUrl: cloudinaryResult.thumbnailUrl,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
      });

      setIsUploading(false);
      setUploadProgress(100);
      return media;
    } catch (error: any) {
      setError(error.message || 'Upload failed');
      setIsUploading(false);
      throw error;
    }
  };

  // Upload video
  const uploadVideo = async (file: File) => {
    // Validate
    const validation = fileHelper.validateVideo(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid video');
      throw new Error(validation.error);
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Upload to Cloudinary
      const cloudinaryResult = await mediaService.uploadToCloudinary(
        file,
        (progress) => setUploadProgress(progress)
      );

      // Save to database
      const media = await mediaService.uploadMedia({
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        url: cloudinaryResult.url,
        thumbnailUrl: cloudinaryResult.thumbnailUrl,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        duration: cloudinaryResult.duration,
      });

      setIsUploading(false);
      setUploadProgress(100);
      return media;
    } catch (error: any) {
      setError(error.message || 'Upload failed');
      setIsUploading(false);
      throw error;
    }
  };

  // Upload file (auto-detect type)
  const uploadFile = async (file: File) => {
    if (fileHelper.isImage(file)) {
      return uploadImage(file);
    } else if (fileHelper.isVideo(file)) {
      return uploadVideo(file);
    } else {
      setError('Unsupported file type');
      throw new Error('Unsupported file type');
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return {
    uploadImage,
    uploadVideo,
    uploadFile,
    isUploading,
    uploadProgress,
    error,
    clearError,
  };
};