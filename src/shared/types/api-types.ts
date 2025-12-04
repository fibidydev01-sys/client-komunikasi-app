// ================================================
// FILE: src/shared/types/api-types.ts
// API Response Types
// ================================================

// Standard API Response
export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
}

// Success Response
export interface SuccessResponse<T = any> {
  statusCode: number;
  message: string;
  data: T;
}

// Error Response
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  details?: any;
}

// Form Error
export interface FormError {
  field: string;
  message: string;
}

// Validation Error
export interface ValidationError {
  errors: FormError[];
}