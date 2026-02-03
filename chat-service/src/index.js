import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Message, Conversation } from './models/chat.js'; // Importante el .js

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Buscamos los mensajes y los ordenamos del más viejo al más nuevo
    const history = await Message.find({ conversationId })
      .sort({ timestamp: 1 }) 
      .limit(50);

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el historial" });
  }
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // URL de tu frontend React
    methods: ["GET", "POST"]
  }
});

// --- Lógica de Sockets ---
io.on('connection', (socket) => {
  console.log('Conexión establecida:', socket.id);

  // Unirse a sala de equipo o chat privado
  socket.on('join_chat', (conversationId) => {
    socket.join(conversationId);
    console.log(`Usuario unido a room: ${conversationId}`);
  });

  // Enviar mensaje
  socket.on('send_message', async (data) => {
    const { conversationId, senderId, senderName, content } = data;

    try {
      const newMessage = new Message({
        conversationId,
        senderId,
        senderName,
        content,
        timestamp: new Date()
      });

      await newMessage.save();

      // Emitir mensaje a todos en la sala
      io.to(conversationId).emit('receive_message', {
        id: newMessage._id,
        sender: newMessage.senderName,
        text: newMessage.content,
        time: newMessage.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ownId: newMessage.senderId // Para comparar en el front si es "mío"
      });
    } catch (error) {
      console.error("Error al guardar mensaje:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});

// --- Conexión DB y Start ---
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => console.log(`🚀 Chat Service en puerto ${PORT}`));
  })
  .catch(err => console.error("Error DB:", err));