// ================================================
// FILE: src/features/chat/services/chat.service.ts
// Chat Service - Handle all chat API calls (CLEANED)
// ================================================

import { axiosClient } from '@/lib/axios-client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { logger } from '@/shared/utils/logger';
import type { ApiResponse } from '@/shared/types/api-types';
import type {
  Chat,
  CreateChatInput,
  ChatWithDetails
} from '../types/chat.types';

export const chatService = {
  // Get all user chats
  getUserChats: async (): Promise<ChatWithDetails[]> => {
    logger.debug('Chat Service: Getting user chats...');
    const response = await axiosClient.get<ApiResponse<ChatWithDetails[]>>(
      API_ENDPOINTS.CHAT.LIST
    );
    logger.success('Chat Service: User chats retrieved');
    return response.data.data || [];
  },

  // Get chat by ID
  getChatById: async (chatId: string): Promise<ChatWithDetails> => {
    logger.debug('Chat Service: Getting chat by ID:', chatId);
    const response = await axiosClient.get<ApiResponse<ChatWithDetails>>(
      API_ENDPOINTS.CHAT.BY_ID(chatId)
    );
    logger.success('Chat Service: Chat retrieved');
    return response.data.data!;
  },

  // Create new chat
  createChat: async (data: CreateChatInput): Promise<ChatWithDetails> => {
    logger.debug('Chat Service: Creating chat...');
    const response = await axiosClient.post<ApiResponse<ChatWithDetails>>(
      API_ENDPOINTS.CHAT.CREATE,
      data
    );
    logger.success('Chat Service: Chat created');
    return response.data.data!;
  },

  // Delete chat
  deleteChat: async (chatId: string): Promise<void> => {
    logger.debug('Chat Service: Deleting chat:', chatId);
    await axiosClient.delete(API_ENDPOINTS.CHAT.DELETE(chatId));
    logger.success('Chat Service: Chat deleted');
  },
};