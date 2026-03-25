import mongoose from 'mongoose';

const newsletterSubscriberSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
  games:    { type: [String], default: ['MLBB', 'LoL', 'Valorant', 'Wild Rift'] },
  active:   { type: Boolean, default: true },
  unsubscribeToken: { type: String, unique: true },
}, { timestamps: true });

newsletterSubscriberSchema.index({ active: 1 });

export default mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
