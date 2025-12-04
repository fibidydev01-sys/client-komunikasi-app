// ================================================
// FILE 2: src/features/auth/store/auth.store.ts
// FIX: Add delay AFTER token save to ensure it's readable
// ================================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService } from '../services/auth.service';
import { resetChatFetch } from '@/features/chat/hooks/use-chat';
import { resetContactsFetch } from '@/features/contacts/hooks/use-contacts';
import { resetStatusFetch } from '@/features/status/hooks/use-status';
import { resetCallFetch } from '@/features/call/hooks/use-call';
import { toastHelper } from '@/shared/utils/toast-helper';
import { logger } from '@/shared/utils/logger';
import type { User } from '@/shared/types/user-types';
import type { LoginInput, RegisterInput } from '../types/auth.types';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

// ✅ ADD: Helper to wait for localStorage sync
const waitForLocalStorage = (key: string, maxAttempts = 5): Promise<string | null> => {
  return new Promise((resolve) => {
    let attempts = 0;

    const check = () => {
      const value = localStorage.getItem(key);

      if (value || attempts >= maxAttempts) {
        resolve(value);
        return;
      }

      attempts++;
      setTimeout(check, 10); // Check every 10ms
    };

    check();
  });
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Login
        login: async (data) => {
          set({ isLoading: true, error: null });

          const loadingToast = toastHelper.loading('Signing in...');

          try {
            logger.debug('Auth Store: Starting login...');
            const response = await authService.login(data);

            // ✅ CRITICAL FIX: Wait for token to be readable
            const token = await waitForLocalStorage('access_token');

            if (!token) {
              throw new Error('Token not saved properly');
            }

            logger.debug('Auth Store: Token verified after save:', token.substring(0, 20));

            toastHelper.dismiss(loadingToast);
            toastHelper.success('Signed in successfully!');

            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false
            });

            logger.success('Auth Store: Login successful');
          } catch (error: any) {
            toastHelper.dismiss(loadingToast);

            const errorMsg = error.response?.data?.message || error.message || 'Login failed';
            toastHelper.error(errorMsg);

            logger.error('Auth Store: Login failed:', error);

            set({
              error: errorMsg,
              isLoading: false
            });
            throw error;
          }
        },

        // Register
        register: async (data) => {
          set({ isLoading: true, error: null });

          const loadingToast = toastHelper.loading('Creating your account...');

          try {
            logger.debug('Auth Store: Starting registration...');
            const response = await authService.register(data);

            // ✅ CRITICAL FIX: Wait for token to be readable
            const token = await waitForLocalStorage('access_token');

            if (!token) {
              throw new Error('Token not saved properly');
            }

            logger.debug('Auth Store: Token verified after save:', token.substring(0, 20));

            toastHelper.dismiss(loadingToast);
            toastHelper.success('Account created successfully!');

            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false
            });

            logger.success('Auth Store: Registration successful');
          } catch (error: any) {
            toastHelper.dismiss(loadingToast);

            const errorMsg = error.response?.data?.message || error.message || 'Registration failed';
            toastHelper.error(errorMsg);

            logger.error('Auth Store: Registration failed:', error);

            set({
              error: errorMsg,
              isLoading: false
            });
            throw error;
          }
        },

        // Logout
        logout: async () => {
          set({ isLoading: true });

          try {
            logger.debug('Auth Store: Logging out...');
            await authService.logout();

            // ✅ Reset all fetch flags (INCLUDING CALL)
            resetChatFetch();
            resetContactsFetch();
            resetStatusFetch();
            resetCallFetch();

            toastHelper.success('Signed out successfully');

            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            });

            logger.success('Auth Store: Logout successful');
          } catch (error) {
            logger.warn('Auth Store: Logout API failed, clearing state anyway');

            // ✅ Reset all fetch flags even on error
            resetChatFetch();
            resetContactsFetch();
            resetStatusFetch();
            resetCallFetch();

            // Force logout even if API fails
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            });
          }
        },

        // Check authentication status
        checkAuth: async () => {
          if (!authService.isAuthenticated()) {
            logger.debug('Auth Store: No token found');
            set({ user: null, isAuthenticated: false });
            return;
          }

          set({ isLoading: true });
          try {
            logger.debug('Auth Store: Checking auth status...');
            const user = await authService.getAuthStatus();

            set({
              user,
              isAuthenticated: true,
              isLoading: false
            });

            logger.success('Auth Store: Auth check successful');
          } catch (error) {
            logger.error('Auth Store: Auth check failed:', error);
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
          }
        },

        // Set user manually
        setUser: (user) => {
          logger.debug('Auth Store: Setting user manually:', user?.name);
          set({ user, isAuthenticated: !!user });
        },

        // Clear error
        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);
