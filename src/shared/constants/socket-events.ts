// ================================================
// FILE: src/shared/constants/socket-events.ts
// Socket.IO Event Names (UPDATED WITH WEBRTC)
// ================================================

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // User Status
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',

  // Message
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVE: 'message:receive',
  MESSAGE_READ: 'message:read',
  MESSAGE_EDITED: 'message:edited',
  MESSAGE_DELETED: 'message:deleted',

  // Typing
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // Call
  CALL_INCOMING: 'call:incoming',
  CALL_ANSWERED: 'call:answered',
  CALL_REJECTED: 'call:rejected',
  CALL_ENDED: 'call:ended',

  // WebRTC Signaling
  WEBRTC_OFFER: 'webrtc:offer',
  WEBRTC_ANSWER: 'webrtc:answer',
  WEBRTC_ICE: 'webrtc:ice',

  // Status
  STATUS_NEW: 'status:new',
  STATUS_VIEWED: 'status:viewed',
  STATUS_EXPIRED: 'status:expired',

  // Friend Request
  FRIEND_REQUEST_RECEIVED: 'friend-request:received',
  FRIEND_REQUEST_ACCEPTED: 'friend-request:accepted',
  FRIEND_REQUEST_REJECTED: 'friend-request:rejected',
} as const;