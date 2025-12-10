// ================================================
// FILE: src/features/chat/hooks/use-chat.ts
// USE GLOBAL FLAG OUTSIDE REACT (CLEANED)
// ================================================

import { useEffect, useMemo } from 'react';
import { useChatStore } from '../store/chat.store';
import { useChatSocket } from './use-chat-socket';
import { logger } from '@/shared/utils/logger';
import type { CreateChatInput } from '../types/chat.types';

// ✅ GLOBAL FLAG (outside React component lifecycle)
let GLOBAL_CHATS_FETCHED = false;

export const useChat = (chatId?: string) => {
  const {
    chats,
    activeChat,
    messages,
    isLoading,
    error,
    typingUsers,
    fetchChats,
    setActiveChat,
    createChat,
    deleteChat,
    fetchMessages,
    deleteMessage,
    clearError,
  } = useChatStore();

  const { sendMessage, startTyping, stopTyping } = useChatSocket();

  // ✅ Fetch chats ONLY ONCE using GLOBAL flag
  useEffect(() => {
    if (!GLOBAL_CHATS_FETCHED) {
      logger.debug('useChat: Fetching chats (first time only)');
      fetchChats();
      GLOBAL_CHATS_FETCHED = true;
    }
  }, [fetchChats]);

  // Set active chat when chatId changes
  useEffect(() => {
    if (chatId) {
      const chat = chats.find((c) => c.id === chatId);
      if (chat) {
        setActiveChat(chat);
      }
    }
  }, [chatId, chats, setActiveChat]);

  // Get messages for active chat
  const chatMessages = useMemo(() => {
    return activeChat ? messages[activeChat.id] || [] : [];
  }, [activeChat, messages]);

  // Get typing users for active chat
  const typingUsersList = useMemo(() => {
    return activeChat ? typingUsers[activeChat.id] || [] : [];
  }, [activeChat, typingUsers]);

  // Create new chat
  const handleCreateChat = async (data: CreateChatInput) => {
    try {
      logger.debug('useChat: Creating chat...');
      const chat = await createChat(data);
      setActiveChat(chat);
      return chat;
    } catch (error) {
      logger.error('useChat: Failed to create chat:', error);
      throw error;
    }
  };

  // Send message
  const handleSendMessage = (content: string, type: string = 'text', image?: string) => {
    if (!activeChat) return;

    sendMessage({
      chatId: activeChat.id,
      content,
      type,
      image,
    });
  };

  // Delete chat
  const handleDeleteChat = async (chatIdToDelete: string) => {
    try {
      logger.debug('useChat: Deleting chat:', chatIdToDelete);
      await deleteChat(chatIdToDelete);
    } catch (error) {
      logger.error('useChat: Failed to delete chat:', error);
      throw error;
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!activeChat) return;

    try {
      logger.debug('useChat: Deleting message:', messageId);
      await deleteMessage(messageId, activeChat.id);
    } catch (error) {
      logger.error('useChat: Failed to delete message:', error);
      throw error;
    }
  };

  return {
    chats,
    activeChat,
    messages: chatMessages,
    typingUsers: typingUsersList,
    isLoading,
    error,
    createChat: handleCreateChat,
    sendMessage: handleSendMessage,
    deleteChat: handleDeleteChat,
    deleteMessage: handleDeleteMessage,
    startTyping,
    stopTyping,
    clearError,
  };
};

// ✅ EXPORT: Reset function for logout
export const resetChatFetch = () => {
  GLOBAL_CHATS_FETCHED = false;
};