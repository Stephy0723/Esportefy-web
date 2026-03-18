import User from '../models/User.js';
import {
  enqueueMlbbReviewEmail,
  getMlbbMailQueueStatus,
  processMlbbMailQueueOnce
} from '../services/mlbbMailQueue.js';
import { recordAdminAudit } from '../services/auditLogger.js';
import {
  MLBB_ACTIVE_STATUSES,
  isMlbbVerifiedStatus,
  normalizeMlbbVerificationStatus
} from '../utils/mlbbStatus.js';

const MAX_USER_NOTIFICATIONS = 80;
const MAX_MLBB_CLAIM_HISTORY = 12;

function parseMlbbPayload(body = {}) {
  const playerIdRaw = String(body.playerId || body.userId || '').trim();
  const zoneIdRaw = String(body.zoneId || '').trim();
  const ignRaw = String(body.ign || '').trim();

  if (!playerIdRaw || !zoneIdRaw) {
    return { ok: false, message: 'Debes completar User ID y Zone ID de Mobile Legends.' };
  }

  if (!/^\d+$/.test(playerIdRaw)) {
    return { ok: false, message: 'El User ID de MLBB debe contener solo números.' };
  }

  if (!/^\d+$/.test(zoneIdRaw)) {
    return { ok: false, message: 'El Zone ID de MLBB debe contener solo números.' };
  }

  if (playerIdRaw.length < 5 || playerIdRaw.length > 15) {
    return { ok: false, message: 'El User ID de MLBB debe tener entre 5 y 15 dígitos.' };
  }

  if (zoneIdRaw.length < 3 || zoneIdRaw.length > 6) {
    return { ok: false, message: 'El Zone ID de MLBB debe tener entre 3 y 6 dígitos.' };
  }

  return {
    ok: true,
    playerId: playerIdRaw,
    zoneId: zoneIdRaw,
    ign: ignRaw
  };
}

const getMlbbVerificationMode = () => {
  const mode = String(process.env.MLBB_VERIFICATION_MODE || 'auto').trim().toLowerCase();
  return mode === 'auto' ? 'auto' : 'manual';
};

const getMlbbLinkCooldownMs = () => {
  const seconds = Number.parseInt(String(process.env.MLBB_LINK_COOLDOWN_SECONDS || '90').trim(), 10);
  if (!Number.isFinite(seconds) || seconds <= 0) return 90_000;
  return seconds * 1000;
};

const getMlbbReviewInbox = () => {
  const inbox = String(process.env.MLBB_REVIEW_EMAIL || '').trim();
  if (inbox) return inbox;
  return String(process.env.EMAIL_USER || '').trim();
};

const getMlbbMaxAttempts24h = () => {
  const raw = Number.parseInt(String(process.env.MLBB_RISK_MAX_ATTEMPTS_24H || '4').trim(), 10);
  if (!Number.isFinite(raw) || raw < 1) return 4;
  return Math.min(raw, 20);
};

const getMlbbRejectedRetryCooldownMs = () => {
  const raw = Number.parseInt(String(process.env.MLBB_REJECT_RETRY_COOLDOWN_MINUTES || '120').trim(), 10);
  if (!Number.isFinite(raw) || raw < 0) return 120 * 60 * 1000;
  return raw * 60 * 1000;
};

const buildMlbbProfileSnapshot = (connection = {}, { now = new Date() } = {}) => {
  const playerId = String(connection?.playerId || '').trim();
  const zoneId = String(connection?.zoneId || '').trim();
  const ign = String(connection?.ign || '').trim();
  const verificationStatus = normalizeMlbbVerificationStatus(
    connection?.verificationStatus,
    connection?.verified
  );
  const verified = isMlbbVerifiedStatus(verificationStatus, connection?.verified);

  return {
    exists: Boolean(playerId && zoneId),
    playerId,
    zoneId,
    ign,
    verificationStatus,
    verified,
    lastSyncAt: now
  };
};

const syncMlbbProfileSnapshot = (user, { clear = false, now = new Date() } = {}) => {
  if (!user) return null;

  user.gameProfiles = user.gameProfiles || {};
  user.gameProfiles.mlbb = clear
    ? buildMlbbProfileSnapshot({}, { now })
    : buildMlbbProfileSnapshot(user?.connections?.mlbb || {}, { now });

  return user.gameProfiles.mlbb;
};

const pushMlbbNotification = (user, {
  title,
  message,
  type = 'info',
  category = 'mlbb',
  icon = 'bx bx-game',
  color = '#00b4d8',
  glow = false,
  meta = {},
  source = 'Esportefy MLBB',
  createdAt = new Date()
} = {}) => {
  if (!user || !title || !message) return;

  user.notifications = Array.isArray(user.notifications) ? user.notifications : [];
  user.notifications.unshift({
    type,
    category,
    title,
    source,
    message,
    status: 'unread',
    meta,
    visuals: {
      icon,
      color,
      glow
    },
    createdAt
  });

  if (user.notifications.length > MAX_USER_NOTIFICATIONS) {
    user.notifications = user.notifications.slice(0, MAX_USER_NOTIFICATIONS);
  }
};

const pushMlbbClaimHistory = (user, {
  playerId = '',
  zoneId = '',
  ign = '',
  status = 'pending',
  at = new Date(),
  reviewedBy = ''
} = {}) => {
  if (!user) return;
  const normalizedPlayerId = String(playerId || '').trim();
  const normalizedZoneId = String(zoneId || '').trim();
  if (!normalizedPlayerId || !normalizedZoneId) return;

  user.mlbbClaimHistory = Array.isArray(user.mlbbClaimHistory) ? user.mlbbClaimHistory : [];
  user.mlbbClaimHistory.unshift({
    playerId: normalizedPlayerId,
    zoneId: normalizedZoneId,
    ign: String(ign || '').trim(),
    status,
    at,
    reviewedBy: String(reviewedBy || '').trim()
  });
  if (user.mlbbClaimHistory.length > MAX_MLBB_CLAIM_HISTORY) {
    user.mlbbClaimHistory = user.mlbbClaimHistory.slice(0, MAX_MLBB_CLAIM_HISTORY);
  }
};

const countDistinctMlbbIdentitiesRecent = (history = [], now = Date.now()) => {
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const unique = new Set();
  for (const item of Array.isArray(history) ? history : []) {
    const at = new Date(item?.at || 0).getTime();
    if (!Number.isFinite(at) || now - at > thirtyDaysMs) continue;
    const playerId = String(item?.playerId || '').trim();
    const zoneId = String(item?.zoneId || '').trim();
    if (!playerId || !zoneId) continue;
    unique.add(`${playerId}::${zoneId}`);
  }
  return unique.size;
};

const buildMlbbRiskContext = (user, payload, { previousOwner = null } = {}) => {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const maxAttempts24h = getMlbbMaxAttempts24h();
  const retryCooldownMs = getMlbbRejectedRetryCooldownMs();
  const current = user?.connections?.mlbb || {};

  const recentAttempts = Array.isArray(current.linkAttempts)
    ? current.linkAttempts
      .map((value) => new Date(value).getTime())
      .filter((time) => Number.isFinite(time) && now - time <= oneDayMs)
    : [];

  const nextAttemptCount24h = recentAttempts.length + 1;
  const signals = [];

  if (nextAttemptCount24h > maxAttempts24h) {
    signals.push('too_many_attempts_24h');
  }

  const previousStatus = normalizeMlbbVerificationStatus(current.verificationStatus, current.verified);
  const previousPlayerId = String(current.playerId || '').trim();
  const previousZoneId = String(current.zoneId || '').trim();
  const incomingPlayerId = String(payload?.playerId || '').trim();
  const incomingZoneId = String(payload?.zoneId || '').trim();

  if (isMlbbVerifiedStatus(previousStatus, current.verified)) {
    if (previousPlayerId && previousZoneId && (previousPlayerId !== incomingPlayerId || previousZoneId !== incomingZoneId)) {
      signals.push('identity_change_after_verified');
    }
  }

  if (previousStatus === 'rejected' && current.reviewedAt) {
    const lastReviewedAt = new Date(current.reviewedAt).getTime();
    if (Number.isFinite(lastReviewedAt) && now - lastReviewedAt < retryCooldownMs) {
      signals.push('retry_after_reject_too_soon');
    }
  }

  if (previousOwner) {
    signals.push('previous_owner_claim_elsewhere');
  }

  const recentDistinctIdentities = countDistinctMlbbIdentitiesRecent(user?.mlbbClaimHistory, now);
  if (recentDistinctIdentities >= 2 && (!previousPlayerId || !previousZoneId || `${previousPlayerId}::${previousZoneId}` !== `${incomingPlayerId}::${incomingZoneId}`)) {
    signals.push('too_many_identity_changes_30d');
  }

  recentAttempts.push(now);
  const nextAttemptDates = recentAttempts
    .slice(-20)
    .map((time) => new Date(time));

  return {
    signals,
    nextAttemptDates,
    attemptCount24h: nextAttemptCount24h,
    previousOwner: previousOwner
      ? {
          userId: String(previousOwner._id || ''),
          username: previousOwner.username || '',
          fullName: previousOwner.fullName || ''
        }
      : null
  };
};

async function ensureMlbbAccountNotLinkedElsewhere(playerId, zoneId, currentUserId) {
  const existing = await User.findOne({
    _id: { $ne: currentUserId },
    'connections.mlbb.playerId': playerId,
    'connections.mlbb.zoneId': zoneId,
    $or: [
      { 'connections.mlbb.verificationStatus': { $in: [...MLBB_ACTIVE_STATUSES] } },
      { 'connections.mlbb.verified': true }
    ]
  }).select('_id username fullName connections.mlbb.verificationStatus');

  return existing;
}

async function findHistoricalMlbbOwnerElsewhere(playerId, zoneId, currentUserId) {
  const existing = await User.findOne({
    _id: { $ne: currentUserId },
    mlbbClaimHistory: {
      $elemMatch: {
        playerId,
        zoneId,
        status: { $in: ['verified_auto', 'verified_manual', 'unlinked'] }
      }
    }
  }).select('_id username fullName mlbbClaimHistory');

  return existing;
}

export const validateMlbbId = async (req, res) => {
  try {
    const parsed = parseMlbbPayload(req.body);
    if (!parsed.ok) {
      return res.status(400).json({ ok: false, message: parsed.message });
    }

    const existing = await ensureMlbbAccountNotLinkedElsewhere(parsed.playerId, parsed.zoneId, req.userId);
    if (existing) {
      return res.status(409).json({
        ok: false,
        message: 'Esta cuenta de Mobile Legends ya está vinculada a otro usuario.'
      });
    }

    return res.json({
      ok: true,
      message: 'MLBB ID válido.',
      account: {
        playerId: parsed.playerId,
        zoneId: parsed.zoneId
      },
      mode: getMlbbVerificationMode()
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error validando cuenta de Mobile Legends.' });
  }
};

export const linkMlbbAccount = async (req, res) => {
  try {
    const parsed = parseMlbbPayload(req.body);
    if (!parsed.ok) {
      return res.status(400).json({ message: parsed.message });
    }

    const user = await User.findById(req.userId).select('email username fullName connections.mlbb gameProfiles.mlbb notifications mlbbClaimHistory');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const existing = await ensureMlbbAccountNotLinkedElsewhere(parsed.playerId, parsed.zoneId, req.userId);
    if (existing) {
      return res.status(409).json({ message: 'Esta cuenta de Mobile Legends ya está vinculada a otro usuario.' });
    }
    const previousOwner = await findHistoricalMlbbOwnerElsewhere(parsed.playerId, parsed.zoneId, req.userId);

    const mode = getMlbbVerificationMode();
    const isAuto = mode === 'auto';
    const now = Date.now();
    const lastRequestAt = user?.connections?.mlbb?.reviewRequestedAt
      ? new Date(user.connections.mlbb.reviewRequestedAt).getTime()
      : 0;
    const cooldownMs = getMlbbLinkCooldownMs();

    if (!isAuto && lastRequestAt && now - lastRequestAt < cooldownMs) {
      const waitSeconds = Math.ceil((cooldownMs - (now - lastRequestAt)) / 1000);
      return res.status(429).json({
        message: `Ya enviaste una solicitud recientemente. Espera ${waitSeconds}s antes de reenviar.`
      });
    }

    const riskContext = buildMlbbRiskContext(user, parsed, { previousOwner });
    const needsManualReview = !isAuto || riskContext.signals.length > 0;
    const nextStatus = needsManualReview
      ? 'pending'
      : 'verified_auto';
    const nowDate = new Date();

    user.connections = user.connections || {};
    user.connections.mlbb = {
      ...(user.connections.mlbb || {}),
      playerId: parsed.playerId,
      zoneId: parsed.zoneId,
      ign: parsed.ign || user.connections?.mlbb?.ign || '',
      verified: isMlbbVerifiedStatus(nextStatus),
      verificationStatus: nextStatus,
      reviewRequestedAt: nowDate,
      reviewedAt: needsManualReview ? null : nowDate,
      reviewedBy: needsManualReview ? '' : 'system:auto',
      rejectReason: '',
      linkedAt: needsManualReview ? null : nowDate,
      linkAttempts: riskContext.nextAttemptDates,
      riskFlags: riskContext.signals
    };
    pushMlbbClaimHistory(user, {
      playerId: parsed.playerId,
      zoneId: parsed.zoneId,
      ign: parsed.ign || user.connections?.mlbb?.ign || '',
      status: nextStatus,
      at: nowDate,
      reviewedBy: needsManualReview ? '' : 'system:auto'
    });
    syncMlbbProfileSnapshot(user, { now: nowDate });

    pushMlbbNotification(user, needsManualReview
      ? {
          title: 'Solicitud MLBB enviada',
          message: 'Tu cuenta de Mobile Legends quedó en revisión.',
          meta: {
            playerId: parsed.playerId,
            zoneId: parsed.zoneId,
            status: nextStatus,
            riskFlags: riskContext.signals
          }
        }
      : {
          title: 'Cuenta MLBB vinculada',
          message: 'Tu cuenta de Mobile Legends quedó verificada en Esportefy.',
          type: 'success',
          color: '#22c55e',
          glow: true,
          meta: {
            playerId: parsed.playerId,
            zoneId: parsed.zoneId,
            status: nextStatus
          }
        });

    await user.save();

    if (needsManualReview) {
      await enqueueMlbbReviewEmail({
        userId: String(user._id),
        username: user?.username || '',
        fullName: user?.fullName || '',
        email: user?.email || '',
        playerId: parsed.playerId,
        zoneId: parsed.zoneId,
        ign: parsed.ign || '',
        riskFlags: riskContext.signals
      });
    }

    return res.json({
      message: needsManualReview
        ? (isAuto
          ? 'Solicitud enviada a revisión MLBB por control de riesgo.'
          : 'Solicitud enviada. Tu cuenta MLBB quedó en revisión.')
        : 'Cuenta de Mobile Legends vinculada automáticamente.',
      status: user.connections.mlbb.verificationStatus,
      account: {
        playerId: parsed.playerId,
        zoneId: parsed.zoneId,
        ign: parsed.ign || ''
      },
      mode,
      risk: {
        manualReview: needsManualReview,
        attemptCount24h: riskContext.attemptCount24h,
        flags: riskContext.signals
      }
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Esta cuenta de Mobile Legends ya está vinculada a otro usuario.' });
    }
    return res.status(500).json({ message: 'Error al vincular cuenta de Mobile Legends.' });
  }
};

export const mlbbOpsStatus = async (req, res) => {
  try {
    const admin = await User.findById(req.userId).select('isAdmin');
    if (!admin?.isAdmin) {
      return res.status(403).json({ message: 'No autorizado. Solo administradores.' });
    }

    const queue = await getMlbbMailQueueStatus();
    return res.json({
      mode: getMlbbVerificationMode(),
      reviewInbox: getMlbbReviewInbox() || null,
      queue
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo estado operativo MLBB.' });
  }
};

export const processMlbbOpsQueue = async (req, res) => {
  try {
    const admin = await User.findById(req.userId).select('isAdmin');
    if (!admin?.isAdmin) {
      return res.status(403).json({ message: 'No autorizado. Solo administradores.' });
    }
    const result = await processMlbbMailQueueOnce();
    return res.json({
      message: 'Procesamiento de cola MLBB ejecutado.',
      result
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error procesando cola MLBB.' });
  }
};

export const unlinkMlbbAccount = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('connections.mlbb gameProfiles.mlbb notifications mlbbClaimHistory');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const current = user?.connections?.mlbb || {};
    const hadLinkedAccount = Boolean(
      String(current?.playerId || '').trim()
      || String(current?.zoneId || '').trim()
      || normalizeMlbbVerificationStatus(current?.verificationStatus, current?.verified) !== 'unlinked'
    );

    user.connections = user.connections || {};
    if (typeof user.set === 'function') {
      user.set('connections.mlbb', undefined);
    } else {
      delete user.connections.mlbb;
    }

    const nowDate = new Date();
    if (hadLinkedAccount) {
      pushMlbbClaimHistory(user, {
        playerId: current?.playerId || '',
        zoneId: current?.zoneId || '',
        ign: current?.ign || '',
        status: 'unlinked',
        at: nowDate
      });
    }
    syncMlbbProfileSnapshot(user, { clear: true, now: nowDate });

    if (hadLinkedAccount) {
      pushMlbbNotification(user, {
        title: 'Cuenta MLBB desvinculada',
        message: 'Tu cuenta de Mobile Legends fue desvinculada.',
        color: '#f97316',
        meta: {
          action: 'unlink'
        },
        createdAt: nowDate
      });
    }

    await user.save();
    return res.json({ message: 'Cuenta de Mobile Legends desvinculada.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al desvincular cuenta de Mobile Legends.' });
  }
};

export const mlbbStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('connections.mlbb gameProfiles.mlbb');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const status = normalizeMlbbVerificationStatus(
      user?.connections?.mlbb?.verificationStatus,
      user?.connections?.mlbb?.verified
    );
    const linked = Boolean(
      isMlbbVerifiedStatus(status, user?.connections?.mlbb?.verified)
      && user?.connections?.mlbb?.playerId
      && user?.connections?.mlbb?.zoneId
    );
    const review = {
      reviewRequestedAt: user?.connections?.mlbb?.reviewRequestedAt || null,
      reviewedAt: user?.connections?.mlbb?.reviewedAt || null,
      reviewedBy: user?.connections?.mlbb?.reviewedBy || '',
      rejectReason: user?.connections?.mlbb?.rejectReason || '',
      riskFlags: Array.isArray(user?.connections?.mlbb?.riskFlags) ? user.connections.mlbb.riskFlags : []
    };
    const profile = user?.gameProfiles?.mlbb?.lastSyncAt
      ? user.gameProfiles.mlbb
      : buildMlbbProfileSnapshot(user?.connections?.mlbb || {});

    return res.json({
      linked,
      status,
      mode: getMlbbVerificationMode(),
      account: linked
        ? {
            playerId: user.connections.mlbb.playerId,
            zoneId: user.connections.mlbb.zoneId,
            ign: user.connections.mlbb.ign || ''
          }
        : (user?.connections?.mlbb?.playerId
          ? {
              playerId: user.connections.mlbb.playerId,
              zoneId: user.connections.mlbb.zoneId,
              ign: user.connections.mlbb.ign || ''
            }
          : null),
      review,
      profile,
      api: {
        keyConfigured: false,
        reachable: null,
        message: status === 'verified_auto'
            ? 'Cuenta MLBB verificada automáticamente por reglas de riesgo.'
            : status === 'verified_manual'
              ? 'Cuenta MLBB verificada manualmente por el equipo admin.'
              : linked
                ? 'Cuenta MLBB verificada en Esportefy.'
          : status === 'pending'
            ? 'Tu verificación MLBB está en revisión.'
            : status === 'rejected'
              ? 'Tu verificación MLBB fue rechazada. Corrige tus datos y vuelve a enviar.'
              : 'Sin cuenta MLBB vinculada.'
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo estado de Mobile Legends.' });
  }
};

export const listPendingMlbbReviews = async (req, res) => {
  try {
    const admin = await User.findById(req.userId).select('isAdmin');
    if (!admin?.isAdmin) {
      return res.status(403).json({ message: 'No autorizado. Solo administradores.' });
    }

    const rawLimit = Number(req.query?.limit);
    const limit = Number.isFinite(rawLimit)
      ? Math.max(1, Math.min(200, Math.trunc(rawLimit)))
      : 50;

    const users = await User.find(
      { 'connections.mlbb.verificationStatus': 'pending' },
      {
        username: 1,
        fullName: 1,
        email: 1,
        'connections.mlbb.playerId': 1,
        'connections.mlbb.zoneId': 1,
        'connections.mlbb.ign': 1,
        'connections.mlbb.reviewRequestedAt': 1,
        'connections.mlbb.riskFlags': 1,
        createdAt: 1
      }
    )
      .sort({ 'connections.mlbb.reviewRequestedAt': 1, createdAt: 1 })
      .limit(limit);

    const items = users.map((u) => ({
      userId: String(u._id),
      username: u.username || '',
      fullName: u.fullName || '',
      email: u.email || '',
      playerId: u?.connections?.mlbb?.playerId || '',
      zoneId: u?.connections?.mlbb?.zoneId || '',
      ign: u?.connections?.mlbb?.ign || '',
      riskFlags: Array.isArray(u?.connections?.mlbb?.riskFlags) ? u.connections.mlbb.riskFlags : [],
      reviewRequestedAt: u?.connections?.mlbb?.reviewRequestedAt || u.createdAt || null
    }));

    return res.json({
      total: items.length,
      items
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo solicitudes pendientes MLBB.' });
  }
};

export const reviewMlbbLink = async (req, res) => {
  try {
    const { userId } = req.params;
    const action = String(req.body?.action || '').trim().toLowerCase();
    const reason = String(req.body?.reason || '').trim();

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Acción inválida. Usa approve o reject.' });
    }

    const admin = await User.findById(req.userId).select('isAdmin');
    if (!admin?.isAdmin) {
      return res.status(403).json({ message: 'No autorizado. Solo administradores.' });
    }

    const target = await User.findById(userId).select('connections.mlbb gameProfiles.mlbb notifications username fullName mlbbClaimHistory');
    if (!target) return res.status(404).json({ message: 'Usuario objetivo no encontrado.' });

    const currentStatus = String(target?.connections?.mlbb?.verificationStatus || '');
    if (currentStatus !== 'pending') {
      return res.status(400).json({ message: 'La cuenta MLBB del usuario no está pendiente de revisión.' });
    }

    const nowDate = new Date();

    if (action === 'approve') {
      const playerId = String(target?.connections?.mlbb?.playerId || '').trim();
      const zoneId = String(target?.connections?.mlbb?.zoneId || '').trim();
      if (!playerId || !zoneId) {
        return res.status(400).json({ message: 'La solicitud MLBB no tiene un User ID y Zone ID válidos.' });
      }

      const existing = await ensureMlbbAccountNotLinkedElsewhere(playerId, zoneId, userId);
      if (existing) {
        return res.status(409).json({ message: 'Esta cuenta de Mobile Legends ya está vinculada a otro usuario.' });
      }

      target.connections.mlbb = {
        ...(target.connections.mlbb || {}),
        verified: true,
        verificationStatus: 'verified_manual',
        reviewedAt: nowDate,
        reviewedBy: String(req.userId),
        rejectReason: '',
        linkedAt: nowDate,
        riskFlags: []
      };
      pushMlbbClaimHistory(target, {
        playerId,
        zoneId,
        ign: target?.connections?.mlbb?.ign || '',
        status: 'verified_manual',
        at: nowDate,
        reviewedBy: String(req.userId)
      });
      syncMlbbProfileSnapshot(target, { now: nowDate });
      pushMlbbNotification(target, {
        title: 'Cuenta MLBB aprobada',
        message: 'Tu cuenta de Mobile Legends fue aprobada por el equipo de Esportefy.',
        type: 'success',
        color: '#22c55e',
        glow: true,
        meta: {
          action: 'approve',
          playerId,
          zoneId,
          status: 'verified_manual'
        },
        createdAt: nowDate
      });
    } else {
      target.connections.mlbb = {
        ...(target.connections.mlbb || {}),
        verified: false,
        verificationStatus: 'rejected',
        reviewedAt: nowDate,
        reviewedBy: String(req.userId),
        rejectReason: reason || 'Solicitud rechazada por revisión interna.',
        linkedAt: null
      };
      pushMlbbClaimHistory(target, {
        playerId: String(target?.connections?.mlbb?.playerId || '').trim(),
        zoneId: String(target?.connections?.mlbb?.zoneId || '').trim(),
        ign: String(target?.connections?.mlbb?.ign || '').trim(),
        status: 'rejected',
        at: nowDate,
        reviewedBy: String(req.userId)
      });
      syncMlbbProfileSnapshot(target, { now: nowDate });
      pushMlbbNotification(target, {
        title: 'Cuenta MLBB rechazada',
        message: reason || 'Tu verificación de Mobile Legends fue rechazada. Revisa tus datos y vuelve a intentarlo.',
        color: '#ef4444',
        glow: true,
        meta: {
          action: 'reject',
          playerId: String(target?.connections?.mlbb?.playerId || '').trim(),
          zoneId: String(target?.connections?.mlbb?.zoneId || '').trim(),
          reason: reason || 'Solicitud rechazada por revisión interna.',
          status: 'rejected'
        },
        createdAt: nowDate
      });
    }

    await target.save();

    await recordAdminAudit({
      actorUserId: req.userId,
      action: action === 'approve' ? 'mlbb.review.approve' : 'mlbb.review.reject',
      entityType: 'user',
      entityId: String(target._id),
      meta: {
        reviewStatus: target.connections.mlbb.verificationStatus,
        playerId: target?.connections?.mlbb?.playerId || '',
        zoneId: target?.connections?.mlbb?.zoneId || '',
        reason: action === 'reject' ? (reason || target?.connections?.mlbb?.rejectReason || '') : ''
      },
      req
    });

    return res.json({
      message: action === 'approve' ? 'Cuenta MLBB aprobada.' : 'Cuenta MLBB rechazada.',
      status: target.connections.mlbb.verificationStatus
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Esta cuenta de Mobile Legends ya está vinculada a otro usuario.' });
    }
    return res.status(500).json({ message: 'Error procesando revisión de MLBB.' });
  }
};
