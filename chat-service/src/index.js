import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Message, Conversation } from './models/chat.js';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();

const app = express();
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
const defaultAllowedOrigins = ['http://localhost:5173', 'http://localhost:3000', frontendOrigin];
const allowedOrigins = (process.env.CORS_ORIGINS || defaultAllowedOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
  .filter((origin, index, arr) => arr.indexOf(origin) === index);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

function cleanMessage(value = '') {
  return String(value || '').trim().slice(0, 2000);
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(chatRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ error: 'Conversacion invalida.' });
    }

    const history = await Message.find({ conversationId })
      .sort({ timestamp: 1 })
      .limit(100)
      .lean();

    return res.json(history);
  } catch (error) {
    console.error('GET /messages/:conversationId error:', error);
    return res.status(500).json({ error: 'Error al obtener el historial.' });
  }
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('Conexion establecida:', socket.id);

  socket.on('join_chat', (conversationId) => {
    const roomId = String(conversationId || '').trim();
    if (!roomId) return;
    socket.join(roomId);
    console.log(`Usuario unido a room: ${roomId}`);
  });

  socket.on('send_message', async (data) => {
    const { conversationId, senderId, senderName, content } = data || {};

    try {
      const roomId = String(conversationId || '').trim();
      const normalizedContent = cleanMessage(content);
      if (!mongoose.isValidObjectId(roomId) || !normalizedContent) return;

      const newMessage = new Message({
        conversationId: roomId,
        senderId: String(senderId || '').trim(),
        senderName: String(senderName || '').trim() || 'Jugador',
        content: normalizedContent,
        timestamp: new Date()
      });

      await newMessage.save();
      await Conversation.findByIdAndUpdate(roomId, {
        $set: {
          lastMessage: newMessage.content,
          lastSenderId: newMessage.senderId,
          lastSenderName: newMessage.senderName,
          updatedAt: newMessage.timestamp
        }
      });

      io.to(roomId).emit('receive_message', {
        id: String(newMessage._id),
        conversationId: roomId,
        senderId: newMessage.senderId,
        senderName: newMessage.senderName,
        text: newMessage.content,
        timestamp: newMessage.timestamp.toISOString()
      });
    } catch (error) {
      console.error('Error al guardar mensaje:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});

const PORT = process.env.PORT || 5001;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => console.log(`Chat Service en puerto ${PORT}`));
  })
  .catch((err) => console.error('Error DB:', err));
