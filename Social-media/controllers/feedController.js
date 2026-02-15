// DB Temporal en memoria
import { Post } from '../models/storage.js';

    export const getPosts = async (req, res) => {
        try {
            const posts = await Post.find().sort({ createdAt: -1 });
            res.json(posts);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

export const createPost = async (req, res) => {
    try {
        const { user, text, privacy } = req.body;
        
        // Si hay un archivo, generamos la URL
        const imageUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

        const newPost = new Post({
            user,
            text,
            privacy,
            imageUrl,
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user
        });

        await newPost.save();

        // Emitir por Socket.io
        req.io.emit('new_post', newPost);

        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addComment = (req, res) => {
    const { postId } = req.params;
    const { user, avatar, text } = req.body;

    const postIndex = posts.findIndex(p => p.id === Number(postId));
    
    if (postIndex !== -1) {
        const newComment = {
            id: Date.now(),
            user,
            avatar,
            text,
            likes: 0,
            liked: false
        };
        
        posts[postIndex].comments.push(newComment);
        
        // Notificar actualización de comentarios
        req.io.emit('new_comment', { postId, comment: newComment });
        
        res.status(201).json(newComment);
    } else {
        res.status(404).json({ message: "Post no encontrado" });
    }
};