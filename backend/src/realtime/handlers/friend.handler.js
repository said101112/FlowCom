import User from '../../models/user.model.js';
import { presence } from '../presence.js';
import { logger } from '../../utils/logger.js';

/**
 * Ajout d'ami par code ConnectCode.
 * L'identité de l'émetteur provient du JWT du handshake (`user`),
 * jamais du payload client : `id` est désormais ignoré.
 */
export function registerFriendHandlers(socket, user) {
  socket.on('AddFriend', async ({ CodeConnectF } = {}) => {
    try {
      const me = await User.findById(user.id).select('_id username amis');
      if (!me) {
        socket.emit('AddFriendError', { message: 'Utilisateur introuvable' });
        return;
      }

      if (typeof CodeConnectF !== 'string' || !CodeConnectF) {
        socket.emit('AddFriendError', { message: 'Code manquant' });
        return;
      }

      const friend = await User.findOne({ ConnectCode: CodeConnectF }).select(
        '_id username',
      );

      if (!friend) {
        socket.emit('AddFriendError', { message: 'Code introuvable' });
        return;
      }

      if (me._id.equals(friend._id)) {
        socket.emit('AddFriendError', { message: "Tu ne peux pas t'ajouter toi-même" });
        return;
      }

      const alreadyFriend = me.amis.some((id) => id.equals(friend._id));
      if (alreadyFriend) {
        socket.emit('AddFriendError', { message: 'Vous êtes déjà amis' });
        return;
      }

      await User.updateOne({ _id: me._id }, { $addToSet: { amis: friend._id } });
      await User.updateOne({ _id: friend._id }, { $addToSet: { amis: me._id } });

      presence.sendToUser(friend._id, 'newFriend', {
        from: me._id.toString(),
        username: me.username ?? null,
      });

      socket.emit('friendAdded', {
        friendId: friend._id.toString(),
        username: friend.username ?? null,
      });

      logger.info(`${me._id} et ${friend._id} sont désormais amis`);
    } catch (error) {
      logger.error("[AddFriend] échec de l'ajout", error);
      socket.emit('AddFriendError', {
        message: "Erreur serveur lors de l'ajout d'un ami",
      });
    }
  });
}