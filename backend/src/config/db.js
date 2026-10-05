import mongoose from 'mongoose';

import { env } from './env.js';
import { logger } from '../utils/logger.js';

let connection = null;

export async function connectDatabase() {
  if (connection) return connection;

  mongoose.set('strictQuery', true);

  connection = await mongoose.connect(env.MONGO_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  logger.info(`MongoDB connecté : ${redactMongoUrl(env.MONGO_URL)}`);

  connection.on('error', (error) => {
    logger.error('Erreur de connexion MongoDB', error);
  });

  connection.on('disconnected', () => {
    logger.warn('Déconnexion MongoDB');
  });

  return connection;
}

export async function disconnectDatabase() {
  if (!connection) return;
  await mongoose.disconnect();
  connection = null;
}

function redactMongoUrl(url) {
  return url.replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:****@');
}