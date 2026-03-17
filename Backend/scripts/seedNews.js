/**
 * Seed script: migrates static news from frontend/src/data/newsData.js into MongoDB.
 *
 * Run once:  node scripts/seedNews.js
 *
 * After running, the frontend newsData.js is no longer needed for API responses.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

// Dynamic import of the frontend newsData
const newsDataPath = path.resolve(__dirname, '../../frontend/src/data/newsData.js');

async function main() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const { default: News } = await import('../src/models/News.js');

  // Import static data
  let NEWS;
  try {
    const module = await import(newsDataPath);
    NEWS = module.NEWS || module.default;
  } catch (err) {
    console.error('❌ Could not import newsData.js:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(NEWS) || NEWS.length === 0) {
    console.log('⚠️  No news items found in newsData.js');
    process.exit(0);
  }

  // Check if already seeded
  const existingCount = await News.countDocuments();
  if (existingCount > 0) {
    console.log(`⚠️  MongoDB already has ${existingCount} news articles. Skipping seed.`);
    console.log('   To force re-seed, drop the "news" collection first.');
    process.exit(0);
  }

  const docs = NEWS.map((item) => ({
    title:    item.title || 'Sin título',
    excerpt:  item.excerpt || '',
    category: item.category || 'Institucional',
    game:     item.game || 'Multigame',
    author:   item.author || 'Mesa Editorial',
    company:  item.company || 'GLITCH GANG',
    date:     item.date || new Date().toISOString().slice(0, 10),
    image:    item.image || '',
    featured: Boolean(item.featured),
    tags:     Array.isArray(item.tags) ? item.tags : [],
    details:  Array.isArray(item.details) ? item.details : [],
    gallery:  Array.isArray(item.gallery) ? item.gallery : [],
    views:    item.views || 0,
    comments: item.comments || 0,
  }));

  const result = await News.insertMany(docs);
  console.log(`✅ Seeded ${result.length} news articles into MongoDB`);

  await mongoose.disconnect();
  console.log('✅ Disconnected');
}

main().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
