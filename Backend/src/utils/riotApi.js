import axios from 'axios';

export const RIOT_API_TIMEOUT_MS = 10000;

export const getRiotApiKey = () => String(process.env.RIOT_API_KEY || '').trim();

export const getRiotKeyMode = () => String(process.env.RIOT_KEY_MODE || 'development').trim().toLowerCase();

export const isLocalOrPrivateHost = (hostname = '') => {
  const host = String(hostname || '').trim().toLowerCase();
  if (!host) return false;
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
  if (host.startsWith('10.')) return true;
  if (host.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  return false;
};

export const ensureRiotApiAccess = () => {
  if (!getRiotApiKey()) {
    const err = new Error('RIOT_API_KEY no configurada');
    err.code = 'RIOT_KEY_MISSING';
    throw err;
  }

  const keyMode = getRiotKeyMode();
  const nodeEnv = String(process.env.NODE_ENV || 'development').trim().toLowerCase();
  const allowDevKeyInProd = String(process.env.ALLOW_RIOT_DEV_KEY_IN_PROD || '').trim().toLowerCase() === 'true';
  const riotReviewMode = String(process.env.RIOT_REVIEW_MODE || '').trim().toLowerCase() === 'true';

  if (allowDevKeyInProd && !riotReviewMode) {
    const err = new Error('RIOT_KEY_MODE_RESTRICTED');
    err.code = 'RIOT_KEY_MODE_RESTRICTED';
    throw err;
  }

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
};

export const riotAmericasGet = async (urlPath) => {
  ensureRiotApiAccess();
  return axios.get(`https://americas.api.riotgames.com${urlPath}`, {
    headers: { 'X-Riot-Token': getRiotApiKey() },
    timeout: RIOT_API_TIMEOUT_MS
  });
};

export const getRiotAccountByRiotId = async (gameName, tagLine) => {
  const path = `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const response = await riotAmericasGet(path);
  return response.data || {};
};
