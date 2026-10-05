import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function notFound(req, res, _next) {
  res.status(404).json({
    error: 'Route introuvable',
    path: `${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, _req, res, _next) {
  logger.error('Erreur non gérée', error);

  if (res.headersSent) return;

  res.status(error.status ?? 500).json({
    error: env.isProduction ? 'Erreur serveur' : error.message,
  });
}