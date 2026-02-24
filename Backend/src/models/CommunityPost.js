import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ['media', 'file'],
      default: 'file'
    },
    name: {
      type: String,
      maxlength: 180
    },
    url: {
      type: String,
      maxlength: 1200
    },
    mimeType: {
      type: String,
      maxlength: 160
    },
    size: {
      type: Number,
      min: 0,
      max: 25 * 1024 * 1024
    }
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      trim: true,
      maxlength: 1200,
      required: true
    },
    attachment: attachmentSchema,
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  { timestamps: true }
);

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 160,
      required: true
    },
    details: {
      type: String,
      trim: true,
      maxlength: 1500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const communityPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    text: {
      type: String,
      trim: true,
      maxlength: 1200,
      required: true
    },
    privacy: {
      type: String,
      enum: ['Public', 'Friends', 'Private'],
      default: 'Public'
    },
    attachment: attachmentSchema,
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    comments: [commentSchema],
    hiddenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    reports: [reportSchema]
  },
  { timestamps: true }
);

communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ hiddenBy: 1, createdAt: -1 });

export default mongoose.model('CommunityPost', communityPostSchema);
