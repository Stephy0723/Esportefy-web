import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import { useNotification } from '../../../context/NotificationContext';
import ViewTeamModal from './ViewTeamModal';
import PageHud from '../../../components/PageHud/PageHud';
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
    const { addToast } = useNotification();

    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Join flow state
    const [joinInviteCode, setJoinInviteCode] = useState('');
    const [joinFormOpen, setJoinFormOpen] = useState(false);
    const [joinSlotType, setJoinSlotType] = useState('starters');
    const [joinSlotIndex, setJoinSlotIndex] = useState(0);
    const [joinPlayer, setJoinPlayer] = useState({ nickname: '', gameId: '', region: '', email: '', role: '' });
    const [joinSubmitting, setJoinSubmitting] = useState(false);
    const [joinPhoto, setJoinPhoto] = useState(null);
    const [joinPhotoPreview, setJoinPhotoPreview] = useState('');
    const [joinSuccess, setJoinSuccess] = useState(false);

    const storedUser = localStorage.getItem('esportefyUser');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

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

    const ROLE_NAMES_JOIN = {
        "Mobile Legends": ["EXP", "Gold", "Mid", "Jungla", "Roam"],
        "League of Legends": ["Top", "Jungle", "Mid", "ADC", "Supp"],
        "Wild Rift": ["Baron", "Jungle", "Mid", "Dragon", "Supp"],
        "Valorant": ["Duelist", "Sentinel", "Controller", "Initiator", "Flex"],
        "CS2": ["Entry", "AWPer", "Lurker", "Support", "IGL"],
        "Overwatch 2": ["Tank", "DPS", "DPS", "Support", "Support"],
        "Rainbow Six Siege": ["Entry", "Support", "Flex", "Hard Breach", "Anchor"],
        "Free Fire": ["Rusher", "Support", "Sniper", "IGL"],
        "Fortnite": ["Fragger", "IGL", "Support", "Builder"],
        "PUBG": ["Fragger", "IGL", "Support", "Scout"],
        "Apex Legends": ["Fragger", "IGL", "Support"],
        "Call of Duty": ["Slayer", "OBJ", "Support", "Flex"],
        "Dota 2": ["Carry", "Mid", "Offlane", "Soft Supp", "Hard Supp"],
        "Rocket League": ["Striker", "Midfielder", "Defender"],
    };
    const REGION_OPTIONS_JOIN = ["LAN", "LAS", "NA", "BR", "EUW", "EUNE", "TR", "RU", "OCE", "KR", "JP", "LATAM", "GLOBAL"];

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
        if (!joinPlayer.nickname.trim()) return addToast('Nickname requerido', 'error');
        if (!joinInviteCode.trim()) return addToast('Código de invitación requerido', 'error');
        try {
            setJoinSubmitting(true);
            const token = localStorage.getItem('token');
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
                    player: { ...joinPlayer, photo: photoData }
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
        setJoinPhoto(null);
        setJoinPhotoPreview('');
        setJoinSuccess(false);
    };

    const handleRequestAction = async (teamId, requestId, action) => {
        try {
            const token = localStorage.getItem('token');
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
                setTeams(res.data);
                setError(false);
            } catch (_) {
                setError(true);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* ── filter ── */
    const filteredTeams = useMemo(() => {
        return teams.filter(team => {
            const level = team.teamLevel?.toLowerCase() || '';
            const gender = team.teamGender?.toLowerCase() || '';
            const q = search.toLowerCase();

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
                || team.teamCountry?.toLowerCase().includes(q);

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
                                    const token = localStorage.getItem('token');
                                    const res = await axios.post(`${API_URL}/api/teams/seed-demo`, {}, {
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    addToast(res.data.message || 'Equipos demo creados', 'success');
                                    const teamsRes = await axios.get(`${API_URL}/api/teams`);
                                    setTeams(teamsRes.data);
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
                                    const token = localStorage.getItem('token');
                                    const res = await axios.post(`${API_URL}/api/teams/seed-third-party`, {}, {
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    addToast(res.data.message || 'Equipos de terceros creados', 'success');
                                    const teamsRes = await axios.get(`${API_URL}/api/teams`);
                                    setTeams(teamsRes.data);
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

            {/* ── TOOLBAR (search + filters) ── */}
            <div className="th__toolbar">
                <div className="th__search">
                    <i className='bx bx-search'></i>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, juego, pais..."
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
                                                ? <img src={team.logo} alt="" />
                                                : <span>{team.name.substring(0, 2).toUpperCase()}</span>
                                            }
                                        </div>
                                        <div className="th__card-identity">
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
                                                    <img src={p.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.nickname}`} alt="" />
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
                                            <button
                                                className="th__card-btn th__card-btn--manage"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedTeam(team);
                                                    setIsViewModalOpen(true);
                                                }}
                                            >
                                                Gestionar
                                                <i className='bx bx-cog'></i>
                                            </button>
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

            {/* ── MODALS ── */}
            {selectedTeam && (
                <ViewTeamModal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    team={selectedTeam}
                    currentUser={currentUser}
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
                                        ? <img src={selectedTeam.logo} alt="" />
                                        : <span>{selectedTeam.name.substring(0, 2).toUpperCase()}</span>
                                    }
                                </div>
                                <div className="th__modal-hero-info">
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
                                                        ? <img src={p.photo} alt="" />
                                                        : p?.nickname
                                                            ? <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${p.nickname}`} alt="" />
                                                            : <i className='bx bx-user-plus'></i>
                                                    }
                                                    {isCap && <span className="th__modal-captain-crown"><i className='bx bxs-crown'></i></span>}
                                                </div>
                                                <div className="th__modal-player-info">
                                                    <span className="th__modal-player-name">{p?.nickname || 'Vacante'}</span>
                                                    {p?.role && <span className="th__modal-player-role">{p.role}</span>}
                                                    {p?.gameId && <span className="th__modal-player-detail"><i className='bx bx-id-card'></i> {p.gameId}</span>}
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
                                                        ? <img src={p.photo} alt="" />
                                                        : p?.nickname
                                                            ? <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${p.nickname}`} alt="" />
                                                            : <i className='bx bx-user-plus'></i>
                                                    }
                                                </div>
                                                <div className="th__modal-player-info">
                                                    <span className="th__modal-player-name">{p?.nickname || 'Vacante'}</span>
                                                    {p?.role && <span className="th__modal-player-role">{p.role}</span>}
                                                    {p?.gameId && <span className="th__modal-player-detail"><i className='bx bx-id-card'></i> {p.gameId}</span>}
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
                                                ? <img src={previewCoach.photo} alt="" />
                                                : <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${previewCoach.nickname}`} alt="" />
                                            }
                                        </div>
                                        <div className="th__modal-player-info">
                                            <span className="th__modal-player-name">{previewCoach.nickname}</span>
                                            <span className="th__modal-player-role">{previewCoach.role || 'Coach'}</span>
                                            {previewCoach.gameId && <span className="th__modal-player-detail"><i className='bx bx-id-card'></i> {previewCoach.gameId}</span>}
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

                        {/* ── JOIN SECTION — for all logged-in users ── */}
                        {currentUser && (() => {
                            const alreadyMember = isUserMember(selectedTeam);
                            const st = selectedTeam;
                            const maxS = st.maxMembers || st.roster?.starters?.length || 5;
                            const maxSb = st.maxSubstitutes || st.roster?.subs?.length || 0;
                            const roles = ROLE_NAMES_JOIN[st.game] || [];
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
                                            <div className="th__join-gate-row">
                                                <div className="th__join-gate-input">
                                                    <i className='bx bx-key'></i>
                                                    <input
                                                        type="text"
                                                        placeholder="Código de invitación"
                                                        value={joinInviteCode}
                                                        onChange={e => setJoinInviteCode(e.target.value.toUpperCase())}
                                                        onKeyDown={e => { if (e.key === 'Enter' && joinInviteCode.trim()) setJoinFormOpen(true); }}
                                                    />
                                                </div>
                                                <button
                                                    className="th__join-gate-btn"
                                                    disabled={!joinInviteCode.trim()}
                                                    onClick={() => setJoinFormOpen(true)}
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
                                                    <label>Nickname *</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Tu nickname"
                                                        value={joinPlayer.nickname}
                                                        onChange={e => setJoinPlayer({ ...joinPlayer, nickname: e.target.value })}
                                                        required
                                                    />
                                                </div>
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
                                                <div className="th__join-field">
                                                    <label>Rol</label>
                                                    <select value={joinPlayer.role} onChange={e => setJoinPlayer({ ...joinPlayer, role: e.target.value })}>
                                                        <option value="">Seleccionar...</option>
                                                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                                        <option value="Suplente">Suplente</option>
                                                        <option value="Coach">Coach</option>
                                                    </select>
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
                                                                const label = current?.nickname || current?.role || `Slot ${i + 1}`;
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
                                            <div className="th__join-form-actions">
                                                <button type="button" className="th__join-btn-cancel" onClick={resetJoinForm}>Cancelar</button>
                                                <button type="submit" className="th__join-btn-submit" disabled={joinSubmitting}>
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
