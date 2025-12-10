// ================================================
// FILE 1: src/features/auth/services/auth.service.ts
// FIX: Ensure token is written BEFORE returning
// ================================================

import { axiosClient } from '@/lib/axios-client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { logger } from '@/shared/utils/logger';
import type { ApiResponse } from '@/shared/types/api-types';
import type { User } from '@/shared/types/user-types';
import type {
  LoginInput,
  RegisterInput,
  AuthResponse
} from '../types/auth.types';

export const authService = {
  // Register new user
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    logger.debug('Auth Service: Registering user...');
    const response = await axiosClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data
    );

    logger.debug('Auth Service: Register response received');

    // ✅ FIX: Save token SYNCHRONOUSLY and VERIFY
    if (response.data.accessToken) {
      localStorage.setItem('access_token', response.data.accessToken);

      // ✅ CRITICAL: Force sync and verify
      const verified = localStorage.getItem('access_token');
      if (!verified) {
        throw new Error('Failed to save token to localStorage');
      }

      logger.debug('Auth Service: Token saved and verified');
    }

    return response.data;
  },

  // Login user
  login: async (data: LoginInput): Promise<AuthResponse> => {
    logger.debug('Auth Service: Logging in user...');
    const response = await axiosClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      data
    );

    logger.debug('Auth Service: Login response received');

    // ✅ FIX: Save token SYNCHRONOUSLY and VERIFY
    if (response.data.accessToken) {
      localStorage.setItem('access_token', response.data.accessToken);

      // ✅ CRITICAL: Force sync and verify
      const verified = localStorage.getItem('access_token');
      if (!verified) {
        throw new Error('Failed to save token to localStorage');
      }

      logger.debug('Auth Service: Token saved and verified:', verified.substring(0, 20));
    }

    return response.data;
  },

  // Logout user
  logout: async (): Promise<void> => {
    logger.debug('Auth Service: Logging out...');
    try {
      await axiosClient.post(API_ENDPOINTS.AUTH.LOGOUT);
      logger.success('Auth Service: Logout API success');
    } catch (error) {
      logger.warn('Auth Service: Logout API failed:', error);
    } finally {
      // Always clear token, even if API fails
      localStorage.removeItem('access_token');
      logger.debug('Auth Service: Token removed from localStorage');
    }
  },

  // Get auth status (verify token)
  getAuthStatus: async (): Promise<User> => {
    logger.debug('Auth Service: Checking auth status...');
    const response = await axiosClient.get<any>(
      API_ENDPOINTS.AUTH.STATUS
    );

    logger.success('Auth Service: Auth status verified');

    // Backend returns { message, user } directly
    return response.data.user;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const hasToken = !!localStorage.getItem('access_token');
    logger.debug('Auth Service: Is authenticated?', hasToken);
    return hasToken;
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem('access_token');
  },
};