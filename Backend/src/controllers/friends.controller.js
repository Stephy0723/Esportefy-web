import User from '../models/User.js';
import mongoose from 'mongoose';

const toId = (v) => (typeof v === 'string' ? new mongoose.Types.ObjectId(v) : v);

// ── GET /api/friends ─────────────────────────────────────────
export const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('friends')
      .populate('friends', 'username userCode avatar status country selectedFrameId selectedTagId')
      .lean();

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    res.json({ friends: user.friends || [] });
  } catch (err) {
    console.error('getFriends error:', err);
    res.status(500).json({ message: 'Error al obtener amigos.' });
  }
};

// ── GET /api/friends/requests ────────────────────────────────
export const getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('friendRequests')
      .populate('friendRequests.received.from', 'username userCode avatar status country')
      .populate('friendRequests.sent.to', 'username userCode avatar status country')
      .lean();

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    res.json({
      received: user.friendRequests?.received || [],
      sent: user.friendRequests?.sent || [],
    });
  } catch (err) {
    console.error('getFriendRequests error:', err);
    res.status(500).json({ message: 'Error al obtener solicitudes.' });
  }
};

// ── POST /api/friends/request/:userId ────────────────────────
export const sendFriendRequest = async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (String(targetId) === String(req.userId)) {
      return res.status(400).json({ message: 'No puedes enviarte una solicitud a ti mismo.' });
    }

    const [me, target] = await Promise.all([
      User.findById(req.userId).select('friends friendRequests'),
      User.findById(targetId).select('friends friendRequests privacy'),
    ]);

    if (!me || !target) return res.status(404).json({ message: 'Usuario no encontrado.' });

    // Already friends?
    if (me.friends.some(f => String(f) === String(targetId))) {
      return res.status(400).json({ message: 'Ya son amigos.' });
    }

    // Already sent?
    if (me.friendRequests?.sent?.some(r => String(r.to) === String(targetId))) {
      return res.status(400).json({ message: 'Ya enviaste una solicitud a este usuario.' });
    }

    // They already sent us a request? Auto-accept
    const incomingIdx = me.friendRequests?.received?.findIndex(r => String(r.from) === String(targetId));
    if (incomingIdx !== undefined && incomingIdx >= 0) {
      // Mutual — accept directly
      me.friends.push(toId(targetId));
      target.friends.push(toId(req.userId));

      me.friendRequests.received.splice(incomingIdx, 1);
      const sentIdx = target.friendRequests?.sent?.findIndex(r => String(r.to) === String(req.userId));
      if (sentIdx >= 0) target.friendRequests.sent.splice(sentIdx, 1);

      await Promise.all([me.save(), target.save()]);
      return res.json({ message: '¡Ahora son amigos!', status: 'accepted' });
    }

    // Send request
    me.friendRequests.sent.push({ to: toId(targetId) });
    target.friendRequests.received.push({ from: toId(req.userId) });

    // Add notification to target
    target.notifications.push({
      type: 'friend_request',
      category: 'social',
      title: 'Solicitud de amistad',
      source: me.username || 'Jugador',
      message: `${me.username || 'Un jugador'} te envió una solicitud de amistad.`,
      meta: { fromUserId: req.userId },
      visuals: { icon: 'bx-user-plus', color: '#4FACFE', glow: true },
    });

    await Promise.all([me.save(), target.save()]);
    res.json({ message: 'Solicitud enviada.', status: 'pending' });
  } catch (err) {
    console.error('sendFriendRequest error:', err);
    res.status(500).json({ message: 'Error al enviar solicitud.' });
  }
};

// ── PATCH /api/friends/accept/:requesterId ───────────────────
export const acceptFriendRequest = async (req, res) => {
  try {
    const requesterId = req.params.requesterId;

    const [me, requester] = await Promise.all([
      User.findById(req.userId).select('friends friendRequests username'),
      User.findById(requesterId).select('friends friendRequests notifications username'),
    ]);

    if (!me || !requester) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const idx = me.friendRequests?.received?.findIndex(r => String(r.from) === String(requesterId));
    if (idx === undefined || idx < 0) {
      return res.status(404).json({ message: 'Solicitud no encontrada.' });
    }

    // Add each other as friends
    me.friends.push(toId(requesterId));
    requester.friends.push(toId(req.userId));

    // Remove the request
    me.friendRequests.received.splice(idx, 1);
    const sentIdx = requester.friendRequests?.sent?.findIndex(r => String(r.to) === String(req.userId));
    if (sentIdx >= 0) requester.friendRequests.sent.splice(sentIdx, 1);

    // Notify requester
    requester.notifications.push({
      type: 'friend_accepted',
      category: 'social',
      title: 'Solicitud aceptada',
      source: me.username || 'Jugador',
      message: `${me.username || 'Un jugador'} aceptó tu solicitud de amistad.`,
      meta: { userId: req.userId },
      visuals: { icon: 'bx-user-check', color: '#8edb15', glow: true },
    });

    await Promise.all([me.save(), requester.save()]);
    res.json({ message: '¡Ahora son amigos!' });
  } catch (err) {
    console.error('acceptFriendRequest error:', err);
    res.status(500).json({ message: 'Error al aceptar solicitud.' });
  }
};

// ── PATCH /api/friends/reject/:requesterId ───────────────────
export const rejectFriendRequest = async (req, res) => {
  try {
    const requesterId = req.params.requesterId;

    const [me, requester] = await Promise.all([
      User.findById(req.userId).select('friendRequests'),
      User.findById(requesterId).select('friendRequests'),
    ]);

    if (!me) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const idx = me.friendRequests?.received?.findIndex(r => String(r.from) === String(requesterId));
    if (idx === undefined || idx < 0) {
      return res.status(404).json({ message: 'Solicitud no encontrada.' });
    }

    me.friendRequests.received.splice(idx, 1);

    if (requester) {
      const sentIdx = requester.friendRequests?.sent?.findIndex(r => String(r.to) === String(req.userId));
      if (sentIdx >= 0) requester.friendRequests.sent.splice(sentIdx, 1);
      await requester.save();
    }

    await me.save();
    res.json({ message: 'Solicitud rechazada.' });
  } catch (err) {
    console.error('rejectFriendRequest error:', err);
    res.status(500).json({ message: 'Error al rechazar solicitud.' });
  }
};

// ── DELETE /api/friends/cancel/:targetId ─────────────────────
export const cancelFriendRequest = async (req, res) => {
  try {
    const targetId = req.params.targetId;

    const [me, target] = await Promise.all([
      User.findById(req.userId).select('friendRequests'),
      User.findById(targetId).select('friendRequests'),
    ]);

    if (!me) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const sentIdx = me.friendRequests?.sent?.findIndex(r => String(r.to) === String(targetId));
    if (sentIdx === undefined || sentIdx < 0) {
      return res.status(404).json({ message: 'Solicitud no encontrada.' });
    }

    me.friendRequests.sent.splice(sentIdx, 1);

    if (target) {
      const recvIdx = target.friendRequests?.received?.findIndex(r => String(r.from) === String(req.userId));
      if (recvIdx >= 0) target.friendRequests.received.splice(recvIdx, 1);
      await target.save();
    }

    await me.save();
    res.json({ message: 'Solicitud cancelada.' });
  } catch (err) {
    console.error('cancelFriendRequest error:', err);
    res.status(500).json({ message: 'Error al cancelar solicitud.' });
  }
};

// ── DELETE /api/friends/:friendId ────────────────────────────
export const removeFriend = async (req, res) => {
  try {
    const friendId = req.params.friendId;

    const [me, friend] = await Promise.all([
      User.findById(req.userId).select('friends'),
      User.findById(friendId).select('friends'),
    ]);

    if (!me) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const myIdx = me.friends.findIndex(f => String(f) === String(friendId));
    if (myIdx < 0) return res.status(404).json({ message: 'No son amigos.' });

    me.friends.splice(myIdx, 1);

    if (friend) {
      const theirIdx = friend.friends.findIndex(f => String(f) === String(req.userId));
      if (theirIdx >= 0) friend.friends.splice(theirIdx, 1);
      await friend.save();
    }

    await me.save();
    res.json({ message: 'Amigo eliminado.' });
  } catch (err) {
    console.error('removeFriend error:', err);
    res.status(500).json({ message: 'Error al eliminar amigo.' });
  }
};
