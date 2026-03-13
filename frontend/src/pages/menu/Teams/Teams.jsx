import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import ViewTeamModal from './ViewTeamModal';
import PageHud from '../../../components/PageHud/PageHud';
import { applyImageFallback, getBotAvatarFallback, getTeamFallback, resolveMediaUrl } from '../../../utils/media';
import { getAuthToken } from '../../../utils/authSession';
import { formatTeamPublicId, getPublicTeamCode, matchesTeamPublicId } from '../../../utils/publicIds';
import { isMlbbVerifiedStatus, normalizeMlbbVerificationStatus } from '../../../utils/mlbbStatus';
import { getSupportedGameRoles, isSupportedGameName, isSupportedMlbbGame, isSupportedRiotGame } from '../../../../../shared/supportedGames.js';
import './Teams.css';

/* ═══════════════════════════════════════
   CATEGORY CONFIG — visual per level/gender
   ═══════════════════════════════════════ */
const LEVEL_CONFIG = {
    casual:        { icon: 'bx-game',        color: '#8EDB15', label: 'Casual' },
    amateur:       { icon: 'bx-joystick',    color: '#00d4ff', label: 'Amateur' },
    'semi-pro':    { icon: 'bx-target-lock', color: '#bf5af2', label: 'Semi-Pro' },
    universitario: { icon: 'bx-book-reader', color: '#6366f1', label: 'Universitario' },
    profesional:   { icon: 'bx-medal',       color: '#ff3b30', label: 'Profesional' },
    leyenda:       { icon: 'bx-crown',       color: '#ffd700', label: 'Leyenda' },
};

const GENDER_CONFIG = {
    mixto:     { icon: 'bx-group',       color: '#06d6a0', label: 'Mixto' },
    femenino:  { icon: 'bx-female-sign', color: '#ff2d78', label: 'Femenino' },
    masculino: { icon: 'bx-male-sign',   color: '#ff4d2a', label: 'Masculino' },
};

const getTeamVisuals = (team) => {
    const level = team.teamLevel?.toLowerCase() || '';
    const gender = team.teamGender?.toLowerCase() || '';
    for (const [key, cfg] of Object.entries(LEVEL_CONFIG)) {
        if (level.includes(key)) return cfg;
    }
    for (const [key, cfg] of Object.entries(GENDER_CONFIG)) {
        if (gender === key) return cfg;
    }
    return LEVEL_CONFIG.casual;
};

/* helper: team created within last 7 days */
const NEW_TEAM_DAYS = 7;
const isNewTeam = (team) => {
    if (!team.createdAt) return false;
    const diff = Date.now() - new Date(team.createdAt).getTime();
    return diff < NEW_TEAM_DAYS * 86_400_000;
};

const formatRosterGameId = (game, player = {}) => {
    const gameId = String(player?.gameId || '').trim();
    if (!gameId) return '';
    if (!isSupportedRiotGame(game)) return gameId;
    const nick = String(player?.nickname || '').trim();
    const cleanedTag = gameId.replace(/^#/, '');
    if (!nick || !cleanedTag) return gameId;
    return `${nick}#${cleanedTag}`;
};

/* ═══════════════════════════════════════
   FILTER TABS
   ═══════════════════════════════════════ */
const TABS = [
    { key: 'all',            label: 'Todos',         icon: 'bx-grid-alt' },
    { key: 'myteams',        label: 'Mis Equipos',   icon: 'bx-star' },
    { key: 'nuevo',          label: 'Nuevos',        icon: 'bx-bolt-circle', dot: '#39ff14' },
    { key: 'divider-1' },
    { key: 'mixto',          label: 'Mixto',         icon: 'bx-group',        dot: '#06d6a0' },
    { key: 'femenino',       label: 'Femenino',      icon: 'bx-female-sign',  dot: '#ff2d78' },
    { key: 'masculino',      label: 'Masculino',     icon: 'bx-male-sign',    dot: '#ff4d2a' },
    { key: 'divider-2' },
    { key: 'casual',         label: 'Casual',        icon: 'bx-game',         dot: '#8EDB15' },
    { key: 'amateur',        label: 'Amateur',       icon: 'bx-joystick',     dot: '#00d4ff' },
    { key: 'universitario',  label: 'Universitario', icon: 'bx-book-reader',  dot: '#6366f1' },
    { key: 'semi-pro',       label: 'Semi-Pro',      icon: 'bx-target-lock',  dot: '#bf5af2' },
    { key: 'profesional',    label: 'Pro',           icon: 'bx-medal',        dot: '#ff3b30' },
    { key: 'leyenda',        label: 'Leyenda',       icon: 'bx-crown',        dot: '#ffd700' },
];

/* ═══════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════ */
const Team = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useNotification();
    const { user: authUser } = useAuth();

    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [hubSection, setHubSection] = useState('teams');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [viewModalInitialTab, setViewModalInitialTab] = useState('info');
    const [viewModalSeed, setViewModalSeed] = useState(0);

    // Join flow state
    const [joinInviteCode, setJoinInviteCode] = useState('');
    const [joinFormOpen, setJoinFormOpen] = useState(false);
    const [joinSlotType, setJoinSlotType] = useState('starters');
    const [joinSlotIndex, setJoinSlotIndex] = useState(0);
    const [joinPlayer, setJoinPlayer] = useState({ nickname: '', gameId: '', region: '', email: '', role: '' });
    const [joinRoleLockedByInvite, setJoinRoleLockedByInvite] = useState(false);
    const [joinSubmitting, setJoinSubmitting] = useState(false);
    const [joinPhoto, setJoinPhoto] = useState(null);
    const [joinPhotoPreview, setJoinPhotoPreview] = useState('');
    const [joinSuccess, setJoinSuccess] = useState(false);

    const storedUser = useMemo(() => {
        const userString = localStorage.getItem('esportefyUser') || sessionStorage.getItem('esportefyUser');
        if (!userString) return null;
        try {
            return JSON.parse(userString);
        } catch (_) {
            return null;
        }
    }, []);
    const currentUser = authUser || storedUser;
    const mlbbConnection = currentUser?.connections?.mlbb || {};
    const currentUserMlbbStatus = normalizeMlbbVerificationStatus(
        mlbbConnection?.verificationStatus,
        mlbbConnection?.verified
    );
    const currentUserMlbbVerified = isMlbbVerifiedStatus(currentUserMlbbStatus, mlbbConnection?.verified);
    const currentUserMlbbIgn = String(
        currentUser?.gameProfiles?.mlbb?.ign
        || mlbbConnection?.ign
        || ''
    ).trim();
    const currentUserMlbbPlayerId = String(mlbbConnection?.playerId || '').trim();
    const currentUserMlbbZoneId = String(mlbbConnection?.zoneId || '').trim();
    const currentUserUniversity = currentUser?.university || {};
    const currentUserUniversityVerified = Boolean(currentUserUniversity?.verified && currentUserUniversity?.universityId);
    /* ── helpers ── */
    const isUserMember = (team) => {
        if (!currentUser?._id || !team) return false;
        const uid = String(currentUser._id);
        const starters = Array.isArray(team.roster?.starters) ? team.roster.starters : [];
        const subs = Array.isArray(team.roster?.subs) ? team.roster.subs : [];
        const captainId = String(team.captain?._id || team.captain || '');
        return captainId === uid
            || starters.some(p => String(p?.user) === uid)
            || subs.some(p => String(p?.user) === uid)
            || (team.roster?.coach && String(team.roster.coach.user) === uid);
    };

    const getPendingRequests = (team) => {
        if (!team) return [];
        return (team.joinRequests || []).filter(r => r.status === 'pending');
    };
    const isMlbbTeam = (team) => isSupportedMlbbGame(team?.game);
    const isUniversityTeam = (team) => team?.university?.isUniversityTeam === true || String(team?.teamLevel || '').trim().toLowerCase().includes('universitario');
    const openManageTeamModal = (team, initialTab = 'info') => {
        if (!team?._id) return;
        setSelectedTeam(team);
        setViewModalInitialTab(initialTab === 'roster' ? 'roster' : 'info');
        setViewModalSeed((prev) => prev + 1);
        setIsPreviewOpen(false);
        setIsViewModalOpen(true);
    };

    const REGION_OPTIONS_JOIN = ["LAN", "LAS", "NA", "BR", "EUW", "EUNE", "TR", "RU", "OCE", "KR", "JP", "LATAM", "GLOBAL"];

    const resolveJoinSlotRole = (team, slotType, slotIndex, explicitRole = '') => {
        const explicit = String(explicitRole || '').trim();
        if (explicit) return explicit;

        const normalizedType = String(slotType || '').trim();
        if (normalizedType === 'coach') {
            return String(team?.roster?.coach?.role || 'Coach').trim();
        }

        if (!['starters', 'subs'].includes(normalizedType)) return '';
        const index = Number(slotIndex);
        if (!Number.isFinite(index) || index < 0) return '';

        const rosterRole = String(team?.roster?.[normalizedType]?.[index]?.role || '').trim();
        if (rosterRole) return rosterRole;

        const templates = getSupportedGameRoles(team?.game);
        if (templates[index]) return templates[index];

        return normalizedType === 'subs' ? `Suplente ${index + 1}` : `Titular ${index + 1}`;
    };

    const handleJoinPhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) return addToast('La imagen no puede superar 5MB', 'error');
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return addToast('Solo JPG, PNG o WEBP', 'error');
        setJoinPhoto(file);
        setJoinPhotoPreview(URL.createObjectURL(file));
    };

    const handleJoinTeam = async (e, team) => {
        e.preventDefault();
        const isMlbb = isMlbbTeam(team);
        const resolvedNickname = (joinPlayer.nickname || currentUserMlbbIgn || '').trim();
        const resolvedRole = resolveJoinSlotRole(team, joinSlotType, joinSlotIndex, joinPlayer.role);
        if (!resolvedNickname) return addToast('Nickname requerido', 'error');
        if (!joinInviteCode.trim()) return addToast('Código de invitación requerido', 'error');
        if (isMlbb && !currentUserMlbbVerified) {
            return addToast('Debes verificar tu cuenta MLBB en Conexiones antes de solicitar ingreso.', 'error');
        }
        try {
            setJoinSubmitting(true);
            const token = getAuthToken();
            if (!token) return addToast('Debes iniciar sesión', 'error');

            // Convert photo to base64 if provided
            let photoData = '';
            if (joinPhoto) {
                photoData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(joinPhoto);
                });
            }

            await axios.post(
                `${API_URL}/api/teams/${team._id}/requests`,
                {
                    inviteCode: joinInviteCode.trim(),
                    slotType: joinSlotType,
                    slotIndex: joinSlotIndex,
                    player: {
                        ...joinPlayer,
                        nickname: resolvedNickname,
                        gameId: isMlbb ? currentUserMlbbPlayerId : joinPlayer.gameId,
                        region: isMlbb ? currentUserMlbbZoneId : joinPlayer.region,
                        role: resolvedRole,
                        photo: photoData
                    }
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setJoinSuccess(true);
        } catch (err) {
            addToast(err.response?.data?.message || 'Error al enviar solicitud', 'error');
        } finally {
            setJoinSubmitting(false);
        }
    };

    const resetJoinForm = () => {
        setJoinFormOpen(false);
        setJoinInviteCode('');
        setJoinPlayer({ nickname: '', gameId: '', region: '', email: '', role: '' });
        setJoinSlotType('starters');
        setJoinSlotIndex(0);
        setJoinRoleLockedByInvite(false);
        setJoinPhoto(null);
        setJoinPhotoPreview('');
        setJoinSuccess(false);
    };

    useEffect(() => {
        if (!joinFormOpen || !selectedTeam || !isMlbbTeam(selectedTeam)) return;
        setJoinPlayer((prev) => {
            const next = {
                ...prev,
                nickname: prev.nickname || currentUserMlbbIgn,
                gameId: currentUserMlbbPlayerId,
                region: currentUserMlbbZoneId
            };
            if (
                prev.nickname === next.nickname &&
                prev.gameId === next.gameId &&
                prev.region === next.region
            ) {
                return prev;
            }
            return next;
        });
    }, [
        joinFormOpen,
        selectedTeam,
        currentUserMlbbIgn,
        currentUserMlbbPlayerId,
        currentUserMlbbZoneId
    ]);

    const handleRequestAction = async (teamId, requestId, action) => {
        try {
            const token = getAuthToken();
            if (!token) return addToast('Debes iniciar sesion', 'error');
            const res = await axios.patch(
                `${API_URL}/api/teams/${teamId}/requests/${requestId}`,
                { action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data?.team) {
                setSelectedTeam(res.data.team);
                setTeams(prev => prev.map(t => String(t._id) === String(res.data.team._id) ? res.data.team : t));
            }
        } catch (err) {
            addToast(err.response?.data?.message || 'Error al gestionar solicitud', 'error');
        }
    };



    /* ── fetch ── */
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_URL}/api/teams`);
                setTeams((res.data || []).filter((team) => isSupportedGameName(team?.game)));
                setError(false);
            } catch (_) {
                setError(true);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        const navigationTeamId = location.state?.teamId;
        const shouldOpenManage = location.state?.openManage === true;
        const shouldOpenPreview = location.state?.openPreview === true;
        const shouldOpenJoinForm = location.state?.openJoinForm === true;
        const inviteCodeFromState = String(location.state?.inviteCode || '').trim().toUpperCase();
        const slotTypeFromState = ['starters', 'subs', 'coach'].includes(String(location.state?.slotType || '').trim())
            ? String(location.state.slotType).trim()
            : '';
        const slotIndexFromState = Number(location.state?.slotIndex);
        const slotRoleFromState = String(location.state?.slotRole || '').trim();
        if (!navigationTeamId || teams.length === 0) return;

        const targetTeam = teams.find((team) => String(team._id) === String(navigationTeamId));
        if (!targetTeam) return;

        setSelectedTeam(targetTeam);
        if (shouldOpenManage) {
            openManageTeamModal(targetTeam, 'info');
        } else if (shouldOpenPreview) {
            setIsPreviewOpen(true);
            setIsViewModalOpen(false);
        }
        if (inviteCodeFromState) {
            setJoinInviteCode(inviteCodeFromState);
        }
        if (shouldOpenJoinForm) {
            setIsPreviewOpen(true);
            setJoinFormOpen(Boolean(inviteCodeFromState));
            setJoinSuccess(false);
            if (slotTypeFromState) {
                setJoinSlotType(slotTypeFromState);
            }
            if (Number.isFinite(slotIndexFromState) && slotIndexFromState >= 0) {
                setJoinSlotIndex(slotIndexFromState);
            } else if (slotTypeFromState === 'coach') {
                setJoinSlotIndex(0);
            }
            if (slotTypeFromState || slotRoleFromState) {
                const resolvedRole = resolveJoinSlotRole(
                    targetTeam,
                    slotTypeFromState || 'starters',
                    Number.isFinite(slotIndexFromState) ? slotIndexFromState : 0,
                    slotRoleFromState
                );
                if (resolvedRole) {
                    setJoinPlayer((prev) => ({ ...prev, role: resolvedRole }));
                }
                setJoinRoleLockedByInvite(Boolean(slotTypeFromState || slotRoleFromState));
            } else {
                setJoinRoleLockedByInvite(false);
            }
        }

        navigate(location.pathname, { replace: true, state: {} });
    }, [teams, location.state, location.pathname, navigate]);

    /* ── filter ── */
    const filteredTeams = useMemo(() => {
        return teams.filter(team => {
            const level = team.teamLevel?.toLowerCase() || '';
            const gender = team.teamGender?.toLowerCase() || '';
            const q = search.toLowerCase();
            const publicTeamCode = getPublicTeamCode(team).toLowerCase();

            let matchesTab = true;
            if (activeTab === 'myteams') {
                matchesTab = isUserMember(team);
            } else if (activeTab === 'nuevo') {
                matchesTab = isNewTeam(team);
            } else if (activeTab !== 'all') {
                matchesTab = level.includes(activeTab) || gender === activeTab;
            }

            const matchesSearch = !q
                || team.name?.toLowerCase().includes(q)
                || team.game?.toLowerCase().includes(q)
                || team.category?.toLowerCase().includes(q)
                || team.teamCountry?.toLowerCase().includes(q)
                || publicTeamCode.includes(q.replace(/^#/, ''))
                || matchesTeamPublicId(team, q);

            return matchesTab && matchesSearch;
        });
    }, [teams, activeTab, search, currentUser]);

    /* ── stats ── */
    const totalMembers = teams.reduce((sum, t) => {
        const s = Array.isArray(t.roster?.starters) ? t.roster.starters.filter(p => p?.nickname).length : 0;
        const sb = Array.isArray(t.roster?.subs) ? t.roster.subs.filter(p => p?.nickname).length : 0;
        return sum + s + sb + (t.roster?.coach?.nickname ? 1 : 0);
    }, 0);

    const myTeamsCount = teams.filter(t => isUserMember(t)).length;

    /* ═══════════════════════════════
       RENDER
       ═══════════════════════════════ */
    return (
        <div className="th__page">
            <PageHud page="EQUIPOS" />
            <div className="th__layout">
            {/* ── HEADER ── */}
            <header className="th__header">
                <div className="th__header-left">
                    <h1 className="th__title">
                        <i className='bx bx-shield-quarter'></i>
                        Hub de Equipos
                    </h1>
                    <p className="th__subtitle">Explora, crea y unete a escuadras competitivas</p>
                </div>
                <div className="th__header-right">
                    <div className="th__stats-row">
                        <div className="th__stat">
                            <strong>{teams.length}</strong>
                            <span>Equipos</span>
                        </div>
                        <div className="th__stat-sep" />
                        <div className="th__stat">
                            <strong>{totalMembers}</strong>
                            <span>Jugadores</span>
                        </div>
                        {myTeamsCount > 0 && (
                            <>
                                <div className="th__stat-sep" />
                                <div className="th__stat th__stat--accent">
                                    <strong>{myTeamsCount}</strong>
                                    <span>Mis Equipos</span>
                                </div>
                            </>
                        )}
                    </div>
                    <button className="th__btn-create" onClick={() => navigate('/create-team')}>
                        <i className='bx bx-plus'></i> Crear Equipo
                    </button>
                    {currentUser && (
                        <button
                            className="th__btn-create th__btn-create--demo"
                            onClick={async () => {
                                try {
                                    const token = getAuthToken();
                                    const res = await axios.post(`${API_URL}/api/teams/seed-demo`, {}, {
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    addToast(res.data.message || 'Equipos demo creados', 'success');
                                    const teamsRes = await axios.get(`${API_URL}/api/teams`);
                                    setTeams((teamsRes.data || []).filter((team) => isSupportedGameName(team?.game)));
                                } catch (err) {
                                    addToast(err.response?.data?.message || 'Error al crear equipos demo', 'error');
                                }
                            }}
                        >
                            <i className='bx bx-bot'></i> Demo Teams
                        </button>
                    )}
                    {currentUser && (
                        <button
                            className="th__btn-create th__btn-create--third"
                            onClick={async () => {
                                try {
                                    const token = getAuthToken();
                                    const res = await axios.post(`${API_URL}/api/teams/seed-third-party`, {}, {
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    addToast(res.data.message || 'Equipos de terceros creados', 'success');
                                    const teamsRes = await axios.get(`${API_URL}/api/teams`);
                                    setTeams((teamsRes.data || []).filter((team) => isSupportedGameName(team?.game)));
                                } catch (err) {
                                    addToast(err.response?.data?.message || 'Error al crear equipos de terceros', 'error');
                                }
                            }}
                        >
                            <i className='bx bx-group'></i> Equipos Ajenos
                        </button>
                    )}
                </div>
            </header>

            {/* ── HUB SECTION NAV ── */}
            <nav className="th__hub-nav">
                {[
                    { key: 'teams',     label: 'Equipos',          icon: 'bx-shield-quarter' },
                    { key: 'scrims',    label: 'Scrims',           icon: 'bx-crossed-swords' },
                    { key: 'lfteam',    label: 'Buscar Equipo',    icon: 'bx-search-alt-2' },
                    { key: 'lfplayers', label: 'Buscar Jugadores', icon: 'bx-user-search' },
                ].map((sec) => (
                    <button
                        key={sec.key}
                        className={`th__hub-nav-btn ${hubSection === sec.key ? 'active' : ''}`}
                        onClick={() => setHubSection(sec.key)}
                    >
                        <i className={`bx ${sec.icon}`}></i>
                        <span>{sec.label}</span>
                    </button>
                ))}
            </nav>

            {/* ══════════════════════════════════════
               SECTION: EQUIPOS (default hub)
               ══════════════════════════════════════ */}
            {hubSection === 'teams' && <>
            {/* ── TOOLBAR (search + filters) ── */}
            <div className="th__toolbar">
                <div className="th__search">
                    <i className='bx bx-search'></i>
                    <input
                        type="text"
                        placeholder="Buscar por TEAM-ID, nombre, juego, pais..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="th__search-clear" onClick={() => setSearch('')}>
                            <i className='bx bx-x'></i>
                        </button>
                    )}
                </div>
                <div className="th__filters">
                    {TABS.map((tab) => {
                        if (tab.key.startsWith('divider')) {
                            return <div key={tab.key} className="th__filter-sep" />;
                        }
                        const count = tab.key === 'all' ? teams.length
                            : tab.key === 'myteams' ? myTeamsCount
                            : tab.key === 'nuevo' ? teams.filter(t => isNewTeam(t)).length
                            : teams.filter(t => {
                                const lv = t.teamLevel?.toLowerCase() || '';
                                const gn = t.teamGender?.toLowerCase() || '';
                                return lv.includes(tab.key) || gn === tab.key;
                            }).length;
                        return (
                            <button
                                key={tab.key}
                                className={`th__filter-btn ${activeTab === tab.key ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                                style={tab.dot && activeTab === tab.key ? { '--filter-accent': tab.dot } : undefined}
                            >
                                {tab.dot && <span className="th__filter-dot" style={{ background: tab.dot }} />}
                                {!tab.dot && <i className={`bx ${tab.icon}`}></i>}
                                <span>{tab.label}</span>
                                {count > 0 && <span className="th__filter-count">{count}</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── CONTENT ── */}
            <main className="th__content">
                {loading ? (
                    <div className="th__empty">
                        <div className="th__loader" />
                        <p>Sincronizando equipos...</p>
                    </div>
                ) : error ? (
                    <div className="th__empty">
                        <div className="th__empty-icon th__empty-icon--error">
                            <i className='bx bx-error-circle'></i>
                        </div>
                        <h3>Error de Conexion</h3>
                        <p>No pudimos conectar con el servidor.</p>
                    </div>
                ) : filteredTeams.length > 0 ? (
                    <div className="th__grid">
                        {filteredTeams.map(team => {
                            const vis = getTeamVisuals(team);
                            const starters = Array.isArray(team.roster?.starters) ? team.roster.starters : [];
                            const startersFilled = starters.filter(p => p?.nickname).length;
                            const startersTotal = team.maxMembers || starters.length || 0;
                            const isComplete = startersTotal > 0 && startersFilled >= startersTotal;
                            const isMember = isUserMember(team);
                            const isCaptain = currentUser?._id && String(team.captain?._id || team.captain) === String(currentUser._id);
                            const pendingCount = getPendingRequests(team).length;

                            return (
                                <div
                                    key={team._id}
                                    className={`th__card ${isMember ? 'th__card--mine' : ''}`}
                                    style={{ '--card-accent': vis.color }}
                                    onClick={() => { setSelectedTeam(team); setIsPreviewOpen(true); }}
                                >
                                    {/* Gradient glow background */}
                                    <div className="th__card-glow" />
                                    <div className="th__card-accent" />

                                    <div className="th__card-top">
                                        <div className="th__card-logo">
                                            {team.logo
                                                ? (
                                                    <img
                                                        src={resolveMediaUrl(team.logo)}
                                                        alt=""
                                                        onError={(e) => applyImageFallback(e, getTeamFallback(team.name))}
                                                    />
                                                )
                                                : <span>{team.name.substring(0, 2).toUpperCase()}</span>
                                            }
                                        </div>
                                        <div className="th__card-identity">
                                            {formatTeamPublicId(team) && (
                                                <span className="tournament-id-tag">{formatTeamPublicId(team)}</span>
                                            )}
                                            <h3 className="th__card-name">{team.name}</h3>
                                            <div className="th__card-meta">
                                                <span className="th__card-game">{team.game}</span>
                                                {team.teamCountry && (
                                                    <span className="th__card-country">
                                                        <i className='bx bx-globe'></i> {team.teamCountry}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="th__card-badge" style={{ color: vis.color }}>
                                            <i className={`bx ${vis.icon}`}></i>
                                        </div>
                                    </div>

                                    {/* Slogan */}
                                    {team.slogan && (
                                        <p className="th__card-slogan">"{team.slogan}"</p>
                                    )}

                                    <div className="th__card-tags">
                                        <span className="th__tag" style={{ '--tag-color': vis.color }}>
                                            <i className={`bx ${vis.icon}`}></i> {vis.label}
                                        </span>
                                        {isNewTeam(team) && (
                                            <span className="th__tag th__tag--new">
                                                <i className='bx bx-bolt-circle'></i> Nuevo
                                            </span>
                                        )}
                                        {team.category && (
                                            <span className="th__tag th__tag--category">{team.category}</span>
                                        )}
                                        {team.university?.isUniversityTeam && (
                                            <span className="th__tag th__tag--category">
                                                <i className='bx bx-book-reader'></i> {team.university.universityTag || team.university.universityName || 'Universitario'}
                                            </span>
                                        )}
                                        {team.teamGender && team.teamGender !== 'Mixto' && (
                                            <span className="th__tag" style={{ '--tag-color': GENDER_CONFIG[team.teamGender.toLowerCase()]?.color || '#8EDB15' }}>
                                                {team.teamGender}
                                            </span>
                                        )}
                                        {team.teamLanguage && (
                                            <span className="th__tag th__tag--lang">
                                                <i className='bx bx-globe-alt'></i> {team.teamLanguage}
                                            </span>
                                        )}
                                        {isMember && (
                                            <span className="th__tag th__tag--member">
                                                <i className='bx bx-check-circle'></i> Miembro
                                            </span>
                                        )}
                                        {isCaptain && pendingCount > 0 && (
                                            <span className="th__tag th__tag--pending">
                                                <i className='bx bx-time-five'></i> {pendingCount} solicitud{pendingCount > 1 ? 'es' : ''}
                                            </span>
                                        )}
                                    </div>

                                    {/* Roster avatars */}
                                    <div className="th__card-roster">
                                        <div className="th__roster-stack">
                                            {starters.slice(0, 5).map((p, idx) => p && (
                                                <div key={idx} className="th__roster-avatar" style={{ zIndex: 10 - idx }}>
                                                    <img
                                                        src={resolveMediaUrl(p.photo) || getBotAvatarFallback(p.nickname)}
                                                        alt=""
                                                        onError={(e) => applyImageFallback(e, getBotAvatarFallback(p.nickname))}
                                                    />
                                                </div>
                                            ))}
                                            {startersFilled > 5 && (
                                                <div className="th__roster-avatar th__roster-avatar--more">
                                                    +{startersFilled - 5}
                                                </div>
                                            )}
                                            {startersFilled === 0 && (
                                                <span className="th__roster-empty">Reclutando jugadores...</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Roster progress bar */}
                                    <div className="th__card-progress">
                                        <div className="th__progress-bar">
                                            <div
                                                className="th__progress-fill"
                                                style={{ width: `${startersTotal > 0 ? (startersFilled / startersTotal) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <span className={`th__roster-status ${isComplete ? 'th__roster-status--full' : ''}`}>
                                            {startersFilled}/{startersTotal || '?'}
                                        </span>
                                    </div>

                                    <div className="th__card-footer">
                                        {team.roster?.coach?.nickname && (
                                            <span className="th__card-coach">
                                                <i className='bx bx-user-voice'></i> {team.roster.coach.nickname}
                                            </span>
                                        )}
                                        {(isCaptain || currentUser?.isAdmin) && (
                                            <div className="th__card-actions">
                                                <button
                                                    className="th__card-btn th__card-btn--invite"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openManageTeamModal(team, 'roster');
                                                    }}
                                                >
                                                    Invitar
                                                    <i className='bx bx-user-plus'></i>
                                                </button>
                                                <button
                                                    className="th__card-btn th__card-btn--manage"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openManageTeamModal(team, 'info');
                                                    }}
                                                >
                                                    Gestionar
                                                    <i className='bx bx-cog'></i>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="th__empty">
                        <div className="th__empty-icon">
                            <i className='bx bx-ghost'></i>
                        </div>
                        <h3>{activeTab === 'myteams' ? 'No perteneces a ningun equipo' : 'Sin equipos encontrados'}</h3>
                        <p>
                            {activeTab === 'myteams'
                                ? 'Unete a un equipo existente o crea el tuyo propio.'
                                : search
                                    ? `No hay resultados para "${search}".`
                                    : 'Parece que este sector esta desierto. Quieres fundar el primer equipo?'
                            }
                        </p>
                        <button className="th__btn-create th__btn-create--sm" onClick={() => navigate('/create-team')}>
                            <i className='bx bx-plus'></i> Crear Equipo
                        </button>
                    </div>
                )}
            </main>
            </>}

            {/* ══════════════════════════════════════
               SECTION: SCRIMS (VS challenges)
               ══════════════════════════════════════ */}
            {hubSection === 'scrims' && (
                <section className="th__section th__section--scrims">
                    <div className="th__section-header">
                        <div className="th__section-icon th__section-icon--scrims">
                            <i className='bx bx-crossed-swords'></i>
                        </div>
                        <div>
                            <h2 className="th__section-title">Scrims</h2>
                            <p className="th__section-desc">Desafía a otros equipos a partidas de práctica competitiva</p>
                        </div>
                    </div>

                    <div className="th__scrim-actions">
                        <button className="th__scrim-create-btn" disabled>
                            <i className='bx bx-plus-circle'></i>
                            <span>Crear Desafío</span>
                            <small>Reta a cualquier equipo registrado</small>
                        </button>
                        <button className="th__scrim-create-btn th__scrim-create-btn--find" disabled>
                            <i className='bx bx-radar'></i>
                            <span>Buscar Scrim</span>
                            <small>Encuentra desafíos abiertos</small>
                        </button>
                    </div>

                    <div className="th__scrim-features">
                        <div className="th__scrim-feature">
                            <div className="th__scrim-feature-icon"><i className='bx bx-target-lock'></i></div>
                            <h4>Matchmaking Directo</h4>
                            <p>Elige un equipo rival, define el juego, mapa y reglas. Envía el reto y espera confirmación.</p>
                        </div>
                        <div className="th__scrim-feature">
                            <div className="th__scrim-feature-icon"><i className='bx bx-calendar-event'></i></div>
                            <h4>Agenda tu Scrim</h4>
                            <p>Programa fecha y hora para tu práctica. Ambos equipos reciben notificación con recordatorio.</p>
                        </div>
                        <div className="th__scrim-feature">
                            <div className="th__scrim-feature-icon"><i className='bx bx-bar-chart-alt-2'></i></div>
                            <h4>Historial y Stats</h4>
                            <p>Registra resultados, lleva un récord de victorias/derrotas y analiza el rendimiento de tu equipo.</p>
                        </div>
                        <div className="th__scrim-feature">
                            <div className="th__scrim-feature-icon"><i className='bx bx-trophy'></i></div>
                            <h4>Ranking de Scrims</h4>
                            <p>Los equipos más activos y con mejor récord aparecerán en el ranking competitivo.</p>
                        </div>
                    </div>

                    <div className="th__section-coming">
                        <div className="th__coming-badge">
                            <i className='bx bx-time-five'></i>
                            <span>Próximamente</span>
                        </div>
                        <p>El sistema de scrims está en desarrollo. Pronto podrás retar a cualquier equipo de la plataforma.</p>
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════
               SECTION: BUSCAR EQUIPO (LF Team)
               ══════════════════════════════════════ */}
            {hubSection === 'lfteam' && (
                <section className="th__section th__section--lfteam">
                    <div className="th__section-header">
                        <div className="th__section-icon th__section-icon--lfteam">
                            <i className='bx bx-search-alt-2'></i>
                        </div>
                        <div>
                            <h2 className="th__section-title">Buscar Equipo</h2>
                            <p className="th__section-desc">Encuentra el equipo perfecto para ti y únete a la competencia</p>
                        </div>
                    </div>

                    <div className="th__lf-profile-card">
                        <div className="th__lf-profile-header">
                            <i className='bx bx-user-circle'></i>
                            <h4>Tu Perfil de Jugador</h4>
                        </div>
                        <p className="th__lf-profile-desc">Completa tu perfil para que los equipos te encuentren más fácil. Los capitanes podrán ver tu información y considerarte para su roster.</p>
                        <div className="th__lf-profile-fields">
                            <div className="th__lf-field">
                                <label><i className='bx bx-game'></i> Juego principal</label>
                                <input type="text" placeholder="Ej: Valorant, League of Legends..." disabled />
                            </div>
                            <div className="th__lf-field">
                                <label><i className='bx bx-target-lock'></i> Rol preferido</label>
                                <input type="text" placeholder="Ej: Duelista, Support, Mid..." disabled />
                            </div>
                            <div className="th__lf-field">
                                <label><i className='bx bx-map'></i> Región</label>
                                <input type="text" placeholder="Ej: LAN, LAS, NA..." disabled />
                            </div>
                            <div className="th__lf-field">
                                <label><i className='bx bx-time'></i> Disponibilidad</label>
                                <input type="text" placeholder="Ej: Tardes, Noches, Fines de semana..." disabled />
                            </div>
                        </div>
                    </div>

                    <div className="th__lf-benefits">
                        <div className="th__lf-benefit">
                            <div className="th__lf-benefit-icon"><i className='bx bx-broadcast'></i></div>
                            <h4>Visibilidad</h4>
                            <p>Tu perfil será visible para todos los capitanes de equipo que buscan nuevos miembros.</p>
                        </div>
                        <div className="th__lf-benefit">
                            <div className="th__lf-benefit-icon"><i className='bx bx-filter-alt'></i></div>
                            <h4>Match por Juego</h4>
                            <p>Te conectamos con equipos que juegan el mismo juego y buscan tu rol específico.</p>
                        </div>
                        <div className="th__lf-benefit">
                            <div className="th__lf-benefit-icon"><i className='bx bx-bell'></i></div>
                            <h4>Notificaciones</h4>
                            <p>Recibe alertas cuando un equipo compatible publique una vacante que encaje contigo.</p>
                        </div>
                    </div>

                    <div className="th__section-coming">
                        <div className="th__coming-badge">
                            <i className='bx bx-time-five'></i>
                            <span>Próximamente</span>
                        </div>
                        <p>El sistema de búsqueda de equipo está en desarrollo. Pronto podrás publicar tu perfil y recibir invitaciones.</p>
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════
               SECTION: BUSCAR JUGADORES (LF Players)
               ══════════════════════════════════════ */}
            {hubSection === 'lfplayers' && (
                <section className="th__section th__section--lfplayers">
                    <div className="th__section-header">
                        <div className="th__section-icon th__section-icon--lfplayers">
                            <i className='bx bx-user-search'></i>
                        </div>
                        <div>
                            <h2 className="th__section-title">Buscar Jugadores</h2>
                            <p className="th__section-desc">Recluta talento para completar el roster de tu equipo</p>
                        </div>
                    </div>

                    <div className="th__lfp-post-card">
                        <div className="th__lfp-post-header">
                            <i className='bx bx-megaphone'></i>
                            <h4>Publicar Vacante</h4>
                        </div>
                        <p className="th__lfp-post-desc">Publica qué posición necesitas y los jugadores interesados podrán aplicar directamente a tu equipo.</p>
                        <div className="th__lfp-post-fields">
                            <div className="th__lf-field">
                                <label><i className='bx bx-shield-quarter'></i> Equipo</label>
                                <select disabled>
                                    <option>Selecciona tu equipo...</option>
                                    {teams.filter(t => {
                                        const captainId = t.captain?._id || t.captain;
                                        return currentUser?._id && String(captainId) === String(currentUser._id);
                                    }).map(t => (
                                        <option key={t._id} value={t._id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="th__lf-field">
                                <label><i className='bx bx-target-lock'></i> Rol que buscas</label>
                                <input type="text" placeholder="Ej: Duelista, Jungla, Support..." disabled />
                            </div>
                            <div className="th__lf-field">
                                <label><i className='bx bx-trophy'></i> Nivel mínimo</label>
                                <select disabled>
                                    <option>Cualquier nivel</option>
                                    <option>Casual</option>
                                    <option>Amateur</option>
                                    <option>Semi-Pro</option>
                                    <option>Profesional</option>
                                </select>
                            </div>
                            <div className="th__lf-field th__lf-field--full">
                                <label><i className='bx bx-message-dots'></i> Descripción</label>
                                <textarea placeholder="Describe qué tipo de jugador buscas, horarios, requisitos..." disabled rows={3}></textarea>
                            </div>
                        </div>
                        <button className="th__lfp-publish-btn" disabled>
                            <i className='bx bx-send'></i> Publicar Vacante
                        </button>
                    </div>

                    <div className="th__lf-benefits">
                        <div className="th__lf-benefit">
                            <div className="th__lf-benefit-icon"><i className='bx bx-user-check'></i></div>
                            <h4>Perfiles Verificados</h4>
                            <p>Los jugadores que aplican tienen su cuenta verificada y datos de juego confirmados.</p>
                        </div>
                        <div className="th__lf-benefit">
                            <div className="th__lf-benefit-icon"><i className='bx bx-conversation'></i></div>
                            <h4>Comunicación Directa</h4>
                            <p>Revisa aplicaciones, chatea con candidatos y decide quién entra a tu roster.</p>
                        </div>
                        <div className="th__lf-benefit">
                            <div className="th__lf-benefit-icon"><i className='bx bx-star'></i></div>
                            <h4>Reputación</h4>
                            <p>Los jugadores acumulan reputación basada en su compromiso y desempeño en equipos anteriores.</p>
                        </div>
                    </div>

                    <div className="th__section-coming">
                        <div className="th__coming-badge">
                            <i className='bx bx-time-five'></i>
                            <span>Próximamente</span>
                        </div>
                        <p>El sistema de reclutamiento está en desarrollo. Pronto podrás publicar vacantes y recibir aplicaciones.</p>
                    </div>
                </section>
            )}

            {/* ── MODALS ── */}
            {selectedTeam && (
                <ViewTeamModal
                    key={`${selectedTeam?._id || 'team'}-${viewModalSeed}`}
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    team={selectedTeam}
                    currentUser={currentUser}
                    initialTab={viewModalInitialTab}
                    onTeamUpdated={(updated) => {
                        setSelectedTeam(updated);
                        setTeams(prev => prev.map(t => String(t._id) === String(updated._id) ? updated : t));
                    }}
                />
            )}

            {selectedTeam && isPreviewOpen && (() => {
                const previewVis = getTeamVisuals(selectedTeam);
                const previewStarters = Array.isArray(selectedTeam.roster?.starters) ? selectedTeam.roster.starters : [];
                const previewSubs = Array.isArray(selectedTeam.roster?.subs) ? selectedTeam.roster.subs : [];
                const previewCoach = selectedTeam.roster?.coach;
                const previewFilled = previewStarters.filter(p => p?.nickname).length;
                const previewTotal = selectedTeam.maxMembers || previewStarters.length || 0;
                const previewIsCaptain = currentUser?._id && String(selectedTeam.captain?._id || selectedTeam.captain) === String(currentUser._id);
                const previewIsAdmin = currentUser?.isAdmin;
                const previewCanManage = previewIsCaptain || previewIsAdmin;
                return (
                <div className="modal-overlay" onClick={() => { setIsPreviewOpen(false); resetJoinForm(); }}>
                    <div className="th__modal" onClick={(e) => e.stopPropagation()} style={{ '--modal-accent': previewVis.color }}>
                        {/* Themed banner header */}
                        <div className="th__modal-banner">
                            <div className="th__modal-banner-bg" />
                            <button className="th__modal-close" onClick={() => { setIsPreviewOpen(false); resetJoinForm(); }}>
                                <i className='bx bx-x'></i>
                            </button>
                            <div className="th__modal-hero">
                                <div className="th__modal-logo">
                                    {selectedTeam.logo
                                        ? (
                                            <img
                                                src={resolveMediaUrl(selectedTeam.logo)}
                                                alt=""
                                                onError={(e) => applyImageFallback(e, getTeamFallback(selectedTeam.name))}
                                            />
                                        )
                                        : <span>{selectedTeam.name.substring(0, 2).toUpperCase()}</span>
                                    }
                                </div>
                                <div className="th__modal-hero-info">
                                    {formatTeamPublicId(selectedTeam) && (
                                        <span className="tournament-id-tag">{formatTeamPublicId(selectedTeam)}</span>
                                    )}
                                    <h2>{selectedTeam.name}</h2>
                                    {selectedTeam.slogan && <p className="th__modal-slogan">"{selectedTeam.slogan}"</p>}
                                    <div className="th__modal-hero-tags">
                                        <span className="th__modal-game">{selectedTeam.game?.toUpperCase() || 'SIN JUEGO'}</span>
                                        <span className="th__modal-level" style={{ color: previewVis.color }}>
                                            <i className={`bx ${previewVis.icon}`}></i> {previewVis.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {/* Roster progress */}
                            <div className="th__modal-roster-bar">
                                <div className="th__modal-progress">
                                    <div className="th__modal-progress-fill" style={{ width: `${previewTotal > 0 ? (previewFilled / previewTotal) * 100 : 0}%` }} />
                                </div>
                                <span>{previewFilled}/{previewTotal} jugadores</span>
                            </div>
                        </div>

                        <div className="th__modal-body">
                            {/* Info grid */}
                            <div className="th__modal-info-grid">
                                <div className="th__modal-info-item">
                                    <i className='bx bx-category'></i>
                                    <div>
                                        <label>Categoría</label>
                                        <p>{selectedTeam.category || 'Sin categoría'}</p>
                                    </div>
                                </div>
                                <div className="th__modal-info-item">
                                    <i className='bx bx-map'></i>
                                    <div>
                                        <label>País / Región</label>
                                        <p>{selectedTeam.teamCountry || 'No definido'}</p>
                                    </div>
                                </div>
                                <div className="th__modal-info-item">
                                    <i className='bx bx-trophy'></i>
                                    <div>
                                        <label>Nivel</label>
                                        <p>{selectedTeam.teamLevel || 'No definido'}</p>
                                    </div>
                                </div>
                                {selectedTeam.university?.isUniversityTeam && (
                                    <div className="th__modal-info-item">
                                        <i className='bx bx-book-reader'></i>
                                        <div>
                                            <label>Universidad</label>
                                            <p>{selectedTeam.university.universityName || selectedTeam.university.universityTag || 'Verificada'}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="th__modal-info-item">
                                    <i className='bx bx-globe-alt'></i>
                                    <div>
                                        <label>Idioma</label>
                                        <p>{selectedTeam.teamLanguage || 'No definido'}</p>
                                    </div>
                                </div>
                                {selectedTeam.teamGender && (
                                    <div className="th__modal-info-item">
                                        <i className={`bx ${GENDER_CONFIG[selectedTeam.teamGender.toLowerCase()]?.icon || 'bx-group'}`}></i>
                                        <div>
                                            <label>Género</label>
                                            <p>{selectedTeam.teamGender}</p>
                                        </div>
                                    </div>
                                )}
                                {previewCanManage && selectedTeam.inviteCode && (
                                    <div className="th__modal-info-item th__modal-info-item--code">
                                        <i className='bx bx-key'></i>
                                        <div>
                                            <label>Código de Invitación</label>
                                            <p className="th__invite-code">{selectedTeam.inviteCode}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* ── ROSTER TITULARES ── */}
                            <div className="th__modal-section">
                                <h4><i className='bx bx-group'></i> Titulares ({previewFilled}/{previewTotal})</h4>
                                <div className="th__modal-roster-grid">
                                    {previewStarters.map((p, i) => {
                                        const captainId = selectedTeam?.captain?._id || selectedTeam?.captain;
                                        const isCap = p?.user && String(p.user) === String(captainId);
                                        return (
                                            <div key={`st-${i}`} className={`th__modal-player ${p?.nickname ? '' : 'th__modal-player--empty'}`}>
                                                <div className="th__modal-player-avatar">
                                                    {p?.photo
                                                        ? (
                                                            <img
                                                                src={resolveMediaUrl(p.photo)}
                                                                alt=""
                                                                onError={(e) => applyImageFallback(e, getBotAvatarFallback(p.nickname))}
                                                            />
                                                        )
                                                        : p?.nickname
                                                            ? <img src={getBotAvatarFallback(p.nickname)} alt="" />
                                                            : <i className='bx bx-user-plus'></i>
                                                    }
                                                    {isCap && <span className="th__modal-captain-crown"><i className='bx bxs-crown'></i></span>}
                                                </div>
                                                <div className="th__modal-player-info">
                                                    <span className="th__modal-player-name">{p?.nickname || 'Vacante'}</span>
                                                    {p?.role && <span className="th__modal-player-role">{p.role}</span>}
                                                    {p?.gameId && <span className="th__modal-player-detail"><i className='bx bx-id-card'></i> {formatRosterGameId(selectedTeam?.game, p)}</span>}
                                                    {p?.region && <span className="th__modal-player-detail"><i className='bx bx-map-pin'></i> {p.region}</span>}
                                                    {previewCanManage && p?.email && <span className="th__modal-player-detail"><i className='bx bx-envelope'></i> {p.email}</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {previewStarters.length === 0 && (
                                        <p className="th__modal-empty-text">Sin titulares registrados</p>
                                    )}
                                </div>
                            </div>

                            {/* ── ROSTER SUPLENTES ── */}
                            {(previewSubs.length > 0 || selectedTeam.maxSubstitutes > 0) && (
                                <div className="th__modal-section">
                                    <h4><i className='bx bx-transfer-alt'></i> Suplentes ({previewSubs.filter(p => p?.nickname).length}/{selectedTeam.maxSubstitutes || previewSubs.length})</h4>
                                    <div className="th__modal-roster-grid">
                                        {previewSubs.map((p, i) => (
                                            <div key={`sub-${i}`} className={`th__modal-player ${p?.nickname ? '' : 'th__modal-player--empty'}`}>
                                                <div className="th__modal-player-avatar">
                                                    {p?.photo
                                                        ? (
                                                            <img
                                                                src={resolveMediaUrl(p.photo)}
                                                                alt=""
                                                                onError={(e) => applyImageFallback(e, getBotAvatarFallback(p.nickname))}
                                                            />
                                                        )
                                                        : p?.nickname
                                                            ? <img src={getBotAvatarFallback(p.nickname)} alt="" />
                                                            : <i className='bx bx-user-plus'></i>
                                                    }
                                                </div>
                                                <div className="th__modal-player-info">
                                                    <span className="th__modal-player-name">{p?.nickname || 'Vacante'}</span>
                                                    {p?.role && <span className="th__modal-player-role">{p.role}</span>}
                                                    {p?.gameId && <span className="th__modal-player-detail"><i className='bx bx-id-card'></i> {formatRosterGameId(selectedTeam?.game, p)}</span>}
                                                    {p?.region && <span className="th__modal-player-detail"><i className='bx bx-map-pin'></i> {p.region}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── COACH ── */}
                            <div className="th__modal-section">
                                <h4><i className='bx bx-user-voice'></i> Coach / Staff</h4>
                                {previewCoach && previewCoach.nickname ? (
                                    <div className="th__modal-player th__modal-player--coach">
                                        <div className="th__modal-player-avatar">
                                            {previewCoach.photo
                                                ? (
                                                    <img
                                                        src={resolveMediaUrl(previewCoach.photo)}
                                                        alt=""
                                                        onError={(e) => applyImageFallback(e, getBotAvatarFallback(previewCoach.nickname))}
                                                    />
                                                )
                                                : <img src={getBotAvatarFallback(previewCoach.nickname)} alt="" />
                                            }
                                        </div>
                                        <div className="th__modal-player-info">
                                            <span className="th__modal-player-name">{previewCoach.nickname}</span>
                                            <span className="th__modal-player-role">{previewCoach.role || 'Coach'}</span>
                                            {previewCoach.gameId && <span className="th__modal-player-detail"><i className='bx bx-id-card'></i> {formatRosterGameId(selectedTeam?.game, previewCoach)}</span>}
                                            {previewCoach.region && <span className="th__modal-player-detail"><i className='bx bx-map-pin'></i> {previewCoach.region}</span>}
                                            {previewCanManage && previewCoach.email && <span className="th__modal-player-detail"><i className='bx bx-envelope'></i> {previewCoach.email}</span>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="th__modal-player th__modal-player--empty">
                                        <div className="th__modal-player-avatar"><i className='bx bx-user-voice'></i></div>
                                        <div className="th__modal-player-info">
                                            <span className="th__modal-player-name">Sin coach asignado</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {previewCanManage && (
                                <div className="th__modal-actions">
                                    <button
                                        className="th__modal-btn th__modal-btn--primary"
                                        onClick={() => openManageTeamModal(selectedTeam, 'roster')}
                                    >
                                        <i className='bx bx-user-plus'></i> Invitar amigo
                                    </button>
                                    <button
                                        className="th__modal-btn th__modal-btn--secondary"
                                        onClick={() => openManageTeamModal(selectedTeam, 'info')}
                                    >
                                        <i className='bx bx-cog'></i> Gestionar equipo
                                    </button>
                                </div>
                            )}

                        {/* ── JOIN SECTION — for all logged-in users ── */}
                        {currentUser && (() => {
                            const alreadyMember = isUserMember(selectedTeam);
                            const st = selectedTeam;
                            const maxS = st.maxMembers || st.roster?.starters?.length || 5;
                            const maxSb = st.maxSubstitutes || st.roster?.subs?.length || 0;
                            const roles = getSupportedGameRoles(st.game);
                            const starterList = Array.isArray(st?.roster?.starters) ? st.roster.starters : [];
                            const subList = Array.isArray(st?.roster?.subs) ? st.roster.subs : [];
                            const coach = st?.roster?.coach || null;
                            const slotHasMember = (slot) => Boolean(slot?.user || slot?.nickname || slot?.gameId || slot?.email || slot?.role);
                            const normalizeRoleKey = (value = '') => String(value || '').trim().toLowerCase();
                            const usedRoles = new Set();
                            [...starterList, ...subList, coach].forEach((member) => {
                                if (!slotHasMember(member)) return;
                                const roleKey = normalizeRoleKey(member?.role);
                                if (roleKey) usedRoles.add(roleKey);
                            });
                            const availableRoles = roles.filter((role) => !usedRoles.has(normalizeRoleKey(role)));
                            let roleCursor = 0;
                            const roleHintsByType = { starters: {}, subs: {} };
                            for (let idx = 0; idx < maxS; idx += 1) {
                                if (slotHasMember(starterList[idx])) continue;
                                if (availableRoles[roleCursor]) {
                                    roleHintsByType.starters[idx] = availableRoles[roleCursor];
                                    roleCursor += 1;
                                }
                            }
                            for (let idx = 0; idx < maxSb; idx += 1) {
                                if (slotHasMember(subList[idx])) continue;
                                if (availableRoles[roleCursor]) {
                                    roleHintsByType.subs[idx] = availableRoles[roleCursor];
                                    roleCursor += 1;
                                }
                            }
                            const isMlbbJoinTeam = isMlbbTeam(st);
                            const isUniversityJoinTeam = isUniversityTeam(st);
                            const userMatchesUniversity = currentUserUniversityVerified
                                && String(currentUserUniversity.universityId || '') === String(st?.university?.universityId || '');
                            return (
                                <div className="th__modal-section th__modal-join-section">
                                    <h4><i className='bx bx-log-in-circle'></i> Unirse al Equipo</h4>
                                    {alreadyMember ? (
                                        <div className="th__join-gate" style={{ textAlign: 'center' }}>
                                            <p className="th__join-gate-desc" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--primary, #8EDB15)' }}>
                                                <i className='bx bx-check-circle' style={{ fontSize: '1.3rem' }}></i>
                                                Ya eres miembro de este equipo
                                            </p>
                                        </div>
                                    ) : joinSuccess ? (
                                        <div className="th__join-success">
                                            <div className="th__join-success-icon">
                                                <i className='bx bx-check-circle'></i>
                                            </div>
                                            <h5 className="th__join-success-title">¡Bien hecho!</h5>
                                            <p className="th__join-success-desc">
                                                Tu solicitud fue enviada correctamente.<br />
                                                La confirmación está <strong>en espera</strong> — el líder del equipo recibirá tus datos para aceptar o rechazar tu ingreso.
                                            </p>
                                            <button className="th__join-success-btn" onClick={resetJoinForm}>
                                                <i className='bx bx-check'></i> Entendido
                                            </button>
                                        </div>
                                    ) : !joinFormOpen ? (
                                        <div className="th__join-gate">
                                            <p className="th__join-gate-desc">Ingresa el código de invitación para unirte a este equipo</p>
                                            {isMlbbJoinTeam && (
                                                <div className={`th__join-sync-banner ${currentUserMlbbVerified ? 'is-ready' : 'is-missing'}`}>
                                                    <i className={`bx ${currentUserMlbbVerified ? 'bx-check-shield' : 'bx-error-circle'}`}></i>
                                                    <span>
                                                        {currentUserMlbbVerified
                                                            ? `Se usará tu cuenta MLBB vinculada: ${currentUserMlbbIgn || 'IGN no disponible'} · ${currentUserMlbbPlayerId}/${currentUserMlbbZoneId}`
                                                            : 'Para unirte a equipos MLBB primero debes verificar tu cuenta en Conexiones.'}
                                                    </span>
                                                </div>
                                            )}
                                            {isUniversityJoinTeam && (
                                                <div className={`th__join-sync-banner ${userMatchesUniversity ? 'is-ready' : 'is-missing'}`}>
                                                    <i className={`bx ${userMatchesUniversity ? 'bx-check-shield' : 'bx-error-circle'}`}></i>
                                                    <span>
                                                        {userMatchesUniversity
                                                            ? `Se usará tu verificación universitaria: ${currentUserUniversity.universityName || currentUserUniversity.universityTag}`
                                                            : `Este equipo pertenece a ${st?.university?.universityName || 'una universidad verificada'}. Debes tener esa misma universidad validada para entrar.`}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="th__join-gate-row">
                                                <div className="th__join-gate-input">
                                                    <i className='bx bx-key'></i>
                                                    <input
                                                        type="text"
                                                        placeholder="Código de invitación"
                                                        value={joinInviteCode}
                                                        onChange={e => setJoinInviteCode(e.target.value.toUpperCase())}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter' && joinInviteCode.trim()) {
                                                                setJoinRoleLockedByInvite(false);
                                                                setJoinFormOpen(true);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    className="th__join-gate-btn"
                                                    disabled={!joinInviteCode.trim()}
                                                    onClick={() => {
                                                        setJoinRoleLockedByInvite(false);
                                                        setJoinFormOpen(true);
                                                    }}
                                                >
                                                    <i className='bx bx-right-arrow-alt'></i> Continuar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <form className="th__join-form" onSubmit={(e) => handleJoinTeam(e, selectedTeam)}>
                                            <div className="th__join-form-code">
                                                <i className='bx bx-check-shield'></i>
                                                <span>Código: <strong>{joinInviteCode}</strong></span>
                                                <button type="button" className="th__join-form-change" onClick={() => setJoinFormOpen(false)}>
                                                    Cambiar
                                                </button>
                                            </div>

                                            {isMlbbJoinTeam && (
                                                <div className={`th__join-account-card ${currentUserMlbbVerified ? 'is-ready' : 'is-missing'}`}>
                                                    <div className="th__join-account-head">
                                                        <i className={`bx ${currentUserMlbbVerified ? 'bx-check-shield' : 'bx-error-circle'}`}></i>
                                                        <div>
                                                            <strong>Cuenta MLBB sincronizada</strong>
                                                            <span>
                                                                {currentUserMlbbVerified
                                                                    ? 'Esta identidad se usará para validar tu ingreso y cualquier actividad del torneo.'
                                                                    : 'No tienes una cuenta MLBB verificada. Debes completar Conexiones antes de continuar.'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="th__join-account-grid">
                                                        <div className="th__join-account-item">
                                                            <label>IGN</label>
                                                            <p>{currentUserMlbbIgn || 'No disponible'}</p>
                                                        </div>
                                                        <div className="th__join-account-item">
                                                            <label>User ID</label>
                                                            <p>{currentUserMlbbPlayerId || 'No disponible'}</p>
                                                        </div>
                                                        <div className="th__join-account-item">
                                                            <label>Zone ID</label>
                                                            <p>{currentUserMlbbZoneId || 'No disponible'}</p>
                                                        </div>
                                                        <div className="th__join-account-item">
                                                            <label>Estado</label>
                                                            <p>{currentUserMlbbVerified ? 'Verificada' : 'Pendiente'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {isUniversityJoinTeam && (
                                                <div className={`th__join-account-card ${userMatchesUniversity ? 'is-ready' : 'is-missing'}`}>
                                                    <div className="th__join-account-head">
                                                        <i className={`bx ${userMatchesUniversity ? 'bx-check-shield' : 'bx-error-circle'}`}></i>
                                                        <div>
                                                            <strong>Verificación universitaria</strong>
                                                            <span>
                                                                {userMatchesUniversity
                                                                    ? 'Tu universidad coincide con la del equipo y se usará para validar torneos universitarios.'
                                                                    : 'Tu cuenta no tiene una universidad válida para este equipo.'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="th__join-account-grid">
                                                        <div className="th__join-account-item">
                                                            <label>Equipo</label>
                                                            <p>{st?.university?.universityName || 'No definida'}</p>
                                                        </div>
                                                        <div className="th__join-account-item">
                                                            <label>Tu cuenta</label>
                                                            <p>{currentUserUniversity.universityName || 'No verificada'}</p>
                                                        </div>
                                                        <div className="th__join-account-item">
                                                            <label>Campus</label>
                                                            <p>{currentUserUniversity.campus || 'No disponible'}</p>
                                                        </div>
                                                        <div className="th__join-account-item">
                                                            <label>Estado</label>
                                                            <p>{userMatchesUniversity ? 'Compatible' : 'No compatible'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Photo upload */}
                                            <div className="th__join-photo-upload">
                                                <label className="th__join-photo-label">
                                                    {joinPhotoPreview ? (
                                                        <img src={joinPhotoPreview} alt="Preview" className="th__join-photo-preview" />
                                                    ) : (
                                                        <div className="th__join-photo-placeholder">
                                                            <i className='bx bx-camera'></i>
                                                            <span>Subir foto</span>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/webp"
                                                        onChange={handleJoinPhotoChange}
                                                        hidden
                                                    />
                                                </label>
                                                {joinPhotoPreview && (
                                                    <button type="button" className="th__join-photo-remove" onClick={() => { setJoinPhoto(null); setJoinPhotoPreview(''); }}>
                                                        <i className='bx bx-x'></i>
                                                    </button>
                                                )}
                                            </div>

                                            <div className="th__join-form-grid">
                                                <div className="th__join-field">
                                                    <label>{isMlbbJoinTeam ? 'Nickname visible *' : 'Nickname *'}</label>
                                                    <input
                                                        type="text"
                                                        placeholder={isMlbbJoinTeam ? (currentUserMlbbIgn || 'Tu nickname') : 'Tu nickname'}
                                                        value={joinPlayer.nickname}
                                                        onChange={e => setJoinPlayer({ ...joinPlayer, nickname: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                {!isMlbbJoinTeam && (
                                                    <>
                                                        <div className="th__join-field">
                                                            <label>Game ID</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Riot ID / Tag"
                                                                value={joinPlayer.gameId}
                                                                onChange={e => setJoinPlayer({ ...joinPlayer, gameId: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="th__join-field">
                                                            <label>Región</label>
                                                            <select value={joinPlayer.region} onChange={e => setJoinPlayer({ ...joinPlayer, region: e.target.value })}>
                                                                <option value="">Seleccionar...</option>
                                                                {REGION_OPTIONS_JOIN.map(r => <option key={r} value={r}>{r}</option>)}
                                                            </select>
                                                        </div>
                                                    </>
                                                )}
                                                <div className="th__join-field">
                                                    <label>Rol</label>
                                                    <select
                                                        value={joinPlayer.role}
                                                        onChange={e => setJoinPlayer({ ...joinPlayer, role: e.target.value })}
                                                        disabled={joinRoleLockedByInvite}
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                                        <option value="Suplente">Suplente</option>
                                                        <option value="Coach">Coach</option>
                                                    </select>
                                                    {joinRoleLockedByInvite && (
                                                        <small className="th__join-role-locked-note">
                                                            Rol fijado por la invitación del equipo.
                                                        </small>
                                                    )}
                                                </div>
                                                <div className="th__join-field">
                                                    <label>Posición</label>
                                                    <select value={joinSlotType} onChange={e => { setJoinSlotType(e.target.value); setJoinSlotIndex(0); }}>
                                                        <option value="starters">Titular</option>
                                                        {maxSb > 0 && <option value="subs">Suplente</option>}
                                                        <option value="coach">Coach</option>
                                                    </select>
                                                </div>
                                                {joinSlotType !== 'coach' && (
                                                    <div className="th__join-field">
                                                        <label>Slot</label>
                                                        <select value={joinSlotIndex} onChange={e => setJoinSlotIndex(Number(e.target.value))}>
                                                            {Array.from({ length: joinSlotType === 'starters' ? maxS : maxSb }).map((_, i) => {
                                                                const current = joinSlotType === 'starters' ? st.roster?.starters?.[i] : st.roster?.subs?.[i];
                                                                const roleHint = joinSlotType === 'starters'
                                                                    ? roleHintsByType.starters?.[i]
                                                                    : roleHintsByType.subs?.[i];
                                                                const label = current?.nickname
                                                                    || current?.role
                                                                    || `${joinSlotType === 'starters' ? 'Titular' : 'Suplente'} #${i + 1}${roleHint ? ` · ${roleHint}` : ''}`;
                                                                return <option key={i} value={i} disabled={Boolean(current?.nickname)}>{label}{current?.nickname ? ' ✓' : ''}</option>;
                                                            })}
                                                        </select>
                                                    </div>
                                                )}
                                                <div className="th__join-field th__join-field--full">
                                                    <label>Email (opcional)</label>
                                                    <input
                                                        type="email"
                                                        placeholder="tu@email.com"
                                                        value={joinPlayer.email}
                                                        onChange={e => setJoinPlayer({ ...joinPlayer, email: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            {isMlbbJoinTeam && (
                                                <div className="th__join-mlbb-note">
                                                    <i className='bx bx-info-circle'></i>
                                                    <span>En MLBB no puedes enviar User ID o Zone ID manualmente. El sistema usa la cuenta verificada de tu perfil.</span>
                                                </div>
                                            )}
                                            {isUniversityJoinTeam && (
                                                <div className="th__join-mlbb-note">
                                                    <i className='bx bx-info-circle'></i>
                                                    <span>En equipos universitarios solo pueden entrar estudiantes verificados de la misma universidad.</span>
                                                </div>
                                            )}
                                            <div className="th__join-form-actions">
                                                <button type="button" className="th__join-btn-cancel" onClick={resetJoinForm}>Cancelar</button>
                                                <button type="submit" className="th__join-btn-submit" disabled={joinSubmitting || (isMlbbJoinTeam && !currentUserMlbbVerified) || (isUniversityJoinTeam && !userMatchesUniversity)}>
                                                    {joinSubmitting ? <><i className='bx bx-loader-alt bx-spin'></i> Enviando...</> : <><i className='bx bx-send'></i> Enviar Solicitud</>}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Pending requests — admin only */}
                        {(() => {
                            const captainId = selectedTeam?.captain?._id || selectedTeam?.captain;
                            const isCaptain = currentUser?._id && String(captainId) === String(currentUser._id);
                            const pendingRequests = getPendingRequests(selectedTeam);
                            if (!isCaptain || pendingRequests.length === 0) return null;
                            return (
                                <div className="th__modal-section th__modal-section--requests">
                                    <h4><i className='bx bx-time-five'></i> Solicitudes pendientes</h4>
                                    <div className="members-scroll-list">
                                        {pendingRequests.map((r) => (
                                            <div key={r._id} className="member-row-item">
                                                <div className="member-info">
                                                    <span className="member-name">{r.player?.nickname || 'Jugador'}</span>
                                                    <span className="captain-badge">{r.player?.role || 'Rol'}</span>
                                                </div>
                                                <div className="request-actions">
                                                    <button className="btn-primary-small" onClick={() => handleRequestAction(selectedTeam._id, r._id, 'approve')}>Aprobar</button>
                                                    <button className="btn-secondary-small" onClick={() => handleRequestAction(selectedTeam._id, r._id, 'reject')}>Rechazar</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                        </div>

                    </div>
                </div>
                );
            })()}
            </div>
        </div>
    );
};

export default Team;
