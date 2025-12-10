// ================================================
// FILE: src/shared/types/socket-types.ts
// Socket Event Types
// ================================================

export interface SocketConnectPayload {
  userId: string;
  socketId: string;
}

export interface SocketDisconnectPayload {
  userId: string;
  reason: string;
}

export interface TypingPayload {
  userId: string;
  chatId: string;
  username: string;
}