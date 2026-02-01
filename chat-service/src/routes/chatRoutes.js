import express from 'express';
import { Conversation } from '../models/chat.js';

const router = express.Router();

// Crear o buscar una conversación
router.post('/conversations', async (req, res) => {
  const { participants, type, teamId } = req.body;

  try {
    // 1. Buscar si ya existe una conversación con estos mismos participantes
    // (Para chats individuales)
    if (type === 'individual') {
      const existing = await Conversation.findOne({
        type: 'individual',
        participants: { $all: participants, $size: 2 }
      });
      if (existing) return res.json(existing);
    }

    // 2. Si no existe o es de equipo, crear una nueva
    const newConversation = new Conversation({
      participants,
      type,
      teamId: teamId || null
    });

    const savedConversation = await newConversation.save();
    res.status(201).json(savedConversation);
  } catch (error) {
    res.status(500).json({ error: "No se pudo crear el chat" });
  }
});

export default router;