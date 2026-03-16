const LEVELS = [
    { id: 'rookie', name: 'Rookie', minPoints: 0 },
    { id: 'aspirante', name: 'Aspirante', minPoints: 200 },
    { id: 'competidor', name: 'Competidor', minPoints: 500 },
    { id: 'estratega', name: 'Estratega', minPoints: 900 },
    { id: 'capitan', name: 'Capitan', minPoints: 1400 },
    { id: 'elite', name: 'Elite', minPoints: 2000 },
    { id: 'campeon', name: 'Campeon', minPoints: 2600 },
    { id: 'leyenda', name: 'Leyenda', minPoints: 3200 }
];

const ACHIEVEMENT_ACCENTS = {
    onboarding: '#98ff1d',
    social: '#5eead4',
    competitive: '#f97316',
    team: '#60a5fa',
    community: '#c084fc'
};

const toNumber = (value) => {
    const next = Number(value);
    return Number.isFinite(next) ? next : 0;
};

const clamp = (value, min = 0, max = Infinity) => Math.min(Math.max(toNumber(value), min), max);

const progressPercent = (current, target) => {
    const safeTarget = Math.max(toNumber(target), 1);
    return Math.round((Math.min(toNumber(current), safeTarget) / safeTarget) * 100);
};

const buildProgressLabel = (current, target, unit = '') => {
    const safeCurrent = clamp(current, 0, target);
    const suffix = unit ? ` ${unit}` : '';
    return `${safeCurrent}/${target}${suffix}`;
};

const buildSource = ({
    id,
    label,
    description,
    current,
    target,
    unit,
    pointsPerUnit = 0,
    points = 0,
    binary = false
}) => {
    const safeTarget = Math.max(toNumber(target), 1);
    const safeCurrent = clamp(current, 0, safeTarget);
    const awardedPoints = binary
        ? (safeCurrent >= safeTarget ? toNumber(points) : 0)
        : Math.round(safeCurrent * toNumber(pointsPerUnit));
    const maxPoints = binary
        ? toNumber(points)
        : Math.round(safeTarget * toNumber(pointsPerUnit));

    return {
        id,
        label,
        description,
        current: safeCurrent,
        target: safeTarget,
        unit: unit || '',
        awardedPoints,
        maxPoints,
        progressPercent: progressPercent(safeCurrent, safeTarget),
        progressLabel: buildProgressLabel(safeCurrent, safeTarget, unit)
    };
};

const buildAchievement = ({
    id,
    name,
    description,
    iconClass,
    category,
    current,
    target,
    unit = '',
    accentColor
}) => {
    const safeTarget = Math.max(toNumber(target), 1);
    const safeCurrent = clamp(current, 0, safeTarget);
    const unlocked = safeCurrent >= safeTarget;

    return {
        id,
        name,
        description,
        iconClass,
        category,
        accentColor: accentColor || ACHIEVEMENT_ACCENTS[category] || '#98ff1d',
        current: safeCurrent,
        target: safeTarget,
        unit,
        unlocked,
        progressPercent: progressPercent(safeCurrent, safeTarget),
        progressLabel: unlocked ? 'Desbloqueado' : buildProgressLabel(safeCurrent, safeTarget, unit)
    };
};

const resolveLevel = (totalPoints) => {
    const safePoints = Math.max(0, Math.round(toNumber(totalPoints)));
    const currentLevel = [...LEVELS].reverse().find((level) => safePoints >= level.minPoints) || LEVELS[0];
    const nextLevel = LEVELS.find((level) => level.minPoints > currentLevel.minPoints) || null;
    const currentFloor = currentLevel.minPoints;
    const nextThreshold = nextLevel ? nextLevel.minPoints : currentFloor;
    const range = Math.max(nextThreshold - currentFloor, 1);
    const currentIntoLevel = nextLevel ? clamp(safePoints - currentFloor, 0, range) : range;

    return {
        current: currentLevel,
        next: nextLevel,
        nextLevelPoints: nextLevel ? nextLevel.minPoints : currentLevel.minPoints,
        pointsIntoLevel: currentIntoLevel,
        pointsNeeded: nextLevel ? Math.max(nextLevel.minPoints - safePoints, 0) : 0,
        progressPercent: nextLevel ? Math.round((currentIntoLevel / range) * 100) : 100
    };
};

export const buildProfileProgression = ({
    user = {},
    teamsCount = 0,
    captainTeams = 0,
    mutualFriendsCount = 0,
    communitiesCount = 0,
    postsCount = 0,
    likesReceived = 0,
    commentsReceived = 0,
    tournamentsJoined = 0,
    tournamentsWon = 0,
    matchesPlayed = 0,
    matchesWon = 0
} = {}) => {
    const selectedGamesCount = Array.isArray(user?.selectedGames) ? user.selectedGames.length : 0;
    const preferredRolesCount = Array.isArray(user?.preferredRoles) ? user.preferredRoles.length : 0;
    const languagesCount = Array.isArray(user?.languages) ? user.languages.length : 0;
    const socialLinksCount = Object.values(user?.socialLinks || {}).filter((value) => String(value || '').trim()).length;

    const profileCoreFields = [
        user?.username,
        user?.fullName,
        user?.country,
        user?.phone,
        user?.birthDate
    ].filter((value) => String(value || '').trim()).length;

    const styleElements = [
        Boolean(String(user?.avatar || '').trim()),
        Boolean(String(user?.selectedTagId || '').trim()),
        Boolean(String(user?.selectedBgId || '').trim()),
        String(user?.selectedFrameId || '').trim() && String(user?.selectedFrameId || '').trim() !== 'none'
    ].filter(Boolean).length;

    const bioReady = String(user?.bio || '').trim().length >= 20 ? 1 : 0;
    const lookingForTeamActive = user?.lookingForTeam ? 1 : 0;
    const discordLinked = user?.connections?.discord?.verified ? 1 : 0;
    const riotLinked = user?.connections?.riot?.verified ? 1 : 0;
    const mlbbLinked = user?.connections?.mlbb?.verified ? 1 : 0;
    const verifiedGameAccount = riotLinked || mlbbLinked ? 1 : 0;
    const extraVerifiedConnections = [
        user?.connections?.steam?.verified,
        user?.connections?.epic?.verified
    ].filter(Boolean).length;
    const connectionScore = discordLinked + verifiedGameAccount + Math.min(extraVerifiedConnections, 2);
    const communicationScore = Math.min(preferredRolesCount, 3) + Math.min(languagesCount, 3);
    const engagementScore = Math.min(toNumber(likesReceived), 15) + Math.min(toNumber(commentsReceived) * 2, 10);
    const universityVerified = user?.university?.verified ? 1 : 0;

    /* ─────────────────────────────────────────────────
       PUNTO MÁXIMO TEÓRICO: ~3 308 pts
       ─────────────────────────────────────────────────
       Perfil   ≈  208 pts  (lo más fácil, pocos pts)
       Social   ≈  300 pts
       Equipos  ≈  300 pts
       Competitivo ≈ 2 500 pts  (lo que más vale)
       ───────────────────────────────────────────────── */
    const pointSources = [
        // ── Perfil (~208 pts) ──
        buildSource({
            id: 'profile-core',
            label: 'Datos del perfil',
            description: 'Nombre, pais, telefono, etc.',
            current: profileCoreFields,
            target: 5,
            unit: 'datos',
            pointsPerUnit: 5
        }),
        buildSource({
            id: 'identity-style',
            label: 'Estilo visual',
            description: 'Avatar, placa, fondo y marco.',
            current: styleElements,
            target: 4,
            unit: 'items',
            pointsPerUnit: 5
        }),
        buildSource({
            id: 'bio-ready',
            label: 'Bio',
            description: 'Escribe una bio (+20 caracteres).',
            current: bioReady,
            target: 1,
            unit: 'estado',
            points: 10,
            binary: true
        }),
        buildSource({
            id: 'game-pool',
            label: 'Juegos',
            description: 'Selecciona tus juegos.',
            current: selectedGamesCount,
            target: 5,
            unit: 'juegos',
            pointsPerUnit: 5
        }),
        buildSource({
            id: 'communication-kit',
            label: 'Roles e idiomas',
            description: 'Roles e idiomas configurados.',
            current: communicationScore,
            target: 6,
            unit: 'selecciones',
            pointsPerUnit: 3
        }),
        buildSource({
            id: 'social-links',
            label: 'Redes sociales',
            description: 'Agrega tus redes.',
            current: socialLinksCount,
            target: 3,
            unit: 'redes',
            pointsPerUnit: 5
        }),
        buildSource({
            id: 'account-links',
            label: 'Cuentas vinculadas',
            description: 'Discord, Riot, MLBB, etc.',
            current: connectionScore,
            target: 4,
            unit: 'cuentas',
            pointsPerUnit: 15
        }),
        buildSource({
            id: 'university',
            label: 'Universidad verificada',
            description: 'Verifica tu universidad.',
            current: universityVerified,
            target: 1,
            unit: 'estado',
            points: 30,
            binary: true
        }),
        buildSource({
            id: 'looking-for-team',
            label: 'Buscando equipo',
            description: 'Activa busqueda de equipo.',
            current: lookingForTeamActive,
            target: 1,
            unit: 'estado',
            points: 5,
            binary: true
        }),

        // ── Social (~300 pts) ──
        buildSource({
            id: 'friend-network',
            label: 'Amigos',
            description: 'Amistades mutuas.',
            current: mutualFriendsCount,
            target: 5,
            unit: 'amigos',
            pointsPerUnit: 15
        }),
        buildSource({
            id: 'community',
            label: 'Comunidades',
            description: 'Unete a comunidades.',
            current: communitiesCount,
            target: 3,
            unit: 'comunidades',
            pointsPerUnit: 25
        }),
        buildSource({
            id: 'content',
            label: 'Publicaciones',
            description: 'Publica contenido.',
            current: postsCount,
            target: 5,
            unit: 'posts',
            pointsPerUnit: 15
        }),
        buildSource({
            id: 'engagement',
            label: 'Interacciones',
            description: 'Likes y comentarios recibidos.',
            current: engagementScore,
            target: 25,
            unit: 'interacciones',
            pointsPerUnit: 3
        }),

        // ── Equipos (~300 pts) ──
        buildSource({
            id: 'teams',
            label: 'Equipos',
            description: 'Forma parte de equipos.',
            current: teamsCount,
            target: 3,
            unit: 'equipos',
            pointsPerUnit: 50
        }),
        buildSource({
            id: 'leadership',
            label: 'Liderazgo',
            description: 'Capitanea equipos.',
            current: captainTeams,
            target: 2,
            unit: 'capitanias',
            pointsPerUnit: 75
        }),

        // ── Competitivo (~2 500 pts) ──
        buildSource({
            id: 'tournament-entries',
            label: 'Torneos jugados',
            description: 'Participa en torneos.',
            current: tournamentsJoined,
            target: 5,
            unit: 'torneos',
            pointsPerUnit: 100
        }),
        buildSource({
            id: 'official-matches',
            label: 'Partidas oficiales',
            description: 'Partidas completadas.',
            current: matchesPlayed,
            target: 10,
            unit: 'partidas',
            pointsPerUnit: 25
        }),
        buildSource({
            id: 'official-wins',
            label: 'Victorias',
            description: 'Partidas ganadas.',
            current: matchesWon,
            target: 10,
            unit: 'victorias',
            pointsPerUnit: 50
        }),
        buildSource({
            id: 'tournament-titles',
            label: 'Titulos de campeon',
            description: 'Gana torneos.',
            current: tournamentsWon,
            target: 5,
            unit: 'titulos',
            pointsPerUnit: 250
        })
    ];

    const totalPoints = pointSources.reduce((acc, source) => acc + source.awardedPoints, 0);
    const level = resolveLevel(totalPoints);

    const achievements = [
        // ── Onboarding ──
        buildAchievement({
            id: 'profile-complete',
            name: 'Perfil completo',
            description: 'Completa los 5 datos base.',
            iconClass: 'bx bx-user-check',
            category: 'onboarding',
            current: profileCoreFields,
            target: 5,
            unit: 'datos'
        }),
        buildAchievement({
            id: 'visual-identity',
            name: 'Firma gamer',
            description: 'Avatar, placa, fondo y marco.',
            iconClass: 'bx bx-paint',
            category: 'onboarding',
            current: styleElements,
            target: 4,
            unit: 'items'
        }),
        buildAchievement({
            id: 'bio-live',
            name: 'Voz propia',
            description: 'Escribe tu bio.',
            iconClass: 'bx bx-edit-alt',
            category: 'onboarding',
            current: bioReady,
            target: 1,
            unit: 'paso'
        }),
        buildAchievement({
            id: 'multi-game',
            name: 'Multijuego',
            description: 'Selecciona 3 juegos.',
            iconClass: 'bx bx-joystick',
            category: 'onboarding',
            current: selectedGamesCount,
            target: 3,
            unit: 'juegos'
        }),
        buildAchievement({
            id: 'multi-language',
            name: 'Comunicador',
            description: 'Configura 2 idiomas.',
            iconClass: 'bx bx-globe',
            category: 'onboarding',
            current: languagesCount,
            target: 2,
            unit: 'idiomas'
        }),
        // ── Social ──
        buildAchievement({
            id: 'social-links',
            name: 'Perfil social',
            description: 'Agrega 3 redes sociales.',
            iconClass: 'bx bx-link',
            category: 'social',
            current: socialLinksCount,
            target: 3,
            unit: 'redes'
        }),
        buildAchievement({
            id: 'discord-ready',
            name: 'Discord listo',
            description: 'Vincula Discord.',
            iconClass: 'bx bxl-discord-alt',
            category: 'social',
            current: discordLinked,
            target: 1,
            unit: 'cuenta'
        }),
        buildAchievement({
            id: 'verified-gamer',
            name: 'Cuenta verificada',
            description: 'Verifica Riot o MLBB.',
            iconClass: 'bx bx-check-circle',
            category: 'social',
            current: verifiedGameAccount,
            target: 1,
            unit: 'cuenta'
        }),
        buildAchievement({
            id: 'first-friend',
            name: 'Primer amigo',
            description: '1 amistad mutua.',
            iconClass: 'bx bx-user-plus',
            category: 'social',
            current: mutualFriendsCount,
            target: 1,
            unit: 'amistad'
        }),
        buildAchievement({
            id: 'friend-network',
            name: 'Red activa',
            description: '5 amistades mutuas.',
            iconClass: 'bx bx-group',
            category: 'social',
            current: mutualFriendsCount,
            target: 5,
            unit: 'amistades'
        }),
        // ── Team ──
        buildAchievement({
            id: 'first-team',
            name: 'Primer equipo',
            description: 'Unete a un equipo.',
            iconClass: 'bx bx-shield-quarter',
            category: 'team',
            current: teamsCount,
            target: 1,
            unit: 'equipo'
        }),
        buildAchievement({
            id: 'team-captain',
            name: 'Capitan',
            description: 'Lidera un equipo.',
            iconClass: 'bx bx-crown',
            category: 'team',
            current: captainTeams,
            target: 1,
            unit: 'capitania'
        }),
        // ── Community ──
        buildAchievement({
            id: 'community-member',
            name: 'Miembro activo',
            description: 'Unete a una comunidad.',
            iconClass: 'bx bx-layer',
            category: 'community',
            current: communitiesCount,
            target: 1,
            unit: 'comunidad'
        }),
        buildAchievement({
            id: 'content-creator',
            name: 'Creador',
            description: 'Publica 3 posts.',
            iconClass: 'bx bx-message-rounded',
            category: 'community',
            current: postsCount,
            target: 3,
            unit: 'posts'
        }),
        buildAchievement({
            id: 'public-response',
            name: 'Popular',
            description: 'Recibe 10 likes.',
            iconClass: 'bx bx-heart',
            category: 'community',
            current: likesReceived,
            target: 10,
            unit: 'likes'
        }),
        // ── Competitive ──
        buildAchievement({
            id: 'tournament-rookie',
            name: 'Debut',
            description: 'Juega tu primer torneo.',
            iconClass: 'bx bx-trophy',
            category: 'competitive',
            current: tournamentsJoined,
            target: 1,
            unit: 'torneo'
        }),
        buildAchievement({
            id: 'tournament-regular',
            name: 'Veterano',
            description: 'Juega 5 torneos.',
            iconClass: 'bx bx-medal',
            category: 'competitive',
            current: tournamentsJoined,
            target: 5,
            unit: 'torneos'
        }),
        buildAchievement({
            id: 'match-grinder',
            name: 'Guerrero',
            description: '10 partidas oficiales.',
            iconClass: 'bx bx-bolt',
            category: 'competitive',
            current: matchesPlayed,
            target: 10,
            unit: 'partidas'
        }),
        buildAchievement({
            id: 'first-title',
            name: 'Primera corona',
            description: 'Gana un torneo.',
            iconClass: 'bx bx-trophy',
            category: 'competitive',
            current: tournamentsWon,
            target: 1,
            unit: 'titulo'
        }),
        buildAchievement({
            id: 'dynasty',
            name: 'Dinastia',
            description: 'Gana 5 torneos.',
            iconClass: 'bx bx-medal',
            category: 'competitive',
            current: tournamentsWon,
            target: 5,
            unit: 'titulos'
        })
    ];

    const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked).length;
    const sortedPointSources = [...pointSources].sort((a, b) => b.awardedPoints - a.awardedPoints);
    const highlights = [
        { id: 'points', label: 'Puntos', value: totalPoints, iconClass: 'bx bx-star' },
        { id: 'friends', label: 'Amigos', value: mutualFriendsCount, iconClass: 'bx bx-group' },
        { id: 'titles', label: 'Titulos', value: tournamentsWon, iconClass: 'bx bx-trophy' },
        { id: 'matches', label: 'Partidas', value: matchesPlayed, iconClass: 'bx bx-bolt' }
    ];

    return {
        totalPoints,
        unlockedAchievements,
        totalAchievements: achievements.length,
        achievementCompletionPercent: progressPercent(unlockedAchievements, achievements.length),
        level: {
            id: level.current.id,
            name: level.current.name,
            nextLevelName: level.next?.name || level.current.name,
            nextLevelPoints: level.nextLevelPoints,
            pointsIntoLevel: level.pointsIntoLevel,
            pointsNeeded: level.pointsNeeded,
            progressPercent: level.progressPercent
        },
        achievements,
        pointSources: sortedPointSources,
        highlights
    };
};

export default buildProfileProgression;
