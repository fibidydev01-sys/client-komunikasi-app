// ================================================
// FILE: src/features/status/services/status.service.ts
// Status Service - Handle all status API calls (CLEANED)
// ================================================

import { axiosClient } from '@/lib/axios-client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { logger } from '@/shared/utils/logger';
import type { ApiResponse } from '@/shared/types/api-types';
import type {
  Status,
  StatusWithDetails,
  CreateStatusInput,
  UpdateStatusPrivacyInput,
  StatusView
} from '../types/status.types';

export const statusService = {
  // Create new status
  createStatus: async (data: CreateStatusInput): Promise<StatusWithDetails> => {
    logger.debug('Status Service: Creating status...');

    const response = await axiosClient.post<ApiResponse<StatusWithDetails>>(
      API_ENDPOINTS.STATUS.CREATE,
      data
    );

    logger.success('Status Service: Status created');

    return response.data.data!;
  },

  // Get contacts' statuses
  getContactsStatuses: async (): Promise<StatusWithDetails[]> => {
    logger.debug('Status Service: Getting contacts statuses...');

    const response = await axiosClient.get<ApiResponse<StatusWithDetails[]>>(
      API_ENDPOINTS.STATUS.LIST
    );

    logger.success('Status Service: Contacts statuses retrieved:', response.data.data?.length || 0);

    return response.data.data || [];
  },

  // Get my statuses
  getMyStatuses: async (): Promise<StatusWithDetails[]> => {
    logger.debug('Status Service: Getting my statuses...');

    const response = await axiosClient.get<ApiResponse<StatusWithDetails[]>>(
      API_ENDPOINTS.STATUS.MY
    );

    logger.success('Status Service: My statuses retrieved:', response.data.data?.length || 0);

    return response.data.data || [];
  },

  // Get status by ID
  getStatusById: async (statusId: string): Promise<StatusWithDetails> => {
    logger.debug('Status Service: Getting status by ID:', statusId);

    const response = await axiosClient.get<ApiResponse<StatusWithDetails>>(
      API_ENDPOINTS.STATUS.BY_ID(statusId)
    );

    logger.success('Status Service: Status retrieved');

    return response.data.data!;
  },

  // Mark status as viewed
  markAsViewed: async (statusId: string): Promise<StatusView> => {
    logger.debug('Status Service: Marking status as viewed:', statusId);

    const response = await axiosClient.post<ApiResponse<StatusView>>(
      API_ENDPOINTS.STATUS.VIEW(statusId)
    );

    logger.success('Status Service: Status marked as viewed');

    return response.data.data!;
  },

  // Get status views
  getStatusViews: async (statusId: string): Promise<StatusView[]> => {
    logger.debug('Status Service: Getting status views:', statusId);

    const response = await axiosClient.get<ApiResponse<StatusView[]>>(
      API_ENDPOINTS.STATUS.VIEWS(statusId)
    );

    logger.success('Status Service: Status views retrieved:', response.data.data?.length || 0);

    return response.data.data || [];
  },

  // Update status privacy
  updatePrivacy: async (
    statusId: string,
    data: UpdateStatusPrivacyInput
  ): Promise<StatusWithDetails> => {
    logger.debug('Status Service: Updating privacy:', statusId);

    const response = await axiosClient.patch<ApiResponse<StatusWithDetails>>(
      API_ENDPOINTS.STATUS.PRIVACY(statusId),
      data
    );

    logger.success('Status Service: Privacy updated');

    return response.data.data!;
  },

  // Delete status
  deleteStatus: async (statusId: string): Promise<void> => {
    logger.debug('Status Service: Deleting status:', statusId);

    await axiosClient.delete(API_ENDPOINTS.STATUS.DELETE(statusId));

    logger.success('Status Service: Status deleted');
  },
};