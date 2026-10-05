import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'seen'],
      default: 'sent',
    },
    readAt: {
      type: Date, // permet de savoir quand le message a été lu
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // ajoute automatiquement createdAt et updatedAt
);

// Historique d'une conversation + comptage des non-lus.
messageSchema.index({ senderId: 1, receverId: 1, createdAt: -1 });
messageSchema.index({ receverId: 1, status: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
