import crypto from 'crypto';
import { getRedisClient } from './redisClient.js';

const DEFAULT_STATE_TTL_MS = 10 * 60 * 1000;
const memoryStates = new Map();

const buildKey = (provider, state) => `oauth:${String(provider || '').trim().toLowerCase()}:state:${String(state || '').trim()}`;

const cleanupMemoryStates = () => {
  const now = Date.now();
  for (const [key, value] of memoryStates.entries()) {
    if (!value || Number(value.expiresAt || 0) <= now) {
      memoryStates.delete(key);
    }
  }
};

export const createOAuthState = async (provider, payload = {}, ttlMs = DEFAULT_STATE_TTL_MS) => {
  const state = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + Math.max(60_000, Number(ttlMs) || DEFAULT_STATE_TTL_MS);
  const entry = { ...payload, expiresAt };
  const key = buildKey(provider, state);
  const redisClient = await getRedisClient();

  if (redisClient) {
    await redisClient.set(key, JSON.stringify(entry), 'PX', ttlMs);
    return state;
  }

  cleanupMemoryStates();
  memoryStates.set(key, entry);
  return state;
};

export const consumeOAuthState = async (provider, state) => {
  const normalizedState = String(state || '').trim();
  if (!normalizedState) return null;

  const key = buildKey(provider, normalizedState);
  const redisClient = await getRedisClient();

  if (redisClient) {
    const result = await redisClient.multi().get(key).del(key).exec();
    const raw = Array.isArray(result) ? result[0]?.[1] : null;
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (Number(parsed?.expiresAt || 0) <= Date.now()) return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  const entry = memoryStates.get(key);
  if (!entry) return null;

  memoryStates.delete(key);
  if (Number(entry?.expiresAt || 0) <= Date.now()) return null;
  return entry;
};
