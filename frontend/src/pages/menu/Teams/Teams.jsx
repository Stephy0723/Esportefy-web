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
    amateur:       { icon: 'bx-joystick',    color: '#4facfe', label: 'Amateur' },
    'semi-pro':    { icon: 'bx-target-lock', color: '#f093fb', label: 'Semi-Pro' },
    universitario: { icon: 'bx-book-reader', color: '#3b82f6', label: 'Universitario' },
    profesional:   { icon: 'bx-medal',       color: '#ef4444', label: 'Profesional' },
    leyenda:       { icon: 'bx-crown',       color: '#ffd700', label: 'Leyenda' },
};

const GENDER_CONFIG = {
    mixto:     { icon: 'bx-group',       color: '#8EDB15', label: 'Mixto' },
    femenino:  { icon: 'bx-female-sign', color: '#ff007f', label: 'Femenino' },
    masculino: { icon: 'bx-male-sign',   color: '#4facfe', label: 'Masculino' },
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
    { key: 'nuevo',          label: 'Nuevos',        icon: 'bx-bolt-circle', dot: '#00e676' },
    { key: 'divider-1' },
    { key: 'mixto',          label: 'Mixto',         icon: 'bx-group',        dot: '#8EDB15' },
    { key: 'femenino',       label: 'Femenino',      icon: 'bx-female-sign',  dot: '#ff007f' },
    { key: 'masculino',      label: 'Masculino',     icon: 'bx-male-sign',    dot: '#4facfe' },
    { key: 'divider-2' },
    { key: 'casual',         label: 'Casual',        icon: 'bx-game',         dot: '#8EDB15' },
    { key: 'amateur',        label: 'Amateur',       icon: 'bx-joystick',     dot: '#4facfe' },
    { key: 'universitario',  label: 'Universitario', icon: 'bx-book-reader',  dot: '#3b82f6' },
    { key: 'semi-pro',       label: 'Semi-Pro',      icon: 'bx-target-lock',  dot: '#f093fb' },
    { key: 'profesional',    label: 'Pro',           icon: 'bx-medal',        dot: '#ef4444' },
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
    const [isPreviewEditing, setIsPreviewEditing] = useState(false);
    const [previewForm, setPreviewForm] = useState({});
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

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

    const handleLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setLogoPreview(reader.result);
        reader.readAsDataURL(file);
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
                                        <button
                                            className="th__card-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTeam(team);
                                                setIsViewModalOpen(true);
                                            }}
                                        >
                                            {isMember ? 'Gestionar' : 'Unirse'}
                                            <i className={`bx ${isMember ? 'bx-cog' : 'bx-log-in'}`}></i>
                                        </button>
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
                const previewFilled = previewStarters.filter(p => p?.nickname).length;
                const previewTotal = selectedTeam.maxMembers || previewStarters.length || 0;
                const previewIsCaptain = currentUser?._id && String(selectedTeam.captain?._id || selectedTeam.captain) === String(currentUser._id);
                return (
                <div className="modal-overlay" onClick={() => setIsPreviewOpen(false)}>
                    <div className="th__modal" onClick={(e) => e.stopPropagation()} style={{ '--modal-accent': previewVis.color }}>
                        {/* Themed banner header */}
                        <div className="th__modal-banner">
                            <div className="th__modal-banner-bg" />
                            <button className="th__modal-close" onClick={() => setIsPreviewOpen(false)}>
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
                                        {isPreviewEditing ? (
                                            <input className="preview-input" value={previewForm.category || ''} onChange={(e) => setPreviewForm({ ...previewForm, category: e.target.value })} />
                                        ) : (
                                            <p>{selectedTeam.category || 'Sin categoría'}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="th__modal-info-item">
                                    <i className='bx bx-map'></i>
                                    <div>
                                        <label>País / Región</label>
                                        {isPreviewEditing ? (
                                            <input className="preview-input" value={previewForm.teamCountry || ''} onChange={(e) => setPreviewForm({ ...previewForm, teamCountry: e.target.value })} />
                                        ) : (
                                            <p>{selectedTeam.teamCountry || 'No definido'}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="th__modal-info-item">
                                    <i className='bx bx-trophy'></i>
                                    <div>
                                        <label>Nivel</label>
                                        {isPreviewEditing ? (
                                            <input className="preview-input" value={previewForm.teamLevel || ''} onChange={(e) => setPreviewForm({ ...previewForm, teamLevel: e.target.value })} />
                                        ) : (
                                            <p>{selectedTeam.teamLevel || 'No definido'}</p>
                                        )}
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
                                {previewIsCaptain && selectedTeam.inviteCode && (
                                    <div className="th__modal-info-item th__modal-info-item--code">
                                        <i className='bx bx-key'></i>
                                        <div>
                                            <label>Código de Invitación</label>
                                            <p className="th__invite-code">{selectedTeam.inviteCode}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {isPreviewEditing && (
                                <div className="th__modal-section">
                                    <h4><i className='bx bx-image'></i> Logo del Equipo</h4>
                                    <div className="logo-upload-row">
                                        <div className="logo-preview-box">
                                            {logoPreview || selectedTeam.logo
                                                ? <img src={logoPreview || selectedTeam.logo} alt="Logo equipo" />
                                                : <span>Sin logo</span>
                                            }
                                        </div>
                                        <input type="file" accept="image/*" onChange={handleLogoChange} />
                                    </div>
                                </div>
                            )}

                            {/* Roster section */}
                            <div className="th__modal-section">
                                <h4><i className='bx bx-group'></i> Roster</h4>
                                <div className="members-scroll-list">
                                    {(() => {
                                        const captainId = selectedTeam?.captain?._id || selectedTeam?.captain;
                                        const captainFromRoster = (selectedTeam?.roster?.starters || []).find(p => String(p?.user) === String(captainId));
                                        const captainName = selectedTeam?.captain?.fullName || captainFromRoster?.nickname || 'No definido';
                                        const captainRole = captainFromRoster?.role || 'Capitan';
                                        const captainRegion = captainFromRoster?.region || '';
                                        return (
                                            <div className="member-row-item">
                                                <div className="member-avatar"><i className='bx bxs-crown'></i></div>
                                                <div className="member-info">
                                                    <span className="member-name">{captainName}</span>
                                                    <span className="role-badge">{captainRole}</span>
                                                    {captainRegion && <span className="member-meta">Region: {captainRegion}</span>}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    {(selectedTeam.roster?.starters || []).map((p, i) => (
                                        <div key={`p-${i}`} className="member-row-item">
                                            <div className="member-avatar"><i className='bx bxs-user-circle'></i></div>
                                            <div className="member-info">
                                                <span className="member-name">{p?.nickname || 'Vacante'}</span>
                                                {p?.role && <span className="role-badge">{p.role}</span>}
                                                {p?.region && <span className="member-meta">Region: {p.region}</span>}
                                            </div>
                                            <span className="member-meta">Titular</span>
                                        </div>
                                    ))}
                                    {(selectedTeam.roster?.subs || []).map((p, i) => (
                                        <div key={`s-${i}`} className="member-row-item">
                                            <div className="member-avatar"><i className='bx bxs-user-voice'></i></div>
                                            <div className="member-info">
                                                <span className="member-name">{p?.nickname || 'Vacante'}</span>
                                                {p?.role && <span className="role-badge">{p.role}</span>}
                                                {p?.region && <span className="member-meta">Region: {p.region}</span>}
                                            </div>
                                            <span className="member-meta">Suplente</span>
                                        </div>
                                    ))}
                                    {selectedTeam.roster?.coach && (
                                        <div className="member-row-item">
                                            <div className="member-avatar"><i className='bx bxs-user-badge'></i></div>
                                            <div className="member-info">
                                                <span className="member-name">{selectedTeam.roster.coach?.nickname || 'Coach'}</span>
                                                <span className="role-badge">{selectedTeam.roster.coach?.role || 'Coach'}</span>
                                                {selectedTeam.roster.coach?.region && <span className="member-meta">Region: {selectedTeam.roster.coach.region}</span>}
                                            </div>
                                            <span className="member-meta">Coach</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Pending requests */}
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

                        <div className="th__modal-actions">
                            <button className="th__modal-btn th__modal-btn--secondary" onClick={() => setIsPreviewOpen(false)}>
                                <i className='bx bx-x'></i> Cerrar
                            </button>
                            {(currentUser?.isAdmin || String(selectedTeam.captain?._id || selectedTeam.captain) === String(currentUser?._id)) && (
                                <>
                                    <button
                                        className="th__modal-btn th__modal-btn--primary"
                                        onClick={async () => {
                                            if (!isPreviewEditing) {
                                                setPreviewForm({
                                                    category: selectedTeam.category || '',
                                                    teamCountry: selectedTeam.teamCountry || '',
                                                    teamLevel: selectedTeam.teamLevel || ''
                                                });
                                                setLogoFile(null);
                                                setLogoPreview(null);
                                                setIsPreviewEditing(true);
                                                return;
                                            }
                                            try {
                                                const token = localStorage.getItem('token');
                                                let updated = selectedTeam;
                                                const res = await axios.patch(
                                                    `${API_URL}/api/teams/${selectedTeam._id}`,
                                                    previewForm,
                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                );
                                                updated = res.data.team || updated;
                                                if (logoFile) {
                                                    const data = new FormData();
                                                    data.append('logo', logoFile);
                                                    const resLogo = await axios.patch(
                                                        `${API_URL}/api/teams/${selectedTeam._id}/logo`,
                                                        data,
                                                        { headers: { Authorization: `Bearer ${token}` } }
                                                    );
                                                    updated = resLogo.data.team || updated;
                                                }
                                                setSelectedTeam(updated);
                                                setTeams(prev => prev.map(t => String(t._id) === String(updated._id) ? updated : t));
                                                setIsPreviewEditing(false);
                                                setLogoFile(null);
                                                setLogoPreview(null);
                                            } catch (err) {
                                                addToast('No se pudo guardar el equipo', 'error');
                                            }
                                        }}
                                    >
                                        {isPreviewEditing ? 'Guardar' : 'Editar'}
                                    </button>
                                    <button
                                        className="th__modal-btn th__modal-btn--danger"
                                        onClick={async () => {
                                            const ok = window.confirm('Eliminar este equipo?');
                                            if (!ok) return;
                                            try {
                                                const token = localStorage.getItem('token');
                                                await axios.delete(`${API_URL}/api/teams/${selectedTeam._id}`, {
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });
                                                setTeams(prev => prev.filter(t => String(t._id) !== String(selectedTeam._id)));
                                                setIsPreviewOpen(false);
                                            } catch (err) {
                                                addToast('No se pudo eliminar el equipo', 'error');
                                            }
                                        }}
                                    >
                                        Eliminar
                                    </button>
                                </>
                            )}
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
