// ================================================
// FILE: src/features/contacts/services/friend-request.service.ts
// Friend Request Service - Handle all friend request API calls (CLEANED)
// ================================================

import { axiosClient } from '@/lib/axios-client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { logger } from '@/shared/utils/logger';
import type { ApiResponse } from '@/shared/types/api-types';
import type {
  FriendRequest,
  FriendRequestWithDetails,
  SendRequestInput,
  FriendStatus
} from '../types/contact.types';

export const friendRequestService = {
  // Send friend request
  sendRequest: async (data: SendRequestInput): Promise<FriendRequestWithDetails> => {
    logger.debug('Friend Request Service: Sending request to:', data.receiverId);

    const response = await axiosClient.post<ApiResponse<FriendRequestWithDetails>>(
      API_ENDPOINTS.FRIEND_REQUEST.SEND,
      data
    );

    logger.success('Friend Request Service: Request sent successfully');

    return response.data.data!;
  },

  // Get pending requests (received)
  getPendingRequests: async (): Promise<FriendRequestWithDetails[]> => {
    logger.debug('Friend Request Service: Getting pending requests...');

    const response = await axiosClient.get<ApiResponse<FriendRequestWithDetails[]>>(
      API_ENDPOINTS.FRIEND_REQUEST.PENDING
    );

    logger.success('Friend Request Service: Pending requests retrieved:', response.data.data?.length || 0);

    return response.data.data || [];
  },

  // Get sent requests
  getSentRequests: async (): Promise<FriendRequestWithDetails[]> => {
    logger.debug('Friend Request Service: Getting sent requests...');

    const response = await axiosClient.get<ApiResponse<FriendRequestWithDetails[]>>(
      API_ENDPOINTS.FRIEND_REQUEST.SENT
    );

    logger.success('Friend Request Service: Sent requests retrieved:', response.data.data?.length || 0);

    return response.data.data || [];
  },

  // Accept friend request
  acceptRequest: async (requestId: string): Promise<FriendRequestWithDetails> => {
    logger.debug('Friend Request Service: Accepting request:', requestId);

    const response = await axiosClient.post<ApiResponse<FriendRequestWithDetails>>(
      API_ENDPOINTS.FRIEND_REQUEST.ACCEPT(requestId)
    );

    logger.success('Friend Request Service: Request accepted');

    return response.data.data!;
  },

  // Reject friend request
  rejectRequest: async (requestId: string): Promise<FriendRequestWithDetails> => {
    logger.debug('Friend Request Service: Rejecting request:', requestId);

    const response = await axiosClient.post<ApiResponse<FriendRequestWithDetails>>(
      API_ENDPOINTS.FRIEND_REQUEST.REJECT(requestId)
    );

    logger.success('Friend Request Service: Request rejected');

    return response.data.data!;
  },

  // Cancel friend request
  cancelRequest: async (requestId: string): Promise<void> => {
    logger.debug('Friend Request Service: Cancelling request:', requestId);

    await axiosClient.delete(API_ENDPOINTS.FRIEND_REQUEST.CANCEL(requestId));

    logger.success('Friend Request Service: Request cancelled');
  },

  // Check friend status with user
  checkFriendStatus: async (userId: string): Promise<FriendStatus> => {
    logger.debug('Friend Request Service: Checking friend status with:', userId);

    const response = await axiosClient.get<ApiResponse<FriendStatus>>(
      API_ENDPOINTS.FRIEND_REQUEST.STATUS(userId)
    );

    logger.success('Friend Request Service: Friend status retrieved');

    return response.data.data!;
  },
};