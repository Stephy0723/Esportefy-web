import axios from 'axios';
import crypto from 'crypto';
import User from '../models/User.js';
import { getRedisClient } from '../services/redisClient.js';

const DISCORD_STATE_TTL_MS = 10 * 60 * 1000;
const pendingDiscordStates = new Map();
const DISCORD_STATE_PREFIX = 'oauth:discord:state';

const getFrontendSettingsUrl = (status = 'error') => {
  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${frontendBase}/settings?discord=${status}`;
};

const cleanupDiscordStates = () => {
  const now = Date.now();
  for (const [state, entry] of pendingDiscordStates.entries()) {
    if (!entry || entry.expiresAt <= now) {
      pendingDiscordStates.delete(state);
    }
  }
};

const setDiscordState = async (state, payload) => {
  const redisClient = await getRedisClient();
  if (redisClient) {
    await redisClient.set(
      `${DISCORD_STATE_PREFIX}:${state}`,
      JSON.stringify(payload),
      'PX',
      DISCORD_STATE_TTL_MS
    );
    return;
  }

  cleanupDiscordStates();
  pendingDiscordStates.set(state, payload);
};

const createDiscordState = async (userId) => {
  const state = crypto.randomBytes(24).toString('hex');
  await setDiscordState(state, {
    userId: String(userId),
    expiresAt: Date.now() + DISCORD_STATE_TTL_MS
  });
  return state;
};

const consumeDiscordState = async (state) => {
  const normalizedState = String(state || '');
  const redisClient = await getRedisClient();

  if (redisClient) {
    const key = `${DISCORD_STATE_PREFIX}:${normalizedState}`;
    const result = await redisClient.multi().get(key).del(key).exec();
    const payload = Array.isArray(result) ? result[0]?.[1] : null;
    if (!payload) return null;
    try {
      const parsed = JSON.parse(payload);
      if (!parsed?.userId || parsed.expiresAt <= Date.now()) return null;
      return parsed.userId;
    } catch (_) {
      return null;
    }
  }

  const entry = pendingDiscordStates.get(normalizedState);
  if (!entry) return null;
  pendingDiscordStates.delete(normalizedState);
  if (entry.expiresAt <= Date.now()) return null;
  return entry.userId;
};

export const discordAuthStart = async (req, res) => {
  try {
    if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_REDIRECT_URI) {
      return res.status(500).json({ message: 'Configuración de Discord incompleta' });
    }

    const state = await createDiscordState(req.userId);

    const authorizeUrl =
      `https://discord.com/api/oauth2/authorize` +
      `?client_id=${process.env.DISCORD_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=identify` +
      `&state=${encodeURIComponent(state)}`;

    return res.status(200).json({ authorizeUrl });
  } catch (error) {
    return res.status(500).json({ message: 'No se pudo iniciar conexión con Discord' });
  }
};


export const discordCallback = async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.redirect(getFrontendSettingsUrl('error'));
  }

  try {
    const userId = await consumeDiscordState(state);
    if (!userId) {
      return res.redirect(getFrontendSettingsUrl('error'));
    }

    const tokenRes = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get(
      'https://discord.com/api/users/@me',
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    const discordUser = userRes.data;
    const username = discordUser.discriminator && discordUser.discriminator !== '0'
      ? `${discordUser.username}#${discordUser.discriminator}`
      : discordUser.username;

    await User.findByIdAndUpdate(
      userId,
      {
        'connections.discord': {
          id: discordUser.id,
          username,
          verified: true
        }
      }
    );

    return res.redirect(getFrontendSettingsUrl('connected'));

  } catch (error) {
    console.error('Discord callback error:', error.response?.data || error.message);
    return res.redirect(getFrontendSettingsUrl('error'));
  }
};

export const unlinkDiscord = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $unset: { 'connections.discord': '' }
    });

    return res.json({ message: 'Discord desvinculado' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al desvincular Discord' });
  }
};

