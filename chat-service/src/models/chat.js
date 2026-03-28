import mongoose from 'mongoose';

const ParticipantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, default: '' },
  fullName: { type: String, default: '' },
  avatar: { type: String, default: '' },
  role: { type: String, default: '' }
}, { _id: false });

const PollOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: [{ type: String }] // userIds
}, { _id: true });

const ConversationSchema = new mongoose.Schema({
  participants: [{ type: String, required: true }],
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
  content: { type: String, default: '' },
  // message type: text, image, file, voice, poll
  msgType: { type: String, enum: ['text', 'image', 'file', 'voice', 'poll'], default: 'text' },
  // for image/file/voice
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  fileMime: { type: String, default: '' },
  // for voice
  voiceDuration: { type: Number, default: 0 },
  // for poll (team chats only)
  pollQuestion: { type: String, default: '' },
  pollOptions: { type: [PollOptionSchema], default: [] },
  pollClosed: { type: Boolean, default: false },
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
