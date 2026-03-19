import mongoose from 'mongoose';
import User from '../models/User.js';

const formatDateTime = (value) => {
  if (!value) return '';

  try {
    return new Date(value).toLocaleString('es-DO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_) {
    return '';
  }
};

const formatArrayValue = (list = []) => {
  const values = Array.isArray(list)
    ? list.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  return values.join(', ');
};

const createCard = (label, value, options = {}) => {
  const normalizedValue = String(value ?? '').trim();
  if (!normalizedValue) return null;

  return {
    label,
    value: normalizedValue,
    highlight: options.highlight === true
  };
};

const createSection = (id, title, cards = [], options = {}) => {
  const normalizedCards = Array.isArray(cards) ? cards.filter(Boolean) : [];
  if (normalizedCards.length === 0) return null;

  return {
    id,
    title,
    description: options.description || '',
    cards: normalizedCards
  };
};

const formatLolRank = (rank = {}) => {
  const tier = String(rank?.tier || '').trim();
  const division = String(rank?.division || '').trim();
  const lp = Number.isFinite(Number(rank?.lp)) ? `${Number(rank.lp)} LP` : '';

  const parts = [tier, division].filter(Boolean);
  const base = parts.join(' ').trim();
  if (base && lp) return `${base} • ${lp}`;
  return base || lp || '';
};

const formatValorantRank = (rank = {}) => {
  const tier = String(rank?.tier || '').trim();
  const rr = Number.isFinite(Number(rank?.rr)) ? `${Number(rank.rr)} RR` : '';

  if (tier && rr) return `${tier} • ${rr}`;
  return tier || rr || '';
};

const formatMlbbStatus = (status = 'unlinked') => {
  const labels = {
    unlinked: 'No vinculada',
    pending: 'Pendiente de revisión',
    verified: 'Verificada',
    verified_auto: 'Verificada automáticamente',
    verified_manual: 'Verificada manualmente',
    rejected: 'Rechazada'
  };

  return labels[String(status || '').trim()] || 'Sin estado';
};

const buildOverviewSection = (user = {}) => {
  const roles = [];
  if (Array.isArray(user.roles)) roles.push(...user.roles);
  if (user.isOrganizer && !roles.includes('organizer')) roles.push('organizer');
  if (user.isAdmin && !roles.includes('admin')) roles.push('admin');

  const verifiedAccounts = [
    Boolean(user?.connections?.riot?.verified),
    Boolean(user?.connections?.mlbb?.verified),
    Boolean(user?.connections?.discord?.verified),
    Boolean(user?.connections?.steam?.verified),
    Boolean(user?.connections?.epic?.verified)
  ].filter(Boolean).length;

  return createSection(
    'profile-overview',
    'Perfil interno',
    [
      createCard('Correo', user?.email || '', { highlight: true }),
      createCard('Pais', user?.country || ''),
      createCard('Estado', user?.status || ''),
      createCard('Juegos elegidos', formatArrayValue(user?.selectedGames)),
      createCard('Roles', formatArrayValue(roles)),
      createCard('Cuentas verificadas', `${verifiedAccounts}`),
      createCard(
        'Universidad',
        user?.university?.verified
          ? user?.university?.universityName || 'Universidad verificada'
          : 'No verificada'
      ),
      createCard('Registro', formatDateTime(user?.createdAt || null))
    ],
    {
      description: 'Resumen administrativo del perfil y del estado general de sus conexiones.'
    }
  );
};

const buildLolSection = (user = {}) => {
  const riot = user?.connections?.riot || {};
  const riotProducts = riot?.products || {};
  const lolProduct = riotProducts?.lol || {};
  const lolProfile = user?.gameProfiles?.lol || {};
  const riotId = riot?.verified && riot?.gameName && riot?.tagLine
    ? `${riot.gameName}#${riot.tagLine}`
    : '';
  const rank = formatLolRank(lolProfile?.rank);
  const state = lolProfile?.exists
    ? 'Sincronizado'
    : lolProduct?.linked
      ? 'Vinculado sin sync reciente'
      : riot?.verified
        ? 'Riot vinculado'
        : 'No vinculado';

  return createSection(
    'lol-profile',
    'League of Legends',
    [
      createCard('Estado', state, { highlight: true }),
      createCard('Riot ID', riotId),
      createCard('Region', lolProfile?.platformRegion || ''),
      createCard('Nivel', lolProfile?.summonerLevel),
      createCard('Rango', rank),
      createCard('Sync', formatDateTime(lolProfile?.lastSyncAt || null)),
      createCard('Vinculado', formatDateTime(riot?.linkedAt || lolProduct?.linkedAt || null))
    ],
    {
      description: 'Datos reales sincronizados desde Riot para League of Legends cuando la cuenta está enlazada.'
    }
  );
};

const buildValorantSection = (user = {}) => {
  const riot = user?.connections?.riot || {};
  const riotProducts = riot?.products || {};
  const valorantProduct = riotProducts?.valorant || {};
  const valorantProfile = user?.gameProfiles?.valorant || {};
  const riotId = riot?.verified && riot?.gameName && riot?.tagLine
    ? `${riot.gameName}#${riot.tagLine}`
    : '';
  const rank = formatValorantRank(valorantProfile?.rank);
  const scopes = Array.isArray(valorantProduct?.scopes) ? valorantProduct.scopes.join(', ') : '';

  let state = 'No vinculado';
  if (riot?.verified) state = 'Riot vinculado';
  if (valorantProduct?.consentGranted) state = 'RSO autorizado';
  if (valorantProfile?.exists) state = 'Perfil sincronizado';

  return createSection(
    'valorant-profile',
    'VALORANT',
    [
      createCard('Estado', state, { highlight: true }),
      createCard('Riot ID', riotId),
      createCard('Consentimiento RSO', valorantProduct?.consentGranted ? 'Concedido' : 'Pendiente'),
      createCard('Scopes', scopes),
      createCard('Shard', valorantProfile?.shard || ''),
      createCard('Rango', rank || (valorantProduct?.consentGranted ? 'Pendiente de endpoint oficial' : '')),
      createCard('Sync', formatDateTime(valorantProfile?.lastSyncAt || null)),
      createCard('Consentido', formatDateTime(valorantProduct?.consentedAt || null))
    ],
    {
      description: 'VALORANT hoy muestra el estado real de autorizacion y del perfil enlazado. El rank oficial sigue atado a permisos/endpoints de Riot.'
    }
  );
};

const buildMlbbSection = (user = {}) => {
  const mlbbConnection = user?.connections?.mlbb || {};
  const mlbbProfile = user?.gameProfiles?.mlbb || {};
  const riskFlags = Array.isArray(mlbbConnection?.riskFlags) ? mlbbConnection.riskFlags.join(', ') : '';

  return createSection(
    'mlbb-profile',
    'Mobile Legends',
    [
      createCard('Estado', formatMlbbStatus(mlbbConnection?.verificationStatus), { highlight: true }),
      createCard('IGN', mlbbConnection?.ign || mlbbProfile?.ign || ''),
      createCard('Player ID', mlbbConnection?.playerId || mlbbProfile?.playerId || ''),
      createCard('Zone ID', mlbbConnection?.zoneId || mlbbProfile?.zoneId || ''),
      createCard('Verificada', mlbbConnection?.verified ? 'Si' : 'No'),
      createCard('Solicitud', formatDateTime(mlbbConnection?.reviewRequestedAt || null)),
      createCard('Revision', formatDateTime(mlbbConnection?.reviewedAt || null)),
      createCard('Sync', formatDateTime(mlbbProfile?.lastSyncAt || null)),
      createCard('Riesgos', riskFlags)
    ],
    {
      description: 'Estado interno de la cuenta MLBB dentro de GlitchGang, usando la verificación propia del producto.'
    }
  );
};

const buildNotes = (user = {}) => {
  const notes = [];
  const riot = user?.connections?.riot || {};
  const valorantProduct = riot?.products?.valorant || {};
  const lolProfile = user?.gameProfiles?.lol || {};
  const mlbbConnection = user?.connections?.mlbb || {};

  if (riot?.verified && riot?.gameName && riot?.tagLine) {
    notes.push(`Riot enlazado: ${riot.gameName}#${riot.tagLine}.`);
  } else {
    notes.push('El usuario no tiene una cuenta Riot verificada en GlitchGang.');
  }

  if (riot?.verified && !lolProfile?.exists) {
    notes.push('LoL esta vinculado pero todavia no tiene una sincronizacion util registrada.');
  }

  if (riot?.verified && !valorantProduct?.consentGranted) {
    notes.push('VALORANT sigue pendiente de consentimiento por Riot Sign On.');
  }

  if (mlbbConnection?.verificationStatus === 'pending') {
    notes.push('MLBB esta pendiente de revision administrativa.');
  }

  return notes;
};

const buildRawPayload = (user = {}) => ({
  user: {
    id: String(user?._id || ''),
    username: user?.username || '',
    email: user?.email || '',
    country: user?.country || '',
    status: user?.status || '',
    selectedGames: Array.isArray(user?.selectedGames) ? user.selectedGames : []
  },
  connections: {
    riot: user?.connections?.riot || {},
    mlbb: user?.connections?.mlbb || {}
  },
  gameProfiles: {
    lol: user?.gameProfiles?.lol || {},
    valorant: user?.gameProfiles?.valorant || {},
    mlbb: user?.gameProfiles?.mlbb || {}
  }
});

const buildAdminStatsPayload = (user = {}) => {
  const sections = [
    buildOverviewSection(user),
    buildLolSection(user),
    buildValorantSection(user),
    buildMlbbSection(user)
  ].filter(Boolean);

  const linkedGames = [
    Boolean(user?.connections?.riot?.verified),
    Boolean(user?.connections?.mlbb?.verified)
  ].filter(Boolean).length;

  return {
    game: {
      id: 'internal',
      name: 'Centro Admin'
    },
    identifier: String(user?.username || '').trim(),
    profile: {
      userId: String(user?._id || ''),
      handle: user?.username || 'Usuario',
      fullName: user?.fullName || '',
      avatarUrl: user?.avatar || '',
      subtitle: user?.email || ''
    },
    summary: {
      headline: {
        label: 'Perfiles conectados',
        value: `${linkedGames}/3`
      },
      subtitle: 'Vista interna de conexiones y perfiles sincronizados para los juegos activos del producto.'
    },
    notes: buildNotes(user),
    sections,
    raw: buildRawPayload(user)
  };
};

export const getAdminUserGameStats = async (req, res) => {
  try {
    const userId = String(req.params?.userId || '').trim();
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Usuario inválido.' });
    }

    const user = await User.findById(userId)
      .select(
        [
          'username',
          'fullName',
          'email',
          'avatar',
          'country',
          'status',
          'selectedGames',
          'roles',
          'isOrganizer',
          'isAdmin',
          'createdAt',
          'connections.discord.verified',
          'connections.riot',
          'connections.steam.verified',
          'connections.epic.verified',
          'connections.mlbb',
          'gameProfiles.lol',
          'gameProfiles.valorant',
          'gameProfiles.mlbb',
          'university.verified',
          'university.universityName'
        ].join(' ')
      )
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    return res.status(200).json(buildAdminStatsPayload(user));
  } catch (error) {
    console.error('Error en getAdminUserGameStats:', error);
    return res.status(500).json({ message: 'Error al obtener las estadisticas internas del perfil.' });
  }
};
