import { Router } from 'express';

import { protect, requireRole } from '../middleware/auth.middleware.js';
import {
  signin,
  signup,
  logout,
  verifyEmail,
  updateLastLogin,
} from '../controllers/auth.controller.js';
import { addFriend, listFriends } from '../controllers/friend.controller.js';
import { listMessages, sendMessage } from '../controllers/message.controller.js';
import { getUserProfile, listUsers } from '../controllers/user.controller.js';

const router = Router();

// --- Public ---
router.post('/signup', signup);
router.post('/signin', signin);
router.get('/verify/:token', verifyEmail);

// --- Session ---
router.post('/logout', protect, logout);
router.post('/updateLastLogin', protect, updateLastLogin);

// --- Amis ---
router.post('/addAmis', protect, addFriend);
router.get('/getAmis/:userId', protect, listFriends);

// --- Messages ---
router.post('/sendMessage/:receverId', protect, sendMessage);
router.get('/getAllmsgs/:selectuserId', protect, listMessages);

// --- Utilisateurs ---
router.get('/user/:id', protect, getUserProfile);
router.get('/getAllusers', protect, requireRole('admin'), listUsers);

export default router;