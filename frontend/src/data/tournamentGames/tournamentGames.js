import { GAME_IMAGES } from '../gameImages.js';
import { GAME_POLICIES } from '../../../../shared/gamePolicies.js';

const LEGACY_EXTRA_TOURNAMENT_GAMES = [
  {
    name: 'Wild Rift',
    id: 'wildrift',
    img: GAME_IMAGES['Wild Rift'] || GAME_IMAGES.Default,
    color: '#00c3ff',
    icon: 'bx-world',
    category: 'MOBA',
  },
  {
    name: 'TFT',
    id: 'tft',
    img: GAME_IMAGES['Teamfight Tactics'] || GAME_IMAGES.Default,
    color: '#f5a623',
    icon: 'bx-chess',
    category: 'Auto Chess',
  },
];

const POLICY_TOURNAMENT_GAMES = GAME_POLICIES.map((policy) => ({
  name: policy.name,
  id: policy.id,
  img: GAME_IMAGES[policy.name] || GAME_IMAGES[policy.short] || GAME_IMAGES.Default,
  color: policy.tournamentColor,
  icon: policy.tournamentIcon,
  category: policy.tournamentCategory,
}));

const dedupeByName = (items = []) => {
  const seen = new Set();

  return items.filter((item) => {
    const key = String(item?.name || item?.id || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const TOURNAMENT_GAMES = dedupeByName([
  ...POLICY_TOURNAMENT_GAMES,
  ...LEGACY_EXTRA_TOURNAMENT_GAMES,
]);

export function getTournamentGameByName(name) {
  if (!name) return undefined;
  return TOURNAMENT_GAMES.find(
    (game) =>
      (game.name && game.name.toLowerCase() === String(name).toLowerCase()) ||
      (game.id && game.id === String(name).toLowerCase())
  );
}
