// ================================================
// FILE: src/features/profile/services/profile.service.ts
// Profile Service - Handle all profile API calls (CLEANED)
// ================================================

import { axiosClient } from '@/lib/axios-client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { logger } from '@/shared/utils/logger';
import type { ApiResponse } from '@/shared/types/api-types';
import type { User } from '@/shared/types/user-types';
import type {
  UpdateProfileInput,
  ChangePasswordInput,
  UpdatePrivacyInput,
  UserSettings
} from '../types/profile.types';

export const profileService = {
  // Get profile
  getProfile: async (): Promise<User> => {
    logger.debug('Profile Service: Getting profile...');

    const response = await axiosClient.get<ApiResponse<User>>(
      API_ENDPOINTS.PROFILE.GET
    );

    logger.success('Profile Service: Profile retrieved');

    return response.data.data!;
  },

  // Update profile
  updateProfile: async (data: UpdateProfileInput): Promise<User> => {
    logger.debug('Profile Service: Updating profile...');

    const response = await axiosClient.patch<ApiResponse<User>>(
      API_ENDPOINTS.PROFILE.UPDATE,
      data
    );

    logger.success('Profile Service: Profile updated');

    return response.data.data!;
  },

  // Change password
  changePassword: async (data: ChangePasswordInput): Promise<void> => {
    logger.debug('Profile Service: Changing password...');

    await axiosClient.post(API_ENDPOINTS.PROFILE.CHANGE_PASSWORD, data);

    logger.success('Profile Service: Password changed');
  },

  // Update privacy settings
  updatePrivacy: async (data: UpdatePrivacyInput): Promise<UserSettings> => {
    logger.debug('Profile Service: Updating privacy settings...');

    const response = await axiosClient.patch<ApiResponse<UserSettings>>(
      API_ENDPOINTS.PROFILE.PRIVACY,
      data
    );

    logger.success('Profile Service: Privacy settings updated');

    return response.data.data!;
  },
};