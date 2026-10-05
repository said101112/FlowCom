import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import { corsOrigins, env } from '../config/env.js';
import { presence } from './presence.js';
import { registerMessageHandlers } from './handlers/message.handler.js';
import { registerFriendHandlers } from './handlers/friend.handler.js';
import { logger } from '../utils/logger.js';

/** Extrait le JWT du cookie httpOnly `auth_token` envoyé au handshake. */
function readAuthToken(handshake) {
  const cookies = handshake.headers.cookie;
  if (!cookies) return null;

  const entry = cookies
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('auth_token='));

  return entry ? decodeURIComponent(entry.slice('auth_token='.length)) : null;
}

function authenticateSocket(socket) {
  const token = readAuthToken(socket.handshake);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (!payload?.id) return null;
    return { id: String(payload.id), username: payload.username };
  } catch {
    return null;
  }
}

export function attachGateway(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true },
  });

  presence.attach(io);

  io.on('connection', (socket) => {
    const user = authenticateSocket(socket);

    if (!user) {
      logger.warn(`Connexion socket refusée (${socket.id}) : JWT absent ou invalide`);
      socket.disconnect(true);
      return;
    }

    presence.add(user.id, socket.id);
    socket.join(user.id);
    logger.debug(`Utilisateur ${user.username ?? user.id} connecté (${socket.id})`);

    registerMessageHandlers(socket, user);
    registerFriendHandlers(socket, user);

    socket.on('disconnect', () => {
      presence.remove(user.id);
      logger.debug(`Utilisateur ${user.id} déconnecté (${socket.id})`);
    });
  });

  return io;
}