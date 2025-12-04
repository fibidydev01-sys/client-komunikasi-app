// src/lib/socket-client.ts

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false; // ✅ ADD: Track connection state

  // Connect to socket server
  connect(token?: string): Socket {
    // ✅ FIX: Prevent multiple connections
    if (this.socket?.connected) {
      console.log('✅ Socket already connected:', this.socket.id);
      return this.socket;
    }

    if (this.isConnecting) {
      console.log('⏳ Socket connection in progress...');
      return this.socket!;
    }

    const authToken = token || this.getTokenFromStorage();

    if (!authToken) {
      console.warn('⚠️ No auth token found');
      throw new Error('Authentication token required');
    }

    this.isConnecting = true; // ✅ Mark as connecting
    console.log('🔌 Connecting to socket server...');

    this.socket = io(SOCKET_URL, {
      auth: { token: authToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();

    return this.socket;
  }

  // Setup event handlers
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnecting = false; // ✅ Reset flag
      console.log('✅ Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnecting = false; // ✅ Reset flag
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      this.isConnecting = false; // ✅ Reset flag
      this.reconnectAttempts++;
      console.error(
        `❌ Connection error (attempt ${this.reconnectAttempts}):`,
        error.message
      );
    });
  }

  // Disconnect from socket
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
      this.isConnecting = false; // ✅ Reset flag
    }
  }

  // ✅ ADD: Check if currently connecting
  isCurrentlyConnecting(): boolean {
    return this.isConnecting;
  }

  // Rest of the code stays the same...
  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      console.error('❌ Socket not connected');
      return;
    }
    this.socket.emit(event, data);
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  private getTokenFromStorage(): string | null {
    return localStorage.getItem('access_token');
  }
}

export const socketClient = new SocketClient();