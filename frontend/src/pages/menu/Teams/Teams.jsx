import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
    FaSearch, FaCalendarAlt, FaUserGraduate, FaVenus, FaCrown, 
    FaFire, FaLeaf, FaPlus, FaChartLine, FaGhost, FaExclamationTriangle 
} from 'react-icons/fa';
import './Teams.css';
import ViewTeamModal from './ViewTeamModal'; 
import { useNotification } from '../../../context/NotificationContext';

const ROLE_NAMES = {
    "Mobile Legends": ["EXP", "Gold", "Mid", "Jungla", "Roam"],
    "League of Legends": ["Top", "Jungle", "Mid", "ADC", "Supp"],
    "Valorant": ["Duelist", "Sentinel", "Controller", "Initiator", "Flex"],
    "Overwatch 2": ["Tank", "DPS", "DPS", "Support", "Support"],
    "TFT": ["Tactician"],
    "FIFA / EA FC": ["Player"],
    "Free Fire": ["Rusher", "Support", "Sniper", "IGL"]
};

const Team = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useNotification();
    
    // --- ESTADOS ---
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState('all'); 
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isPreviewEditing, setIsPreviewEditing] = useState(false);
    const [previewForm, setPreviewForm] = useState({});
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [inviteCode, setInviteCode] = useState('');
    const storedUser = localStorage.getItem('esportefyUser');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    const handleLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setLogoPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const isUserMember = (team) => {
        if (!currentUser?._id || !team) return false;
        const uid = String(currentUser._id);
        const starters = Array.isArray(team.roster?.starters) ? team.roster.starters : [];
        const subs = Array.isArray(team.roster?.subs) ? team.roster.subs : [];
        const inStarters = starters.some(p => String(p?.user) === uid);
        const inSubs = subs.some(p => String(p?.user) === uid);
        const inCoach = team.roster?.coach && String(team.roster.coach.user) === uid;
        return inStarters || inSubs || inCoach;
    };

    const getPendingRequests = (team) => {
        if (!team) return [];
        return (team.joinRequests || []).filter(r => r.status === 'pending');
    };

    const handleRequestAction = async (teamId, requestId, action) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return addToast('Debes iniciar sesión', 'error');
            const res = await axios.patch(
                `http://localhost:4000/api/teams/${teamId}/requests/${requestId}`,
                { action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data?.team) {
                setSelectedTeam(res.data.team);
                setTeams((prev) => prev.map(t => String(t._id) === String(res.data.team._id) ? res.data.team : t));
            }
        } catch (err) {
            addToast(err.response?.data?.message || 'Error al gestionar solicitud', 'error');
        }
    };

    // --- EFECTO DE CARGA ---
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                setLoading(true);
                // Llamada a tu API de Node.js
                const response = await axios.get('http://localhost:4000/api/teams');
                setTeams(response.data);
                setError(false);
            } catch (err) {
                console.error("Error al obtener equipos:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchTeams();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const code = params.get('invite');
        if (!code) return;
        const fetchTeamByInvite = async () => {
            try {
                const res = await axios.get(`http://localhost:4000/api/teams/invite/${code}`);
                if (res.data) {
                    setInviteCode(String(code).toUpperCase());
                    setSelectedTeam(res.data);
                    setIsViewModalOpen(true);
                }
            } catch (err) {
                addToast(err.response?.data?.message || 'Código de invitación inválido', 'error');
            }
        };
        fetchTeamByInvite();
    }, [location.search, addToast]);

    // --- CONFIGURACIÓN VISUAL POR CATEGORÍA ---
    const getTeamConfig = (level) => {
        const l = level?.toLowerCase();
        if (l?.includes('femenino') || l === 'female') return {icon: <FaVenus />, styleClass: "card-female" };
        if (l?.includes('masculino') || l === 'male') return {icon: <FaVenus />, styleClass: "card-female" };
        if (l?.includes('universitario')) return { icon: <FaUserGraduate />, styleClass: "card-university" };
        if (l?.includes('profesional') || l === 'expert') return { icon: <FaFire />, styleClass: "card-expert" };
        if (l?.includes('leyenda') || l === 'legend') return { icon: <FaCrown />, styleClass: "card-legend" };
        return { icon: <FaLeaf />, styleClass: "card-standard" };
    };

    // --- FILTRADO ---
    // --- FILTRADO ACTUALIZADO ---
const filteredTeams = teams.filter(team => {
    // Convertimos todo a minúsculas para una comparación segura
    const category = team.teamLevel?.toLowerCase() || "";
    const gender = team.teamGender?.toLowerCase() || "";
    const searchLower = search.toLowerCase();

    // Lógica del Tab: Si es 'all' pasa todo, si no, busca coincidencia en nivel o género
    const matchesTab = activeTab === 'all' || 
                       category.includes(activeTab) || 
                       gender === activeTab;

    // Lógica de Búsqueda
    const matchesSearch = team.name.toLowerCase().includes(searchLower) || 
                          team.game.toLowerCase().includes(searchLower);

    return matchesTab && matchesSearch;
});

    return (
        <div className="teams-dashboard-layout">
            <main className="dashboard-content">
                <header className="content-header">
                    <div>
                        <h1>HUB DE EQUIPOS</h1>
                        <p>Explora las escuadras activas en la plataforma.</p>
                    </div>
                    
                    <div className="search-container">
                        <FaSearch className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o juego..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </header>

            <div className="category-pills">
                <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>Todos</button>
                
                {/* Filtros por Género */}
                <button className={activeTab === 'mixto' ? 'active' : ''} onClick={() => setActiveTab('mixto')}>Mixto</button>
                <button className={activeTab === 'femenino' ? 'active' : ''} onClick={() => setActiveTab('femenino')}>Femenino</button>
                <button className={activeTab === 'masculino' ? 'active' : ''} onClick={() => setActiveTab('masculino')}>Masculino</button>

                <div className="pill-divider"></div> {/* Opcional: una pequeña línea divisoria en CSS */}

                {/* Filtros por Nivel de Competición */}
                <button className={activeTab === 'casual' ? 'active' : ''} onClick={() => setActiveTab('casual')}>Casual</button>
                <button className={activeTab === 'amateur' ? 'active' : ''} onClick={() => setActiveTab('amateur')}>Amateur</button>
                <button className={activeTab === 'universitario' ? 'active' : ''} onClick={() => setActiveTab('universitario')}>Universitario</button>
                <button className={activeTab === 'semi-pro' ? 'active' : ''} onClick={() => setActiveTab('semi-pro')}>Semi-Pro</button>
                <button className={activeTab === 'profesional' ? 'active' : ''} onClick={() => setActiveTab('profesional')}>Pro</button>
            </div>

                {/* --- RENDERIZADO CONDICIONAL --- */}
                {loading ? (
                    <div className="loading-container">
                        <div className="scanner-line"></div>
                        <span>Sincronizando Base de Datos...</span>
                    </div>
                ) : error ? (
                    <div className="empty-state-container">
                        <FaExclamationTriangle style={{fontSize: '50px', color: '#ff4b4b'}} />
                        <h2>Error de Conexión</h2>
                        <p>No pudimos conectar con el servidor en el puerto 4000.</p>
                    </div>
                ) : filteredTeams.length > 0 ? (
                    <div className="teams-grid-pro">
                        {filteredTeams.map(team => {
                            const config = getTeamConfig(team.teamLevel);
                            const starters = Array.isArray(team.roster?.starters) ? team.roster.starters : [];
                            const subs = Array.isArray(team.roster?.subs) ? team.roster.subs : [];
                            const coach = team.roster?.coach;
                            const startersFilled = starters.filter(p => p && (p.nickname || p.user)).length;
                            const subsFilled = subs.filter(p => p && (p.nickname || p.user)).length;
                            const coachFilled = Boolean(coach && (coach.nickname || coach.user));
                            const startersTotal = Number.isFinite(Number(team.maxMembers)) && Number(team.maxMembers) > 0
                                ? Number(team.maxMembers)
                                : starters.length;
                            const subsTotal = Number.isFinite(Number(team.maxSubstitutes)) && Number(team.maxSubstitutes) > 0
                                ? Number(team.maxSubstitutes)
                                : subs.length;
                            const totalSlots = startersTotal + subsTotal + 1;
                            const filledSlots = startersFilled + subsFilled + (coachFilled ? 1 : 0);
                            const isComplete = totalSlots > 0 && filledSlots >= totalSlots;
                            const isMember = isUserMember(team);
                            return (
                                <div key={team._id} className={`team-card-banner ${config.styleClass}`} 
                                     onClick={() => { setSelectedTeam(team); setIsPreviewOpen(true); }}>
                                    <div className="card-bg-glow"></div>
                                    <div className="card-top-row">
                                        <div className="team-identity">
                                            <div className="team-logo-circle">
                                                {team.logo ? <img src={team.logo} alt="logo"/> : team.name.substring(0,2).toUpperCase()}
                                            </div>
                                            <div className="team-texts">
                                                <h3>{team.name}</h3>
                                                <span className="game-label">{team.game}</span>
                                                <span className="team-category-label">{team.category || 'Sin categoría'}</span>
                                            </div>
                                        </div>
                                        <div className="rank-badge">{config.icon}</div>
                                    </div>

                                    <div className="roster-preview">
                                        {/* Renderizamos avatares basados en los miembros del roster */}
                                        {starters.slice(0, startersTotal).map((player, idx) => (
                                            player && (
                                                <div key={`st-${idx}`} className="member-avatar-stack" style={{zIndex: 10 - idx}}>
                                                    <img src={player.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.nickname || idx}`} alt="p" />
                                                </div>
                                            )
                                        ))}
                                    </div>

                                    <div className="card-footer-row">
                                        <span className="coach-label">COACH: {team.roster?.coach?.nickname || "Sin asignar"}</span>
                                        <span className={`roster-status ${isComplete ? 'complete' : 'incomplete'}`}>
                                            Roster {filledSlots}/{totalSlots}
                                        </span>
                                        <span className="roster-status subtle">
                                            Titulares {startersFilled}/{startersTotal || 0} • Suplentes {subsFilled}/{subsTotal || 0} • Coach {coachFilled ? '1/1' : '0/1'}
                                        </span>
                                        <button
                                            className="btn-view-mini"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTeam(team);
                                                setIsViewModalOpen(true);
                                            }}
                                        >
                                            {isMember ? 'Ver' : 'Unirse'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* --- ESTADO FANTASMA 404 --- */
                    <div className="empty-state-container fade-in">
                        <div className="ghost-icon-wrapper">
                            <FaGhost className="ghost-icon" />
                            <div className="ghost-shadow"></div>
                        </div>
                        <h2>404 - SIN ESCUADRAS</h2>
                        <p>Parece que este sector está desierto. ¿Quieres fundar el primer equipo?</p>
                        <button className="btn-primary-glow" style={{marginTop: '20px'}} onClick={() => navigate('/create-team')}>
                            DESPLEGAR NUEVA ESCUADRA
                        </button>
                    </div>
                )}
            </main>

            <aside className="dashboard-sidebar-right">
                <button className="btn-create-mega" onClick={() => navigate('/create-team')}>
                    <FaPlus /> CREAR EQUIPO
                </button>

                <div className="sidebar-widget">
                    <h3><FaChartLine /> Stats Globales</h3>
                    <div className="ranking-box">
                        <span>{teams.length}</span>
                        <small>Equipos Registrados</small>
                    </div>
                </div>

                <div className="sidebar-widget calendar-widget">
                    <h3><FaCalendarAlt /> Próximas Scrims</h3>
                    <div className="mini-event">
                        <span className="time">LIVE</span>
                        <div className="details"><strong>No hay eventos</strong><small>Agenda vacía</small></div>
                    </div>
                </div>
            </aside>

            {selectedTeam && (
                <ViewTeamModal 
                    isOpen={isViewModalOpen} 
                    onClose={() => {
                        setIsViewModalOpen(false);
                        setInviteCode('');
                    }} 
                    team={selectedTeam}
                    currentUser={currentUser}
                    initialInviteCode={inviteCode}
                    onTeamUpdated={(updated) => {
                        setSelectedTeam(updated);
                        setTeams((prev) => prev.map(t => String(t._id) === String(updated._id) ? updated : t));
                    }}
                />
            )}

            {selectedTeam && isPreviewOpen && (
                <div className="modal-overlay" onClick={() => setIsPreviewOpen(false)}>
                    <div className="modal-content-dark" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-text">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2>{selectedTeam.name}</h2>
                                <button className="btn-close-x" onClick={() => setIsPreviewOpen(false)}>&times;</button>
                            </div>
                            <p className="team-game-tag">{selectedTeam.game?.toUpperCase() || 'SIN JUEGO'}</p>
                        </div>

                        <div className="team-info-body">
                            <div className="info-section">
                                <label>Categoría</label>
                                {isPreviewEditing ? (
                                    <input
                                        className="preview-input"
                                        value={previewForm.category || ''}
                                        onChange={(e) => setPreviewForm({ ...previewForm, category: e.target.value })}
                                    />
                                ) : (
                                    <p>{selectedTeam.category || 'Sin categoría'}</p>
                                )}
                            </div>
                            <div className="info-section">
                                <label>País / Región</label>
                                {isPreviewEditing ? (
                                    <input
                                        className="preview-input"
                                        value={previewForm.teamCountry || ''}
                                        onChange={(e) => setPreviewForm({ ...previewForm, teamCountry: e.target.value })}
                                    />
                                ) : (
                                    <p>{selectedTeam.teamCountry || 'No definido'}</p>
                                )}
                            </div>
                            <div className="info-section">
                                <label>Nivel</label>
                                {isPreviewEditing ? (
                                    <input
                                        className="preview-input"
                                        value={previewForm.teamLevel || ''}
                                        onChange={(e) => setPreviewForm({ ...previewForm, teamLevel: e.target.value })}
                                    />
                                ) : (
                                    <p>{selectedTeam.teamLevel || 'No definido'}</p>
                                )}
                            </div>
                            {isPreviewEditing && (
                                <div className="info-section">
                                    <label>Logo del equipo</label>
                                    <div className="logo-upload-row">
                                        <div className="logo-preview-box">
                                            {logoPreview || selectedTeam.logo ? (
                                                <img src={logoPreview || selectedTeam.logo} alt="Logo equipo" />
                                            ) : (
                                                <span>Sin logo</span>
                                            )}
                                        </div>
                                        <input type="file" accept="image/*" onChange={handleLogoChange} />
                                    </div>
                                </div>
                            )}
                            <div className="info-section">
                                <label>Roster</label>
                                <div className="members-scroll-list">
                                    {(() => {
                                        const captainId = selectedTeam?.captain?._id || selectedTeam?.captain;
                                        const isCaptain = currentUser?._id && String(captainId) === String(currentUser._id);
                                        const isAdmin = Boolean(currentUser?.isAdmin);
                                        const canManage = isCaptain || isAdmin;
                                        const captainFromRoster = (selectedTeam?.roster?.starters || []).find(p => String(p?.user) === String(captainId));
                                        const captainName = selectedTeam?.captain?.fullName || captainFromRoster?.nickname || 'No definido';
                                        const captainRole = captainFromRoster?.role || 'Capitán';
                                        const captainRegion = captainFromRoster?.region || '';
                                        return (
                                            <div className="member-row-item">
                                                <div className="member-avatar">
                                                    <i className='bx bxs-crown'></i>
                                                </div>
                                                <div className="member-info">
                                                    <span className="member-name">{captainName}</span>
                                                    <span className="role-badge">{captainRole}</span>
                                                    {captainRegion && <span className="member-meta">Región: {captainRegion}</span>}
                                                    {canManage && captainFromRoster?.gameId && (
                                                        <span className="member-meta">Riot ID: {captainFromRoster.gameId}</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    {(() => {
                                        const starters = Array.isArray(selectedTeam.roster?.starters) ? selectedTeam.roster.starters : [];
                                        const subs = Array.isArray(selectedTeam.roster?.subs) ? selectedTeam.roster.subs : [];
                                        const captainId = selectedTeam?.captain?._id || selectedTeam?.captain;
                                        const isCaptain = currentUser?._id && String(captainId) === String(currentUser._id);
                                        const isAdmin = Boolean(currentUser?.isAdmin);
                                        const canManage = isCaptain || isAdmin;
                                        const starterSlots = Number.isFinite(Number(selectedTeam.maxMembers)) && Number(selectedTeam.maxMembers) > 0
                                            ? Number(selectedTeam.maxMembers)
                                            : starters.length;
                                        const subSlots = Number.isFinite(Number(selectedTeam.maxSubstitutes)) && Number(selectedTeam.maxSubstitutes) > 0
                                            ? Number(selectedTeam.maxSubstitutes)
                                            : subs.length;
                                        const roles = ROLE_NAMES[selectedTeam.game] || [];
                                        const rows = [];
                                        for (let i = 0; i < starterSlots; i += 1) {
                                            const p = starters[i];
                                            rows.push(
                                                <div key={`p-${i}`} className={`member-row-item ${p ? '' : 'empty'}`}>
                                                    <div className="member-avatar">
                                                        <i className='bx bxs-user-circle'></i>
                                                    </div>
                                                    <div className="member-info">
                                                        <span className="member-name">{p?.nickname || 'Vacante'}</span>
                                                        <span className="role-badge">{p?.role || roles[i] || `Titular ${i + 1}`}</span>
                                                        {p?.region && <span className="member-meta">Región: {p.region}</span>}
                                                        {canManage && p?.gameId && <span className="member-meta">Riot ID: {p.gameId}</span>}
                                                    </div>
                                                    <span className="member-meta">Titular</span>
                                                </div>
                                            );
                                        }
                                        for (let i = 0; i < subSlots; i += 1) {
                                            const p = subs[i];
                                            rows.push(
                                                <div key={`s-${i}`} className={`member-row-item ${p ? '' : 'empty'}`}>
                                                    <div className="member-avatar">
                                                        <i className='bx bxs-user-voice'></i>
                                                    </div>
                                                    <div className="member-info">
                                                        <span className="member-name">{p?.nickname || 'Vacante'}</span>
                                                        <span className="role-badge">{p?.role || `Suplente ${i + 1}`}</span>
                                                        {p?.region && <span className="member-meta">Región: {p.region}</span>}
                                                        {canManage && p?.gameId && <span className="member-meta">Riot ID: {p.gameId}</span>}
                                                    </div>
                                                    <span className="member-meta">Suplente</span>
                                                </div>
                                            );
                                        }
                                        const coach = selectedTeam.roster?.coach;
                                        rows.push(
                                            <div key="coach" className={`member-row-item ${coach ? '' : 'empty'}`}>
                                                <div className="member-avatar">
                                                    <i className='bx bxs-user-badge'></i>
                                                </div>
                                                <div className="member-info">
                                                    <span className="member-name">{coach?.nickname || 'Vacante'}</span>
                                                    <span className="role-badge">{coach?.role || 'Coach'}</span>
                                                    {coach?.region && <span className="member-meta">Región: {coach.region}</span>}
                                                    {canManage && coach?.gameId && <span className="member-meta">Riot ID: {coach.gameId}</span>}
                                                </div>
                                                <span className="member-meta">Coach</span>
                                            </div>
                                        );
                                        return rows;
                                    })()}
                                </div>
                            </div>
                        </div>

                        {(() => {
                            const captainId = selectedTeam?.captain?._id || selectedTeam?.captain;
                            const isCaptain = currentUser?._id && String(captainId) === String(currentUser._id);
                            const isAdmin = Boolean(currentUser?.isAdmin);
                            const canManage = isCaptain || isAdmin;
                            const pendingRequests = getPendingRequests(selectedTeam);
                            if (!canManage || pendingRequests.length === 0) return null;
                            return (
                                <div className="info-section">
                                    <label>Solicitudes pendientes</label>
                                    <div className="members-scroll-list">
                                        {pendingRequests.map((r) => (
                                            <div key={r._id} className="member-row-item">
                                                <div className="member-info">
                                                    <span className="member-name">{r.player?.nickname || 'Jugador'}</span>
                                                    <span className="captain-badge">{r.player?.role || 'Rol'}</span>
                                                </div>
                                                <div className="request-actions">
                                                    <button className="btn-primary-small" onClick={() => handleRequestAction(selectedTeam._id, r._id, 'approve')}>
                                                        Aprobar
                                                    </button>
                                                    <button className="btn-secondary-small" onClick={() => handleRequestAction(selectedTeam._id, r._id, 'reject')}>
                                                        Rechazar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="modal-actions">
                            <button className="btn-primary-small" onClick={() => setIsPreviewOpen(false)}>CERRAR</button>
                            {(currentUser?.isAdmin || String(selectedTeam.captain?._id || selectedTeam.captain) === String(currentUser?._id)) && (
                                <>
                                    <button
                                        className="btn-secondary-small"
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
                                                    `http://localhost:4000/api/teams/${selectedTeam._id}`,
                                                    previewForm,
                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                );
                                                updated = res.data.team || updated;
                                                if (logoFile) {
                                                    const data = new FormData();
                                                    data.append('logo', logoFile);
                                                    const resLogo = await axios.patch(
                                                        `http://localhost:4000/api/teams/${selectedTeam._id}/logo`,
                                                        data,
                                                        { headers: { Authorization: `Bearer ${token}` } }
                                                    );
                                                    updated = resLogo.data.team || updated;
                                                }
                                                setSelectedTeam(updated);
                                                setTeams((prev) => prev.map(t => String(t._id) === String(updated._id) ? updated : t));
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
                                        className="btn-danger-action"
                                        onClick={async () => {
                                            const ok = window.confirm('¿Eliminar este equipo?');
                                            if (!ok) return;
                                            try {
                                                const token = localStorage.getItem('token');
                                                await axios.delete(`http://localhost:4000/api/teams/${selectedTeam._id}`, {
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });
                                                setTeams((prev) => prev.filter(t => String(t._id) !== String(selectedTeam._id)));
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
            )}
        </div>
    );
};

export default Team;
