// ================================================
// FILE: src/shared/constants/api-endpoints.ts
// API Endpoint Definitions
// ================================================

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    STATUS: '/auth/status',
    REFRESH: '/auth/refresh',
  },

  // User
  USER: {
    ALL: '/user/all',
    BY_ID: (id: string) => `/user/${id}`,
    SEARCH: (query: string) => `/user/search/${query}`,
  },

  // Chat
  CHAT: {
    LIST: '/chats',
    CREATE: '/chats',
    BY_ID: (id: string) => `/chats/${id}`,
    DELETE: (id: string) => `/chats/${id}`,
  },

  // Message
  MESSAGE: {
    SEND: '/messages',
    BY_CHAT: (chatId: string) => `/messages/chat/${chatId}`,
    DELETE: (id: string) => `/messages/${id}`,
    EDIT: (id: string) => `/messages/${id}`,
    MARK_READ: (id: string) => `/messages/${id}/read`,
    STAR: (id: string) => `/messages/${id}/star`,
    FORWARD: (id: string) => `/messages/${id}/forward`,
    SEARCH: (chatId: string) => `/messages/search/${chatId}`,
  },

  // Call
  CALL: {
    INITIATE: '/calls/initiate',
    ANSWER: (id: string) => `/calls/${id}/answer`,
    END: (id: string) => `/calls/${id}/end`,
    REJECT: (id: string) => `/calls/${id}/reject`,
    HISTORY: '/calls/history',
    DELETE: (id: string) => `/calls/${id}`,
  },

  // Status
  STATUS: {
    CREATE: '/status',
    LIST: '/status',
    MY: '/status/my',
    BY_ID: (id: string) => `/status/${id}`,
    VIEW: (id: string) => `/status/${id}/view`,
    VIEWS: (id: string) => `/status/${id}/views`,
    PRIVACY: (id: string) => `/status/${id}/privacy`,
    DELETE: (id: string) => `/status/${id}`,
  },

  // Media
  MEDIA: {
    UPLOAD: '/media/upload',
    BY_ID: (id: string) => `/media/${id}`,
    USER_ALL: '/media/user/all',
    DELETE: (id: string) => `/media/${id}`,
  },

  // Contact
  CONTACT: {
    LIST: '/contacts',
    BLOCKED: '/contacts/blocked',
    BLOCK: '/contacts/block',
    UNBLOCK: '/contacts/unblock',
    REMOVE: (id: string) => `/contacts/${id}`,
    NICKNAME: '/contacts/nickname',
  },

  // Friend Request
  FRIEND_REQUEST: {
    SEND: '/friend-requests/send',
    PENDING: '/friend-requests/pending',
    SENT: '/friend-requests/sent',
    ACCEPT: (id: string) => `/friend-requests/${id}/accept`,
    REJECT: (id: string) => `/friend-requests/${id}/reject`,
    CANCEL: (id: string) => `/friend-requests/${id}/cancel`,
    STATUS: (userId: string) => `/friend-requests/status/${userId}`,
  },

  // Profile
  PROFILE: {
    GET: '/profile',
    UPDATE: '/profile',
    CHANGE_PASSWORD: '/profile/change-password',
    PRIVACY: '/profile/privacy',
  },

  // Settings
  SETTINGS: {
    GET: '/settings',
    NOTIFICATIONS: '/settings/notifications',
    SESSIONS: '/settings/sessions',
    REVOKE_SESSION: (id: string) => `/settings/sessions/${id}`,
  },
} as const;