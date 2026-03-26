import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import { getAuthToken } from '../../../../utils/authSession';
import { saveStoredLocalTournaments, getStoredLocalTournaments } from '../../../../utils/tournamentCalendar';
import {
  getTournamentServerOptions,
  isValidTournamentServer,
  normalizeTournamentServer
} from '../../../../../../shared/tournamentServerOptions.js';
import {
  getTournamentMapOptions,
  normalizeTournamentMapPool
} from '../../../../../../shared/tournamentMapOptions.js';
import {
  normalizeTournamentFormat,
  normalizeTournamentPlatform,
  TOURNAMENT_CREATOR_STAFF_ROLE_OPTIONS,
  TOURNAMENT_FORMAT_OPTIONS,
  TOURNAMENT_PLATFORM_OPTIONS
} from '../../../../../../shared/tournamentCatalog.js';
import {
  SUPPORTED_GAME_NAMES,
  SUPPORTED_MLBB_GAME_NAMES,
  SUPPORTED_RIOT_GAME_NAMES,
} from '../../../../../../shared/supportedGames.js';
import { TEAM_GENDER_OPTIONS } from '../../../../../../shared/teamCatalog.js';
import {
  FaBullhorn,
  FaCheckCircle,
  FaDiscord,
  FaFilePdf,
  FaFileUpload,
  FaGamepad,
  FaGlobeAmericas,
  FaHandshake,
  FaMoneyBillWave,
  FaPlus,
  FaShieldAlt,
  FaSitemap,
  FaTrash,
  FaUserShield,
  FaUsers
} from 'react-icons/fa';
import './CreateTournament.css';

const GAMES = [...SUPPORTED_GAME_NAMES];

const baseState = (name) => ({
  title: '',
  description: '',
  game: '',
  gender: 'Mixto',
  modality: '',
  date: '',
  time: '',
  timezone: 'UTC',
  prizePool: '',
  currency: 'DOP',
  prizeMode: 'none',
  prizeDetails: '',
  prizesByRank: { first: '', second: '', third: '' },
  entryFee: 'Gratis',
  entryFeeAmount: '',
  maxSlots: '',
  format: 'single_elimination',
  server: '',
  platform: 'PC',
  bannerFile: null,
  rulesPdf: null,
  organizerName: name,
  registrationWindow: { start: '', end: '' },
  checkInWindow: { start: '', end: '' },
  eligibility: { minAge: 13, allowedCountries: 'Global', notes: '', universityOnly: false },
  contact: { email: '', phone: '', discordInvite: '' },
  broadcast: { streamUrl: '', streamLanguage: 'es' },
  matchConfig: { seriesType: 'BO3', mapPool: [], patchVersion: '' },
  legalCompliance: {
    jurisdiction: '',
    governingLaw: '',
    claimsContact: '',
    rulesAccepted: false,
    privacyAccepted: false,
    organizerDeclaration: false
  },
  sponsors: [{ name: '', link: '', tier: 'Partner', logoFile: null }],
  staffMembers: []
});

const BRACKET_SLOT_PRESETS = ['4', '8', '16', '32', '64', '128', '256'];
const INTEGER_INPUT_REGEX = /^\d*$/;
const MONEY_INPUT_REGEX = /^\d*(?:[.,]\d{0,2})?$/;

const RIOT_TITLES = new Set(SUPPORTED_RIOT_GAME_NAMES);
const MLBB_TITLES = new Set(SUPPORTED_MLBB_GAME_NAMES);

const MLBB_BETA_MODE = String(import.meta.env.VITE_MLBB_BETA_MODE ?? 'true').trim().toLowerCase() !== 'false';
const RIOT_REVIEW_MODE = String(import.meta.env.VITE_RIOT_REVIEW_MODE ?? 'false').trim().toLowerCase() === 'true';
const RIOT_MIN_ACTIVE_PARTICIPANTS = (() => {
  const parsed = Number.parseInt(String(import.meta.env.VITE_RIOT_MIN_ACTIVE_PARTICIPANTS ?? '20'), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
})();
const MLBB_BANNED_TERMS = ['apuesta', 'apuestas', 'bet', 'bets', 'betting', 'wager', 'wagering', 'gambling', 'casino', 'odds', 'parlay', 'cuota', 'cuotas'];
const RIOT_BANNED_TERMS = [...MLBB_BANNED_TERMS];

const normalizeText = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const findMlbbBannedTerm = (text = '') => {
  const normalized = normalizeText(text);
  return MLBB_BANNED_TERMS.find((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(normalized);
  }) || '';
};

const findRiotBannedTerm = (text = '') => {
  const normalized = normalizeText(text);
  return RIOT_BANNED_TERMS.find((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(normalized);
  }) || '';
};

const parseTeamSizeFromModality = (modality = '') => {
  const raw = String(modality || '').trim().toLowerCase();
  const match = raw.match(/^(\d+)\s*v\s*(\d+)$/i);
  if (!match) return 1;
  const left = Number.parseInt(match[1], 10);
  const right = Number.parseInt(match[2], 10);
  if (!Number.isFinite(left) || left <= 0) return 1;
  if (!Number.isFinite(right) || right <= 0) return left;
  return Math.max(left, right);
};

const parsePositiveInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const normalizeMoneyValue = (value) => {
  const raw = String(value ?? '').trim().replace(',', '.');
  if (!raw) return '';
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return '';
  return parsed.toString();
};

const parseMoneyAmount = (value) => {
  const normalized = normalizeMoneyValue(value);
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
const formatMoneyAmount = (value) => {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return '0';
  return parsed.toLocaleString('en-US', {
    minimumFractionDigits: parsed % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
};

const resolveMaxSlotsSelection = (value = '') => {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  if (BRACKET_SLOT_PRESETS.includes(normalized)) return normalized;
  return 'custom';
};
const isFreeEntryFee = (value = '') => String(value || '').trim().toLowerCase() === 'gratis';

const CreateTournament = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const token = getAuthToken();
  const [isPublished, setIsPublished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [tournament, setTournament] = useState(baseState(user?.username || 'Organizador Oficial'));
  const [slotInputMode, setSlotInputMode] = useState('preset');
  const [pendingMap, setPendingMap] = useState('');
  const editTournament = location.state?.editTournament;
  const isEditMode = Boolean(editTournament?.tournamentId);
  const formatInputDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const todayInput = formatInputDate(new Date());
  const datePlus = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return formatInputDate(d);
  };

  useEffect(() => {
    if (!isEditMode) return;
    const toDate = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');
    const editMaxSlots = String(editTournament.maxSlots ?? editTournament.slots ?? '').trim();
    setSlotInputMode(resolveMaxSlotsSelection(editMaxSlots) === 'custom' ? 'custom' : 'preset');
    setTournament((prev) => ({
      ...prev,
      title: editTournament.title || '',
      description: editTournament.desc || editTournament.description || '',
      game: editTournament.game || '',
      gender: editTournament.gender || 'Mixto',
      modality: editTournament.modality || '',
      date: toDate(editTournament.dateRaw || editTournament.date),
      time: editTournament.time || '',
      timezone: editTournament.timezone || prev.timezone,
      prizePool: editTournament.prize || editTournament.prizePool || '',
      currency: editTournament.currency || prev.currency,
      prizeMode: editTournament.prizeMode || prev.prizeMode,
      prizeDetails: editTournament.prizeDetails || '',
      prizesByRank: editTournament.prizesByRank || prev.prizesByRank,
      entryFee: editTournament.entry || editTournament.entryFee || prev.entryFee,
      entryFeeAmount: editTournament.entryFeeAmount || prev.entryFeeAmount,
      maxSlots: editMaxSlots || prev.maxSlots,
      format: normalizeTournamentFormat(editTournament.format || prev.format),
      server: editTournament.server || '',
      platform: normalizeTournamentPlatform(editTournament.platform || prev.platform),
      organizerName: editTournament.organizer || prev.organizerName,
      registrationWindow: {
        start: toDate(editTournament.registrationWindow?.start),
        end: toDate(editTournament.registrationWindow?.end)
      },
      checkInWindow: {
        start: toDate(editTournament.checkInWindow?.start),
        end: toDate(editTournament.checkInWindow?.end)
      },
      eligibility: {
        minAge: editTournament.eligibility?.minAge || prev.eligibility.minAge,
        allowedCountries: Array.isArray(editTournament.eligibility?.allowedCountries)
          ? editTournament.eligibility.allowedCountries.join(', ')
          : prev.eligibility.allowedCountries,
        notes: editTournament.eligibility?.notes || '',
        universityOnly: editTournament.eligibility?.universityOnly === true
      },
      contact: editTournament.contact || prev.contact,
      broadcast: editTournament.broadcast || prev.broadcast,
      matchConfig: {
        seriesType: editTournament.matchConfig?.seriesType || prev.matchConfig.seriesType,
        mapPool: normalizeTournamentMapPool(
          editTournament.game || prev.game,
          editTournament.matchConfig?.mapPool
        ),
        patchVersion: editTournament.matchConfig?.patchVersion || ''
      },
      legalCompliance: {
        jurisdiction: editTournament.legalCompliance?.jurisdiction || '',
        governingLaw: editTournament.legalCompliance?.governingLaw || '',
        claimsContact: editTournament.legalCompliance?.claimsContact || '',
        rulesAccepted: editTournament.legalCompliance?.rulesAccepted ?? true,
        privacyAccepted: editTournament.legalCompliance?.privacyAccepted ?? true,
        organizerDeclaration: editTournament.legalCompliance?.organizerDeclaration ?? true
      },
      sponsors: Array.isArray(editTournament.sponsors) && editTournament.sponsors.length
        ? editTournament.sponsors.map((s) => ({ name: s.name || '', link: s.link || '', tier: s.tier || 'Partner', logoFile: null }))
        : prev.sponsors,
      staffMembers: (() => {
        const s = editTournament.staff;
        if (Array.isArray(s)) return s;
        if (s && typeof s === 'object') {
          const arr = [];
          (s.moderators || []).forEach((m) => arr.push({ username: typeof m === 'string' ? m : m.username, role: 'moderator' }));
          (s.casters || []).forEach((c) => arr.push({ username: typeof c === 'string' ? c : c.username, role: 'caster' }));
          return arr.filter((e) => e.username);
        }
        return prev.staffMembers;
      })()
    }));
  }, [isEditMode, editTournament]);

  const completion = useMemo(() => {
    const checks = [
      tournament.title, tournament.game, tournament.description, tournament.date, tournament.time,
      tournament.maxSlots, tournament.modality,
      tournament.legalCompliance.jurisdiction, tournament.legalCompliance.governingLaw,
      tournament.legalCompliance.rulesAccepted, tournament.legalCompliance.privacyAccepted, tournament.legalCompliance.organizerDeclaration
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [tournament]);

  const isMlbbTournament = useMemo(
    () => MLBB_TITLES.has(String(tournament.game || '').trim()),
    [tournament.game]
  );
  const isRiotTournament = useMemo(
    () => RIOT_TITLES.has(String(tournament.game || '').trim()),
    [tournament.game]
  );
  const serverOptions = useMemo(
    () => getTournamentServerOptions(tournament.game, tournament.server),
    [tournament.game, tournament.server]
  );
  const mapOptions = useMemo(
    () => getTournamentMapOptions(tournament.game, tournament.matchConfig.mapPool),
    [tournament.game, tournament.matchConfig.mapPool]
  );
  const selectedSlotPreset = slotInputMode === 'custom'
    ? 'custom'
    : resolveMaxSlotsSelection(tournament.maxSlots);
  const projectedActiveParticipants = useMemo(() => {
    const maxSlots = parsePositiveInt(tournament.maxSlots, 0);
    const teamSize = parseTeamSizeFromModality(tournament.modality);
    return maxSlots * teamSize;
  }, [tournament.maxSlots, tournament.modality]);
  const riotReviewLocked = RIOT_REVIEW_MODE && isRiotTournament;
  const isPaidEntry = useMemo(
    () => normalizeText(tournament.entryFee).trim() === 'pago',
    [tournament.entryFee]
  );
  const entryFeeAmountValue = useMemo(
    () => (isPaidEntry ? parseMoneyAmount(tournament.entryFeeAmount) : 0),
    [isPaidEntry, tournament.entryFeeAmount]
  );
  const riotMinimumPrizePool = useMemo(() => {
    if (!isRiotTournament || !isPaidEntry) return 0;
    return entryFeeAmountValue * parsePositiveInt(tournament.maxSlots, 0) * 0.7;
  }, [entryFeeAmountValue, isPaidEntry, isRiotTournament, tournament.maxSlots]);

  const identityReady = Boolean(tournament.title?.trim() && tournament.game && tournament.description?.trim() && tournament.date && tournament.time);
  const formatReady = Boolean(tournament.maxSlots && tournament.modality && tournament.format);
  const entryConfigReady = !isPaidEntry || entryFeeAmountValue > 0;
  const hasMoneyPrize = Boolean(
    String(tournament.prizePool || '').trim()
    || String(tournament.prizesByRank.first || '').trim()
    || String(tournament.prizesByRank.second || '').trim()
    || String(tournament.prizesByRank.third || '').trim()
  );
  const hasItemPrize = Boolean(String(tournament.prizeDetails || '').trim());
  const paymentsReady = (
    tournament.prizeMode === 'none'
    || (tournament.prizeMode === 'money' && hasMoneyPrize)
    || (tournament.prizeMode === 'items' && hasItemPrize)
    || (tournament.prizeMode === 'mixed' && (hasMoneyPrize || hasItemPrize))
  );
  const contactReady = Boolean(tournament.contact.email?.trim() && (tournament.contact.discordInvite?.trim() || tournament.broadcast.streamUrl?.trim() || tournament.contact.phone?.trim()));

  const [staffQuery, setStaffQuery] = useState('');
  const [staffSuggestions, setStaffSuggestions] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffRole, setStaffRole] = useState('moderator');

  useEffect(() => {
    if (!staffQuery.trim() || staffQuery.trim().length < 2) {
      setStaffSuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setStaffLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/tournaments/staff-search`, {
          params: { q: staffQuery.trim(), game: tournament.game || '' },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const existing = new Set((tournament.staffMembers || []).map((m) => m.username.toLowerCase()));
        setStaffSuggestions((res.data || []).filter((u) => !existing.has(u.username.toLowerCase())));
      } catch {
        setStaffSuggestions([]);
      } finally {
        setStaffLoading(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [staffQuery, tournament.game, tournament.staffMembers, token]);

  const addStaffMember = (username, role) => {
    if (!username.trim()) return;
    const exists = tournament.staffMembers.some((m) => m.username.toLowerCase() === username.toLowerCase());
    if (exists) return;
    setTournament((p) => ({ ...p, staffMembers: [...p.staffMembers, { username: username.trim(), role }] }));
    setStaffQuery('');
    setStaffSuggestions([]);
  };

  const removeStaffMember = (index) => {
    setTournament((p) => ({ ...p, staffMembers: p.staffMembers.filter((_, i) => i !== index) }));
  };

  const unlockFormat = identityReady;
  const unlockPayments = unlockFormat && formatReady;
  const unlockBroadcast = unlockPayments && paymentsReady;
  const unlockSponsors = unlockBroadcast && contactReady;
  const unlockLegal = unlockBroadcast;
  const canSubmit = unlockLegal
    && entryConfigReady
    && Boolean(tournament.legalCompliance.jurisdiction?.trim())
    && Boolean(tournament.legalCompliance.governingLaw?.trim())
    && tournament.legalCompliance.rulesAccepted
    && tournament.legalCompliance.privacyAccepted
    && tournament.legalCompliance.organizerDeclaration;

  const setField = (field, value) => setTournament((p) => ({ ...p, [field]: value }));
  const setGameField = (value) => {
    setPendingMap('');
    setTournament((prev) => {
      const nextServer = isValidTournamentServer(value, prev.server)
        ? normalizeTournamentServer(value, prev.server)
        : '';
      return {
        ...prev,
        game: value,
        server: nextServer,
        matchConfig: {
          ...prev.matchConfig,
          mapPool: []
        }
      };
    });
  };
  const setNested = (group, key, value) => setTournament((p) => ({ ...p, [group]: { ...p[group], [key]: value } }));
  const setPrize = (key, value) => setTournament((p) => ({ ...p, prizesByRank: { ...p.prizesByRank, [key]: value } }));
  const setMaxSlotsPreset = (value) => {
    if (value === 'custom') {
      setSlotInputMode('custom');
      setField('maxSlots', BRACKET_SLOT_PRESETS.includes(String(tournament.maxSlots || '').trim()) ? '' : tournament.maxSlots);
      return;
    }

    setSlotInputMode('preset');
    setField('maxSlots', value);
  };
  const setCustomMaxSlots = (value) => {
    if (!INTEGER_INPUT_REGEX.test(value)) return;
    setField('maxSlots', value);
  };
  const addMapToPool = (value) => {
    const mapName = String(value || '').trim();
    if (!mapName) return;

    setTournament((prev) => ({
      ...prev,
      matchConfig: {
        ...prev.matchConfig,
        mapPool: normalizeTournamentMapPool(prev.game, [...(prev.matchConfig.mapPool || []), mapName])
      }
    }));
    setPendingMap('');
  };
  const removeMapFromPool = (value) => {
    const target = String(value || '').trim().toLowerCase();
    if (!target) return;

    setTournament((prev) => ({
      ...prev,
      matchConfig: {
        ...prev.matchConfig,
        mapPool: (prev.matchConfig.mapPool || []).filter((mapName) => String(mapName || '').trim().toLowerCase() !== target)
      }
    }));
  };
  const setSponsor = (index, key, value) =>
    setTournament((p) => {
      const sponsors = [...p.sponsors];
      sponsors[index][key] = value;
      return { ...p, sponsors };
    });
  const addSponsor = () => setTournament((p) => ({ ...p, sponsors: [...p.sponsors, { name: '', link: '', tier: 'Partner', logoFile: null }] }));
  const delSponsor = (index) => setTournament((p) => ({ ...p, sponsors: p.sponsors.filter((_, i) => i !== index) }));
  const setFile = (e, key, sponsorIndex = null) => {
    const file = e.target.files[0];
    if (sponsorIndex === null) {
      setField(key, file);
      if (key === 'bannerFile' && file) {
        const url = URL.createObjectURL(file);
        setBannerPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
      }
      return;
    }
    setTournament((p) => {
      const sponsors = [...p.sponsors];
      sponsors[sponsorIndex].logoFile = file;
      return { ...p, sponsors };
    });
  };

  useEffect(() => {
    if (!riotReviewLocked) return;
    if (isFreeEntryFee(tournament.entryFee)) return;
    setField('entryFee', 'Gratis');
  }, [riotReviewLocked, tournament.entryFee]);

  useEffect(() => {
    if (isPaidEntry || !tournament.entryFeeAmount) return;
    setField('entryFeeAmount', '');
  }, [isPaidEntry, tournament.entryFeeAmount]);

  const hasUnsavedChanges = Boolean(tournament.title || tournament.game || tournament.description);
  useEffect(() => {
    if (isPublished || !hasUnsavedChanges) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges, isPublished]);

  const buildMlbbDemoTournament = () => ({
      title: 'MLBB Caribbean Clash 2026',
      description: 'Torneo profesional de Mobile Legends con fase suiza, playoffs y transmision oficial.',
      game: 'Mobile Legends',
      gender: 'Mixto',
      modality: '5v5',
      date: datePlus(21),
      time: '19:00',
      timezone: 'America/Santo_Domingo',
      prizePool: '250000',
      currency: 'DOP',
      prizeMode: 'mixed',
      prizeDetails: 'Medallas oficiales, jerseys gamer y perifericos para top 8.',
      prizesByRank: { first: '150000', second: '70000', third: '30000' },
      entryFee: 'Gratis',
      entryFeeAmount: '',
      maxSlots: '32',
      format: 'double_elimination',
      server: 'LATAM',
      platform: 'Mobile',
      bannerFile: null,
      rulesPdf: null,
      organizerName: user?.username || 'Organizador Oficial',
      registrationWindow: { start: datePlus(1), end: datePlus(14) },
      checkInWindow: { start: datePlus(20), end: datePlus(21) },
      eligibility: {
        minAge: 16,
        allowedCountries: 'Republica Dominicana, Puerto Rico, Mexico, Colombia',
        notes: 'Se requiere cuenta activa en el servidor LATAM y disponibilidad para horarios nocturnos.'
      },
      contact: {
        email: 'tournaments@glitchgang.net',
        phone: '+1 809-555-0199',
        discordInvite: 'https://discord.gg/ExCguE8e'
      },
      broadcast: {
        streamUrl: 'https://www.twitch.tv/glitchgang',
        streamLanguage: 'es'
      },
      matchConfig: {
        seriesType: 'BO3',
        mapPool: ['Land of Dawn'],
        patchVersion: 'MLBB v1.8.90'
      },
      legalCompliance: {
        jurisdiction: 'Republica Dominicana',
        governingLaw: 'Normativa local de comercio electronico, consumidor y datos personales aplicable al evento',
        claimsContact: 'legal@glitchgang.net',
        rulesAccepted: true,
        privacyAccepted: true,
        organizerDeclaration: true
      },
      sponsors: [
        { name: 'Razer Caribe', link: 'https://www.razer.com', tier: 'Principal', logoFile: null },
        { name: 'Red Bull Gaming', link: 'https://www.redbull.com', tier: 'Partner', logoFile: null }
      ],
      staffMembers: [
        { username: 'Mod_Karina', role: 'moderator' },
        { username: 'Mod_Rafy', role: 'moderator' },
        { username: 'Caster_Axel', role: 'caster' },
        { username: 'Caster_Luna', role: 'caster' }
      ]
  });

  const loadMlbbDemo = () => {
    setSlotInputMode('preset');
    setPendingMap('');
    setTournament(buildMlbbDemoTournament());
  };

  const saveTournamentToLocal = (source) => {
    const now = Date.now();
    const localTournament = {
      _id: `local_${now}`,
      tournamentId: `TOR-LOCAL-${String(now).slice(-6)}`,
      title: source.title,
      description: source.description,
      game: source.game,
      gender: source.gender,
      modality: source.modality,
      date: source.date,
      time: source.time,
      timezone: source.timezone,
      prizePool: source.prizePool,
      currency: source.currency,
      prizeMode: source.prizeMode,
      prizeDetails: source.prizeDetails,
      prizesByRank: source.prizesByRank,
      entryFee: source.entryFee,
      entryFeeAmount: source.entryFeeAmount,
      maxSlots: Number(source.maxSlots) || 0,
      currentSlots: 0,
      format: source.format,
      server: source.server,
      platform: source.platform,
      bannerImage: '',
      rulesPdf: '',
      eligibility: source.eligibility,
      registrationWindow: source.registrationWindow,
      checkInWindow: source.checkInWindow,
      contact: source.contact,
      broadcast: source.broadcast,
      matchConfig: source.matchConfig,
      legalCompliance: source.legalCompliance,
      sponsors: (source.sponsors || []).filter((s) => s?.name || s?.link).map((s) => ({
        name: s.name || '',
        link: s.link || '',
        tier: s.tier || 'Partner',
        logoUrl: ''
      })),
      staff: (() => {
        const members = source.staffMembers || [];
        return {
          moderators: members.filter((m) => m.role === 'moderator').map((m) => ({ username: m.username, role: m.role })),
          casters: members.filter((m) => m.role !== 'moderator').map((m) => ({ username: m.username, role: m.role }))
        };
      })(),
      organizer: {
        _id: user?._id || 'local-organizer',
        username: user?.username || source.organizerName || 'Organizador Local'
      },
      status: 'open',
      registrationClosed: false,
      registrations: [],
      publicSettings: {
        visibility: 'public',
        showPrize: true,
        showSponsors: true,
        showRules: true,
        showSchedule: true,
        showContact: true,
        showTeams: false,
        showBracket: true,
        customMessage: 'Torneo demo local para pruebas.'
      },
      bracket: {
        rounds: [
          {
            name: 'Ronda 1',
            matches: [
              { teamA: 'Team Aurora', scoreA: 0, teamB: 'Team Nova', scoreB: 0 },
              { teamA: 'Team Caribe', scoreA: 0, teamB: 'Team Storm', scoreB: 0 }
            ]
          }
        ]
      },
      __local: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const current = getStoredLocalTournaments();
    current.unshift(localTournament);
    saveStoredLocalTournaments(current);
    return localTournament;
  };

  const buildFormData = (source) => {
    const data = new FormData();
    [
      'title', 'description', 'game', 'modality', 'date', 'time', 'timezone',
      'prizePool', 'currency', 'prizeMode', 'prizeDetails', 'entryFee', 'entryFeeAmount', 'maxSlots', 'format', 'server', 'platform', 'gender'
    ].forEach((k) => data.append(k, source[k]));
    data.append('prizesByRank', JSON.stringify(source.prizesByRank));
    const staffPayload = {
      moderators: (source.staffMembers || []).filter((m) => m.role === 'moderator').map((m) => ({ username: m.username, role: m.role })),
      casters: (source.staffMembers || []).filter((m) => m.role !== 'moderator').map((m) => ({ username: m.username, role: m.role }))
    };
    data.append('staff', JSON.stringify(staffPayload));
    data.append('registrationWindow', JSON.stringify(source.registrationWindow));
    data.append('checkInWindow', JSON.stringify(source.checkInWindow));
    data.append('eligibility', JSON.stringify(source.eligibility));
    data.append('contact', JSON.stringify(source.contact));
    data.append('broadcast', JSON.stringify(source.broadcast));
    data.append('matchConfig', JSON.stringify(source.matchConfig));
    data.append('legalCompliance', JSON.stringify(source.legalCompliance));

    const sponsors = [];
    let logoIndex = 0;
    source.sponsors.forEach((s) => {
      const item = { name: s.name, link: s.link, tier: s.tier };
      if (s.logoFile) {
        item.logoIndex = logoIndex;
        data.append('sponsorLogos', s.logoFile);
        logoIndex += 1;
      }
      sponsors.push(item);
    });
    data.append('sponsors', JSON.stringify(sponsors));

    // Archivos principales
    if (source.bannerFile) data.append('bannerFile', source.bannerFile);
    if (source.rulesPdf) data.append('rulesPdf', source.rulesPdf);

    // Archivos de Sponsors (Logos individuales)
    // sponsorLogos ya agregados en el bloque de sponsors

    return data;
  };

  const createTournamentRequest = async (source, isLocal) => {
    if (isLocal) {
      saveTournamentToLocal(source);
      return;
    }

    try {
      const data = buildFormData(source);
      const url = isEditMode
        ? `${API_URL}/api/tournaments/${editTournament.tournamentId}`
        : `${API_URL}/api/tournaments`;
      const method = isEditMode ? 'put' : 'post';

      await axios({
        url,
        method,
        data,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      throw error;
    }
  };

  const createMlbbDemoNow = async () => {
    const demo = buildMlbbDemoTournament();
    try {
      setSlotInputMode('preset');
      setPendingMap('');
      saveTournamentToLocal(demo);
      setTournament(demo);
      setIsPublished(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert(error?.message || 'No fue posible crear el torneo demo local.');
    }
  };

  const saveTournament = async (e) => {
    e.preventDefault();
    if (tournament.registrationWindow.start && tournament.registrationWindow.end
      && tournament.registrationWindow.end < tournament.registrationWindow.start) {
      alert('La fecha "Registro hasta" no puede ser menor que "Registro desde".');
      return;
    }
    if (tournament.registrationWindow.end && tournament.date
      && tournament.registrationWindow.end > tournament.date) {
      alert('La fecha "Registro hasta" no puede superar la fecha de inicio del torneo.');
      return;
    }
    if (tournament.checkInWindow.start && tournament.checkInWindow.end
      && tournament.checkInWindow.end < tournament.checkInWindow.start) {
      alert('La fecha "Check-in hasta" no puede ser menor que "Check-in desde".');
      return;
    }
    if (tournament.checkInWindow.start && tournament.date
      && tournament.checkInWindow.start > tournament.date) {
      alert('La fecha "Check-in desde" debe ser antes del inicio del torneo.');
      return;
    }
    if (isPaidEntry && entryFeeAmountValue <= 0) {
      alert('Si el torneo es de pago debes indicar un monto de inscripcion valido por cupo.');
      return;
    }

    const parsedMaxSlots = parsePositiveInt(tournament.maxSlots, 0);
    if (parsedMaxSlots < 4) {
      alert('La cantidad del torneo debe ser de al menos 4 cupos.');
      return;
    }

    if (isRiotTournament) {
      const banned = findRiotBannedTerm(
        [tournament.title, tournament.description, tournament.prizeDetails].join(' ')
      );
      if (banned) {
        notify('danger', 'Cumplimiento Riot', `Texto no permitido: "${banned}".`);
        return;
      }

      const ALLOWED_FORMATS = ['single_elimination', 'double_elimination', 'swiss', 'round_robin',
        'Eliminacion Directa', 'Doble Eliminacion', 'Swiss', 'Round Robin'];
      if (!ALLOWED_FORMATS.includes(String(tournament.format || '').trim())) {
        alert('En torneos Riot solo se permiten formatos tradicionales (eliminación directa, doble eliminación, suizo o round robin).');
        return;
      }

      if (riotReviewLocked && !isFreeEntryFee(tournament.entryFee)) {
        alert('En modo review de Riot solo se permiten torneos gratuitos.');
        return;
      }

      if (projectedActiveParticipants < RIOT_MIN_ACTIVE_PARTICIPANTS) {
        alert(`La configuración actual no llega al mínimo de ${RIOT_MIN_ACTIVE_PARTICIPANTS} participantes activos para torneos Riot.`);
        return;
      }

      if (isPaidEntry) {
        const prizePoolAmount = parseMoneyAmount(tournament.prizePool);
        if (prizePoolAmount < riotMinimumPrizePool) {
          alert(`El prize pool debe cubrir al menos el 70% de las inscripciones. Minimo requerido: ${formatMoneyAmount(riotMinimumPrizePool)} ${tournament.currency}.`);
          return;
        }
      }
    }

    if (isMlbbTournament) {
      const ALLOWED_FORMATS = ['single_elimination', 'double_elimination', 'swiss', 'round_robin'];
      if (!ALLOWED_FORMATS.includes(tournament.format)) {
        alert('En MLBB solo se permiten formatos tradicionales (eliminación directa, doble eliminación, suizo o round robin).');
        return;
      }

      if (MLBB_BETA_MODE && String(tournament.entryFee || '').trim().toLowerCase() !== 'gratis') {
        alert('En beta de MLBB solo se permiten torneos gratuitos.');
        return;
      }

      const banned = findMlbbBannedTerm(
        [tournament.title, tournament.description, tournament.prizeDetails].join(' ')
      );
      if (banned) {
        alert(`Texto no permitido para cumplimiento MLBB: "${banned}".`);
        return;
      }

      if (!String(tournament.contact.email || '').trim()) {
        alert('Para torneos MLBB debes definir un correo de contacto.');
        return;
      }

      if (!String(tournament.legalCompliance.claimsContact || '').trim()) {
        alert('Para torneos MLBB debes definir un canal de reclamos legales.');
        return;
      }
    }

    if (tournament.prizeMode === 'money' || tournament.prizeMode === 'mixed') {
      const pool = Number(tournament.prizePool) || 0;
      const rankSum = (Number(tournament.prizesByRank.first) || 0)
        + (Number(tournament.prizesByRank.second) || 0)
        + (Number(tournament.prizesByRank.third) || 0);
      if (pool > 0 && rankSum > pool) {
        alert(`La suma de premios por puesto (${rankSum}) supera el prize pool total (${pool}).`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await createTournamentRequest(tournament, false);
      setIsPublished(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert(error.response?.data?.message || 'No fue posible guardar el torneo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPublished) {
    return (
      <div className="ct-success">
        <div className="ct-success-card">
          <FaCheckCircle className="ct-success-icon" />
          <h2>{isEditMode ? 'Torneo actualizado' : 'Torneo publicado'}</h2>
          <p>El torneo <strong>{tournament.title}</strong> fue guardado correctamente.</p>
          <div className="ct-actions">
            {!isEditMode && (
              <button className="ct-btn ct-btn-outline" onClick={() => setIsPublished(false)}>
                <FaPlus /> Crear otro
              </button>
            )}
            <button className="ct-btn ct-btn-main" onClick={() => navigate('/dashboard')}>Ir al dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ct-page">
      <form className="ct-form" onSubmit={saveTournament}>
        <header className="ct-hero">
          <div>
            <p className="ct-badge"><FaShieldAlt /> Panel profesional</p>
            <h1>{isEditMode ? 'Editar' : 'Configurar'} <span>Torneo Profesional</span></h1>
            <p className="ct-subtitle">Organizador responsable: <strong>{tournament.organizerName}</strong></p>
            <div className="ct-hero-actions">
              <button type="button" className="ct-btn ct-btn-outline" onClick={loadMlbbDemo}>
                Cargar demo MLBB
              </button>
              <button type="button" className="ct-btn ct-btn-main" onClick={createMlbbDemoNow}>
                Crear demo MLBB local
              </button>
            </div>
          </div>
          <div className="ct-progress-card">
            <p>Progreso</p>
            <strong>{completion}%</strong>
            <div className="ct-progress-bar"><span style={{ width: `${completion}%` }} /></div>
          </div>
        </header>

        <section className="ct-card">
          <div className="ct-card-title"><span className={`ct-step ${identityReady ? 'ct-step--done' : ''}`}>01</span><FaGamepad /><h3>Identidad del torneo</h3>{identityReady && <FaCheckCircle className="ct-step-check" />}</div>
          <p className="ct-lead">Datos base visibles para jugadores: nombre, juego, fecha y reglamento.</p>
          <fieldset className="ct-fieldset">
            <div className="ct-grid three">
              <label className="ct-field"><span>Titulo oficial</span><input required value={tournament.title} onChange={(e) => setField('title', e.target.value)} /></label>
              <label className="ct-field"><span>Juego</span><select required value={tournament.game} onChange={(e) => setGameField(e.target.value)}><option value="">Seleccionar</option>{GAMES.map((g) => <option key={g} value={g}>{g}</option>)}</select></label>
              <label className="ct-field">
                <span>Servidor</span>
                <select
                  value={tournament.server}
                  onChange={(e) => setField('server', e.target.value)}
                  disabled={!tournament.game}
                >
                  <option value="">{tournament.game ? 'Seleccionar servidor' : 'Selecciona el juego primero'}</option>
                  {serverOptions.map((option) => (
                    <option key={`${tournament.game || 'default'}-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small>El servidor se define por selección para mantener consistencia entre torneos.</small>
              </label>
            </div>
            <div className="ct-grid four">
              <label className="ct-field"><span>Plataforma</span><select value={tournament.platform} onChange={(e) => setField('platform', e.target.value)}>{TOURNAMENT_PLATFORM_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></label>
              <label className="ct-field"><span>Zona horaria</span><select value={tournament.timezone} onChange={(e) => setField('timezone', e.target.value)}><option value="UTC">UTC</option><option value="America/Santo_Domingo">America/Santo_Domingo</option><option value="America/New_York">America/New_York</option><option value="America/Mexico_City">America/Mexico_City</option><option value="America/Bogota">America/Bogota</option><option value="Europe/Madrid">Europe/Madrid</option><option value="Europe/London">Europe/London</option><option value="Asia/Tokyo">Asia/Tokyo</option></select></label>
              <label className="ct-field"><span>Fecha inicio</span><input type="date" min={todayInput} required value={tournament.date} onChange={(e) => setField('date', e.target.value)} /></label>
              <label className="ct-field"><span>Hora inicio</span><input type="time" required value={tournament.time} onChange={(e) => setField('time', e.target.value)} /></label>
            </div>
            <label className="ct-field">
              <span>Descripcion</span>
              <textarea rows="3" maxLength={1500} value={tournament.description} onChange={(e) => setField('description', e.target.value)} />
              <small className="ct-char-count">{tournament.description.length} / 1500</small>
            </label>
            <div className="ct-grid two">
              <label className="ct-field ct-file"><span>Banner</span><input type="file" accept="image/*" onChange={(e) => setFile(e, 'bannerFile')} /><small><FaFileUpload /> Imagen del torneo</small></label>
              <label className="ct-field ct-file"><span>Reglamento PDF</span><input type="file" accept=".pdf" onChange={(e) => setFile(e, 'rulesPdf')} /><small><FaFilePdf /> Recomendado para validez legal</small></label>
            </div>
            {bannerPreview && (
              <div className="ct-banner-preview">
                <img src={bannerPreview} alt="Preview del banner" />
              </div>
            )}
          </fieldset>
        </section>

        <section className={`ct-card ${!unlockFormat ? 'is-locked' : ''}`}>
          <div className="ct-card-title"><span className={`ct-step ${formatReady ? 'ct-step--done' : ''}`}>02</span><FaSitemap /><h3>Formato y elegibilidad</h3>{formatReady && <FaCheckCircle className="ct-step-check" />}</div>
          <p className="ct-lead">Define estructura competitiva, ventanas de registro y requisitos de participacion.</p>
          {!unlockFormat && <p className="ct-locked-note">Completa el Paso 01 para desbloquear este bloque.</p>}
          <fieldset className="ct-fieldset" disabled={!unlockFormat}>
            <div className="ct-grid four">
              <label className="ct-field">
                <span>Cantidad</span>
                <div className="ct-inline-pair ct-inline-pair--count">
                  <select
                    required
                    value={selectedSlotPreset}
                    onChange={(e) => setMaxSlotsPreset(e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    {BRACKET_SLOT_PRESETS.map((slots) => (
                      <option key={slots} value={slots}>{slots}</option>
                    ))}
                    <option value="custom">Escribir cantidad</option>
                  </select>
                  <input
                    type="number"
                    min="4"
                    step="1"
                    placeholder="Ej: 48"
                    value={slotInputMode === 'custom' ? tournament.maxSlots : ''}
                    onChange={(e) => setCustomMaxSlots(e.target.value)}
                    disabled={slotInputMode !== 'custom'}
                  />
                </div>
                <small>Presets rapidos desde 4 equipos y opcion manual si necesitas otro numero.</small>
              </label>
              <label className="ct-field"><span>Genero</span><select value={tournament.gender} onChange={(e) => setField('gender', e.target.value)}>{TEAM_GENDER_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
              <label className="ct-field"><span>Equipo</span><select value={tournament.modality} onChange={(e) => setField('modality', e.target.value)}><option value="">Seleccionar</option><option>1v1</option><option>2v2</option><option>3v3</option><option>5v5</option></select></label>
              <label className="ct-field"><span>Llaves</span><select value={tournament.format} onChange={(e) => setField('format', e.target.value)}>{TOURNAMENT_FORMAT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></label>
            </div>
            <div className="ct-grid three">
              <label className="ct-field"><span>Serie</span><select value={tournament.matchConfig.seriesType} onChange={(e) => setNested('matchConfig', 'seriesType', e.target.value)}><option>BO1</option><option>BO3</option><option>BO5</option><option>FT2</option></select></label>
              <label className="ct-field"><span>Patch</span><input placeholder="Ej: 15.4" value={tournament.matchConfig.patchVersion} onChange={(e) => setNested('matchConfig', 'patchVersion', e.target.value)} /></label>
              <label className="ct-field">
                <span>Map pool</span>
                {mapOptions.length > 0 ? (
                  <div className="ct-map-pool">
                    {tournament.matchConfig.mapPool.length > 0 ? (
                      <div className="ct-map-chips">
                        {tournament.matchConfig.mapPool.map((map) => (
                          <span key={map} className="ct-map-chip">
                            {map}
                            <button type="button" onClick={() => setTournament((p) => ({ ...p, matchConfig: { ...p.matchConfig, mapPool: p.matchConfig.mapPool.filter((m) => m !== map) } }))}>×</button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <small className="ct-map-empty">Sin mapas seleccionados</small>
                    )}
                    <div className="ct-map-actions">
                      <select
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          setTournament((p) => {
                            if (p.matchConfig.mapPool.includes(val)) return p;
                            return { ...p, matchConfig: { ...p.matchConfig, mapPool: [...p.matchConfig.mapPool, val] } };
                          });
                        }}
                      >
                        <option value="">Agregar mapa...</option>
                        {mapOptions.filter((o) => !tournament.matchConfig.mapPool.includes(o.value)).map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      {tournament.matchConfig.mapPool.length < mapOptions.length && (
                        <button type="button" className="ct-map-all-btn" onClick={() => setTournament((p) => ({ ...p, matchConfig: { ...p.matchConfig, mapPool: mapOptions.map((o) => o.value) } }))}>
                          Todos
                        </button>
                      )}
                      {tournament.matchConfig.mapPool.length > 0 && (
                        <button type="button" className="ct-map-all-btn ct-map-clear-btn" onClick={() => setTournament((p) => ({ ...p, matchConfig: { ...p.matchConfig, mapPool: [] } }))}>
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <input placeholder="Ascent, Bind, Haven" value={pendingMap} onChange={(e) => setPendingMap(e.target.value)} onBlur={() => {
                    if (!pendingMap.trim()) return;
                    const maps = pendingMap.split(',').map((m) => m.trim()).filter(Boolean);
                    setTournament((p) => ({ ...p, matchConfig: { ...p.matchConfig, mapPool: [...new Set([...p.matchConfig.mapPool, ...maps])] } }));
                    setPendingMap('');
                  }} />
                )}
              </label>
            </div>
            <div className="ct-grid four">
              <label className="ct-field"><span>Registro desde</span><input type="date" max={tournament.registrationWindow.end || tournament.date || undefined} value={tournament.registrationWindow.start} onChange={(e) => setNested('registrationWindow', 'start', e.target.value)} /></label>
              <label className="ct-field"><span>Registro hasta</span><input type="date" min={tournament.registrationWindow.start || undefined} max={tournament.date || undefined} value={tournament.registrationWindow.end} onChange={(e) => setNested('registrationWindow', 'end', e.target.value)} /></label>
              <label className="ct-field"><span>Check-in desde</span><input type="date" min={tournament.registrationWindow.end || undefined} max={tournament.checkInWindow.end || tournament.date || undefined} value={tournament.checkInWindow.start} onChange={(e) => setNested('checkInWindow', 'start', e.target.value)} /></label>
              <label className="ct-field"><span>Check-in hasta</span><input type="date" min={tournament.checkInWindow.start || undefined} max={tournament.date || undefined} value={tournament.checkInWindow.end} onChange={(e) => setNested('checkInWindow', 'end', e.target.value)} /></label>
            </div>
            <div className="ct-grid four">
              <label className="ct-field"><span>Edad minima</span><input type="number" min="13" value={tournament.eligibility.minAge} onChange={(e) => setNested('eligibility', 'minAge', e.target.value)} /></label>
              <label className="ct-field"><span>Paises permitidos</span><input placeholder="Global, Republica Dominicana, Mexico, Espana" value={tournament.eligibility.allowedCountries} onChange={(e) => setNested('eligibility', 'allowedCountries', e.target.value)} /></label>
              <label className="ct-field">
                <span>Tipo de registro</span>
                <select value={tournament.entryFee} onChange={(e) => setField('entryFee', e.target.value)}>
                  <option>Gratis</option>
                  {!riotReviewLocked && <option>Invitacion</option>}
                  {!riotReviewLocked && <option>Password</option>}
                  {!riotReviewLocked && <option>Pago</option>}
                </select>
              </label>
              <label className="ct-field">
                <span>Monto por cupo</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={isPaidEntry ? 'Ej: 500 o 19.99' : 'Solo aplica si es Pago'}
                  value={tournament.entryFeeAmount}
                  onChange={(e) => {
                    if (MONEY_INPUT_REGEX.test(e.target.value)) {
                      setField('entryFeeAmount', e.target.value);
                    }
                  }}
                  disabled={!isPaidEntry}
                />
                <small>Monto unitario por equipo/cupo inscrito.</small>
              </label>
            </div>
            {isRiotTournament && (
              <p className="ct-inline-help">
                {riotReviewLocked
                  ? `Modo review Riot activo: solo se permite inscripción gratis y un mínimo de ${RIOT_MIN_ACTIVE_PARTICIPANTS} participantes activos.`
                  : `Recomendación Riot: usa formato tradicional y configura al menos ${RIOT_MIN_ACTIVE_PARTICIPANTS} participantes activos.`}
              </p>
            )}
            {isRiotTournament && isPaidEntry && (
              <p className="ct-inline-help">
                En torneos Riot con inscripción paga, el prize pool debe cubrir al menos el 70% de lo recaudado.
                {riotMinimumPrizePool > 0 && ` Minimo actual: ${formatMoneyAmount(riotMinimumPrizePool)} ${tournament.currency}.`}
              </p>
            )}
            <label className="ct-field">
              <span>Notas de elegibilidad</span>
              <textarea rows="2" maxLength={500} value={tournament.eligibility.notes} onChange={(e) => setNested('eligibility', 'notes', e.target.value)} />
              {tournament.eligibility.notes && <small className="ct-char-count">{tournament.eligibility.notes.length} / 500</small>}
            </label>
            <label className="ct-checkline">
              <input
                type="checkbox"
                checked={tournament.eligibility.universityOnly === true}
                onChange={(e) => setNested('eligibility', 'universityOnly', e.target.checked)}
              />
              <span>Solo equipos universitarios verificados</span>
            </label>
            {tournament.eligibility.universityOnly === true && (
              <p className="ct-inline-help">
                El backend exigirá que el equipo y todos sus jugadores tengan la misma universidad verificada en GLITCH GANG.
              </p>
            )}
          </fieldset>
        </section>

        <section className={`ct-card ct-card--payments ${!unlockPayments ? 'is-locked' : ''}`}>
          <div className="ct-card-title"><span className={`ct-step ${paymentsReady ? 'ct-step--done' : ''}`}>03</span><FaMoneyBillWave /><h3>Pagos y premios</h3>{paymentsReady && <FaCheckCircle className="ct-step-check" />}</div>
          <p className="ct-lead">Define si el evento tendra premios en dinero, en objetos, mixto o sin premio.</p>
          {!unlockPayments && <p className="ct-locked-note">Completa el Paso 02 para desbloquear este bloque.</p>}
          <fieldset className="ct-fieldset" disabled={!unlockPayments}>
            <div className="ct-grid four">
              <label className="ct-field"><span>Tipo de premio</span><select value={tournament.prizeMode} onChange={(e) => setField('prizeMode', e.target.value)}><option value="none">Sin premio</option><option value="money">Solo dinero</option><option value="items">Solo objetos</option><option value="mixed">Mixto</option></select></label>
              <label className="ct-field"><span>Prize pool</span><input type="number" min="0" placeholder="0 si no aplica" value={tournament.prizePool} onChange={(e) => setField('prizePool', e.target.value)} disabled={tournament.prizeMode === 'none' || tournament.prizeMode === 'items'} /></label>
              <label className="ct-field"><span>Moneda</span><select value={tournament.currency} onChange={(e) => setField('currency', e.target.value)}><option value="DOP">DOP</option><option value="USD">USD</option><option value="EUR">EUR</option></select></label>
              <label className="ct-field"><span>1er</span><input type="number" min="0" placeholder="0 si no aplica" value={tournament.prizesByRank.first} onChange={(e) => setPrize('first', e.target.value)} disabled={tournament.prizeMode === 'none' || tournament.prizeMode === 'items'} /></label>
              <label className="ct-field"><span>2do / 3ro</span><div className="ct-inline-pair"><input type="number" min="0" placeholder="0" value={tournament.prizesByRank.second} onChange={(e) => setPrize('second', e.target.value)} disabled={tournament.prizeMode === 'none' || tournament.prizeMode === 'items'} /><input type="number" min="0" placeholder="0" value={tournament.prizesByRank.third} onChange={(e) => setPrize('third', e.target.value)} disabled={tournament.prizeMode === 'none' || tournament.prizeMode === 'items'} /></div></label>
            </div>
            <label className="ct-field"><span>Premios en objetos / beneficios</span><textarea rows="2" placeholder="Ej: medallas, trofeos, periféricos, becas, gift cards" value={tournament.prizeDetails} onChange={(e) => setField('prizeDetails', e.target.value)} disabled={tournament.prizeMode === 'none' || tournament.prizeMode === 'money'} /></label>
            {(tournament.prizeMode === 'money' || tournament.prizeMode === 'mixed') && (() => {
              const pool = Number(tournament.prizePool) || 0;
              const rankSum = (Number(tournament.prizesByRank.first) || 0) + (Number(tournament.prizesByRank.second) || 0) + (Number(tournament.prizesByRank.third) || 0);
              if (pool > 0 && rankSum > pool) {
                return <p className="ct-prize-warning">La suma de premios por puesto ({rankSum}) supera el prize pool ({pool}).</p>;
              }
              return null;
            })()}
          </fieldset>
        </section>

        <section className={`ct-card ct-card--broadcast ${!unlockBroadcast ? 'is-locked' : ''}`}>
          <div className="ct-card-title"><span className={`ct-step ${contactReady ? 'ct-step--done' : ''}`}>04</span><FaBullhorn /><h3>Contacto y difusion</h3>{contactReady && <FaCheckCircle className="ct-step-check" />}</div>
          <p className="ct-lead">Canales para soporte, comunicacion y transmision del torneo.</p>
          {!unlockBroadcast && <p className="ct-locked-note">Completa el Paso 03 para desbloquear este bloque.</p>}
          <fieldset className="ct-fieldset" disabled={!unlockBroadcast}>
            <div className="ct-grid three">
              <label className="ct-field"><span>Email de contacto</span><input type="email" placeholder="torneos@ejemplo.com" value={tournament.contact.email} onChange={(e) => setNested('contact', 'email', e.target.value)} /><small>Requerido para publicar</small></label>
              <label className="ct-field"><span>Telefono / WhatsApp</span><input type="tel" placeholder="+1 809-555-0199" value={tournament.contact.phone} onChange={(e) => setNested('contact', 'phone', e.target.value)} /><small>Alternativa a Discord para desbloquear</small></label>
              <label className="ct-field"><span>Discord (invite)</span><input type="url" placeholder="https://discord.gg/..." value={tournament.contact.discordInvite} onChange={(e) => setNested('contact', 'discordInvite', e.target.value)} /><small><FaDiscord /> Canal de soporte oficial</small></label>
            </div>
            <div className="ct-grid two">
              <label className="ct-field"><span>Stream oficial</span><input type="url" placeholder="https://www.twitch.tv/..." value={tournament.broadcast.streamUrl} onChange={(e) => setNested('broadcast', 'streamUrl', e.target.value)} /></label>
              <label className="ct-field"><span>Idioma stream</span><select value={tournament.broadcast.streamLanguage} onChange={(e) => setNested('broadcast', 'streamLanguage', e.target.value)}><option value="es">Espanol</option><option value="en">Ingles</option><option value="pt">Portugues</option><option value="fr">Frances</option></select></label>
            </div>
            {!contactReady && unlockBroadcast && (
              <p className="ct-inline-help">Completa email + al menos un canal (Discord, stream o telefono) para desbloquear el siguiente paso.</p>
            )}
          </fieldset>
        </section>

        <section className={`ct-card ct-card--sponsors ${!unlockSponsors ? 'is-locked' : ''}`}>
          <div className="ct-card-title"><span className="ct-step">05</span><FaHandshake /><h3>Sponsors</h3></div>
          <p className="ct-lead">Opcional: registra marcas patrocinadoras con enlace y categoria.</p>
          {!unlockSponsors && <p className="ct-locked-note">Completa el Paso 04 para desbloquear este bloque.</p>}
          <fieldset className="ct-fieldset" disabled={!unlockSponsors}>
            <div className="ct-inline-title sponsor-title"><FaUsers /><h4>Patrocinadores del torneo</h4><button type="button" onClick={addSponsor}><FaPlus /></button></div>
            <div className="ct-sponsor-list">
              {tournament.sponsors.map((s, i) => (
                <div className="ct-sponsor-row" key={i}>
                  <input placeholder="Marca" value={s.name} onChange={(e) => setSponsor(i, 'name', e.target.value)} />
                  <input placeholder="https://marca.com" value={s.link} onChange={(e) => setSponsor(i, 'link', e.target.value)} />
                  <select value={s.tier} onChange={(e) => setSponsor(i, 'tier', e.target.value)}><option>Principal</option><option>Partner</option><option>Colaborador</option></select>
                  <label className="ct-mini-upload"><input type="file" onChange={(e) => setFile(e, 'logo', i)} />{s.logoFile ? 'OK' : <FaFileUpload />}</label>
                  <button type="button" className="ct-remove" onClick={() => delSponsor(i)}><FaTrash /></button>
                </div>
              ))}
            </div>
          </fieldset>
        </section>

        <section className={`ct-card ${!unlockSponsors ? 'is-locked' : ''}`}>
          <div className="ct-card-title"><span className="ct-step">05b</span><FaUserShield /><h3>Staff del torneo</h3></div>
          <p className="ct-lead">Agrega moderadores, casters, coaches o analistas. Se sugieren usuarios con roles de esports del mismo juego.</p>
          {!unlockSponsors && <p className="ct-locked-note">Completa el Paso 04 para desbloquear este bloque.</p>}
          <fieldset className="ct-fieldset" disabled={!unlockSponsors}>
            <div className="ct-staff-search-row">
              <select className="ct-staff-role-select" value={staffRole} onChange={(e) => setStaffRole(e.target.value)}>
                {TOURNAMENT_CREATOR_STAFF_ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <div className="ct-staff-autocomplete">
                <input
                  placeholder="Nombre o ID del staff"
                  value={staffQuery}
                  onChange={(e) => setStaffQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (staffSuggestions.length > 0) {
                        addStaffMember(staffSuggestions[0].username, staffRole);
                      } else if (staffQuery.trim()) {
                        addStaffMember(staffQuery, staffRole);
                      }
                    }
                  }}
                />
                {staffLoading && <span className="ct-staff-loading">Buscando...</span>}
                {staffSuggestions.length > 0 && (
                  <ul className="ct-staff-suggestions">
                    {staffSuggestions.map((u) => (
                      <li key={u.id || u.username} onClick={() => addStaffMember(u.username, staffRole)}>
                        <div className="ct-staff-suggestion-info">
                          {u.avatar && <img src={u.avatar} alt="" className="ct-staff-avatar" />}
                          <div>
                            <strong>{u.username}</strong>
                            {u.fullName && <span className="ct-staff-fullname">{u.fullName}</span>}
                          </div>
                        </div>
                        <div className="ct-staff-roles">
                          {(u.roles || []).map((r) => <span key={r} className="ct-staff-role-tag">{r}</span>)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button type="button" className="ct-btn ct-btn-outline ct-staff-add-btn" onClick={() => { if (staffQuery.trim()) addStaffMember(staffQuery, staffRole); }}>
                <FaPlus /> Agregar
              </button>
            </div>
            {tournament.staffMembers.length > 0 && (
              <div className="ct-staff-list">
                {tournament.staffMembers.map((m, i) => (
                  <div className="ct-staff-member" key={`${m.username}-${i}`}>
                    <span className="ct-staff-member-name">{m.username}</span>
                    <span className="ct-staff-role-tag">{TOURNAMENT_CREATOR_STAFF_ROLE_OPTIONS.find((r) => r.value === m.role)?.label || m.role}</span>
                    <button type="button" className="ct-remove" onClick={() => removeStaffMember(i)}><FaTrash /></button>
                  </div>
                ))}
              </div>
            )}
          </fieldset>
        </section>

        <section className={`ct-card ct-legal ${!unlockLegal ? 'is-locked' : ''}`}>
          <div className="ct-card-title"><span className={`ct-step ${canSubmit ? 'ct-step--done' : ''}`}>06</span><FaShieldAlt /><h3>Cumplimiento legal internacional</h3>{canSubmit && <FaCheckCircle className="ct-step-check" />}</div>
          <p className="ct-lead">Define la jurisdiccion legal del torneo y confirma los requisitos minimos antes de publicar.</p>
          {!unlockLegal && <p className="ct-locked-note">Completa el Paso 05 para desbloquear este bloque.</p>}
          <fieldset className="ct-fieldset" disabled={!unlockLegal}>
            <div className="ct-legal-help">
              <strong>Que debes hacer aqui:</strong>
              <span>Marca las 3 casillas de declaracion legal. Sin esas 3 confirmaciones no se puede publicar.</span>
            </div>
            {isMlbbTournament && (
              <p className="ct-legal-intro">
                <FaShieldAlt /> MLBB compliance: no afiliación oficial con Moonton, no apuestas y registro gratuito en modo beta.
              </p>
            )}
            <div className="ct-grid three">
              <label className="ct-field">
                <span>Jurisdiccion principal</span>
                <input
                  placeholder="Ej: Republica Dominicana"
                  value={tournament.legalCompliance.jurisdiction}
                  onChange={(e) => setNested('legalCompliance', 'jurisdiction', e.target.value)}
                  required={unlockLegal}
                />
              </label>
              <label className="ct-field">
                <span>Normativa aplicable</span>
                <input
                  placeholder="Ej: Ley local de comercio y consumidor"
                  value={tournament.legalCompliance.governingLaw}
                  onChange={(e) => setNested('legalCompliance', 'governingLaw', e.target.value)}
                  required={unlockLegal}
                />
              </label>
              <label className="ct-field">
                <span>Canal de reclamos</span>
                <input
                  placeholder="Email o enlace de soporte legal"
                  value={tournament.legalCompliance.claimsContact}
                  onChange={(e) => setNested('legalCompliance', 'claimsContact', e.target.value)}
                />
              </label>
            </div>
            <p className="ct-legal-intro"><FaGlobeAmericas /> Estas confirmaciones aplican al pais o region que definiste para el evento.</p>
            <label className="ct-check ct-check--legal">
              <input type="checkbox" checked={tournament.legalCompliance.rulesAccepted} onChange={(e) => setNested('legalCompliance', 'rulesAccepted', e.target.checked)} />
              <span>
                <strong>1) Reglas oficiales publicas (marcar casilla)</strong>
                <small>Todos los participantes pueden leer reglas, formato, criterios de desempate y sanciones.</small>
              </span>
            </label>
            <label className="ct-check ct-check--legal">
              <input type="checkbox" checked={tournament.legalCompliance.privacyAccepted} onChange={(e) => setNested('legalCompliance', 'privacyAccepted', e.target.checked)} />
              <span>
                <strong>2) Tratamiento legal de datos (marcar casilla)</strong>
                <small>Solo se recolectan datos necesarios del torneo y con base legal valida en la jurisdiccion.</small>
              </span>
            </label>
            <label className="ct-check ct-check--legal">
              <input type="checkbox" checked={tournament.legalCompliance.organizerDeclaration} onChange={(e) => setNested('legalCompliance', 'organizerDeclaration', e.target.checked)} />
              <span>
                <strong>3) Derechos sobre premios y marcas (marcar casilla)</strong>
                <small>Cuentas con autorizacion para premios, logos, patrocinios y difusion del evento.</small>
              </span>
            </label>
          </fieldset>
        </section>

        <div className="ct-actions">
          {isEditMode && <button type="button" className="ct-btn ct-btn-outline" onClick={() => navigate('/tournaments')}>Cancelar</button>}
          <button type="submit" className="ct-btn ct-btn-main" disabled={!canSubmit || isSubmitting}>{isSubmitting ? 'Publicando...' : isEditMode ? 'Guardar cambios' : 'Publicar torneo'}</button>
        </div>
      </form>
    </div>
  );
};

export default CreateTournament;
