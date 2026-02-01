import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaGamepad, FaCrown, FaGlobeAmericas, FaAd, 
    FaUserFriends, FaCheckCircle, FaPlusCircle, FaTimes, 
    FaRegHeart, FaHeart, FaComments, FaEllipsisH, FaShareAlt, FaPaperPlane,
    FaCamera, FaSmile, FaImage, FaVideo, FaPoll, FaHashtag, FaAt, FaLock,
    FaLink
} from 'react-icons/fa';

// --- BANDERAS SVG ---
import { US, DO, MX, AR, CO, ES, CL, PE, VE, BR } from 'country-flag-icons/react/3x2';

import './Community.css';

// --- TUS IMPORTS DE IMÁGENES ---
import FortniteImg from '../../../assets/comunidad/Fortnite.jpg';
import CS2Img from '../../../assets/comunidad/CS2.jpg';
import CRImg from '../../../assets/comunidad/CR.jpg';
import HoKImg from '../../../assets/comunidad/HoK_V.jpg';
import FFImg from '../../../assets/comunidad/FF.jpg';
import Dota2Img from '../../../assets/comunidad/Dota2.jpeg';
import LoLImg from '../../../assets/comunidad/LoL.jpg';
import MLBBImg from '../../../assets/comunidad/MLBB.jpg';
import OW2Img from '../../../assets/comunidad/OW2.jpeg';
import R6SImg from '../../../assets/comunidad/R6S.jpg';
import RLImg from '../../../assets/comunidad/RL.jpg';
import SF6Img from '../../../assets/comunidad/sf6.png';
import Tekken8Img from '../../../assets/comunidad/Tekken8.jpg';
import TFTImg from '../../../assets/comunidad/TFT.webp';
import ValorantImg from '../../../assets/comunidad/valorant.jpg';
import WarzoneImg from '../../../assets/comunidad/Warzone.jpg';
import WildRiftImg from '../../../assets/comunidad/WildRift.jpeg';

// ==========================================
// 1. DATOS ESTÁTICOS
// ==========================================

const sponsorAds = [
    { id: 1, title: "GLOBAL TECH CORP", img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000", color: "rgba(20, 184, 166, 0.4)" },
    { id: 2, title: "NEO ENERGY DRINK", img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000", color: "rgba(142, 219, 21, 0.4)" },
];

const gamesListData = [
    { name: "Valorant", id: "valorant", img: ValorantImg, color: "#ff4655" },
    { name: "League of Legends", id: "lol", img: LoLImg, color: "#0ac8b9" },
    { name: "CS2", id: "cs2", img: CS2Img, color: "#de9b35" },
    { name: "Fortnite", id: "fortnite", img: FortniteImg, color: "#a35ddf" },
    { name: "Warzone", id: "warzone", img: WarzoneImg, color: "#4caf50" },
    { name: "Overwatch 2", id: "ow2", img: OW2Img, color: "#f99e1a" },
    { name: "Dota 2", id: "dota2", img: Dota2Img, color: "#e33935" },
    { name: "Rocket League", id: "rl", img: RLImg, color: "#0088ff" },
    { name: "Rainbow 6 Siege", id: "r6s", img: R6SImg, color: "#ff8c00" },
    { name: "Street Fighter 6", id: "sf6", img: SF6Img, color: "#ff5e00" },
    { name: "Tekken 8", id: "tekken8", img: Tekken8Img, color: "#ffd700" },
    { name: "Mobile Legends", id: "mlbb", img: MLBBImg, color: "#00d2ff" },
    { name: "Free Fire", id: "ff", img: FFImg, color: "#ffaa00" },
    { name: "Clash Royale", id: "cr", img: CRImg, color: "#3b82f6" },
    { name: "Honor of Kings", id: "hok", img: HoKImg, color: "#eab308" },
    { name: "TFT", id: "tft", img: TFTImg, color: "#f472b6" },
    { name: "Wild Rift", id: "wr", img: WildRiftImg, color: "#22d3ee" },
];

const organizersList = [
    { name: "Liga Pro", role: "Torneos Elite", verified: true, img: ValorantImg },
    { name: "Torneos Latam", role: "Comunidad", verified: true, img: LoLImg },
];

const filters = ["Todos", "FPS", "MOBA", "Battle Royale", "Fighting", "Estrategia", "Deportes"];


// ==========================================
// 2. CARRUSEL DE JUEGOS
// ==========================================
const GameCarouselSection = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [currentIndex, setCurrentIndex] = useState(0);

    const filteredGames = activeFilter === 'Todos' 
        ? gamesListData 
        : gamesListData.filter(game => game.tags?.includes(activeFilter) || true);

    return (
        <section className="games-section">
            <div className="section-title-block">
                <h3><FaGamepad /> Videojuegos Populares</h3>
                <div className="filter-bar">
                    {filters.map((tag) => (
                        <button 
                            key={tag}
                            className={`filter-btn ${activeFilter === tag ? 'active' : ''}`}
                            onClick={() => { setActiveFilter(tag); setCurrentIndex(0); }}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            <div className="carousel-window-single">
                {filteredGames.length > 0 ? (
                    <div className="carousel-track-single" style={{ transform: `translateX(-${currentIndex * 25}%)` }}>
                        {filteredGames.map((game, idx) => (
                            <div key={idx} className="game-poster-single" onClick={() => navigate(`/games/${game.id}`)}>
                                <img src={game.img} alt={game.name} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{padding: '20px', color: '#888'}}>No hay juegos en esta categoría.</div>
                )}
            </div>
        </section>
    );
};


// ==========================================
// 3. FEED SECTION (BOTONES FUNCIONALES)
// ==========================================
const FeedSection = () => {
    const [inputText, setInputText] = useState("");
    const [attachment, setAttachment] = useState(null);
    const [showEmoji, setShowEmoji] = useState(false);
    
    // ESTADO PARA COMENTARIOS (Guarda lo que escribes en cada post)
    const [commentInputs, setCommentInputs] = useState({}); 
    const [commentAttachments, setCommentAttachments] = useState({}); // Archivos por post
    const [activeEmojiPost, setActiveEmojiPost] = useState(null); // Qué post tiene el emoji abierto
    
    // --- AQUÍ ESTABA EL ERROR: FALTABA ESTE ESTADO ---
    const [replyingTo, setReplyingTo] = useState({}); 

    // ESTADO DE PRIVACIDAD
    const [privacy, setPrivacy] = useState("Public");

    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const textInputRef = useRef(null);

    const [posts, setPosts] = useState([
        {
            id: 1, 
            user: "AlexGamer", 
            avatar: LoLImg, 
            time: "2h",
            text: "Necesito un Sage main para subir a Ascendente. ¡Juego serio! 🔥",
            likes: 12, 
            liked: false,
            // NUEVO: Array de comentarios iniciales
            comments: [
                {
                    id: 101, 
                    user: "JettMain", 
                    avatar: ValorantImg, 
                    text: "Yo soy Ascendente 2, agrégame.", 
                    likes: 3, 
                    liked: false, 
                    image: null
                }
            ],
            showComments: false // Controla si se ve la caja de comentarios
        }
    ]);

    // 1. MAPA DE BANDERAS (Texto -> Componente)
    const FLAG_MAP = {
        "🇩🇴": DO, "🇲🇽": MX, "🇦🇷": AR, "🇨🇴": CO, "🇺🇸": US, 
        "🇪🇸": ES, "🇨🇱": CL, "🇵🇪": PE, "🇻🇪": VE, "🇧🇷": BR
    };

    // 2. LISTA DEL MENÚ
    const EMOJI_CATEGORIES = [
        {
            title: "Caras",
            icons: ["😀", "😂", "😍", "😎", "😭", "😡", "😱", "🥳", "😴", "🤡"]
        },
        {
            title: "Gaming",
            icons: ["🎮", "🕹️", "🎲", "👾", "🎧", "🖥️", "⌨️", "🖱️", "🏆", "🥇"]
        },
        {
            title: "Números",
            icons: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
        },
        {
            title: "Banderas",
            // Para el menú usamos el objeto, para que se vea el SVG al elegir
            icons: [
                { Comp: DO, char: "🇩🇴" },
                { Comp: MX, char: "🇲🇽" },
                { Comp: AR, char: "🇦🇷" },
                { Comp: CO, char: "🇨🇴" },
                { Comp: US, char: "🇺🇸" },
                { Comp: ES, char: "🇪🇸" },
                { Comp: CL, char: "🇨🇱" },
                { Comp: PE, char: "🇵🇪" },
                { Comp: VE, char: "🇻🇪" },
                { Comp: BR, char: "🇧🇷" }
            ]
        },
        {
            title: "Random",
            icons: ["🚀", "💎", "💩", "💀", "👻", "👽", "🤖", "🍕", "🍺", "🚗"]
        }
    ];
    // --- NUEVAS FUNCIONES DE LOS BOTONES ---

    // 1. ABRIR/CERRAR COMENTARIOS
    // 1. Alternar caja de comentarios
    const toggleComments = (postId) => {
        setPosts(posts.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
    };

   // 2. Manejar Inputs de Comentarios (Texto)
    const handleCommentChange = (postId, value) => {
        setCommentInputs({ ...commentInputs, [postId]: value });
    };
    // 3. Manejar Archivos en Comentarios
    const handleCommentFile = (postId, e, type) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setCommentAttachments({ 
                ...commentAttachments, 
                [postId]: { type, name: file.name, url: previewUrl, file } 
            });
        }
        e.target.value = null;
    };
    // 4. Agregar Emoji al Comentario
    const addEmojiToComment = (postId, emojiChar) => {
        setCommentInputs(prev => ({
            ...prev,
            [postId]: (prev[postId] || "") + emojiChar
        }));
    };
    // 5. ENVIAR COMENTARIO
    const submitComment = (postId) => {
        const text = commentInputs[postId];
        const attach = commentAttachments[postId];

        if ((!text || !text.trim()) && !attach) return;

        const newComment = {
            id: Date.now(),
            user: "Tú",
            avatar: ValorantImg,
            text: text || "",
            image: attach?.type === 'media' ? attach.url : null,
            file: attach?.type === 'file' ? attach : null,
            likes: 0,
            liked: false
        };
       setPosts(posts.map(p => {
            if (p.id === postId) {
                return { ...p, comments: [...(p.comments || []), newComment] };
            }
            return p;
        }));

        // Limpiar inputs
        setCommentInputs({ ...commentInputs, [postId]: "" });
        setCommentAttachments({ ...commentAttachments, [postId]: null });
        setActiveEmojiPost(null);

        // Limpiamos el estado de respuesta
        const newReplies = { ...replyingTo };
        delete newReplies[postId];
        setReplyingTo(newReplies);
        
        setActiveEmojiPost(null);
    };
    // 6. DAR LIKE A UN COMENTARIO
    const toggleCommentLike = (postId, commentId) => {
        setPosts(posts.map(p => {
            if (p.id === postId) {
                const updatedComments = p.comments.map(c => {
                    if (c.id === commentId) {
                        return { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 };
                    }
                    return c;
                });
                return { ...p, comments: updatedComments };
            }
            return p;
        }));
    };

    // 7. RESPONDER (Mencionar)
    const handleReplyTo = (postId, username) => {
        const currentText = commentInputs[postId] || "";
        setCommentInputs({ ...commentInputs, [postId]: `@${username} ` + currentText });
        setReplyingTo({ ...replyingTo, [postId]: username });
        // Faltaría hacer focus, pero React es reactivo, al cambiar el value el usuario ya puede escribir.
    };
// 8. CANCELAR RESPUESTA
    const cancelReply = (postId) => {
        const newReplies = { ...replyingTo };
        delete newReplies[postId]; // Borramos la respuesta de este post
        setReplyingTo(newReplies);
    };


    // 4. COMPARTIR (Simulación)
    const handleShare = (post) => {
        // En una app real, esto usaría navigator.share o copiaría al portapapeles
        alert(`Enlace del post de ${post.user} copiado al portapapeles! 🔗`);
    };

    // 3. RENDERIZADO "MAGICO" (Dibuja la bandera SVG sobre el texto)
    const renderHighlightedText = (text) => {
        if (!text) return <span style={{color: '#aaa'}}>What's on your mind?</span>;

        // Regex para encontrar banderas en el texto
        const flagRegex = new RegExp(`(${Object.keys(FLAG_MAP).join('|')})`, 'g');

        return text.split(flagRegex).map((part, index) => {
            // A. Si es una bandera, dibujamos el SVG
            if (FLAG_MAP[part]) {
                const FlagComp = FLAG_MAP[part];
                return (
                    <span key={index} style={{ display: 'inline-block', width: '22px', verticalAlign: 'middle', margin: '0 1px' }}>
                        <FlagComp />
                    </span>
                );
            }

            // B. Si es texto normal, coloreamos # y @
            return part.split(/(\s+)/).map((word, i) => {
                if (word.startsWith('#')) return <span key={i} className="highlight-hashtag">{word}</span>;
                if (word.startsWith('@')) return <span key={i} className="highlight-mention">{word}</span>;
                return <span key={i}>{word}</span>;
            });
        });
    };
    // --- ESTADO Y LÓGICA DE PRIVACIDAD ---
    const togglePrivacy = () => {
        if (privacy === "Public") setPrivacy("Friends");
        else if (privacy === "Friends") setPrivacy("Private");
        else setPrivacy("Public");
    };

    const getPrivacyIcon = () => {
        switch (privacy) {
            case "Public": return <FaGlobeAmericas style={{marginLeft: '4px'}} />;
            case "Friends": return <FaUserFriends style={{marginLeft: '4px'}} />;
            case "Private": return <FaLock style={{marginLeft: '4px', fontSize:'0.9rem'}} />;
            default: return <FaGlobeAmericas />;
        }
    };

    const handleAddEmoji = (emojiValue) => {
        setInputText(prev => prev + emojiValue);
        if (textInputRef.current) textInputRef.current.focus();
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setAttachment({ type, name: file.name, url: previewUrl, file });
        }
        e.target.value = null; 
    };

    const insertSymbol = (symbol) => {
        const prefix = (inputText.length > 0 && !inputText.endsWith(' ')) ? ' ' : '';
        setInputText(prev => prev + prefix + symbol);
        if(textInputRef.current) textInputRef.current.focus();
    };

    const handlePublish = () => {
        if (!inputText.trim() && !attachment) return;

        const newPost = {
            id: Date.now(), user: "Tú", avatar: ValorantImg, time: "Just now",
            text: inputText,
            image: attachment?.type === 'media' ? attachment.url : null,
            file: attachment?.type === 'file' ? attachment : null, 
            likes: 0, liked: false
        };
        setPosts([newPost, ...posts]);
        setInputText(""); setAttachment(null); setShowEmoji(false);
    };

    const toggleLike = (id) => {
        setPosts(posts.map(p => p.id === id ? { ...p, likes: p.liked ? p.likes - 1 : p.likes + 1, liked: !p.liked } : p));
    };

    return (
        <section className="feed-section-container">
            <div className="feed-title" style={{marginBottom: '15px', color: '#65676b', fontWeight: '600'}}><FaGlobeAmericas /> <span>Feed Global</span></div>

            <input type="file" ref={imageInputRef} style={{display: 'none'}} accept="image/*,video/*" onChange={(e) => handleFileChange(e, 'media')} />
            <input type="file" ref={fileInputRef} style={{display: 'none'}} accept=".pdf,.doc,.docx,.zip,.rar" onChange={(e) => handleFileChange(e, 'file')} />

            <div className="clean-post-card">
                <div className="clean-top-row">
                    <img src={ValorantImg} alt="User" className="clean-avatar" />
                    
                    <div className="clean-input-wrapper">
                        {/* CAPA DE FONDO: Dibuja las banderas bonitas */}
                        <div className="input-ghost-text">
                            {renderHighlightedText(inputText)}
                        </div>

                        {/* CAPA DE FRENTE: Input transparente para escribir */}
                        <input 
                            ref={textInputRef} 
                            className="real-input-transparent"
                            type="text" 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePublish()}
                            autoComplete="off"
                        />
                        
                        <FaSmile 
                            className="clean-emoji-icon" 
                            onClick={() => setShowEmoji(!showEmoji)} 
                        />
                        
                        {/* MENÚ FLOTANTE */}
                        {showEmoji && (
                            <div className="emoji-picker-popover">
                                {EMOJI_CATEGORIES.map((category, idx) => (
                                    <div key={idx} className="emoji-category-group">
                                        <div className="emoji-cat-title">{category.title}</div>
                                        <div className="emoji-grid">
                                            {category.icons.map((item, i) => {
                                                if (typeof item === 'object') {
                                                    const { Comp, char } = item;
                                                    return (
                                                        <div key={i} className="emoji-item" onClick={() => handleAddEmoji(char)} title={char}>
                                                            <div style={{width: '24px', height: '18px', display:'flex', justifyContent:'center', alignItems:'center'}}>
                                                                <Comp title={char} />
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div key={i} className="emoji-item" onClick={() => handleAddEmoji(item)}>
                                                        {item}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button 
                        className={`clean-publish-btn ${inputText || attachment ? 'active' : ''}`}
                        onClick={handlePublish}
                        disabled={!inputText && !attachment}
                    >
                        Share Post
                    </button>
                </div>

                {attachment && (
                    <div className="attachment-preview-box">
                        <span style={{display:'flex', alignItems:'center', gap:'5px'}}>
                            {attachment.type === 'media' ? <FaImage /> : <FaLink />} 
                            {attachment.name}
                        </span>
                        <button onClick={() => setAttachment(null)} style={{border:'none', background:'transparent', cursor:'pointer', color:'#65676b'}}><FaTimes /></button>
                    </div>
                )}

                <div className="clean-divider"></div>

                <div className="clean-bottom-row">
                    <div className="clean-tools-left">
                        <button className="clean-tool-btn" onClick={() => imageInputRef.current.click()}>
                            <FaImage className="icon-photo" /> <span>Image/Video</span>
                        </button>
                        <button className="clean-tool-btn" onClick={() => fileInputRef.current.click()}>
                            <span className="icon-attach" style={{fontSize: '1.2rem', display:'flex'}}>🔗</span> <span>Attachment</span>
                        </button>
                        <button className="clean-tool-btn" onClick={() => insertSymbol('#')}>
                            <span className="icon-hashtag" style={{fontWeight:'bold'}}>#</span> <span>Hashtag</span>
                        </button>
                        <button className="clean-tool-btn" onClick={() => insertSymbol('@')}>
                            <span className="icon-mention" style={{fontWeight:'bold'}}>@</span> <span>Mention</span>
                        </button>
                    </div>
                 <button 
                        className="clean-privacy-select" 
                        onClick={togglePrivacy}
                        title="Cambiar privacidad"
                    >
                        {privacy === "Public" && "Public"}
                        {privacy === "Friends" && "Friends"}
                        {privacy === "Private" && "Only Me"}
                        {getPrivacyIcon()}
                    </button>
                </div>
            </div>

            <div className="posts-feed-wrapper">
                {posts.map((post) => (
                    <div className="ui-post-card" key={post.id}>
                        {/* HEADER DEL POST (Igual) */}
                        <div className="ui-post-header">
                            <img src={post.avatar} alt="avatar" className="ui-avatar" />
                            <div className="ui-user-details">
                                <div className="ui-user-name">{post.user}</div>
                                <div className="ui-post-time">{post.time}</div>
                            </div>
                            <button className="ui-more-btn"><FaEllipsisH /></button>
                        </div>

                        {/* BODY DEL POST (Igual) */}
                        <div className="ui-post-body">
                           {/* ... Tu lógica de texto coloreado, imágenes y archivos ... */}
                           {/* (Copia tu contenido del body aquí) */}
                           <p className="ui-post-text">
                                {renderHighlightedText(post.text)}
                           </p>
                           {post.image && <img src={post.image} alt="content" className="ui-post-image" />}
                           {post.file && (
                                <div className="ui-post-file-card">
                                    <div className="file-icon-frame"><FaLink /></div>
                                    <div className="file-info">
                                        <span className="file-name">{post.file.name}</span>
                                        <span className="file-meta">Archivo adjunto</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* FOOTER CON BOTONES FUNCIONALES */}
                        <div className="ui-post-footer">
                            {/* BOTÓN LIKE */}
                            <button className={`footer-action-btn ${post.liked ? 'liked' : ''}`} onClick={() => toggleLike(post.id)}>
                                {post.liked ? <FaHeart color="#e91e63"/> : <FaRegHeart />} 
                                <span>{post.likes} Likes</span>
                            </button>

                            {/* BOTÓN COMENTAR (Ahora abre la caja) */}
                            <button className="footer-action-btn" onClick={() => toggleComments(post.id)}>
                                <FaComments /> 
                                <span>{post.comments ? post.comments.length : 0} Comment</span>
                            </button>

                            {/* BOTÓN COMPARTIR (Ahora hace algo) */}
                            <button className="footer-action-btn" onClick={() => handleShare(post)}>
                                <FaShareAlt /> 
                                <span>Share</span>
                            </button>
                        </div>

                      {/* --- SECCIÓN DE COMENTARIOS --- */}
                        {post.showComments && (
                            <div className="comments-section">
                                
                                {/* 1. Lista de Comentarios */}
                                <div className="comments-list">
                                    {post.comments && post.comments.map(comment => (
                                        <div className="single-comment" key={comment.id}>
                                            <img src={comment.avatar} alt="u" className="comment-avatar" />
                                            <div className="comment-content-block">
                                                <div className="comment-bubble">
                                                    <div className="comment-user">{comment.user}</div>
                                                    <div className="comment-text">{renderHighlightedText(comment.text)}</div>
                                                    
                                                    {/* Media en comentario */}
                                                    {comment.image && <img src={comment.image} className="comment-media-img" alt="attachment"/>}
                                                    {comment.file && (
                                                        <div className="comment-file-badge">
                                                            <FaLink /> {comment.file.name}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Acciones: Like, Reply */}
                                                <div className="comment-actions">
                                                    <button 
                                                        className={`action-link ${comment.liked ? 'liked' : ''}`}
                                                        onClick={() => toggleCommentLike(post.id, comment.id)}
                                                    >
                                                        {comment.liked ? <FaHeart /> : <FaRegHeart />}    
                                                        {/* Número de likes */}
                                                        <span>{comment.likes || 0}</span>  
                                                    </button>
                                                    <button className="action-link" onClick={() => handleReplyTo(post.id, comment.user)}>
                                                        Reply
                                                    </button>
                                                    <span style={{color:'#aaa'}}>{new Date(comment.id).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* 2. Input de Comentarios (Chat) */}
                                <div className="comment-input-area">
                                    <img src={ValorantImg} alt="me" className="comment-avatar" style={{width:'28px', height:'28px', alignSelf:'flex-end', marginBottom:'8px'}} />
                                    
                                    {/* ENVOLTORIO FLEXIBLE (NUEVO) */}
                                    <div className="comment-input-wrapper">
                                        
                                        {/* A. BARRA DE PREVISUALIZACIÓN DE RESPUESTA (Solo si existe replyingTo) */}
                                       {replyingTo[post.id] && (
            <div className="reply-preview-bar">
                <span className="reply-info">
                    Replying to <strong style={{color:'var(--brand-green)'}}>@{replyingTo[post.id]}</strong>
                </span>
                <button className="btn-cancel-reply" onClick={() => cancelReply(post.id)}>
                    <FaTimes />
                </button>
            </div>
        )}
                                        {/* B. PREVISUALIZACIÓN DE ARCHIVO (Ya la tenías, la mantenemos aquí) */}
                                        {commentAttachments[post.id] && (
                                            <div className="mini-attachment-preview" style={{bottom: '100%'}}>
                                                {commentAttachments[post.id].type === 'media' ? <FaImage/> : <FaLink/>}
                                                {commentAttachments[post.id].name}
                                                <FaTimes style={{cursor:'pointer'}} onClick={() => setCommentAttachments({...commentAttachments, [post.id]: null})} />
                                            </div>
                                        )}

                                        {/* C. EL INPUT REAL */}
                                     <input 
            type="text" 
            className="comment-input" 
            placeholder={replyingTo[post.id] ? `Reply to @${replyingTo[post.id]}...` : "Write a comment..."}
            value={commentInputs[post.id] || ""}
            onChange={(e) => handleCommentChange(post.id, e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}
            autoFocus={!!replyingTo[post.id]}
        />
                                    </div>

                                    {/* HERRAMIENTAS (Cámara, Emoji, Enviar) - SE MANTIENE IGUAL */}
                                   <div className="comment-tools">
            <label className="btn-icon-mini" title="Subir imagen">
                <input type="file" style={{display:'none'}} accept="image/*" onChange={(e) => handleCommentFile(post.id, e, 'media')} />
                <FaCamera />
            </label>
            
            <label className="btn-icon-mini" title="Adjuntar archivo">
                <input type="file" style={{display:'none'}} accept=".pdf,.doc" onChange={(e) => handleCommentFile(post.id, e, 'file')} />
                <FaLink style={{fontSize:'0.95rem'}} />
            </label>
            
            <button className="btn-icon-mini" onClick={() => setActiveEmojiPost(activeEmojiPost === post.id ? null : post.id)}>
                <FaSmile />
            </button>
            
            <button className="btn-send-comment" onClick={() => submitComment(post.id)}>
                <FaPaperPlane />
            </button>
        </div>

                                    {/* EMOJI PICKER (IGUAL QUE ANTES) */}
                                    {activeEmojiPost === post.id && (
                                       <div className="emoji-picker-popover" style={{top: 'auto', bottom: '50px', right: 0}}>
                                           {/* ... tu código del mapa de emojis ... */}
                                           {EMOJI_CATEGORIES.map((cat, idx) => (
                                                <div key={idx}>
                                                    <div className="emoji-cat-title">{cat.title}</div>
                                                    <div className="emoji-grid">
                                                        {cat.icons.map((item, i) => {
                                                                if (typeof item === 'object') return <div key={i} className="emoji-item" onClick={() => addEmojiToComment(post.id, item.char)}><item.Comp/></div>
                                                                return <div key={i} className="emoji-item" onClick={() => addEmojiToComment(post.id, item)}>{item}</div>
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                       </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};


// ==========================================
// 4. SIDEBAR
// ==========================================
const SidebarSection = ({ onOpenModal }) => {
    const navigate = useNavigate();
    const [adIndex, setAdIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setAdIndex((prev) => (prev + 1) % sponsorAds.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const currentAd = sponsorAds[adIndex];

    return (
        <aside className="sidebar-column">
            <div className="sponsor-card carousel-mode">
                <div className="sponsor-label"><FaAd /> Patrocinado</div>
                <div className="sponsor-color-overlay" style={{ backgroundColor: currentAd.color }}></div>
                <img key={currentAd.id} src={currentAd.img} alt="Sponsor" className="fade-in-anim" />
                <div className="sponsor-content">
                    <h4 className="fade-in-anim">{currentAd.title}</h4>
                    <button className="btn-sponsor-action">Ver más</button>
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
                    {organizersList.map((org, idx) => (
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

            <div className="creators-box communities-sidebar-v3">
                <div className="box-header"><h3><FaUserFriends /> Mis Comunidades</h3></div>
                <div className="sidebar-communities-list">
                    <div className="community-sidebar-item">
                        <div className="comm-avatar-frame">
                            <img src={ValorantImg} alt="comm" className="creator-img" />
                            <span className="status-indicator-online"></span>
                        </div>
                        <div className="creator-info">
                            <h5>Valorant LATAM</h5>
                            <span>15k Miembros</span>
                        </div>
                        <button className="btn-enter-community">Entrar</button>
                    </div>
                </div>
                <button className="btn-create-community-sidebar" onClick={onOpenModal}>
                    <FaPlusCircle /> <span>Crear Comunidad</span>
                </button>
            </div>
        </aside>
    );
};


// ==========================================
// 5. MODAL
// ==========================================
const CreateModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
            <div className="modal-content fade-in-up">
                <div className="modal-header">
                    <div className="modal-title-flex">
                        <FaPlusCircle className="icon-accent" />
                        <h2>Nueva Comunidad</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}><FaTimes /></button>
                </div>
                <div className="modal-body">
                    <div className="form-group-v3">
                        <label>Nombre de la comunidad</label>
                        <input type="text" placeholder="Ej: Elite Gamers" className="modal-input-v3" />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel-v3" onClick={onClose}>Cancelar</button>
                    <button className="btn-confirm-v3" onClick={onClose}>Crear ahora</button>
                </div>
            </div>
        </div>
    );
};


// ==========================================
// 6. MAIN
// ==========================================
const Community = () => {
    const [showModal, setShowModal] = useState(false);

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
                        <GameCarouselSection />
                        <FeedSection />
                    </div>

                    <SidebarSection onOpenModal={() => setShowModal(true)} />
                </div>
            </div>

            <CreateModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </div>
    );
};

export default Community;