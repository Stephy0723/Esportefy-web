import {
  getCommunityGameNameVariants,
  normalizeCommunityGameId as normalizeSharedCommunityGameId
} from '../../../shared/communityCatalog.js';

export const normalizeCommunityGameId = (value = '') =>
  normalizeSharedCommunityGameId(value);

export const normalizeCommunityGameIds = (values = []) => {
  const list = Array.isArray(values) ? values : [values];
  const seen = new Set();
  const normalized = [];

  list.forEach((value) => {
    const gameId = normalizeCommunityGameId(value);
    if (!gameId || seen.has(gameId)) return;
    seen.add(gameId);
    normalized.push(gameId);
  });

  return normalized;
};

export const isCommunityGameId = (value = '') => Boolean(normalizeCommunityGameId(value));

export const getGameNameVariants = (gameId = '') =>
  getCommunityGameNameVariants(gameId);
