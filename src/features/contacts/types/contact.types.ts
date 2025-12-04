// ================================================
// FILE: src/features/contacts/types/contact.types.ts
// Contact Types - Contact & Friend Request types
// ================================================

import type { User } from '@/shared/types/user-types';

// Request Status
export enum RequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

// Base Contact
export interface Contact {
  id: string;
  userId: string;
  contactId: string;
  nickname: string | null;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

// Contact with user details
export interface ContactWithDetails extends Contact {
  contact: User;
}

// Base Friend Request
export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

// Friend Request with user details
export interface FriendRequestWithDetails extends FriendRequest {
  sender: User;
  receiver: User;
}

// Send Friend Request Input
export interface SendRequestInput {
  receiverId: string;
}

// Block Contact Input
export interface BlockContactInput {
  contactId: string;
}

// Update Nickname Input
export interface UpdateNicknameInput {
  contactId: string;
  nickname?: string;
}

// Friend Status
export interface FriendStatus {
  isFriend: boolean;
  requestStatus: RequestStatus | null;
  requestId: string | null;
  canSendRequest: boolean;
}