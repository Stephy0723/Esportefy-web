import { COMMUNITY_GAMES } from '../../../data/communityData';

export const COMMUNITY_SOCIAL_FIELDS = [
  {
    key: 'website',
    label: 'Sitio web',
    iconClass: 'bx bx-link-external',
    placeholder: 'https://tucomunidad.gg'
  },
  {
    key: 'discord',
    label: 'Discord',
    iconClass: 'bx bxl-discord-alt',
    placeholder: 'https://discord.gg/tucomunidad'
  },
  {
    key: 'twitter',
    label: 'X / Twitter',
    iconClass: 'bx bxl-twitter',
    placeholder: 'https://x.com/tucomunidad'
  },
  {
    key: 'instagram',
    label: 'Instagram',
    iconClass: 'bx bxl-instagram',
    placeholder: 'https://instagram.com/tucomunidad'
  },
  {
    key: 'youtube',
    label: 'YouTube',
    iconClass: 'bx bxl-youtube',
    placeholder: 'https://youtube.com/@tucomunidad'
  },
  {
    key: 'twitch',
    label: 'Twitch',
    iconClass: 'bx bxl-twitch',
    placeholder: 'https://twitch.tv/tucomunidad'
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    iconClass: 'bx bxl-tiktok',
    placeholder: 'https://tiktok.com/@tucomunidad'
  }
];

const RIOT_GAME_IDS = new Set(['valorant', 'lol', 'lor', 'tft', 'wildrift']);

const normalizeValue = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const gameLookup = COMMUNITY_GAMES.reduce((acc, game) => {
  acc[normalizeValue(game.id)] = game;
  acc[normalizeValue(game.name)] = game;
  return acc;
}, {});

export const normalizeCommunitySocialLinks = (socialLinks) => {
  const raw = socialLinks && typeof socialLinks === 'object' ? socialLinks : {};
  return COMMUNITY_SOCIAL_FIELDS.reduce((acc, field) => {
    const value = String(raw[field.key] || '').trim();
    if (value) acc[field.key] = value;
    return acc;
  }, {});
};

export const getCommunitySocialEntries = (socialLinks) => {
  const normalized = normalizeCommunitySocialLinks(socialLinks);
  return COMMUNITY_SOCIAL_FIELDS.reduce((acc, field) => {
    const url = normalized[field.key];
    if (!url) return acc;
    acc.push({
      key: field.key,
      label: field.label,
      url,
      iconClass: field.iconClass
    });
    return acc;
  }, []);
};

export const getSuggestedCommunityWebsite = (mainGames = []) => {
  for (const gameName of mainGames) {
    const game = gameLookup[normalizeValue(gameName)];
    if (game?.url) {
      return {
        gameName: game.name,
        url: game.url
      };
    }
  }
  return null;
};

export const isRiotCommunitySelection = (mainGames = []) => {
  return mainGames.some((gameName) => {
    const game = gameLookup[normalizeValue(gameName)];
    const gameId = normalizeValue(game?.id || gameName);
    return RIOT_GAME_IDS.has(gameId);
  });
};
