import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Message, Conversation } from './models/chat.js';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
const defaultAllowedOrigins = ['http://localhost:5173', 'http://localhost:3000', frontendOrigin];
const allowedOrigins = (process.env.CORS_ORIGINS || defaultAllowedOrigins.join(','))
  .split(',').map((o) => o.trim()).filter(Boolean).filter((o, i, a) => a.indexOf(o) === i);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

function cleanMsg(v = '') { return String(v || '').trim().slice(0, 2000); }

// multer config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  }
});

const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
  'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav'
];

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo de archivo no permitido.'));
  }
});

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(chatRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

// ── GET messages ──
app.get('/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!mongoose.isValidObjectId(conversationId)) return res.status(400).json({ error: 'Conversacion invalida.' });
    const history = await Message.find({ conversationId }).sort({ timestamp: 1 }).limit(200).lean();
    return res.json(history);
  } catch (e) {
    console.error('GET /messages error:', e);
    return res.status(500).json({ error: 'Error al obtener historial.' });
  }
});

// ── POST upload file ──
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se envio archivo.' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    const isImage = req.file.mimetype.startsWith('image/');
    const isVoice = req.file.mimetype.startsWith('audio/');
    return res.json({
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileMime: req.file.mimetype,
      msgType: isVoice ? 'voice' : isImage ? 'image' : 'file'
    });
  } catch (e) {
    console.error('POST /upload error:', e);
    return res.status(500).json({ error: 'Error subiendo archivo.' });
  }
});

// ── POST create poll (team only) ──
app.post('/polls', async (req, res) => {
  try {
    const { conversationId, senderId, senderName, question, options } = req.body || {};
    if (!mongoose.isValidObjectId(conversationId)) return res.status(400).json({ error: 'Conversacion invalida.' });
    if (!question || !Array.isArray(options) || options.length < 2 || options.length > 6) return res.status(400).json({ error: 'Encuesta requiere pregunta y 2-6 opciones.' });

    const convo = await Conversation.findById(conversationId);
    if (!convo || convo.type !== 'team') return res.status(400).json({ error: 'Encuestas solo en chats de equipo.' });

    const msg = new Message({
      conversationId, senderId: String(senderId || '').trim(),
      senderName: String(senderName || '').trim() || 'Jugador',
      content: '', msgType: 'poll',
      pollQuestion: String(question).trim().slice(0, 300),
      pollOptions: options.slice(0, 6).map((o) => ({ text: String(o).trim().slice(0, 100), votes: [] })),
      timestamp: new Date()
    });
    await msg.save();
    await Conversation.findByIdAndUpdate(conversationId, { $set: { lastMessage: `📊 ${msg.pollQuestion}`, lastSenderId: msg.senderId, lastSenderName: msg.senderName, updatedAt: msg.timestamp } });

    const payload = { id: String(msg._id), conversationId: String(conversationId), senderId: msg.senderId, senderName: msg.senderName, text: '', msgType: 'poll', pollQuestion: msg.pollQuestion, pollOptions: msg.pollOptions, pollClosed: false, timestamp: msg.timestamp.toISOString() };
    io.to(String(conversationId)).emit('receive_message', payload);
    return res.status(201).json(payload);
  } catch (e) {
    console.error('POST /polls error:', e);
    return res.status(500).json({ error: 'Error creando encuesta.' });
  }
});

// ── PATCH vote poll ──
app.patch('/polls/:messageId/vote', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, optionIndex } = req.body || {};
    if (!mongoose.isValidObjectId(messageId)) return res.status(400).json({ error: 'Mensaje invalido.' });

    const msg = await Message.findById(messageId);
    if (!msg || msg.msgType !== 'poll') return res.status(404).json({ error: 'Encuesta no encontrada.' });
    if (msg.pollClosed) return res.status(400).json({ error: 'Encuesta cerrada.' });
    if (typeof optionIndex !== 'number' || optionIndex < 0 || optionIndex >= msg.pollOptions.length) return res.status(400).json({ error: 'Opcion invalida.' });

    // remove prev votes from this user
    msg.pollOptions.forEach((opt) => { opt.votes = opt.votes.filter((v) => v !== userId); });
    msg.pollOptions[optionIndex].votes.push(userId);
    await msg.save();

    const payload = { id: String(msg._id), pollOptions: msg.pollOptions, pollClosed: msg.pollClosed };
    io.to(String(msg.conversationId)).emit('poll_update', payload);
    return res.json(payload);
  } catch (e) {
    console.error('PATCH /polls vote error:', e);
    return res.status(500).json({ error: 'Error votando.' });
  }
});

const server = createServer(app);
const io = new Server(server, { cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true } });

io.on('connection', (socket) => {
  socket.on('join_chat', (conversationId) => {
    const room = String(conversationId || '').trim();
    if (room) socket.join(room);
  });

  socket.on('send_message', async (data) => {
    const { conversationId, senderId, senderName, content, msgType, fileUrl, fileName, fileSize, fileMime, voiceDuration } = data || {};
    try {
      const room = String(conversationId || '').trim();
      const type = msgType || 'text';
      const normalizedContent = cleanMsg(content);

      if (type === 'text' && !normalizedContent) return;
      if (!mongoose.isValidObjectId(room)) return;

      const msg = new Message({
        conversationId: room,
        senderId: String(senderId || '').trim(),
        senderName: String(senderName || '').trim() || 'Jugador',
        content: normalizedContent,
        msgType: type,
        fileUrl: String(fileUrl || '').trim(),
        fileName: String(fileName || '').trim(),
        fileSize: Number(fileSize) || 0,
        fileMime: String(fileMime || '').trim(),
        voiceDuration: Number(voiceDuration) || 0,
        timestamp: new Date()
      });
      await msg.save();

      const preview = type === 'image' ? '📷 Imagen' : type === 'file' ? `📎 ${msg.fileName || 'Archivo'}` : type === 'voice' ? '🎤 Nota de voz' : normalizedContent;
      await Conversation.findByIdAndUpdate(room, { $set: { lastMessage: preview, lastSenderId: msg.senderId, lastSenderName: msg.senderName, updatedAt: msg.timestamp } });

      io.to(room).emit('receive_message', {
        id: String(msg._id), conversationId: room, senderId: msg.senderId, senderName: msg.senderName,
        text: msg.content, msgType: msg.msgType,
        fileUrl: msg.fileUrl, fileName: msg.fileName, fileSize: msg.fileSize, fileMime: msg.fileMime,
        voiceDuration: msg.voiceDuration,
        timestamp: msg.timestamp.toISOString()
      });
    } catch (e) {
      console.error('send_message error:', e);
    }
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 5001;
mongoose.connect(process.env.MONGO_URI)
  .then(() => server.listen(PORT, () => console.log(`Chat Service en puerto ${PORT}`)))
  .catch((err) => console.error('Error DB:', err));
