import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHeart, FaRegHeart, FaUserPlus, FaGamepad, FaGlobe, FaLayerGroup } from 'react-icons/fa';
import { gamesList } from '../../../../data/gamesData'; 
import './GameCard.css'; 

const GamesPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isLiked, setIsLiked] = useState(false);

    // Buscamos el juego ignorando mayúsculas para evitar errores
    const game = gamesList?.find(g => g.id.toLowerCase() === id.toLowerCase());

    // Debug para que veas si el juego carga en consola
    useEffect(() => {
        console.log("ID solicitado:", id);
        console.log("Juego encontrado:", game);
    }, [id, game]);

    if (!game) {
        return (
            <div className="card-page-background">
                <div className="error-card">
                    <h2 style={{color:'#111827'}}>Juego no encontrado</h2>
                    <p>El ID "{id}" no coincide con ningún juego en la lista.</p>
                    <button className="action-btn primary" onClick={() => navigate('/dashboard')}>
                        Volver al Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const company = game.company || (game.tags && game.tags[0]) || "Empresa";
    const mode = game.mode || (game.tags && game.tags[1]) || "Competitivo";
    const platform = game.platform || (game.tags && game.tags[2]) || "Multiplataforma";

    return (
        <div className="card-page-background">
            {/* Botón para cerrar la tarjeta y volver atrás */}
            <button className="btn-close-floating" onClick={() => navigate(-1)}>
                <FaArrowLeft /> Volver
            </button>

            <div className="floating-card">
                <div 
                    className="card-image-header" 
                    style={{ backgroundImage: `url(${game.img || game.image || 'https://via.placeholder.com/400'})` }}
                >
                    <button 
                        className={`card-heart-floating ${isLiked ? 'active' : ''}`} 
                        onClick={() => setIsLiked(!isLiked)}
                    >
                        {isLiked ? <FaHeart /> : <FaRegHeart />}
                    </button>
                </div>

                <div className="card-body">
                    <div className="card-meta-row">
                        <span className="status-active"><span className="dot"></span> Activo ahora</span>
                        <span className="meta-date">Actualizado hoy</span>
                    </div>

                    <h1 className="card-title">{game.name}</h1>
                    
                    <p className="card-description">
                        {game.desc || game.description || "Únete a la comunidad oficial para encontrar torneos y compañeros de equipo."}
                    </p>

                    <div className="card-tags">
                        <span className="tag-pill tag-company">{company}</span>
                        <span className="tag-pill tag-genre">
                            <FaLayerGroup style={{marginRight: '6px'}} /> {mode}
                        </span>
                        <span className="tag-pill tag-platform">
                            <FaGlobe style={{marginRight: '6px'}} /> {platform}
                        </span>
                    </div>

                    <hr className="card-divider" />

                    <div className="card-footer">
                        <div className="user-avatars-group">
                            <img src="https://i.pravatar.cc/150?u=1" alt="u1" />
                            <img src="https://i.pravatar.cc/150?u=2" alt="u2" />
                            <img src="https://i.pravatar.cc/150?u=3" alt="u3" />
                            <div className="avatar-count"><span>+{(parseInt(game.members) || 99)}</span></div>
                        </div>

                        <div className="card-actions">
                            <button className="action-btn icon-only" title="Seguir">
                                <FaUserPlus />
                            </button>
                            
                            {/* BOTÓN CLAVE: Te lleva a la página cinemática */}
                            <button 
                                className="action-btn primary main-action"
                                onClick={() => navigate(`/game/${game.id.toLowerCase()}`)} 
                            >
                                <FaGamepad className="btn-icon" /> ENTRAR
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GamesPage;