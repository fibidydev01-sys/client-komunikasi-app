// ================================================
// FILE: src/shared/utils/logger.ts
// Development Mode Logger - Auto-hide logs in production
// ================================================

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Debug logs - Only visible in development
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.log('🔍', ...args);
    }
  },

  /**
   * Info logs - Only visible in development
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info('ℹ️', ...args);
    }
  },

  /**
   * Warning logs - Only visible in development
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn('⚠️', ...args);
    }
  },

  /**
   * Error logs - ALWAYS visible (even in production)
   */
  error: (...args: any[]) => {
    console.error('❌', ...args);
  },

  /**
   * Success logs - Only visible in development
   */
  success: (...args: any[]) => {
    if (isDev) {
      console.log('✅', ...args);
    }
  },

  /**
   * API Request logs - Only visible in development
   */
  apiRequest: (method: string, url: string, data?: any) => {
    if (isDev) {
      console.log('📤 API Request:', { method, url, data });
    }
  },

  /**
   * API Response logs - Only visible in development
   */
  apiResponse: (url: string, status: number, data?: any) => {
    if (isDev) {
      console.log('✅ API Response:', { url, status, data });
    }
  },

  /**
   * Socket logs - Only visible in development
   */
  socket: (event: string, data?: any) => {
    if (isDev) {
      console.log('🔌 Socket:', event, data);
    }
  },
};