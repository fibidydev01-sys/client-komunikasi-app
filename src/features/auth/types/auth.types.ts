// ================================================
// FILE: src/features/auth/types/auth.types.ts
// Auth Types - Authentication related types
// ================================================

import type { User } from '@/shared/types/user-types';

// Login Input
export interface LoginInput {
  email: string;
  password: string;
}

// Register Input
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  username?: string;
  avatar?: string;
}

// Auth Response
export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
}

// Auth State
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}