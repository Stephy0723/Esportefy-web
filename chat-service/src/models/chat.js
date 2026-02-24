import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  participants: [{ type: String, required: true }], // IDs de los usuarios
  type: { type: String, enum: ['individual', 'team'], default: 'individual' },
  teamId: { type: String, default: null },
  lastMessage: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export const Conversation = mongoose.model('Conversation', ConversationSchema);
export const Message = mongoose.model('Message', MessageSchema);