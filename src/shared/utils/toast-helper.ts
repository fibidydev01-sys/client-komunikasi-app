// ================================================
// FILE: src/shared/utils/toast-helper.ts
// Toast Helper with Rate Limiting
// ================================================

import { toast } from 'sonner';

// Rate limiting: Prevent toast spam
const toastQueue = new Map<string, number>();
const DEFAULT_THROTTLE_DELAY = 2000; // 2 seconds

/**
 * Check if toast should be throttled
 */
function shouldThrottle(key: string, delay: number = DEFAULT_THROTTLE_DELAY): boolean {
  const lastShown = toastQueue.get(key);
  const now = Date.now();

  if (lastShown && now - lastShown < delay) {
    return true; // Throttle this toast
  }

  toastQueue.set(key, now);
  return false;
}

export const toastHelper = {
  /**
   * Success toast
   */
  success: (message: string, key?: string) => {
    if (key && shouldThrottle(key)) return;

    toast.success(message, {
      duration: 3000,
    });
  },

  /**
   * Error toast
   */
  error: (message: string, key?: string) => {
    if (key && shouldThrottle(key)) return;

    toast.error(message, {
      duration: 4000,
    });
  },

  /**
   * Info toast
   */
  info: (message: string, key?: string) => {
    if (key && shouldThrottle(key)) return;

    toast.info(message, {
      duration: 3000,
    });
  },

  /**
   * Warning toast
   */
  warning: (message: string, key?: string) => {
    if (key && shouldThrottle(key)) return;

    toast.warning(message, {
      duration: 3000,
    });
  },

  /**
   * Loading toast - Returns toast ID for dismissal
   */
  loading: (message: string) => {
    return toast.loading(message);
  },

  /**
   * Dismiss specific toast
   */
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },

  /**
   * Promise toast - Auto handles loading/success/error
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },
};