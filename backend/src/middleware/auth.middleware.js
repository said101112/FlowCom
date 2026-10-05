import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

const COOKIE_NAME = 'auth_token';

export function protect(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = { _id: decoded.id, username: decoded.username };
    next();
  } catch {
    res.status(401).json({ message: 'Authentification invalide' });
  }
}

/** Réservé aux routes administrateur. `protect` doit être appliqué avant. */
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    next();
  };
}

export const authCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};