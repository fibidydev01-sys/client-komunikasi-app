// ================================================
// FILE 3: src/features/auth/hooks/use-auth.ts
// FIX: Add proper delay before navigation
// ================================================

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { ROUTE_PATHS } from '@/shared/constants/route-paths';
import { logger } from '@/shared/utils/logger';
import type { LoginInput, RegisterInput } from '../types/auth.types';

export const useAuth = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    checkAuth,
    clearError,
  } = useAuthStore();

  // Login handler
  const handleLogin = async (data: LoginInput) => {
    try {
      await login(data);

      // ✅ CRITICAL FIX: Wait longer to ensure token is readable
      await new Promise(resolve => setTimeout(resolve, 200));

      // ✅ VERIFY token exists before navigation
      const token = localStorage.getItem('access_token');
      if (!token) {
        logger.error('useAuth: Token not found after login!');
        throw new Error('Authentication failed - token not saved');
      }

      logger.debug('useAuth: Token verified before navigation:', token.substring(0, 20));

      navigate(ROUTE_PATHS.CHATS, { replace: true });
      logger.success('Login successful, navigated to chats');
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  };

  // Register handler
  const handleRegister = async (data: RegisterInput) => {
    try {
      await register(data);

      // ✅ CRITICAL FIX: Wait longer to ensure token is readable
      await new Promise(resolve => setTimeout(resolve, 200));

      // ✅ VERIFY token exists before navigation
      const token = localStorage.getItem('access_token');
      if (!token) {
        logger.error('useAuth: Token not found after register!');
        throw new Error('Authentication failed - token not saved');
      }

      logger.debug('useAuth: Token verified before navigation:', token.substring(0, 20));

      navigate(ROUTE_PATHS.CHATS, { replace: true });
      logger.success('Registration successful, navigated to chats');
    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTE_PATHS.LOGIN, { replace: true });
      logger.success('Logout successful, redirecting to login...');
    } catch (error) {
      logger.error('Logout failed:', error);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError,
  };
};