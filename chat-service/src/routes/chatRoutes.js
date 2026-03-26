import express from 'express';
import mongoose from 'mongoose';
import { Conversation } from '../models/chat.js';

const router = express.Router();

const cleanString = (value = '') => String(value || '').trim();
const toId = (value = '') => cleanString(value);

const uniqueParticipants = (items = []) => Array.from(
  new Set(
    (Array.isArray(items) ? items : [])
      .map((item) => toId(item))
      .filter(Boolean)
  )
);

const mergeParticipantDetails = (existing = [], incoming = []) => {
  const merged = new Map();

  [...(Array.isArray(existing) ? existing : []), ...(Array.isArray(incoming) ? incoming : [])].forEach((entry) => {
    const userId = toId(entry?.userId);
    if (!userId) return;

    const prev = merged.get(userId) || { userId, username: '', fullName: '', avatar: '', role: '' };
    merged.set(userId, {
      userId,
      username: cleanString(entry?.username || prev.username),
      fullName: cleanString(entry?.fullName || prev.fullName),
      avatar: cleanString(entry?.avatar || prev.avatar),
      role: cleanString(entry?.role || prev.role)
    });
  });

  return Array.from(merged.values());
};

const validateConversationPayload = (payload = {}) => {
  const type = cleanString(payload?.type || 'individual').toLowerCase();
  const participants = uniqueParticipants(payload?.participants);

  if (!['individual', 'team'].includes(type)) {
    return { ok: false, error: 'Tipo de conversacion invalido.' };
  }

  if (type === 'individual' && participants.length !== 2) {
    return { ok: false, error: 'Los chats directos requieren exactamente 2 participantes.' };
  }

  if (type === 'team' && !cleanString(payload?.teamId)) {
    return { ok: false, error: 'Los chats de equipo requieren teamId.' };
  }

  if (participants.length === 0) {
    return { ok: false, error: 'La conversacion requiere participantes.' };
  }

  return {
    ok: true,
    normalized: {
      participants,
      type,
      teamId: cleanString(payload?.teamId),
      title: cleanString(payload?.title),
      image: cleanString(payload?.image),
      teamCode: cleanString(payload?.teamCode),
      game: cleanString(payload?.game),
      createdBy: cleanString(payload?.createdBy),
      participantDetails: mergeParticipantDetails([], payload?.participantDetails)
    }
  };
};

const buildConversationPayload = (conversation = {}) => ({
  _id: conversation?._id,
  participants: Array.isArray(conversation?.participants) ? conversation.participants : [],
  type: conversation?.type || 'individual',
  teamId: conversation?.teamId || null,
  title: conversation?.title || '',
  image: conversation?.image || '',
  teamCode: conversation?.teamCode || '',
  game: conversation?.game || '',
  createdBy: conversation?.createdBy || '',
  participantDetails: Array.isArray(conversation?.participantDetails) ? conversation.participantDetails : [],
  lastMessage: conversation?.lastMessage || '',
  lastSenderId: conversation?.lastSenderId || '',
  lastSenderName: conversation?.lastSenderName || '',
  createdAt: conversation?.createdAt || null,
  updatedAt: conversation?.updatedAt || null
});

router.get('/conversations', async (req, res) => {
  try {
    const userId = cleanString(req.query?.userId);
    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido.' });
    }

    const conversations = await Conversation.find({ participants: userId })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    return res.json(conversations.map(buildConversationPayload));
  } catch (error) {
    console.error('GET /conversations error:', error);
    return res.status(500).json({ error: 'No se pudieron cargar las conversaciones.' });
  }
});

router.get('/conversations/:conversationId', async (req, res) => {
  try {
    const conversationId = cleanString(req.params?.conversationId);
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ error: 'Conversacion invalida.' });
    }

    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation) {
      return res.status(404).json({ error: 'Conversacion no encontrada.' });
    }

    return res.json(buildConversationPayload(conversation));
  } catch (error) {
    console.error('GET /conversations/:conversationId error:', error);
    return res.status(500).json({ error: 'No se pudo cargar la conversacion.' });
  }
});

router.post('/conversations', async (req, res) => {
  try {
    const validation = validateConversationPayload(req.body || {});
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const payload = validation.normalized;

    if (payload.type === 'individual') {
      const existing = await Conversation.findOne({
        type: 'individual',
        participants: { $all: payload.participants, $size: 2 }
      });

      if (existing) {
        existing.participantDetails = mergeParticipantDetails(existing.participantDetails, payload.participantDetails);
        if (!existing.title && payload.title) existing.title = payload.title;
        if (!existing.image && payload.image) existing.image = payload.image;
        await existing.save();
        return res.json(buildConversationPayload(existing));
      }
    }

    const newConversation = new Conversation(payload);
    await newConversation.save();
    return res.status(201).json(buildConversationPayload(newConversation));
  } catch (error) {
    console.error('POST /conversations error:', error);
    return res.status(500).json({ error: 'No se pudo crear la conversacion.' });
  }
});

router.post('/conversations/ensure-team', async (req, res) => {
  try {
    const validation = validateConversationPayload({
      ...req.body,
      type: 'team'
    });
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const payload = validation.normalized;
    const updated = await Conversation.findOneAndUpdate(
      { teamId: payload.teamId },
      {
        $set: {
          participants: payload.participants,
          type: 'team',
          title: payload.title,
          image: payload.image,
          teamCode: payload.teamCode,
          game: payload.game,
          createdBy: payload.createdBy,
          participantDetails: payload.participantDetails,
          updatedAt: new Date()
        },
        $setOnInsert: {
          teamId: payload.teamId
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    return res.status(201).json(buildConversationPayload(updated));
  } catch (error) {
    console.error('POST /conversations/ensure-team error:', error);
    return res.status(500).json({ error: 'No se pudo sincronizar el chat del equipo.' });
  }
});

router.delete('/conversations/team/:teamId', async (req, res) => {
  try {
    const teamId = cleanString(req.params?.teamId);
    if (!teamId) {
      return res.status(400).json({ error: 'teamId es requerido.' });
    }

    await Conversation.deleteOne({ teamId });
    return res.status(200).json({ message: 'Chat de equipo eliminado.' });
  } catch (error) {
    console.error('DELETE /conversations/team/:teamId error:', error);
    return res.status(500).json({ error: 'No se pudo eliminar el chat del equipo.' });
  }
});

export default router;
