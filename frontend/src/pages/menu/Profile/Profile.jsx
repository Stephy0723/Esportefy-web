import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    FaUserEdit, FaGamepad, FaUsers, FaTrophy, 
    FaGlobeAmericas, FaQuoteLeft, FaDiscord, 
    FaSteam, FaFacebook, FaShareAlt, FaBullseye 
} from 'react-icons/fa'; // Añadidos nuevos iconos
import './Profile.css';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const response = await axios.get('http://localhost:4000/api/auth/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(response.data);
                setLoading(false);
            } catch (err) {
                setError("No se pudo cargar la información del perfil.");
                setLoading(false);
                if (err.response?.status === 401) navigate('/login');
            }
        };
        fetchUserProfile();
    }, [navigate]);

    if (loading) return <div className="loading-container"><div className="loader"></div><p>Sincronizando con la arena...</p></div>;
    if (error) return <div className="error-text">{error}</div>;
    if (!user) return null;

    const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=8EDB15&color=000&size=200&bold=true`;

    return (
        <div className="profile-page fade-in">
            {/* HEADER */}
            <header className="profile-header">
                <div className="header-banner"></div>
                <div className="header-content">
                    <div className="avatar-wrapper">
                        <img src={avatarUrl} alt="Avatar del jugador" />
                    </div>
                    <div className="user-identity">
                        <div className="name-row">
                            <h1>{user.username}</h1>
                            <span className="player-badge">JUGADOR</span>
                            {/* Lógica condicional: Solo se muestra si isOrganizer es true */}
                            {user.isOrganizer && (
                                <span className="organizer-badge">Organizador</span>
                            )}
                        </div>
                        <p className="real-name-text">{user.fullName}</p>
                    </div>
                    <button className="btn-edit-action" onClick={() => navigate('/edit-profile')}>
                        <FaUserEdit /> Editar Datos
                    </button>
                </div>
            </header>

            {/* GRID DE DATOS */}
            <div className="profile-grid">
                
                {/* 1. BIOGRAFÍA */}
                <div className="profile-card bio-card">
                    <div className="card-title"><FaGlobeAmericas /> <h3>Biografía</h3></div>
                    <div className="card-body">
                        <div className="bio-item">
                            <label>País:</label> <span>{user.country || "No especificado"}</span>
                        </div>
                        <div className="bio-item">
                            <label>Experiencia:</label> 
                            <span>{Array.isArray(user.experience) ? user.experience.join(", ") : user.experience || "Principiante"}</span>
                        </div>
                        <div className="bio-quote">
                            <FaQuoteLeft className="quote-icon"/>
                            <p>{user.goals || "Sin metas definidas."}</p>
                        </div>
                    </div>
                </div>

                {/* NUEVA SECCIÓN: CONEXIONES (SOCIALES) */}
                <div className="profile-card social-card">
                    <div className="card-title"><FaShareAlt /> <h3>Conexiones</h3></div>
                    <div className="card-body">
                        <div className="social-links-grid">
                            <div className="social-item">
                                <div className="social-icon discord"><FaDiscord /></div>
                                <div className="social-info">
                                    <label>Discord</label>
                                    <span>{user.discord || "No conectado"}</span>
                                </div>
                            </div>
                            <div className="social-item">
                                <div className="social-icon riot"><FaBullseye /></div>
                                <div className="social-info">
                                    <label>Riot ID</label>
                                    <span>{user.riotId || "No vinculado"}</span>
                                </div>
                            </div>
                            <div className="social-item">
                                <div className="social-icon steam"><FaSteam /></div>
                                <div className="social-info">
                                    <label>Steam</label>
                                    <span>{user.steam || "No vinculado"}</span>
                                </div>
                            </div>
                            <div className="social-item">
                                <div className="social-icon facebook"><FaFacebook /></div>
                                <div className="social-info">
                                    <label>Facebook</label>
                                    <span>{user.facebook || "No vinculado"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. JUEGOS */}
                <div className="profile-card games-card">
                    <div className="card-title"><FaGamepad /> <h3>Mis Juegos</h3></div>
                    <div className="card-body">
                        <div className="tags-cloud">
                            {user.selectedGames?.length > 0 ? (
                                user.selectedGames.map((g, i) => <span key={i} className="game-tag">{g}</span>)
                            ) : (
                                <span className="empty-text">Sin juegos registrados</span>
                            )}
                        </div>
                        {user.platforms?.length > 0 && (
                            <div className="platforms-section">
                                <h4>Plataformas</h4>
                                <div className="platform-icons">
                                    {user.platforms.map((p, i) => <span key={i} className="platform-tag">{p}</span>)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. EQUIPOS */}
                <div className="profile-card teams-card">
                    <div className="card-title"><FaTrophy /> <h3>Equipos</h3></div>
                    <div className="card-body">
                        {user.teams?.length > 0 ? (
                            <div className="teams-list">
                                {user.teams.map((team) => (
                                    <div key={team._id} className="team-item-mini">
                                        <img src={team.logo || 'default-team-logo.png'} alt={team.name} className="team-logo-small" />
                                        <div className="team-info-mini">
                                            <span className="team-name">{team.name}</span>
                                            <span className="team-game-tag">{team.game}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state"><p>No perteneces a ningún equipo aún.</p></div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;