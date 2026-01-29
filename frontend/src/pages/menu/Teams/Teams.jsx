import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    FaSearch, FaCalendarAlt, FaUserGraduate, FaVenus, FaCrown, 
    FaFire, FaLeaf, FaPlus, FaChartLine, FaGhost, FaExclamationTriangle 
} from 'react-icons/fa';
import './Teams.css';
import ViewTeamModal from './ViewTeamModal'; 

const Team = () => {
    const navigate = useNavigate();
    
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
    const storedUser = localStorage.getItem('esportefyUser');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

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
                            const startersFilled = starters.filter(p => p && p.nickname).length;
                            const startersTotal = starters.length || team.maxMembers || 0;
                            const isComplete = startersTotal > 0 && startersFilled >= startersTotal;
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
                                        {team.roster?.starters?.map((player, idx) => (
                                            player && (
                                                <div key={idx} className="member-avatar-stack" style={{zIndex: 10 - idx}}>
                                                    <img src={player.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.nickname}`} alt="p" />
                                                </div>
                                            )
                                        ))}
                                    </div>

                                    <div className="card-footer-row">
                                        <span className="coach-label">COACH: {team.roster?.coach?.nickname || "Sin asignar"}</span>
                                        <span className={`roster-status ${isComplete ? 'complete' : 'incomplete'}`}>
                                            Roster {startersFilled}/{startersTotal || startersFilled}
                                        </span>
                                        <button
                                            className="btn-view-mini"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTeam(team);
                                                setIsViewModalOpen(true);
                                            }}
                                        >
                                            Unirse
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
                    onClose={() => setIsViewModalOpen(false)} 
                    team={selectedTeam}
                    currentUser={currentUser}
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
                            <div className="info-section">
                                <label>Roster</label>
                                <div className="members-scroll-list">
                                    {(selectedTeam.roster?.starters || []).map((p, i) => (
                                        <div key={`p-${i}`} className="member-row-item">
                                            <div className="member-avatar">
                                                <i className='bx bxs-user-circle'></i>
                                            </div>
                                            <div className="member-info">
                                                <span className="member-name">{p?.nickname || 'Vacante'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

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
                                                setIsPreviewEditing(true);
                                                return;
                                            }
                                            try {
                                                const token = localStorage.getItem('token');
                                                const res = await axios.patch(
                                                    `http://localhost:4000/api/teams/${selectedTeam._id}`,
                                                    previewForm,
                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                );
                                                const updated = res.data.team;
                                                setSelectedTeam(updated);
                                                setTeams((prev) => prev.map(t => String(t._id) === String(updated._id) ? updated : t));
                                                setIsPreviewEditing(false);
                                            } catch (err) {
                                                notify('danger', 'Error', 'No se pudo guardar el equipo');
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
                                                notify('danger', 'Error', 'No se pudo eliminar el equipo');
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
