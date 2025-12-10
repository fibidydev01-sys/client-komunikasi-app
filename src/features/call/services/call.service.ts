// ================================================
// FILE: src/features/call/services/call.service.ts
// Call Service - Handle all call API calls (CLEANED)
// ================================================

import { axiosClient } from '@/lib/axios-client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { logger } from '@/shared/utils/logger';
import type { ApiResponse } from '@/shared/types/api-types';
import type {
  InitiateCallInput,
  CallWithDetails
} from '../types/call.types';

export const callService = {
  // Initiate call
  initiateCall: async (data: InitiateCallInput): Promise<CallWithDetails> => {
    logger.debug('Call Service: Initiating call...');

    const response = await axiosClient.post<ApiResponse<CallWithDetails>>(
      API_ENDPOINTS.CALL.INITIATE,
      data
    );

    logger.success('Call Service: Call initiated');

    return response.data.data!;
  },

  // Answer call
  answerCall: async (callId: string): Promise<CallWithDetails> => {
    logger.debug('Call Service: Answering call:', callId);

    const response = await axiosClient.post<ApiResponse<CallWithDetails>>(
      API_ENDPOINTS.CALL.ANSWER(callId)
    );

    logger.success('Call Service: Call answered');

    return response.data.data!;
  },

  // End call
  endCall: async (callId: string, duration?: number): Promise<CallWithDetails> => {
    logger.debug('Call Service: Ending call:', callId);

    const response = await axiosClient.post<ApiResponse<CallWithDetails>>(
      API_ENDPOINTS.CALL.END(callId),
      { duration }
    );

    logger.success('Call Service: Call ended');

    return response.data.data!;
  },

  // Reject call
  rejectCall: async (callId: string): Promise<CallWithDetails> => {
    logger.debug('Call Service: Rejecting call:', callId);

    const response = await axiosClient.post<ApiResponse<CallWithDetails>>(
      API_ENDPOINTS.CALL.REJECT(callId)
    );

    logger.success('Call Service: Call rejected');

    return response.data.data!;
  },

  // Get call history
  getCallHistory: async (): Promise<CallWithDetails[]> => {
    logger.debug('Call Service: Getting call history...');

    const response = await axiosClient.get<ApiResponse<CallWithDetails[]>>(
      API_ENDPOINTS.CALL.HISTORY
    );

    logger.success('Call Service: Call history retrieved:', response.data.data?.length || 0);

    return response.data.data || [];
  },

  // Delete call log
  deleteCallLog: async (callId: string): Promise<void> => {
    logger.debug('Call Service: Deleting call log:', callId);

    await axiosClient.delete(API_ENDPOINTS.CALL.DELETE(callId));

    logger.success('Call Service: Call log deleted');
  },
};