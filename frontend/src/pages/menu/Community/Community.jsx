import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaGamepad, FaInfoCircle, FaFilePdf, FaCrown, FaGlobeAmericas, FaAd, FaExclamationTriangle, FaExclamationCircle, FaShieldAlt,
    FaUserFriends, FaCheckCircle, FaPlusCircle, FaTimes, FaUndo,FaUserShield, FaCheck, FaGavel, FaRocket,
    FaRegHeart, FaHeart, FaComments, FaEllipsisH, FaShareAlt, FaPaperPlane, FaBullhorn, FaUsers, FaChevronRight,
    FaCamera, FaSmile, FaImage, FaVideo, FaPoll, FaHashtag, FaAt, FaLock, FaTrash, FaEyeSlash, FaFlag, FaBan,
    FaLink
} from 'react-icons/fa';

// --- BANDERAS SVG ---
import { US, DO, MX, AR, CO, ES, CL, PE, VE, BR } from 'country-flag-icons/react/3x2';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';

import './Community.css';
import {
    fetchCommunityPosts,
    publishCommunityPost,
    toggleCommunityPostLike,
    publishCommunityComment,
    toggleCommunityCommentLike,
    reportCommunityPost,
    hideCommunityPost,
    deleteCommunityPost,
    fetchMyCommunities,
    createCommunitySpace
} from './community.service';

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
    const { user } = useAuth();
    const { addToast } = useNotification();
    const [inputText, setInputText] = useState("");
    const [attachment, setAttachment] = useState(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [publishingPost, setPublishingPost] = useState(false);
    
    // ESTADO PARA COMENTARIOS (Guarda lo que escribes en cada post)
    const [commentInputs, setCommentInputs] = useState({}); 
    const [commentAttachments, setCommentAttachments] = useState({}); // Archivos por post
    const [activeEmojiPost, setActiveEmojiPost] = useState(null); // Qué post tiene el emoji abierto
    
    const [showReportModal, setShowReportModal] = useState(false); // Modal reporte
    const [reportingPostId, setReportingPostId] = useState(null); // ID del post a reportar
    const [replyingTo, setReplyingTo] = useState({}); 
    

    // ESTADO DE PRIVACIDAD
    const [privacy, setPrivacy] = useState("Public");

    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const textInputRef = useRef(null);

    // --- ESTADO PARA EL MENÚ DE OPCIONES ---
    const [activeMenuId, setActiveMenuId] = useState(null); // Guarda el ID del post que tiene el menú abierto

  // --- LÓGICA DE MENÚ Y ACCIONES ---

    const toggleMenu = (id) => {
        if (activeMenuId === id) setActiveMenuId(null);
        else setActiveMenuId(id);
    };

    // 1. OCULTAR / DESHACER (Alterna la propiedad hidden)
    const toggleHidePost = async (id) => {
        try {
            const hidden = await hideCommunityPost(id);
            if (hidden) {
                setPosts((prev) => prev.filter((p) => p.id !== id));
                addToast('Publicación ocultada', 'success');
            } else {
                addToast('La publicación ya no está oculta', 'info');
            }
        } catch (error) {
            addToast(error?.response?.data?.message || 'No se pudo ocultar la publicación', 'error');
        } finally {
            setActiveMenuId(null);
        }
    };

    // 2. ELIMINAR (Borra permanentemente)
    const handleDeletePost = async (id) => {
        if (window.confirm("¿Eliminar post permanentemente?")) {
            try {
                await deleteCommunityPost(id);
                setPosts((prev) => prev.filter((p) => p.id !== id));
                addToast('Publicación eliminada', 'success');
            } catch (error) {
                addToast(error?.response?.data?.message || 'No se pudo eliminar la publicación', 'error');
            }
        }
        setActiveMenuId(null);
    };

    // 3. INICIAR REPORTE
    const initiateReport = (id) => {
        setReportingPostId(id);
        setShowReportModal(true);
        setActiveMenuId(null);
    };

    // 4. CONFIRMAR REPORTE (Viene del Modal)
    const handleConfirmReport = async (data) => {
        if (!reportingPostId) return;
        try {
            await reportCommunityPost(reportingPostId, data);
            addToast('Reporte enviado. Gracias por ayudar a moderar la comunidad.', 'success');
            setShowReportModal(false);
            setReportingPostId(null);
        } catch (error) {
            addToast(error?.response?.data?.message || 'No se pudo enviar el reporte', 'error');
        }
    };

    const [posts, setPosts] = useState([]);

    const currentUserName = user?.username || user?.userName || user?.fullName || 'Tú';
    const currentUserAvatar = user?.avatar || ValorantImg;

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

    const loadFeed = async () => {
        try {
            setLoadingPosts(true);
            const postsList = await fetchCommunityPosts();
            setPosts(postsList);
        } catch (error) {
            addToast(error?.response?.data?.message || 'No se pudo cargar el feed de comunidad', 'error');
        } finally {
            setLoadingPosts(false);
        }
    };

    useEffect(() => {
        loadFeed();
    }, []);

    // --- NUEVAS FUNCIONES DE LOS BOTONES ---

    // 1. ABRIR/CERRAR COMENTARIOS
    // 1. Alternar caja de comentarios
    const toggleComments = (postId) => {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, showComments: !p.showComments } : p)));
    };

   // 2. Manejar Inputs de Comentarios (Texto)
    const handleCommentChange = (postId, value) => {
        setCommentInputs((prev) => ({ ...prev, [postId]: value }));
    };
    // 3. Manejar Archivos en Comentarios
    const handleCommentFile = (postId, e, type) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setCommentAttachments((prev) => ({
                ...prev,
                [postId]: { type, name: file.name, url: previewUrl, file }
            }));
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
    const submitComment = async (postId) => {
        const text = commentInputs[postId];
        const attach = commentAttachments[postId];

        if ((!text || !text.trim()) && !attach) return;
        try {
            const createdComment = await publishCommunityComment(postId, {
                text,
                attachmentFile: attach?.file,
                attachmentType: attach?.type
            });

            setPosts((prev) =>
                prev.map((p) => {
                    if (p.id !== postId) return p;
                    return { ...p, comments: [...(p.comments || []), createdComment] };
                })
            );

            setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
            setCommentAttachments((prev) => ({ ...prev, [postId]: null }));
            setReplyingTo((prev) => {
                const next = { ...prev };
                delete next[postId];
                return next;
            });
            setActiveEmojiPost(null);
        } catch (error) {
            addToast(error?.response?.data?.message || 'No se pudo enviar el comentario', 'error');
        }
    };
    // 6. DAR LIKE A UN COMENTARIO
    const toggleCommentLike = async (postId, commentId) => {
        try {
            const result = await toggleCommunityCommentLike(postId, commentId);
            setPosts((prev) =>
                prev.map((p) => {
                    if (p.id !== postId) return p;
                    const updatedComments = (p.comments || []).map((c) => {
                        if (c.id !== commentId) return c;
                        return { ...c, liked: result.likedByMe, likes: result.likesCount };
                    });
                    return { ...p, comments: updatedComments };
                })
            );
        } catch (error) {
            addToast(error?.response?.data?.message || 'No se pudo reaccionar al comentario', 'error');
        }
    };

    // 7. RESPONDER (Mencionar)
    const handleReplyTo = (postId, username) => {
        const currentText = commentInputs[postId] || "";
        setCommentInputs((prev) => ({ ...prev, [postId]: `@${username} ${currentText}` }));
        setReplyingTo((prev) => ({ ...prev, [postId]: username }));
    };

    const cancelReply = (postId) => {
        setReplyingTo((prev) => {
            const next = { ...prev };
            delete next[postId];
            return next;
        });
    };


    const handleShare = async (post) => {
        const permalink = `${window.location.origin}/comunidad?post=${post.id}`;
        try {
            await navigator.clipboard.writeText(permalink);
            addToast('Enlace copiado al portapapeles', 'success');
        } catch (_) {
            addToast('No se pudo copiar el enlace', 'error');
        }
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
    

    const handlePublish = async () => {
        if (!inputText.trim() && !attachment) return;

        try {
            setPublishingPost(true);
            const createdPost = await publishCommunityPost({
                text: inputText,
                privacy,
                attachmentFile: attachment?.file,
                attachmentType: attachment?.type
            });
            setPosts((prev) => [createdPost, ...prev]);
            setInputText('');
            setAttachment(null);
            setShowEmoji(false);
            addToast('Publicación creada', 'success');
        } catch (error) {
            addToast(error?.response?.data?.message || 'No se pudo crear la publicación', 'error');
        } finally {
            setPublishingPost(false);
        }
    };

    const toggleLike = async (id) => {
        try {
            const result = await toggleCommunityPostLike(id);
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === id ? { ...p, likes: result.likesCount, liked: result.likedByMe } : p
                )
            );
        } catch (error) {
            addToast(error?.response?.data?.message || 'No se pudo reaccionar la publicación', 'error');
        }
    };

    return (
        <>
        <section className="feed-section-container">
            <div className="feed-title" style={{marginBottom: '15px', color: '#65676b', fontWeight: '600'}}><FaGlobeAmericas /> <span>Feed Global</span></div>

            <input type="file" ref={imageInputRef} style={{display: 'none'}} accept="image/*,video/*" onChange={(e) => handleFileChange(e, 'media')} />
            <input type="file" ref={fileInputRef} style={{display: 'none'}} accept=".pdf,.doc,.docx,.zip,.rar" onChange={(e) => handleFileChange(e, 'file')} />

            <div className="clean-post-card">
                <div className="clean-top-row">
                    <img src={currentUserAvatar || ValorantImg} alt={currentUserName} className="clean-avatar" />
                    
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
                        disabled={publishingPost || (!inputText && !attachment)}
                    >
                        {publishingPost ? 'Publicando...' : 'Share Post'}
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
                {loadingPosts ? (
                    <div className="ui-post-card">
                        <p className="ui-post-text">Cargando feed de comunidad...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="ui-post-card">
                        <p className="ui-post-text">Aún no hay publicaciones. Sé el primero en compartir algo.</p>
                    </div>
                ) : posts.map((post) => (
                    <div className="ui-post-card" key={post.id}>
                        {/* HEADER DEL POST (Igual) */}
                        <div className="ui-post-header">
                            <img src={post.avatar || ValorantImg} alt="avatar" className="ui-avatar" />
                            <div className="ui-user-details">
                                <div className="ui-user-name">{post.user}</div>
                                <div className="ui-post-time">{post.time}</div>
                            </div>
                            {/* --- MENÚ DE OPCIONES --- */}
    <div className="post-options-container">
        <button className="ui-more-btn" onClick={() => toggleMenu(post.id)}>
            <FaEllipsisH />
        </button>

        {/* Solo mostramos el menú si el ID coincide */}
        {activeMenuId === post.id && (
            <div className="post-menu-dropdown">
                {/* Opción 1: Guardar (Simulada) */}
                <button className="menu-item" onClick={() => setActiveMenuId(null)}>
                    <FaRegHeart /> <span>Guardar publicación</span>
                </button>
                
                {/* Opción 2: Ocultar */}
                <button className="menu-item" onClick={() => toggleHidePost(post.id)}>
        <FaEyeSlash /> <span>Ocultar post</span>
    </button>
                {/* Opción 3: Reportar */}
                <button className="menu-item danger" onClick={() => initiateReport(post.id)}>
        <FaFlag /> <span>Reportar</span>
    </button>
                
                {/* Opción 4: Eliminar (Solo si el post es tuyo) */}
                {post.isOwner && (
                    <button className="menu-item danger" onClick={() => handleDeletePost(post.id)}>
                        <FaTrash /> <span>Eliminar</span>
                    </button>
                )}
            </div>
        )}
    </div>

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
                                            <img src={comment.avatar || ValorantImg} alt="u" className="comment-avatar" />
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
                                                        <span>{comment.likes || 0}</span>  
                                                    </button>
                                                    <button className="action-link" onClick={() => handleReplyTo(post.id, comment.user)}>
                                                        Reply
                                                    </button>
                                                    <span style={{color:'#aaa'}}>
                                                        {comment.createdAt
                                                            ? new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : 'Ahora'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* 2. Input de Comentarios (CORREGIDO Y LIMPIO) */}
                                <div className="comment-input-area">
                                    <img src={currentUserAvatar || ValorantImg} alt={currentUserName} className="comment-avatar" />
                                    
                                    {/* INICIO DE LA PÍLDORA (WRAPPER) */}
                                    <div className="comment-input-wrapper">
                                        
                                        {/* A. PREVIEW DE RESPUESTA (Si existe) */}
                                        {replyingTo[post.id] && (
                                            <div className="reply-preview-bar">
                                                <span className="reply-info">
                                                    Replying to <strong>@{replyingTo[post.id]}</strong>
                                                </span>
                                                <button className="btn-cancel-reply" onClick={() => cancelReply(post.id)}>
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        )}

                                        {/* B. PREVIEW DE ARCHIVO (Si existe) */}
                                        {commentAttachments[post.id] && (
                                            <div className="reply-preview-bar" style={{borderBottom:'1px solid var(--sidebar-border)', borderRadius:'8px', bottom:'110%'}}>
                                                <span style={{display:'flex', gap:'5px', alignItems:'center'}}>
                                                    {commentAttachments[post.id].type === 'media' ? <FaImage/> : <FaLink/>}
                                                    {commentAttachments[post.id].name}
                                                </span>
                                                <FaTimes
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() =>
                                                        setCommentAttachments((prev) => ({ ...prev, [post.id]: null }))
                                                    }
                                                />
                                            </div>
                                        )}

                                        {/* C. EL INPUT REAL */}
                                        <input 
                                            type="text" 
                                            className="comment-input-textbox" 
                                            placeholder={replyingTo[post.id] ? `Reply to @${replyingTo[post.id]}...` : "Write a comment..."}
                                            value={commentInputs[post.id] || ""}
                                            onChange={(e) => handleCommentChange(post.id, e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}
                                            autoFocus={!!replyingTo[post.id]}
                                        />

                                        {/* D. HERRAMIENTAS (DENTRO DEL WRAPPER) */}
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

                                    </div> 
                                    {/* CIERRE DEL WRAPPER (PÍLDORA) */}

                                    {/* EMOJI PICKER FLOTANTE */}
                                    {activeEmojiPost === post.id && (
                                        <div className="emoji-picker-popover" style={{top: 'auto', bottom: '60px', right: 0}}>
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
        <ReportModal
            isOpen={showReportModal}
            onClose={() => {
                setShowReportModal(false);
                setReportingPostId(null);
            }}
            onSubmit={handleConfirmReport}
        />
        </>
    );
};
// ==========================================
// NUEVO COMPONENTE: MODAL DE REPORTE
// ==========================================
const ReportModal = ({ isOpen, onClose, onSubmit }) => {
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");

    if (!isOpen) return null;

    const reportOptions = [
        "Es spam o engañoso",
        "Lenguaje ofensivo o de odio",
        "Información falsa",
        "Acoso o bullying",
        "Violencia o contenido explícito"
    ];

    const handleSubmit = () => {
        onSubmit({ reason, details });
        // Reset
        setReason("");
        setDetails("");
    }
    return (
        <div className="report-modal-overlay" onClick={(e) => e.target.className === 'report-modal-overlay' && onClose()}>
            <div className="report-modal-content">
                <div className="report-header">
                    <h3><FaExclamationTriangle style={{color:'#e91e63', marginRight:'8px'}}/> Reportar publicación</h3>
                    <button className="btn-icon-mini" onClick={onClose}><FaTimes /></button>
                </div>
                
                <div className="report-body">
                    <span className="report-label">Selecciona un problema:</span>
                    <div className="report-options-grid">
                        {reportOptions.map((opt, idx) => (
                            <label key={idx} className={`report-option-label ${reason === opt ? 'selected' : ''}`}>
                                <input 
                                    type="radio" 
                                    name="reportReason" 
                                    className="report-radio"
                                    checked={reason === opt}
                                    onChange={() => setReason(opt)}
                                />
                                {opt}
                            </label>
                        ))}
                    </div>

                    <span className="report-label">Detalles adicionales (opcional):</span>
                    <textarea 
                        className="report-textarea" 
                        placeholder="Danos más contexto..."
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                    ></textarea>
                </div>

                <div className="report-footer">
                    <button className="btn-cancel-modal" onClick={onClose}>Cancelar</button>
                    <button 
                        className="btn-submit-report" 
                        onClick={handleSubmit}
                        disabled={!reason}
                    >
                        Enviar Reporte
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 4. SIDEBAR
// ==========================================
const SidebarSection = ({ onOpenModal, myCommunities = [], communitiesLoading = false }) => {
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
                    {communitiesLoading ? (
                        <div className="community-sidebar-item">
                            <div className="creator-info">
                                <h5>Cargando comunidades...</h5>
                                <span>Sincronizando panel</span>
                            </div>
                        </div>
                    ) : myCommunities.length > 0 ? (
                        myCommunities.map((community) => (
                            <div className="community-sidebar-item" key={community.id}>
                                <div className="comm-avatar-frame">
                                    <img src={community.avatarUrl || ValorantImg} alt={community.name} className="creator-img" />
                                    <span className="status-indicator-online"></span>
                                </div>
                                <div className="creator-info">
                                    <h5>{community.name}</h5>
                                    <span>{community.membersCount || 0} Miembros</span>
                                </div>
                                <button className="btn-enter-community" onClick={() => navigate(`/comunidad/${community.shortUrl}`)}>
                                    Entrar
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="community-sidebar-item">
                            <div className="creator-info">
                                <h5>Aún no tienes comunidades</h5>
                                <span>Crea la primera desde aquí</span>
                            </div>
                        </div>
                    )}
                </div>
                <button className="btn-create-community-sidebar" onClick={onOpenModal}>
                    <FaPlusCircle /> <span>Crear Comunidad</span>
                </button>
            </div>
        </aside>
    );
};


// ==========================================
// 5. MODAL (MEJORADO Y RESTRINGIDO)
// ==========================================

const CreateCommunityModal = ({ isOpen, onClose, onCommunityCreated }) => {
    const { user } = useAuth();
    const { addToast } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // --- NAVEGACIÓN ---
    const [activeTab, setActiveTab] = useState('identity'); 

    // --- ESTADOS DEL FORMULARIO COMPLETO ---
    const [formData, setFormData] = useState({
        // 1. Identidad Pública
        name: '', shortUrl: '', description: '', type: 'Mixta', 
        targetAudience: 'Mixto', language: 'Español', region: 'LATAM', launchDate: '',
        
        // 2. Temática y Contenido
        mainGames: [], allowAllGames: false,
        contentCategories: { noticias: true, memes: true, opinion: true, clips: true, fanart: true, guias: true },
        contentProhibited: '',
        
        // 3. Sistema de Publicaciones
        postTypes: { texto: true, imagen: true, video: true, enlace: true, encuestas: true },
        whoCanPost: 'all', // all, verified, staff
        allowComments: true, preModeration: false, allowReactions: true, allowShare: true,

        // 4. Usuarios y Roles
        roles: { owner: true, admin: true, moderator: true, user: true, visitor: true },
        
        // 7. Moderación y Reglas
        rulesText: '', toxicityFilter: true, spoilerTag: true, nsfwAllowed: false,
        
        // 8. Reportes & 13. Seguridad
        reportReasons: { spam: true, hate: true, nsfw: true, spoiler: true },
        emailVerification: true, antiSpamControl: true,

        // 12. Comunicación & 14. Futuro
        discordIntegration: false, welcomeEmail: true,
        futureEvents: false, futureTournaments: false
    });

    // Archivos
    const [media, setMedia] = useState({
        banner: { file: null, preview: null },
        avatar: { file: null, preview: null },
        rulesPdf: { file: null, name: '' }
    });

    // Admins
    const [adminInput, setAdminInput] = useState('');
    const [admins, setAdmins] = useState([]);

    // Referencias
    const bannerRef = useRef(null);
    const avatarRef = useRef(null);
    const pdfRef = useRef(null);

    if (!isOpen) return null;

    const canCreateCommunity = Boolean(user?.isOrganizer || user?.isAdmin);

    // --- BLOQUEO DE SEGURIDAD ---
    if (!canCreateCommunity) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content restricted-modal fade-in-up">
                    <div className="restricted-icon-box"><FaLock /></div>
                    <h2>Acceso Restringido</h2>
                    <p>Esta herramienta profesional está reservada para <strong>Organizadores Verificados</strong>.</p>
                    <button className="btn-confirm-v3" onClick={onClose}>Entendido</button>
                </div>
            </div>
        );
    }

    // --- HANDLERS GENÉRICOS ---
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleCheck = (e) => setFormData({ ...formData, [e.target.name]: e.target.checked });
    
    // Handler para objetos anidados (ej: contentCategories.noticias)
    const handleNestedCheck = (category, key) => {
        setFormData(prev => ({
            ...prev,
            [category]: { ...prev[category], [key]: !prev[category][key] }
        }));
    };

    // Manejo de Imágenes
    const handleImage = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setMedia(prev => ({ ...prev, [type]: { file, preview: URL.createObjectURL(file) } }));
        }
    };

    // Manejo de PDF
    const handlePdf = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setMedia(prev => ({ ...prev, rulesPdf: { file, name: file.name } }));
        } else {
            alert("Solo archivos PDF.");
        }
    };

    const toggleGame = (game) => {
        const current = formData.mainGames;
        if (current.includes(game)) setFormData({ ...formData, mainGames: current.filter(g => g !== game) });
        else if (current.length < 5) setFormData({ ...formData, mainGames: [...current, game] });
    };

    const addAdmin = (e) => {
        if (e.key === 'Enter' && adminInput.trim()) {
            if (!admins.includes(adminInput.trim())) setAdmins([...admins, adminInput.trim()]);
            setAdminInput('');
        }
    };

    const AVAILABLE_GAMES = ["Valorant", "LoL", "CS2", "Fortnite", "CoD", "FIFA", "Minecraft", "Overwatch 2", "Rocket League", "GTA V"];

    // --- MENSAJES MOTIVACIONALES ---
    const getMotivationalMessage = () => {
        switch(activeTab) {
            case 'identity': return "🚀 El primer paso hacia la grandeza. Define quiénes son.";
            case 'content': return "🎮 El contenido es el rey. Diseña la experiencia de tus usuarios.";
            case 'rules': return "⚖️ Un gran poder conlleva una gran responsabilidad. Establece el orden.";
            case 'team': return "🛡️ No estás solo. Recluta a tus fieles guardianes.";
            case 'settings': return "⚙️ Los detalles técnicos que marcan la diferencia profesional.";
            default: return "";
        }
    };

    const handleCreateCommunity = async () => {
        if (!formData.name?.trim()) {
            setActiveTab('identity');
            addToast('El nombre público es obligatorio', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const created = await createCommunitySpace({
                formData,
                media,
                admins
            });
            addToast('Comunidad creada correctamente', 'success');
            if (typeof onCommunityCreated === 'function') {
                onCommunityCreated(created);
            }
            onClose();
        } catch (error) {
            addToast(error?.response?.data?.message || 'No se pudo crear la comunidad', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
            <div className="modal-content fade-in-up modal-xl-pro"> 
                
                {/* HEADER PRO */}
                <div className="modal-header-complex">
                    <div className="header-top">
                        <div className="header-brand">
                            <div>
                                <h3 style={{margin:0}}>Crear Comunidad Profesional</h3>
                                <small style={{color:'var(--text-muted)'}}>Panel de Control de Organizador</small>
                            </div>
                        </div>
                        <button className="close-btn" onClick={onClose}><FaTimes /></button>
                    </div>
                    
                    {/* BARRA DE PROGRESO / PESTAÑAS */}
                    <div className="modal-tabs-pro">
                        {[
                            { id: 'identity', icon: FaInfoCircle, label: 'Identidad' },
                            { id: 'content', icon: FaGamepad, label: 'Contenido' },
                            { id: 'rules', icon: FaGavel, label: 'Reglas' },
                            { id: 'team', icon: FaUsers, label: 'Equipo' },
                            { id: 'settings', icon: FaShieldAlt, label: 'Avanzado' },
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                className={`tab-btn-pro ${activeTab === tab.id ? 'active' : ''}`} 
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* MENSAJE MOTIVACIONAL INTERMEDIO */}
                <div className="motivational-banner fade-in">
                    {getMotivationalMessage()}
                </div>

                <div className="modal-body scrollable-body pro-body">
                    
                    {/* ================= PESTAÑA 1: IDENTIDAD ================= */}
                    {activeTab === 'identity' && (
                        <div className="tab-content fade-in">
                            <div className="media-upload-section">
                                <div className="banner-upload-area" onClick={() => bannerRef.current.click()} style={{backgroundImage: media.banner.preview ? `url(${media.banner.preview})` : 'none'}}>
                                    {!media.banner.preview && <div className="placeholder-content"><FaImage size={24}/> <span>Banner Principal (1200x300)</span></div>}
                                    <input type="file" ref={bannerRef} hidden accept="image/*" onChange={(e) => handleImage(e, 'banner')} />
                                </div>
                                <div className="avatar-upload-circle" onClick={() => avatarRef.current.click()} style={{backgroundImage: media.avatar.preview ? `url(${media.avatar.preview})` : 'none'}}>
                                    {!media.avatar.preview && <FaCamera />}
                                    <input type="file" ref={avatarRef} hidden accept="image/*" onChange={(e) => handleImage(e, 'avatar')} />
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group-v3">
                                    <label>Nombre Público</label>
                                    <input type="text" name="name" className="modal-input-v3" placeholder="Ej: Valorant LATAM Oficial" value={formData.name} onChange={handleChange} />
                                </div>
                                <div className="form-group-v3">
                                    <label>URL Corta / Slug</label>
                                    <div className="input-prefix-group">
                                        <span>esportefy.com/c/</span>
                                        <input type="text" name="shortUrl" placeholder="valorant-latam" value={formData.shortUrl} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group-v3">
                                <label>Descripción Pública (Misión)</label>
                                <textarea name="description" className="modal-input-v3" rows="2" placeholder="¿Qué es esta comunidad y para quién?" value={formData.description} onChange={handleChange}></textarea>
                            </div>

                            <div className="form-grid-3">
                                <div className="form-group-v3">
                                    <label>Región</label>
                                    <select name="region" className="modal-input-v3" value={formData.region} onChange={handleChange}>
                                        <option>Global</option><option>LATAM</option><option>Europa</option><option>Norteamérica</option><option>Brasil</option>
                                    </select>
                                </div>
                                <div className="form-group-v3">
                                    <label>Idioma</label>
                                    <select name="language" className="modal-input-v3" value={formData.language} onChange={handleChange}>
                                        <option>Español</option><option>Inglés</option><option>Portugués</option><option>Mixto</option>
                                    </select>
                                </div>
                                <div className="form-group-v3">
                                    <label>Público Objetivo</label>
                                    <select name="targetAudience" className="modal-input-v3" value={formData.targetAudience} onChange={handleChange}>
                                        <option>Casual</option><option>Hardcore / Competitivo</option><option>Mixto</option><option>Profesional</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================= PESTAÑA 2: CONTENIDO ================= */}
                    {activeTab === 'content' && (
                        <div className="tab-content fade-in">
                            <div className="section-block">
                                <h4><FaGamepad /> Alcance del Contenido</h4>
                                <div className="form-group-v3">
                                    <label>Videojuegos Principales (Máx 5)</label>
                                    <div className="games-grid-selector">
                                        {AVAILABLE_GAMES.map(game => (
                                            <div key={game} className={`game-selector-item ${formData.mainGames.includes(game) ? 'selected' : ''}`} onClick={() => toggleGame(game)}>
                                                {formData.mainGames.includes(game) && <FaCheck className="check-icon"/>}
                                                {game}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="checkbox-row mt-2">
                                        <input type="checkbox" name="allowAllGames" checked={formData.allowAllGames} onChange={handleCheck} />
                                        <span>Permitir contenido Off-Topic / Otros juegos</span>
                                    </div>
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="section-block">
                                    <h4>Categorías Permitidas</h4>
                                    <div className="checkbox-grid">
                                        {Object.keys(formData.contentCategories).map(cat => (
                                            <label key={cat} className="checkbox-card">
                                                <input type="checkbox" checked={formData.contentCategories[cat]} onChange={() => handleNestedCheck('contentCategories', cat)} />
                                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="section-block">
                                    <h4>Tipos de Posts</h4>
                                    <div className="checkbox-grid">
                                        {Object.keys(formData.postTypes).map(type => (
                                            <label key={type} className="checkbox-card">
                                                <input type="checkbox" checked={formData.postTypes[type]} onChange={() => handleNestedCheck('postTypes', type)} />
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group-v3">
                                <label>Contenido Prohibido (Resumen)</label>
                                <input type="text" name="contentProhibited" className="modal-input-v3" placeholder="Ej: Piratería, Cheats, NSFW Explicito..." value={formData.contentProhibited} onChange={handleChange} />
                            </div>
                        </div>
                    )}

                    {/* ================= PESTAÑA 3: REGLAS Y MODERACIÓN ================= */}
                    {activeTab === 'rules' && (
                        <div className="tab-content fade-in">
                            <div className="form-grid">
                                <div className="section-block">
                                    <h4><FaFilePdf /> Documentación Legal</h4>
                                    <div className={`pdf-dropzone ${media.rulesPdf.file ? 'file-selected' : ''}`} onClick={() => pdfRef.current.click()}>
                                        <FaFilePdf className="pdf-icon" />
                                        <div className="pdf-info">
                                            {media.rulesPdf.file ? <span className="filename">{media.rulesPdf.name}</span> : <span>Subir Reglamento PDF</span>}
                                        </div>
                                        <input type="file" ref={pdfRef} hidden accept="application/pdf" onChange={handlePdf} />
                                    </div>
                                </div>
                                <div className="section-block">
                                    <h4><FaGavel /> Filtros Automáticos</h4>
                                    <div className="toggles-list">
                                        <label className="toggle-row">
                                            <span>Filtro de Toxicidad / Hate</span>
                                            <input type="checkbox" name="toxicityFilter" checked={formData.toxicityFilter} onChange={handleCheck} />
                                        </label>
                                        <label className="toggle-row">
                                            <span>Etiqueta Spoilers Obligatoria</span>
                                            <input type="checkbox" name="spoilerTag" checked={formData.spoilerTag} onChange={handleCheck} />
                                        </label>
                                        <label className="toggle-row">
                                            <span>Permitir NSFW (+18)</span>
                                            <input type="checkbox" name="nsfwAllowed" checked={formData.nsfwAllowed} onChange={handleCheck} />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group-v3 mt-3">
                                <label>Normas de Convivencia (Web Visible)</label>
                                <textarea name="rulesText" className="modal-input-v3" rows="4" placeholder="1. Respeto ante todo...&#10;2. No spam...&#10;3. Usar canales correctos..." value={formData.rulesText} onChange={handleChange}></textarea>
                            </div>
                        </div>
                    )}

                    {/* ================= PESTAÑA 4: EQUIPO Y USUARIOS ================= */}
                    {activeTab === 'team' && (
                        <div className="tab-content fade-in">
                            <div className="section-block">
                                <h4><FaUserShield /> Estructura del Staff</h4>
                                <div className="admins-input-container">
                                    <div className="admins-list">
                                        <span className="admin-tag owner">@Tú (Owner)</span>
                                        {admins.map((admin, idx) => (
                                            <span key={idx} className="admin-tag">
                                                @{admin} <FaTimes onClick={() => setAdmins(admins.filter(a => a !== admin))} />
                                            </span>
                                        ))}
                                        <input type="text" className="transparent-input" placeholder="Añadir Admin..." value={adminInput} onChange={(e) => setAdminInput(e.target.value)} onKeyDown={addAdmin} />
                                    </div>
                                </div>
                                <p className="helper-text">Los administradores tienen acceso completo al panel de moderación y logs.</p>
                            </div>

                            <div className="form-group-v3 mt-3">
                                <label>Permisos de Publicación</label>
                                <div className="radio-group-vertical">
                                    <label className={`radio-card ${formData.whoCanPost === 'staff' ? 'active' : ''}`}>
                                        <input type="radio" name="whoCanPost" value="staff" checked={formData.whoCanPost === 'staff'} onChange={handleChange} />
                                        <div><strong>Solo Staff (Noticias)</strong><p>Usuarios solo comentan.</p></div>
                                    </label>
                                    <label className={`radio-card ${formData.whoCanPost === 'verified' ? 'active' : ''}`}>
                                        <input type="radio" name="whoCanPost" value="verified" checked={formData.whoCanPost === 'verified'} onChange={handleChange} />
                                        <div><strong>Usuarios Verificados</strong><p>Requiere verificación previa.</p></div>
                                    </label>
                                    <label className={`radio-card ${formData.whoCanPost === 'all' ? 'active' : ''}`}>
                                        <input type="radio" name="whoCanPost" value="all" checked={formData.whoCanPost === 'all'} onChange={handleChange} />
                                        <div><strong>Comunidad Abierta</strong><p>Cualquiera puede publicar.</p></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================= PESTAÑA 5: AVANZADO / SETTINGS ================= */}
                    {activeTab === 'settings' && (
                        <div className="tab-content fade-in">
                            <div className="form-grid">
                                <div className="section-block">
                                    <h4><FaShieldAlt /> Seguridad</h4>
                                    <div className="toggles-list">
                                        <label className="toggle-row">
                                            <span>Verificación de Email</span>
                                            <input type="checkbox" name="emailVerification" checked={formData.emailVerification} onChange={handleCheck} />
                                        </label>
                                        <label className="toggle-row">
                                            <span>Control Anti-Spam</span>
                                            <input type="checkbox" name="antiSpamControl" checked={formData.antiSpamControl} onChange={handleCheck} />
                                        </label>
                                        <label className="toggle-row">
                                            <span>Moderación Previa de Posts</span>
                                            <input type="checkbox" name="preModeration" checked={formData.preModeration} onChange={handleCheck} />
                                        </label>
                                    </div>
                                </div>
                                <div className="section-block">
                                    <h4><FaBullhorn /> Comunicación</h4>
                                    <div className="toggles-list">
                                        <label className="toggle-row">
                                            <span>Email de Bienvenida</span>
                                            <input type="checkbox" name="welcomeEmail" checked={formData.welcomeEmail} onChange={handleCheck} />
                                        </label>
                                        <label className="toggle-row">
                                            <span>Integración Discord (Webhook)</span>
                                            <input type="checkbox" name="discordIntegration" checked={formData.discordIntegration} onChange={handleCheck} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="section-block mt-3">
                                <h4><FaRocket /> Futuro (Roadmap)</h4>
                                <div className="checkbox-grid">
                                    <label className="checkbox-card">
                                        <input type="checkbox" name="futureEvents" checked={formData.futureEvents} onChange={handleCheck} />
                                        Eventos en Vivo
                                    </label>
                                    <label className="checkbox-card">
                                        <input type="checkbox" name="futureTournaments" checked={formData.futureTournaments} onChange={handleCheck} />
                                        Torneos Oficiales
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* FOOTER */}
                <div className="modal-footer">
                    <button className="btn-cancel-v3" onClick={onClose}>Cancelar</button>
                    {activeTab !== 'settings' ? (
                        <button className="btn-next-v3" onClick={() => {
                            const tabs = ['identity', 'content', 'rules', 'team', 'settings'];
                            const nextIndex = tabs.indexOf(activeTab) + 1;
                            if (nextIndex < tabs.length) setActiveTab(tabs[nextIndex]);
                        }}>
                            Siguiente <FaChevronRight />
                        </button>
                    ) : (
                        <button className="btn-confirm-v3" onClick={handleCreateCommunity} disabled={isSubmitting}>
                            {isSubmitting ? 'Creando...' : 'Lanzar Comunidad'} <FaRocket />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 6. MAIN
// ==========================================

const Community = () => {
    const { addToast } = useNotification();
    const [showModal, setShowModal] = useState(false);
    const [myCommunities, setMyCommunities] = useState([]);
    const [communitiesLoading, setCommunitiesLoading] = useState(true);

    const loadCommunities = async () => {
        try {
            setCommunitiesLoading(true);
            const list = await fetchMyCommunities();
            setMyCommunities(list);
        } catch (error) {
            addToast(error?.response?.data?.message || 'No se pudieron cargar tus comunidades', 'error');
        } finally {
            setCommunitiesLoading(false);
        }
    };

    useEffect(() => {
        loadCommunities();
    }, []);

    const handleCommunityCreated = (community) => {
        if (community?.id) {
            setMyCommunities((prev) => [community, ...prev.filter((item) => item.id !== community.id)]);
        } else {
            loadCommunities();
        }
        setShowModal(false);
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
                        <GameCarouselSection />
                        <FeedSection />
                    </div>

                    <SidebarSection
                        onOpenModal={() => setShowModal(true)}
                        myCommunities={myCommunities}
                        communitiesLoading={communitiesLoading}
                    />
                </div>
            </div>

            {/* --- AQUÍ ESTÁ EL CAMBIO --- */}
            {/* Antes decía <CreateModal ... /> */}
            <CreateCommunityModal 
                isOpen={showModal} 
                onClose={() => setShowModal(false)}
                onCommunityCreated={handleCommunityCreated}
            />
        </div>
    );
};


export default Community;
