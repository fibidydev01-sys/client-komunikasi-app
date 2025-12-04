// ================================================
// FILE: src/shared/types/common-types.ts
// Common Shared Types
// ================================================

// Base Entity
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter & Sort
export interface FilterParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Upload Progress
export interface UploadProgress {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}