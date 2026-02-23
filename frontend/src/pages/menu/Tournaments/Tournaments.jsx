import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../../../config/api';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import './Tournaments.scss'; 
import { GAME_IMAGES } from '../../../data/gameImages';
import MatchCalendar from '../../../components/Calendar/MatchCalendar/WidgetCalendar';
import PageHud from '../../../components/PageHud/PageHud';


const GAME_CONFIG = {
  "All": { color: "#ffffff", icon: "bx-grid-alt" },
  "Valorant": { color: "#ff4655", icon: "bx-crosshair" },
  "CS:GO 2": { color: "#de9b35", icon: "bx-target-lock" },
  "Call of Duty": { color: "#54b946", icon: "bx-run" },
  "Warzone": { color: "#54b946", icon: "bx-radar" },
  "Fortnite": { color: "#a349a4", icon: "bx-building" },
  "Free Fire": { color: "#f39c12", icon: "bx-flame" },
  "PUBG": { color: "#f1c40f", icon: "bx-target-lock" },
  "Apex Legends": { color: "#e74c3c", icon: "bx-shield-quarter" },
  "Overwatch 2": { color: "#f39c12", icon: "bx-shield" },
  "Rainbow Six Siege": { color: "#3498db", icon: "bx-window" },
  "League of Legends": { color: "#c1a05e", icon: "bx-world" },
  "Dota 2": { color: "#e74c3c", icon: "bx-map-alt" },
  "Mobile Legends": { color: "#ffbf00", icon: "bx-mobile-landscape" },
  "Honor of Kings": { color: "#e6b333", icon: "bx-crown" },
  "Smite": { color: "#f1c40f", icon: "bx-bolt-circle" },
  "Wild Rift": { color: "#00a8ff", icon: "bx-mobile" },
  "FIFA 24": { color: "#2ecc71", icon: "bx-football" },
  "NBA 2K24": { color: "#e67e22", icon: "bx-basketball" },
  "Rocket League": { color: "#0088ff", icon: "bx-car" },
  "Street Fighter 6": { color: "#f39c12", icon: "bx-walk" },
  "Tekken 8": { color: "#c0392b", icon: "bx-angry" },
  "Clash Royale": { color: "#3498db", icon: "bx-crown" },
  "Teamfight Tactics": { color: "#f1c40f", icon: "bx-grid" },
  "Hearthstone": { color: "#f39c12", icon: "bx-book" },
  "Legends of Runeterra": { color: "#3498db", icon: "bx-book-open" },
  "StarCraft II": { color: "#00a8ff", icon: "bx-planet" }
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PROMO SLIDES â€” platform-branded carousel
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const PROMO_SLIDES = [
    {
        id: 1,
        gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        accent: '#8EDB15',
        icon: 'bx-trophy',
        badge: 'ESPORTEFY ARENA',
        title: 'COMPITE AL MÁXIMO NIVEL',
        subtitle: 'Inscríbete en torneos oficiales, demuestra tu skill y gana premios reales.',
        cta: 'Explorar Torneos',
        ctaIcon: 'bx-right-arrow-alt',
        ctaAction: 'scroll',
        particles: ['bx-game', 'bx-joystick', 'bx-trophy', 'bx-medal']
    },
    {
        id: 2,
        gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        accent: '#4facfe',
        icon: 'bx-crown',
        badge: 'ORGANIZADOR PRO',
        title: 'CREA TU PROPIO TORNEO',
        subtitle: 'Gestiona inscripciones, define premios y construye tu comunidad competitiva.',
        cta: 'Crear Torneo',
        ctaIcon: 'bx-plus',
        ctaAction: 'create',
        particles: ['bx-crown', 'bx-star', 'bx-shield', 'bx-diamond']
    },
    {
        id: 3,
        gradient: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)',
        accent: '#f093fb',
        icon: 'bx-group',
        badge: 'TEAM UP',
        title: 'ENCUENTRA TU ESCUADRA',
        subtitle: 'Forma equipo con los mejores jugadores y conquista la arena juntos.',
        cta: 'Armar Equipo',
        ctaIcon: 'bx-group',
        ctaAction: 'team',
        particles: ['bx-user', 'bx-group', 'bx-rocket', 'bx-world']
    }
];

const STATUS_CONFIG = {
    open:      { label: 'Abierto',    color: '#00ff88', icon: 'bx-check-circle' },
    ongoing:   { label: 'En curso',   color: '#4facfe', icon: 'bx-loader-circle' },
    finished:  { label: 'Finalizado', color: '#888',    icon: 'bx-flag' },
    cancelled: { label: 'Cancelado',  color: '#ef4444', icon: 'bx-x-circle' },
    draft:     { label: 'Borrador',   color: '#ffc107', icon: 'bx-pencil' },
};

const getTournamentStatusKey = (status) => {
  const raw = String(status || '').trim().toLowerCase();
  if (!raw) return 'open';

  if (['open', 'ongoing', 'finished', 'cancelled', 'draft'].includes(raw)) return raw;

  if (
    raw.includes('abiert') ||
    raw.includes('inscrip') ||
    raw.includes('registro abierto')
  ) return 'open';

  if (
    raw.includes('ongoing') ||
    raw.includes('en curso') ||
    raw.includes('curso') ||
    raw.includes('progreso') ||
    raw.includes('activo') ||
    raw.includes('iniciado')
  ) return 'ongoing';

  if (
    raw.includes('finished') ||
    raw.includes('finaliz') ||
    raw.includes('terminad') ||
    raw.includes('completad')
  ) return 'finished';

  if (raw.includes('cancel')) return 'cancelled';
  if (raw.includes('draft') || raw.includes('borrador')) return 'draft';

  return raw;
};
const isRegistrationOpenForTournament = (torneo) => (
  getTournamentStatusKey(torneo?.status) === 'open' && !Boolean(torneo?.registrationClosed)
);
const getTournamentStatusLabel = (status) => (
  STATUS_CONFIG[getTournamentStatusKey(status)]?.label || String(status || 'Sin estado')
);

const toAssetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_URL}/${path.replace(/^\//, '')}`;
};

const getInitials = (name) => {
  const parts = String(name || '').trim().split(' ').filter(Boolean);
  if (!parts.length) return 'EQ';
  return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('');
};

const BRACKET_FORMAT_LABELS = {
  single_elimination: 'Eliminación Directa',
  double_elimination: 'Doble Eliminación',
  swiss: 'Suizo (Swiss)',
  round_robin: 'Round Robin'
};

const normalizeBracketFormat = (formatValue) => {
  const raw = String(formatValue || '').trim().toLowerCase();
  if (!raw) return 'single_elimination';

  if (['single_elimination', 'double_elimination', 'swiss', 'round_robin'].includes(raw)) {
    return raw;
  }

  if (raw.includes('doble') || raw.includes('double')) return 'double_elimination';
  if (raw.includes('swiss') || raw.includes('suizo')) return 'swiss';
  if (raw.includes('round robin') || raw.includes('round_robin')) return 'round_robin';
  if (raw.includes('single') || raw.includes('direct') || raw.includes('eliminación') || raw.includes('eliminacion')) {
    return 'single_elimination';
  }

  return raw;
};

const getBracketFormatLabel = (formatValue) => {
  const formatKey = normalizeBracketFormat(formatValue);
  if (BRACKET_FORMAT_LABELS[formatKey]) return BRACKET_FORMAT_LABELS[formatKey];
  const raw = String(formatValue || '').trim();
  return raw || 'Por definir';
};

const formatTournamentFromApi = (t) => {
  const formatSource = t?.bracket?.format || t?.format || '';
  const formatKey = normalizeBracketFormat(formatSource);

  return {
    id: t._id,
    game: t.game,
    title: t.title,
    date: t.date ? new Date(t.date).toLocaleDateString() : '',
    dateRaw: t.date || '',
    prize: t.prizePool || t.prize,
    prizePool: t.prizePool || '',
    currency: t.currency || 'USD',
    slots: `${t.currentSlots}/${t.maxSlots}`,
    maxSlots: t.maxSlots,
    time: t.time,
    entry: t.entryFee || t.entry,
    entryFee: t.entryFee || '',
    organizer: t.organizer?.username || 'Organizador',
    organizerId: t.organizer?._id || t.organizer || '',
    format: getBracketFormatLabel(formatSource),
    formatKey,
    desc: t.description || 'Sin descripción disponible.',
    description: t.description || '',
    tournamentId: t.tournamentId,
    gender: t.gender,
    modality: t.modality,
    platform: t.platform,
    server: t.server,
    prizesByRank: t.prizesByRank,
    staff: t.staff,
    sponsors: t.sponsors,
    registrations: t.registrations || [],
    bracket: t.bracket || null,
    status: t.status,
    registrationClosed: t.registrationClosed,
    riotRequirements: t.riotRequirements,
    bannerImage: toAssetUrl(t.bannerImage),
    rulesPdf: toAssetUrl(t.rulesPdf)
  };
};

const RIOT_GAMES = new Set([
  'Valorant',
  'League of Legends',
  'Wild Rift',
  'Teamfight Tactics',
  'Legends of Runeterra'
]);

const isRiotGame = (game) => RIOT_GAMES.has(game);

const BRACKET_STATUS_LABELS = {
  pending: 'Pendiente',
  ready: 'Listo',
  walkover: 'Walkover',
  live: 'En juego',
  finished: 'Finalizado'
};

const CONFIRMATION_STATUS_LABELS = {
  unconfirmed: 'Esperando confirmación',
  agreed: 'Confirmado por ambos',
  disputed: 'En disputa',
  resolved: 'Resuelto por staff'
};

const getBracketStatusLabel = (status) => BRACKET_STATUS_LABELS[String(status || '').toLowerCase()] || 'Pendiente';
const getConfirmationStatusLabel = (status) => CONFIRMATION_STATUS_LABELS[String(status || '').toLowerCase()] || 'Esperando confirmación';
const normalizeRegistrationStatus = (status) => (String(status || 'approved').toLowerCase() || 'approved');
const isApprovedRegistration = (reg) => normalizeRegistrationStatus(reg?.status) === 'approved';
const PREVIEW_SLOT_PREFIX = 'PREVIEW-SLOT-';

const nextPowerOfTwo = (value) => {
  const normalized = Math.max(Number(value) || 0, 2);
  return 2 ** Math.ceil(Math.log2(normalized));
};

const buildPreviewSlotRef = (index) => `${PREVIEW_SLOT_PREFIX}${index + 1}`;
const isPreviewSlotRef = (value) => String(value || '').startsWith(PREVIEW_SLOT_PREFIX);
const pickRandomIndex = (list = []) => list[Math.floor(Math.random() * list.length)];

const buildCustomSeedOrder = ({
  seedEntries = [],
  previousOrder = [],
  bracketSize = 2
}) => {
  const size = Math.max(Number(bracketSize) || 0, 2);
  const slotRefs = Array.from({ length: size }, (_, index) => buildPreviewSlotRef(index));
  const teamRefs = seedEntries.map((entry) => String(entry.refId || '')).filter(Boolean);
  const validTeamRefSet = new Set(teamRefs);

  const nextOrder = [...slotRefs];
  const placedRefs = new Set();
  const previousItems = Array.isArray(previousOrder) ? previousOrder : [];

  previousItems.forEach((refId, index) => {
    if (!validTeamRefSet.has(refId)) return;
    if (placedRefs.has(refId)) return;
    if (index < 0 || index >= size) return;
    if (!isPreviewSlotRef(nextOrder[index])) return;
    nextOrder[index] = refId;
    placedRefs.add(refId);
  });

  teamRefs.forEach((refId) => {
    if (placedRefs.has(refId)) return;
    const emptyIndexes = nextOrder
      .map((item, index) => (isPreviewSlotRef(item) ? index : -1))
      .filter((index) => index >= 0);
    if (!emptyIndexes.length) return;
    const selectedIndex = pickRandomIndex(emptyIndexes);
    nextOrder[selectedIndex] = refId;
    placedRefs.add(refId);
  });

  return nextOrder;
};

const CLASSIC_NODE_HEIGHT = 58;
const CLASSIC_BASE_GAP = 10;
const BRACKET_SCALE_MIN = 0.75;
const BRACKET_SCALE_MAX = 1.35;
const BRACKET_SCALE_STEP = 0.1;

const isSingleEliminationFormat = (formatValue) => normalizeBracketFormat(formatValue) === 'single_elimination';

const getRegistrationByParticipant = (participant, registrations = []) => {
  const registrationId = String(participant?.registrationId || '');
  const teamId = String(participant?.teamId || '');
  return (registrations || []).find((reg) => {
    const regId = String(reg?._id || '');
    const regTeamId = String(reg?.teamId || '');
    if (registrationId && regId && regId === registrationId) return true;
    if (teamId && regTeamId && regTeamId === teamId) return true;
    return false;
  }) || null;
};

const getBracketParticipantKey = (participant = {}) => (
  String(
    participant?.registrationId
    || participant?.teamId
    || participant?.refId
    || ''
  )
);

const isPlayableBracketTeam = (participant = null) => (
  Boolean(participant)
  && !Boolean(participant?.isBye)
  && !Boolean(participant?.isPlaceholder)
  && Boolean(getBracketParticipantKey(participant))
);

const Tournaments = () => {
  const navigate = useNavigate();
  const { tournamentId: routeTournamentId } = useParams();
  const { notify } = useNotification(); 
  
  const { user, loading } = useAuth(); 
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAllFilters, setShowAllFilters] = useState(false);

  const [tournaments, setTournaments] = useState([]); // Ahora inicia vacío
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  
  // ESTADO MODAL ORGANIZADOR
  const [showInfoModal, setShowInfoModal] = useState(false); 
  const [current, setCurrent] = useState(0);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [showTeamPreview, setShowTeamPreview] = useState(false);
  const [selectedTeamIdForPreview, setSelectedTeamIdForPreview] = useState(null);
  const [selectedTeamPreview, setSelectedTeamPreview] = useState(null);
  const rightPanelRef = useRef(null);
  const bracketPanRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
    element: null
  });
  const [rosterTeamIds, setRosterTeamIds] = useState([]);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [showBracketPreview, setShowBracketPreview] = useState(false);
  const [showBracketManagement, setShowBracketManagement] = useState(false);
  const [previewBracket, setPreviewBracket] = useState(null);
  const [bracketLoading, setBracketLoading] = useState(false);
  const [customSeedingOpen, setCustomSeedingOpen] = useState(false);
  const [customSeedOrder, setCustomSeedOrder] = useState([]);
  const [dragSeedRefId, setDragSeedRefId] = useState('');
  const [dragOverSeedRefId, setDragOverSeedRefId] = useState('');
  const [matchActionLoadingId, setMatchActionLoadingId] = useState('');
  const [statusActionLoading, setStatusActionLoading] = useState('');
  const [bracketScale, setBracketScale] = useState(1);

  useEffect(() => {
    setBracketScale(1);
  }, [selectedTournament?.tournamentId]);

  const userTeamIds = Array.isArray(user?.teams)
    ? user.teams.map((t) => String(t?._id || t))
    : [];
  const effectiveTeamIds = userTeamIds.length ? userTeamIds : rosterTeamIds;
  const currentUserId = String(user?._id || user?.id || '');

  const seedEntries = useMemo(() => {
    const regs = (selectedTournament?.registrations || []).filter(isApprovedRegistration);
    return regs.map((reg, index) => ({
      refId: String(reg?._id || `REG-${index + 1}`),
      registrationId: String(reg?._id || ''),
      teamId: String(reg?.teamId || ''),
      teamName: reg?.teamName || `Equipo ${index + 1}`,
      logoUrl: reg?.logoUrl ? toAssetUrl(reg.logoUrl) : '',
      seed: index + 1
    }));
  }, [selectedTournament]);

  const customBracketSize = useMemo(() => {
    const maxSlots = Math.max(Number(selectedTournament?.maxSlots) || 0, 2);
    return nextPowerOfTwo(Math.max(maxSlots, seedEntries.length, 2));
  }, [selectedTournament?.maxSlots, seedEntries.length]);

  const seedEntryMap = useMemo(() => (
    new Map(seedEntries.map((entry) => [entry.refId, entry]))
  ), [seedEntries]);

  const customSeedSlots = useMemo(() => {
    const safeOrder = customSeedOrder.length === customBracketSize
      ? customSeedOrder
      : buildCustomSeedOrder({
        seedEntries,
        previousOrder: customSeedOrder,
        bracketSize: customBracketSize
      });

    return safeOrder.map((refId, index) => {
      const entry = seedEntryMap.get(refId);
      return {
        slot: index + 1,
        refId,
        entry,
        isEmpty: !entry
      };
    });
  }, [customSeedOrder, customBracketSize, seedEntries, seedEntryMap]);

  const hasGeneratedBracket = Array.isArray(selectedTournament?.bracket?.rounds) && selectedTournament.bracket.rounds.length > 0;
  const bracketRounds = hasGeneratedBracket ? selectedTournament.bracket.rounds : [];
  const previewRounds = Array.isArray(previewBracket?.rounds) ? previewBracket.rounds : [];
  const visibleBracketRounds = previewRounds.length ? previewRounds : bracketRounds;
  const hasVisibleBracket = visibleBracketRounds.length > 0;
  const bracketFormat = previewBracket?.format
    || selectedTournament?.bracket?.format
    || selectedTournament?.formatKey
    || selectedTournament?.format
    || '';
  const bracketFormatKey = normalizeBracketFormat(bracketFormat);
  const useClassicBracketLayout = hasVisibleBracket && isSingleEliminationFormat(bracketFormatKey);
  const useDoubleEliminationLayout = hasVisibleBracket && bracketFormatKey === 'double_elimination';
  const useRoundRobinLayout = hasVisibleBracket && bracketFormatKey === 'round_robin';

  const seedSignature = seedEntries.map((entry) => entry.refId).join('|');

  const hasRegisteredTeam = (tournament) => {
    if (!tournament) return false;
    const regs = Array.isArray(tournament.registrations) ? tournament.registrations : [];
    const uid = user?._id || user?.id;
    return regs.some((r) => {
      if (uid && String(r.captain) === String(uid)) return true;
      if (r.teamId && effectiveTeamIds.includes(String(r.teamId))) return true;
      return false;
    });
  };

  // Helper para obtener imagen segura
  const getGameImage = (gameName) => {
    return GAME_IMAGES[gameName] || GAME_IMAGES["Default"];
  };
/*
  // --- DATOS COMPLETOS DE TORNEOS ---
  const [tournaments] = useState([
    { 
        id: 1, game: 'Valorant', title: 'Valorant Masters: Tokyo', date: '2024-10-24', prize: '$50,000', slots: '12/16', 
        time: '18:00 EST', entry: '$10 USD', organizer: 'Riot Games', format: '5v5 - Elim. Simple',
        desc: 'El torneo más competitivo de la temporada. Requiere rango Ascendente o superior. Anti-cheat Vanguard obligatorio. Mapas: Bind, Haven, Split.'
    },
    { 
        id: 2, game: 'League of Legends', title: "Summoner's Cup: Regional", date: '2024-10-25', prize: '$10,000', slots: '32/32', 
        time: '20:00 EST', entry: 'Gratis', organizer: 'Esportefy Latam', format: '5v5 - Grieta',
        desc: 'Torneo abierto para toda la comunidad. Ideal para equipos amateur que buscan su primera experiencia competitiva. Modo Draft con 3 baneos.'
    },
    { 
        id: 3, game: 'CS:GO 2', title: 'Blast Premier Fall Showdown', date: '2024-11-05', prize: '$100,000', slots: '15/16', 
        time: '21:00 EST', entry: '$50 USD', organizer: 'BLAST Premier', format: '5v5 - BO3',
        desc: 'Clasificatorio directo para la Major. Solo equipos verificados con Prime Status activo. Se requiere check-in 1 hora antes.'
    },
    { 
        id: 4, game: 'Free Fire', title: 'Copa Survivors Latam', date: '2024-11-08', prize: '$5,000', slots: '45/48', 
        time: '19:00 EST', entry: 'Gratis', organizer: 'Garena', format: 'Squads - Battle Royale',
        desc: 'Demuestra quién manda en Bermuda. 3 mapas rotativos. Puntos por kill y posicionamiento. ¡Booyah garantizado para el ganador!'
    },
    { 
        id: 5, game: 'FIFA 24', title: 'Ultimate Team Championship', date: '2024-11-12', prize: '$2,000', slots: '60/64', 
        time: '14:00 EST', entry: '$5 USD', organizer: 'EA Sports', format: '1v1 - Global Series',
        desc: 'Torneo oficial de fin de semana. Prohibido el uso de jugadores cedidos. Formato de ida y vuelta con gol de oro en desempate.'
    },
    { 
        id: 6, game: 'Rocket League', title: 'Nitro League 3v3', date: '2024-11-15', prize: '$1,500', slots: '8/16', 
        time: '17:30 EST', entry: 'Gratis', organizer: 'Psyonix Community', format: '3v3 - Estándar',
        desc: 'Acelera y vuela hacia la victoria. Torneo rápido de eliminación doble. Se permiten suplentes registrados previamente.'
    },
    { 
        id: 7, game: 'Call of Duty', title: 'Warfare Elite Ops', date: '2024-11-20', prize: '$15,000', slots: '10/12', 
        time: '22:00 EST', entry: '$20 USD', organizer: 'Activision', format: '4v4 - Hardpoint/S&D',
        desc: 'Rotación de modos competitivos (CDL Ruleset). Prohibidas las armas restringidas por la liga oficial. Solo PC y Consola (Crossplay ON).'
    },
    { 
        id: 8, game: 'Rainbow Six Siege', title: 'Operator League: Six Invite', date: '2024-11-25', prize: '$8,000', slots: '4/8', 
        time: '16:00 EST', entry: '$15 USD', organizer: 'Ubisoft', format: '5v5 - Bomb',
        desc: 'Táctica y destrucción. Mapas competitivos oficiales. Se requiere Moss Anti-Cheat ejecutándose en segundo plano.'
    }
  ]);*///juegos de ejemplo

  // --- LOGICA CARRUSEL ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === PROMO_SLIDES.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // --- CARGA DINÁMICA DE TORNEOS ---
useEffect(() => {
    const fetchTournaments = async () => {
        try {
            setLoadingTournaments(true);
            const response = await axios.get(`${API_URL}/api/tournaments`);
            
            // Adaptamos los datos de la base de datos al formato que usa tu diseño
            const formattedTournaments = response.data.map(formatTournamentFromApi);

            setTournaments(formattedTournaments);
        } catch (err) {
            console.error("Error cargando torneos:", err);
            notify('danger', 'Error', 'No se pudieron cargar los torneos de la base de datos.');
        } finally {
            setLoadingTournaments(false);
        }
    };

    fetchTournaments();
}, []);

  useEffect(() => {
    const loadRosterTeams = async () => {
      if (!user?._id) return;
      if (userTeamIds.length > 0) return;
      try {
        const res = await axios.get(`${API_URL}/api/teams`);
        const uid = String(user._id);
        const ids = (res.data || [])
          .filter((t) => {
            const starters = Array.isArray(t.roster?.starters) ? t.roster.starters : [];
            const subs = Array.isArray(t.roster?.subs) ? t.roster.subs : [];
            const coach = t.roster?.coach;
            return starters.some(p => String(p?.user) === uid) ||
              subs.some(p => String(p?.user) === uid) ||
              (coach && String(coach.user) === uid);
          })
          .map((t) => String(t._id));
        setRosterTeamIds(ids);
      } catch (_) {
        // no bloquear
      }
    };
    loadRosterTeams();
  }, [user?._id, userTeamIds.length]);

  const fetchTournamentDetails = async (tournamentCode) => {
    const response = await axios.get(`${API_URL}/api/tournaments/${tournamentCode}`);
    return formatTournamentFromApi(response.data);
  };

  const closeTournamentDetails = () => {
    setSelectedTournament(null);
    setShowBracketPreview(false);
    setShowBracketManagement(false);
    setCustomSeedingOpen(false);
    setPreviewBracket(null);
    if (routeTournamentId) {
      navigate('/tournaments', { replace: true });
    }
  };

  const openTournamentDetails = async (torneo) => {
    setDetailLoading(true);
    setShowBracketPreview(false);
    setShowBracketManagement(false);
    setCustomSeedingOpen(false);
    setPreviewBracket(null);
    setSelectedTournament({ ...torneo });
    try {
      const formatted = await fetchTournamentDetails(torneo.tournamentId);
      setSelectedTournament({ ...torneo, ...formatted });
    } catch (err) {
      console.error('Error cargando detalle del torneo:', err);
      notify('danger', 'Error', 'No se pudo cargar el detalle del torneo.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (!routeTournamentId || loadingTournaments) return;

    const normalizedRouteId = String(routeTournamentId).toLowerCase();
    const selectedId = String(selectedTournament?.tournamentId || '').toLowerCase();
    if (selectedId === normalizedRouteId) return;

    const fromList = tournaments.find(
      (t) => String(t.tournamentId || '').toLowerCase() === normalizedRouteId
    );

    if (fromList) {
      openTournamentDetails(fromList);
      return;
    }

    let cancelled = false;
    const loadDirect = async () => {
      setDetailLoading(true);
      setShowBracketPreview(false);
      setShowBracketManagement(false);
      setCustomSeedingOpen(false);
      setPreviewBracket(null);
      try {
        const formatted = await fetchTournamentDetails(routeTournamentId);
        if (!cancelled) setSelectedTournament(formatted);
      } catch (err) {
        if (!cancelled) {
          console.error('Error cargando torneo por URL:', err);
          notify('warning', 'Torneo no encontrado', `No existe el torneo "${routeTournamentId}".`);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };

    loadDirect();
    return () => { cancelled = true; };
  }, [routeTournamentId, loadingTournaments, tournaments, selectedTournament?.tournamentId]);

  useEffect(() => {
    if (!selectedTournament) {
      setCustomSeedOrder([]);
      setShowBracketPreview(false);
      setShowBracketManagement(false);
      setCustomSeedingOpen(false);
      setPreviewBracket(null);
      return;
    }
    setCustomSeedOrder((prev) => buildCustomSeedOrder({
      seedEntries,
      previousOrder: prev,
      bracketSize: customBracketSize
    }));
    setDragSeedRefId('');
    setDragOverSeedRefId('');
    setMatchActionLoadingId('');
  }, [selectedTournament?.tournamentId, seedSignature, customBracketSize]);

  useEffect(() => {
    if (!selectedTournament?.tournamentId) return;
    if (getTournamentStatusKey(selectedTournament?.status) !== 'open') return;
    if (!selectedTournament?.bracket?.isProvisional) return;

    let cancelled = false;
    const intervalId = setInterval(async () => {
      try {
        const fresh = await fetchTournamentDetails(selectedTournament.tournamentId);
        if (cancelled) return;
        setSelectedTournament((prev) => {
          if (!prev || prev.tournamentId !== fresh.tournamentId) return prev;
          return { ...prev, ...fresh };
        });
      } catch (_) {
        // silent refresh for live provisional bracket
      }
    }, 12000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [selectedTournament?.tournamentId, selectedTournament?.status, selectedTournament?.bracket?.isProvisional]);

  const handleDotClick = (index) => setCurrent(index);
  const activeSlide = PROMO_SLIDES[current] || PROMO_SLIDES[0];

  const filteredTournaments = activeFilter === 'All' 
    ? tournaments 
    : tournaments.filter(t => t.game === activeFilter);

  // --- FILTERED + SEARCH ---
  const displayTournaments = useMemo(() => {
    let list = filteredTournaments;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.game?.toLowerCase().includes(q) ||
        t.organizer?.toLowerCase().includes(q) ||
        t.tournamentId?.toLowerCase().includes(q)
      );
    }
    if (activeStatus !== 'all') {
      list = list.filter((t) => getTournamentStatusKey(t.status) === activeStatus);
    }
    return list;
  }, [filteredTournaments, search, activeStatus]);

  // --- STATS ---
  const stats = useMemo(() => {
    const active = tournaments.filter((t) => {
      const statusKey = getTournamentStatusKey(t.status);
      return statusKey === 'open' || statusKey === 'ongoing';
    });
    const totalPrize = tournaments.reduce((sum, t) => {
      const num = parseFloat(String(t.prize || '0').replace(/[^0-9.]/g, ''));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
    const uniqueGames = new Set(tournaments.map(t => t.game)).size;
    return { total: tournaments.length, active: active.length, totalPrize, uniqueGames };
  }, [tournaments]);

  // --- CLICK OUTSIDE SIDEBAR ---
  useEffect(() => {
    const handleClickOutsideRight = (event) => {
      if (isRightPanelOpen && rightPanelRef.current && !rightPanelRef.current.contains(event.target)) {
        if (!event.target.closest('.toggle-right-sidebar-btn')) {
            setIsRightPanelOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutsideRight);
    return () => document.removeEventListener("mousedown", handleClickOutsideRight);
  }, [isRightPanelOpen]);

  const goToRegistration = (torneo) => navigate('/team-registration', { state: { tournament: torneo } });
  const needsRiot = (torneo) => isRiotGame(torneo.game) && torneo?.riotRequirements?.required;
  const hasRiotLinked = Boolean(user?.connections?.riot?.verified);

  const canManageTournament = (torneo) => {
    if (!user) return false;
    return user?.isAdmin === true || String(torneo?.organizerId) === String(user?._id);
  };

  const goToEditTournament = (torneo) => {
    navigate('/create-tournament', { state: { editTournament: torneo } });
  };

  const updateRegistrationStatus = async (torneo, registrationId, status) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.patch(
        `${API_URL}/api/tournaments/${torneo.tournamentId}/registrations/${registrationId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const fresh = await fetchTournamentDetails(torneo.tournamentId);
      setSelectedTournament((prev) => (prev ? { ...prev, ...fresh } : prev));
      notify('success', 'Estado actualizado', `Equipo ${status === 'approved' ? 'aprobado' : 'rechazado'}.`);
    } catch (err) {
      console.error('Error actualizando registro:', err);
      notify('danger', 'Error', err.response?.data?.message || 'No se pudo actualizar el estado del equipo.');
    }
  };

  const removeRegistration = async (torneo, registrationId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.delete(
        `${API_URL}/api/tournaments/${torneo.tournamentId}/registrations/${registrationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const fresh = await fetchTournamentDetails(torneo.tournamentId);
      setSelectedTournament((prev) => (prev ? { ...prev, ...fresh } : prev));
      notify('success', 'Equipo removido', 'El equipo fue eliminado del torneo.');
    } catch (err) {
      notify('danger', 'Error', err.response?.data?.message || 'No se pudo remover el equipo.');
    }
  };

  const updateTournamentStatus = async (torneo, action) => {
    if (!torneo?.tournamentId || !action) {
      notify('danger', 'Error', 'No se pudo determinar el torneo o la acción.');
      return;
    }
    if (statusActionLoading) return;

    const confirmations = {
      start: '¿Seguro que deseas iniciar este torneo? Se cerrarán las inscripciones.',
      finish: '¿Seguro que deseas finalizar este torneo?',
      cancel: '¿Seguro que deseas cancelar este torneo?'
    };
    if (confirmations[action] && !window.confirm(confirmations[action])) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        notify('danger', 'Sesión expirada', 'Inicia sesión nuevamente para gestionar el torneo.');
        return;
      }

      setStatusActionLoading(action);
      const response = await axios.patch(
        `${API_URL}/api/tournaments/${torneo.tournamentId}/status`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedTournament((prev) => prev ? ({
        ...prev,
        status: response.data.status,
        registrationClosed: response.data.registrationClosed
      }) : prev);
      setTournaments((prev) => prev.map((item) => (
        item.tournamentId === torneo.tournamentId
          ? { ...item, status: response.data.status, registrationClosed: response.data.registrationClosed }
          : item
      )));
      const fresh = await fetchTournamentDetails(torneo.tournamentId);
      setSelectedTournament((prev) => (prev ? { ...prev, ...fresh } : prev));
      setTournaments((prev) => prev.map((item) => (
        item.tournamentId === torneo.tournamentId
          ? { ...item, ...fresh }
          : item
      )));

      const successMessages = {
        open: 'Inscripciones abiertas correctamente.',
        close: 'Inscripciones cerradas correctamente.',
        start: 'El torneo se inició correctamente.',
        finish: 'El torneo se finalizó correctamente.',
        cancel: 'El torneo se canceló correctamente.'
      };
      notify(
        'success',
        'Estado actualizado',
        successMessages[action] || `El torneo ahora está ${getTournamentStatusLabel(response.data.status).toLowerCase()}.`
      );
    } catch (err) {
      console.error('Error actualizando estado:', err);
      notify('danger', 'Error', err.response?.data?.message || 'No se pudo actualizar el estado del torneo.');
    } finally {
      setStatusActionLoading('');
    }
  };

  const toggleCustomSeeding = () => {
    setCustomSeedOrder((prev) => buildCustomSeedOrder({
      seedEntries,
      previousOrder: prev,
      bracketSize: customBracketSize
    }));
    setCustomSeedingOpen((prev) => !prev);
  };

  const moveSeedItem = (fromIndex, toIndex) => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    setCustomSeedOrder((prev) => {
      const next = [...prev];
      const source = next[fromIndex];
      next[fromIndex] = next[toIndex];
      next[toIndex] = source;
      return next;
    });
  };

  const handleSeedDragStart = (refId) => {
    setDragSeedRefId(refId);
  };

  const handleSeedDrop = (targetRefId) => {
    if (!dragSeedRefId || !targetRefId || dragSeedRefId === targetRefId) {
      setDragSeedRefId('');
      setDragOverSeedRefId('');
      return;
    }
    setCustomSeedOrder((prev) => {
      const sourceIndex = prev.findIndex((ref) => ref === dragSeedRefId);
      const targetIndex = prev.findIndex((ref) => ref === targetRefId);
      if (sourceIndex < 0 || targetIndex < 0) return prev;
      const next = [...prev];
      const source = next[sourceIndex];
      next[sourceIndex] = next[targetIndex];
      next[targetIndex] = source;
      return next;
    });
    setDragSeedRefId('');
    setDragOverSeedRefId('');
  };

  const requestBracket = async (torneo, mode = 'random', previewOnly = false) => {
    if (!torneo) return;

    try {
      setBracketLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const payload = { seedingMode: mode, previewOnly };
      if (mode === 'custom') {
        const customOrder = customSeedSlots.map((slot) => slot.refId);
        const placedTeamRefs = customOrder.filter((refId) => seedEntryMap.has(refId));
        if (placedTeamRefs.length !== seedEntries.length) {
          notify('warning', 'Orden incompleto', 'Debes ubicar todos los equipos en el orden personalizado.');
          return;
        }
        payload.customOrder = customOrder;
      }

      const response = await axios.post(
        `${API_URL}/api/tournaments/${torneo.tournamentId}/bracket/generate`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (previewOnly) {
        setPreviewBracket(response.data?.bracket || null);
        setShowBracketManagement(false);
        setShowBracketPreview(true);
        notify('success', 'Vista previa lista', 'Puedes revisar el bracket antes de guardarlo.');
        return;
      }

      setPreviewBracket(null);
      setShowBracketManagement(false);
      setSelectedTournament((prev) => prev ? ({ ...prev, bracket: response.data?.bracket || null }) : prev);
      const fresh = await fetchTournamentDetails(torneo.tournamentId);
      setSelectedTournament((prev) => (prev ? { ...prev, ...fresh } : prev));
      setShowBracketPreview(true);
      setCustomSeedingOpen(false);
      notify('success', 'Bracket generado', `Se guardó el bracket ${mode === 'custom' ? 'personalizado' : 'aleatorio'}.`);
    } catch (err) {
      notify('danger', 'Error', err.response?.data?.message || 'No se pudo generar el bracket.');
    } finally {
      setBracketLoading(false);
    }
  };

  const generateBracket = (torneo, mode = 'random') => requestBracket(torneo, mode, false);
  const previewBracketRequest = (torneo, mode = 'random') => requestBracket(torneo, mode, true);

  const getUserSideForMatch = (match, registrations = [], userId = '') => {
    if (!userId) return '';
    const sides = [
      ['A', match?.teamA],
      ['B', match?.teamB]
    ];
    for (const [side, participant] of sides) {
      if (!participant || participant?.isBye || participant?.isPlaceholder) continue;
      const reg = getRegistrationByParticipant(participant, registrations);
      const captainId = String(reg?.captain?._id || reg?.captain || '');
      if (captainId && captainId === String(userId)) return side;
    }
    return '';
  };

  const isMatchClosed = (match) => ['finished', 'walkover'].includes(String(match?.status || '').toLowerCase());

  const submitMatchResult = async (torneo, match, winnerRefId) => {
    if (!torneo || !match?.matchId || !winnerRefId) return;
    try {
      setMatchActionLoadingId(match.matchId);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/tournaments/${torneo.tournamentId}/bracket/matches/${match.matchId}/submit`,
        { winnerRefId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedTournament((prev) => prev ? ({
        ...prev,
        bracket: response.data?.bracket || prev.bracket,
        status: response.data?.tournamentStatus || prev.status
      }) : prev);
      notify('success', 'Resultado reportado', response.data?.message || 'Se reportó el resultado del match.');
    } catch (err) {
      notify('danger', 'Error', err.response?.data?.message || 'No se pudo reportar el resultado.');
    } finally {
      setMatchActionLoadingId('');
    }
  };

  const resolveMatchResult = async (torneo, match, winnerRefId) => {
    if (!torneo || !match?.matchId || !winnerRefId) return;
    try {
      setMatchActionLoadingId(match.matchId);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.patch(
        `${API_URL}/api/tournaments/${torneo.tournamentId}/bracket/matches/${match.matchId}/resolve`,
        { winnerRefId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedTournament((prev) => prev ? ({
        ...prev,
        bracket: response.data?.bracket || prev.bracket,
        status: response.data?.tournamentStatus || prev.status
      }) : prev);
      notify('success', 'Resultado validado', response.data?.message || 'El match fue resuelto.');
    } catch (err) {
      notify('danger', 'Error', err.response?.data?.message || 'No se pudo validar el resultado.');
    } finally {
      setMatchActionLoadingId('');
    }
  };

  const openTeamPreview = async (registration) => {
    if (!registration) return;

    const fallbackTeam = {
      _id: registration?.teamId || registration?._id || '',
      name: registration?.teamName || 'Equipo',
      logo: registration?.logoUrl || '',
      bannerImage: '',
      game: selectedTournament?.game || '',
      category: registration?.teamMeta?.category || '',
      teamCountry: registration?.teamMeta?.teamCountry || '',
      teamLevel: registration?.teamMeta?.teamLevel || '',
      roster: {
        coach: { nickname: registration?.teamMeta?.coach || '' },
        starters: Array.isArray(registration?.roster?.starters) ? registration.roster.starters : [],
        subs: Array.isArray(registration?.roster?.subs) ? registration.roster.subs : []
      }
    };

    if (!registration?.teamId) {
      setSelectedTeamPreview(fallbackTeam);
      setShowTeamPreview(true);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/api/teams`);
      const team = (res.data || []).find((t) => String(t._id) === String(registration.teamId));
      setSelectedTeamPreview(team || fallbackTeam);
      setShowTeamPreview(true);
    } catch (err) {
      setSelectedTeamPreview(fallbackTeam);
      setShowTeamPreview(true);
      notify('warning', 'Info parcial', 'No se pudo cargar la ficha completa del equipo.');
    }
  };

  const deleteTournament = async (torneo) => {
    const ok = window.confirm(`¿Eliminar el torneo "${torneo.title}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/tournaments/${torneo.tournamentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      closeTournamentDetails();
      setTournaments((prev) => prev.filter((t) => t.id !== torneo.id));
      notify('success', 'Torneo eliminado', 'El torneo fue eliminado correctamente.');
    } catch (err) {
      console.error('Error eliminando torneo:', err);
      notify('danger', 'Error', 'No se pudo eliminar el torneo.');
    }
  };

  const handleCreateClick = () => {
        if (loading) return; // Evita clics mientras carga el contexto

        if (!user) {
            notify('warning', 'Acceso Denegado', 'Debes iniciar sesión para crear un torneo.');
            return;
        }

        // VALIDACI“N CLAVE: Usamos el campo de tu base de datos
        if (user.isOrganizer === true) {
            navigate('/create-tournament');
        } else {
            notify('danger', 'Acceso Restringido', 'Solo los Organizadores Verificados pueden crear torneos. Solicita tu verificación.');
            
        }
    };

  const handleBecomeOrganizer = () => {
    setShowInfoModal(false);
    navigate('/organizer-application');
  };

  const isSelectedTournamentManager = canManageTournament(selectedTournament);
  const selectedTournamentStatus = getTournamentStatusKey(selectedTournament?.status);
  const isSelectedTournamentOpen = selectedTournamentStatus === 'open';
  const isSelectedTournamentOngoing = selectedTournamentStatus === 'ongoing';
  const canStartSelectedTournament = hasGeneratedBracket && isSelectedTournamentOpen;
  const canRegisterSelectedTournament = isRegistrationOpenForTournament(selectedTournament);
  const selectedRegistrationHint = isSelectedTournamentOpen
    ? 'Inscripciones cerradas'
    : `Torneo ${getTournamentStatusLabel(selectedTournament?.status).toLowerCase()}`;
  const canRenderBracketSection = hasGeneratedBracket || isSelectedTournamentManager;
  const bracketAccentColor = useMemo(() => {
    const candidate = String(GAME_CONFIG[selectedTournament?.game]?.color || '#8EDB15').trim().toLowerCase();
    if (!candidate || candidate === '#fff' || candidate === '#ffffff' || candidate === 'white') {
      return '#8EDB15';
    }
    return candidate;
  }, [selectedTournament?.game]);

  const doubleEliminationBoardStyle = useMemo(() => {
    const style = { '--bracket-accent': bracketAccentColor };
    const posterImage = selectedTournament?.bannerImage || getGameImage(selectedTournament?.game);
    if (posterImage) {
      style['--bracket-poster-image'] = `url("${posterImage}")`;
    }
    return style;
  }, [bracketAccentColor, selectedTournament?.bannerImage, selectedTournament?.game]);

  const doubleEliminationGroups = useMemo(() => {
    if (!useDoubleEliminationLayout) return { upper: [], lower: [], finals: [] };

    const classifyRound = (round = {}) => {
      const bracketType = String(round?.bracketType || '').toLowerCase();
      const name = String(round?.name || '').toLowerCase();

      if (bracketType === 'upper' || name.includes('upper')) return 'upper';
      if (bracketType === 'lower' || name.includes('lower')) return 'lower';
      if (bracketType === 'final' || name.includes('final')) return 'finals';
      return 'upper';
    };

    return (visibleBracketRounds || []).reduce((acc, round) => {
      const bucket = classifyRound(round);
      if (!acc[bucket]) acc[bucket] = [];
      acc[bucket].push(round);
      return acc;
    }, { upper: [], lower: [], finals: [] });
  }, [useDoubleEliminationLayout, visibleBracketRounds]);

  const roundRobinStandings = useMemo(() => {
    if (!useRoundRobinLayout) return [];

    const rows = new Map();
    const ensureRow = (participant = {}) => {
      const key = getBracketParticipantKey(participant);
      if (!key) return null;
      if (!rows.has(key)) {
        rows.set(key, {
          key,
          teamName: participant?.teamName || 'Equipo',
          logoUrl: participant?.logoUrl || '',
          played: 0,
          won: 0,
          draw: 0,
          lost: 0,
          gf: 0,
          gc: 0,
          points: 0
        });
      }
      const row = rows.get(key);
      if ((!row.logoUrl || row.logoUrl === '') && participant?.logoUrl) {
        row.logoUrl = participant.logoUrl;
      }
      return row;
    };

    (selectedTournament?.registrations || [])
      .filter(isApprovedRegistration)
      .forEach((registration) => {
        ensureRow({
          registrationId: registration?._id || '',
          teamId: registration?.teamId || '',
          teamName: registration?.teamName || 'Equipo',
          logoUrl: registration?.logoUrl ? toAssetUrl(registration.logoUrl) : ''
        });
      });

    (visibleBracketRounds || []).forEach((round) => {
      (round?.matches || []).forEach((match) => {
        const teamA = match?.teamA;
        const teamB = match?.teamB;
        if (!isPlayableBracketTeam(teamA) || !isPlayableBracketTeam(teamB)) return;

        const rowA = ensureRow(teamA);
        const rowB = ensureRow(teamB);
        if (!rowA || !rowB) return;

        const matchStatus = String(match?.status || '').toLowerCase();
        if (!['finished', 'walkover'].includes(matchStatus)) return;

        rowA.played += 1;
        rowB.played += 1;

        const hasNumericScore = typeof match?.scoreA === 'number' && typeof match?.scoreB === 'number';
        if (hasNumericScore) {
          rowA.gf += match.scoreA;
          rowA.gc += match.scoreB;
          rowB.gf += match.scoreB;
          rowB.gc += match.scoreA;

          if (match.scoreA > match.scoreB) {
            rowA.won += 1;
            rowA.points += 3;
            rowB.lost += 1;
            return;
          }
          if (match.scoreB > match.scoreA) {
            rowB.won += 1;
            rowB.points += 3;
            rowA.lost += 1;
            return;
          }

          rowA.draw += 1;
          rowB.draw += 1;
          rowA.points += 1;
          rowB.points += 1;
          return;
        }

        const winnerRefId = String(match?.winnerRefId || '');
        const teamARefId = String(teamA?.refId || '');
        const teamBRefId = String(teamB?.refId || '');

        if (winnerRefId && winnerRefId === teamARefId) {
          rowA.won += 1;
          rowA.points += 3;
          rowB.lost += 1;
          return;
        }
        if (winnerRefId && winnerRefId === teamBRefId) {
          rowB.won += 1;
          rowB.points += 3;
          rowA.lost += 1;
        }
      });
    });

    return Array.from(rows.values())
      .map((row) => ({ ...row, diff: row.gf - row.gc }))
      .sort((a, b) => (
        b.points - a.points
        || b.diff - a.diff
        || b.gf - a.gf
        || a.teamName.localeCompare(b.teamName)
      ))
      .map((row, index) => ({ ...row, position: index + 1 }));
  }, [useRoundRobinLayout, visibleBracketRounds, selectedTournament?.registrations]);

  const beginBracketPan = (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;

    const target = event.target;
    if (target && typeof target.closest === 'function') {
      if (target.closest('button, a, input, select, textarea, [role="button"]')) return;
    }

    const element = event.currentTarget;
    if (!element || element.scrollWidth <= element.clientWidth) return;

    bracketPanRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: element.scrollLeft,
      element
    };
    element.classList.add('is-grabbing');
    element.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const moveBracketPan = (event) => {
    const pan = bracketPanRef.current;
    if (!pan.active || pan.pointerId !== event.pointerId || !pan.element) return;

    const deltaX = event.clientX - pan.startX;
    pan.element.scrollLeft = pan.startScrollLeft - deltaX;
    event.preventDefault();
  };

  const endBracketPan = (event) => {
    const pan = bracketPanRef.current;
    if (!pan.active || pan.pointerId !== event.pointerId) return;

    pan.element?.classList.remove('is-grabbing');
    try {
      pan.element?.releasePointerCapture?.(event.pointerId);
    } catch (_) {
      // ignore
    }
    bracketPanRef.current = {
      active: false,
      pointerId: null,
      startX: 0,
      startScrollLeft: 0,
      element: null
    };
  };

  const bracketPanHandlers = {
    onPointerDown: beginBracketPan,
    onPointerMove: moveBracketPan,
    onPointerUp: endBracketPan,
    onPointerCancel: endBracketPan,
    onPointerLeave: endBracketPan
  };

  const updateBracketScale = (direction = 0) => {
    setBracketScale((prev) => {
      const next = Number((prev + (BRACKET_SCALE_STEP * direction)).toFixed(2));
      return Math.min(BRACKET_SCALE_MAX, Math.max(BRACKET_SCALE_MIN, next));
    });
  };

  const resetBracketScale = () => setBracketScale(1);

  const getClassicColumnGap = (depth) => CLASSIC_BASE_GAP * ((2 ** (Number(depth || 0) + 1)) - 1);

  const buildClassicBracketData = (rounds = []) => {
    if (!Array.isArray(rounds) || !rounds.length) return null;
    if (rounds.length === 1) {
      return {
        leftRounds: [],
        rightRounds: [],
        finalMatch: rounds[0]?.matches?.[0] || null
      };
    }

    const wingRounds = rounds.slice(0, -1);
    const leftRounds = wingRounds.map((round, depth) => {
      const matches = Array.isArray(round?.matches) ? round.matches : [];
      const splitAt = Math.ceil(matches.length / 2);
      return {
        round: round?.round || depth + 1,
        name: round?.name || `Ronda ${depth + 1}`,
        depth,
        side: 'left',
        matches: matches.slice(0, splitAt)
      };
    });

    const rightRounds = wingRounds
      .map((round, depth) => {
        const matches = Array.isArray(round?.matches) ? round.matches : [];
        const splitAt = Math.ceil(matches.length / 2);
        return {
          round: round?.round || depth + 1,
          name: round?.name || `Ronda ${depth + 1}`,
          depth,
          side: 'right',
          matches: matches.slice(splitAt)
        };
      })
      .reverse();

    return {
      leftRounds,
      rightRounds,
      finalMatch: rounds[rounds.length - 1]?.matches?.[0] || null
    };
  };

  const renderClassicBracketNode = (match, side, depth, index, columnMatchesLength) => {
    const teamAName = match?.teamA?.teamName || 'Por definir';
    const teamBName = match?.teamB?.teamName || 'Por definir';
    const winnerRefId = String(match?.winnerRefId || '');
    const teamARefId = String(match?.teamA?.refId || '');
    const teamBRefId = String(match?.teamB?.refId || '');

    const hasPair = (
      side !== 'center'
      && (
        (index % 2 === 0 && index + 1 < columnMatchesLength)
        || (index % 2 === 1 && index - 1 >= 0)
      )
    );
    const pairClass = index % 2 === 0 ? 'pair-top' : 'pair-bottom';
    const gap = getClassicColumnGap(depth);
    const connectorSize = (CLASSIC_NODE_HEIGHT + gap) / 2;

    return (
      <div
        key={`${side}-${match?.matchId || `${depth}-${index}`}`}
        className={`classic-match-node side-${side} ${pairClass} ${hasPair ? 'has-pair' : 'no-pair'}`}
        style={{
          '--classic-col-gap': `${gap}px`,
          '--classic-pair-size': `${connectorSize}px`,
          '--classic-node-height': `${CLASSIC_NODE_HEIGHT}px`
        }}
      >
        <div className={`classic-team-row ${winnerRefId && winnerRefId === teamARefId ? 'winner' : ''}`}>
          <span>{teamAName}</span>
        </div>
        <div className={`classic-team-row ${winnerRefId && winnerRefId === teamBRefId ? 'winner' : ''}`}>
          <span>{teamBName}</span>
        </div>
        <div className="classic-node-meta">
          <span>{match?.matchId || 'Match'}</span>
          <span>{getBracketStatusLabel(match?.status)}</span>
        </div>
      </div>
    );
  };

  const renderClassicBracketBoard = () => {
    const data = buildClassicBracketData(visibleBracketRounds);
    if (!data) return null;

    return (
      <div className="classic-bracket-board bracket-pan-surface" {...bracketPanHandlers}>
        <div className="classic-bracket-wing side-left">
          {data.leftRounds.map((round) => (
            <div
              key={`left-round-${round.round}`}
              className="classic-round-column side-left"
              style={{ '--classic-col-gap': `${getClassicColumnGap(round.depth)}px` }}
            >
              <div className="classic-round-title">{round.name}</div>
              <div className="classic-round-matches">
                {round.matches.map((match, index) => renderClassicBracketNode(match, 'left', round.depth, index, round.matches.length))}
              </div>
            </div>
          ))}
        </div>

        <div className="classic-bracket-center">
          {data.finalMatch
            ? renderClassicBracketNode(data.finalMatch, 'center', 0, 0, 1)
            : <div className="classic-empty-node">Final pendiente</div>}
        </div>

        <div className="classic-bracket-wing side-right">
          {data.rightRounds.map((round) => (
            <div
              key={`right-round-${round.round}`}
              className="classic-round-column side-right"
              style={{ '--classic-col-gap': `${getClassicColumnGap(round.depth)}px` }}
            >
              <div className="classic-round-title">{round.name}</div>
              <div className="classic-round-matches">
                {round.matches.map((match, index) => renderClassicBracketNode(match, 'right', round.depth, index, round.matches.length))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBracketMatchCard = (match, cardKey = '', options = {}) => {
    const { treeMode = false } = options;
    const teamAName = match?.teamA?.teamName || 'Por definir';
    const teamBName = match?.teamB?.teamName || 'Por definir';
    const winnerRefId = String(match?.winnerRefId || '');
    const teamARefId = String(match?.teamA?.refId || '');
    const teamBRefId = String(match?.teamB?.refId || '');
    const userSide = getUserSideForMatch(match, selectedTournament?.registrations || [], currentUserId);
    const isLoadingMatch = matchActionLoadingId === match?.matchId;
    const canSubmitResult = (
      selectedTournamentStatus === 'ongoing' &&
      !isMatchClosed(match) &&
      Boolean(userSide) &&
      !isLoadingMatch
    );
    const canResolveResult = (
      selectedTournamentStatus === 'ongoing' &&
      !isMatchClosed(match) &&
      isSelectedTournamentManager &&
      !isLoadingMatch
    );

    return (
      <div
        className={`bracket-match-card ${treeMode ? 'tree-mode' : ''}`}
        key={cardKey || match?.matchId || 'match-card'}
      >
        <div className={`bracket-team-row ${winnerRefId && winnerRefId === teamARefId ? 'winner' : ''}`}>
          <span>{teamAName}</span>
          {typeof match?.scoreA === 'number' && <strong>{match.scoreA}</strong>}
        </div>
        <div className={`bracket-team-row ${winnerRefId && winnerRefId === teamBRefId ? 'winner' : ''}`}>
          <span>{teamBName}</span>
          {typeof match?.scoreB === 'number' && <strong>{match.scoreB}</strong>}
        </div>
        <div className="bracket-match-footer">
          <span>{match?.matchId || 'Match'}</span>
          <span>{getBracketStatusLabel(match?.status)}</span>
        </div>
        <div className={`match-confirmation-pill ${String(match?.confirmationStatus || 'unconfirmed').toLowerCase()}`}>
          {getConfirmationStatusLabel(match?.confirmationStatus)}
        </div>

        {(canSubmitResult || canResolveResult) && (
          <div className="bracket-match-actions">
            {canSubmitResult && (
              <>
                <button
                  className="match-action-btn"
                  disabled={!teamARefId || teamARefId === teamBRefId}
                  onClick={() => submitMatchResult(selectedTournament, match, teamARefId)}
                >
                  Reportar: {teamAName}
                </button>
                <button
                  className="match-action-btn"
                  disabled={!teamBRefId || teamARefId === teamBRefId}
                  onClick={() => submitMatchResult(selectedTournament, match, teamBRefId)}
                >
                  Reportar: {teamBName}
                </button>
              </>
            )}
            {canResolveResult && (
              <>
                <button
                  className="match-action-btn resolve"
                  disabled={!teamARefId || teamARefId === teamBRefId}
                  onClick={() => resolveMatchResult(selectedTournament, match, teamARefId)}
                >
                  Resolver: {teamAName}
                </button>
                <button
                  className="match-action-btn resolve"
                  disabled={!teamBRefId || teamARefId === teamBRefId}
                  onClick={() => resolveMatchResult(selectedTournament, match, teamBRefId)}
                >
                  Resolver: {teamBName}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRoundColumnsGrid = (rounds = [], keyPrefix = 'round', options = {}) => {
    const { gridClassName = '', treeMode = false, scrollable = false } = options;
    const gridNode = (
      <div className={`bracket-rounds-grid ${gridClassName}`.trim()}>
        {rounds.map((round, roundIndex) => (
          <div className="bracket-round-column" key={`${keyPrefix}-${round?.round || roundIndex}`}>
            <div className="bracket-round-title">{round?.name || `Ronda ${round?.round || roundIndex + 1}`}</div>
            <div className="bracket-matches-list">
              {(round?.matches || []).map((match, matchIndex) => (
                renderBracketMatchCard(
                  match,
                  `${keyPrefix}-${round?.round || roundIndex}-${match?.matchId || matchIndex}`,
                  { treeMode }
                )
              ))}
            </div>
          </div>
        ))}
      </div>
    );

    if (!scrollable) return gridNode;

    return (
      <div className="bracket-pan-surface" {...bracketPanHandlers}>
        {gridNode}
      </div>
    );
  };

  const renderDoubleEliminationBoard = () => (
    <div className="double-elimination-board" style={doubleEliminationBoardStyle}>
      {doubleEliminationGroups.upper.length > 0 && (
        <div className="double-elimination-section upper-section">
          <div className="double-elimination-title">Bracket Superior</div>
          {renderRoundColumnsGrid(doubleEliminationGroups.upper, 'upper', {
            gridClassName: 'tree-bracket-grid',
            treeMode: true,
            scrollable: true
          })}
        </div>
      )}

      {doubleEliminationGroups.lower.length > 0 && (
        <div className="double-elimination-section lower-section">
          <div className="double-elimination-title">Bracket Inferior</div>
          {renderRoundColumnsGrid(doubleEliminationGroups.lower, 'lower', {
            gridClassName: 'tree-bracket-grid',
            treeMode: true,
            scrollable: true
          })}
        </div>
      )}

      {doubleEliminationGroups.finals.length > 0 && (
        <div className="double-elimination-section finals-section">
          <div className="double-elimination-title">Gran Final</div>
          {renderRoundColumnsGrid(doubleEliminationGroups.finals, 'finals', {
            gridClassName: 'tree-bracket-grid',
            treeMode: true,
            scrollable: true
          })}
        </div>
      )}
    </div>
  );

  const renderRoundRobinBoard = () => (
    <div className="round-robin-board">
      <div className="round-robin-standings">
        <div className="double-elimination-title">Tabla de posiciones</div>
        <div className="round-robin-table-wrap bracket-pan-surface" {...bracketPanHandlers}>
          <table className="round-robin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Equipo</th>
                <th>PJ</th>
                <th>G</th>
                <th>E</th>
                <th>P</th>
                <th>DG</th>
                <th>PTS</th>
              </tr>
            </thead>
            <tbody>
              {roundRobinStandings.map((row) => (
                <tr key={`rr-team-${row.key}`}>
                  <td>{row.position}</td>
                  <td>
                    <div className="round-robin-team-cell">
                      {row.logoUrl ? (
                        <img src={row.logoUrl} alt={row.teamName} />
                      ) : (
                        <span className="round-robin-team-fallback">{getInitials(row.teamName)}</span>
                      )}
                      <span>{row.teamName}</span>
                    </div>
                  </td>
                  <td>{row.played}</td>
                  <td>{row.won}</td>
                  <td>{row.draw}</td>
                  <td>{row.lost}</td>
                  <td>{row.diff}</td>
                  <td><strong>{row.points}</strong></td>
                </tr>
              ))}
              {roundRobinStandings.length === 0 && (
                <tr>
                  <td colSpan={8} className="round-robin-empty">
                    Aún no hay resultados para calcular la tabla.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="double-elimination-section">
        <div className="double-elimination-title">Jornadas</div>
        {renderRoundColumnsGrid(visibleBracketRounds, 'round-robin')}
      </div>
    </div>
  );

  return (
    <div className="tournaments-page-wrapper">
        <PageHud page="TORNEOS" />
        
        {/* ======================================================= */}
        {/* 1. MODAL DE ORGANIZADOR (CONVERTIRSE EN PRO)            */}
        {/* ======================================================= */}
        {showInfoModal && (
            <div className="modal-overlay-backdrop" onClick={() => setShowInfoModal(false)}>
                <div className="organizer-modal-card" onClick={e => e.stopPropagation()}>
                    <div className="modal-icon-glow">
                        <i className='bx bx-crown'></i>
                    </div>
                    <div className="modal-content-text">
                        <h3>Conviértete en Organizador</h3>
                        <p>
                            Lleva tu pasión al siguiente nivel. Crea tus propios torneos, 
                            gestiona equipos y ofrece premios reales a la comunidad.
                            <br/><br/>
                            <strong>¿Estás listo para liderar la arena?</strong>
                        </p>
                    </div>
                    <div className="modal-actions">
                        <button className="btn-cancel" onClick={() => setShowInfoModal(false)}>Cancelar</button>
                        <button className="btn-confirm" onClick={handleBecomeOrganizer}>
                            Ser Organizador <i className='bx bx-right-arrow-alt'></i>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ======================================================= */}
        {/* 2. MODAL DE DETALLES DEL TORNEO */}
        {/* ======================================================= */}
        {selectedTournament && (
            <div className="modal-overlay-backdrop" onClick={closeTournamentDetails} style={{zIndex: 10000}}>
                <div className="tournament-details-modal" onClick={e => e.stopPropagation()}>
                    
                    <div className="modal-header-banner" style={{backgroundImage: `url(${selectedTournament.bannerImage || getGameImage(selectedTournament.game)})`}}>
                        <div className="overlay-dark"></div>
                        <button className="close-btn-round" onClick={closeTournamentDetails}><i className='bx bx-x'></i></button>

                        <div className="banner-content">
                            <h2>{selectedTournament.title}</h2>
                            <div className="banner-meta">
                                <div className="host-info">
                                    <span>Organizado por:</span>
                                    <strong style={{color: '#fff'}}>{selectedTournament.organizer}</strong>
                                    <i className='bx bxs-badge-check' style={{color: '#00b894'}}></i>
                                </div>
                                <div className="banner-status-group">
                                    <div className="top-tags">
                                        <span className="game-badge" style={{background: GAME_CONFIG[selectedTournament.game]?.color || '#fff'}}>
                                            <i className={`bx ${GAME_CONFIG[selectedTournament.game]?.icon}`}></i> {selectedTournament.game}
                                        </span>
                                    </div>
                                    {selectedTournament.status && (
                                        <div className="tournament-status-pill">
                                            {getTournamentStatusLabel(selectedTournament.status)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="modal-content-body">
                        

                        <div className="divider"></div>

                        <div className="info-section">
                            <h4><i className='bx bx-file'></i> Descripción y Reglas</h4>
                            <p>{selectedTournament.desc}</p>
                        </div>

                        {Array.isArray(selectedTournament.registrations) && selectedTournament.registrations.length > 0 && (
                            <div className="info-section" style={{ marginTop: 18 }}>
                                <h4><i className='bx bx-group'></i> Equipos inscritos</h4>
                                <div className="tournament-registrations">
                                    {selectedTournament.registrations.map((r, idx) => (
                                        <div key={r._id || `${r.teamName}-${idx}`} className="registration-row compact">
                                            <button
                                                type="button"
                                                className="registration-team-trigger"
                                                onClick={() => openTeamPreview(r)}
                                                title={`Ver información de ${r.teamName || 'equipo'}`}
                                            >
                                                <div className="team-row">
                                                    <div className="team-logo">
                                                        {r.logoUrl
                                                            ? <img src={toAssetUrl(r.logoUrl)} alt={r.teamName || 'Equipo'} />
                                                            : <span>{getInitials(r.teamName)}</span>
                                                        }
                                                    </div>
                                                    <div className="team-text">
                                                        <strong>{r.teamName || 'Equipo'}</strong>
                                                    </div>
                                                </div>
                                                <i className='bx bx-chevron-right'></i>
                                            </button>
                                            {canManageTournament(selectedTournament) && (
                                                <div className="registration-actions compact">
                                                    <button
                                                        type="button"
                                                        className="reg-btn reject"
                                                        onClick={() => removeRegistration(selectedTournament, r._id)}
                                                    >
                                                        Quitar equipo
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {canRenderBracketSection && (
                            <div className="info-section bracket-section" style={{ marginTop: 18, '--bracket-scale': bracketScale }}>
                                <h4><i className='bx bx-git-branch'></i> Cuadro del torneo</h4>

                                {hasVisibleBracket ? (
                                    <>
                                        <button
                                            className="btn-secondary"
                                            style={{ marginBottom: 12 }}
                                            onClick={() => setShowBracketPreview((prev) => !prev)}
                                        >
                                            {showBracketPreview ? 'Ocultar vista' : 'Ver bracket'}
                                        </button>
                                        {previewRounds.length > 0 && (
                                            <p className="registration-list-hint" style={{ marginTop: -4, marginBottom: 10 }}>
                                                Vista previa sin guardar. Confirma "Generar" para publicarlo.
                                            </p>
                                        )}
                                        {showBracketPreview && (
                                            <p className="registration-list-hint bracket-pan-hint">
                                                Tip: arrastra con el mouse para desplazarte horizontalmente.
                                            </p>
                                        )}

                                        {showBracketPreview && (
                                            <div className="bracket-scale-controls">
                                                <span className="scale-label">Tamano</span>
                                                <button
                                                    type="button"
                                                    className="btn-secondary"
                                                    onClick={() => updateBracketScale(-1)}
                                                    disabled={bracketScale <= BRACKET_SCALE_MIN}
                                                >
                                                    -
                                                </button>
                                                <span className="scale-value">{Math.round(bracketScale * 100)}%</span>
                                                <button
                                                    type="button"
                                                    className="btn-secondary"
                                                    onClick={() => updateBracketScale(1)}
                                                    disabled={bracketScale >= BRACKET_SCALE_MAX}
                                                >
                                                    +
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-secondary"
                                                    onClick={resetBracketScale}
                                                    disabled={Math.abs(bracketScale - 1) < 0.01}
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        )}

                                        {showBracketPreview && (
                                            <>
                                                {useClassicBracketLayout ? (
                                                    renderClassicBracketBoard()
                                                ) : useDoubleEliminationLayout ? (
                                                    renderDoubleEliminationBoard()
                                                ) : useRoundRobinLayout ? (
                                                    renderRoundRobinBoard()
                                                ) : (
                                                    renderRoundColumnsGrid(visibleBracketRounds, 'generic')
                                                )}

                                                {useClassicBracketLayout && previewRounds.length === 0 && (selectedTournamentStatus === 'ongoing' || isSelectedTournamentManager) && (
                                                    <div className="bracket-admin-actions bracket-manage-toggle">
                                                        <button
                                                            className="btn-secondary"
                                                            onClick={() => setShowBracketManagement((prev) => !prev)}
                                                        >
                                                            {showBracketManagement ? 'Ocultar gestión de matches' : 'Gestionar matches'}
                                                        </button>
                                                    </div>
                                                )}

                                                {useClassicBracketLayout && showBracketManagement && previewRounds.length === 0 && (
                                                    <div className="bracket-management-grid">
                                                        {renderRoundColumnsGrid(visibleBracketRounds, 'manage')}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <p className="registration-list-hint">
                                        Aún no se ha generado el bracket de cruces.
                                    </p>
                                )}

                                {isSelectedTournamentManager && (
                                    <div className="bracket-admin-actions">
                                        <button
                                            className="btn-secondary"
                                            disabled={bracketLoading}
                                            onClick={() => generateBracket(selectedTournament, 'random')}
                                        >
                                            {bracketLoading ? 'Generando...' : 'Generar aleatorio'}
                                        </button>
                                        <button
                                            className="btn-secondary"
                                            disabled={bracketLoading}
                                            onClick={() => previewBracketRequest(selectedTournament, 'random')}
                                        >
                                            Vista previa
                                        </button>
                                        <button
                                            className="btn-secondary"
                                            disabled={bracketLoading}
                                            onClick={toggleCustomSeeding}
                                        >
                                            {customSeedingOpen ? 'Ocultar personalizado' : 'Personalizado'}
                                        </button>
                                    </div>
                                )}

                                {isSelectedTournamentManager && customSeedingOpen && (
                                    <div className="custom-seeding-editor">
                                        <h5>Orden personalizado</h5>
                                        <p>Arrastra equipos a cualquier casilla (incluso vacía). Puedes previsualizar antes de guardar.</p>
                                        <div className="custom-seeding-list">
                                            {customSeedSlots.map((slot, index) => (
                                                <div
                                                    key={`seed-slot-${index + 1}`}
                                                    className={`custom-seeding-item ${dragSeedRefId === slot.refId ? 'is-dragging' : ''} ${dragOverSeedRefId === slot.refId ? 'is-drop-target' : ''} ${slot.isEmpty ? 'is-empty' : ''}`}
                                                    draggable={!bracketLoading}
                                                    onDragStart={() => handleSeedDragStart(slot.refId)}
                                                    onDragOver={(event) => {
                                                        event.preventDefault();
                                                        if (!bracketLoading) setDragOverSeedRefId(slot.refId);
                                                    }}
                                                    onDrop={(event) => {
                                                        event.preventDefault();
                                                        if (!bracketLoading) handleSeedDrop(slot.refId);
                                                    }}
                                                    onDragEnd={() => {
                                                        setDragSeedRefId('');
                                                        setDragOverSeedRefId('');
                                                    }}
                                                >
                                                    <div className="seed-main">
                                                        <span className="seed-position">#{slot.slot}</span>
                                                        {slot.entry?.logoUrl ? (
                                                          <img className="seed-logo" src={slot.entry.logoUrl} alt={slot.entry.teamName || 'Equipo'} />
                                                        ) : (
                                                          <span className="seed-empty-dot"><i className='bx bx-plus'></i></span>
                                                        )}
                                                        <span className={`seed-name ${slot.isEmpty ? 'is-empty' : ''}`}>
                                                          {slot.entry?.teamName || 'Casilla vacía'}
                                                        </span>
                                                    </div>
                                                    <div className="seed-actions-inline">
                                                        <button
                                                            type="button"
                                                            className="mini-btn"
                                                            disabled={index === 0 || bracketLoading}
                                                            onClick={() => moveSeedItem(index, index - 1)}
                                                        >
                                                            <i className='bx bx-up-arrow-alt'></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="mini-btn"
                                                            disabled={index === customSeedSlots.length - 1 || bracketLoading}
                                                            onClick={() => moveSeedItem(index, index + 1)}
                                                        >
                                                            <i className='bx bx-down-arrow-alt'></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bracket-admin-actions">
                                            <button
                                                className="btn-secondary"
                                                disabled={bracketLoading}
                                                onClick={() => previewBracketRequest(selectedTournament, 'custom')}
                                            >
                                                Vista previa personalizada
                                            </button>
                                            <button
                                                className="btn-secondary"
                                                disabled={bracketLoading}
                                                onClick={() => generateBracket(selectedTournament, 'custom')}
                                            >
                                                Confirmar personalizado
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {(selectedTournament.platform || selectedTournament.server || selectedTournament.gender) && (
                            <div className="stats-grid" style={{ marginTop: 14 }}>
                                {selectedTournament.platform && (
                                    <div className="stat-box">
                                        <span className="label">Plataforma</span>
                                        <span className="value">{selectedTournament.platform}</span>
                                    </div>
                                )}
                                {selectedTournament.server && (
                                    <div className="stat-box">
                                        <span className="label">Servidor</span>
                                        <span className="value">{selectedTournament.server}</span>
                                    </div>
                                )}
                                {selectedTournament.gender && (
                                    <div className="stat-box">
                                        <span className="label">Género</span>
                                        <span className="value">{selectedTournament.gender}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="stats-grid">
                            <div className="stat-box">
                                <span className="label">Fecha</span>
                                <span className="value">{selectedTournament.date}</span>
                            </div>
                            <div className="stat-box">
                                <span className="label">Hora</span>
                                <span className="value">{selectedTournament.time}</span>
                            </div>
                            <div className="stat-box prize">
                                <span className="label">Premio</span>
                                <span className="value highlight">{selectedTournament.prize}</span>
                            </div>
                            <div className="stat-box">
                                <span className="label">Formato</span>
                                <span className="value">{selectedTournament.format}</span>
                            </div>
                            <div className="stat-box">
                                <span className="label">Cupos</span>
                                <span className="value">{selectedTournament.slots}</span>
                            </div>
                            <div className="stat-box">
                                <span className="label">Entrada</span>
                                <span className="value">{selectedTournament.entry}</span>
                            </div>
                        </div>

                        {isRiotGame(selectedTournament.game) && selectedTournament.riotRequirements?.required && (
                            <div className="info-section" style={{ marginTop: 18 }}>
                                <h4><i className='bx bx-shield-quarter'></i> Requisitos Riot</h4>
                                <div className="riot-requirements">
                                    <div><strong>Cuenta Riot vinculada:</strong> requerida</div>
                                    {selectedTournament.riotRequirements?.minTier && (
                                        <div><strong>Rango mínimo:</strong> {selectedTournament.riotRequirements.minTier}</div>
                                    )}
                                    {selectedTournament.riotRequirements?.maxTier && (
                                        <div><strong>Rango máximo:</strong> {selectedTournament.riotRequirements.maxTier}</div>
                                    )}
                                    {typeof selectedTournament.riotRequirements?.soloQueueOnly === 'boolean' && (
                                        <div><strong>Solo Queue:</strong> {selectedTournament.riotRequirements.soloQueueOnly ? 'Sí' : 'No'}</div>
                                    )}
                                    <div className="riot-note">Se verifica tu perfil Riot para evitar trampas.</div>
                                </div>
                            </div>
                        )}

                        {selectedTournament.rulesPdf && (
                            <a
                                className="btn-secondary"
                                href={selectedTournament.rulesPdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                            >
                                Ver reglas (PDF)
                            </a>
                        )}

                        <div className="modal-actions-footer modal-actions-footer--admin">
                            <div className="modal-actions-main">
                                <button className="btn-secondary" onClick={closeTournamentDetails}>Cerrar</button>
                                {canManageTournament(selectedTournament) && (
                                    <button className="btn-secondary" onClick={() => goToEditTournament(selectedTournament)}>
                                        Editar
                                    </button>
                                )}
                            </div>
                            {canManageTournament(selectedTournament) && (
                                <div className="tournament-admin-actions">
                                    {isSelectedTournamentOpen && (
                                        <>
                                            <button
                                                className="btn-secondary"
                                                onClick={() => updateTournamentStatus(selectedTournament, 'open')}
                                                disabled={statusActionLoading === 'open' || !selectedTournament.registrationClosed}
                                                title={!selectedTournament.registrationClosed ? 'Las inscripciones ya están abiertas' : ''}
                                            >
                                                {statusActionLoading === 'open' ? 'Abriendo...' : 'Abrir inscripciones'}
                                            </button>
                                            <button
                                                className="btn-secondary"
                                                onClick={() => updateTournamentStatus(selectedTournament, 'close')}
                                                disabled={statusActionLoading === 'close' || selectedTournament.registrationClosed}
                                                title={selectedTournament.registrationClosed ? 'Las inscripciones ya están cerradas' : ''}
                                            >
                                                {statusActionLoading === 'close' ? 'Cerrando...' : 'Cerrar inscripciones'}
                                            </button>
                                            <button
                                                className="btn-secondary"
                                                onClick={() => updateTournamentStatus(selectedTournament, 'start')}
                                                disabled={statusActionLoading === 'start' || !canStartSelectedTournament}
                                                title={!canStartSelectedTournament ? 'Primero genera el bracket del torneo' : ''}
                                            >
                                                {statusActionLoading === 'start' ? 'Iniciando...' : 'Iniciar torneo'}
                                            </button>
                                        </>
                                    )}

                                    {isSelectedTournamentOngoing && (
                                        <button
                                            className="btn-secondary"
                                            onClick={() => updateTournamentStatus(selectedTournament, 'finish')}
                                            disabled={statusActionLoading === 'finish'}
                                        >
                                            {statusActionLoading === 'finish' ? 'Finalizando...' : 'Finalizar torneo'}
                                        </button>
                                    )}

                                    {(isSelectedTournamentOpen || isSelectedTournamentOngoing) && (
                                        <button
                                            className="btn-secondary"
                                            onClick={() => updateTournamentStatus(selectedTournament, 'cancel')}
                                            disabled={statusActionLoading === 'cancel'}
                                        >
                                            {statusActionLoading === 'cancel' ? 'Cancelando...' : 'Cancelar torneo'}
                                        </button>
                                    )}

                                    {isSelectedTournamentOpen && !canStartSelectedTournament && (
                                        <span className="join-hint admin-hint">Genera el bracket antes de iniciar</span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="modal-actions-footer">
                            {!hasRegisteredTeam(selectedTournament) && canRegisterSelectedTournament && (
                                <button 
                                    className="btn-primary-action" 
                                    onClick={() => {
                                        if (needsRiot(selectedTournament) && !hasRiotLinked) {
                                            notify('danger', 'Riot requerido', 'Debes vincular tu cuenta Riot en Settings para inscribirte.');
                                            navigate('/settings');
                                            return;
                                        }
                                        closeTournamentDetails();
                                        goToRegistration(selectedTournament);
                                    }}
                                    style={{
                                        background: GAME_CONFIG[selectedTournament.game]?.color || '#8EDB15',
                                        boxShadow: `0 0 15px ${GAME_CONFIG[selectedTournament.game]?.color}40`
                                    }}
                                    disabled={needsRiot(selectedTournament) && !hasRiotLinked}
                                >
                                    {detailLoading ? 'Cargando...' : 'Inscribirse Ahora'} <i className='bx bx-right-arrow-alt'></i>
                                </button>
                            )}
                            {!hasRegisteredTeam(selectedTournament) && !canRegisterSelectedTournament && (
                                <span className="join-hint">{selectedRegistrationHint}</span>
                            )}
                            {canManageTournament(selectedTournament) && (
                                <button className="btn-danger-action" onClick={() => deleteTournament(selectedTournament)}>
                                    Eliminar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {showTeamPreview && (
            <div className="modal-overlay-backdrop" onClick={() => setShowTeamPreview(false)} style={{zIndex: 10001}}>
                <div className="tournament-details-modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header-banner" style={{backgroundImage: `url(${selectedTeamPreview?.bannerImage || getGameImage(selectedTeamPreview?.game || '')})`}}>
                        <div className="overlay-dark"></div>
                        <button className="close-btn-round" onClick={() => setShowTeamPreview(false)}><i className='bx bx-x'></i></button>
                        <div className="banner-content">
                            <div className="team-brand">
                                <div className="team-logo large">
                                    {selectedTeamPreview?.logo
                                        ? <img src={toAssetUrl(selectedTeamPreview.logo)} alt={selectedTeamPreview?.name || 'Equipo'} />
                                        : <span>{getInitials(selectedTeamPreview?.name)}</span>
                                    }
                                </div>
                                <div>
                                    <h2>{selectedTeamPreview?.name || 'Equipo'}</h2>
                                    <div className="host-info">
                                        <span>Juego:</span>
                                        <strong style={{color: '#fff'}}>{selectedTeamPreview?.game || 'N/A'}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-content-body">
                        <div className="info-section">
                            <h4><i className='bx bx-info-circle'></i> Datos del equipo</h4>
                            <p>Categoría: {selectedTeamPreview?.category || 'N/A'}</p>
                            <p>País: {selectedTeamPreview?.teamCountry || 'N/A'}</p>
                            <p>Nivel: {selectedTeamPreview?.teamLevel || 'N/A'}</p>
                            <p>Coach: {selectedTeamPreview?.roster?.coach?.nickname || 'N/A'}</p>
                        </div>
                        <div className="info-section">
                            <h4><i className='bx bx-group'></i> Roster</h4>
                            <div className="tournament-registrations">
                                {(selectedTeamPreview?.roster?.starters || []).map((p, i) => (
                                    <div key={`team-prev-${i}`} className="registration-row">
                                        <div className="registration-main">
                                            <strong>{p?.nickname || 'Vacante'}</strong>
                                            {p?.role && <span className="reg-status approved">{p.role}</span>}
                                        </div>
                                        <div className="registration-roster">
                                            {[p?.region ? `Región: ${p.region}` : 'Región: N/A', p?.role ? `Rol: ${p.role}` : null]
                                                .filter(Boolean)
                                                .join(' | ')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-actions-footer">
                            <button className="btn-secondary" onClick={() => setShowTeamPreview(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- MAIN LAYOUT GRID --- */}
        <div className="main-layout-container">
            
            {/* LEFT COLUMN */}
            <div className="content-area">
                <div className="tournaments-page">
                    
                    {/* ═══ HERO / PROMO CAROUSEL ═══ */}
                    <div className="tn__hero" style={{ background: activeSlide.gradient }}>
                        {/* Animated particles */}
                        <div className="tn__hero-particles">
                            {activeSlide.particles.map((p, i) => (
                                <i key={`${current}-${i}`} className={`bx ${p} tn__particle`} style={{ '--delay': `${i * 0.4}s`, '--x': `${20 + i * 22}%`, color: activeSlide.accent }} />
                            ))}
                        </div>
                        <div className="tn__hero-glow" style={{ background: `radial-gradient(ellipse at 30% 80%, ${activeSlide.accent}15 0%, transparent 60%)` }} />
                        
                        <div className="tn__hero-content">
                            <span className="tn__hero-badge" style={{ background: `${activeSlide.accent}20`, color: activeSlide.accent, borderColor: `${activeSlide.accent}40` }}>
                                <i className={`bx ${activeSlide.icon}`}></i> {activeSlide.badge}
                            </span>
                            <h1 className="tn__hero-title">{activeSlide.title}</h1>
                            <p className="tn__hero-subtitle">{activeSlide.subtitle}</p>
                            <div className="tn__hero-actions">
                                <button 
                                    className="tn__hero-btn tn__hero-btn--primary" 
                                    style={{ background: activeSlide.accent, boxShadow: `0 8px 25px ${activeSlide.accent}40` }}
                                    onClick={() => {
                                        if (activeSlide.ctaAction === 'create') handleCreateClick();
                                        else if (activeSlide.ctaAction === 'team') navigate('/create-team');
                                    }}
                                >
                                    {activeSlide.cta} <i className={`bx ${activeSlide.ctaIcon}`}></i>
                                </button>
                                <button className="tn__hero-btn tn__hero-btn--ghost" onClick={() => setShowInfoModal(true)}>
                                    Más Info <i className='bx bx-info-circle'></i>
                                </button>
                            </div>
                        </div>

                        {/* Indicator dots */}
                        <div className="tn__hero-dots">
                            {PROMO_SLIDES.map((_, index) => (
                                <button key={index} className={`tn__hero-dot ${index === current ? 'active' : ''}`} onClick={() => handleDotClick(index)} style={index === current ? { background: activeSlide.accent, boxShadow: `0 0 8px ${activeSlide.accent}` } : {}} />
                            ))}
                        </div>
                        
                        {/* Slide counter */}
                        <div className="tn__hero-counter">
                            <span style={{ color: activeSlide.accent }}>{String(current + 1).padStart(2, '0')}</span>
                            <span className="tn__hero-counter-sep">/</span>
                            <span>{String(PROMO_SLIDES.length).padStart(2, '0')}</span>
                        </div>
                    </div>

                    {/* ═══ STATS BAR ═══ */}
                    <div className="tn__stats-bar">
                        <div className="tn__stat">
                            <i className='bx bx-trophy' style={{ color: '#ffd700' }}></i>
                            <div className="tn__stat-info">
                                <span className="tn__stat-value">{stats.total}</span>
                                <span className="tn__stat-label">Torneos</span>
                            </div>
                        </div>
                        <div className="tn__stat-divider" />
                        <div className="tn__stat">
                            <i className='bx bx-check-circle' style={{ color: '#00ff88' }}></i>
                            <div className="tn__stat-info">
                                <span className="tn__stat-value">{stats.active}</span>
                                <span className="tn__stat-label">Activos</span>
                            </div>
                        </div>
                        <div className="tn__stat-divider" />
                        <div className="tn__stat">
                            <i className='bx bx-dollar-circle' style={{ color: '#4facfe' }}></i>
                            <div className="tn__stat-info">
                                <span className="tn__stat-value">${stats.totalPrize.toLocaleString()}</span>
                                <span className="tn__stat-label">En premios</span>
                            </div>
                        </div>
                        <div className="tn__stat-divider" />
                        <div className="tn__stat">
                            <i className='bx bx-game' style={{ color: '#f093fb' }}></i>
                            <div className="tn__stat-info">
                                <span className="tn__stat-value">{stats.uniqueGames}</span>
                                <span className="tn__stat-label">Juegos</span>
                            </div>
                        </div>
                    </div>

                                        {/* ═══ HEADER + ACTIONS + SEARCH ═══ */}
                    <div className="header-actions">
                        <div className="tn__header-left">
                            <h1><i className='bx bx-trophy'></i> Torneos</h1>
                            <p>Explora, compite y gana premios.</p>
                        </div>
                        <div className="tn__header-right">
                            <div className="tn__search-box">
                                <i className='bx bx-search'></i>
                                <input 
                                    type="text" 
                                    placeholder="Buscar torneo, juego, organizador..." 
                                    value={search} 
                                    onChange={(e) => setSearch(e.target.value)} 
                                />
                                {search && (
                                    <button className="tn__search-clear" onClick={() => setSearch('')}>
                                        <i className='bx bx-x'></i>
                                    </button>
                                )}
                            </div>
                            <div className="action-group">
                                <button className="create-btn toggle-right-sidebar-btn mobile-only" onClick={(e) => { e.stopPropagation(); setIsRightPanelOpen(!isRightPanelOpen); }}><i className='bx bx-layout'></i> Info</button>
                                <button className="info-btn" onClick={() => setShowInfoModal(true)} title="¿Cómo ser organizador?"><i className='bx bx-question-mark'></i></button>
                                <button className="create-btn" onClick={handleCreateClick}><i className='bx bx-plus'></i> Crear Torneo</button>
                            </div>
                        </div>
                    </div>

                    {/* ═══ STATUS FILTERS ═══ */}
                    <div className="tn__status-filters">
                        {[
                            { key: 'all', label: 'Todos', icon: 'bx-grid-alt' },
                            { key: 'open', label: 'Abiertos', icon: 'bx-check-circle', dot: '#00ff88' },
                            { key: 'ongoing', label: 'En Curso', icon: 'bx-loader-circle', dot: '#4facfe' },
                            { key: 'finished', label: 'Finalizados', icon: 'bx-flag', dot: '#888' },
                        ].map(s => (
                            <button 
                                key={s.key} 
                                className={`tn__status-btn ${activeStatus === s.key ? 'active' : ''}`} 
                                onClick={() => setActiveStatus(s.key)}
                            >
                                {s.dot && <span className="tn__status-dot" style={{ background: s.dot }} />}
                                <i className={`bx ${s.icon}`}></i> {s.label}
                            </button>
                        ))}
                    </div>

                    <div className="filters-bar">
                        <div className="chips-wrapper">
                            {(showAllFilters ? Object.keys(GAME_CONFIG) : Object.keys(GAME_CONFIG).slice(0, 10)).map(cat => {
                                const style = GAME_CONFIG[cat] || { color: '#fff' };
                                return (
                                    <button key={cat} className={`game-chip ${activeFilter === cat ? 'active' : ''}`} onClick={() => setActiveFilter(cat)} style={{ '--chip-color': style.color }}>
                                        <i className={`bx ${style.icon || 'bx-game'}`}></i><span>{cat}</span>
                                    </button>
                                )
                            })}
                        </div>
                        <button className="toggle-filters-btn" onClick={() => setShowAllFilters(!showAllFilters)}>
                            {showAllFilters ? <span><i className='bx bx-chevron-up'></i> Menos</span> : <span><i className='bx bx-chevron-down'></i> Ver más</span>}
                        </button>
                    </div>

                    {/* ═══ RESULTS COUNT ═══ */}
                    {(search || activeStatus !== 'all' || activeFilter !== 'All') && (
                        <div className="tn__results-count">
                            <span>{displayTournaments.length} torneo{displayTournaments.length !== 1 ? 's' : ''} encontrado{displayTournaments.length !== 1 ? 's' : ''}</span>
                            {(search || activeStatus !== 'all') && (
                                <button className="tn__clear-filters" onClick={() => { setSearch(''); setActiveStatus('all'); setActiveFilter('All'); }}>
                                    <i className='bx bx-x'></i> Limpiar filtros
                                </button>
                            )}
                        </div>
                    )}

                    {/* ═══ TOURNAMENTS GRID ═══ */}
                    <div className="tournaments-grid">
                        {loadingTournaments ? (
                            <div className="tn__loading">
                                <div className="tn__spinner" />
                                <p>Cargando torneos...</p>
                            </div>
                        ) : displayTournaments.length > 0 ? (
                            displayTournaments.map((torneo) => {
                                const [ocupados, totales] = torneo.slots.split('/').map(Number);
                                const pct = totales > 0 ? (ocupados / totales) * 100 : 0;
                                const estaLleno = ocupados >= totales;
                                const hasTeam = userTeamIds.length > 0;
                                const alreadyIn = hasRegisteredTeam(torneo);
                                const canRegisterOnCard = isRegistrationOpenForTournament(torneo);
                                const canJoin = canRegisterOnCard && !estaLleno && hasTeam && !alreadyIn;
                                const canCreateTeamShortcut = canRegisterOnCard && !hasTeam && !alreadyIn && !estaLleno;
                                const gameColor = GAME_CONFIG[torneo.game]?.color || '#8EDB15';
                                const statusKey = getTournamentStatusKey(torneo.status);
                                const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.open;
                                const unavailableLabel = !canRegisterOnCard
                                  ? (statusKey === 'open' ? 'Inscripciones cerradas' : statusCfg.label)
                                  : estaLleno
                                    ? 'Cerrado'
                                    : alreadyIn
                                      ? 'Ya inscrito'
                                      : !hasTeam
                                        ? 'Crear equipo'
                                        : 'No disponible';

                                return (
                                    <div key={torneo.id} className="tournament-card-pro" style={{ '--card-game': gameColor }}>
                                        <div className="tn__card-glow" />
                                        <div className="tn__card-accent" />
                                        <div className="card-image-container">
                                            <img src={getGameImage(torneo.game)} alt={torneo.game} loading="lazy" />
                                            <div className="overlay-gradient"></div>
                                            <div className="top-badges">
                                                <span className="game-pill" style={{ borderColor: gameColor, color: '#fff' }}>
                                                    <i className={`bx ${GAME_CONFIG[torneo.game]?.icon || 'bx-joystick'}`}></i> {torneo.game}
                                                </span>
                                                <span className="tn__card-status" style={{ background: `${statusCfg.color}18`, color: statusCfg.color, border: `1px solid ${statusCfg.color}30` }}>
                                                    <i className={`bx ${statusCfg.icon}`}></i> {statusCfg.label}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="card-content">
                                            <div className="tn__card-header">
                                                <span className="tournament-id-tag">#{torneo.tournamentId}</span>
                                                {torneo.entryFee && torneo.entryFee !== 'Gratis' && (
                                                    <span className="tn__entry-badge"><i className='bx bx-dollar'></i> {torneo.entryFee}</span>
                                                )}
                                                {torneo.entryFee === 'Gratis' && (
                                                    <span className="tn__free-badge"><i className='bx bx-gift'></i> Gratis</span>
                                                )}
                                            </div>
                                            <h3 title={torneo.title}>{torneo.title}</h3>
                                            
                                            <div className="tn__card-meta">
                                                <div className="tn__meta-item"><i className='bx bx-calendar'></i> {torneo.date}</div>
                                                <div className="tn__meta-item"><i className='bx bx-time'></i> {torneo.time}</div>
                                                {torneo.format && <div className="tn__meta-item"><i className='bx bx-shield'></i> {torneo.format}</div>}
                                                {torneo.platform && <div className="tn__meta-item"><i className='bx bx-desktop'></i> {torneo.platform}</div>}
                                            </div>

                                            <div className="tn__card-prize-row">
                                                <div className="tn__prize-box" style={{ borderColor: `${gameColor}30` }}>
                                                    <i className='bx bx-trophy' style={{ color: '#ffd700' }}></i>
                                                    <span>{torneo.prize || 'Sin premio'}</span>
                                                </div>
                                                {torneo.gender && (
                                                    <span className="tn__gender-tag">
                                                        <i className='bx bx-user'></i> {torneo.gender}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Progress bar */}
                                            <div className="tn__slots-section">
                                                <div className="tn__slots-info">
                                                    <span><i className='bx bx-group'></i> {torneo.slots} Equipos</span>
                                                    <span className="tn__slots-pct">{Math.round(pct)}%</span>
                                                </div>
                                                <div className="tn__slots-bar">
                                                    <div className="tn__slots-fill" style={{ width: `${pct}%`, background: estaLleno ? '#ef4444' : gameColor }} />
                                                </div>
                                            </div>

                                            <div className="tn__card-organizer">
                                                <i className='bx bxs-badge-check' style={{ color: '#00b894' }}></i>
                                                <span>{torneo.organizer}</span>
                                            </div>

                                            <div className="card-actions">
                                                <button className="btn-details" onClick={() => openTournamentDetails(torneo)}>
                                                    <i className='bx bx-info-circle'></i> Detalles
                                                </button>
                                                {canJoin ? (
                                                    <button 
                                                        className="btn-join"
                                                        onClick={() => {
                                                            if (needsRiot(torneo) && !hasRiotLinked) {
                                                                notify('danger', 'Riot requerido', 'Debes vincular tu cuenta Riot en Settings para inscribirte.');
                                                                navigate('/settings');
                                                                return;
                                                            }
                                                            goToRegistration(torneo);
                                                        }}
                                                        style={{ background: gameColor, color: '#000' }}
                                                    >
                                                        <i className='bx bx-log-in-circle'></i> Inscribirse
                                                    </button>
                                                ) : (
                                                    <button 
                                                        className={`btn-join ${!hasTeam ? '' : 'disabled'}`}
                                                        onClick={() => { if (canCreateTeamShortcut) navigate('/create-team'); }}
                                                        style={{
                                                            background: canCreateTeamShortcut ? '#8EDB15' : '#333',
                                                            cursor: canCreateTeamShortcut ? 'pointer' : 'not-allowed',
                                                            color: canCreateTeamShortcut ? '#0b0f0c' : '#666'
                                                        }}
                                                        disabled={!canCreateTeamShortcut}
                                                    >
                                                        {unavailableLabel}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="tn__empty-state">
                                <div className="tn__empty-icon"><i className='bx bx-ghost'></i></div>
                                <h3>No se encontraron torneos</h3>
                                <p>{search ? `Sin resultados para "${search}"` : 'No hay torneos disponibles en esta categoría.'}</p>
                                {search && (
                                    <button className="tn__empty-btn" onClick={() => { setSearch(''); setActiveFilter('All'); setActiveStatus('all'); }}>
                                        <i className='bx bx-refresh'></i> Ver todos
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className={`sidebar-area right-sidebar ${isRightPanelOpen ? 'open' : ''}`} ref={rightPanelRef}>
                <aside className="right-info-sidebar">
                    
                    {/* Botón cerrar para móvil */}
                    <button className="close-right-sidebar mobile-only" onClick={() => setIsRightPanelOpen(false)}>
                        <i className='bx bx-x'></i>
                    </button>
                    
                    {/* WIDGET 1: ACCIONES RÁPIDAS (Lo mantenemos) */}
                    <div className="sidebar-widget">
                        <h3><i className='bx bx-bolt-circle'></i> Acciones Rápidas</h3>
                        <div className="quick-actions-grid">
                            <button className="qa-btn" onClick={() => navigate('/create-team')}>
                                <i className='bx bx-group'></i> Crear Equipo
                            </button>
                            <button className="qa-btn" onClick={() => navigate('/premium')}>
                                <i className='bx bx-star'></i> Premium
                            </button>
                        </div>
                    </div>

                    {/* WIDGET 2: CALENDARIO */}
                    <div className="sidebar-widget">
                        {/* Puedes pasarle datos reales en el futuro con: <MatchCalendar matches={misDatos} /> */}
                        <MatchCalendar />
                    </div>

                    {/* WIDGET 3: (Opcional) BANNER PUBLICIDAD O INFO EXTRA */}
                    <div className="sidebar-widget tn__promo-widget">
                        <div className="tn__promo-icon"><i className='bx bx-search-alt-2'></i></div>
                        <h4>¿Buscas Scrims?</h4>
                        <p>Encuentra rivales de tu nivel ahora mismo.</p>
                        <button className="tn__promo-btn" onClick={() => navigate('/teams')}>
                            <i className='bx bx-target-lock'></i> Buscar Scrim
                        </button>
                    </div>

                </aside>
            </div>
            </div>
            
            {isRightPanelOpen && <div className="sidebar-overlay-mobile"></div>}

        </div>
  );
};

export default Tournaments;
