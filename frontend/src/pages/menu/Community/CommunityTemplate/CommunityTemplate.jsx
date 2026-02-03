import React, { useState } from 'react';
import { useLocation } from 'react-router-dom'; 
import { 
    FaUsers, FaCircle, FaEllipsisH, FaSearch, FaPen, 
    FaFire, FaGavel, FaGamepad, FaImage, FaShareAlt,
    FaCheck, FaInfoCircle, FaUserShield, FaClock, FaGlobe,
    FaTrophy, FaCalendarAlt, FaClipboardList, FaChessBoard
} from 'react-icons/fa';
import './CommunityTemplate.css';

// --- DATOS MOCK DE TORNEOS (Simulación de DB) ---
const TOURNAMENTS_DATA = [
    {
        id: 1,
        name: "Copa Invierno Valorant 2024",
        status: "active", // active, finished
        participants: "16/32",
        logo: "https://cdn-icons-png.flaticon.com/512/3176/3176218.png",
        banner: "https://via.placeholder.com/800x300/000/8EDB15?text=VALORANT+CUP",
        date: "En Curso - Finaliza 20 Oct",
        organizer: "Esportefy Staff"
    },
    {
        id: 2,
        name: "Liga Semanal Rocket League",
        status: "finished",
        participants: "8/8",
        logo: "https://cdn-icons-png.flaticon.com/512/1693/1693244.png",
        banner: "https://via.placeholder.com/800x300/111/333?text=RL+WEEKLY",
        date: "Finalizado el 10 Oct",
        organizer: "RL Community"
    }
];

const CommunityTemplate = () => {
    // --- ESTADOS ---
    const [activeTab, setActiveTab] = useState('feed'); 
    const [isJoined, setIsJoined] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const location = useLocation(); 

    // --- RECUPERACIÓN DE DATOS ---
    const incomingData = location.state || {};
    const communityData = {
        name: incomingData.name || "Comunidad Demo",
        tagline: incomingData.tagline || "Bienvenido a tu nueva comunidad.",
        description: incomingData.description || incomingData.tagline || "Sin descripción detallada.",
        banner: incomingData.banner || "https://via.placeholder.com/1200x350/121214/222?text=Sin+Banner",
        avatar: incomingData.avatar || "https://via.placeholder.com/150/8EDB15/000?text=LOGO",
        stats: incomingData.stats || { members: 1, online: 1 },
        created_at: incomingData.created_at || "Recién creada",
        rules: incomingData.settings?.rules || "No hay reglas definidas.",
        admins: incomingData.admins || ["Tú (Owner)"], 
        region: incomingData.region || "Global",
        games: incomingData.settings?.games || []
    };

    const handleJoin = () => setIsJoined(!isJoined);

    // =========================================================
    // 🏆 CONST: RENDERIZADOR DE TORNEOS (La Pestaña Deportiva)
    // =========================================================
    const renderTournaments = () => (
        <div className="full-width-tab fade-in">
            {/* Cabecera de Sección */}
            <div className="section-header-sports">
                <h3><FaTrophy className="gold-icon"/> Competición & Eventos</h3>
                <p>Torneos oficiales organizados por {communityData.name}</p>
            </div>

            <div className="tournaments-grid-layout">
                {TOURNAMENTS_DATA.map(tournament => (
                    <div key={tournament.id} className={`tournament-card-pro ${tournament.status}`}>
                        {/* Banner y Estado */}
                        <div className="t-banner-wrapper" style={{backgroundImage: `url(${tournament.banner})`}}>
                            <div className="t-overlay"></div>
                            <span className={`t-status-badge ${tournament.status}`}>
                                {tournament.status === 'active' ? '🔴 EN VIVO' : '🏁 FINALIZADO'}
                            </span>
                            <img src={tournament.logo} alt="T-Logo" className="t-floating-logo" />
                        </div>

                        {/* Info del Torneo */}
                        <div className="t-info-body">
                            <h4>{tournament.name}</h4>
                            <div className="t-meta-row">
                                <span><FaUserShield/> Org: {tournament.organizer}</span>
                                <span><FaCalendarAlt/> {tournament.date}</span>
                            </div>
                            
                            {/* Botonera de Acción */}
                            <div className="t-actions-row">
                                <button className="btn-t-primary">
                                    <FaUsers/> Ver Equipos ({tournament.participants})
                                </button>
                                <button className="btn-t-glass">
                                    <FaClipboardList/> Reportes
                                </button>
                                <button className="btn-t-glass">
                                    <FaChessBoard/> Draft
                                </button>
                                <button className="btn-t-ghost">
                                    + Más Info
                                </button>
                            </div>
                        </div>

                        {/* Footer con "Tachado/Badge" visual (Feed filtrado simulado) */}
                        <div className="t-feed-preview">
                            <small>Última actividad en el torneo:</small>
                            <div className="t-feed-item">
                                <span className="t-tag-badge">🏆 {tournament.name}</span>
                                <span>Resultados de la Ronda 3 publicados...</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // --- OTROS RENDERIZADORES ---
    const renderFeed = () => (
        <>
            <section className="feed-column fade-in">
                {isJoined && (
                    <div className="create-post-box">
                        <div className="cp-avatar" style={{backgroundImage: `url(${communityData.avatar})`, backgroundSize:'cover'}}></div>
                        <div className="cp-input-trigger">Publicar en {communityData.name}...</div>
                        <button className="cp-btn-icon"><FaGamepad /></button>
                        <button className="cp-btn-icon"><FaImage /></button>
                    </div>
                )}
                <div className="feed-filters-bar">
                    <button className="filter-chip active"><FaFire /> Destacado</button>
                    <button className="filter-chip">Nuevos</button>
                </div>
                <div className="empty-state-feed">
                    <div className="empty-icon"><FaPen /></div>
                    <h3>Aún no hay publicaciones</h3>
                    <p>¡Sé el primero en inaugurar {communityData.name}!</p>
                </div>
            </section>
            <aside className="sidebar-column fade-in">
                <div className="sidebar-widget">
                    <div className="widget-header"><h4>Acerca de</h4></div>
                    <div className="widget-body">
                        <p className="sidebar-desc">{communityData.tagline}</p>
                        <div className="sidebar-meta">
                            <div className="meta-item"><FaClock /> Creada: {communityData.created_at}</div>
                            <div className="meta-item"><FaGlobe /> Región: {communityData.region}</div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );

    const renderAbout = () => (
        <div className="full-width-tab fade-in">
            <div className="content-card">
                <h3><FaInfoCircle /> Información</h3>
                <p className="big-desc">{communityData.description}</p>
                <div className="stats-grid">
                    <div className="stat-box"><h4>{communityData.stats.members}</h4><span>Miembros</span></div>
                    <div className="stat-box"><h4>{communityData.stats.online}</h4><span>Online</span></div>
                    <div className="stat-box"><h4>{communityData.games.length}</h4><span>Juegos</span></div>
                </div>
            </div>
        </div>
    );

    const renderRules = () => (
        <div className="full-width-tab fade-in">
            <div className="content-card">
                <h3><FaGavel /> Normativas</h3>
                <div className="rules-content">
                    {communityData.rules.split('\n').map((rule, index) => (
                        <p key={index} className="rule-paragraph">{rule || "Respeto mutuo y diversión."}</p>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStaff = () => (
        <div className="full-width-tab fade-in">
            <div className="content-card">
                <h3><FaUserShield /> Staff</h3>
                <div className="staff-list">
                    {communityData.admins.map((admin, idx) => (
                        <div key={idx} className="staff-member-row">
                            <div className="staff-avatar-placeholder">{admin.charAt(0).toUpperCase()}</div>
                            <div className="staff-info">
                                <h4>{admin}</h4><span className="role-badge owner">ADMIN</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // --- RENDER PRINCIPAL ---
    return (
        <div className="community-layout">
            <header className="community-header">
                <div className="header-banner" style={{ backgroundImage: `url(${communityData.banner})` }}>
                    <div className="banner-overlay"></div>
                </div>
                <div className="header-info-bar">
                    <div className="container-limit">
                        <div className="info-flex">
                            <div className="community-avatar-wrapper">
                                <img src={communityData.avatar} alt="Logo" className="community-avatar" />
                                <div className="online-indicator" title="Online"></div>
                            </div>
                            <div className="community-texts">
                                <h1 className="community-title">{communityData.name} <span className="verified-badge">OFICIAL</span></h1>
                                <p className="community-tagline">{communityData.tagline}</p>
                                <div className="community-stats">
                                    <span><FaUsers /> {communityData.stats.members} Miembros</span>
                                    <span className="stat-separator">•</span>
                                    <span className="highlight-green"><FaCircle size={8} /> {communityData.stats.online} Online</span>
                                </div>
                            </div>
                            <div className="header-actions">
                                <button className="btn-secondary-glass"><FaShareAlt /> Compartir</button>
                                <button className={`btn-primary-neon ${isJoined ? 'joined' : ''}`} onClick={handleJoin}>
                                    {isJoined ? <><FaCheck /> Miembro</> : "Unirse Ahora"}
                                </button>
                                <button className="btn-icon-glass"><FaEllipsisH /></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="community-nav-bar">
                    <div className="container-limit">
                        <nav className="nav-links">
                            <button className={`nav-link ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>Publicaciones</button>
                            
                            {/* NUEVO BOTÓN TORNEOS */}
                            <button className={`nav-link ${activeTab === 'tournaments' ? 'active' : ''}`} onClick={() => setActiveTab('tournaments')}>
                                Torneos
                            </button>

                            <button className={`nav-link ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>Info</button>
                            <button className={`nav-link ${activeTab === 'rules' ? 'active' : ''}`} onClick={() => setActiveTab('rules')}>Reglas</button>
                            <button className={`nav-link ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>Staff</button>
                        </nav>
                        <div className="nav-search">
                            <FaSearch />
                            <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
                        </div>
                    </div>
                </div>
            </header>

            <main className="community-content container-limit">
                {activeTab === 'feed' && renderFeed()}
                {activeTab === 'tournaments' && renderTournaments()} {/* AQUÍ SE RENDERIZA */}
                {activeTab === 'about' && renderAbout()}
                {activeTab === 'rules' && renderRules()}
                {activeTab === 'staff' && renderStaff()}
            </main>
        </div>
    );
};

export default CommunityTemplate;