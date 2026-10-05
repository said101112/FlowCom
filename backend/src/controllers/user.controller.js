import User from '../models/user.model.js';
import { logger } from '../utils/logger.js';

/** Champs jamais renvoyés au client. */
const SAFE_FIELDS = '-password -verifyToken -verifyTokenExpiresAt';

export async function getUserProfile(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select(SAFE_FIELDS);

    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    res.status(200).json(user);
  } catch (error) {
    logger.error('Erreur lors de la récupération du profil', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function listUsers(req, res) {
  try {
    const users = await User.find().select(SAFE_FIELDS).sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    logger.error('Erreur lors de la récupération des utilisateurs', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}