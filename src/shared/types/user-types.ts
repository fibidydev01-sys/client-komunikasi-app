// ================================================
// FILE: src/shared/types/user-types.ts
// User Related Types
// ================================================

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string | null;
  avatar: string | null;
  about: string | null;
  gender: Gender | null;
  profilePhoto: string | null;
  lastSeen: string | null;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreview {
  id: string;
  name: string;
  avatar: string | null;
  username: string | null;
}