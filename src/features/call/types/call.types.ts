// ================================================
// FILE: src/features/call/types/call.types.ts
// Call Types - Call related types
// ================================================

import type { User } from '@/shared/types/user-types';

// Call Type
export enum CallType {
  VOICE = 'VOICE',
  VIDEO = 'VIDEO',
}

// Call Status
export enum CallStatus {
  INITIATED = 'INITIATED',
  RINGING = 'RINGING',
  ANSWERED = 'ANSWERED',
  ENDED = 'ENDED',
  MISSED = 'MISSED',
  REJECTED = 'REJECTED',
  BUSY = 'BUSY',
}

// Base Call
export interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  type: CallType | 'VOICE' | 'VIDEO';
  status: CallStatus | string;
  duration: number;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Call with user details
export interface CallWithDetails extends Call {
  caller: {
    id: string;
    name: string;
    username: string | null;
    avatar: string | null;
    profilePhoto: string | null;
  };
  receiver: {
    id: string;
    name: string;
    username: string | null;
    avatar: string | null;
    profilePhoto: string | null;
  };
}

// Initiate Call Input
export interface InitiateCallInput {
  receiverId: string;
  type: CallType | 'VOICE' | 'VIDEO';
}

// WebRTC Signal
export interface WebRTCSignal {
  callId: string;
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
  to: string;
}