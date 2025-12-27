import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { 
    FaGamepad, FaCrown, FaGlobeAmericas, FaAd, 
    FaUserFriends, FaCheckCircle, FaPlusCircle, FaTimes, 
    FaRegHeart, FaComments, FaEllipsisH, FaShareAlt, 
    FaCamera, FaSmile, FaComment 
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

// --- DATOS ESTATICOS (FUERA DEL COMPONENTE PARA EVITAR ERRORES DE INICIALIZACIÓN) ---
const sponsorAds = [
    {
        id: 1,
        title: "GLOBAL TECH CORP",
        img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000",
        color: "rgba(20, 184, 166, 0.4)" 
    },
    {
        id: 2,
        title: "NEO ENERGY DRINK",
        img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000",
        color: "rgba(142, 219, 21, 0.4)" 
    },
    {
        id: 3,
        title: "SKYLINE LOGISTICS",
        img: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000",
        color: "rgba(59, 130, 246, 0.4)" 
    }
];

const Community = () => {
    const navigate = useNavigate(); 
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [showModal, setShowModal] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [adIndex, setAdIndex] = useState(0); // Estado para el carrusel lateral

    const [selectedGame, setSelectedGame] = useState("");
    const [selectedType, setSelectedType] = useState("noticias");
    const [inputText, setInputText] = useState("");

    // --- LOGICA DEL CARRUSEL DE PATROCINIO ---
    useEffect(() => {
        const interval = setInterval(() => {
            setAdIndex((prev) => (prev + 1) % sponsorAds.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const currentAd = sponsorAds[adIndex];

    // --- LOGICA DEL FEED ---
    const [posts, setPosts] = useState([
        {
            id: 1,
            user: "AlexGamer",
            avatar: LoLImg,
            time: "hace 2h",
            gameTag: "Valorant",
            typeTag: "noticias",
            text: "Buscando equipo serio. Rango Ascendente+. 🔥",
            likes: 12
        }
    ]);

    const handlePublish = (e) => {
        if ((e.key === 'Enter' || e.type === 'click') && inputText.trim() !== "") {
            const newPost = {
                id: Date.now(),
                user: "Salyl Gamer", 
                avatar: ValorantImg, 
                time: "ahora",
                gameTag: selectedGame || "General", 
                typeTag: selectedType,
                text: inputText,
                likes: 0
            };
            setPosts([newPost, ...posts]);
            setInputText("");
        }
    };

    const filters = ["Todos", "FPS", "MOBA", "Battle Royale", "Fighting", "Estrategia", "Deportes", "Móvil"];

    const gamesList = [
        { name: "Valorant", id: "valorant", img: ValorantImg, tags: ["FPS", "PC"], badge: "Top #1" },
        { name: "CS2", id: "cs2", img: CS2Img, tags: ["FPS", "PC"], badge: "Elite" },
        { name: "Overwatch 2", id: "overwatch", img: OW2Img, tags: ["FPS", "PC"], badge: null },
        { name: "LoL", id: "lol", img: LoLImg, tags: ["MOBA", "PC"], badge: "Popular" },
        { name: "Fortnite", id: "fortnite", img: FortniteImg, tags: ["Battle Royale", "PC"], badge: "Evento" },
        { name: "StarCraft II", id: "starcraft", img: SC2Img, tags: ["Estrategia", "PC"], badge: "Clásico" },
        { name: "Rocket League", id: "rocket", img: RLImg, tags: ["Deportes", "PC"], badge: null },
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
                                <div 
                                    className="carousel-track-single" 
                                    style={{ transform: `translateX(-${currentIndex * 25}%)` }} 
                                >
                                    {filteredGames.map((game, idx) => (
                                        <div 
                                            key={idx} 
                                            className="game-poster-single"
                                            onClick={() => navigate(`/games/${game.id}`)}>
                                            <img src={game.img} alt={game.name} />
                                            {game.badge && <span className="game-badge">{game.badge}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="feed-section-container">
                            <div className="feed-title">
                                <FaGlobeAmericas /> <span>Feed Global</span>
                            </div>

                            <div className="create-post-wrapper-v3">
                                <div className="post-selectors-row">
                                    <div className="selector-with-icon">
                                        <FaGamepad className="sel-icon" />
                                        <select className="ui-selector-pill" value={selectedGame} onChange={(e) => setSelectedGame(e.target.value)}>
                                            <option value="">Seleccionar Juego o Comunidad</option>
                                            <option value="valorant">Valorant</option>
                                            <option value="lol">League of Legends</option>
                                        </select>
                                    </div>
                                    <div className="selector-with-icon">
                                        <FaAd className="sel-icon" />
                                        <select className="ui-selector-pill" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                                            <option value="noticias">📰 Noticias</option>
                                            <option value="escuadra">🎮 Buscar Escuadra</option>
                                            <option value="vs">⚔️ Reto VS</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="search-container-gaming">
                                    <img src={ValorantImg} alt="me" className="search-avatar" />
                                    <div className="search-input-wrapper">
                                        <input 
                                            type="text" 
                                            placeholder="Comparte algo con la comunidad..." 
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            onKeyDown={handlePublish}
                                        />
                                        <span className="search-time-hint">ahora</span>
                                    </div>
                                </div>

                                <div className="post-actions-toolbar">
                                    <div className="toolbar-left">
                                        <button className="tool-btn"><FaSmile /></button>
                                        <button className="tool-btn"><FaCamera /></button>
                                        <button className="tool-btn"><FaPlusCircle /></button>
                                        <button className="tool-btn"><FaEllipsisH /></button>
                                    </div>
                                    <button className="ui-send-post-btn" onClick={handlePublish}>Publicar Post</button>
                                </div>
                            </div>

                            <div className="posts-feed-wrapper">
                                {posts.map((post) => (
                                    <div className="ui-post-card" key={post.id}>
                                        <div className="ui-post-header">
                                            <img src={post.avatar} alt="avatar" />
                                            <div className="ui-user-details">
                                                <div className="ui-user-name">
                                                    {post.user}
                                                    <div className="post-tags-container">
                                                        <span className="tag-pill game">{post.gameTag}</span>
                                                        <span className="tag-pill type">{post.typeTag}</span>
                                                    </div>
                                                </div>
                                                <span className="ui-post-meta">{post.time}</span>
                                            </div>
                                            <button className="ui-more-btn"><FaEllipsisH /></button>
                                        </div>
                                        <div className="ui-post-body"><p>{post.text}</p></div>
                                        <div className="ui-post-footer">
                                            <button className="ui-action-pill"><FaRegHeart /> <span>{post.likes}</span></button>
                                            <button className="ui-action-pill"><FaComment /> <span>Comentar</span></button>
                                            <button className="ui-action-pill share"><FaShareAlt /> <span>Share</span></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div> {/* CIERRE main-column */}

                    <aside className="sidebar-column">
                        <div className="sponsor-card carousel-mode">
                            <div className="sponsor-label"><FaAd /> Patrocinado</div>
                            <div className="sponsor-color-overlay" style={{ backgroundColor: currentAd.color }}></div>
                            <img key={currentAd.id} src={currentAd.img} alt="Sponsor" className="fade-in-anim" />
                            <div className="sponsor-content">
                                <h4 className="fade-in-anim">{currentAd.title}</h4>
                                <button className="btn-sponsor-action">Saber más</button>
                                <div className="ad-indicators">
                                    {sponsorAds.map((_, i) => (
                                        <span key={i} className={`dot ${i === adIndex ? 'active' : ''}`}></span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="creators-box">
                            <div className="box-header"><h3><FaCrown /> Top Organizadores</h3></div>
                            <div className="creators-list">
                                {organizersList?.map((org, idx) => (
                                    <div className="creator-row" key={idx}>
                                        <img src={org.img} alt={org.name} className="creator-img" />
                                        <div className="creator-info">
                                            <h5>{org.name} <FaCheckCircle className="ver-icon-s"/></h5>
                                            <span>{org.role}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
{/* --- SECCIÓN MIS COMUNIDADES --- */}
<div className="creators-box communities-sidebar-v3">
    <div className="box-header">
        <h3><FaUserFriends /> Mis Comunidades</h3>
    </div>
    
    <div className="sidebar-communities-list">
        {communities?.map((comm) => (
            <div className="community-sidebar-item" key={comm.id}>
                <div className="comm-avatar-frame">
                    <img src={comm.img} alt={comm.name} className="creator-img" />
                    <span className="status-indicator-online"></span>
                </div>
                <div className="creator-info">
                    <h5>{comm.name}</h5>
                    <span>{comm.members} Miembros</span>
                </div>
                {/* BOTÓN ENTRAR */}
                <button 
                    className="btn-enter-community" 
                    onClick={() => navigate(`/game/${comm.name.toLowerCase().replace(/\s+/g, '-')}`)}
                >
                    Entrar
                </button>
            </div>
        ))}
    </div>

    {/* BOTÓN CREAR (AHORA NAVEGA A OTRA PÁGINA) */}
    <button className="btn-create-community-sidebar" onClick={() => navigate('/community/create')}>
        <FaPlusCircle /> <span>Crear Comunidad</span>
    </button>
</div>

{/* --- MODAL DE CREACIÓN ARREGLADO --- */}
{showModal && (
    <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowModal(false)}>
        <div className="modal-content fade-in-up">
            <div className="modal-header">
                <div className="modal-title-flex">
                    <FaPlusCircle className="icon-accent" />
                    <h2>Nueva Comunidad</h2>
                </div>
                <button className="close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>

            <div className="modal-body">
                <div className="form-group-v3">
                    <label>Banner / Logo</label>
                    <div className="upload-zone-v3">
                        <FaCamera />
                        <p>Subir archivo de imagen</p>
                        <input type="file" className="hidden-input" accept="image/*" />
                    </div>
                </div>

                <div className="form-group-v3">
                    <label>Nombre de la comunidad</label>
                    <input type="text" placeholder="Ej: Elite Gamers Pro" className="modal-input-v3" />
                </div>

                <div className="form-group-v3">
                    <label>Elegir Juego</label>
                    <select className="modal-input-v3">
                        <option value="">Selecciona una opción</option>
                        <option value="valorant">Valorant</option>
                        <option value="lol">League of Legends</option>
                        <option value="cs2">Counter Strike 2</option>
                    </select>
                </div>

                <div className="form-group-v3">
                    <label>Descripción</label>
                    <textarea placeholder="¿Cuál es el objetivo de tu comunidad?" className="modal-input-v3 textarea-v3" rows="3"></textarea>
                </div>
            </div>

            <div className="modal-footer">
                <button className="btn-cancel-v3" onClick={() => setShowModal(false)}>Cerrar</button>
                <button className="btn-confirm-v3" onClick={() => setShowModal(false)}>Crear ahora</button>
            </div>
        </div>
    </div>
)}
                    </aside>
                </div> {/* CIERRE dashboard-grid */}
            </div> {/* CIERRE dashboard-container */}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content fade-in-up">
                        <div className="modal-header">
                            <h2>Crear Nueva Comunidad</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
                        </div>
                        <div className="modal-body"><p style={{color: '#888'}}>Formulario de creación aquí...</p></div>
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