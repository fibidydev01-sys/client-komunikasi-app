// ================================================
// FILE: src/features/user/services/user.service.ts
// User Service - Handle all user-related API calls (FIXED)
// ================================================

import { axiosClient } from '@/lib/axios-client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import type { User } from '@/shared/types/user-types';

export const userService = {
  // Get all users (for search/discovery)
  getAllUsers: async (): Promise<User[]> => {
    try {
      console.log('🔍 Fetching all users from:', API_ENDPOINTS.USER.ALL);

      const response = await axiosClient.get(API_ENDPOINTS.USER.ALL);

      console.log('📦 Raw response:', response.data);

      // ✅ FIXED: Handle both response formats
      // Backend format 1: { data: [...] }
      // Backend format 2: { users: [...] }
      const users = response.data.data || response.data.users || [];

      console.log('✅ Parsed users:', users.length);

      // Ensure it's an array
      if (!Array.isArray(users)) {
        console.error('❌ Response is not an array:', users);
        return [];
      }

      return users;
    } catch (error: any) {
      console.error('❌ Failed to fetch users:', error);
      console.error('Response:', error.response?.data);
      return [];
    }
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<User> => {
    try {
      console.log('🔍 Fetching user by ID:', userId);

      const response = await axiosClient.get(API_ENDPOINTS.USER.BY_ID(userId));

      console.log('📦 Response:', response.data);

      // ✅ FIXED: Handle both response formats
      const user = response.data.data || response.data.user;

      if (!user) {
        throw new Error('User not found in response');
      }

      return user;
    } catch (error: any) {
      console.error('❌ Failed to fetch user:', error);
      throw error;
    }
  },

  // Search user by username or email
  searchUser: async (query: string): Promise<User> => {
    try {
      console.log('🔍 Searching user:', query);

      const response = await axiosClient.get(API_ENDPOINTS.USER.SEARCH(query));

      console.log('📦 Response:', response.data);

      // ✅ FIXED: Handle both response formats
      const user = response.data.data || response.data.user;

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error: any) {
      console.error('❌ Failed to search user:', error);
      throw error;
    }
  },
};