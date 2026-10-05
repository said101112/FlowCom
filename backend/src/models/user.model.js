import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  ConnectCode: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    minlength: 3,
    maxlength: 30
  },
  firstName: { type: String, trim: true, maxlength: 50 },
  lastName: { type: String, trim: true, maxlength: 50 },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: [/^0[0-9]{9}$/, 'Le numéro doit commencer par 0 et contenir 10 chiffres.']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez entrer un email valide'
    ]
  },
  password: { type: String, required: true, trim: true, minlength: 8 },
  avatar: { type: String, default: '' }, 
  bio: { type: String, maxlength: 160, default: '' }, 
  status: { type: String, maxlength: 50, default: 'Disponible' }, 
  lastSeen: { type: Date },
  timezone: { type: String, default: 'UTC' },
  language: { type: String, default: 'fr' },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifyToken: {
    type: String,
    select: false,
  },
  verifyTokenExpiresAt: {
    type: Date,
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  amis: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true 
});

// email / username sont déjà indexés via `unique: true` dans le schéma.
// ConnectCode ne l'est pas : sans cet index la génération de code est un full scan.
userSchema.index({ ConnectCode: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
export default User;