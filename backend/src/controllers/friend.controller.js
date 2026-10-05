import validator from 'validator';

import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import { logger } from '../utils/logger.js';

/** Ajout d'ami par email ou username. Fonctionne dans les deux sens. */
export async function addFriend(req, res) {
  try {
    const currentUserId = req.user._id;
    const rawInput = (req.body.input ?? '').trim();

    if (!rawInput) {
      return res.status(400).json({ error: 'Champ "input" requis' });
    }

    const input = validator.escape(rawInput);
    const filter = validator.isEmail(input) ? { email: input } : { username: input };

    const target = await User.findOne(filter).select('_id');
    if (!target) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    if (target._id.equals(currentUserId)) {
      return res.status(400).json({ error: "Tu ne peux pas t'ajouter toi-même" });
    }

    await Promise.all([
      User.updateOne({ _id: currentUserId }, { $addToSet: { amis: target._id } }),
      User.updateOne({ _id: target._id }, { $addToSet: { amis: currentUserId } }),
    ]);

    res.status(200).json({ message: 'Ami ajouté avec succès', friendId: target._id });
  } catch (error) {
    logger.error("Erreur lors de l'ajout d'un ami", error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

const FRIEND_PROJECTION = 'username email phone lastSeen avatar status';

/**
 * Liste d'amis avec, pour chacun, le nombre de messages non lus et le
 * dernier message échangé. Les messages sont agrégés en une seule requête
 * pour éviter le N+1.
 */
export async function listFriends(req, res) {
  try {
    const { userId } = req.params;

    // Un utilisateur ne peut lire que sa propre liste d'amis.
    if (String(req.user._id) !== String(userId)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const user = await User.findById(userId).populate('amis', FRIEND_PROJECTION);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const friendIds = user.amis.map((friend) => friend._id);

    if (friendIds.length === 0) {
      return res.status(200).json({ amis: [], unseenMessage: {}, LastMessages: {} });
    }

    const [unseenRows, lastRows] = await Promise.all([
      Message.aggregate([
        {
          $match: {
            senderId: { $in: friendIds },
            receverId: user._id,
            status: { $ne: 'seen' },
          },
        },
        { $group: { _id: '$senderId', count: { $sum: 1 } } },
      ]),
      Message.aggregate([
        {
          $match: {
            $or: [
              { senderId: user._id, receverId: { $in: friendIds } },
              { senderId: { $in: friendIds }, receverId: user._id },
            ],
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: {
              $cond: [{ $eq: ['$senderId', user._id] }, '$receverId', '$senderId'],
            },
            lastMessage: { $first: '$$ROOT' },
          },
        },
      ]),
    ]);

    const unseenMessage = Object.fromEntries(
      unseenRows.map((row) => [String(row._id), row.count]),
    );
    const LastMessages = Object.fromEntries(
      lastRows.map((row) => [String(row._id), row.lastMessage]),
    );

    res.status(200).json({ amis: user.amis, unseenMessage, LastMessages });
  } catch (error) {
    logger.error('Erreur lors de la récupération des amis', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}