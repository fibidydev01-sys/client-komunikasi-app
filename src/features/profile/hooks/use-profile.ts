// ================================================
// FILE: src/features/profile/hooks/use-profile.ts
// useProfile Hook - Handle profile & settings logic (CLEANED)
// ================================================

import { useEffect } from 'react';
import { useProfileStore } from '../store/profile.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { logger } from '@/shared/utils/logger';
import type {
  UpdateProfileInput,
  ChangePasswordInput,
  UpdatePrivacyInput
} from '../types/profile.types';

export const useProfile = () => {
  const { setUser } = useAuthStore();
  const {
    profile,
    settings,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    changePassword,
    updatePrivacy,
    clearError,
  } = useProfileStore();

  // Fetch profile on mount
  useEffect(() => {
    logger.debug('useProfile: Fetching profile on mount');
    fetchProfile();
  }, [fetchProfile]);

  // Update profile
  const handleUpdateProfile = async (data: UpdateProfileInput) => {
    try {
      logger.debug('useProfile: Updating profile...');
      await updateProfile(data);

      // Sync with auth store
      if (profile) {
        setUser({ ...profile, ...data });
      }

      logger.success('useProfile: Profile updated successfully');
    } catch (error) {
      logger.error('useProfile: Failed to update profile:', error);
      throw error;
    }
  };

  // Change password
  const handleChangePassword = async (data: ChangePasswordInput) => {
    try {
      logger.debug('useProfile: Changing password...');
      await changePassword(data);
      logger.success('useProfile: Password changed successfully');
    } catch (error) {
      logger.error('useProfile: Failed to change password:', error);
      throw error;
    }
  };

  // Update privacy
  const handleUpdatePrivacy = async (data: UpdatePrivacyInput) => {
    try {
      logger.debug('useProfile: Updating privacy settings...');
      await updatePrivacy(data);
      logger.success('useProfile: Privacy settings updated successfully');
    } catch (error) {
      logger.error('useProfile: Failed to update privacy:', error);
      throw error;
    }
  };

  return {
    profile,
    settings,
    isLoading,
    error,
    updateProfile: handleUpdateProfile,
    changePassword: handleChangePassword,
    updatePrivacy: handleUpdatePrivacy,
    clearError,
  };
};