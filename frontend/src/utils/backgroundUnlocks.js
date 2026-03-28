export const EXAMPLE_BACKGROUND_UNLOCK_USER = Object.freeze({
    referrals: 0,
    tournamentsWon: 0,
    unlockedItems: []
});

const REFERRAL_STEPS = [3, 5, 8, 12, 20, 30, 45, 60, 80, 100];
const TOURNAMENT_STEPS = [1, 1, 2, 2, 3, 3, 5, 7, 10, 12];
const ACHIEVEMENT_STEPS = [2, 3, 5, 7, 9, 12, 15, 18, 22, 26];

export const getBackgroundUnlockByIndex = (index = 0) => {
    if (index < 6) {
        return { type: 'free' };
    }

    const gatedIndex = index - 6;
    const tierIndex = Math.floor(gatedIndex / 3);
    const variant = gatedIndex % 3;

    if (variant === 0) {
        return {
            type: 'referrals',
            value: REFERRAL_STEPS[Math.min(tierIndex, REFERRAL_STEPS.length - 1)]
        };
    }

    if (variant === 1) {
        return {
            type: 'tournament_win',
            value: TOURNAMENT_STEPS[Math.min(tierIndex, TOURNAMENT_STEPS.length - 1)]
        };
    }

    return {
        type: 'achievement',
        value: ACHIEVEMENT_STEPS[Math.min(tierIndex, ACHIEVEMENT_STEPS.length - 1)]
    };
};

export const normalizeUnlockUser = (user = {}) => ({
    referrals: Number(user?.referrals || 0),
    tournamentsWon: Number(user?.tournamentsWon || 0),
    unlockedItems: Array.isArray(user?.unlockedItems) ? user.unlockedItems : []
});

export const getUnlockedAchievementsCount = (user = {}) =>
    normalizeUnlockUser(user).unlockedItems.filter((itemId) => String(itemId).startsWith('achievement:')).length;

export const getUnlockLabel = (unlock = { type: 'free' }) => {
    switch (unlock?.type) {
        case 'referrals':
            return `${Number(unlock?.value || 0)} referidos`;
        case 'tournament_win':
            return `Gana ${Number(unlock?.value || 0)} torneo${Number(unlock?.value || 0) === 1 ? '' : 's'}`;
        case 'achievement':
            return `${Number(unlock?.value || 0)} logros`;
        case 'free':
        default:
            return 'Disponible';
    }
};

export const isUnlocked = (item, user) => {
    const currentUser = normalizeUnlockUser(user);
    const unlock = item?.unlock || { type: 'free' };

    if (!item) return false;
    if (currentUser.unlockedItems.includes(item.id)) return true;

    switch (unlock.type) {
        case 'free':
            return true;
        case 'referrals':
            return currentUser.referrals >= Number(unlock.value || 0);
        case 'tournament_win':
            return currentUser.tournamentsWon >= Number(unlock.value || 0);
        case 'achievement':
            return getUnlockedAchievementsCount(currentUser) >= Number(unlock.value || 0);
        default:
            return false;
    }
};

export const getUnlockStatus = (item, user) => {
    const currentUser = normalizeUnlockUser(user);
    const unlock = item?.unlock || { type: 'free' };
    const unlocked = isUnlocked(item, currentUser);

    if (unlock.type === 'free') {
        return {
            unlocked,
            label: 'Disponible',
            progressText: 'Listo para usar',
            helperText: 'Este fondo esta disponible desde el inicio.'
        };
    }

    if (unlock.type === 'referrals') {
        const target = Number(unlock.value || 0);
        const current = currentUser.referrals;
        const remaining = Math.max(target - current, 0);
        return {
            unlocked,
            label: getUnlockLabel(unlock),
            progressText: `${current} / ${target} referidos`,
            helperText: remaining > 0
                ? `Te faltan ${remaining} referido${remaining === 1 ? '' : 's'} para desbloquearlo.`
                : 'Requisito completado.'
        };
    }

    if (unlock.type === 'tournament_win') {
        const target = Number(unlock.value || 0);
        const current = currentUser.tournamentsWon;
        const remaining = Math.max(target - current, 0);
        return {
            unlocked,
            label: getUnlockLabel(unlock),
            progressText: `${current} / ${target} torneos ganados`,
            helperText: remaining > 0
                ? `Necesitas ${remaining} victoria${remaining === 1 ? '' : 's'} mas en torneos.`
                : 'Requisito completado.'
        };
    }

    const target = Number(unlock.value || 0);
    const current = getUnlockedAchievementsCount(currentUser);
    const remaining = Math.max(target - current, 0);
    return {
        unlocked,
        label: getUnlockLabel(unlock),
        progressText: `${current} / ${target} logros`,
        helperText: remaining > 0
            ? `Te faltan ${remaining} logro${remaining === 1 ? '' : 's'} para desbloquearlo.`
            : 'Requisito completado.'
    };
};
