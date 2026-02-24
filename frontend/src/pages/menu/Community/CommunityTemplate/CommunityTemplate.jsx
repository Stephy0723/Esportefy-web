import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    FaUsers, FaCircle, FaEllipsisH, FaSearch, FaPen, 
    FaFire, FaGavel, FaGamepad, FaImage, FaShareAlt, FaMapMarkerAlt, 
    FaBriefcase, 
    FaCheck, FaInfoCircle, FaUserShield, FaClock, FaGlobe,
    FaTrophy, FaCalendarAlt, FaClipboardList, FaChessBoard,
    FaFilePdf, FaExclamationTriangle
} from 'react-icons/fa';
import './CommunityTemplate.css';

// --- DATOS MOCK ---
const TOURNAMENTS_DATA = [
    {
        id: 1, name: "Copa Invierno Valorant 2024", status: "active",
        participants: "16/32", logo: "https://cdn-icons-png.flaticon.com/512/3176/3176218.png",
        banner: "https://via.placeholder.com/800x300/000/8EDB15?text=VALORANT+CUP",
        date: "Finaliza 20 Oct", organizer: "Esportefy Staff"
    },
    {
        id: 2, name: "Liga Rocket League", status: "finished",
        participants: "8/8", logo: "https://cdn-icons-png.flaticon.com/512/1693/1693244.png",
        banner: "https://via.placeholder.com/800x300/111/333?text=RL+WEEKLY",
        date: "Finalizado", organizer: "RL Community"
    }
];

const CommunityTemplate = () => {
    const [activeTab, setActiveTab] = useState('feed'); 
    const [isJoined, setIsJoined] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const location = useLocation(); 
    const navigate = useNavigate(); 


    // --- DATOS ---
    const incomingData = location.state || {};
    const communityData = {
        name: incomingData.name || "Neoxys Esport",
        tagline: incomingData.tagline || "Comunidad Competitiva Oficial",
        description: incomingData.description || "Sin descripción.",
        banner: incomingData.banner || "https://via.placeholder.com/1200x350/000/000",
        avatar: incomingData.avatar || "https://via.placeholder.com/150/8EDB15/000",
        stats: incomingData.stats || { members: 1240, online: 45 },
        created_at: incomingData.created_at || "2024",
        rules: incomingData.settings?.rules || "1. Respeto.\n2. No toxicidad.",
        admins: incomingData.admins || ["Admin"], 
        region: incomingData.region || "Global",
        games: incomingData.settings?.games || []
    };
    const communitySlug = incomingData?.slug || communityData.name.toLowerCase().replace(/\s+/g, '-');


    // --- 💎 VARIABLES CSS DINÁMICAS (CERO ESTILOS INLINE ABAJO) ---
    const dynamicStyles = {
        '--hero-banner': `url(${communityData.banner})`,
        '--hero-avatar': `url(${communityData.avatar})`
    };

    const handleJoin = () => setIsJoined(!isJoined);

    // --- RENDERIZADORES ---
    const renderTournaments = () => (
        <div className="full-width-tab fade-in">
            <div className="section-header-tech">
                <h3><FaTrophy className="neon-icon"/> Torneos Activos</h3>
            </div>
            <div className="tournaments-grid">
                {TOURNAMENTS_DATA.map(t => (
                    <div key={t.id} className={`tournament-card-tech ${t.status}`}>
                        <div className="t-banner-tech" style={{'--t-bg': `url(${t.banner})`}}>
                            <div className="t-overlay"></div>
                            <span className="t-badge">{t.status === 'active' ? 'EN VIVO' : 'FINALIZADO'}</span>
                            <img src={t.logo} alt="logo" className="t-logo-float"/>
                        </div>
                        <div className="t-body">
                            <h4>{t.name}</h4>
                            <div className="t-meta">
                                <span><FaUserShield/> {t.organizer}</span>
                                <span><FaCalendarAlt/> {t.date}</span>
                            </div>
                            <div className="t-actions">
                                <button className="btn-tech primary">Ver Bracket</button>
                                <button className="btn-tech ghost">Detalles</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderFeed = () => (
        <>
            <section className="feed-column fade-in">
                {isJoined && (
                    <div className="create-post-tech">
                        <div className="cp-avatar-tech"></div>
                        <div className="cp-input-tech">Comparte tu jugada...</div>
                        <div className="cp-icons">
                            <button><FaGamepad/></button>
                            <button><FaImage/></button>
                        </div>
                    </div>
                )}
                <div className="feed-filters-tech">
                    <button className="tech-chip active"><FaFire/> Trending</button>
                    <button className="tech-chip">Nuevos</button>
                    <button className="tech-chip">Clips</button>
                </div>
                <div className="empty-state-tech">
                    <FaPen className="empty-icon"/>
                    <h3>Sin actividad reciente</h3>
                    <p>Sé el primero en publicar en {communityData.name}</p>
                </div>
            </section>
            <aside className="sidebar-column fade-in">
                <div className="widget-tech">
                    <div className="widget-header"><h4><FaInfoCircle/> Sobre Nosotros</h4></div>
                    <div className="widget-body">
                        <p>{communityData.tagline}</p>
                        <div className="meta-stats-row">
                            <span><FaGlobe/> {communityData.region}</span>
                            <span><FaClock/> {communityData.created_at}</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
    // ==========================================
    // ℹ️ RENDER: ABOUT (INFO DETALLADA)
    // ==========================================
    const renderAbout = () => (
        <div className="full-width-tab fade-in">
            <div className="about-tech-container">
                {/* Cabecera Info */}
                <div className="tech-section-header">
                    <div className="header-icon-box">
                        <FaInfoCircle />
                    </div>
                    <div>
                        <h3>Información de la Comunidad</h3>
                        <p>Todo lo que necesitas saber sobre {communityData.name}</p>
                    </div>
                </div>

                {/* Grid de Estadísticas y Descripción */}
                <div className="about-grid">
                    <div className="about-main-card">
                        <h4>Manifiesto</h4>
                        <p className="about-desc">{communityData.description}</p>
                        
                        <div className="tech-separator"></div>

                        <h4>Juegos Principales</h4>
                        <div className="games-tag-cloud">
                            {/* Si no hay juegos, mostramos algunos por defecto para el demo */}
                            {(communityData.games.length > 0 ? communityData.games : ["Valorant", "LoL", "CS2", "Minecraft"]).map((game, i) => (
                                <span key={i} className="game-tech-tag">
                                    <FaGamepad className="tiny-icon"/> {game}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="about-stats-column">
                        <div className="stat-tech-card">
                            <span className="stat-label">Región</span>
                            <div className="stat-value"><FaMapMarkerAlt/> {communityData.region}</div>
                        </div>
                        <div className="stat-tech-card">
                            <span className="stat-label">Miembros</span>
                            <div className="stat-value neon">{communityData.stats.members}</div>
                        </div>
                        <div className="stat-tech-card">
                            <span className="stat-label">Fundación</span>
                            <div className="stat-value">{communityData.created_at}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // ==========================================
    // 🛡️ RENDER: STAFF & RECLUTAMIENTO
    // ==========================================
    const renderStaff = () => (
        <div className="full-width-tab fade-in">
            <div className="staff-tech-wrapper">
                
                {/* 1. LISTA DE ADMINS */}
                <div className="tech-section-header">
                    <h3><FaUserShield className="neon-icon"/> Equipo Administrativo</h3>
                </div>

                <div className="staff-grid">
                    {communityData.admins.map((admin, idx) => (
                        <div key={idx} className="staff-card-tech">
                            <div className="staff-bg-effect"></div>
                            <div className="staff-avatar-placeholder">
                                {admin.charAt(0).toUpperCase()}
                            </div>
                            <div className="staff-details">
                                <h4>{admin}</h4>
                                <span className="role-badge owner">ADMINISTRADOR</span>
                            </div>
                        </div>
                    ))}
                    
                    {/* Tarjeta de Moderador Demo (Para que se vea lleno) */}
                    <div className="staff-card-tech">
                        <div className="staff-bg-effect"></div>
                        <div className="staff-avatar-placeholder mod">M</div>
                        <div className="staff-details">
                            <h4>Mod_Tester</h4>
                            <span className="role-badge mod">MODERADOR</span>
                        </div>
                    </div>
                </div>

                {/* 2. SECCIÓN DE APLICAR (RECRUITMENT) */}
                <div className="recruitment-section">
                    <div className="recruitment-box">
                        <div className="recruit-content">
                            <div className="recruit-icon">
                                <FaBriefcase />
                            </div>
                            <div>
                                <h3>¿Quieres unirte al Staff?</h3>
                                <p>Estamos buscando moderadores y organizadores de torneos comprometidos.</p>
                            </div>
                        </div>
                        <button className="btn-tech primary recruitment-btn">
                            <FaPen /> APLICAR AHORA
                        </button>
                        <button
  className="btn-tech glass"
  onClick={() =>
    navigate(`/community/${communitySlug}/admin`, {
      state: { ...incomingData, ...communityData, slug: communitySlug }
    })
  }
>
  Panel Admin
</button>

                    </div>
                </div>

            </div>
        </div>
    );

 const renderRules = () => (
        <div className="full-width-tab fade-in">
            <div className="rules-container-tech">
                {/* CABECERA */}
                <div className="rules-header">
                    <div className="icon-glow">
                        <FaGavel className="big-icon"/>
                    </div>
                    <div>
                        <h3>Reglamento Oficial</h3>
                        <p>El desconocimiento no exime de culpa.</p>
                    </div>
                </div>

                <div className="rules-grid">
                    {/* LISTA DE REGLAS (Izquierda) */}
                    <div className="rules-list">
                        {communityData.rules.split('\n')
                            .filter(r => r.trim() !== '') // Elimina líneas vacías
                            .map((r, i) => (
                                <div key={i} className="rule-card">
                                    {/* Genera 01, 02, 10, etc. */}
                                    <span className="rule-num">{String(i + 1).padStart(2, '0')}</span>
                                    <p>{r}</p>
                                </div>
                        ))}
                    </div>

                    {/* BOTONES DE ACCIÓN (Derecha) */}
                    <div className="rules-actions">
                        <div className="action-box warning">
                            <FaExclamationTriangle className="action-icon"/>
                            <span>Reportar Conducta</span>
                        </div>
                        <div className="action-box info">
                            <FaFilePdf className="action-icon"/>
                            <span>Descargar PDF</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- RENDER PRINCIPAL ---
    return (
        <div className="community-layout" style={dynamicStyles}>
            <header className="tech-header">
                {/* Banner usa variable --hero-banner */}
                <div className="hero-banner">
                    <div className="scanline"></div>
                    <div className="hero-overlay"></div>
                </div>

                <div className="header-content container-limit">
                    <div className="profile-grid">
                        <div className="avatar-container">
                            {/* Avatar usa variable --hero-avatar */}
                            <div className="tech-avatar"></div>
                            <div className="status-light"></div>
                        </div>

                        <div className="profile-info">
                            <h1 className="glitch-text">{communityData.name}</h1>
                            <div className="badges-row">
                                <span className="tech-badge official">OFICIAL</span>
                                <span className="tech-badge region">{communityData.region}</span>
                            </div>
                            <div className="stats-row">
                                <span className="stat"><strong className="neon-text">{communityData.stats.members}</strong> Miembros</span>
                                <span className="stat"><strong className="neon-text">{communityData.stats.online}</strong> Online</span>
                            </div>
                        </div>

                        <div className="profile-actions">
                            <button className="btn-tech glass"><FaShareAlt/> Compartir</button>
                            <button className={`btn-tech neon ${isJoined ? 'active' : ''}`} onClick={handleJoin}>
                                {isJoined ? "MIEMBRO" : "UNIRSE"}
                            </button>
                            <button className="btn-tech glass icon-only"><FaEllipsisH/></button>
                        </div>
                    </div>
                </div>

                <div className="tech-nav-bar">
    <div className="container-limit nav-flex">
        {/* AGREGUÉ CLASE AQUÍ PARA FORZAR EL FLEXBOX */}
        <nav className="nav-menu-container">
            {['feed', 'tournaments', 'about', 'rules', 'staff'].map(tab => (
                <button 
                    key={tab}
                    className={`nav-btn ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                >
                    {tab.toUpperCase()}
                </button>
            ))}
        </nav>

        <div className="search-box">
            <FaSearch/>
            <input 
                type="text" 
                placeholder="BUSCAR..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
            />
        </div>
    </div>
</div>
            </header>

            <main className="main-content container-limit">
                {activeTab === 'feed' && renderFeed()}
                {activeTab === 'tournaments' && renderTournaments()}
                {activeTab === 'rules' && renderRules()}
                {activeTab === 'about' && renderAbout()}
                {activeTab === 'staff' && renderStaff()}
            </main>
        </div>
    );
};

export default CommunityTemplate;