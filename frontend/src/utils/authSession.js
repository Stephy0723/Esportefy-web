const USER_STORAGE_KEY = 'esportefyUser';
const TOKEN_STORAGE_KEY = 'token';
const REMEMBER_STORAGE_KEY = 'esportefyRememberSession';

const safeStorageGet = (storage, key) => {
  try {
    return storage.getItem(key);
  } catch (_) {
    return null;
  }
};

const safeStorageSet = (storage, key, value) => {
  try {
    storage.setItem(key, value);
  } catch (_) {
    // no-op
  }
};

const safeStorageRemove = (storage, key) => {
  try {
    storage.removeItem(key);
  } catch (_) {
    // no-op
  }
};

const parseUser = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
};

export const getAuthToken = () =>
  safeStorageGet(localStorage, TOKEN_STORAGE_KEY)
  || safeStorageGet(sessionStorage, TOKEN_STORAGE_KEY)
  || '';

export const getStoredUser = () => {
  const fromLocal = parseUser(safeStorageGet(localStorage, USER_STORAGE_KEY));
  if (fromLocal) return fromLocal;
  return parseUser(safeStorageGet(sessionStorage, USER_STORAGE_KEY));
};

export const hasClientSession = () => Boolean(getAuthToken() || getStoredUser());

export const persistAuthSession = ({ user = null, token = '', rememberMe = false } = {}) => {
  clearAuthSession();

  const targetStorage = rememberMe ? localStorage : sessionStorage;
  if (user && typeof user === 'object') {
    safeStorageSet(targetStorage, USER_STORAGE_KEY, JSON.stringify(user));
  }
  safeStorageSet(targetStorage, TOKEN_STORAGE_KEY, String(token || 'cookie-session'));
  safeStorageSet(localStorage, REMEMBER_STORAGE_KEY, rememberMe ? '1' : '0');
};

export const cacheAuthUser = (user) => {
  if (!user || typeof user !== 'object') return;
  const hasLocalToken = Boolean(safeStorageGet(localStorage, TOKEN_STORAGE_KEY));
  const hasSessionToken = Boolean(safeStorageGet(sessionStorage, TOKEN_STORAGE_KEY));
  const targetStorage = hasLocalToken ? localStorage : (hasSessionToken ? sessionStorage : localStorage);
  safeStorageSet(targetStorage, USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  safeStorageRemove(localStorage, USER_STORAGE_KEY);
  safeStorageRemove(localStorage, TOKEN_STORAGE_KEY);
  safeStorageRemove(sessionStorage, USER_STORAGE_KEY);
  safeStorageRemove(sessionStorage, TOKEN_STORAGE_KEY);
  safeStorageRemove(localStorage, REMEMBER_STORAGE_KEY);
};

export const isPublicAuthEndpoint = (url = '') => {
  const value = String(url || '').toLowerCase();
  return (
    value.includes('/api/auth/login')
    || value.includes('/api/auth/register')
    || value.includes('/api/auth/check-phone')
    || value.includes('/api/auth/forgot-password')
    || value.includes('/api/auth/reset-password')
  );
};

