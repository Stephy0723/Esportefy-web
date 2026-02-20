import axios from 'axios';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

// Helper: genera OTP 6 dígitos
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Placeholder: envía correo
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
                      Confirmacion de vinculacion Riot
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px; font-family:Arial, sans-serif; color:#e7eaf0;">
                    <div style="font-size:16px; font-weight:600; color:#ffffff; margin-bottom:8px;">
                      Tu codigo de verificacion
                    </div>
                    <div style="font-size:13px; color:#aab3c0; line-height:1.5; margin-bottom:18px;">
                      Ingresa este codigo en la app para confirmar la vinculacion de tu cuenta Riot. Expira en 10 minutos.
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

// =========================
// 1) INIT LINK (PENDING + OTP)
// =========================
export const initRiotLink = async (req, res) => {
  try {
    const { riotId } = req.body;
    if (!riotId || !riotId.includes('#')) {
      return res.status(400).json({ message: 'Riot ID inválido. Usa GameName#TagLine' });
    }

    const user = await User.findById(req.userId).select('email connections.riot');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const [gameName, tagLine] = riotId.split('#').map(s => s.trim());

    // 1) account-v1 (NO depende de LoL)
    const accountRes = await axios.get(
      `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY } }
    );

    const { puuid } = accountRes.data;

    // 2) OTP
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    user.connections.riot = user.connections.riot || {};
    user.connections.riot.pendingLink = {
      otpHash,
      expiresAt,
      puuid,
      gameName,
      tagLine
    };

    await user.save();

    await sendEmailOtp(user.email, otp);

    return res.json({ message: 'Código enviado. Confirma para vincular Riot.' });

  } catch (error) {
    console.error('INIT RIOT LINK ERROR:', error.response?.data || error.message);
    return res.status(400).json({ message: 'No se pudo iniciar la vinculación Riot' });
  }
};

// =========================
// 1.5) VALIDATE RIOT ID (NO LINK)
// =========================
export const validateRiotId = async (req, res) => {
  try {
    const { riotId } = req.body;
    if (!riotId || !riotId.includes('#')) {
      return res.status(400).json({ ok: false, message: 'Riot ID inválido. Usa GameName#TagLine' });
    }
    const [gameName, tagLine] = riotId.split('#').map(s => s.trim());
    if (!gameName || !tagLine) {
      return res.status(400).json({ ok: false, message: 'Riot ID inválido' });
    }
    await axios.get(
      `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY } }
    );
    return res.json({ ok: true, message: 'Riot ID válido' });
  } catch (error) {
    return res.status(400).json({ ok: false, message: 'Riot ID no válido' });
  }
};

// =========================
// 2) CONFIRM LINK (OTP -> LINK + AUTOSYNC)
// =========================
export const confirmRiotLink = async (req, res) => {
  try {
    const { otp } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const pending = user?.connections?.riot?.pendingLink;
    if (!pending?.otpHash || !pending?.expiresAt) {
      return res.status(400).json({ message: 'No hay vinculación pendiente' });
    }

    if (new Date() > new Date(pending.expiresAt)) {
      user.connections.riot.pendingLink = undefined;
      await user.save();
      return res.status(400).json({ message: 'Código expirado. Intenta de nuevo.' });
    }

    const ok = await bcrypt.compare(String(otp || ''), pending.otpHash);
    if (!ok) return res.status(400).json({ message: 'Código inválido' });

    // Link definitivo
    user.connections.riot = {
      puuid: pending.puuid,
      gameName: pending.gameName,
      tagLine: pending.tagLine,
      accountRegion: 'americas',
      verified: true,
      linkedAt: new Date(),
      pendingLink: undefined
    };

    await user.save();

    // AutoSync (no bloquea la vinculación aunque falle)
    const syncResult = await autoSyncRiotGames(req.userId);

    return res.json({
      message: 'Riot vinculado correctamente',
      sync: syncResult
    });

  } catch (error) {
    console.error('CONFIRM RIOT LINK ERROR:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Error confirmando vinculación Riot' });
  }
};

// =========================
// UNLINK
// =========================
export const unlinkRiotAccount = async (req, res) => {
  await User.findByIdAndUpdate(req.userId, {
    $unset: { 'connections.riot': '', 'gameProfiles.lol': '', 'gameProfiles.valorant': '' }
  });
  return res.json({ message: 'Riot desvinculado' });
};

// =========================
// Sync manual
// =========================
export const syncRiotNow = async (req, res) => {
  const result = await autoSyncRiotGames(req.userId);
  return res.json({ message: 'Sync ejecutado', result });
};

// =========================
// AUTOSYNC (LoL + Valorant)
// =========================
async function autoSyncRiotGames(userId) {
  const user = await User.findById(userId);
  const puuid = user?.connections?.riot?.puuid;
  if (!puuid) return { ok: false, reason: 'No riot linked' };

  const out = {
    lol: { exists: false },
    valorant: { exists: false, note: '' }
  };

  // -------- LoL: intentar regiones comunes hasta que una funcione
  const lolRegions = ['la1', 'na1', 'euw1', 'eun1', 'br1', 'kr', 'jp1', 'oc1', 'tr1', 'ru', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'];

  for (const region of lolRegions) {
    try {
      const summonerRes = await axios.get(
        `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
        { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY } }
      );

      const summoner = summonerRes.data;

      // rank opcional
      let rank = null;
      try {
        const leagueRes = await axios.get(
          `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`,
          { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY } }
        );
        const solo = leagueRes.data.find(q => q.queueType === 'RANKED_SOLO_5x5');
        if (solo) {
          rank = { tier: solo.tier, division: solo.rank, lp: solo.leaguePoints };
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

      out.lol = { exists: true, region };
      break; // ya encontramos región válida

    } catch (e) {
      // seguir probando
    }
  }

  // -------- Valorant: depende de permisos / endpoints disponibles
  // Si NO tienes acceso a Valorant en tu API key, normalmente dará 403.
  // Aquí lo dejamos preparado: si no hay acceso, no marcamos exists true.
  try {
    // TODO: aquí se pondrían endpoints reales de Valorant (si tu key tiene acceso)
    // Por ahora: dejamos NO validado de forma real (para no mentir).
    out.valorant = { exists: false, note: 'Pendiente: requiere endpoints oficiales Valorant / permisos' };

    user.gameProfiles = user.gameProfiles || {};
    user.gameProfiles.valorant = {
      exists: false,
      shard: '',
      rank: null,
      lastSyncAt: new Date()
    };

  } catch (e) {
    out.valorant = { exists: false, note: 'No disponible con la API key actual' };
  }

  await user.save();
  return { ok: true, ...out };
}
