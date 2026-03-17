import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useNotification } from '../../../../context/NotificationContext';
import './FeedPanel.css';

const GAME_OPTIONS = [
    { id: 'valorant', name: 'Valorant', color: '#ff4655' },
    { id: 'lol', name: 'League of Legends', color: '#0ac8b9' },
    { id: 'mlbb', name: 'Mobile Legends', color: '#00d2ff' },
];

const DEMO_POSTS = [];

const FEED_SAVED_POSTS_KEY = 'community_feed_saved_posts';
const FEED_SHARE_COUNTS_KEY = 'community_feed_share_counts';

const readStoredValue = (key, fallback) => {
    if (typeof window === 'undefined') return fallback;

    try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

const writeStoredValue = (key, value) => {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore storage write failures in demo feed actions.
    }
};

const getPostShareUrl = (postId) => {
    if (typeof window === 'undefined') return `#post-${postId}`;
    return `${window.location.origin}${window.location.pathname}#post-${postId}`;
};

const buildShareText = (post) => {
    const base = (post.content || '').trim();
    if (base.length <= 140) return base;
    return `${base.slice(0, 137).trim()}...`;
};

/* ───────────── POST CREATOR ───────────── */

const PostCreator = ({ onPost }) => {
    const { user } = useAuth();
    const [text, setText] = useState('');
    const [images, setImages] = useState([]);
    const [showPoll, setShowPoll] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [document, setDocument] = useState(null);
    const [selectedGame, setSelectedGame] = useState(null);
    const [showGamePicker, setShowGamePicker] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const imgInputRef = useRef(null);
    const docInputRef = useRef(null);
    const gamePickerRef = useRef(null);

    // Obtener iniciales del nombre para fallback
    const getUserInitials = () => {
        if (!user) return '?';
        const name = user.username || user.name || user.email || '';
        return name.charAt(0).toUpperCase();
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        const previews = files.map(f => ({ file: f, preview: URL.createObjectURL(f), name: f.name }));
        setImages(prev => [...prev, ...previews].slice(0, 4));
        setExpanded(true);
    };

    const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

    const handleDocSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setDocument({ name: file.name, size: (file.size / (1024 * 1024)).toFixed(1) + ' MB', type: file.name.split('.').pop() });
            setExpanded(true);
        }
    };

    const addPollOption = () => { if (pollOptions.length < 4) setPollOptions([...pollOptions, '']); };
    const removePollOption = (idx) => { if (pollOptions.length > 2) setPollOptions(pollOptions.filter((_, i) => i !== idx)); };
    const updatePollOption = (idx, val) => { const copy = [...pollOptions]; copy[idx] = val; setPollOptions(copy); };

    const handlePost = () => {
        if (!text.trim() && images.length === 0 && !showPoll && !document) return;
        onPost({
            text, images, poll: showPoll ? { question: pollQuestion, options: pollOptions.filter(o => o.trim()) } : null,
            document, game: selectedGame,
        });
        setText(''); setImages([]); setShowPoll(false); setPollQuestion(''); setPollOptions(['', '']);
        setDocument(null); setSelectedGame(null); setExpanded(false);
    };

    const hasContent = text.trim() || images.length > 0 || showPoll || document;

    return (
        <div className={'fp-creator' + (expanded ? ' expanded' : '')}>
            <div className="fp-creator__top">
                <div className="fp-creator__avatar">
                    {user?.profilePicture ? (
                        <img src={user.profilePicture} alt={user.username || 'Usuario'} />
                    ) : (
                        <span className="fp-creator__avatar-initial">{getUserInitials()}</span>
                    )}
                </div>
                <div className="fp-creator__input-wrap" onClick={() => setExpanded(true)}>
                    <textarea
                        className="fp-creator__input"
                        placeholder="¿Que esta pasando en tu comunidad?"
                        value={text} onChange={e => setText(e.target.value)}
                        rows={expanded ? 3 : 1}
                        onFocus={() => setExpanded(true)}
                    />
                </div>
            </div>

            {/* Game Tag */}
            {selectedGame && (
                <div className="fp-creator__game-tag" style={{ '--gc': selectedGame.color }}>
                    <i className='bx bxs-game'></i>
                    <span>{selectedGame.name}</span>
                    <button onClick={() => setSelectedGame(null)}><i className='bx bx-x'></i></button>
                </div>
            )}

            {/* Image Previews */}
            {images.length > 0 && (
                <div className="fp-creator__images">
                    {images.map((img, i) => (
                        <div key={i} className="fp-creator__img-thumb">
                            <img src={img.preview} alt="" />
                            <button className="fp-creator__img-remove" onClick={() => removeImage(i)}>
                                <i className='bx bx-x'></i>
                            </button>
                        </div>
                    ))}
                    {images.length < 4 && (
                        <button className="fp-creator__img-add" onClick={() => imgInputRef.current.click()}>
                            <i className='bx bx-plus'></i>
                        </button>
                    )}
                </div>
            )}

            {/* Poll Creator */}
            {showPoll && (
                <div className="fp-creator__poll">
                    <div className="fp-creator__poll-header">
                        <i className='bx bxs-bar-chart-alt-2'></i>
                        <span>Crear Encuesta</span>
                        <button className="fp-creator__poll-close" onClick={() => setShowPoll(false)}><i className='bx bx-x'></i></button>
                    </div>
                    <input
                        className="fp-creator__poll-question"
                        placeholder="Pregunta de la encuesta..."
                        value={pollQuestion} onChange={e => setPollQuestion(e.target.value)}
                    />
                    {pollOptions.map((opt, i) => (
                        <div key={i} className="fp-creator__poll-opt">
                            <input
                                placeholder={`Opcion ${i + 1}`}
                                value={opt} onChange={e => updatePollOption(i, e.target.value)}
                            />
                            {pollOptions.length > 2 && (
                                <button onClick={() => removePollOption(i)}><i className='bx bx-trash'></i></button>
                            )}
                        </div>
                    ))}
                    {pollOptions.length < 4 && (
                        <button className="fp-creator__poll-add" onClick={addPollOption}>
                            <i className='bx bx-plus'></i> Agregar opcion
                        </button>
                    )}
                </div>
            )}

            {/* Document Preview */}
            {document && (
                <div className="fp-creator__doc">
                    <i className='bx bxs-file-pdf'></i>
                    <div className="fp-creator__doc-info">
                        <span className="fp-creator__doc-name">{document.name}</span>
                        <span className="fp-creator__doc-size">{document.size}</span>
                    </div>
                    <button onClick={() => setDocument(null)}><i className='bx bx-x'></i></button>
                </div>
            )}

            {/* Actions Bar */}
            <div className="fp-creator__actions">
                <div className="fp-creator__tools">
                    <button className="fp-creator__tool" onClick={() => imgInputRef.current.click()} title="Imagen">
                        <i className='bx bxs-image'></i>
                    </button>
                    <button className={'fp-creator__tool' + (showPoll ? ' active' : '')} onClick={() => { setShowPoll(!showPoll); setExpanded(true); }} title="Encuesta">
                        <i className='bx bxs-bar-chart-alt-2'></i>
                    </button>
                    <button className="fp-creator__tool" onClick={() => docInputRef.current.click()} title="Documento">
                        <i className='bx bxs-file-doc'></i>
                    </button>
                    <div className="fp-creator__game-wrap" ref={gamePickerRef}>
                        <button className={'fp-creator__tool' + (selectedGame ? ' active' : '')} onClick={() => setShowGamePicker(!showGamePicker)} title="Asignar juego">
                            <i className='bx bxs-joystick'></i>
                        </button>
                        {showGamePicker && (
                            <div className="fp-creator__game-dropdown">
                                <div className="fp-creator__game-dropdown-head">Asignar a un juego</div>
                                {GAME_OPTIONS.map(g => (
                                    <button key={g.id} className={'fp-creator__game-opt' + (selectedGame?.id === g.id ? ' active' : '')}
                                        onClick={() => { setSelectedGame(g); setShowGamePicker(false); }}>
                                        <span className="fp-creator__game-dot" style={{ background: g.color }} />
                                        {g.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <button className={'fp-creator__post-btn' + (hasContent ? ' ready' : '')} onClick={handlePost} disabled={!hasContent}>
                    <i className='bx bx-send'></i> Publicar
                </button>
            </div>

            <input ref={imgInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageSelect} />
            <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" hidden onChange={handleDocSelect} />
        </div>
    );
};

/* ───────────── POLL COMPONENT ───────────── */

const PollWidget = ({ poll }) => {
    const [voted, setVoted] = useState(poll.voted);
    const total = poll.totalVotes + (voted !== null && poll.voted === null ? 1 : 0);

    const handleVote = (idx) => { if (voted === null) setVoted(idx); };

    return (
        <div className="fp-poll">
            <div className="fp-poll__question">
                <i className='bx bxs-bar-chart-alt-2'></i> {poll.question}
            </div>
            <div className="fp-poll__options">
                {poll.options.map((opt, i) => {
                    const votes = opt.votes + (voted === i ? 1 : 0);
                    const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                    const isSelected = voted === i;
                    return (
                        <button key={i} className={'fp-poll__opt' + (voted !== null ? ' voted' : '') + (isSelected ? ' selected' : '')}
                            onClick={() => handleVote(i)} disabled={voted !== null}>
                            <div className="fp-poll__opt-bar" style={{ width: voted !== null ? pct + '%' : '0%' }} />
                            <span className="fp-poll__opt-text">{opt.text}</span>
                            {voted !== null && <span className="fp-poll__opt-pct">{pct}%</span>}
                            {isSelected && <i className='bx bx-check'></i>}
                        </button>
                    );
                })}
            </div>
            <div className="fp-poll__footer">{total} votos</div>
        </div>
    );
};

/* ───────────── SINGLE POST ───────────── */

const FeedPost = ({
    post,
    isSaved,
    onToggleSave,
    onShare,
    onCopyText,
    onCopyLink,
    onHidePost,
    onReportPost,
}) => {
    const { user } = useAuth();
    const [liked, setLiked] = useState(post.liked);
    const [likes, setLikes] = useState(post.likes);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [imgIdx, setImgIdx] = useState(0);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    const getUserInitials = () => {
        if (!user) return '?';
        const name = user.username || user.name || user.email || '';
        return name.charAt(0).toUpperCase();
    };

    const hasAvatarImage = typeof post.avatar === 'string' && /^(https?:|data:image)/.test(post.avatar);

    const toggleLike = () => {
        setLiked(!liked);
        setLikes(prev => liked ? prev - 1 : prev + 1);
    };

    const formatNum = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n;

    useEffect(() => {
        if (!showMenu) return undefined;

        const handlePointerDown = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') setShowMenu(false);
        };

        document.addEventListener('mousedown', handlePointerDown);
        window.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            window.removeEventListener('keydown', handleEscape);
        };
    }, [showMenu]);

    return (
        <article id={`post-${post.id}`} className="fp-post" style={{ '--post-color': post.game?.color || '#a35ddf' }}>
            {/* Header */}
            <div className="fp-post__header">
                <div className="fp-post__avatar">
                    {hasAvatarImage ? (
                        <img src={post.avatar} alt={post.author} />
                    ) : (
                        post.avatar
                    )}
                </div>
                <div className="fp-post__meta">
                    <span className="fp-post__author">{post.author}</span>
                    <span className="fp-post__time">{post.time}</span>
                </div>
                {post.game && (
                    <span className="fp-post__game" style={{ '--gc': post.game.color }}>
                        <i className='bx bxs-game'></i> {post.game.name}
                    </span>
                )}
                <div className="fp-post__menu-wrap" ref={menuRef}>
                    <button
                        className={'fp-post__more' + (showMenu ? ' active' : '')}
                        onClick={() => setShowMenu(prev => !prev)}
                        aria-label="Acciones de la publicacion"
                        aria-expanded={showMenu}
                        aria-haspopup="menu"
                    >
                        <i className='bx bx-dots-horizontal-rounded'></i>
                    </button>
                    {showMenu && (
                        <div className="fp-post__menu" role="menu">
                            <button className="fp-post__menu-item" onClick={() => { onToggleSave(post); setShowMenu(false); }}>
                                <i className={`bx ${isSaved ? 'bx-bookmark-minus' : 'bx-bookmark-plus'}`}></i>
                                <span>{isSaved ? 'Quitar de guardados' : 'Guardar publicacion'}</span>
                            </button>
                            <button className="fp-post__menu-item" onClick={() => { onCopyText(post); setShowMenu(false); }}>
                                <i className='bx bx-copy-alt'></i>
                                <span>Copiar texto</span>
                            </button>
                            <button className="fp-post__menu-item" onClick={() => { onCopyLink(post); setShowMenu(false); }}>
                                <i className='bx bx-link-alt'></i>
                                <span>Copiar enlace</span>
                            </button>
                            <button className="fp-post__menu-item" onClick={() => { onReportPost(post); setShowMenu(false); }}>
                                <i className='bx bx-flag'></i>
                                <span>Reportar</span>
                            </button>
                            <button className="fp-post__menu-item fp-post__menu-item--danger" onClick={() => { onHidePost(post.id); setShowMenu(false); }}>
                                <i className='bx bx-hide'></i>
                                <span>Ocultar del feed</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <p className="fp-post__content">{post.content}</p>

            {/* Images */}
            {post.images && post.images.length > 0 && (
                <div className={'fp-post__gallery' + (post.images.length > 1 ? ' multi' : '')}>
                    <img src={post.images[imgIdx]} alt="" className="fp-post__img" />
                    {post.images.length > 1 && (
                        <div className="fp-post__gallery-nav">
                            {post.images.map((_, i) => (
                                <button key={i} className={'fp-post__gallery-dot' + (i === imgIdx ? ' active' : '')} onClick={() => setImgIdx(i)} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Poll */}
            {post.poll && <PollWidget poll={post.poll} />}

            {/* Document */}
            {post.document && (
                <div className="fp-post__doc">
                    <div className="fp-post__doc-icon">
                        <i className='bx bxs-file-pdf'></i>
                    </div>
                    <div className="fp-post__doc-info">
                        <span className="fp-post__doc-name">{post.document.name}</span>
                        <span className="fp-post__doc-size">{post.document.size}</span>
                    </div>
                    <button className="fp-post__doc-btn"><i className='bx bx-download'></i> Descargar</button>
                </div>
            )}

            {/* Actions */}
            <div className="fp-post__actions">
                <button className={'fp-post__action' + (liked ? ' liked' : '')} onClick={toggleLike}>
                    <i className={liked ? 'bx bxs-heart' : 'bx bx-heart'}></i>
                    <span>{formatNum(likes)}</span>
                </button>
                <button className="fp-post__action" onClick={() => setShowComments(!showComments)}>
                    <i className='bx bx-message-rounded'></i>
                    <span>{formatNum(post.comments)}</span>
                </button>
                <button className="fp-post__action" onClick={() => onShare(post)}>
                    <i className='bx bx-share-alt'></i>
                    <span>{formatNum(post.shares)}</span>
                </button>
                <button
                    className={'fp-post__action fp-post__action--save' + (isSaved ? ' saved' : '')}
                    onClick={() => onToggleSave(post)}
                    aria-label={isSaved ? 'Quitar de guardados' : 'Guardar publicacion'}
                >
                    <i className={isSaved ? 'bx bxs-bookmark' : 'bx bx-bookmark'}></i>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="fp-post__comments">
                    <div className="fp-post__comment-input">
                        <div className="fp-post__comment-avatar">
                            {user?.profilePicture ? (
                                <img src={user.profilePicture} alt={user.username || 'Usuario'} />
                            ) : (
                                <span>{getUserInitials()}</span>
                            )}
                        </div>
                        <input
                            placeholder="Escribe un comentario..."
                            value={commentText} onChange={e => setCommentText(e.target.value)}
                        />
                        <button disabled={!commentText.trim()}><i className='bx bx-send'></i></button>
                    </div>
                </div>
            )}
        </article>
    );
};

/* ───────────── FEED PANEL (MAIN) ───────────── */

const FeedPanel = ({ communityName, filterGame }) => {
    const { user } = useAuth();
    const { addToast, notify } = useNotification();
    const [savedPosts, setSavedPosts] = useState(() => readStoredValue(FEED_SAVED_POSTS_KEY, []));
    const [posts, setPosts] = useState(() => {
        const storedShares = readStoredValue(FEED_SHARE_COUNTS_KEY, {});
        return DEMO_POSTS.map((post) => ({
            ...post,
            shares: storedShares[post.id] ?? post.shares,
        }));
    });
    const [feedFilter, setFeedFilter] = useState('all');

    const handleNewPost = useCallback((postData) => {
        const authorName = user?.username || user?.name || 'Usuario';
        const authorInitial = authorName.charAt(0).toUpperCase();
        
        const newPost = {
            id: Date.now(),
            author: authorName,
            avatar: user?.profilePicture || authorInitial,
            time: 'Ahora',
            game: postData.game,
            content: postData.text,
            images: postData.images?.map(i => i.preview) || [],
            poll: postData.poll ? {
                question: postData.poll.question,
                options: postData.poll.options.map(o => ({ text: o, votes: 0 })),
                totalVotes: 0, voted: null,
            } : null,
            document: postData.document,
            likes: 0, comments: 0, shares: 0, liked: false,
        };
        setPosts(prev => [newPost, ...prev]);
    }, [user]);

    const copyToClipboard = useCallback(async (value, successMessage) => {
        try {
            if (!navigator.clipboard?.writeText) throw new Error('clipboard-unavailable');
            await navigator.clipboard.writeText(value);
            addToast(successMessage, 'success');
            return true;
        } catch {
            addToast('No se pudo copiar al portapapeles.', 'error');
            return false;
        }
    }, [addToast]);

    const toggleSavedPost = useCallback((post) => {
        setSavedPosts((prev) => {
            const alreadySaved = prev.includes(post.id);
            const next = alreadySaved ? prev.filter((id) => id !== post.id) : [...prev, post.id];
            writeStoredValue(FEED_SAVED_POSTS_KEY, next);
            addToast(alreadySaved ? 'Publicacion eliminada de guardados.' : 'Publicacion guardada en tu lista.', alreadySaved ? 'info' : 'success');
            return next;
        });
    }, [addToast]);

    const copyPostText = useCallback(async (post) => {
        await copyToClipboard(`${post.author}\n${post.content}`, 'Texto de la publicacion copiado.');
    }, [copyToClipboard]);

    const copyPostLink = useCallback(async (post) => {
        await copyToClipboard(getPostShareUrl(post.id), 'Enlace de la publicacion copiado.');
    }, [copyToClipboard]);

    const handleSharePost = useCallback(async (post) => {
        const shareUrl = getPostShareUrl(post.id);
        const sharePayload = {
            title: `Publicacion de ${post.author}`,
            text: buildShareText(post),
            url: shareUrl,
        };

        try {
            if (navigator.share) {
                await navigator.share(sharePayload);
                addToast('Publicacion compartida correctamente.', 'success');
            } else {
                const copied = await copyToClipboard(`${sharePayload.text}\n${shareUrl}`, 'Enlace listo para compartir.');
                if (!copied) return;
            }

            const currentPost = posts.find((item) => item.id === post.id);
            const nextShares = (currentPost?.shares ?? post.shares ?? 0) + 1;

            setPosts((prev) => prev.map((item) => (
                item.id === post.id ? { ...item, shares: nextShares } : item
            )));

            writeStoredValue(
                FEED_SHARE_COUNTS_KEY,
                posts.reduce((acc, item) => {
                    acc[item.id] = item.id === post.id ? nextShares : item.shares;
                    return acc;
                }, {})
            );
        } catch (error) {
            if (error?.name !== 'AbortError') {
                addToast('No se pudo compartir la publicacion.', 'error');
            }
        }
    }, [addToast, copyToClipboard, posts]);

    const hidePost = useCallback((postId) => {
        setPosts((prev) => prev.filter((post) => post.id !== postId));
        addToast('Publicacion ocultada del feed.', 'info');
    }, [addToast]);

    const reportPost = useCallback((post) => {
        notify('info', 'Reporte enviado', `Revisaremos la publicacion de ${post.author}.`);
    }, [notify]);

    const filteredPosts = feedFilter === 'all'
        ? posts
        : posts.filter(p => {
            if (feedFilter === 'images') return p.images && p.images.length > 0;
            if (feedFilter === 'polls') return p.poll;
            if (feedFilter === 'docs') return p.document;
            return true;
        });

    const displayPosts = filterGame
        ? filteredPosts.filter(p => p.game?.id === filterGame)
        : filteredPosts;

    return (
        <div className="fp-feed">
            <PostCreator onPost={handleNewPost} />

            {/* Feed Filters */}
            <div className="fp-feed__filters">
                {[
                    { id: 'all', label: 'Todo', icon: 'bx bx-grid-alt' },
                    { id: 'images', label: 'Imagenes', icon: 'bx bxs-image' },
                    { id: 'polls', label: 'Encuestas', icon: 'bx bxs-bar-chart-alt-2' },
                    { id: 'docs', label: 'Documentos', icon: 'bx bxs-file-doc' },
                ].map(f => (
                    <button key={f.id} className={'fp-feed__filter' + (feedFilter === f.id ? ' active' : '')}
                        onClick={() => setFeedFilter(f.id)}>
                        <i className={f.icon}></i> {f.label}
                    </button>
                ))}
            </div>

            {/* Posts */}
            <div className="fp-feed__posts">
                {displayPosts.length > 0 ? (
                    displayPosts.map((p) => (
                        <FeedPost
                            key={p.id}
                            post={p}
                            isSaved={savedPosts.includes(p.id)}
                            onToggleSave={toggleSavedPost}
                            onShare={handleSharePost}
                            onCopyText={copyPostText}
                            onCopyLink={copyPostLink}
                            onHidePost={hidePost}
                            onReportPost={reportPost}
                        />
                    ))
                ) : (
                    <div className="fp-feed__empty">
                        <i className='bx bx-message-alt-detail'></i>
                        <h3>Sin publicaciones</h3>
                        <p>Se el primero en compartir algo en {communityName || 'esta comunidad'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedPanel;
