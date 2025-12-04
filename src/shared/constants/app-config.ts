// ================================================
// FILE: src/shared/constants/app-config.ts
// Application-wide Constants
// ================================================

export const APP_CONFIG = {
  APP_NAME: 'Chat App Pro',
  APP_VERSION: '1.0.0',

  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000',

  // File Upload Limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB

  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],

  // Cloudinary (for media upload)
  CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'chat_app',

  // UI Settings
  DESKTOP_BREAKPOINT: 1024,
  TABLET_BREAKPOINT: 768,
  MOBILE_BREAKPOINT: 640,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MESSAGES_PER_PAGE: 50,

  // Timeouts
  REQUEST_TIMEOUT: 30000, // 30 seconds
  DEBOUNCE_DELAY: 300, // 300ms

  // Status/Story
  STATUS_EXPIRE_HOURS: 24,
} as const;