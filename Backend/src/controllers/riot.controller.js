import axios from 'axios';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

const RIOT_API_TIMEOUT_MS = 10000;
const OTP_EXP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 45;
const LOL_REGIONS = ['la1', 'na1', 'euw1', 'eun1', 'br1', 'kr', 'jp1', 'oc1', 'tr1', 'ru', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'];

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getRiotApiKey() {
  return String(process.env.RIOT_API_KEY || '').trim();
}

function getRiotKeyMode() {
  return String(process.env.RIOT_KEY_MODE || 'development').trim().toLowerCase();
}

function isLocalOrPrivateHost(hostname = '') {
  const host = String(hostname || '').trim().toLowerCase();
  if (!host) return false;
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
  if (host.startsWith('10.')) return true;
  if (host.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  return false;
}

function ensureRiotApiKey() {
  if (!getRiotApiKey()) {
    const err = new Error('RIOT_API_KEY no configurada');
    err.code = 'RIOT_KEY_MISSING';
    throw err;
  }

  const keyMode = getRiotKeyMode();
  const nodeEnv = String(process.env.NODE_ENV || 'development').trim().toLowerCase();
  const allowDevKeyInProd = String(process.env.ALLOW_RIOT_DEV_KEY_IN_PROD || '').trim().toLowerCase() === 'true';

  // Política de seguridad: evita exponer accidentalmente una Development/Interim key en despliegues públicos.
  if (keyMode !== 'production' && nodeEnv === 'production' && !allowDevKeyInProd) {
    const err = new Error('RIOT_KEY_MODE_RESTRICTED');
    err.code = 'RIOT_KEY_MODE_RESTRICTED';
    throw err;
  }

  if (keyMode !== 'production') {
    const frontendUrl = String(process.env.FRONTEND_URL || '').trim();
    if (frontendUrl) {
      try {
        const frontendHost = new URL(frontendUrl).hostname;
        if (!isLocalOrPrivateHost(frontendHost) && !allowDevKeyInProd) {
          const err = new Error('RIOT_KEY_MODE_RESTRICTED');
          err.code = 'RIOT_KEY_MODE_RESTRICTED';
          throw err;
        }
      } catch (_) {
        const err = new Error('RIOT_KEY_MODE_RESTRICTED');
        err.code = 'RIOT_KEY_MODE_RESTRICTED';
        throw err;
      }
    }
  }
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

async function riotGet(urlPath) {
  ensureRiotApiKey();
  return axios.get(`https://americas.api.riotgames.com${urlPath}`, {
    headers: { 'X-Riot-Token': getRiotApiKey() },
    timeout: RIOT_API_TIMEOUT_MS
  });
}

async function getAccountByRiotId(gameName, tagLine) {
  const path = `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const response = await riotGet(path);
  return response.data;
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

    user.connections.riot = {
      ...(user.connections.riot || {}),
      puuid: pending.puuid,
      gameName: pending.gameName,
      tagLine: pending.tagLine,
      accountRegion: 'americas',
      verified: true,
      linkedAt: new Date(),
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
    await User.findByIdAndUpdate(req.userId, {
      $unset: {
        'connections.riot': '',
        'gameProfiles.lol': '',
        'gameProfiles.valorant': ''
      }
    });

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
      api,
      lol: user?.gameProfiles?.lol || { exists: false },
      valorant: user?.gameProfiles?.valorant || { exists: false }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo estado de Riot' });
  }
};

// =========================
// AUTOSYNC (LoL + Valorant)
// =========================
async function autoSyncRiotGames(userId) {
  ensureRiotApiKey();

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
