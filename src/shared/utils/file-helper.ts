// ================================================
// FILE: src/shared/utils/file-helper.ts
// File Validation & Upload Helpers
// ================================================

import { APP_CONFIG } from '@/shared/constants/app-config';

export const fileHelper = {
  // Validate file size
  validateSize(file: File, maxSize: number = APP_CONFIG.MAX_FILE_SIZE): boolean {
    return file.size <= maxSize;
  },

  // Validate file type
  validateType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  },

  // Check if file is image
  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  },

  // Check if file is video
  isVideo(file: File): boolean {
    return file.type.startsWith('video/');
  },

  // Format file size (e.g., "1.5 MB")
  formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
  },

  // Get file extension
  getExtension(filename: string): string {
    return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
  },

  // Create file preview URL
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  },

  // Revoke preview URL
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  },

  // Validate image file
  validateImage(file: File): { valid: boolean; error?: string } {
    if (!this.isImage(file)) {
      return { valid: false, error: 'File must be an image' };
    }

    if (!this.validateType(file, APP_CONFIG.ALLOWED_IMAGE_TYPES)) {
      return { valid: false, error: 'Invalid image format' };
    }

    if (!this.validateSize(file, APP_CONFIG.MAX_IMAGE_SIZE)) {
      return {
        valid: false,
        error: `Image size must be less than ${this.formatSize(APP_CONFIG.MAX_IMAGE_SIZE)}`
      };
    }

    return { valid: true };
  },

  // Validate video file
  validateVideo(file: File): { valid: boolean; error?: string } {
    if (!this.isVideo(file)) {
      return { valid: false, error: 'File must be a video' };
    }

    if (!this.validateType(file, APP_CONFIG.ALLOWED_VIDEO_TYPES)) {
      return { valid: false, error: 'Invalid video format' };
    }

    if (!this.validateSize(file, APP_CONFIG.MAX_VIDEO_SIZE)) {
      return {
        valid: false,
        error: `Video size must be less than ${this.formatSize(APP_CONFIG.MAX_VIDEO_SIZE)}`
      };
    }

    return { valid: true };
  },
};