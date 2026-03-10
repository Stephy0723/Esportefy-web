import axios from 'axios';
import crypto from 'crypto';
import User from '../models/User.js';
import { createOAuthState, consumeOAuthState } from '../services/oauthStateStore.js';

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const STEAM_AUTHORIZE_URL = process.env.STEAM_OAUTH_AUTHORIZE_URL || 'https://steamcommunity.com/oauth/login';
const STEAM_TOKEN_DETAILS_URL = process.env.STEAM_OAUTH_TOKEN_DETAILS_URL || 'https://partner.steam-api.com/ISteamUserOAuth/GetTokenDetails/v1/';
const STEAM_PLAYER_SUMMARIES_URL = process.env.STEAM_OAUTH_PLAYER_SUMMARIES_URL || 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/';
const EPIC_AUTHORIZE_URL = process.env.EPIC_OAUTH_AUTHORIZE_URL || 'https://www.epicgames.com/id/authorize';
const EPIC_TOKEN_URL = process.env.EPIC_OAUTH_TOKEN_URL || 'https://api.epicgames.dev/epic/oauth/v2/token';
const EPIC_USERINFO_URL = process.env.EPIC_OAUTH_USERINFO_URL || 'https://api.epicgames.dev/epic/oauth/v2/userInfo';
const EPIC_SCOPES = String(process.env.EPIC_OAUTH_SCOPES || 'openid basic_profile').trim();

const buildFrontendSettingsUrl = (provider, status, message = '') => {
  const url = new URL('/settings', FRONTEND_URL);
  url.searchParams.set('oauthProvider', String(provider || '').trim().toLowerCase());
  url.searchParams.set('oauthStatus', String(status || '').trim().toLowerCase());
  if (message) {
    url.searchParams.set('oauthMessage', String(message).slice(0, 160));
  }
  return url.toString();
};

const createPkcePair = () => {
  const verifier = crypto.randomBytes(48).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
};

const decodeJwtPayload = (token = '') => {
  const parts = String(token || '').split('.');
  if (parts.length < 2) return {};

  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch (_) {
    return {};
  }
};

const extractSteamId = (payload = {}) => {
  const response = payload?.response || payload || {};
  const params = response?.params || {};
  return String(
    params?.steamid
    || response?.steamid
    || payload?.steamid
    || ''
  ).trim();
};

const fetchSteamProfile = async (steamId) => {
  const apiKey = String(process.env.STEAM_WEB_API_KEY || '').trim();
  if (!apiKey || !steamId) {
    return {
      username: steamId ? `Steam ${steamId.slice(-6)}` : 'Steam',
      displayName: steamId ? `Steam ${steamId.slice(-6)}` : 'Steam',
      avatar: '',
      profileUrl: steamId ? `https://steamcommunity.com/profiles/${steamId}` : ''
    };
  }

  try {
    const response = await axios.get(STEAM_PLAYER_SUMMARIES_URL, {
      params: {
        key: apiKey,
        steamids: steamId
      },
      timeout: 15_000
    });

    const player = Array.isArray(response?.data?.response?.players)
      ? response.data.response.players[0]
      : null;

    return {
      username: String(player?.personaname || '').trim() || `Steam ${steamId.slice(-6)}`,
      displayName: String(player?.realname || player?.personaname || '').trim() || `Steam ${steamId.slice(-6)}`,
      avatar: String(player?.avatarfull || player?.avatarmedium || player?.avatar || '').trim(),
      profileUrl: String(player?.profileurl || '').trim() || `https://steamcommunity.com/profiles/${steamId}`
    };
  } catch (_) {
    return {
      username: `Steam ${steamId.slice(-6)}`,
      displayName: `Steam ${steamId.slice(-6)}`,
      avatar: '',
      profileUrl: `https://steamcommunity.com/profiles/${steamId}`
    };
  }
};

const ensureSteamConfig = () => {
  const clientId = String(process.env.STEAM_OAUTH_CLIENT_ID || '').trim();
  if (!clientId) {
    throw new Error('Configuración de Steam incompleta');
  }
  return { clientId };
};

export const requireSteamOAuthConfig = (_req, res, next) => {
  try {
    ensureSteamConfig();
    return next();
  } catch (error) {
    return res.status(503).json({
      message: 'Steam OAuth no está configurado todavía. Falta STEAM_OAUTH_CLIENT_ID.'
    });
  }
};

const ensureEpicConfig = () => {
  const clientId = String(process.env.EPIC_CLIENT_ID || '').trim();
  const clientSecret = String(process.env.EPIC_CLIENT_SECRET || '').trim();
  const redirectUri = String(process.env.EPIC_REDIRECT_URI || '').trim();

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Configuración de Epic Games incompleta');
  }

  return { clientId, clientSecret, redirectUri };
};

const assertConnectionNotLinkedElsewhere = async ({ provider, providerId, currentUserId }) => {
  const normalizedProvider = String(provider || '').trim().toLowerCase();
  const normalizedProviderId = String(providerId || '').trim();
  if (!normalizedProvider || !normalizedProviderId) {
    throw new Error('Identidad de proveedor incompleta');
  }

  const existingUser = await User.findOne({
    [`connections.${normalizedProvider}.id`]: normalizedProviderId,
    [`connections.${normalizedProvider}.verified`]: true,
    _id: { $ne: currentUserId }
  }).select('_id');

  if (existingUser) {
    const error = new Error('Esta cuenta ya está vinculada a otro usuario.');
    error.statusCode = 409;
    throw error;
  }
};

const persistSteamConnection = async (userId, connection) => {
  await User.findByIdAndUpdate(userId, {
    $set: {
      'connections.steam': {
        id: connection.id,
        steamId: connection.id,
        username: connection.username,
        displayName: connection.displayName,
        avatar: connection.avatar,
        profileUrl: connection.profileUrl,
        verified: true,
        linkedAt: new Date()
      },
      'gameProfiles.steam': {
        steamId: connection.id,
        verified: true
      }
    }
  });
};

const persistEpicConnection = async (userId, connection) => {
  await User.findByIdAndUpdate(userId, {
    $set: {
      'connections.epic': {
        id: connection.id,
        epicId: connection.id,
        username: connection.username,
        displayName: connection.displayName,
        email: connection.email,
        verified: true,
        linkedAt: new Date()
      }
    }
  });
};

const extractEpicIdentity = ({ tokenData = {}, userInfo = {} }) => {
  const decodedIdToken = decodeJwtPayload(tokenData?.id_token);
  const id = String(
    userInfo?.sub
    || decodedIdToken?.sub
    || tokenData?.account_id
    || ''
  ).trim();

  const username = String(
    userInfo?.preferred_username
    || userInfo?.nickname
    || decodedIdToken?.preferred_username
    || decodedIdToken?.nickname
    || decodedIdToken?.name
    || userInfo?.name
    || decodedIdToken?.email
    || userInfo?.email
    || id
  ).trim();

  return {
    id,
    username: username || id,
    displayName: String(userInfo?.name || decodedIdToken?.name || username || id).trim(),
    email: String(userInfo?.email || decodedIdToken?.email || '').trim()
  };
};

export const steamAuthStart = async (req, res) => {
  try {
    const { clientId } = ensureSteamConfig();
    const state = await createOAuthState('steam', { userId: String(req.userId) }, OAUTH_STATE_TTL_MS);
    const authorizeUrl = new URL(STEAM_AUTHORIZE_URL);

    authorizeUrl.searchParams.set('response_type', 'token');
    authorizeUrl.searchParams.set('client_id', clientId);
    authorizeUrl.searchParams.set('state', state);

    const scope = String(process.env.STEAM_OAUTH_SCOPE || '').trim();
    if (scope) {
      authorizeUrl.searchParams.set('scope', scope);
    }

    return res.status(200).json({ authorizeUrl: authorizeUrl.toString() });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'No se pudo iniciar la conexión con Steam.' });
  }
};

export const steamAuthFinalize = async (req, res) => {
  try {
    const accessToken = String(req.body?.accessToken || '').trim();
    const state = String(req.body?.state || '').trim();

    if (!accessToken || !state) {
      return res.status(400).json({ message: 'Faltan datos del callback de Steam.' });
    }

    const storedState = await consumeOAuthState('steam', state);
    if (!storedState?.userId) {
      return res.status(400).json({ message: 'Estado OAuth de Steam inválido o expirado.' });
    }
    if (String(storedState.userId) !== String(req.userId)) {
      return res.status(403).json({ message: 'La sesión actual no coincide con la solicitud OAuth de Steam.' });
    }

    const tokenDetailsResponse = await axios.get(STEAM_TOKEN_DETAILS_URL, {
      params: { access_token: accessToken },
      timeout: 15_000
    });
    const steamId = extractSteamId(tokenDetailsResponse.data);

    if (!steamId) {
      return res.status(400).json({ message: 'Steam no devolvió una identidad válida.' });
    }

    await assertConnectionNotLinkedElsewhere({
      provider: 'steam',
      providerId: steamId,
      currentUserId: req.userId
    });

    const profile = await fetchSteamProfile(steamId);
    await persistSteamConnection(req.userId, {
      id: steamId,
      username: profile.username,
      displayName: profile.displayName,
      avatar: profile.avatar,
      profileUrl: profile.profileUrl
    });

    return res.status(200).json({
      message: 'Cuenta de Steam vinculada correctamente.',
      connection: {
        id: steamId,
        username: profile.username,
        displayName: profile.displayName,
        avatar: profile.avatar,
        profileUrl: profile.profileUrl,
        verified: true
      }
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode || error?.response?.status || 500);
    const message = error?.response?.data?.message || error?.message || 'No se pudo completar la conexión con Steam.';
    return res.status(statusCode).json({ message });
  }
};

export const unlinkSteam = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $unset: {
        'connections.steam': '',
        'gameProfiles.steam.steamId': ''
      },
      $set: {
        'gameProfiles.steam.verified': false
      }
    });

    return res.status(200).json({ message: 'Steam desvinculado correctamente.' });
  } catch (error) {
    return res.status(500).json({ message: 'No se pudo desvincular Steam.' });
  }
};

export const epicAuthStart = async (req, res) => {
  try {
    const { clientId, redirectUri } = ensureEpicConfig();
    const pkce = createPkcePair();
    const state = await createOAuthState(
      'epic',
      {
        userId: String(req.userId),
        codeVerifier: pkce.verifier
      },
      OAUTH_STATE_TTL_MS
    );

    const authorizeUrl = new URL(EPIC_AUTHORIZE_URL);
    authorizeUrl.searchParams.set('client_id', clientId);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('scope', EPIC_SCOPES);
    authorizeUrl.searchParams.set('state', state);
    authorizeUrl.searchParams.set('code_challenge', pkce.challenge);
    authorizeUrl.searchParams.set('code_challenge_method', 'S256');

    return res.status(200).json({ authorizeUrl: authorizeUrl.toString() });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'No se pudo iniciar la conexión con Epic Games.' });
  }
};

export const epicAuthCallback = async (req, res) => {
  const code = String(req.query?.code || '').trim();
  const state = String(req.query?.state || '').trim();
  const providerError = String(req.query?.error || '').trim();
  const providerErrorDescription = String(req.query?.error_description || '').trim();

  if (providerError) {
    return res.redirect(
      buildFrontendSettingsUrl(
        'epic',
        'error',
        providerErrorDescription || 'Epic Games canceló o rechazó la autorización.'
      )
    );
  }

  if (!code || !state) {
    return res.redirect(buildFrontendSettingsUrl('epic', 'error', 'Callback inválido de Epic Games.'));
  }

  try {
    const storedState = await consumeOAuthState('epic', state);
    if (!storedState?.userId || !storedState?.codeVerifier) {
      return res.redirect(buildFrontendSettingsUrl('epic', 'error', 'Estado OAuth inválido o expirado.'));
    }

    const { clientId, clientSecret, redirectUri } = ensureEpicConfig();
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenResponse = await axios.post(
      EPIC_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: storedState.codeVerifier
      }),
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 15_000
      }
    );

    const accessToken = String(tokenResponse?.data?.access_token || '').trim();
    if (!accessToken) {
      return res.redirect(buildFrontendSettingsUrl('epic', 'error', 'Epic Games no devolvió access token.'));
    }

    let userInfo = {};
    try {
      const userInfoResponse = await axios.get(EPIC_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 15_000
      });
      userInfo = userInfoResponse?.data || {};
    } catch (_) {
      userInfo = {};
    }

    const identity = extractEpicIdentity({
      tokenData: tokenResponse?.data || {},
      userInfo
    });

    if (!identity.id) {
      return res.redirect(buildFrontendSettingsUrl('epic', 'error', 'Epic Games no devolvió una identidad válida.'));
    }

    await assertConnectionNotLinkedElsewhere({
      provider: 'epic',
      providerId: identity.id,
      currentUserId: storedState.userId
    });

    await persistEpicConnection(storedState.userId, identity);
    return res.redirect(buildFrontendSettingsUrl('epic', 'connected'));
  } catch (error) {
    const message = error?.response?.data?.message
      || error?.message
      || 'No se pudo completar la conexión con Epic Games.';
    return res.redirect(buildFrontendSettingsUrl('epic', 'error', message));
  }
};

export const unlinkEpic = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $unset: { 'connections.epic': '' }
    });

    return res.status(200).json({ message: 'Epic Games desvinculado correctamente.' });
  } catch (error) {
    return res.status(500).json({ message: 'No se pudo desvincular Epic Games.' });
  }
};
