// ================================================
// FILE: src/features/profile/types/profile.types.ts
// Profile Types - Profile & Settings types
// ================================================

import type { Gender } from '@/shared/types/user-types';

// Privacy Enums
export enum LastSeenPrivacy {
  EVERYONE = 'EVERYONE',
  CONTACTS = 'CONTACTS',
  NOBODY = 'NOBODY',
}

export enum ProfilePhotoPrivacy {
  EVERYONE = 'EVERYONE',
  CONTACTS = 'CONTACTS',
  NOBODY = 'NOBODY',
}

export enum AboutPrivacy {
  EVERYONE = 'EVERYONE',
  CONTACTS = 'CONTACTS',
  NOBODY = 'NOBODY',
}

// Update Profile Input
export interface UpdateProfileInput {
  name?: string;
  about?: string;
  gender?: Gender;
  avatar?: string;
  profilePhoto?: string;
}

// Change Password Input
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// Update Privacy Input
export interface UpdatePrivacyInput {
  showOnlineStatus?: boolean;
  showLastSeen?: LastSeenPrivacy;
  showProfilePhoto?: ProfilePhotoPrivacy;
  showAbout?: AboutPrivacy;
  showStatus?: string;
}

// User Settings
export interface UserSettings {
  id: string;
  userId: string;

  // Privacy
  showOnlineStatus: boolean;
  showLastSeen: LastSeenPrivacy;
  showProfilePhoto: ProfilePhotoPrivacy;
  showAbout: AboutPrivacy;
  showStatus: string;

  // Notifications
  messageNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showPreview: boolean;
  notificationTone: string;
  callNotifications: boolean;
  callRingtone: string;

  createdAt: string;
  updatedAt: string;
}

// Session
export interface Session {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  lastActiveAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}