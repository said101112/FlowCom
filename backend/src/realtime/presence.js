import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Registre des utilisateurs connectés, injecté dans les contrôleurs et les
 * handlers Socket.IO. Remplit par `realtime/gateway.js` au démarrage.
 * Évite toute importation circulaire avec le serveur HTTP.
 */
export const presence = {
  io: null,
  /** userId -> socketId */
  onlineUsers: new Map(),

  attach(io) {
    this.io = io;
  },

  getSocketId(userId) {
    return this.onlineUsers.get(String(userId)) ?? null;
  },

  add(userId, socketId) {
    this.onlineUsers.set(String(userId), socketId);
    this.broadcastOnlineUsers();
  },

  remove(userId) {
    this.onlineUsers.delete(String(userId));
    this.broadcastOnlineUsers();
  },

  onlineIds() {
    return [...this.onlineUsers.keys()];
  },

  broadcastOnlineUsers() {
    this.io?.emit('getOnlineUsers', this.onlineIds());
  },

  /** Notifie un utilisateur précis s'il est connecté. */
  sendToUser(userId, event, payload) {
    const socketId = this.getSocketId(userId);
    if (!socketId || !this.io) return false;
    this.io.to(socketId).emit(event, payload);
    return true;
  },
};

export function logServerStart(port) {
  logger.info(`Backend FlowCom à l'écoute sur le port ${port} (${env.NODE_ENV})`);
}