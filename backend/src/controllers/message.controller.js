import sanitizeHtml from 'sanitize-html';

import Message from '../models/message.model.js';
import { presence } from '../realtime/presence.js';
import { logger } from '../utils/logger.js';

export async function listMessages(req, res) {
  try {
    const { selectuserId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receverId: selectuserId },
        { senderId: selectuserId, receverId: currentUserId },
      ],
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      { senderId: selectuserId, receverId: currentUserId, status: { $ne: 'seen' } },
      { status: 'seen', readAt: new Date() },
    );

    res.json({ message: 'get all msg', messages });
  } catch (error) {
    logger.error('Erreur lors de la récupération des messages', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function sendMessage(req, res) {
  try {
    const { receverId } = req.params;
    const senderId = req.user._id;
    const text = sanitizeHtml((req.body.text ?? '').trim(), {
      allowedTags: [],
      allowedAttributes: {},
    });

    if (!text) {
      return res.status(400).json({ error: 'Message vide non autorisé' });
    }

    const newMessage = await Message.create({
      senderId,
      receverId,
      text,
      status: 'sent',
    });

    const delivered = presence.sendToUser(receverId, 'newMessage', {
      ...newMessage.toObject(),
      senderUsername: req.user.username,
    });

    if (delivered) {
      newMessage.status = 'delivered';
      await newMessage.save();
    }

    res.status(201).json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    logger.error('Erreur lors de lenvoi du message', error);
    res.status(500).json({ error: "Erreur serveur lors de l'envoi du message" });
  }
}