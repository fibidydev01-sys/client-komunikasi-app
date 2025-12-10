// ================================================
// FILE: src/features/chat/types/chat.types.ts
// Chat Types - Chat & Message related types
// ================================================

import type { User } from '@/shared/types/user-types';

// Message Type
export type MessageType = 'text' | 'image' | 'video' | 'file' | 'audio';

// Base Chat
export interface Chat {
  id: string;
  isGroup: boolean;
  groupName: string | null;
  groupAvatar: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// Chat with participants and last message
export interface ChatWithDetails extends Chat {
  participants: User[];
  messages: MessageWithDetails[];
}

// Base Message
export interface Message {
  id: string;
  content: string;
  type: MessageType;
  image: string | null;
  chatId: string;
  senderId: string;
  replyToId: string | null;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

// Message with sender details
export interface MessageWithDetails extends Message {
  sender: {
    id: string;
    name: string;
    avatar: string | null;
    email?: string;
    username?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  replyTo?: MessageWithDetails | null;
  chat?: ChatWithDetails;
}

// Create Chat Input
export interface CreateChatInput {
  participantId: string;
}

// Create Message Input
export interface CreateMessageInput {
  chatId: string;
  content: string;
  type?: MessageType;
  image?: string;
  replyToId?: string;
}

// Typing Indicator
export interface TypingIndicator {
  userId: string;
  chatId: string;
  username: string;
  isTyping: boolean;
}