// ================================================
// FILE: src/features/media/services/media.service.ts
// Media Service - Handle all media API calls
// ================================================

import { axiosClient } from '@/lib/axios-client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import type { ApiResponse } from '@/shared/types/api-types';
import type { MediaItem } from '@/shared/types/media-types';
import type { UploadMediaInput } from '../types/media.types';

export const mediaService = {
  // Upload media
  uploadMedia: async (data: UploadMediaInput): Promise<MediaItem> => {
    const response = await axiosClient.post<ApiResponse<MediaItem>>(
      API_ENDPOINTS.MEDIA.UPLOAD,
      data
    );
    return response.data.data!;
  },

  // Get media by ID
  getMediaById: async (mediaId: string): Promise<MediaItem> => {
    const response = await axiosClient.get<ApiResponse<MediaItem>>(
      API_ENDPOINTS.MEDIA.BY_ID(mediaId)
    );
    return response.data.data!;
  },

  // Get all user media
  getUserMedia: async (): Promise<MediaItem[]> => {
    const response = await axiosClient.get<ApiResponse<MediaItem[]>>(
      API_ENDPOINTS.MEDIA.USER_ALL
    );
    return response.data.data || [];
  },

  // Delete media
  deleteMedia: async (mediaId: string): Promise<void> => {
    await axiosClient.delete(API_ENDPOINTS.MEDIA.DELETE(mediaId));
  },

  // Upload to Cloudinary (client-side)
  uploadToCloudinary: async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{
    url: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    duration?: number;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append(
      'upload_preset',
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'chat_app'
    );

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();

    return {
      url: data.secure_url,
      thumbnailUrl: data.thumbnail_url,
      width: data.width,
      height: data.height,
      duration: data.duration,
    };
  },
};