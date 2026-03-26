import {
  COMMUNITY_SOCIAL_FIELDS,
  getCommunityGame,
  isRiotCommunityGame,
  normalizeCommunitySocialLinks as normalizeSharedCommunitySocialLinks
} from '../../../../../shared/communityCatalog.js';

export { COMMUNITY_SOCIAL_FIELDS };

export const normalizeCommunitySocialLinks = (socialLinks) =>
  normalizeSharedCommunitySocialLinks(socialLinks);

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
  for (const value of mainGames) {
    const game = getCommunityGame(value);
    if (game?.url) {
      return {
        gameName: game.name,
        url: game.url
      };
    }
  }

  return null;
};

export const isRiotCommunitySelection = (mainGames = []) =>
  mainGames.some((value) => isRiotCommunityGame(value));
