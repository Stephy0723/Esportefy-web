import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import { 
    FaGamepad, FaCrown, FaGlobeAmericas, FaAd, 
    FaUserFriends, FaFire, FaComments, FaEllipsisH, FaCheckCircle,
    FaPlusCircle, FaTimes, FaCamera
} from 'react-icons/fa';
import './Community.css';

// --- TUS IMPORTS (Mantenemos todos) ---
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
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [showModal, setShowModal] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0); // Controla el carrusel

    const filters = ["Todos", "FPS", "MOBA", "Battle Royale", "Fighting", "Estrategia", "Deportes", "Móvil"];

    const gamesList = [
        { name: "Valorant", id: "valorant", img: ValorantImg, tags: ["FPS", "PC"], badge: "Top #1" },
        { name: "CS2", id: "cs2", img: CS2Img, tags: ["FPS", "PC"], badge: "Elite" },
        { name: "Overwatch 2", id: "ow2", img: OW2Img, tags: ["FPS", "PC"], badge: null },
        { name: "R6 Siege", id: "r6s", img: R6SImg, tags: ["FPS", "PC"], badge: null },
        { name: "LoL", id: "lol", img: LoLImg, tags: ["MOBA", "PC"], badge: "Popular" },
        { name: "Dota 2", id: "dota2", img: Dota2Img, tags: ["MOBA", "PC"], badge: null },
        { name: "Honor of Kings", id: "hok", img: HoKImg, tags: ["MOBA", "Móvil"], badge: "Nuevo" },
        { name: "Mobile Legends", id: "mlbb", img: MLBBImg, tags: ["MOBA", "Móvil"], badge: "Hot" },
        { name: "Wild Rift", id: "wr", img: WildRiftImg, tags: ["MOBA", "Móvil"], badge: null },
        { name: "Fortnite", id: "fortnite", img: FortniteImg, tags: ["Battle Royale", "PC"], badge: "Evento" },
        { name: "Free Fire", id: "free-fire", img: FFImg, tags: ["Battle Royale", "Móvil"], badge: null },
        { name: "Warzone", id: "warzone", img: WarzoneImg, tags: ["Battle Royale", "FPS"], badge: null },
        { name: "PUBG Mobile", id: "pubgm", img: PUBGMImg, tags: ["Battle Royale", "Móvil"], badge: null },
        { name: "Street Fighter 6", id: "sf6", img: SF6Img, tags: ["Fighting", "Consola"], badge: "Evo" },
        { name: "Tekken 8", id: "tekken8", img: Tekken8Img, tags: ["Fighting", "PC"], badge: "Nuevo" },
        { name: "TFT", id: "tft", img: TFTImg, tags: ["Estrategia", "PC"], badge: null },
        { name: "Clash Royale", id: "cr", img: CRImg, tags: ["Estrategia", "Móvil"], badge: null },
        { name: "Hearthstone", id: "hs", img: HSImg, tags: ["Estrategia", "Cartas"], badge: null },
        { name: "LoR", id: "lor", img: LoRImg, tags: ["Estrategia", "Cartas"], badge: null },
        { name: "StarCraft II", id: "sc2", img: SC2Img, tags: ["Estrategia", "PC"], badge: "Clásico" },
        { name: "Rocket League", id: "rl", img: RLImg, tags: ["Deportes", "PC"], badge: null },
        { name: "NBA 2K24", id: "nba", img: NBAImg, tags: ["Deportes", "Consola"], badge: null },
    ];

    // 1. FILTRAR JUEGOS
    const filteredGames = activeFilter === 'Todos' 
        ? gamesList 
        : gamesList.filter(game => game.tags.includes(activeFilter));

    // 2. MOVIMIENTO AUTOMÁTICO CADA 5 SEGUNDOS
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                // Si llegamos al final, volvemos al principio
                // Mostramos 5 juegos a la vez, así que ajustamos el límite
                return prevIndex + 1 >= filteredGames.length ? 0 : prevIndex + 1;
            });
        }, 5000);

        return () => clearInterval(timer);
    }, [filteredGames.length]); // Se reinicia si cambia la cantidad de juegos

    // 3. REINICIAR INDICE AL CAMBIAR FILTRO
    useEffect(() => {
        setCurrentIndex(0);
    }, [activeFilter]);

    // Datos estáticos (Comunidades/Organizadores)
    const communitiesList = [
        { name: "Team Liquid", members: "12k", img: "https://liquipedia.net/commons/images/thumb/f/f6/Team_Liquid_2017_logo.png/600px-Team_Liquid_2017_logo.png" },
        { name: "KRÜ Esports", members: "45k", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/KR%C3%9C_Esports_Logo.png/800px-KR%C3%9C_Esports_Logo.png" },
        { name: "G2 Army", members: "80k", img: "https://upload.wikimedia.org/wikipedia/en/thumb/1/12/G2_Esports_logo.svg/1200px-G2_Esports_logo.svg.png" },
    ];
    const organizersList = [
        { name: "Liga Pro Gaming", role: "Torneos Elite", verified: true, img: "https://colorlib.com/wp/wp-content/uploads/sites/2/esports-logo-templates.jpg" },
        { name: "Torneos Latam", role: "Comunidad", verified: true, img: "https://marketplace.canva.com/EAFJz3t3bmg/1/0/1600w/canva-black-and-red-modern-esports-tournament-twitch-banner-147-1Q5z4z8.jpg" },
    ];

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
                        
                        {/* >>> SECCIÓN CARRUSEL ÚNICO CON FILTROS <<< */}
                        <section className="games-section">
                            <div className="section-title-block">
                                <h3><FaGamepad /> Videojuegos Populares</h3>
                                
                                {/* FILTROS QUE CONTROLAN EL CARRUSEL */}
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

                            {/* VENTANA DEL CARRUSEL (UNA SOLA LÍNEA) */}
                            <div className="carousel-window-single">
                                {filteredGames.length > 0 ? (
                                    <div 
                                        className="carousel-track-single" 
                                        /* Calculamos movimiento: Cada tarjeta ocupa 20% (para ver 5) o 25% (para ver 4) */
                                        style={{ transform: `translateX(-${currentIndex * 25}%)` }} 
                                    >
                                        {filteredGames.map((game, idx) => (
                                            <Link to={`/game/${game.id}`} className="game-poster-single" key={idx}>
                                                <img src={game.img} alt={game.name} />
                                                
                                                {/* SOLO DEJAMOS EL BADGE (Top #1, etc) - SIN NOMBRE */}
                                                {game.badge && <span className="game-badge">{game.badge}</span>}
                                                
                                                {/* ELIMINADO EL DIV CON EL NOMBRE DEL JUEGO */}
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-results">No hay juegos en esta categoría.</div>
                                )}
                            </div>
                        </section>

                        {/* SECCIÓN COMUNIDADES */}
                        <section className="communities-section">
                            <div className="section-header-row">
                                <h3><FaUserFriends /> Mis Comunidades</h3>
                                <button className="btn-create-community" onClick={() => setShowModal(true)}>
                                    <FaPlusCircle /> Crear Comunidad
                                </button>
                            </div>
                            <div className="communities-list-horizontal">
                                {communitiesList.map((comm, idx) => (
                                    <div className="community-pill" key={idx}>
                                        <img src={comm.img} alt={comm.name} />
                                        <div className="comm-text">
                                            <h4>{comm.name}</h4>
                                            <small>{comm.members} Miembros</small>
                                        </div>
                                        <button className="btn-join-mini">Entrar</button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* FEED GLOBAL */}
                        <section className="feed-section">
                            <div className="section-title"><h3><FaGlobeAmericas /> Feed Global</h3></div>
                            <div className="create-post">
                                <img src="https://i.pravatar.cc/150?img=33" alt="me" />
                                <input type="text" placeholder="Comparte una jugada..." />
                            </div>
                            <div className="post-card">
                                <div className="post-header">
                                    <img src="https://i.pravatar.cc/150?img=12" alt="Avatar"/>
                                    <div><h4>AlexGamer</h4><small>hace 2h • Valorant</small></div>
                                </div>
                                <p className="post-text">Buscando equipo serio. Rango Ascendente+. 🔥</p>
                            </div>
                        </section>
                    </div>

                    {/* SIDEBAR */}
                    <aside className="sidebar-column">
                        <div className="sponsor-card">
                            <div className="sponsor-label"><FaAd /> Patrocinado</div>
                            <img src="https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/a2155c51714571.58f62c0c73256.png" alt="Sponsor" />
                            <div className="sponsor-content"><h4>Red Bull Energy</h4><button>Ver Oferta</button></div>
                        </div>
                        <div className="creators-box">
                            <div className="box-header"><h3><FaCrown /> Top Organizadores</h3></div>
                            <div className="creators-list">
                                {organizersList.map((org, idx) => (
                                    <div className="creator-row" key={idx}>
                                        <img src={org.img} alt={org.name} className="creator-img"/>
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

            {/* MODAL */}
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