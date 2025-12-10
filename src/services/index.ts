
// ================================================
// FILE: src/services/index.ts
// Central export for all services
// ================================================

// Auth
export { authService } from '@/features/auth/services/auth.service';

// Chat & Message
export { chatService } from '@/features/chat/services/chat.service';
export { messageService } from '@/features/chat/services/message.service';

// Call
export { callService } from '@/features/call/services/call.service';

// Contact & Friend Request
export { contactService } from '@/features/contacts/services/contact.service';
export { friendRequestService } from '@/features/contacts/services/friend-request.service';

// Status
export { statusService } from '@/features/status/services/status.service';

// Media
export { mediaService } from '@/features/media/services/media.service';

// Profile
export { profileService } from '@/features/profile/services/profile.service';

// User
export { userService } from '@/features/user/services/user.service';