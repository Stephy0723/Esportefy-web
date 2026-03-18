import axios from 'axios';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import { createOAuthState, consumeOAuthState } from '../services/oauthStateStore.js';
import {
  RIOT_API_TIMEOUT_MS,
  ensureRiotApiAccess,
  getRiotAccountByRiotId,
  getRiotApiKey,
  riotAmericasGet
} from '../utils/riotApi.js';
const RIOT_RSO_STATE_TTL_MS = 10 * 60 * 1000;
const OTP_EXP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 45;
const LOL_REGIONS = ['la1', 'na1', 'euw1', 'eun1', 'br1', 'kr', 'jp1', 'oc1', 'tr1', 'ru', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'];
const MAX_RIOT_NOTIFICATIONS = 80;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function parseOAuthScopes(value = '') {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function getFrontendSettingsUrl(status = 'error', message = '') {
  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
  const url = new URL('/settings', frontendBase);
  url.searchParams.set('oauthProvider', 'riot');
  url.searchParams.set('oauthStatus', String(status || 'error').trim().toLowerCase());
  if (message) {
    url.searchParams.set('oauthMessage', String(message || '').slice(0, 180));
  }
  return url.toString();
}

function getRiotRsoConfig() {
  const clientId = String(process.env.RIOT_RSO_CLIENT_ID || '').trim();
  const clientSecret = String(process.env.RIOT_RSO_CLIENT_SECRET || '').trim();
  const redirectUri = String(process.env.RIOT_RSO_REDIRECT_URI || '').trim();
  const authorizeUrl = String(process.env.RIOT_RSO_AUTHORIZE_URL || 'https://auth.riotgames.com/authorize').trim();
  const tokenUrl = String(process.env.RIOT_RSO_TOKEN_URL || 'https://auth.riotgames.com/token').trim();
  const accountMeUrl = String(process.env.RIOT_RSO_ACCOUNT_ME_URL || 'https://americas.api.riotgames.com/riot/account/v1/accounts/me').trim();
  const scopesRaw = String(process.env.RIOT_RSO_SCOPES || 'openid offline_access').trim();
  const scopes = parseOAuthScopes(scopesRaw);
  const missing = [];

  if (!clientId) missing.push('RIOT_RSO_CLIENT_ID');
  if (!clientSecret) missing.push('RIOT_RSO_CLIENT_SECRET');
  if (!redirectUri) missing.push('RIOT_RSO_REDIRECT_URI');

  return {
    clientId,
    clientSecret,
    redirectUri,
    authorizeUrl,
    tokenUrl,
    accountMeUrl,
    scopes,
    scopesRaw: scopes.join(' '),
    missing,
    enabled: missing.length === 0
  };
}

function ensureRiotRsoConfig() {
  const config = getRiotRsoConfig();
  if (!config.enabled) {
    const err = new Error(`RIOT_RSO_CONFIG_MISSING:${config.missing.join(',')}`);
    err.code = 'RIOT_RSO_CONFIG_MISSING';
    err.missing = config.missing;
    throw err;
  }
  return config;
}

function buildRiotProducts(products = {}, options = {}) {
  const baseVerified = options.baseVerified === true;
  const baseLinkedAt = options.baseLinkedAt || null;
  const lol = products?.lol || {};
  const valorant = products?.valorant || {};

  return {
    lol: {
      linked: lol?.linked === true || baseVerified,
      linkedAt: lol?.linkedAt || baseLinkedAt || null,
      lastVerifiedAt: lol?.lastVerifiedAt || baseLinkedAt || null
    },
    valorant: {
      linked: valorant?.linked === true,
      linkedAt: valorant?.linkedAt || null,
      consentRequired: valorant?.consentRequired !== false,
      consentGranted: valorant?.consentGranted === true,
      consentedAt: valorant?.consentedAt || null,
      lastVerifiedAt: valorant?.lastVerifiedAt || null,
      rsoSubject: String(valorant?.rsoSubject || '').trim(),
      scopes: Array.isArray(valorant?.scopes) ? valorant.scopes.filter(Boolean) : []
    }
  };
}

function buildRiotRsoConfigMessage(config = getRiotRsoConfig()) {
  if (config.enabled) return 'Riot Sign On listo para VALORANT.';
  return `VALORANT RSO todavía no está configurado. Faltan: ${config.missing.join(', ')}`;
}

function buildValorantRsoStatus(user) {
  const riot = user?.connections?.riot || {};
  const linked = Boolean(riot?.verified && riot?.puuid);
  const products = buildRiotProducts(riot?.products, {
    baseVerified: linked,
    baseLinkedAt: riot?.linkedAt || null
  });
  const config = getRiotRsoConfig();

  return {
    enabled: config.enabled,
    missing: config.missing,
    redirectUriConfigured: Boolean(config.redirectUri),
    scopes: config.scopes,
    linked: products.valorant.linked,
    consentRequired: products.valorant.consentRequired !== false,
    consentGranted: products.valorant.consentGranted === true,
    consentedAt: products.valorant.consentedAt || null,
    lastVerifiedAt: products.valorant.lastVerifiedAt || null,
    rsoSubject: products.valorant.rsoSubject || '',
    message: config.enabled
      ? (
        products.valorant.consentGranted === true
          ? 'VALORANT autorizado mediante Riot Sign On.'
          : 'VALORANT requiere autorización del jugador mediante Riot Sign On.'
      )
      : buildRiotRsoConfigMessage(config)
  };
}

function decodeJwtPayload(token = '') {
  const parts = String(token || '').split('.');
  if (parts.length < 2) return {};

  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch (_) {
    return {};
  }
}

async function requestRiotRsoAccessToken(code, config) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: String(code || '').trim(),
    redirect_uri: config.redirectUri,
    client_id: config.clientId
  });
  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  const response = await axios.post(config.tokenUrl, body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`
    },
    timeout: RIOT_API_TIMEOUT_MS
  });

  return response.data || {};
}

async function getRiotRsoAccountMe(accessToken, config) {
  const response = await axios.get(config.accountMeUrl, {
    headers: {
      Authorization: `Bearer ${String(accessToken || '').trim()}`
    },
    timeout: RIOT_API_TIMEOUT_MS
  });

  return response.data || {};
}

function parseRiotId(riotId) {
  const raw = String(riotId || '').trim();
  const parts = raw.split('#');

  if (parts.length !== 2) {
    return { ok: false, message: 'Riot ID inválido. Usa el formato GameName#TagLine' };
  }

  const gameName = parts[0].trim();
  const tagLine = parts[1].trim();

  if (!gameName || !tagLine) {
    return { ok: false, message: 'Riot ID inválido. GameName y TagLine son obligatorios' };
  }

  if (gameName.length < 3 || gameName.length > 16) {
    return { ok: false, message: 'GameName debe tener entre 3 y 16 caracteres' };
  }

  if (tagLine.length < 2 || tagLine.length > 10) {
    return { ok: false, message: 'TagLine debe tener entre 2 y 10 caracteres' };
  }

  return { ok: true, gameName, tagLine, normalized: `${gameName}#${tagLine}` };
}

function mapRiotAxiosError(error, fallbackMessage = 'Error en Riot API') {
  if (error?.code === 'RIOT_KEY_MISSING') {
    return {
      status: 503,
      message: 'Riot API no configurada en el servidor (RIOT_API_KEY faltante)'
    };
  }

  if (error?.code === 'RIOT_KEY_MODE_RESTRICTED') {
    return {
      status: 403,
      message: 'La key Riot en modo development/interim no puede usarse en un entorno público'
    };
  }

  const status = error?.response?.status;

  if (status === 401 || status === 403) {
    return {
      status: 503,
      message: 'La Riot API key es inválida, expiró o no tiene permisos para este endpoint'
    };
  }

  if (status === 404) {
    return {
      status: 404,
      message: 'Riot ID no encontrado'
    };
  }

  if (status === 429) {
    return {
      status: 429,
      message: 'Riot API rate limit alcanzado. Intenta de nuevo en unos minutos'
    };
  }

  if (status >= 500) {
    return {
      status: 503,
      message: 'Riot API no disponible temporalmente'
    };
  }

  return {
    status: 400,
    message: fallbackMessage
  };
}

function mapRiotRsoError(error, fallbackMessage = 'No se pudo completar Riot Sign On') {
  if (error?.code === 'RIOT_RSO_CONFIG_MISSING') {
    const missing = Array.isArray(error?.missing) ? error.missing : [];
    return {
      status: 503,
      message: missing.length > 0
        ? `VALORANT RSO no está configurado todavía. Faltan: ${missing.join(', ')}`
        : 'VALORANT RSO no está configurado todavía.'
    };
  }

  const status = Number(error?.response?.status || 0);
  if (status === 400) {
    return { status: 400, message: 'Riot rechazó el código OAuth o el callback ya expiró.' };
  }
  if (status === 401 || status === 403) {
    return { status: 503, message: 'Las credenciales RSO de Riot no son válidas o no tienen permisos.' };
  }
  if (status === 429) {
    return { status: 429, message: 'Riot Sign On alcanzó el rate limit. Intenta de nuevo en unos minutos.' };
  }
  if (status >= 500) {
    return { status: 503, message: 'Riot Sign On no está disponible temporalmente.' };
  }

  return {
    status: 400,
    message: fallbackMessage
  };
}

async function riotGet(urlPath) {
  return riotAmericasGet(urlPath);
}

async function getAccountByRiotId(gameName, tagLine) {
  return getRiotAccountByRiotId(gameName, tagLine);
}

async function sendEmailOtp(to, code) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER/EMAIL_PASS no configurados');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    to,
    from: `"Esportefy" <${process.env.EMAIL_USER}>`,
    subject: `${code} es tu código para vincular Riot`,
    html: `
      <div style="margin:0; padding:0; background:#0f1115;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1115; padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px; max-width:100%; background:#141821; border:1px solid #1f2530; border-radius:16px; overflow:hidden;">
                <tr>
                  <td style="padding:24px 28px; background:linear-gradient(135deg,#1e2a3a,#151a24); border-bottom:1px solid #1f2530;">
                    <div style="font-family:Arial, sans-serif; color:#fff; font-size:18px; font-weight:700; letter-spacing:0.5px;">
                      ESPORTEFY
                      <span style="color:#7CFF6B;">.</span>
                    </div>
                    <div style="font-family:Arial, sans-serif; color:#9aa4b2; font-size:12px; margin-top:6px;">
                      Confirmación de vinculación Riot
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px; font-family:Arial, sans-serif; color:#e7eaf0;">
                    <div style="font-size:16px; font-weight:600; color:#ffffff; margin-bottom:8px;">
                      Tu código de verificación
                    </div>
                    <div style="font-size:13px; color:#aab3c0; line-height:1.5; margin-bottom:18px;">
                      Ingresa este código en la app para confirmar la vinculación de tu cuenta Riot. Expira en ${OTP_EXP_MINUTES} minutos.
                    </div>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; margin:0 0 18px;">
                      <tr>
                        <td align="center" style="background:#0f1115; border:1px dashed #2a3444; border-radius:12px; padding:18px;">
                          <span style="font-family:Consolas, 'Courier New', monospace; font-size:34px; font-weight:700; letter-spacing:6px; color:#7CFF6B;">
                            ${code}
                          </span>
                        </td>
                      </tr>
                    </table>
                    <div style="font-size:12px; color:#7f8a99;">
                      Si no solicitaste esto, ignora este mensaje.
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 28px; border-top:1px solid #1f2530; font-family:Arial, sans-serif; font-size:11px; color:#6d7785;">
                    © ${new Date().getFullYear()} Esportefy. Todos los derechos reservados.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

async function ensureRiotAccountNotLinkedElsewhere(puuid, currentUserId) {
  const existing = await User.findOne({
    _id: { $ne: currentUserId },
    'connections.riot.puuid': puuid,
    'connections.riot.verified': true
  }).select('_id username fullName');

  return existing;
}

async function pushRiotNotification(userId, payload = {}) {
  if (!userId) return false;

  const notification = {
    ...payload,
    status: payload?.status || 'unread',
    isSaved: Boolean(payload?.isSaved),
    isArchived: Boolean(payload?.isArchived),
    createdAt: payload?.createdAt || new Date()
  };

  const result = await User.updateOne(
    { _id: userId },
    {
      $push: {
        notifications: {
          $each: [notification],
          $slice: -MAX_RIOT_NOTIFICATIONS
        }
      }
    }
  );

  return result?.modifiedCount > 0;
}

// =========================
// 1) INIT LINK (PENDING + OTP)
// =========================
export const initRiotLink = async (req, res) => {
  try {
    const parsed = parseRiotId(req.body?.riotId);
    if (!parsed.ok) {
      return res.status(400).json({ message: parsed.message });
    }

    const user = await User.findById(req.userId).select('email connections.riot');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const account = await getAccountByRiotId(parsed.gameName, parsed.tagLine);

    const alreadyLinked = await ensureRiotAccountNotLinkedElsewhere(account.puuid, req.userId);
    if (alreadyLinked) {
      return res.status(409).json({
        message: 'Esta cuenta Riot ya está vinculada a otro usuario'
      });
    }

    const pending = user?.connections?.riot?.pendingLink;
    const lastSent = pending?.lastSentAt ? new Date(pending.lastSentAt).getTime() : null;
    if (lastSent) {
      const elapsed = Math.floor((Date.now() - lastSent) / 1000);
      if (elapsed < OTP_RESEND_COOLDOWN_SECONDS) {
        return res.status(429).json({
          message: `Espera ${OTP_RESEND_COOLDOWN_SECONDS - elapsed}s para reenviar el código`
        });
      }
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXP_MINUTES * 60 * 1000);

    user.connections = user.connections || {};
    user.connections.riot = user.connections.riot || {};
    user.connections.riot.pendingLink = {
      otpHash,
      expiresAt,
      puuid: account.puuid,
      gameName: account.gameName || parsed.gameName,
      tagLine: account.tagLine || parsed.tagLine,
      attempts: 0,
      lastSentAt: new Date()
    };

    await user.save();
    await sendEmailOtp(user.email, otp);

    return res.json({
      message: 'Código enviado. Revisa tu correo para confirmar la vinculación de Riot.',
      expiresInSeconds: OTP_EXP_MINUTES * 60
    });
  } catch (error) {
    console.error('INIT RIOT LINK ERROR:', error.response?.data || error.message);
    const mapped = mapRiotAxiosError(error, 'No se pudo iniciar la vinculación Riot');
    return res.status(mapped.status).json({ message: mapped.message });
  }
};

// =========================
// 1.5) VALIDATE RIOT ID (NO LINK)
// =========================
export const validateRiotId = async (req, res) => {
  try {
    const parsed = parseRiotId(req.body?.riotId);
    if (!parsed.ok) {
      return res.status(400).json({ ok: false, message: parsed.message });
    }

    const account = await getAccountByRiotId(parsed.gameName, parsed.tagLine);

    const alreadyLinked = await ensureRiotAccountNotLinkedElsewhere(account.puuid, req.userId);
    if (alreadyLinked) {
      return res.status(409).json({
        ok: false,
        message: 'Esta cuenta Riot ya está vinculada a otro usuario'
      });
    }

    return res.json({
      ok: true,
      message: 'Riot ID válido',
      riotId: `${account.gameName || parsed.gameName}#${account.tagLine || parsed.tagLine}`
    });
  } catch (error) {
    const mapped = mapRiotAxiosError(error, 'Riot ID no válido');
    return res.status(mapped.status).json({ ok: false, message: mapped.message });
  }
};

// =========================
// 2) CONFIRM LINK (OTP -> LINK + AUTOSYNC)
// =========================
export const confirmRiotLink = async (req, res) => {
  try {
    const otp = String(req.body?.otp || '').trim();
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Código inválido. Debe tener 6 dígitos' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const pending = user?.connections?.riot?.pendingLink;
    if (!pending?.otpHash || !pending?.expiresAt) {
      return res.status(400).json({ message: 'No hay vinculación pendiente' });
    }

    if (new Date() > new Date(pending.expiresAt)) {
      user.connections.riot.pendingLink = undefined;
      await user.save();
      return res.status(400).json({ message: 'Código expirado. Solicita uno nuevo.' });
    }

    const attempts = Number(pending.attempts || 0);
    if (attempts >= OTP_MAX_ATTEMPTS) {
      user.connections.riot.pendingLink = undefined;
      await user.save();
      return res.status(429).json({ message: 'Demasiados intentos fallidos. Solicita un nuevo código.' });
    }

    const isValidOtp = await bcrypt.compare(otp, pending.otpHash);
    if (!isValidOtp) {
      pending.attempts = attempts + 1;

      if (pending.attempts >= OTP_MAX_ATTEMPTS) {
        user.connections.riot.pendingLink = undefined;
        await user.save();
        return res.status(429).json({ message: 'Demasiados intentos fallidos. Solicita un nuevo código.' });
      }

      await user.save();
      return res.status(400).json({
        message: `Código inválido. Intentos restantes: ${OTP_MAX_ATTEMPTS - pending.attempts}`
      });
    }

    const alreadyLinked = await ensureRiotAccountNotLinkedElsewhere(pending.puuid, req.userId);
    if (alreadyLinked) {
      user.connections.riot.pendingLink = undefined;
      await user.save();
      return res.status(409).json({ message: 'Esta cuenta Riot ya está vinculada a otro usuario' });
    }

    const linkedAt = new Date();
    const existingProducts = buildRiotProducts(user?.connections?.riot?.products, {
      baseVerified: Boolean(user?.connections?.riot?.verified && user?.connections?.riot?.puuid),
      baseLinkedAt: user?.connections?.riot?.linkedAt || null
    });

    user.connections.riot = {
      ...(user.connections.riot || {}),
      puuid: pending.puuid,
      gameName: pending.gameName,
      tagLine: pending.tagLine,
      accountRegion: 'americas',
      verified: true,
      linkedAt,
      products: {
        lol: {
          ...existingProducts.lol,
          linked: true,
          linkedAt: existingProducts.lol.linkedAt || linkedAt,
          lastVerifiedAt: linkedAt
        },
        valorant: {
          ...existingProducts.valorant,
          consentRequired: true
        }
      },
      pendingLink: undefined
    };

    await user.save();

    let syncResult = {
      ok: false,
      warning: 'Riot vinculado, pero no se pudo sincronizar automáticamente'
    };

    try {
      syncResult = await autoSyncRiotGames(req.userId);
    } catch (syncError) {
      const mapped = mapRiotAxiosError(syncError, 'No se pudo sincronizar automáticamente');
      syncResult = {
        ok: false,
        warning: mapped.message
      };
    }

    await pushRiotNotification(req.userId, {
      type: 'success',
      category: 'riot',
      title: 'Cuenta Riot vinculada',
      source: 'Conexiones',
      message: syncResult?.warning
        ? `Tu cuenta Riot quedó vinculada, pero la sincronización automática reportó: ${syncResult.warning}`
        : `Tu cuenta Riot ${pending.gameName}#${pending.tagLine} quedó vinculada correctamente en Esportefy.`,
      meta: {
        riotId: `${pending.gameName}#${pending.tagLine}`,
        syncOk: syncResult?.ok === true,
        syncWarning: syncResult?.warning || ''
      },
      visuals: {
        icon: 'bx bx-link',
        color: '#06d6a0',
        glow: true
      }
    });

    return res.json({
      message: 'Riot vinculado correctamente',
      sync: syncResult
    });
  } catch (error) {
    console.error('CONFIRM RIOT LINK ERROR:', error.response?.data || error.message);
    const mapped = mapRiotAxiosError(error, 'Error confirmando vinculación Riot');
    return res.status(mapped.status).json({ message: mapped.message });
  }
};

// =========================
// UNLINK
// =========================
export const unlinkRiotAccount = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('connections.riot');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const riot = user?.connections?.riot || {};
    const hadLinkedRiot = Boolean(
      riot?.verified
      || riot?.puuid
      || riot?.pendingLink?.puuid
      || riot?.products?.valorant?.consentGranted === true
    );
    const riotId = riot?.gameName && riot?.tagLine ? `${riot.gameName}#${riot.tagLine}` : '';

    await User.findByIdAndUpdate(req.userId, {
      $unset: {
        'connections.riot': '',
        'gameProfiles.lol': '',
        'gameProfiles.valorant': ''
      }
    });

    if (hadLinkedRiot) {
      await pushRiotNotification(req.userId, {
        type: 'info',
        category: 'riot',
        title: 'Cuenta Riot desvinculada',
        source: 'Conexiones',
        message: riotId
          ? `Tu cuenta Riot ${riotId} fue desvinculada de Esportefy.`
          : 'Tu cuenta Riot fue desvinculada de Esportefy.',
        meta: {
          riotId,
          action: 'unlink'
        },
        visuals: {
          icon: 'bx bx-unlink',
          color: '#f97316',
          glow: false
        }
      });
    }

    return res.json({ message: 'Riot desvinculado' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al desvincular Riot' });
  }
};

// =========================
// Sync manual
// =========================
export const syncRiotNow = async (req, res) => {
  try {
    const result = await autoSyncRiotGames(req.userId);
    const status = result.ok ? 200 : 400;
    return res.status(status).json({ message: 'Sync ejecutado', result });
  } catch (error) {
    const mapped = mapRiotAxiosError(error, 'Error al sincronizar Riot');
    return res.status(mapped.status).json({ message: mapped.message, result: { ok: false } });
  }
};

// =========================
// Riot status for prototype/debug
// =========================
export const riotStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('connections.riot gameProfiles.lol gameProfiles.valorant');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const keyConfigured = Boolean(getRiotApiKey());
    const linked = Boolean(user?.connections?.riot?.verified && user?.connections?.riot?.puuid);

    const api = {
      keyConfigured,
      reachable: null,
      message: keyConfigured ? 'RIOT_API_KEY configurada' : 'RIOT_API_KEY no configurada'
    };
    const products = buildRiotProducts(user?.connections?.riot?.products, {
      baseVerified: linked,
      baseLinkedAt: user?.connections?.riot?.linkedAt || null
    });

    if (keyConfigured && linked) {
      try {
        await riotGet(`/riot/account/v1/accounts/by-puuid/${encodeURIComponent(user.connections.riot.puuid)}`);
        api.reachable = true;
        api.message = 'Conexión con Riot API activa';
      } catch (error) {
        const mapped = mapRiotAxiosError(error, 'No se pudo verificar Riot API');
        api.reachable = false;
        api.message = mapped.message;
      }
    }

    return res.json({
      linked,
      riotId: linked ? `${user.connections.riot.gameName}#${user.connections.riot.tagLine}` : '',
      products,
      valorantRso: buildValorantRsoStatus(user),
      api,
      lol: user?.gameProfiles?.lol || { exists: false },
      valorant: user?.gameProfiles?.valorant || { exists: false }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo estado de Riot' });
  }
};

// =========================
// VALORANT RSO
// =========================
export const valorantRsoStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('connections.riot');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const riotLinked = Boolean(user?.connections?.riot?.verified && user?.connections?.riot?.puuid);
    return res.json({
      riotLinked,
      riotId: riotLinked ? `${user.connections.riot.gameName}#${user.connections.riot.tagLine}` : '',
      rso: buildValorantRsoStatus(user)
    });
  } catch (_) {
    return res.status(500).json({ message: 'Error obteniendo estado RSO de VALORANT' });
  }
};

export const startValorantRso = async (req, res) => {
  try {
    const config = ensureRiotRsoConfig();
    const state = await createOAuthState('riot-valorant', { userId: String(req.userId) }, RIOT_RSO_STATE_TTL_MS);
    const authorizeUrl = new URL(config.authorizeUrl);

    authorizeUrl.searchParams.set('client_id', config.clientId);
    authorizeUrl.searchParams.set('redirect_uri', config.redirectUri);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('scope', config.scopesRaw);
    authorizeUrl.searchParams.set('state', state);

    return res.status(200).json({
      authorizeUrl: authorizeUrl.toString(),
      message: 'Redirigiendo a Riot Sign On para autorizar VALORANT.'
    });
  } catch (error) {
    const mapped = mapRiotRsoError(error, 'No se pudo iniciar Riot Sign On para VALORANT.');
    return res.status(mapped.status).json({ message: mapped.message });
  }
};

export const valorantRsoCallback = async (req, res) => {
  const providerError = String(req.query?.error || '').trim();
  const providerErrorDescription = String(req.query?.error_description || '').trim();
  const code = String(req.query?.code || '').trim();
  const state = String(req.query?.state || '').trim();

  if (providerError) {
    return res.redirect(getFrontendSettingsUrl('error', providerErrorDescription || 'Riot canceló la autorización.'));
  }

  if (!code || !state) {
    return res.redirect(getFrontendSettingsUrl('error', 'Callback inválido de Riot Sign On.'));
  }

  try {
    const storedState = await consumeOAuthState('riot-valorant', state);
    if (!storedState?.userId) {
      return res.redirect(getFrontendSettingsUrl('error', 'La solicitud de Riot Sign On expiró o no es válida.'));
    }

    const config = ensureRiotRsoConfig();
    const user = await User.findById(storedState.userId);
    if (!user) {
      return res.redirect(getFrontendSettingsUrl('error', 'Usuario no encontrado para completar Riot Sign On.'));
    }

    const tokenData = await requestRiotRsoAccessToken(code, config);
    const accessToken = String(tokenData?.access_token || '').trim();
    if (!accessToken) {
      return res.redirect(getFrontendSettingsUrl('error', 'Riot no devolvió un access token válido.'));
    }

    const account = await getRiotRsoAccountMe(accessToken, config);
    const puuid = String(account?.puuid || '').trim();
    const gameName = String(account?.gameName || '').trim();
    const tagLine = String(account?.tagLine || '').trim();

    if (!puuid || !gameName || !tagLine) {
      return res.redirect(getFrontendSettingsUrl('error', 'Riot no devolvió una identidad válida para VALORANT.'));
    }

    if (user?.connections?.riot?.verified && user?.connections?.riot?.puuid && String(user.connections.riot.puuid) !== puuid) {
      return res.redirect(getFrontendSettingsUrl('error', 'La cuenta Riot autorizada no coincide con la ya vinculada en Esportefy.'));
    }

    const alreadyLinked = await ensureRiotAccountNotLinkedElsewhere(puuid, user._id);
    if (alreadyLinked) {
      return res.redirect(getFrontendSettingsUrl('error', 'Esta cuenta Riot ya está vinculada a otro usuario.'));
    }

    const now = new Date();
    const existingProducts = buildRiotProducts(user?.connections?.riot?.products, {
      baseVerified: Boolean(user?.connections?.riot?.verified && user?.connections?.riot?.puuid),
      baseLinkedAt: user?.connections?.riot?.linkedAt || null
    });
    const decodedIdToken = decodeJwtPayload(tokenData?.id_token);
    const scopes = parseOAuthScopes(tokenData?.scope || config.scopesRaw);

    user.connections = user.connections || {};
    user.connections.riot = {
      ...(user.connections.riot || {}),
      puuid,
      gameName,
      tagLine,
      accountRegion: 'americas',
      verified: true,
      linkedAt: user?.connections?.riot?.linkedAt || now,
      products: {
        lol: {
          ...existingProducts.lol
        },
        valorant: {
          ...existingProducts.valorant,
          linked: true,
          linkedAt: existingProducts.valorant.linkedAt || now,
          consentRequired: true,
          consentGranted: true,
          consentedAt: now,
          lastVerifiedAt: now,
          rsoSubject: String(decodedIdToken?.sub || puuid).trim(),
          scopes
        }
      },
      pendingLink: undefined
    };

    await user.save();

    if (getRiotApiKey()) {
      try {
        await autoSyncRiotGames(user._id);
      } catch (_) {
        // RSO consent should succeed even if sync is unavailable.
      }
    }

    await pushRiotNotification(user._id, {
      type: 'success',
      category: 'riot',
      title: 'VALORANT autorizado',
      source: 'Riot Sign On',
      message: `Tu cuenta Riot ${gameName}#${tagLine} ya autorizó VALORANT mediante Riot Sign On.`,
      meta: {
        riotId: `${gameName}#${tagLine}`,
        action: 'valorant-rso',
        consentGranted: true
      },
      visuals: {
        icon: 'bx bx-badge-check',
        color: '#22c55e',
        glow: true
      }
    });

    return res.redirect(getFrontendSettingsUrl('connected', 'VALORANT quedó autorizado mediante Riot Sign On.'));
  } catch (error) {
    const mapped = mapRiotRsoError(error, 'No se pudo completar Riot Sign On para VALORANT.');
    return res.redirect(getFrontendSettingsUrl('error', mapped.message));
  }
};

// =========================
// AUTOSYNC (LoL + Valorant)
// =========================
async function autoSyncRiotGames(userId) {
  ensureRiotApiAccess();

  const user = await User.findById(userId);
  const puuid = user?.connections?.riot?.puuid;
  if (!user) return { ok: false, reason: 'Usuario no encontrado' };
  if (!puuid) return { ok: false, reason: 'No hay cuenta Riot vinculada' };

  const out = {
    ok: true,
    syncedAt: new Date().toISOString(),
    lol: { exists: false, note: '' },
    valorant: { exists: false, note: '' }
  };

  let lolSynced = false;

  for (const region of LOL_REGIONS) {
    try {
      const summonerRes = await axios.get(
        `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
        {
          headers: { 'X-Riot-Token': getRiotApiKey() },
          timeout: RIOT_API_TIMEOUT_MS
        }
      );

      const summoner = summonerRes.data;

      let rank = null;
      try {
        const leagueRes = await axios.get(
          `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`,
          {
            headers: { 'X-Riot-Token': getRiotApiKey() },
            timeout: RIOT_API_TIMEOUT_MS
          }
        );

        const solo = (leagueRes.data || []).find((q) => q.queueType === 'RANKED_SOLO_5x5');
        if (solo) {
          rank = {
            tier: solo.tier,
            division: solo.rank,
            lp: solo.leaguePoints
          };
        }
      } catch (_) {
        rank = null;
      }

      user.gameProfiles = user.gameProfiles || {};
      user.gameProfiles.lol = {
        exists: true,
        platformRegion: region,
        summonerId: summoner.id,
        profileIconId: summoner.profileIconId,
        summonerLevel: summoner.summonerLevel,
        rank,
        lastSyncAt: new Date()
      };

      out.lol = { exists: true, region, note: rank ? 'Sincronizado con rank' : 'Sincronizado (sin rank)' };
      lolSynced = true;
      break;
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        out.lol = { exists: false, note: 'Riot key inválida/expirada o sin permisos para LoL' };
        break;
      }
      if (status === 429) {
        out.lol = { exists: false, note: 'Rate limit alcanzado en Riot API' };
        break;
      }
    }
  }

  if (!lolSynced && !out.lol.note) {
    out.lol = { exists: false, note: 'No se encontró perfil de LoL para este Riot ID' };
  }

  if (!lolSynced) {
    user.gameProfiles = user.gameProfiles || {};
    user.gameProfiles.lol = {
      exists: false,
      platformRegion: '',
      summonerId: '',
      profileIconId: 0,
      summonerLevel: 0,
      rank: null,
      lastSyncAt: new Date()
    };
  }

  user.gameProfiles = user.gameProfiles || {};
  user.gameProfiles.valorant = {
    exists: false,
    shard: '',
    rank: null,
    lastSyncAt: new Date()
  };
  out.valorant = {
    exists: false,
    note: 'Pendiente: requiere permisos/endpoint oficial de Valorant para tu key actual'
  };

  await user.save();
  return out;
}
