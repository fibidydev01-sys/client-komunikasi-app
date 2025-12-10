// ================================================
// FILE: src/features/profile/store/profile.store.ts
// Profile Store - Global profile & settings state (CLEANED)
// ================================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { profileService } from '../services/profile.service';
import { toastHelper } from '@/shared/utils/toast-helper';
import { logger } from '@/shared/utils/logger';
import type { User } from '@/shared/types/user-types';
import type {
  UpdateProfileInput,
  ChangePasswordInput,
  UpdatePrivacyInput,
  UserSettings
} from '../types/profile.types';

interface ProfileState {
  // State
  profile: User | null;
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<void>;
  changePassword: (data: ChangePasswordInput) => Promise<void>;
  updatePrivacy: (data: UpdatePrivacyInput) => Promise<void>;
  setProfile: (profile: User) => void;
  setSettings: (settings: UserSettings) => void;

  // Utils
  clearError: () => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        profile: null,
        settings: null,
        isLoading: false,
        error: null,

        // Fetch profile
        fetchProfile: async () => {
          set({ isLoading: true, error: null });
          try {
            logger.debug('Profile Store: Fetching profile...');
            const profile = await profileService.getProfile();

            set({ profile, isLoading: false });

            logger.success('Profile Store: Profile fetched');
          } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Failed to fetch profile';

            logger.error('Profile Store: Fetch profile failed:', error);

            set({
              error: errorMsg,
              isLoading: false
            });

            // Silent error - no toast for background fetch
          }
        },

        // Update profile
        updateProfile: async (data) => {
          set({ isLoading: true, error: null });
          try {
            logger.debug('Profile Store: Updating profile...');
            const profile = await profileService.updateProfile(data);

            toastHelper.success('Profile updated successfully!');

            set({ profile, isLoading: false });

            logger.success('Profile Store: Profile updated');
          } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Failed to update profile';

            logger.error('Profile Store: Update profile failed:', error);
            toastHelper.error(errorMsg);

            set({
              error: errorMsg,
              isLoading: false
            });
            throw error;
          }
        },

        // Change password
        changePassword: async (data) => {
          set({ isLoading: true, error: null });
          try {
            logger.debug('Profile Store: Changing password...');
            await profileService.changePassword(data);

            toastHelper.success('Password changed successfully!');

            set({ isLoading: false });

            logger.success('Profile Store: Password changed');
          } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Failed to change password';

            logger.error('Profile Store: Change password failed:', error);
            toastHelper.error(errorMsg);

            set({
              error: errorMsg,
              isLoading: false
            });
            throw error;
          }
        },

        // Update privacy
        updatePrivacy: async (data) => {
          set({ isLoading: true, error: null });
          try {
            logger.debug('Profile Store: Updating privacy settings...');
            const settings = await profileService.updatePrivacy(data);

            toastHelper.success('Privacy settings updated!');

            set({ settings, isLoading: false });

            logger.success('Profile Store: Privacy updated');
          } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Failed to update privacy';

            logger.error('Profile Store: Update privacy failed:', error);
            toastHelper.error(errorMsg);

            set({
              error: errorMsg,
              isLoading: false
            });
            throw error;
          }
        },

        // Set profile
        setProfile: (profile) => {
          logger.debug('Profile Store: Setting profile manually');
          set({ profile });
        },

        // Set settings
        setSettings: (settings) => {
          logger.debug('Profile Store: Setting settings manually');
          set({ settings });
        },

        // Clear error
        clearError: () => {
          set({ error: null });
        },

        // Reset store
        reset: () => {
          logger.debug('Profile Store: Reset');
          set({
            profile: null,
            settings: null,
            isLoading: false,
            error: null,
          });
        },
      }),
      {
        name: 'profile-storage',
        partialize: (state) => ({
          profile: state.profile,
          settings: state.settings
        }),
      }
    ),
    { name: 'ProfileStore' }
  )
);