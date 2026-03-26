import mongoose from 'mongoose';

const ParticipantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, default: '' },
  fullName: { type: String, default: '' },
  avatar: { type: String, default: '' },
  role: { type: String, default: '' }
}, { _id: false });

const ConversationSchema = new mongoose.Schema({
  participants: [{ type: String, required: true }], // IDs de los usuarios
  type: { type: String, enum: ['individual', 'team'], default: 'individual' },
  teamId: { type: String, default: null },
  title: { type: String, default: '' },
  image: { type: String, default: '' },
  teamCode: { type: String, default: '' },
  game: { type: String, default: '' },
  createdBy: { type: String, default: '' },
  participantDetails: { type: [ParticipantSchema], default: [] },
  lastMessage: { type: String, default: '' },
  lastSenderId: { type: String, default: '' },
  lastSenderName: { type: String, default: '' }
}, { timestamps: true });

const MessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

ConversationSchema.index({ teamId: 1 }, {
  unique: true,
  sparse: true,
  partialFilterExpression: { teamId: { $type: 'string', $ne: '' } }
});

ConversationSchema.index({ participants: 1, updatedAt: -1 });

export const Conversation = mongoose.model('Conversation', ConversationSchema);
export const Message = mongoose.model('Message', MessageSchema);
