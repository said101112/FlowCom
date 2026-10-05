import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import sanitizeHtml from 'sanitize-html';
import validator from 'validator';

import User from '../models/user.model.js';
import { env } from '../config/env.js';
import { authCookie } from '../middleware/auth.middleware.js';
import { sendVerificationEmail } from '../services/email.service.js';
import { generateUniqueConnectCode } from '../services/connect-code.service.js';
import { presence } from '../realtime/presence.js';
import { logger } from '../utils/logger.js';

const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
const PHONE_REGEX = /^0[0-9]{9}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const publicUser = (user) => ({
  id: user._id,
  ConnectCode: user.ConnectCode,
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
});

export async function signup(req, res) {
  try {
    let { username, email, password, phone, firstName, lastName, bio } = req.body;

    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Champs manquants : username, email, password, firstName et lastName sont requis',
      });
    }

    username = validator.escape(username.trim());
    firstName = validator.escape(firstName.trim());
    lastName = validator.escape(lastName.trim());
    email = validator.normalizeEmail(email);
    password = password.trim();
    phone = phone ? validator.escape(phone.trim()) : '';
    bio = sanitizeHtml(bio || '', { allowedTags: [], allowedAttributes: {} });

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Format email invalide' });
    }

    if (phone && !PHONE_REGEX.test(phone)) {
      return res.status(400).json({
        error: 'Format téléphone invalide. Doit commencer par 0 et contenir 10 chiffres',
      });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        error: 'Le username doit contenir entre 3 et 30 caractères',
      });
    }

    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({
        error: 'Le username ne peut contenir que des lettres, chiffres et underscores',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au moins 8 caractères',
      });
    }

    const [emailTaken, usernameTaken, phoneTaken] = await Promise.all([
      User.exists({ email }),
      User.exists({ username }),
      phone ? User.exists({ phone }) : null,
    ]);

    if (emailTaken) return res.status(409).json({ error: 'Email déjà utilisé.' });
    if (usernameTaken) return res.status(409).json({ error: 'Username déjà utilisé.' });
    if (phoneTaken) return res.status(409).json({ error: 'Numéro déjà utilisé.' });

    const newUser = new User({
      ConnectCode: await generateUniqueConnectCode(),
      username,
      firstName,
      lastName,
      password: await bcrypt.hash(password, 10),
      email,
      phone,
      bio,
      avatar: '',
      status: 'Disponible',
      lastSeen: new Date(),
      role: 'user',
      timezone: 'Europe/Paris',
      language: 'fr',
      verifyToken: crypto.randomBytes(32).toString('hex'),
      verifyTokenExpiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
    });

    await newUser.save();

    sendVerificationEmail(newUser).catch((error) =>
      logger.error("Échec de l'envoi de l'email de vérification", error),
    );

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      user: publicUser(newUser),
    });
  } catch (error) {
    logger.error("Erreur lors de l'inscription", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue ?? {})[0] ?? 'champ';
      return res.status(409).json({ error: `${field} déjà utilisé` });
    }

    res.status(500).json({ error: 'Erreur serveur lors de la création du compte' });
  }
}

export async function signin(req, res) {
  try {
    const email = validator.normalizeEmail((req.body.email ?? '').trim());
    const password = (req.body.password ?? '').trim();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Email n'existe pas." });

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ error: 'Veuillez vérifier votre email avant de vous connecter.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) return res.status(401).json({ error: 'Mot de passe incorrect.' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '1d' },
    );

    user.lastSeen = new Date();
    await user.save();

    res.cookie(authCookie.name, token, authCookie.options);
    res.status(200).json({
      message: 'Connexion réussie',
      role: user.role,
      id: user._id,
    });
  } catch (error) {
    logger.error('Erreur lors de la connexion', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function logout(_req, res) {
  res.clearCookie(authCookie.name, {
    httpOnly: authCookie.options.httpOnly,
    secure: authCookie.options.secure,
    sameSite: authCookie.options.sameSite,
  });
  res.status(200).json({ message: 'Déconnexion réussie' });
}

export async function verifyEmail(req, res) {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verifyToken: token });

    if (!user) {
      return res.status(400).json({ error: 'Token invalide ou expiré' });
    }

    if (user.verifyTokenExpiresAt && user.verifyTokenExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: 'Token expiré, veuillez refaire inscription' });
    }

    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiresAt = undefined;
    await user.save();

    res.type('html').send(verificationSuccessPage(env.CLIENT_ORIGIN));
  } catch (error) {
    logger.error('Erreur lors de la vérification email', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/** Appelé par le frontend après connexion : met à jour `lastSeen`. */
export async function updateLastLogin(req, res) {
  try {
    // L'identifiant vient du JWT, pas du body : évite l'IDOR.
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { lastSeen: new Date() },
      { new: true },
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    res.status(200).json({ message: 'Dernière connexion mise à jour', user });
  } catch (error) {
    logger.error('Erreur mise à jour lastSeen', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export function onlineSocketIds() {
  return presence.onlineIds();
}

function verificationSuccessPage(clientOrigin) {
  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="2;url=${clientOrigin}/login" />
    <title>Email vérifié</title>
    <style>
      body { font-family: system-ui, sans-serif; text-align: center; margin-top: 12vh; color: #1a202c; }
      h1 { color: #128c7e; }
      a { color: #128c7e; }
    </style>
  </head>
  <body>
    <h1>Email vérifié avec succès</h1>
    <p>Redirection vers la page de connexion dans quelques secondes...</p>
    <p><a href="${clientOrigin}/login">Cliquer ici si rien ne se passe</a></p>
  </body>
</html>`;
}