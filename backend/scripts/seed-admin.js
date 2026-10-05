/**
 * Crée (ou met à jour) le compte administrateur initial.
 *
 * Usage :
 *   npm run seed:admin
 *
 * Les identifiants proviennent des variables d'environnement, jamais du code :
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME
 */
import 'dotenv/config';

import bcrypt from 'bcrypt';

import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import User from '../src/models/user.model.js';
import { generateUniqueConnectCode } from '../src/services/connect-code.service.js';
import { logger } from '../src/utils/logger.js';

const BCRYPT_ROUNDS = 10;

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const username = process.env.ADMIN_USERNAME;

  if (!email || !password || !username) {
    throw new Error(
      'Variables manquantes : ADMIN_EMAIL, ADMIN_PASSWORD et ADMIN_USERNAME sont requis',
    );
  }

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD doit contenir au moins 8 caractères');
  }

  await connectDatabase();

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const existing = await User.findOne({ email });

  if (existing) {
    existing.password = passwordHash;
    existing.role = 'admin';
    existing.isVerified = true;
    await existing.save();
    logger.info(`Compte administrateur mis à jour : ${email}`);
    return;
  }

  await User.create({
    ConnectCode: await generateUniqueConnectCode(),
    username,
    email,
    password: passwordHash,
    firstName: 'Admin',
    lastName: 'FlowCom',
    phone: process.env.ADMIN_PHONE ?? '0000000000',
    role: 'admin',
    isVerified: true,
    lastSeen: new Date(),
  });

  logger.info(`Compte administrateur créé : ${email}`);
}

seedAdmin()
  .catch((error) => {
    logger.error('Échec du seed administrateur', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });