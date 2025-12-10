// ================================================
// FILE: src/hooks/index.ts
// Central export for all custom hooks
// ================================================

// Auth
export { useAuth } from '@/features/auth/hooks/use-auth';

// Chat
export { useChat } from '@/features/chat/hooks/use-chat';
export { useChatSocket } from '@/features/chat/hooks/use-chat-socket';

// Call
export { useCall } from '@/features/call/hooks/use-call';
export { useWebRTC } from '@/features/call/hooks/use-webrtc';

// Contacts
export { useContacts } from '@/features/contacts/hooks/use-contacts';

// Status
export { useStatus } from '@/features/status/hooks/use-status';

// Media
export { useMedia } from '@/features/media/hooks/use-media';

// Profile
export { useProfile } from '@/features/profile/hooks/use-profile';