import { generateSuggestions } from '../../services/ai.service.js';
import { presence } from '../presence.js';
import { logger } from '../../utils/logger.js';

const MAX_CONTEXT_MESSAGES = 8;

/** Tampon mémoire du contexte récent, par room. Volontairement non persistant. */
const roomContext = new Map();

function pushContext(room, entry) {
  const history = roomContext.get(room) ?? [];
  history.push(entry);

  if (history.length > MAX_CONTEXT_MESSAGES) {
    history.splice(0, history.length - MAX_CONTEXT_MESSAGES);
  }

  roomContext.set(room, history);
  return history;
}

export function registerMessageHandlers(socket, user) {
  socket.on('joinRoom', (room) => {
    if (typeof room !== 'string' || !room) return;
    socket.join(room);
    logger.debug(`Socket ${socket.id} a rejoint la room ${room}`);
  });

  socket.on('sendMessage', async ({ Room, message } = {}) => {
    const text = typeof message?.text === 'string' ? message.text.trim() : '';
    if (!text || !Room) return;

    const recipientId = message?.receverId ?? message?.receiverId;

    logger.debug(`Message socket reçu dans ${Room} par ${user.id}`);

    const context = pushContext(Room, { id: user.id, text }).map((entry) => ({
      id: entry.id,
      text: entry.text,
    }));

    const suggestions = await generateSuggestions(text, context);

    if (recipientId) {
      presence.sendToUser(recipientId, 'ai_segg', { s: suggestions });
    }
  });
}