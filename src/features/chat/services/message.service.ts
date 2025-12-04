// ================================================
// FILE: src/features/chat/services/message.service.ts
// Message Service - Handle all message API calls (CLEANED)
// ================================================

import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import type { ApiResponse } from '@/shared/types/api-types';
import type {
  Message,
  CreateMessageInput,
  MessageWithDetails
} from '../types/chat.types';
import { logger } from '@/shared/utils/logger';
import { axiosClient } from '@/lib/axios-client';

export const messageService = {
  // Get messages by chat ID
  getChatMessages: async (chatId: string): Promise<MessageWithDetails[]> => {
    logger.debug('Message Service: Getting messages for chat:', chatId);
    const response = await axiosClient.get<ApiResponse<MessageWithDetails[]>>(
      API_ENDPOINTS.MESSAGE.BY_CHAT(chatId)
    );
    logger.success('Message Service: Messages retrieved');
    return response.data.data || [];
  },

  // Send message (HTTP fallback)
  sendMessage: async (data: CreateMessageInput): Promise<MessageWithDetails> => {
    logger.debug('Message Service: Sending message...');
    const response = await axiosClient.post<ApiResponse<MessageWithDetails>>(
      API_ENDPOINTS.MESSAGE.SEND,
      data
    );
    logger.success('Message Service: Message sent');
    return response.data.data!;
  },

  // Delete message
  deleteMessage: async (messageId: string): Promise<void> => {
    logger.debug('Message Service: Deleting message:', messageId);
    await axiosClient.delete(API_ENDPOINTS.MESSAGE.DELETE(messageId));
    logger.success('Message Service: Message deleted');
  },

  // Mark message as read
  markAsRead: async (messageId: string): Promise<void> => {
    logger.debug('Message Service: Marking message as read:', messageId);
    await axiosClient.patch(API_ENDPOINTS.MESSAGE.MARK_READ(messageId));
    logger.success('Message Service: Message marked as read');
  },
};