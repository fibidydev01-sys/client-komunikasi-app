// ================================================
// FILE: src/lib/query-client.ts
// React Query Configuration
// ================================================

// NOTE: Install @tanstack/react-query first
// pnpm add @tanstack/react-query

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 0,
    },
  },
});