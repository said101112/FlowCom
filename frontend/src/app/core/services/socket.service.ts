import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../../environments/environment';

export interface SocketMessage {
  senderId: string;
  receverId: string;
  text: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket?: Socket;

  connect(userId: string): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.socketUrl || '/', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.debug('[socket] connecté', this.socket?.id, 'user', userId);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('[socket] erreur de connexion', error.message);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.warn('[socket] déconnecté :', reason);
    });
  }

  joinRoom(room: string): void {
    this.emit('joinRoom', room);
  }

  sendMessage(room: string, message: SocketMessage): void {
    this.emit('sendMessage', { Room: room, message });
  }

  /**
   * Ajout d'ami par code ConnectCode. L'identité est déduite du JWT côté
   * serveur : inutile de transmettre l'userId.
   */
  addFriendByCode(connectCode: string): void {
    this.emit('AddFriend', { CodeConnectF: connectCode });
  }

  onNewMessage(callback: (message: SocketMessage) => void): void {
    this.on('newMessage', callback);
  }

  onOnlineUsers(callback: (userIds: string[]) => void): void {
    this.on('getOnlineUsers', callback);
  }

  onAiSuggestions(callback: (suggestions: string[]) => void): void {
    this.on('ai_segg', (payload: { s: string[] }) => callback(payload.s));
  }

  onFriendAdded(callback: (payload: { friendId: string; username: string }) => void): void {
    this.on('friendAdded', callback);
  }

  onFriendAddError(callback: (payload: { message: string }) => void): void {
    this.on('AddFriendError', callback);
  }

  onNewFriend(callback: (payload: { from: string; username: string }) => void): void {
    this.on('newFriend', callback);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = undefined;
  }

  private emit(event: string, payload?: unknown): void {
    if (!this.socket) {
      console.error(`[socket] impossible d'émettre "${event}" : socket non initialisé`);
      return;
    }
    this.socket.emit(event, payload);
  }

  private on(event: string, callback: (...args: never[]) => void): void {
    if (!this.socket) {
      console.error(`[socket] impossible d'écouter "${event}" : socket non initialisé`);
      return;
    }
    this.socket.on(event, callback as (...args: unknown[]) => void);
  }
}