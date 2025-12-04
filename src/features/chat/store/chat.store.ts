// ================================================
// FILE: src/features/chat/store/chat.store.ts
// Chat Store - Global chat & message state (CLEANED)
// ================================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { chatService } from '../services/chat.service';
import { messageService } from '../services/message.service';
import { toastHelper } from '@/shared/utils/toast-helper';
import { logger } from '@/shared/utils/logger';
import type {
  ChatWithDetails,
  MessageWithDetails,
  CreateChatInput,
  CreateMessageInput
} from '../types/chat.types';

interface ChatState {
  // State
  chats: ChatWithDetails[];
  activeChat: ChatWithDetails | null;
  messages: Record<string, MessageWithDetails[]>; // { chatId: messages[] }
  isLoading: boolean;
  error: string | null;
  hasFetchedChats: boolean;

  // Actions - Chat
  fetchChats: () => Promise<void>;
  setActiveChat: (chat: ChatWithDetails | null) => void;
  createChat: (data: CreateChatInput) => Promise<ChatWithDetails>;
  deleteChat: (chatId: string) => Promise<void>;
  addChat: (chat: ChatWithDetails) => void;
  updateChat: (chatId: string, updates: Partial<ChatWithDetails>) => void;

  // Actions - Message
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (data: CreateMessageInput) => Promise<void>;
  addMessage: (message: MessageWithDetails) => void;
  deleteMessage: (messageId: string, chatId: string) => Promise<void>;
  updateMessage: (messageId: string, chatId: string, updates: Partial<MessageWithDetails>) => void;

  // Typing indicators
  typingUsers: Record<string, string[]>; // { chatId: [userId1, userId2] }
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;

  // Utils
  clearError: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      // Initial state
      chats: [],
      activeChat: null,
      messages: {},
      isLoading: false,
      error: null,
      typingUsers: {},
      hasFetchedChats: false,

      // Fetch all chats
      fetchChats: async () => {
        set({ isLoading: true, error: null });

        try {
          logger.debug('Chat Store: Fetching chats...');
          const chats = await chatService.getUserChats();

          set({
            chats,
            isLoading: false,
            hasFetchedChats: true
          });

          logger.success('Chat Store: Chats fetched:', chats.length);
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to fetch chats';

          logger.error('Chat Store: Fetch chats failed:', error);

          set({
            error: errorMsg,
            isLoading: false
          });

          // Silent error - no toast for background fetch
        }
      },

      // Set active chat
      setActiveChat: (chat) => {
        set({ activeChat: chat });
        if (chat && !get().messages[chat.id]) {
          get().fetchMessages(chat.id);
        }
      },

      // Create new chat
      createChat: async (data) => {
        try {
          logger.debug('Chat Store: Creating chat...');
          const chat = await chatService.createChat(data);

          toastHelper.success('Chat created successfully!');

          set((state) => ({
            chats: [chat, ...state.chats]
          }));

          logger.success('Chat Store: Chat created');
          return chat;
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to create chat';

          logger.error('Chat Store: Create chat failed:', error);
          toastHelper.error(errorMsg);

          set({ error: errorMsg });
          throw error;
        }
      },

      // Delete chat
      deleteChat: async (chatId) => {
        try {
          logger.debug('Chat Store: Deleting chat:', chatId);
          await chatService.deleteChat(chatId);

          toastHelper.success('Chat deleted successfully!');

          set((state) => ({
            chats: state.chats.filter((c) => c.id !== chatId),
            activeChat: state.activeChat?.id === chatId ? null : state.activeChat,
            messages: Object.fromEntries(
              Object.entries(state.messages).filter(([id]) => id !== chatId)
            ),
          }));

          logger.success('Chat Store: Chat deleted');
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to delete chat';

          logger.error('Chat Store: Delete chat failed:', error);
          toastHelper.error(errorMsg);

          set({ error: errorMsg });
          throw error;
        }
      },

      // Add chat (from socket)
      addChat: (chat) => {
        logger.debug('Chat Store: Adding chat from socket:', chat.id);

        set((state) => {
          const exists = state.chats.some((c) => c.id === chat.id);
          if (exists) return state;
          return { chats: [chat, ...state.chats] };
        });
      },

      // Update chat
      updateChat: (chatId, updates) => {
        logger.debug('Chat Store: Updating chat:', chatId);

        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId ? { ...chat, ...updates } : chat
          ),
          activeChat: state.activeChat?.id === chatId
            ? { ...state.activeChat, ...updates }
            : state.activeChat,
        }));
      },

      // Fetch messages for a chat
      fetchMessages: async (chatId) => {
        set({ isLoading: true, error: null });

        try {
          logger.debug('Chat Store: Fetching messages for chat:', chatId);
          const messages = await messageService.getChatMessages(chatId);

          set((state) => ({
            messages: { ...state.messages, [chatId]: messages },
            isLoading: false,
          }));

          logger.success('Chat Store: Messages fetched:', messages.length);
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to fetch messages';

          logger.error('Chat Store: Fetch messages failed:', error);

          set({
            error: errorMsg,
            isLoading: false
          });

          // Silent error - no toast for background fetch
        }
      },

      // Send message
      sendMessage: async (data) => {
        try {
          logger.debug('Chat Store: Sending message...');
          await messageService.sendMessage(data);
          // Message will be added via socket event
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to send message';

          logger.error('Chat Store: Send message failed:', error);
          toastHelper.error(errorMsg);

          set({ error: errorMsg });
          throw error;
        }
      },

      // Add message (from socket) - PREVENT DUPLICATES
      addMessage: (message) => {
        set((state) => {
          const chatMessages = state.messages[message.chatId] || [];

          // Check for duplicate
          const isDuplicate = chatMessages.some(m => m.id === message.id);
          if (isDuplicate) {
            logger.warn('Chat Store: Duplicate message prevented:', message.id);
            return state;
          }

          logger.debug('Chat Store: Adding message:', message.id);

          return {
            messages: {
              ...state.messages,
              [message.chatId]: [...chatMessages, message],
            },
          };
        });

        // Update chat's last message
        get().updateChat(message.chatId, {
          updatedAt: message.createdAt,
          messages: [message],
        } as any);
      },

      // Delete message
      deleteMessage: async (messageId, chatId) => {
        try {
          logger.debug('Chat Store: Deleting message:', messageId);
          await messageService.deleteMessage(messageId);

          toastHelper.success('Message deleted');

          set((state) => ({
            messages: {
              ...state.messages,
              [chatId]: state.messages[chatId]?.filter((m) => m.id !== messageId) || [],
            },
          }));

          logger.success('Chat Store: Message deleted');
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to delete message';

          logger.error('Chat Store: Delete message failed:', error);
          toastHelper.error(errorMsg);

          set({ error: errorMsg });
          throw error;
        }
      },

      // Update message
      updateMessage: (messageId, chatId, updates) => {
        logger.debug('Chat Store: Updating message:', messageId);

        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: state.messages[chatId]?.map((msg) =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            ) || [],
          },
        }));
      },

      // Set typing indicator
      setTyping: (chatId, userId, isTyping) => {
        set((state) => {
          const users = state.typingUsers[chatId] || [];
          const filtered = users.filter((id) => id !== userId);

          return {
            typingUsers: {
              ...state.typingUsers,
              [chatId]: isTyping ? [...filtered, userId] : filtered,
            },
          };
        });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Reset store
      reset: () => {
        set({
          chats: [],
          activeChat: null,
          messages: {},
          isLoading: false,
          error: null,
          typingUsers: {},
          hasFetchedChats: false,
        });
      },
    }),
    { name: 'ChatStore' }
  )
);