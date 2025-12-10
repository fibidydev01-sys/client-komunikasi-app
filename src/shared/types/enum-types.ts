// ================================================
// FILE: src/shared/types/enum-types.ts
// Common Enums
// ================================================

export enum RequestStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

export enum PrivacyLevel {
  PUBLIC = 'PUBLIC',
  FRIENDS = 'FRIENDS',
  PRIVATE = 'PRIVATE',
}

export enum NotificationType {
  MESSAGE = 'MESSAGE',
  CALL = 'CALL',
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  MENTION = 'MENTION',
  SYSTEM = 'SYSTEM',
}