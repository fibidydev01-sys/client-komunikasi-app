// ================================================
// FILE: src/lib/socket-client.ts
// FIXED: Better connection state management to prevent duplicates
// ================================================

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private connectionPromise: Promise<Socket> | null = null;

  // Connect to socket server
  connect(token?: string): Socket {
    // ✅ IMPROVED: Return existing connected socket
    if (this.socket?.connected) {
      console.log('✅ Socket already connected:', this.socket.id);
      return this.socket;
    }

    // ✅ IMPROVED: Wait for existing connection attempt
    if (this.isConnecting && this.socket) {
      console.log('⏳ Socket connection in progress, returning existing socket...');
      return this.socket;
    }

    const authToken = token || this.getTokenFromStorage();

    if (!authToken) {
      console.warn('⚠️ No auth token found');
      throw new Error('Authentication token required');
    }

    this.isConnecting = true;
    console.log('🔌 Connecting to socket server...');

    // ✅ IMPROVED: Disconnect existing socket before creating new one
    if (this.socket) {
      console.log('🔌 Cleaning up existing socket before reconnect...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token: authToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      // ✅ ADD: Prevent multiple connections
      forceNew: false,
      multiplex: true,
    });

    this.setupEventHandlers();

    return this.socket;
  }

  // Setup event handlers
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnecting = false;
      console.log('✅ Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnecting = false;
      console.log('❌ Socket disconnected:', reason);

      // ✅ ADD: Clean reconnection logic
      if (reason === 'io server disconnect') {
        // Server disconnected us, don't auto-reconnect
        console.log('🔌 Server disconnected, not auto-reconnecting');
      }
    });

    this.socket.on('connect_error', (error) => {
      this.isConnecting = false;
      this.reconnectAttempts++;
      console.error(
        `❌ Connection error (attempt ${this.reconnectAttempts}):`,
        error.message
      );

      // ✅ ADD: Stop trying after max attempts
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
        this.socket?.disconnect();
      }
    });

    // ✅ ADD: Handle reconnection
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('✅ Socket reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after max attempts');
      this.isConnecting = false;
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
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  // Check if currently connecting
  isCurrentlyConnecting(): boolean {
    return this.isConnecting;
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Emit event with connection check
  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      console.error('❌ Socket not connected, cannot emit:', event);
      return;
    }
    this.socket.emit(event, data);
  }

  // Listen to event
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  // Remove listener
  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  // ✅ ADD: Remove all listeners for an event
  removeAllListeners(event?: string): void {
    if (event) {
      this.socket?.removeAllListeners(event);
    } else {
      this.socket?.removeAllListeners();
    }
  }

  // Get token from storage
  private getTokenFromStorage(): string | null {
    return localStorage.getItem('access_token');
  }

  // ✅ ADD: Force reconnect
  forceReconnect(token?: string): Socket {
    console.log('🔌 Force reconnecting...');
    this.disconnect();
    return this.connect(token);
  }
}

export const socketClient = new SocketClient();