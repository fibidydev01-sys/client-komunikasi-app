// ================================================
// FILE: src/shared/constants/route-paths.ts
// Frontend Route Paths (WITH ACTIVE_CALL)
// ================================================

export const ROUTE_PATHS = {
  // Public Routes
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',

  // Protected Routes
  CHATS: '/chats',
  CHAT_DETAIL: '/chats/:chatId',

  STATUS: '/status',

  CALLS: '/calls',
  CALL_HISTORY: '/calls/history',
  ACTIVE_CALL: '/calls/active', // ✅ ADD

  CONTACTS: '/contacts',

  MEDIA: '/media',

  PROFILE: '/profile',

  FRIEND_REQUESTS: '/friend-requests',

  // Settings
  SETTINGS: '/settings',
  SETTINGS_PRIVACY: '/settings/privacy',
  SETTINGS_NOTIFICATIONS: '/settings/notifications',
  SETTINGS_SESSIONS: '/settings/sessions',
} as const;

// Helper to build dynamic routes
export const buildRoute = {
  chatDetail: (chatId: string) => `/chats/${chatId}`,
  userProfile: (userId: string) => `/profile/${userId}`,
} as const;