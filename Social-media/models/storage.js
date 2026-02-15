// models/Post.js
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    user: String,
    avatar: String,
    text: String,
    imageUrl: String, // Aquí guardaremos la ruta de la imagen
    privacy: { type: String, default: 'Public' },
    likes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

export const Post = mongoose.model('Post', postSchema);