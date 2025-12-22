import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserEdit, FaGamepad, FaUsers, FaTrophy, FaGlobeAmericas, FaQuoteLeft } from 'react-icons/fa';
import './Profile.css';

const Profile = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // LEER DATOS DIRECTAMENTE (Sin useAuth)
        const storedUser = localStorage.getItem('esportefyUser');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Error al leer datos", error);
            }
        }
    }, []);

    if (!user) return <div className="loading-text">Cargando perfil...</div>;

    // Avatar generado si no hay foto
    const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=8EDB15&color=000&size=200&bold=true`;

    return (
        <div className="profile-page fade-in">
            
            {/* HEADER */}
            <header className="profile-header">
                <div className="header-banner"></div>
                <div className="header-content">
                    <div className="avatar-wrapper">
                        <img src={avatarUrl} alt="Avatar" />
                    </div>
                    <div className="user-identity">
                        <div className="name-row">
                            <h1>{user.username}</h1>
                            <span className="player-badge">JUGADOR</span>
                        </div>
                        <p className="real-name-text">{user.fullName}</p>
                    </div>
                    
                    {/* Botón que lleva a la página de editar */}
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
                                    : user.goals || "Sin descripción definida."}
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
                                <span className="empty-text">Sin juegos</span>
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

                {/* 3. EQUIPOS */}
                <div className="profile-card teams-card">
                    <div className="card-title"><FaTrophy /> <h3>Equipos</h3></div>
                    <div className="card-body empty-state">
                        <p>No perteneces a ningún equipo.</p>
                    </div>
                </div>

                {/* 4. COMUNIDADES */}
                <div className="profile-card communities-card">
                    <div className="card-title"><FaUsers /> <h3>Comunidades</h3></div>
                    <div className="card-body empty-state">
                        <p>Sin comunidades.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;