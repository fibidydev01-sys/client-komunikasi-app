// ================================================
// FILE: src/features/contacts/services/contact.service.ts
// Contact Service - Handle all contact API calls (CLEANED)
// ================================================

import { axiosClient } from '@/lib/axios-client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { logger } from '@/shared/utils/logger';
import type { ApiResponse } from '@/shared/types/api-types';
import type {
  Contact,
  ContactWithDetails,
  BlockContactInput,
  UpdateNicknameInput
} from '../types/contact.types';

export const contactService = {
  // Get all contacts
  getContacts: async (): Promise<ContactWithDetails[]> => {
    logger.debug('Contact Service: Getting contacts...');

    const response = await axiosClient.get<ApiResponse<ContactWithDetails[]>>(
      API_ENDPOINTS.CONTACT.LIST
    );

    logger.success('Contact Service: Contacts retrieved:', response.data.data?.length || 0);

    return response.data.data || [];
  },

  // Get blocked contacts
  getBlockedContacts: async (): Promise<ContactWithDetails[]> => {
    logger.debug('Contact Service: Getting blocked contacts...');

    const response = await axiosClient.get<ApiResponse<ContactWithDetails[]>>(
      API_ENDPOINTS.CONTACT.BLOCKED
    );

    logger.success('Contact Service: Blocked contacts retrieved:', response.data.data?.length || 0);

    return response.data.data || [];
  },

  // Block contact
  blockContact: async (data: BlockContactInput): Promise<void> => {
    logger.debug('Contact Service: Blocking contact:', data.contactId);

    await axiosClient.post(API_ENDPOINTS.CONTACT.BLOCK, data);

    logger.success('Contact Service: Contact blocked');
  },

  // Unblock contact
  unblockContact: async (data: BlockContactInput): Promise<void> => {
    logger.debug('Contact Service: Unblocking contact:', data.contactId);

    await axiosClient.post(API_ENDPOINTS.CONTACT.UNBLOCK, data);

    logger.success('Contact Service: Contact unblocked');
  },

  // Remove contact
  removeContact: async (contactId: string): Promise<void> => {
    logger.debug('Contact Service: Removing contact:', contactId);

    await axiosClient.delete(API_ENDPOINTS.CONTACT.REMOVE(contactId));

    logger.success('Contact Service: Contact removed');
  },

  // Update nickname
  updateNickname: async (data: UpdateNicknameInput): Promise<ContactWithDetails> => {
    logger.debug('Contact Service: Updating nickname:', data);

    const response = await axiosClient.patch<ApiResponse<ContactWithDetails>>(
      API_ENDPOINTS.CONTACT.NICKNAME,
      data
    );

    logger.success('Contact Service: Nickname updated');

    return response.data.data!;
  },
};