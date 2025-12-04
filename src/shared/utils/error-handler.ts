// ================================================
// FILE: src/shared/utils/error-handler.ts
// Centralized Error Handler with Toast
// ================================================

import { toastHelper } from './toast-helper';
import { AxiosError } from 'axios';

/**
 * Handle API errors with appropriate toast messages
 */
export function handleApiError(error: any, fallbackMessage = 'Something went wrong') {
  // Check if it's an Axios error
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.message;

    switch (status) {
      case 400:
        toastHelper.error(message || 'Bad request');
        break;

      case 401:
        toastHelper.error('Session expired. Please login again');
        // Optionally redirect to login
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
        break;

      case 403:
        toastHelper.error('You don\'t have permission to do this');
        break;

      case 404:
        toastHelper.error('Resource not found');
        break;

      case 409:
        toastHelper.error(message || 'Conflict: Resource already exists');
        break;

      case 422:
        toastHelper.error(message || 'Validation failed');
        break;

      case 429:
        toastHelper.error('Too many requests. Please try again later');
        break;

      case 500:
      case 502:
      case 503:
        toastHelper.error('Server error. Please try again later');
        break;

      default:
        toastHelper.error(message || fallbackMessage);
    }
  } else if (error.request) {
    // Network error
    toastHelper.error('Network error. Please check your connection');
  } else {
    // Other errors
    toastHelper.error(error.message || fallbackMessage);
  }
}

/**
 * Extract error message from various error formats
 */
export function getErrorMessage(error: any, fallback = 'An error occurred'): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
}