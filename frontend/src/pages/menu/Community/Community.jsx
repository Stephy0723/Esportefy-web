import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { 
    FaGamepad, FaCrown, FaGlobeAmericas, FaAd, 
    FaUserFriends, FaFire, FaHeart, FaComments, FaEllipsisH, FaCheckCircle,
    FaPlusCircle, FaTimes, FaCamera, FaRegHeart 
} from 'react-icons/fa';
import './Community.css';

// --- TUS IMPORTS ---
import FortniteImg from '../../../assets/comunidad/Fortnite.jpg';
import CS2Img from '../../../assets/comunidad/CS2.jpg';
import CRImg from '../../../assets/comunidad/CR.jpg';
import HoKImg from '../../../assets/comunidad/HoK_V.jpg';
import FFImg from '../../../assets/comunidad/FF.jpg';
import Dota2Img from '../../../assets/comunidad/Dota2.jpeg';
import HSImg from '../../../assets/comunidad/HS.webp';
import LoLImg from '../../../assets/comunidad/LoL.jpg';
import LoRImg from '../../../assets/comunidad/LoR.jpg';
import MLBBImg from '../../../assets/comunidad/MLBB.jpg';
import NBAImg from '../../../assets/comunidad/NBA2K24.jpg';
import OW2Img from '../../../assets/comunidad/OW2.jpeg';
import PUBGMImg from '../../../assets/comunidad/PUBGM.jpg';
import R6SImg from '../../../assets/comunidad/R6S.jpg';
import RLImg from '../../../assets/comunidad/RL.jpg';
import SC2Img from '../../../assets/comunidad/SC2.jpg';
import SF6Img from '../../../assets/comunidad/sf6.png';
import Tekken8Img from '../../../assets/comunidad/Tekken8.jpg';
import TFTImg from '../../../assets/comunidad/TFT.webp';
import ValorantImg from '../../../assets/comunidad/valorant.jpg';
import WarzoneImg from '../../../assets/comunidad/Warzone.jpg';
import WildRiftImg from '../../../assets/comunidad/WildRift.jpeg';

const Community = () => {
    const navigate = useNavigate(); // Hook para navegación
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [showModal, setShowModal] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const filters = ["Todos", "FPS", "MOBA", "Battle Royale", "Fighting", "Estrategia", "Deportes", "Móvil"];

    const gamesList = [
        { name: "Valorant", id: "valorant", img: ValorantImg, tags: ["FPS", "PC"], badge: "Top #1" },
        { name: "CS2", id: "cs2", img: CS2Img, tags: ["FPS", "PC"], badge: "Elite" },
        { name: "Overwatch 2", id: "overwatch", img: OW2Img, tags: ["FPS", "PC"], badge: null },
        { name: "R6 Siege", id: "r6", img: R6SImg, tags: ["FPS", "PC"], badge: null },
        { name: "LoL", id: "lol", img: LoLImg, tags: ["MOBA", "PC"], badge: "Popular" },
        { name: "Dota 2", id: "dota2", img: Dota2Img, tags: ["MOBA", "PC"], badge: null },
        { name: "Honor of Kings", id: "hok", img: HoKImg, tags: ["MOBA", "Móvil"], badge: "Nuevo" },
        { name: "Mobile Legends", id: "mlbb", img: MLBBImg, tags: ["MOBA", "Móvil"], badge: "Hot" },
        { name: "Wild Rift", id: "wildrift", img: WildRiftImg, tags: ["MOBA", "Móvil"], badge: null },
        { name: "Fortnite", id: "fortnite", img: FortniteImg, tags: ["Battle Royale", "PC"], badge: "Evento" },
        { name: "Free Fire", id: "freefire", img: FFImg, tags: ["Battle Royale", "Móvil"], badge: null },
        { name: "Warzone", id: "warzone", img: WarzoneImg, tags: ["Battle Royale", "FPS"], badge: null },
        { name: "PUBG Mobile", id: "pubgm", img: PUBGMImg, tags: ["Battle Royale", "Móvil"], badge: null },
        { name: "Street Fighter 6", id: "sf6", img: SF6Img, tags: ["Fighting", "Consola"], badge: "Evo" },
        { name: "Tekken 8", id: "tekken8", img: Tekken8Img, tags: ["Fighting", "PC"], badge: "Nuevo" },
        { name: "TFT", id: "tft", img: TFTImg, tags: ["Estrategia", "PC"], badge: null },
        { name: "Clash Royale", id: "clashroyale", img: CRImg, tags: ["Estrategia", "Móvil"], badge: null },
        { name: "Hearthstone", id: "hearthstone", img: HSImg, tags: ["Estrategia", "Cartas"], badge: null },
        { name: "LoR", id: "lor", img: LoRImg, tags: ["Estrategia", "Cartas"], badge: null },
        { name: "StarCraft II", id: "starcraft", img: SC2Img, tags: ["Estrategia", "PC"], badge: "Clásico" },
        { name: "Rocket League", id: "rocket", img: RLImg, tags: ["Deportes", "PC"], badge: null },
        { name: "NBA 2K24", id: "nba2k", img: NBAImg, tags: ["Deportes", "Consola"], badge: null },
    ];

    const communities = gamesList.slice(0, 5).map(game => ({
        id: game.id,
        name: game.name,
        members: (Math.floor(Math.random() * 50) + 1) + "k",
        img: game.img
    }));

    const organizersList = [
        { name: "Liga Pro", role: "Torneos Elite", verified: true, img: ValorantImg },
        { name: "Torneos Latam", role: "Comunidad", verified: true, img: LoLImg },
    ];

    const filteredGames = activeFilter === 'Todos' 
        ? gamesList 
        : gamesList.filter(game => game.tags.includes(activeFilter));

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                return prevIndex + 1 >= filteredGames.length ? 0 : prevIndex + 1;
            });
        }, 5000);
        return () => clearInterval(timer);
    }, [filteredGames.length]);

    useEffect(() => {
        setCurrentIndex(0);
    }, [activeFilter]);

    const handleImgError = (e) => {
        e.target.src = "https://via.placeholder.com/150/000000/FFFFFF?text=Gaming";
    };

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div className="header-text">
                        <h1>Hub Social</h1>
                        <p>Tu centro de mando competitivo</p>
                    </div>
                </header>

                <div className="dashboard-grid">
                    <div className="main-column">
                        <section className="games-section">
                            <div className="section-title-block">
                                <h3><FaGamepad /> Videojuegos Populares</h3>
                                <div className="filter-bar">
                                    {filters.map((tag) => (
                                        <button 
                                            key={tag}
                                            className={`filter-btn ${activeFilter === tag ? 'active' : ''}`}
                                            onClick={() => setActiveFilter(tag)}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="carousel-window-single">
                                {filteredGames.length > 0 ? (
                                    <div 
                                        className="carousel-track-single" 
                                        style={{ transform: `translateX(-${currentIndex * 25}%)` }} 
                                    >
                                        {filteredGames.map((game, idx) => (
                                            /* CAMBIO: Se cambió <Link> por <div> con onClick hacia /games/:id */
                                            <div 
                                                key={idx} 
                                                className="game-poster-single"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => navigate(`/games/${game.id}`)}
                                            >
                                                <img src={game.img} alt={game.name} onError={handleImgError} />
                                                {game.badge && <span className="game-badge">{game.badge}</span>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-results">No hay juegos en esta categoría.</div>
                                )}
                            </div>
                        </section>

                        <section className="communities-section">
                            <div className="section-header-row">
                                <h3><FaUserFriends /> Mis Comunidades</h3>
                                <button className="btn-create-community" onClick={() => setShowModal(true)}>
                                    <FaPlusCircle /> Crear Comunidad
                                </button>
                            </div>
                            <div className="communities-list-horizontal">
                                {communities.map((comm) => (
                                    <div className="community-pill" key={comm.id}>
                                        <div className="pill-avatar" onClick={() => navigate(`/games/${comm.id}`)} style={{cursor:'pointer'}}>
                                            <img src={comm.img} alt={comm.name} />
                                        </div>
                                        
                                        <div className="pill-info" onClick={() => navigate(`/games/${comm.id}`)} style={{cursor:'pointer'}}>
                                            <h4 className="pill-title">{comm.name}</h4>
                                            <p className="pill-subtitle">{comm.members} Miembros</p>
                                        </div>

                                        <div className="pill-actions">
                                            <button className="heart-icon-btn">
                                                <FaRegHeart />
                                            </button>
                                            {/* CAMBIO: El botón ENTRAR abre la CARTA flotante */}
                                            <button 
                                                className="btn-entrar-small"
                                                onClick={() => navigate(`/games/${comm.id}`)}
                                            >
                                                ENTRAR
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="feed-section">
                            <div className="section-title"><h3><FaGlobeAmericas /> Feed Global</h3></div>
                            <div className="create-post">
                                <img src={ValorantImg} alt="me" />
                                <input type="text" placeholder="Comparte una jugada..." />
                            </div>
                            <div className="post-card">
                                <div className="post-header">
                                    <img src={LoLImg} alt="Avatar" />
                                    <div><h4>AlexGamer</h4><small>hace 2h • Valorant</small></div>
                                </div>
                                <p className="post-text">Buscando equipo serio. Rango Ascendente+. 🔥</p>
                            </div>
                        </section>
                    </div>

                    <aside className="sidebar-column">
                        <div className="sponsor-card">
                            <div className="sponsor-label"><FaAd /> Patrocinado</div>
                            <img src={FortniteImg} alt="Sponsor" />
                            <div className="sponsor-content"><h4>Red Bull Energy</h4><button>Ver Oferta</button></div>
                        </div>
                        <div className="creators-box">
                            <div className="box-header"><h3><FaCrown /> Top Organizadores</h3></div>
                            <div className="creators-list">
                                {organizersList.map((org, idx) => (
                                    <div className="creator-row" key={idx}>
                                        <img src={org.img} alt={org.name} className="creator-img" onError={handleImgError}/>
                                        <div className="creator-info">
                                            <h5>{org.name} {org.verified && <FaCheckCircle className="ver-icon-s"/>}</h5>
                                            <span>{org.role}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content fade-in-up">
                        <div className="modal-header">
                            <h2>Crear Nueva Comunidad</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{color: '#888'}}>Formulario de creación aquí...</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn-confirm">Crear</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Community;