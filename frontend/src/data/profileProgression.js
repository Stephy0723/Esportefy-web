export const EMPTY_PROFILE_PROGRESSION = {
    totalPoints: 0,
    unlockedAchievements: 0,
    totalAchievements: 20,
    achievementCompletionPercent: 0,
    level: {
        id: 'rookie',
        name: 'Rookie',
        nextLevelName: 'Aspirante',
        nextLevelPoints: 350,
        pointsIntoLevel: 0,
        pointsNeeded: 350,
        progressPercent: 0
    },
    achievements: [],
    pointSources: [],
    highlights: []
};

export const normalizeProfileProgression = (payload = {}) => ({
    ...EMPTY_PROFILE_PROGRESSION,
    ...payload,
    totalPoints: Number(payload?.totalPoints || 0),
    unlockedAchievements: Number(payload?.unlockedAchievements || 0),
    totalAchievements: Number(payload?.totalAchievements || EMPTY_PROFILE_PROGRESSION.totalAchievements),
    achievementCompletionPercent: Number(payload?.achievementCompletionPercent || 0),
    level: {
        ...EMPTY_PROFILE_PROGRESSION.level,
        ...(payload?.level || {}),
        nextLevelPoints: Number(payload?.level?.nextLevelPoints || EMPTY_PROFILE_PROGRESSION.level.nextLevelPoints),
        pointsIntoLevel: Number(payload?.level?.pointsIntoLevel || 0),
        pointsNeeded: Number(payload?.level?.pointsNeeded || 0),
        progressPercent: Number(payload?.level?.progressPercent || 0)
    },
    achievements: Array.isArray(payload?.achievements) ? payload.achievements : [],
    pointSources: Array.isArray(payload?.pointSources) ? payload.pointSources : [],
    highlights: Array.isArray(payload?.highlights) ? payload.highlights : []
});
