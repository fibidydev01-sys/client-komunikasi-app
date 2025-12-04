// ================================================
// FILE: src/types/index.ts
// Central export for all types
// ================================================

// Auth Types
export type {
  LoginInput,
  RegisterInput,
  AuthResponse,
  AuthState,
} from '@/features/auth/types/auth.types';

// Chat Types
export type {
  Chat,
  ChatWithDetails,
  Message,
  MessageWithDetails,
  MessageType,
  CreateChatInput,
  CreateMessageInput,
  TypingIndicator,
} from '@/features/chat/types/chat.types';

// Call Types
export type {
  Call,
  CallWithDetails,
  InitiateCallInput,
  WebRTCSignal,
} from '@/features/call/types/call.types';

export { CallType, CallStatus } from '@/features/call/types/call.types';

// Contact Types
export type {
  Contact,
  ContactWithDetails,
  FriendRequest,
  FriendRequestWithDetails,
  SendRequestInput,
  BlockContactInput,
  UpdateNicknameInput,
  FriendStatus,
} from '@/features/contacts/types/contact.types';

export { RequestStatus } from '@/features/contacts/types/contact.types';

// Status Types
export type {
  Status,
  StatusWithDetails,
  StatusPrivacy,
  StatusView,
  CreateStatusInput,
  UpdateStatusPrivacyInput,
} from '@/features/status/types/status.types';

export { StatusType, StatusPrivacyType } from '@/features/status/types/status.types';

// Media Types
export type {
  UploadMediaInput,
  CloudinaryUploadResult,
  UploadProgress,
} from '@/features/media/types/media.types';

// Profile Types
export type {
  UpdateProfileInput,
  ChangePasswordInput,
  UpdatePrivacyInput,
  UserSettings,
  Session,
} from '@/features/profile/types/profile.types';

export {
  LastSeenPrivacy,
  ProfilePhotoPrivacy,
  AboutPrivacy,
} from '@/features/profile/types/profile.types';

// Re-export shared types
export type {
  User,
  UserPreview,
  Gender,
} from '@/shared/types/user-types';

export type {
  ApiResponse,
  SuccessResponse,
  ErrorResponse,
  FormError,
  ValidationError,
} from '@/shared/types/api-types';

export type {
  MediaItem,
  MediaType,
} from '@/shared/types/media-types';

export type {
  BaseEntity,
  PaginationParams,
  PaginatedResponse,
} from '@/shared/types/common-types';