import React, { useState, useEffect, use } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaUserEdit, FaGamepad, FaTrophy,
    FaGlobeAmericas, FaQuoteLeft, FaDiscord,
    FaSteam, FaFacebook, FaShareAlt, FaBullseye
} from 'react-icons/fa';
import { GAME_IMAGES } from '../../../data/gameImages';
import { FRAMES, BACKGROUNDS } from '../../../data/profileOptions';
import AvatarCircle from '../../../components/AvatarCircle/AvatarCircle'; 
import PlayerTag from '../../../components/PlayerTag/PlayerTag'; // <--- EL COMPONENTE NUEVO
import { PLAYER_TAGS } from '../../../data/playerTags';
import './Profile.css';
import User from '../../../../../backend/src/models/User';

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
    
    // --- 1. GESTIÓN DE ESTADOS DE CARGA ---
    if (loading) return <div className="loading-container"><div className="loader"></div><p>Sincronizando...</p></div>;
    if (error) return <div className="error-text">{error}</div>;
    if (!user) return null;
    
    // --- 2. DEFINICIÓN DE VARIABLES (Aquí se soluciona el error) ---
    const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=8EDB15&color=000&size=200&bold=true`;
    
    // Normalizamos los juegos para que siempre sea un Array (evita el error de "undefined")
    const normalizedGames = Array.isArray(user.selectedGames) 
    ? user.selectedGames 
    : (user.selectedGames ? user.selectedGames.split(',').map(g => g.trim()) : []);
    
    const currentFrame = FRAMES.find(frame => frame.id === user?.selectedFrameId) || FRAMES[0];
    const currentBg = BACKGROUNDS.find(b => b.id === user?.selectedBgId) || BACKGROUNDS[0];
    return (
        <div className="profile-page fade-in">
            {/* HEADER */}
            <header className="profile-header">
                <div className="header-banner">
                    <img src={currentBg.src} alt="Background" className="header-bg-image" />
                    <div className="header-bg-overlay"></div>
                </div>
                <div className="header-content">
                    <div className="avatar-wrapper">
                        <AvatarCircle 
                                            src={ user.avatar || `https://ui-avatars.com/api/?name=${user.username}`}
                                            frameConfig={currentFrame}
                                            size="120px"
                                            status={user.status} />
                    </div>
                    <div className="user-identity">
                        <div className="name-row">
                            <PlayerTag 
                                name={user.username || "Player"} 
                                tagId={user.selectedTagId} 
                                size="normal"                                
                            />
                            {user.connections?.riot?.verified && (
                                <div className={`riot-rank-badge ${user.connections.riot.rank?.tier?.toLowerCase() || 'unranked'}`}>
                                    {user.connections.riot.rank 
                                        ? `${user.connections.riot.rank.tier} ${user.connections.riot.rank.division}` 
                                        : 'UNRANKED'}
                                </div>
                            )}
                        </div>
                        <p className="real-name-text">{user.fullName}</p>
                    </div>
                    <button className="btn-edit-action" onClick={() => navigate('/edit-profile')}>
                        <FaUserEdit /> Editar Datos
                    </button>
                </div>
            </header>

            <div className="profile-grid">
                {/* 1. BIOGRAFÍA */}
                <div className="profile-card bio-card">
                    <div className="card-title"><FaGlobeAmericas /> <h3>Biografía</h3></div>
                    <div className="card-body">
                        <div className="input-row-group">
                            <div className="bio-item">
                                <label>País</label>
                                <span>{user.country || "No especificado"}</span>
                            </div>
                            <div className="bio-item">
                                <label>Experiencia</label>
                                <span>{Array.isArray(user.experience) ? user.experience.join(", ") : user.experience || "Principiante"}</span>
                            </div>
                        </div>
                        <div className="bio-quote">
                            <FaQuoteLeft className="quote-icon" />
                            <p>{user.goals || "Sin metas definidas."}</p>
                        </div>
                    </div>
                </div>

                {/* 2. CONEXIONES */}
                <div className="profile-card social-card">
                    <div className="card-title"><FaShareAlt /> <h3>Conexiones</h3></div>
                    <div className="card-body">
                        <div className="social-links-grid">
                            <div className="social-item">
                                <div className="social-icon discord"><FaDiscord /></div>
                                <div className="social-info">
                                    <label>Discord</label>
                                    <span>{user.connections?.discord?.verified ? user.connections.discord.username : "No conectado"}</span>
                                </div>
                            </div>
                            <div className="social-item">
                                <div className="social-icon riot"><FaBullseye /></div>
                                <div className="social-info">
                                    <label>Riot Games</label>
                                    <span>{user.connections?.riot?.verified ? `${user.connections.riot.gameName}#${user.connections.riot.tagLine}` : "No vinculado"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. SECCIÓN JUEGOS (IGUAL AL DASHBOARD) */}
                <div className="profile-card games-card content-panel"> 
                    <div className="panel-header card-title">
                        <div className="title-with-icon" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaGamepad /> 
                            <h3>Mis Juegos</h3>
                        </div>
                        <button className="btn-link" onClick={() => navigate('/settings')}>Editar</button>
                    </div>

                    <div className="gallery-scroll-container">
                        <div className="dash-games-gallery">
                            {normalizedGames.length > 0 ? (
                                normalizedGames.map((gameId, index) => {
                                    const imageSrc = Object.entries(GAME_IMAGES).find(([key]) =>
                                        key.toLowerCase().includes(gameId.toLowerCase())
                                    )?.[1] || GAME_IMAGES.Default;

                                    return (
                                        <div key={index} className="game-card-v6" onClick={() => navigate(`/games/${gameId.toLowerCase()}`)}>
                                            <div className="poster-container-v6">
                                                <img src={imageSrc} alt={gameId} />
                                                <div className="card-overlay-v6">
                                                    <span className="overlay-btn">VER INFO</span>
                                                </div>
                                            </div>
                                            <div className="game-footer-v6">
                                                <span className="game-title-v6">{gameId.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="empty-text">Sin juegos seleccionados.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. EQUIPOS */}
                <div className="profile-card teams-card">
                    <div className="card-title">
                        <FaTrophy className="icon-gold" /> <h3>Equipos</h3>
                    </div>
                    <div className="card-body">
                        {user.teams?.length > 0 ? (
                            <div className="teams-list">
                                {user.teams.map((team) => {
                                    // Imagen por defecto con estilo gaming si no hay logo
                                    const defaultLogo = "https://i.ibb.co/VWV0YmP/default-esports-team.png"; // Sustituir por tu ruta local
                                    const teamLogo = team.logo || defaultLogo;

                                    return (
                                        <div key={team._id} className="team-item-mini fade-in-list">
                                            <div className="team-logo-wrapper">
                                                <img 
                                                    src={teamLogo} 
                                                    alt={team.name} 
                                                    className="team-logo-small" 
                                                    onError={(e) => e.target.src = defaultLogo}
                                                />
                                            </div>
                                            <div className="team-info-mini">
                                                <span className="team-name">{team.name}</span>
                                                <span className="team-game-tag">{team.game}</span>
                                            </div>
                                            <div className="team-action-indicator">
                                                <div className="dot-active"></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="empty-state-modern">
                                <FaTrophy className="empty-icon" />
                                <p>No perteneces a ningún equipo aún.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;