import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useNotification } from '../../../../context/NotificationContext';
import {
    fetchCommunityPosts,
    publishCommunityPost,
    toggleCommunityPostLike,
    publishCommunityComment,
    reportCommunityPost,
    hideCommunityPost,
    deleteCommunityPost,
} from '../community.service';
import { resolveMediaUrl } from '../../../../utils/media';
import { COMMUNITY_FEED_GAME_OPTIONS } from '../../../../../../shared/communityCatalog.js';
import './FeedPanel.css';

const GAME_OPTIONS = COMMUNITY_FEED_GAME_OPTIONS;

const FEED_SAVED_POSTS_KEY = 'community_feed_saved_posts';

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
    } catch { /* ignore */ }
};

const getPostShareUrl = (postId) => {
    if (typeof window === 'undefined') return `#post-${postId}`;
    return `${window.location.origin}${window.location.pathname}#post-${postId}`;
};

const buildShareText = (post) => {
    const base = (post.text || post.content || '').trim();
    if (base.length <= 140) return base;
    return `${base.slice(0, 137).trim()}...`;
};

const getAccountAvatar = (account) => resolveMediaUrl(
    account?.avatar
    || account?.connections?.steam?.avatar
    || account?.profilePicture
    || ''
);

const getCreatedAtValue = (item) => {
    const timestamp = new Date(item?.createdAt || 0).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
};

const sortByCreatedAtAsc = (a, b) => getCreatedAtValue(a) - getCreatedAtValue(b);
const sortByCreatedAtDesc = (a, b) => getCreatedAtValue(b) - getCreatedAtValue(a);

const buildPostThreads = (items = []) => {
    const nodeMap = new Map(
        items.map((post) => [
            post.id,
            {
                ...post,
                replies: [],
            },
        ])
    );

    const roots = [];

    nodeMap.forEach((node) => {
        const parentId = node.replyTo?.id;
        if (parentId && nodeMap.has(parentId)) {
            nodeMap.get(parentId).replies.push(node);
            return;
        }

        roots.push(node);
    });

    const collectReplies = (node) => {
        const descendants = [];

        node.replies.forEach((reply) => {
            descendants.push(reply);
            descendants.push(...collectReplies(reply));
        });

        return descendants
            .sort(sortByCreatedAtAsc)
            .map((reply) => ({
                ...reply,
                replies: [],
            }));
    };

    return roots.sort(sortByCreatedAtDesc).map((root) => ({
        ...root,
        replies: collectReplies(root),
    }));
};

/* ───────────── POST CREATOR ───────────── */

const PostCreator = ({ onPost, loading }) => {
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

    const getUserInitials = () => {
        if (!user) return '?';
        const name = user.username || user.name || user.email || '';
        return name.charAt(0).toUpperCase();
    };

    const userAvatar = getAccountAvatar(user);

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
            setDocument({ file, name: file.name, size: (file.size / (1024 * 1024)).toFixed(1) + ' MB', type: file.name.split('.').pop() });
            setExpanded(true);
        }
    };

    const addPollOption = () => { if (pollOptions.length < 4) setPollOptions([...pollOptions, '']); };
    const removePollOption = (idx) => { if (pollOptions.length > 2) setPollOptions(pollOptions.filter((_, i) => i !== idx)); };
    const updatePollOption = (idx, val) => { const copy = [...pollOptions]; copy[idx] = val; setPollOptions(copy); };

    const handlePost = () => {
        if (loading) return;
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
                    {userAvatar ? (
                        <img src={userAvatar} alt={user.username || 'Usuario'} />
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
                <button className={'fp-creator__post-btn' + (hasContent ? ' ready' : '')} onClick={handlePost} disabled={!hasContent || loading}>
                    <i className='bx bx-send'></i> {loading ? 'Publicando...' : 'Publicar'}
                </button>
            </div>

            <input ref={imgInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageSelect} />
            <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" hidden onChange={handleDocSelect} />
        </div>
    );
};

/* ───────────── SINGLE POST ───────────── */

const FeedPost = ({
    post,
    replies = [],
    depth = 0,
    savedPosts = [],
    onToggleSave,
    onShare,
    onCopyText,
    onCopyLink,
    onHidePost,
    onReportPost,
    onDeletePost,
    onToggleLike,
    onAddComment,
}) => {
    const { user } = useAuth();
    const [liked, setLiked] = useState(post.liked);
    const [likes, setLikes] = useState(post.likes);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState(post.comments || []);
    const [imgIdx, setImgIdx] = useState(0);
    const [showMenu, setShowMenu] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);
    const menuRef = useRef(null);
    const orderedComments = [...comments].sort(sortByCreatedAtAsc);
    const isSaved = savedPosts.includes(post.id);

    const getUserInitials = () => {
        if (!user) return '?';
        const name = user.username || user.name || user.email || '';
        return name.charAt(0).toUpperCase();
    };

    const currentUserAvatar = getAccountAvatar(user);
    const authorAvatar = resolveMediaUrl(post.avatar || ((post.author || post.user) === user?.username ? currentUserAvatar : ''));
    const hasAvatarImage = typeof authorAvatar === 'string' && /^(https?:|data:image|\/uploads)/.test(authorAvatar);

    const toggleLike = async () => {
        const prev = liked;
        setLiked(!liked);
        setLikes(l => prev ? l - 1 : l + 1);
        try {
            const result = await onToggleLike(post.id);
            setLiked(result.likedByMe);
            setLikes(result.likesCount);
        } catch {
            setLiked(prev);
            setLikes(l => prev ? l + 1 : l - 1);
        }
    };

    const handleComment = async () => {
        if (!commentText.trim() || submittingComment) return;
        setSubmittingComment(true);
        try {
            const newComment = await onAddComment(post.id, commentText.trim());
            setComments(prev => [...prev, newComment]);
            setCommentText('');
        } catch { /* toast handled upstream */ }
        setSubmittingComment(false);
    };

    const formatNum = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n;

    // Images from backend attachment
    const postImages = post.image ? [post.image] : (post.images || []);

    useEffect(() => {
        if (!showMenu) return undefined;
        const handlePointerDown = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
        };
        const handleEscape = (event) => { if (event.key === 'Escape') setShowMenu(false); };
        document.addEventListener('mousedown', handlePointerDown);
        window.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            window.removeEventListener('keydown', handleEscape);
        };
    }, [showMenu]);

    return (
        <article
            id={`post-${post.id}`}
            className={`fp-post ${depth > 0 ? 'fp-post--reply' : ''}`}
            style={{ '--post-color': post.game?.color || '#a35ddf', '--reply-depth': depth }}
        >
            {/* Header */}
            <div className="fp-post__header">
                <div className="fp-post__avatar">
                    {hasAvatarImage ? (
                        <img src={authorAvatar} alt={post.author || post.user} />
                    ) : (
                        <span>{(post.author || post.user || '?').charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <div className="fp-post__meta">
                    <span className="fp-post__author">{post.author || post.user}</span>
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
                            {post.isOwner && (
                                <button className="fp-post__menu-item fp-post__menu-item--danger" onClick={() => { onDeletePost(post.id); setShowMenu(false); }}>
                                    <i className='bx bx-trash'></i>
                                    <span>Eliminar</span>
                                </button>
                            )}
                            <button className="fp-post__menu-item fp-post__menu-item--danger" onClick={() => { onHidePost(post.id); setShowMenu(false); }}>
                                <i className='bx bx-hide'></i>
                                <span>Ocultar del feed</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {post.replyTo && (
                <div className="fp-post__reply-ref">
                    <i className='bx bx-reply'></i>
                    <span>
                        Respuesta a <strong>{post.replyTo.author?.username || post.replyTo.author?.fullName || 'otro mensaje'}</strong>
                    </span>
                </div>
            )}

            {/* Content */}
            <p className="fp-post__content">{post.text || post.content}</p>

            {/* Images */}
            {postImages.length > 0 && (
                <div className={'fp-post__gallery' + (postImages.length > 1 ? ' multi' : '')}>
                    <img src={postImages[imgIdx]} alt="" className="fp-post__img" />
                    {postImages.length > 1 && (
                        <div className="fp-post__gallery-nav">
                            {postImages.map((_, i) => (
                                <button key={i} className={'fp-post__gallery-dot' + (i === imgIdx ? ' active' : '')} onClick={() => setImgIdx(i)} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Document */}
            {post.file && (
                <div className="fp-post__doc">
                    <div className="fp-post__doc-icon">
                        <i className='bx bxs-file-pdf'></i>
                    </div>
                    <div className="fp-post__doc-info">
                        <span className="fp-post__doc-name">{post.file.name}</span>
                    </div>
                    <a href={post.file.url} target="_blank" rel="noopener noreferrer" className="fp-post__doc-btn">
                        <i className='bx bx-download'></i> Descargar
                    </a>
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
                    <span>{formatNum(comments.length)}</span>
                </button>
                <button className="fp-post__action" onClick={() => onShare(post)}>
                    <i className='bx bx-share-alt'></i>
                </button>
                <button
                    className={'fp-post__action fp-post__action--save' + (isSaved ? ' saved' : '')}
                    onClick={() => onToggleSave(post)}
                    aria-label={isSaved ? 'Quitar de guardados' : 'Guardar publicacion'}
                >
                    <i className={isSaved ? 'bx bxs-bookmark' : 'bx bx-bookmark'}></i>
                </button>
            </div>

            {replies.length > 0 && (
                <div className="fp-post__thread">
                    {replies.map((reply) => (
                        <FeedPost
                            key={reply.id}
                            post={reply}
                            replies={reply.replies || []}
                            depth={depth + 1}
                            savedPosts={savedPosts}
                            onToggleSave={onToggleSave}
                            onShare={onShare}
                            onCopyText={onCopyText}
                            onCopyLink={onCopyLink}
                            onHidePost={onHidePost}
                            onReportPost={onReportPost}
                            onDeletePost={onDeletePost}
                            onToggleLike={onToggleLike}
                            onAddComment={onAddComment}
                        />
                    ))}
                </div>
            )}

            {/* Comments Section */}
            {showComments && (
                <div className="fp-post__comments">
                    {orderedComments.length > 0 && (
                        <div className="fp-post__comments-list">
                            {orderedComments.map((c) => (
                                <div key={c.id} className="fp-post__comment">
                                    <div className="fp-post__comment-avatar">
                                        {resolveMediaUrl(c.avatar || (c.user === user?.username ? currentUserAvatar : ''))
                                            ? <img src={resolveMediaUrl(c.avatar || (c.user === user?.username ? currentUserAvatar : ''))} alt={c.user} />
                                            : <span>{(c.user || '?').charAt(0).toUpperCase()}</span>}
                                    </div>
                                    <div className="fp-post__comment-body">
                                        <span className="fp-post__comment-user">{c.user}</span>
                                        <span className="fp-post__comment-text">{c.text}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="fp-post__comment-input">
                        <div className="fp-post__comment-avatar">
                            {currentUserAvatar ? (
                                <img src={currentUserAvatar} alt={user.username || 'Usuario'} />
                            ) : (
                                <span>{getUserInitials()}</span>
                            )}
                        </div>
                        <input
                            placeholder="Escribe un comentario..."
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleComment(); }}
                        />
                        <button disabled={!commentText.trim() || submittingComment} onClick={handleComment}>
                            <i className='bx bx-send'></i>
                        </button>
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
    const [posts, setPosts] = useState([]);
    const [feedFilter, setFeedFilter] = useState('all');
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [publishing, setPublishing] = useState(false);

    // Fetch posts from API on mount
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoadingPosts(true);
            try {
                const fetched = await fetchCommunityPosts();
                if (!cancelled) setPosts(fetched);
            } catch (err) {
                if (!cancelled) addToast('Error cargando publicaciones', 'error');
            } finally {
                if (!cancelled) setLoadingPosts(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [addToast]);

    // Create post via API
    const handleNewPost = useCallback(async (postData) => {
        if (!user) {
            addToast('Inicia sesion para publicar', 'error');
            return;
        }
        setPublishing(true);
        try {
            // Determine which file to attach (first image or document)
            let attachmentFile = null;
            let attachmentType = null;
            if (postData.images?.length > 0 && postData.images[0].file) {
                attachmentFile = postData.images[0].file;
                attachmentType = 'media';
            } else if (postData.document?.file) {
                attachmentFile = postData.document.file;
                attachmentType = 'file';
            }

            const newPost = await publishCommunityPost({
                text: postData.text,
                privacy: 'Public',
                attachmentFile,
                attachmentType,
            });

            setPosts(prev => [newPost, ...prev]);
            addToast('Publicacion creada', 'success');
        } catch (err) {
            addToast(err.response?.data?.message || 'Error al publicar', 'error');
        } finally {
            setPublishing(false);
        }
    }, [user, addToast]);

    // Like toggle via API
    const handleToggleLike = useCallback(async (postId) => {
        return await toggleCommunityPostLike(postId);
    }, []);

    // Add comment via API
    const handleAddComment = useCallback(async (postId, text) => {
        try {
            const comment = await publishCommunityComment(postId, { text });
            return comment;
        } catch (err) {
            addToast('Error al comentar', 'error');
            throw err;
        }
    }, [addToast]);

    // Delete post via API
    const handleDeletePost = useCallback(async (postId) => {
        try {
            await deleteCommunityPost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
            addToast('Publicacion eliminada', 'success');
        } catch (err) {
            addToast('Error al eliminar', 'error');
        }
    }, [addToast]);

    // Hide post via API
    const handleHidePost = useCallback(async (postId) => {
        try {
            await hideCommunityPost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
            addToast('Publicacion ocultada del feed', 'info');
        } catch {
            addToast('Error al ocultar', 'error');
        }
    }, [addToast]);

    // Report post via API
    const handleReportPost = useCallback(async (post) => {
        try {
            await reportCommunityPost(post.id, { reason: 'spam', details: '' });
            notify('info', 'Reporte enviado', `Revisaremos la publicacion de ${post.user || post.author}.`);
        } catch {
            addToast('Error al reportar', 'error');
        }
    }, [notify, addToast]);

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
            addToast(alreadySaved ? 'Publicacion eliminada de guardados.' : 'Publicacion guardada.', alreadySaved ? 'info' : 'success');
            return next;
        });
    }, [addToast]);

    const copyPostText = useCallback(async (post) => {
        await copyToClipboard(`${post.user || post.author}\n${post.text || post.content}`, 'Texto copiado.');
    }, [copyToClipboard]);

    const copyPostLink = useCallback(async (post) => {
        await copyToClipboard(getPostShareUrl(post.id), 'Enlace copiado.');
    }, [copyToClipboard]);

    const handleSharePost = useCallback(async (post) => {
        const shareUrl = getPostShareUrl(post.id);
        const sharePayload = {
            title: `Publicacion de ${post.user || post.author}`,
            text: buildShareText(post),
            url: shareUrl,
        };
        try {
            if (navigator.share) {
                await navigator.share(sharePayload);
                addToast('Publicacion compartida.', 'success');
            } else {
                await copyToClipboard(`${sharePayload.text}\n${shareUrl}`, 'Enlace listo para compartir.');
            }
        } catch (error) {
            if (error?.name !== 'AbortError') {
                addToast('No se pudo compartir.', 'error');
            }
        }
    }, [addToast, copyToClipboard]);

    const filteredPosts = feedFilter === 'all'
        ? posts
        : posts.filter(p => {
            if (feedFilter === 'images') return p.image;
            if (feedFilter === 'docs') return p.file;
            return true;
        });

    const displayPosts = filterGame
        ? filteredPosts.filter(p => p.game?.id === filterGame)
        : filteredPosts;
    const threadedPosts = buildPostThreads(displayPosts);

    return (
        <div className="fp-feed">
            <PostCreator onPost={handleNewPost} loading={publishing} />

            {/* Feed Filters */}
            <div className="fp-feed__filters">
                {[
                    { id: 'all', label: 'Todo', icon: 'bx bx-grid-alt' },
                    { id: 'images', label: 'Imagenes', icon: 'bx bxs-image' },
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
                {loadingPosts ? (
                    <div className="fp-feed__empty">
                        <i className='bx bx-loader-alt bx-spin'></i>
                        <h3>Cargando publicaciones...</h3>
                    </div>
                ) : threadedPosts.length > 0 ? (
                    threadedPosts.map((p) => (
                        <FeedPost
                            key={p.id}
                            post={p}
                            replies={p.replies || []}
                            savedPosts={savedPosts}
                            onToggleSave={toggleSavedPost}
                            onShare={handleSharePost}
                            onCopyText={copyPostText}
                            onCopyLink={copyPostLink}
                            onHidePost={handleHidePost}
                            onReportPost={handleReportPost}
                            onDeletePost={handleDeletePost}
                            onToggleLike={handleToggleLike}
                            onAddComment={handleAddComment}
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
