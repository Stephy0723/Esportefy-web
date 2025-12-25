import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHeart, FaUserPlus, FaGamepad, FaEllipsisH } from 'react-icons/fa';
import { gamesList } from '../../../../data/gamesData'; 
import './GameCard.css'; 

const GamesPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const safeList = gamesList || [];
    const game = safeList.find(g => g.id === id);

    if (!game) {
        return (
            <div className="card-page-background">
                <div style={{background:'white', padding:'30px', borderRadius:'15px', textAlign:'center'}}>
                    <h2 style={{color:'#111827'}}>Juego no encontrado</h2>
                    <button className="action-btn primary" onClick={() => navigate(-1)} style={{marginTop:'15px'}}>
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    // Separamos los tags: asumimos que el primero es la empresa/desarrollador
    const companyTag = game.tags && game.tags.length > 0 ? game.tags[0] : null;
    const otherTags = game.tags && game.tags.length > 1 ? game.tags.slice(1) : [];

    return (
        <div className="card-page-background">
            <button className="btn-close-floating" onClick={() => navigate(-1)}>
                <FaArrowLeft /> Volver
            </button>

            <div className="floating-card">
                <div 
                    className="card-image-header" 
                    style={{ backgroundImage: `url(${game.img || 'https://via.placeholder.com/400'})` }}
                >
                    <button className="card-options-btn"><FaEllipsisH /></button>
                </div>

                <div className="card-body">
                    <div className="card-meta-row">
                        <span className="status-active"><span className="dot"></span> Activo ahora</span>
                        <span className="meta-date">Actualizado hoy</span>
                    </div>

                    <h1 className="card-title">{game.name}</h1>
                    
                    {/* Descripción real del juego */}
                    <p className="card-description">
                        {game.desc || "Únete a la comunidad oficial para encontrar torneos y compañeros."}
                    </p>

                    {/* Tags Clasificados */}
                    <div className="card-tags">
                        {companyTag && <span className="tag-pill tag-company">{companyTag}</span>}
                        {otherTags.map((tag, i) => (
                            <span key={i} className="tag-pill tag-genre">{tag}</span>
                        ))}
                    </div>

                    <hr className="card-divider" />

                    <div className="card-footer">
                        <div className="user-avatars-group">
                            <img src="https://i.pravatar.cc/150?u=1" alt="u1" />
                            <img src="https://i.pravatar.cc/150?u=2" alt="u2" />
                            <img src="https://i.pravatar.cc/150?u=3" alt="u3" />
                            <div className="avatar-count"><span>+{(parseInt(game.members) || 99)}</span></div>
                        </div>

                        {/* Botones Rediseñados */}
                        <div className="card-actions">
                            <button className="action-btn icon-only" title="Dar Like">
                                <FaHeart />
                            </button>
                            <button className="action-btn icon-only" title="Seguir">
                                <FaUserPlus />
                            </button>
                            <button className="action-btn primary">
                                <FaGamepad className="btn-icon" /> Entrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GamesPage;