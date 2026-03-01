import mongoose from 'mongoose';

const UniversityApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    universityId: {
      type: String,
      required: true,
      index: true
    },
    universityTag: {
      type: String,
      required: true
    },
    universityName: {
      type: String,
      required: true
    },
    region: {
      type: String,
      required: true
    },
    city: {
      type: String,
      default: ''
    },
    campus: {
      type: String,
      required: true
    },
    studentId: {
      type: String,
      required: true,
      index: true
    },
    program: {
      type: String,
      required: true
    },
    academicLevel: {
      type: String,
      required: true
    },
    institutionalEmail: {
      type: String,
      required: true
    },
    verificationSource: {
      type: String,
      enum: ['manual', 'microsoft'],
      default: 'manual'
    },
    microsoft: {
      tenantId: { type: String, default: '' },
      userId: { type: String, default: '' },
      email: { type: String, default: '' },
      displayName: { type: String, default: '' }
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    rejectReason: {
      type: String,
      default: ''
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

UniversityApplicationSchema.index(
  { universityId: 1, studentId: 1 },
  { name: 'uni_student_lookup' }
);

export default mongoose.model('UniversityApplication', UniversityApplicationSchema);
