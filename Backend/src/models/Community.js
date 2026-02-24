import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 90 },
    shortUrl: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
      match: /^[a-z0-9-]+$/
    },
    description: { type: String, trim: true, maxlength: 1200, default: '' },
    type: { type: String, trim: true, maxlength: 40, default: 'Mixta' },
    targetAudience: { type: String, trim: true, maxlength: 80, default: 'Mixto' },
    language: { type: String, trim: true, maxlength: 40, default: 'Español' },
    region: { type: String, trim: true, maxlength: 40, default: 'LATAM' },
    launchDate: { type: Date },

    mainGames: { type: [String], default: [] },
    allowAllGames: { type: Boolean, default: false },
    contentCategories: { type: Map, of: Boolean, default: {} },
    contentProhibited: { type: String, trim: true, maxlength: 600, default: '' },

    postTypes: { type: Map, of: Boolean, default: {} },
    whoCanPost: { type: String, enum: ['all', 'verified', 'staff'], default: 'all' },
    allowComments: { type: Boolean, default: true },
    preModeration: { type: Boolean, default: false },
    allowReactions: { type: Boolean, default: true },
    allowShare: { type: Boolean, default: true },

    roles: { type: Map, of: Boolean, default: {} },
    rulesText: { type: String, trim: true, maxlength: 6000, default: '' },
    toxicityFilter: { type: Boolean, default: true },
    spoilerTag: { type: Boolean, default: true },
    nsfwAllowed: { type: Boolean, default: false },
    reportReasons: { type: Map, of: Boolean, default: {} },
    emailVerification: { type: Boolean, default: true },
    antiSpamControl: { type: Boolean, default: true },
    discordIntegration: { type: Boolean, default: false },
    welcomeEmail: { type: Boolean, default: true },
    futureEvents: { type: Boolean, default: false },
    futureTournaments: { type: Boolean, default: false },

    admins: { type: [String], default: [] },
    media: {
      bannerUrl: { type: String, default: '' },
      avatarUrl: { type: String, default: '' },
      rulesPdfUrl: { type: String, default: '' },
      rulesPdfName: { type: String, default: '' }
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    members: { type: [memberSchema], default: [] },
    auditLogs: { type: [auditLogSchema], default: [] },
    membersCount: { type: Number, default: 1, min: 1 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

communitySchema.index({ createdAt: -1 });
communitySchema.index({ createdBy: 1, createdAt: -1 });
communitySchema.index({ 'members.user': 1, createdAt: -1 });

export default mongoose.model('Community', communitySchema);
