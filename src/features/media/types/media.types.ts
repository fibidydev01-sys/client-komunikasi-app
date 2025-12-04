// ================================================
// FILE: src/features/media/types/media.types.ts
// Media Types - Media upload & management types
// ================================================

// Upload Media Input
export interface UploadMediaInput {
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
}

// Cloudinary Upload Result
export interface CloudinaryUploadResult {
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
}

// Upload Progress
export interface UploadProgress {
  id: string;
  file: File;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}