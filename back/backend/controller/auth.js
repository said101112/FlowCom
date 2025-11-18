import user from '../models/user.js';
import message from '../models/message.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { io, onlineUser } from '../index.js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { sendVerificationEmail } from '../controller/utils/email.js';
import validator from 'validator';
import sanitizeHtml from 'sanitize-html';
import generatedUniqueConnectCode from './utils/generatedUniqueConnect.js';

dotenv.config();

// ---------------- SIGNUP ----------------
export const SignUp = async (req, res) => {
  try {
    let { username, email, password, phone, firstName, lastName, bio } = req.body;

    // ✅ Vérifier les champs requis
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Champs manquants : username, email, password, firstName et lastName sont requis' });
    }

    // ✅ Nettoyer les données
    username = validator.escape(username.trim());
    firstName = validator.escape(firstName.trim());
    lastName = validator.escape(lastName.trim());
    email = validator.normalizeEmail(email);
    password = password.trim();
    phone = phone ? validator.escape(phone.trim()) : '';
    bio = sanitizeHtml(bio || '', { allowedTags: [], allowedAttributes: {} });

    // ✅ Validation formats
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Format email invalide' });

    if (phone) {
      const phoneRegex = /^0[0-9]{9}$/;
      if (!phoneRegex.test(phone)) return res.status(400).json({ error: 'Format téléphone invalide. Doit commencer par 0 et contenir 10 chiffres' });
    }

    if (username.length < 3 || username.length > 30) return res.status(400).json({ error: 'Le username doit contenir entre 3 et 30 caractères' });
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) return res.status(400).json({ error: 'Le username ne peut contenir que des lettres, chiffres et underscores' });

    if (password.length < 8) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });

    // ✅ Vérification des doublons
    if (await user.findOne({ email })) return res.status(400).json({ error: 'Email déjà utilisé.' });
    if (await user.findOne({ username })) return res.status(400).json({ error: 'Username déjà utilisé.' });
    if (phone && await user.findOne({ phone })) return res.status(400).json({ error: 'Numéro de téléphone déjà utilisé.' });

    // ✅ Hash mot de passe + token de vérification
    const hashedpwd = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex');

   
    const newuser = new user({
      ConnectCode: await generatedUniqueConnectCode(),
      username, firstName, lastName, password: hashedpwd, email, phone,
      bio, avatar: '', status: 'Disponible', lastSeen: new Date(), role: 'user',
      timezone: 'Europe/Paris', language: 'fr',
      verifyToken: token
    });

    await newuser.save();
    sendVerificationEmail(newuser);

    res.status(201).json({
      success:true,
      message: 'Compte créé avec succès',
      user: { id: newuser._id, ConnectCode:newuser.ConnectCode, username, firstName, lastName, email, phone }
    });

  } catch (err) {
    console.error('Erreur lors de l\'inscription:', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ error: `${field} déjà utilisé` });
    }
    res.status(500).json({ error: 'Erreur serveur lors de la création du compte' });
  }
};

// ---------------- SIGNIN ----------------
export const Signin = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ msg: 'Email et mot de passe requis' });

    email = validator.normalizeEmail(email);
    password = password.trim();

    const existingUser = await user.findOne({ email });
    console.log('current user is :' , existingUser);
    if (!existingUser) return res.status(400).json({ msg: "Email n'existe pas." });
    if (!existingUser.isVerified) return res.status(403).send('Veuillez vérifier votre email avant de vous connecter.');

    const validPassword = await bcrypt.compare(password, existingUser.password);
    if (!validPassword) return res.status(400).json({ msg: "Mot de passe incorrect." });

    const token = jwt.sign({ id: existingUser._id , username: existingUser.username }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ msg: "Connexion réussie", role: existingUser.role, id: existingUser._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- LOGOUT ----------------
export const logout = async (req, res) => {
  try {
    res.clearCookie('auth_token', { httpOnly: true, sameSite: 'strict', secure: false });
    res.status(200).json({ msg: "Déconnexion réussie !" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- GET USER PROFILES ----------------
export const getAdminProfil = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await user.findById(id);
    if (!admin) return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    res.status(200).json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserProfil = async (req, res) => {
  try {
    const { id } = req.params;
    const User = await user.findById(id).select("-password");
    if (!User) return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    res.status(200).json(User);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await user.find({ role: 'user' });
    if (users.length === 0) return res.status(400).json({ msg: "Aucun utilisateur trouvé" });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- FRIENDS ----------------
export const AddAmis = async (req, res) => {
  try {
    let { input, currentUserId } = req.body;
    if (!input || !currentUserId) return res.status(400).json({ msg: 'Champs requis' });

    input = validator.escape(input.trim());

    const isEmail = validator.isEmail(input);
    const amis = await user.findOne(isEmail ? { email: input } : { username: input });
    if (!amis) return res.status(404).json({ msg: "Utilisateur non trouvé" });

    if (amis._id.toString() === currentUserId) return res.status(400).json({ msg: "Tu ne peux pas t'ajouter toi-même" });

    await user.findByIdAndUpdate(currentUserId, { $addToSet: { amis: amis._id } }, { new: true });
    res.status(200).json({ message: "Amis ajouté avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAmis = async (req, res) => {
  try {
    const { userId } = req.params;
    const utilisateur = await user.findById(userId).populate('amis', 'username email phone lastSeen');
    if (!utilisateur) return res.status(404).json({ msg: 'Utilisateur non trouvé' });

    const unseenMessage = {};
    const LastMessages = {};

    const promises = utilisateur.amis.map(async u => {
      const messages = await message.find({ senderId: u._id, receverId: userId, Seen: false });
      if (messages.length > 0) unseenMessage[u._id] = messages.length;

      const lastMessage = await message.findOne({
        $or: [
          { senderId: u._id, receverId: userId },
          { senderId: userId, receverId: u._id }
        ]
      }).sort({ createdAt: -1 });
      LastMessages[u._id] = lastMessage;
    });

    await Promise.all(promises);
    res.status(200).json({ amis: utilisateur.amis, unseenMessage, LastMessages });
  } catch (err) {
    res.status(500).json({ msg: 'Erreur serveur' });
  }
};

// ---------------- MESSAGES ----------------
export const getAllmsgs = async (req, res) => {
  try {
    const { selectuserId } = req.params;
    const MyId = req.user._id;

    const messagesData = await message.find({
      $or: [
        { senderId: MyId, receverId: selectuserId },
        { senderId: selectuserId, receverId: MyId }
      ]
    });

    await message.updateMany({ senderId: selectuserId, receverId: MyId }, { Seen: true });
    res.json({ msg: 'get all msg', messages: messagesData });
  } catch (err) {
    res.status(500).json({ msg: 'Erreur serveur' });
  }
};

export const SendMessage = async (req, res) => {
  try {
    const { receverId } = req.params;
    const senderId = req.user._id; // vient du middleware verifyToken
    let { text } = req.body;

    text = sanitizeHtml(text || '', { allowedTags: [], allowedAttributes: {} });
    if (!text || text.trim() === '') {
      return res.status(400).json({ msg: 'Message vide non autorisé' });
    }

    const newMsg = await message.create({
      senderId,
      receverId,
      text,
      status: 'sent',
      timestamp: Date.now(),
    });

    res.status(200).json({ msg: 'Message envoyé avec succès', message: newMsg });

    const receiverSocketId = onlineUser[receverId];

    // 💡 Vérifie si l'expéditeur est bien défini
    console.log('🧠 Utilisateur connecté:', req.user);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', newMsg, req.user.username);
      newMsg.status = 'delivered';
      await newMsg.save();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erreur serveur lors de l’envoi du message' });
  }
};

