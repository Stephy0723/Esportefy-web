import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Importante tener axios instalado
import { FaUserEdit, FaGamepad, FaUsers, FaTrophy, FaGlobeAmericas, FaQuoteLeft } from 'react-icons/fa';
import './Profile.css';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                // 1. Obtener el token de localStorage o sessionStorage
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');

                if (!token) {
                    console.warn("No se encontró token, redirigiendo...");
                    navigate('/login');
                    return;
                }

                // 2. Hacer la petición a la API
                const response = await axios.get('http://localhost:4000/api/auth/profile', {
                    headers: {
                        Authorization: `Bearer ${token}` // Enviamos el token para que el backend nos reconozca
                    }
                });

                // 3. Guardar los datos en el estado
                setUser(response.data);
                setLoading(false);

            } catch (err) {
                console.error("Error al obtener perfil:", err);
                setError("No se pudo cargar la información del perfil.");
                setLoading(false);
                
                // Si el error es 401 (No autorizado), mandamos al login
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            }
        };

        fetchUserProfile();
    }, [navigate]);

    // Pantallas de estado
    if (loading) return <div className="loading-container"><div className="loader"></div><p>Sincronizando con la arena...</p></div>;
    if (error) return <div className="error-text">{error}</div>;
    if (!user) return null;

    // Avatar generado si no hay foto en la base de datos
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
                            <span>
                                {Array.isArray(user.experience) 
                                    ? user.experience.join(", ") 
                                    : user.experience || "Principiante"}
                            </span>
                        </div>
                        <div className="bio-quote">
                            <FaQuoteLeft className="quote-icon"/>
                            <p>
                                {Array.isArray(user.goals) 
                                    ? user.goals.join(". ") 
                                    : user.goals || "Sin metas definidas."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. JUEGOS */}
                <div className="profile-card games-card">
                    <div className="card-title"><FaGamepad /> <h3>Mis Juegos</h3></div>
                    <div className="card-body">
                        <div className="tags-cloud">
                            {user.selectedGames && user.selectedGames.length > 0 ? (
                                user.selectedGames.map((g, i) => <span key={i} className="game-tag">{g}</span>)
                            ) : (
                                <span className="empty-text">Sin juegos registrados</span>
                            )}
                        </div>
                        
                        {user.platforms && user.platforms.length > 0 && (
                            <div className="platforms-section">
                                <h4>Plataformas</h4>
                                <div className="platform-icons">
                                    {user.platforms.map((p, i) => <span key={i} className="platform-tag">{p}</span>)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. EQUIPOS Y COMUNIDADES (Se mantienen estáticos por ahora) */}
                <div className="profile-card teams-card">
                    <div className="card-title"><FaTrophy /> <h3>Equipos</h3></div>
                    <div className="card-body">
                        {user.teams && user.teams.length > 0 ? (
                            <div className="teams-list">
                                {user.teams.map((team) => (
                                    <div key={team._id} className="team-item-mini">
                                        <img 
                                            src={team.logo || 'default-team-logo.png'} 
                                            alt={team.name} 
                                            className="team-logo-small" 
                                        />
                                        <div className="team-info-mini">
                                            <span className="team-name">{team.name}</span>
                                            <span className="team-game-tag">{team.game}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No perteneces a ningún equipo aún.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-card communities-card">
                    <div className="card-title"><FaUsers /> <h3>Comunidades</h3></div>
                    <div className="card-body empty-state">
                        <p>Explora comunidades para unirte.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;