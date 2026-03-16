import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  title:    { type: String, required: true, trim: true, maxlength: 300 },
  excerpt:  { type: String, trim: true, maxlength: 500, default: '' },
  category: { type: String, trim: true, default: 'Institucional' },
  game:     { type: String, trim: true, default: 'Multigame' },
  author:   { type: String, trim: true, default: 'Mesa Editorial GLITCH GANG' },
  company:  { type: String, trim: true, default: 'GLITCH GANG' },
  date:     { type: String, trim: true, default: '' },
  image:    { type: String, default: '' },
  featured: { type: Boolean, default: false },
  tags:     { type: [String], default: [] },
  details:  { type: [String], default: [] },
  gallery:  { type: [String], default: [] },

  views:    { type: Number, default: 0 },
  comments: { type: Number, default: 0 },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
}, { timestamps: true });

newsSchema.index({ createdAt: -1 });
newsSchema.index({ featured: 1, createdAt: -1 });

export default mongoose.model('News', newsSchema);
