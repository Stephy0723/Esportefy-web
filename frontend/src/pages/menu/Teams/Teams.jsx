import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    FaSearch, FaCalendarAlt, FaUserGraduate, FaVenus, FaCrown, 
    FaMedal, FaFire, FaLeaf, FaPlus, FaUsers, FaChartLine 
} from 'react-icons/fa';
import './Teams.css';
import ViewTeamModal from './ViewTeamModal'; 

const Team = () => {
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]); // Aquí cargarías desde tu API
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState('all'); 
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // --- SIMULACIÓN DE DATOS (Hasta que conectes el backend) ---
    useEffect(() => {
        // Esto simula lo que te devolvería el backend con el modelo nuevo
        setTeams([
            { _id: 1, name: "Valkyries", game: "Valorant", category: "female", coach: "Ana Stark", members: [1,2,3,4,5] },
            { _id: 2, name: "Polytechnic Lions", game: "League of Legends", category: "university", coach: "Prof. X", members: [1,2,3,4,5,6] },
            { _id: 3, name: "Red Devils", game: "CS:GO", category: "expert", coach: "S1mple", members: [1,2,3,4] },
            { _id: 4, name: "Golden Kings", game: "Dota 2", category: "legend", coach: "Puppey", members: [1,2,3,4,5] },
            { _id: 5, name: "Green Roots", game: "FIFA", category: "standard", coach: "Ted Lasso", members: [1] },
        ]);
    }, []);

    const handleGoToCreate = () => navigate('/create-team');
    
    // --- LÓGICA VISUAL ---
    const getTeamConfig = (category) => {
        switch(category) {
            case 'female': return { icon: <FaVenus />, styleClass: "card-female" };
            case 'university': return { icon: <FaUserGraduate />, styleClass: "card-university" };
            case 'expert': return { icon: <FaFire />, styleClass: "card-expert" };
            case 'legend': return { icon: <FaCrown />, styleClass: "card-legend" };
            default: return { icon: <FaLeaf />, styleClass: "card-standard" };
        }
    };

    const filteredTeams = teams.filter(team => 
        (activeTab === 'all' || team.category === activeTab) &&
        (team.name.toLowerCase().includes(search.toLowerCase()) || 
         team.game.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="teams-dashboard-layout">
            
            {/* 1. CONTENIDO PRINCIPAL (AHORA A LA IZQUIERDA) */}
            <main className="dashboard-content">
                
                {/* Header Integrado */}
                <header className="content-header">
                    <div>
                        <h1>HUB DE EQUIPOS</h1>
                        <p>Gestiona, recluta y compite.</p>
                    </div>
                    
                    <div className="search-container">
                        <FaSearch className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Buscar escuadra, torneo o jugador..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </header>

                {/* Filtros Horizontales (Opcional si usas el sidebar) */}
                <div className="category-pills">
                    <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>Todos</button>
                    <button className={activeTab === 'female' ? 'active' : ''} onClick={() => setActiveTab('female')}>Femenino</button>
                    <button className={activeTab === 'university' ? 'active' : ''} onClick={() => setActiveTab('university')}>Universitario</button>
                    <button className={activeTab === 'legend' ? 'active' : ''} onClick={() => setActiveTab('legend')}>Leyendas</button>
                </div>

                {/* GRID DE TARJETAS */}
                <div className="teams-grid-pro">
                    {filteredTeams.map(team => {
                        const config = getTeamConfig(team.category);
                        
                        return (
                            <div key={team._id} className={`team-card-banner ${config.styleClass}`} onClick={() => { setSelectedTeam(team); setIsViewModalOpen(true); }}>
                                {/* Fondo Glow */}
                                <div className="card-bg-glow"></div>

                                <div className="card-top-row">
                                    <div className="team-identity">
                                        <div className="team-logo-circle">
                                            {team.logo ? <img src={team.logo} alt="logo"/> : team.name.substring(0,2)}
                                        </div>
                                        <div className="team-texts">
                                            <h3>{team.name}</h3>
                                            <span className="game-label">{team.game}</span>
                                        </div>
                                    </div>
                                    <div className="rank-badge">{config.icon}</div>
                                </div>

                                {/* Roster Superpuesto */}
                                <div className="roster-preview">
                                    {team.members.map((m, idx) => (
                                        <div key={idx} className="member-avatar-stack" style={{zIndex: 10 - idx}}>
                                            <img src={`https://i.pravatar.cc/150?u=${Math.random()}`} alt="player" />
                                        </div>
                                    ))}
                                </div>

                                <div className="card-footer-row">
                                    <span className="coach-label">COACH: {team.coach}</span>
                                    <button className="btn-view-mini">VER PERFIL</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* 2. SIDEBAR (AHORA A LA DERECHA) */}
            <aside className="dashboard-sidebar-right">
                
                {/* Botón de Acción Principal */}
                <button className="btn-create-mega" onClick={handleGoToCreate}>
                    <FaPlus /> CREAR EQUIPO
                </button>

                <div className="sidebar-widget">
                    <h3><FaChartLine /> Ranking Global</h3>
                    <div className="ranking-box">
                        <span>#42</span>
                        <small>Tu Posición</small>
                    </div>
                </div>

                <div className="sidebar-widget calendar-widget">
                    <h3><FaCalendarAlt /> Eventos Hoy</h3>
                    <div className="mini-event">
                        <span className="time">18:00</span>
                        <div className="details">
                            <strong>Scrim vs Valkyries</strong>
                            <small>Valorant</small>
                        </div>
                    </div>
                    <div className="mini-event">
                        <span className="time">20:00</span>
                        <div className="details">
                            <strong>Torneo Universitario</strong>
                            <small>League of Legends</small>
                        </div>
                    </div>
                </div>
            </aside>

            <ViewTeamModal 
                isOpen={isViewModalOpen} 
                onClose={() => setIsViewModalOpen(false)} 
                team={selectedTeam} 
            />
        </div>
    );
};

export default Team;