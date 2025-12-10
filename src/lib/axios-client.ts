// ================================================
// FILE: src/lib/axios-client.ts
// HTTP Client Configuration with Interceptors
// ================================================

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api';

// Create axios instance
export const axiosClient = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  timeout: 30000,
  withCredentials: true, // Send cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 🔥 CRITICAL FIX: Get token FRESH every time from localStorage
    // Don't cache it, always read from storage at request time
    const token = localStorage.getItem('access_token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('📤 API Request (with token):', {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasToken: true,
        tokenPreview: token.substring(0, 20) + '...',
      });
    } else {
      console.log('📤 API Request (no token):', {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasToken: false,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error: AxiosError) => {
    console.error('❌ Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      console.warn('⚠️ 401 Unauthorized - Clearing token and redirecting...');

      // Clear token
      localStorage.removeItem('access_token');

      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);