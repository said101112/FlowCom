import { customAlphabet } from 'nanoid';

import User from '../models/user.model.js';

const CONNECT_CODE_LENGTH = 6;
const generateCode = customAlphabet('0123456789', CONNECT_CODE_LENGTH);

/**
 * Code ConnectCode unique à 6 chiffres.
 * Boucle de collision sur index unique plutôt que sur une boucle infinie.
 */
export async function generateUniqueConnectCode() {
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = generateCode();
    const exists = await User.exists({ ConnectCode: code });
    if (!exists) return code;
  }

  throw new Error(
    `Impossible de générer un ConnectCode unique après ${maxAttempts} tentatives`,
  );
}