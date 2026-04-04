import mongoose from 'mongoose';
import User from '../models/User.js';
import Session from '../models/Session.js';
import ActivityLog from '../models/ActivityLog.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import { recordActivity } from '../services/activityLogger.js';

// Auth Constants (Sync with auth.controller.js)
const AUTH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const AUTH_TOKEN_REMEMBER_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'auth_token';
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'csrf_token';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const normalizeSameSite = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'strict' || normalized === 'lax' || normalized === 'none') {
        return normalized;
    }
    return '';
};

const envSecure = process.env.AUTH_COOKIE_SECURE
    ? process.env.AUTH_COOKIE_SECURE === 'true'
    : IS_PRODUCTION;
const envSameSite = normalizeSameSite(process.env.AUTH_COOKIE_SAME_SITE) || (envSecure ? 'none' : 'lax');
const AUTH_COOKIE_SECURE = envSameSite === 'none' ? true : envSecure;
const AUTH_COOKIE_SAME_SITE = envSameSite;

const buildAuthCookieOptions = (ttlMs) => {
    const options = {
        httpOnly: true,
        secure: AUTH_COOKIE_SECURE,
        sameSite: AUTH_COOKIE_SAME_SITE,
        maxAge: ttlMs,
        path: '/'
    };
    if (process.env.AUTH_COOKIE_DOMAIN) {
        options.domain = process.env.AUTH_COOKIE_DOMAIN;
    }
    return options;
};

const buildCsrfCookieOptions = (ttlMs) => {
    const options = {
        httpOnly: false,
        secure: AUTH_COOKIE_SECURE,
        sameSite: 'lax',
        maxAge: ttlMs,
        path: '/'
    };
    if (process.env.AUTH_COOKIE_DOMAIN) {
        options.domain = process.env.AUTH_COOKIE_DOMAIN;
    }
    return options;
};

const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');

const SALT_ROUNDS = 10;

// ── Change Password ──
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // LOGGING: Debug exactamente qué se recibe
    console.log('[changePassword] Received:', {
      currentPassword: currentPassword ? '✓ present' : '✗ MISSING',
      newPassword: newPassword ? '✓ present' : '✗ MISSING',
      confirmPassword: confirmPassword ? '✓ present' : '✗ MISSING',
      userId: req.userId
    });
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      console.error('[changePassword] Validation failed - missing fields');
      return res.status(400).json({ message: 'Se requieren la contraseña actual, la nueva y su confirmación.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Las contraseñas no coinciden.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    }

    const user = await User.findById(req.userId).select('+password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'La nueva contraseña debe ser diferente a la actual.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const updateResult = await User.updateOne(
      { _id: req.userId },
      { $set: { password: hashedPassword, passwordChangedAt: new Date() } }
    );

    if (!updateResult.acknowledged) {
      throw new Error('MongoDB update not acknowledged');
    }

    await recordActivity({ userId: req.userId, event: 'password_change', req });
    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    console.error('[changePassword] Error:', {
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    res.status(500).json({ message: 'Error al cambiar contraseña.' });
  }
};

// ── 2FA: Generate Secret ──
export const generate2FASecret = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA ya está activo. Desactívalo primero para reconfigurarlo.' });
    }

    const secret = generateSecret();
    const uri = generateURI({ issuer: 'GlitchGang', label: user.email, secret, type: 'totp' });
    const qrCodeDataUrl = await QRCode.toDataURL(uri);

    user.twoFactorPendingSecret = secret;
    await user.save();

    res.json({ qrCodeDataUrl, manualEntryKey: secret });
  } catch (err) {
    res.status(500).json({ message: 'Error al generar secreto 2FA.' });
  }
};

// ── 2FA: Verify Setup ──
export const verify2FASetup = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Se requiere el código de verificación.' });

    const user = await User.findById(req.userId).select('+twoFactorPendingSecret');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    if (!user.twoFactorPendingSecret) {
      return res.status(400).json({ message: 'No hay configuración 2FA pendiente. Genera un nuevo secreto primero.' });
    }

    const isValid = verifySync({ token, secret: user.twoFactorPendingSecret })?.valid;
    if (!isValid) return res.status(400).json({ message: 'Código incorrecto. Inténtalo de nuevo.' });

    // Generate backup codes
    const plainCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    const hashedCodes = await Promise.all(
      plainCodes.map(code => bcrypt.hash(code, SALT_ROUNDS))
    );

    user.twoFactorSecret = user.twoFactorPendingSecret;
    user.twoFactorPendingSecret = undefined;
    user.twoFactorEnabled = true;
    user.twoFactorEnabledAt = new Date();
    user.twoFactorBackupCodes = hashedCodes;
    await user.save();

    await recordActivity({ userId: req.userId, event: '2fa_enabled', req });
    res.json({ message: '2FA activado correctamente.', backupCodes: plainCodes });
  } catch (err) {
    res.status(500).json({ message: 'Error al verificar 2FA.' });
  }
};

// ── 2FA: Disable ──
export const disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Se requiere tu contraseña para desactivar 2FA.' });

    const user = await User.findById(req.userId).select('+password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Contraseña incorrecta.' });

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorPendingSecret = undefined;
    user.twoFactorBackupCodes = [];
    user.twoFactorEnabledAt = null;
    await user.save();

    await recordActivity({ userId: req.userId, event: '2fa_disabled', req });
    res.json({ message: '2FA desactivado correctamente.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al desactivar 2FA.' });
  }
};

// ── 2FA: Regenerate Backup Codes ──
export const regenerateBackupCodes = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Se requiere un código TOTP para regenerar códigos.' });

    const user = await User.findById(req.userId).select('+twoFactorSecret');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    if (!user.twoFactorEnabled) return res.status(400).json({ message: '2FA no está activo.' });

    const isValid = verifySync({ token, secret: user.twoFactorSecret })?.valid;
    if (!isValid) return res.status(400).json({ message: 'Código TOTP incorrecto.' });

    const plainCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    const hashedCodes = await Promise.all(
      plainCodes.map(code => bcrypt.hash(code, SALT_ROUNDS))
    );

    user.twoFactorBackupCodes = hashedCodes;
    await user.save();

    res.json({ message: 'Códigos de respaldo regenerados.', backupCodes: plainCodes });
  } catch (err) {
    res.status(500).json({ message: 'Error al regenerar códigos.' });
  }
};

// ── 2FA: Verify at Login ──
export const verify2FALogin = async (req, res) => {
  try {
    const { userId, token, backupCode } = req.body;
    if (!userId) return res.status(400).json({ message: 'Falta userId.' });
    if (!token && !backupCode) return res.status(400).json({ message: 'Se requiere código TOTP o código de respaldo.' });

    const user = await User.findById(userId).select('+twoFactorSecret +twoFactorBackupCodes');
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA no está activo para este usuario.' });
    }

    let verified = false;

    if (token) {
      verified = verifySync({ token, secret: user.twoFactorSecret })?.valid;
    } else if (backupCode) {
      const upper = backupCode.toUpperCase();
      for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
        const match = await bcrypt.compare(upper, user.twoFactorBackupCodes[i]);
        if (match) {
          user.twoFactorBackupCodes.splice(i, 1);
          await user.save();
          await recordActivity({ userId, event: 'backup_code_used', req });
          verified = true;
          break;
        }
      }
    }

    if (!verified) {
      return res.status(401).json({ message: 'Código incorrecto.' });
    }

    // Generate Session (Same as login)
    const jti = crypto.randomUUID();
    const sessionTtlMs = AUTH_TOKEN_TTL_MS; // Default to standard TTL for 2FA
    const sessionTtlSeconds = Math.floor(sessionTtlMs / 1000);
    
    const sessionToken = jwt.sign(
        { id: user._id, jti },
        process.env.JWT_SECRET,
        { expiresIn: sessionTtlSeconds }
    );
    const csrfToken = generateCsrfToken();

    await Session.create({
        userId: user._id,
        jti,
        userAgent: req.headers?.['user-agent'] || '',
        ip: req.ip || '',
        expiresAt: new Date(Date.now() + sessionTtlMs),
    });

    await recordActivity({ userId: user._id, event: 'login_2fa', req });

    // Clear any stale httpOnly csrf cookie before setting the new readable one
    res.clearCookie(CSRF_COOKIE_NAME, { path: '/', httpOnly: true });
    res.clearCookie(CSRF_COOKIE_NAME, { path: '/', httpOnly: false });

    res.cookie(AUTH_COOKIE_NAME, sessionToken, buildAuthCookieOptions(sessionTtlMs));
    res.cookie(CSRF_COOKIE_NAME, csrfToken, buildCsrfCookieOptions(sessionTtlMs));

    res.json({ 
        verified: true,
        session: true,
        token: sessionToken,
        user: {
            id: user._id,
            username: user.username,
            userName: user.username
        }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al verificar 2FA.' });
  }
};

// ── 2FA Status ──
export const get2FAStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('twoFactorEnabled twoFactorEnabledAt twoFactorBackupCodes');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    res.json({
      enabled: user.twoFactorEnabled,
      enabledAt: user.twoFactorEnabledAt,
      backupCodesRemaining: user.twoFactorBackupCodes?.length || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener estado 2FA.' });
  }
};

// ── Sessions: List ──
export const listSessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      userId: req.userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ lastActiveAt: -1 }).lean();

    const currentJti = req.sessionJti || null;
    const result = sessions.map(s => ({
      id: s._id,
      deviceLabel: s.deviceLabel,
      ip: s.ip,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      isCurrent: s.jti === currentJti,
    }));

    res.json({ sessions: result });
  } catch (err) {
    res.status(500).json({ message: 'Error al listar sesiones.' });
  }
};

// ── Sessions: Revoke One ──
export const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ _id: sessionId, userId: req.userId, revokedAt: null });
    if (!session) return res.status(404).json({ message: 'Sesión no encontrada.' });

    session.revokedAt = new Date();
    await session.save();

    await recordActivity({ userId: req.userId, event: 'session_revoked', meta: { sessionId }, req });
    res.json({ message: 'Sesión cerrada.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al revocar sesión.' });
  }
};

// ── Sessions: Revoke All Others ──
export const revokeAllOtherSessions = async (req, res) => {
  try {
    const currentJti = req.sessionJti;
    const filter = { userId: req.userId, revokedAt: null };
    if (currentJti) filter.jti = { $ne: currentJti };

    const result = await Session.updateMany(filter, { revokedAt: new Date() });

    await recordActivity({ userId: req.userId, event: 'sessions_revoked_all', meta: { count: result.modifiedCount }, req });
    res.json({ message: `${result.modifiedCount} sesiones cerradas.` });
  } catch (err) {
    res.status(500).json({ message: 'Error al revocar sesiones.' });
  }
};

// ── Activity Log ──
export const getActivityLog = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find({ userId: req.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments({ userId: req.userId }),
    ]);

    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener registro de actividad.' });
  }
};

// ── Delete Account ──
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Se requiere tu contraseña para eliminar la cuenta.' });

    const user = await User.findById(req.userId).select('+password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Contraseña incorrecta.' });

    // Revoke and delete all sessions atomically with user deletion
    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        await Session.updateMany({ userId: req.userId }, { revokedAt: new Date() }, { session: dbSession });
        await Session.deleteMany({ userId: req.userId }, { session: dbSession });
        await User.findByIdAndDelete(req.userId, { session: dbSession });
      });
    } finally {
      dbSession.endSession();
    }

    await recordActivity({ userId: req.userId, event: 'account_deleted', req });
    res.json({ message: 'Cuenta eliminada permanentemente.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar cuenta.' });
  }
};
