const LEVELS = [
    { id: 'rookie', name: 'Rookie', minPoints: 0 },
    { id: 'aspirante', name: 'Aspirante', minPoints: 350 },
    { id: 'competidor', name: 'Competidor', minPoints: 800 },
    { id: 'estratega', name: 'Estratega', minPoints: 1400 },
    { id: 'capitan', name: 'Capitan', minPoints: 2100 },
    { id: 'elite', name: 'Elite', minPoints: 2900 },
    { id: 'campeon', name: 'Campeon', minPoints: 3800 },
    { id: 'leyenda', name: 'Leyenda', minPoints: 4700 }
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

    const pointSources = [
        buildSource({
            id: 'profile-core',
            label: 'Perfil base',
            description: 'Completa tus datos principales visibles en tu perfil.',
            current: profileCoreFields,
            target: 5,
            unit: 'datos',
            pointsPerUnit: 30
        }),
        buildSource({
            id: 'identity-style',
            label: 'Identidad visual',
            description: 'Personaliza avatar, placa, fondo y marco.',
            current: styleElements,
            target: 4,
            unit: 'items',
            pointsPerUnit: 25
        }),
        buildSource({
            id: 'bio-ready',
            label: 'Bio lista',
            description: 'Escribe una bio clara para tu perfil publico.',
            current: bioReady,
            target: 1,
            unit: 'estado',
            points: 60,
            binary: true
        }),
        buildSource({
            id: 'game-pool',
            label: 'Pool de juegos',
            description: 'Amplia tu perfil con varios juegos seleccionados.',
            current: selectedGamesCount,
            target: 5,
            unit: 'juegos',
            pointsPerUnit: 25
        }),
        buildSource({
            id: 'communication-kit',
            label: 'Rol e idiomas',
            description: 'Define roles y lenguajes para jugar mejor en equipo.',
            current: communicationScore,
            target: 6,
            unit: 'selecciones',
            pointsPerUnit: 10
        }),
        buildSource({
            id: 'social-links',
            label: 'Redes sociales',
            description: 'Conecta tus redes para ganar visibilidad.',
            current: socialLinksCount,
            target: 3,
            unit: 'redes',
            pointsPerUnit: 20
        }),
        buildSource({
            id: 'account-links',
            label: 'Cuentas conectadas',
            description: 'Vincula Discord y cuentas gaming verificadas.',
            current: connectionScore,
            target: 4,
            unit: 'cuentas',
            pointsPerUnit: 65
        }),
        buildSource({
            id: 'friend-network',
            label: 'Red de amigos',
            description: 'Suma amistades mutuas dentro de la plataforma.',
            current: mutualFriendsCount,
            target: 5,
            unit: 'amistades',
            pointsPerUnit: 30
        }),
        buildSource({
            id: 'teams',
            label: 'Trayectoria en equipos',
            description: 'Participa en escuadras y consolida tu historial.',
            current: teamsCount,
            target: 3,
            unit: 'equipos',
            pointsPerUnit: 100
        }),
        buildSource({
            id: 'leadership',
            label: 'Liderazgo',
            description: 'Capitanear equipos suma prestigio competitivo.',
            current: captainTeams,
            target: 2,
            unit: 'capitanias',
            pointsPerUnit: 80
        }),
        buildSource({
            id: 'community',
            label: 'Presencia en comunidad',
            description: 'Participa dentro de comunidades activas.',
            current: communitiesCount,
            target: 3,
            unit: 'comunidades',
            pointsPerUnit: 70
        }),
        buildSource({
            id: 'content',
            label: 'Contenido publicado',
            description: 'Comparte publicaciones y mantente visible.',
            current: postsCount,
            target: 5,
            unit: 'posts',
            pointsPerUnit: 40
        }),
        buildSource({
            id: 'engagement',
            label: 'Interaccion recibida',
            description: 'Likes y comentarios que reciben tus publicaciones.',
            current: engagementScore,
            target: 25,
            unit: 'interacciones',
            pointsPerUnit: 8
        }),
        buildSource({
            id: 'tournament-entries',
            label: 'Participacion en torneos',
            description: 'Inscribete y juega competiciones oficiales.',
            current: tournamentsJoined,
            target: 5,
            unit: 'torneos',
            pointsPerUnit: 150
        }),
        buildSource({
            id: 'official-matches',
            label: 'Partidas oficiales',
            description: 'Cada partida oficial completada suma experiencia.',
            current: matchesPlayed,
            target: 10,
            unit: 'partidas',
            pointsPerUnit: 25
        }),
        buildSource({
            id: 'official-wins',
            label: 'Victorias oficiales',
            description: 'Ganar tambien impulsa tus puntos de perfil.',
            current: matchesWon,
            target: 10,
            unit: 'victorias',
            pointsPerUnit: 35
        }),
        buildSource({
            id: 'tournament-titles',
            label: 'Titulos',
            description: 'Los campeonatos son el mayor impulso de puntos.',
            current: tournamentsWon,
            target: 5,
            unit: 'titulos',
            pointsPerUnit: 300
        }),
        buildSource({
            id: 'university',
            label: 'Verificacion universitaria',
            description: 'La validacion academica aporta prestigio adicional.',
            current: universityVerified,
            target: 1,
            unit: 'estado',
            points: 150,
            binary: true
        }),
        buildSource({
            id: 'looking-for-team',
            label: 'Disponible para reclutamiento',
            description: 'Activa tu estado de busqueda de equipo.',
            current: lookingForTeamActive,
            target: 1,
            unit: 'estado',
            points: 30,
            binary: true
        })
    ];

    const totalPoints = pointSources.reduce((acc, source) => acc + source.awardedPoints, 0);
    const level = resolveLevel(totalPoints);

    const achievements = [
        buildAchievement({
            id: 'profile-complete',
            name: 'Perfil completo',
            description: 'Completa los 5 datos base de tu perfil.',
            iconClass: 'bx bx-user-check',
            category: 'onboarding',
            current: profileCoreFields,
            target: 5,
            unit: 'datos'
        }),
        buildAchievement({
            id: 'visual-identity',
            name: 'Firma gamer',
            description: 'Activa avatar, placa, fondo y marco.',
            iconClass: 'bx bx-paint',
            category: 'onboarding',
            current: styleElements,
            target: 4,
            unit: 'items'
        }),
        buildAchievement({
            id: 'bio-live',
            name: 'Voz propia',
            description: 'Publica una bio de al menos 20 caracteres.',
            iconClass: 'bx bx-edit-alt',
            category: 'onboarding',
            current: bioReady,
            target: 1,
            unit: 'paso'
        }),
        buildAchievement({
            id: 'multi-game',
            name: 'Multijuego',
            description: 'Selecciona 3 juegos en tu perfil.',
            iconClass: 'bx bx-joystick',
            category: 'onboarding',
            current: selectedGamesCount,
            target: 3,
            unit: 'juegos'
        }),
        buildAchievement({
            id: 'multi-language',
            name: 'Comunicacion lista',
            description: 'Configura 2 idiomas visibles.',
            iconClass: 'bx bx-globe',
            category: 'onboarding',
            current: languagesCount,
            target: 2,
            unit: 'idiomas'
        }),
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
            description: 'Vincula tu cuenta de Discord.',
            iconClass: 'bx bxl-discord-alt',
            category: 'social',
            current: discordLinked,
            target: 1,
            unit: 'cuenta'
        }),
        buildAchievement({
            id: 'verified-gamer',
            name: 'Cuenta competitiva',
            description: 'Verifica al menos una cuenta Riot o MLBB.',
            iconClass: 'bx bx-check-circle',
            category: 'social',
            current: verifiedGameAccount,
            target: 1,
            unit: 'cuenta'
        }),
        buildAchievement({
            id: 'first-friend',
            name: 'Primer amigo',
            description: 'Consigue 1 amistad mutua.',
            iconClass: 'bx bx-user-plus',
            category: 'social',
            current: mutualFriendsCount,
            target: 1,
            unit: 'amistad'
        }),
        buildAchievement({
            id: 'friend-network',
            name: 'Red activa',
            description: 'Consigue 5 amistades mutuas.',
            iconClass: 'bx bx-group',
            category: 'social',
            current: mutualFriendsCount,
            target: 5,
            unit: 'amistades'
        }),
        buildAchievement({
            id: 'first-team',
            name: 'Primer equipo',
            description: 'Forma parte de tu primer roster.',
            iconClass: 'bx bx-shield-quarter',
            category: 'team',
            current: teamsCount,
            target: 1,
            unit: 'equipo'
        }),
        buildAchievement({
            id: 'team-captain',
            name: 'Capitan nato',
            description: 'Lidera al menos 1 equipo.',
            iconClass: 'bx bx-crown',
            category: 'team',
            current: captainTeams,
            target: 1,
            unit: 'capitania'
        }),
        buildAchievement({
            id: 'community-member',
            name: 'Comunidad viva',
            description: 'Unete a tu primera comunidad.',
            iconClass: 'bx bx-layer',
            category: 'community',
            current: communitiesCount,
            target: 1,
            unit: 'comunidad'
        }),
        buildAchievement({
            id: 'content-creator',
            name: 'Creador activo',
            description: 'Publica 3 posts dentro de la plataforma.',
            iconClass: 'bx bx-message-rounded',
            category: 'community',
            current: postsCount,
            target: 3,
            unit: 'posts'
        }),
        buildAchievement({
            id: 'public-response',
            name: 'Reaccion del publico',
            description: 'Recibe 10 likes en tus publicaciones.',
            iconClass: 'bx bx-heart',
            category: 'community',
            current: likesReceived,
            target: 10,
            unit: 'likes'
        }),
        buildAchievement({
            id: 'tournament-rookie',
            name: 'Debut competitivo',
            description: 'Participa en tu primer torneo.',
            iconClass: 'bx bx-trophy',
            category: 'competitive',
            current: tournamentsJoined,
            target: 1,
            unit: 'torneo'
        }),
        buildAchievement({
            id: 'tournament-regular',
            name: 'Circuito regular',
            description: 'Participa en 5 torneos.',
            iconClass: 'bx bx-medal',
            category: 'competitive',
            current: tournamentsJoined,
            target: 5,
            unit: 'torneos'
        }),
        buildAchievement({
            id: 'match-grinder',
            name: 'Guerrero oficial',
            description: 'Juega 10 partidas oficiales.',
            iconClass: 'bx bx-bolt',
            category: 'competitive',
            current: matchesPlayed,
            target: 10,
            unit: 'partidas'
        }),
        buildAchievement({
            id: 'first-title',
            name: 'Primera corona',
            description: 'Gana tu primer torneo.',
            iconClass: 'bx bx-trophy',
            category: 'competitive',
            current: tournamentsWon,
            target: 1,
            unit: 'titulo'
        }),
        buildAchievement({
            id: 'dynasty',
            name: 'Dinastia competitiva',
            description: 'Gana 5 torneos oficiales.',
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
