// ================================================
// FILE: src/features/status/types/status.types.ts
// Status Types - Status/Story related types
// ================================================

import type { User } from '@/shared/types/user-types';

// Status Type
export enum StatusType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

// Status Privacy Type
export enum StatusPrivacyType {
  ALL = 'ALL',
  CONTACTS = 'CONTACTS',
  EXCEPT = 'EXCEPT',
}

// Base Status
export interface Status {
  id: string;
  userId: string;
  type: StatusType;
  content: string | null;
  mediaUrl: string | null;
  backgroundColor: string;
  viewCount: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// Status with user details
export interface StatusWithDetails extends Status {
  user: {
    id: string;
    name: string;
    username: string | null;
    avatar: string | null;
    profilePhoto: string | null;
  };
  views?: Array<{
    id: string;
    viewedAt: string;
    viewer: {
      id: string;
      name: string;
      username: string | null;
      avatar: string | null;
    };
  }>;
  privacy?: StatusPrivacy | null;
}

// Status Privacy
export interface StatusPrivacy {
  id: string;
  statusId: string;
  type: StatusPrivacyType;
  exceptUserIds: string[];
  onlyUserIds: string[];
  createdAt: string;
  updatedAt: string;
}

// Status View
export interface StatusView {
  id: string;
  statusId: string;
  viewerId: string;
  viewedAt: string;
  viewer?: {
    id: string;
    name: string;
    username: string | null;
    avatar: string | null;
  };
}

// Create Status Input
export interface CreateStatusInput {
  type: StatusType;
  content?: string;
  mediaUrl?: string;
  backgroundColor?: string;
}

// Update Status Privacy Input
export interface UpdateStatusPrivacyInput {
  type: StatusPrivacyType;
  exceptUserIds?: string[];
  onlyUserIds?: string[];
}