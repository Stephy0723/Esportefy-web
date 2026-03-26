import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  FaArrowLeft, FaUsers, FaCrown, FaShieldAlt, FaGamepad, FaGlobe,
  FaMapMarkerAlt, FaCalendarAlt, FaFilePdf, FaUserPlus, FaSignOutAlt,
  FaTrophy, FaFlag, FaCircle, FaCommentDots, FaPaperPlane, FaHeart,
  FaRegHeart, FaLock, FaImage, FaPaperclip, FaPoll, FaTimes, FaPlus,
  FaTrash, FaFile, FaEllipsisH, FaReply, FaAt, FaHashtag, FaBan,
  FaExclamationTriangle
} from 'react-icons/fa';
import { useNotification } from '../../../../context/NotificationContext';
import { useAuth } from '../../../../context/AuthContext';
import { API_URL } from '../../../../config/api';
import {
  fetchCommunityByShortUrl,
  fetchCommunityPosts,
  publishCommunityPost,
  toggleCommunityPostLike,
  joinCommunityByShortUrl,
  leaveCommunityByShortUrl,
  fetchPostReplies,
  searchCommunityUsers,
  blockCommunityUser,
  reportCommunityPost,
  deleteCommunityPost
} from '../community.service';
import { getCommunitySocialEntries } from '../communitySocials';
import {
  COMMUNITY_REPORT_REASON_OPTIONS,
  getCommunityMemberRoleLabel,
  normalizeCommunityGameId,
  sortCommunityMembersByRole
} from '../../../../../../shared/communityCatalog.js';
import './communityTemplateV2.css';

/* ═══════════════════════════════════════════════════════════════
   COMMUNITY TEMPLATE V2 — Real data, esports aesthetic
   Route: /community/:slug
   ═══════════════════════════════════════════════════════════════ */

const STATUS_LABELS = {
  open: 'Inscripciones abiertas',
  ongoing: 'En curso',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
  draft: 'Borrador'
};

const CHAT_PROMPTS = [
  { emoji: '🎯', text: 'Busco squad para ' },
  { emoji: '🆘', text: 'Nos faltan integrantes para ' },
  { emoji: '⚔️', text: 'VS — Buscamos rival para ' },
  { emoji: '🔥', text: 'Scrim disponible, ' },
  { emoji: '💬', text: 'Qué opinan acerca de ' },
  { emoji: '🏆', text: 'Alguien para ranked? ' },
  { emoji: '📢', text: 'Info: ' },
  { emoji: '🤝', text: 'Buscamos coach / staff para ' },
];

const matchesGames = (itemGame, communityGames) => {
  if (!itemGame || !Array.isArray(communityGames) || communityGames.length === 0) return false;
  const normalized = normalizeCommunityGameId(itemGame);
  return communityGames.some((game) => normalizeCommunityGameId(game) === normalized);
};

/* ─── Render text with @mentions and #hashtags ─── */
const renderRichText = (text) => {
  if (!text) return null;
  const parts = text.split(/(@[a-zA-Z0-9_.-]{2,30}|#[a-zA-Z0-9áéíóúñüÁÉÍÓÚÑÜ_]{1,40})/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return <span key={i} className="ct__mention">{part}</span>;
    }
    if (part.startsWith('#')) {
      return <span key={i} className="ct__hashtag">{part}</span>;
    }
    return part;
  });
};

const CommunityTemplateV2 = () => {
  const { slug, shortUrl } = useParams();
  const communitySlug = slug || shortUrl || '';
  const navigate = useNavigate();
  const { addToast } = useNotification();
  const { user: authUser } = useAuth();

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [hubLoading, setHubLoading] = useState(false);

  // Chat hub state
  const [chatMsg, setChatMsg] = useState('');
  const [chatPosts, setChatPosts] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const chatInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Attachment state
  const [attachment, setAttachment] = useState(null);

  // Poll state
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Reply state
  const [replyTo, setReplyTo] = useState(null); // { id, user, text }

  // @mention autocomplete
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const mentionTimeout = useRef(null);

  // 3-dot menu
  const [activeMenu, setActiveMenu] = useState(null); // postId or null

  // Replies per post
  const [repliesMap, setRepliesMap] = useState({}); // { [postId]: { loaded, loading, replies[] } }

  // Report modal
  const [reportModal, setReportModal] = useState(null); // { postId } or null
  const [reportReason, setReportReason] = useState('');
  const socialEntries = getCommunitySocialEntries(community?.socialLinks).slice(0, 4);

  const load = useCallback(async () => {
    if (!communitySlug) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchCommunityByShortUrl(communitySlug);
      setCommunity(data);

      const games = Array.isArray(data?.mainGames) ? data.mainGames : [];
      if (games.length > 0) {
        setHubLoading(true);
        try {
          const [teamsRes, tournamentsRes] = await Promise.all([
            axios.get(`${API_URL}/api/teams`).catch(() => ({ data: [] })),
            axios.get(`${API_URL}/api/tournaments`).catch(() => ({ data: [] }))
          ]);
          const allTeams = Array.isArray(teamsRes.data) ? teamsRes.data : [];
          const allTournaments = Array.isArray(tournamentsRes.data) ? tournamentsRes.data : [];
          setTeams(allTeams.filter((t) => matchesGames(t.game, games)).slice(0, 12));
          setTournaments(allTournaments.filter((t) => matchesGames(t.game, games)).slice(0, 12));
        } catch (_) {}
        finally { setHubLoading(false); }
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo cargar la comunidad');
    } finally {
      setLoading(false);
    }
  }, [communitySlug]);

  useEffect(() => { load(); }, [load]);

  const handleJoinLeave = async () => {
    if (!community || joining || community.isOwner) return;
    setJoining(true);
    try {
      const updated = community.joined
        ? await leaveCommunityByShortUrl(community.shortUrl)
        : await joinCommunityByShortUrl(community.shortUrl);
      setCommunity(updated);
      addToast(community.joined ? 'Saliste de la comunidad' : 'Te uniste a la comunidad', 'success');
    } catch (err) {
      addToast(err?.response?.data?.message || 'Error al procesar tu solicitud', 'error');
    } finally {
      setJoining(false);
    }
  };

  const handleOpenAdminPanel = () => {
    if (!community?.isOwner || !community?.shortUrl) return;

    navigate(`/community/${encodeURIComponent(community.shortUrl)}/admin`, {
      state: {
        shortUrl: community.shortUrl,
        returnTo: `/community/${community.shortUrl}`
      }
    });
  };

  // ─── Chat hub functions ───
  const loadChatPosts = useCallback(async () => {
    if (!community?.shortUrl) {
      setChatPosts([]);
      return;
    }

    setChatLoading(true);
    try {
      const posts = await fetchCommunityPosts({ shortUrl: community.shortUrl });
      setChatPosts(posts.slice(0, 50));
    } catch (_) {
      setChatPosts([]);
    } finally {
      setChatLoading(false);
    }
  }, [community?.shortUrl]);

  useEffect(() => {
    if (community) loadChatPosts();
  }, [community, loadChatPosts]);

  const handlePromptClick = (promptText) => {
    setChatMsg(promptText);
    chatInputRef.current?.focus();
  };

  // ─── Attachment handlers ───
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { addToast('Solo se permiten imágenes', 'error'); return; }
    if (file.size > 12 * 1024 * 1024) { addToast('La imagen no puede superar 12 MB', 'error'); return; }
    setAttachment({ file, type: 'image', preview: URL.createObjectURL(file) });
    setShowPollBuilder(false);
    e.target.value = '';
  };

  const handleDocSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) { addToast('El archivo no puede superar 12 MB', 'error'); return; }
    setAttachment({ file, type: 'document', preview: null });
    setShowPollBuilder(false);
    e.target.value = '';
  };

  const clearAttachment = () => {
    if (attachment?.preview) URL.revokeObjectURL(attachment.preview);
    setAttachment(null);
  };

  // ─── Poll handlers ───
  const handleTogglePoll = () => {
    if (showPollBuilder) {
      setShowPollBuilder(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } else {
      setShowPollBuilder(true);
      clearAttachment();
    }
  };

  const addPollOption = () => { if (pollOptions.length < 6) setPollOptions([...pollOptions, '']); };
  const removePollOption = (idx) => { if (pollOptions.length > 2) setPollOptions(pollOptions.filter((_, i) => i !== idx)); };
  const updatePollOption = (idx, value) => { const u = [...pollOptions]; u[idx] = value; setPollOptions(u); };

  // ─── @mention autocomplete ───
  const handleChatInputChange = (e) => {
    const val = e.target.value;
    setChatMsg(val);

    // Detect @mention trigger
    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const mentionMatch = textBefore.match(/@([a-zA-Z0-9_.-]{0,30})$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      if (query.length >= 2) {
        clearTimeout(mentionTimeout.current);
        mentionTimeout.current = setTimeout(async () => {
          try {
            const users = await searchCommunityUsers(query);
            setMentionResults(users);
            setShowMentionDropdown(users.length > 0);
          } catch (_) {
            setShowMentionDropdown(false);
          }
        }, 300);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  const insertMention = (username) => {
    const cursor = chatInputRef.current?.selectionStart || chatMsg.length;
    const textBefore = chatMsg.slice(0, cursor);
    const atPos = textBefore.lastIndexOf('@');
    if (atPos >= 0) {
      const newText = chatMsg.slice(0, atPos) + `@${username} ` + chatMsg.slice(cursor);
      setChatMsg(newText);
    }
    setShowMentionDropdown(false);
    setMentionResults([]);
    chatInputRef.current?.focus();
  };

  // ─── Reply ───
  const handleReply = (post) => {
    setReplyTo({ id: post.id, user: post.user, text: (post.text || '').slice(0, 80) });
    chatInputRef.current?.focus();
  };

  const cancelReply = () => setReplyTo(null);

  // ─── Load replies (threaded) ───
  const toggleReplies = async (postId) => {
    if (repliesMap[postId]?.loaded) {
      setRepliesMap((prev) => {
        const copy = { ...prev };
        delete copy[postId];
        return copy;
      });
      return;
    }
    setRepliesMap((prev) => ({ ...prev, [postId]: { loaded: false, loading: true, replies: [] } }));
    try {
      const replies = await fetchPostReplies(postId);
      setRepliesMap((prev) => ({ ...prev, [postId]: { loaded: true, loading: false, replies } }));
    } catch (_) {
      setRepliesMap((prev) => ({ ...prev, [postId]: { loaded: true, loading: false, replies: [] } }));
    }
  };

  // ─── Send message ───
  const handleSendChat = async () => {
    const text = chatMsg.trim();
    let finalText = text;

    if (showPollBuilder) {
      const q = pollQuestion.trim();
      const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (!q) { addToast('Escribe la pregunta de la encuesta', 'error'); return; }
      if (opts.length < 2) { addToast('Agrega al menos 2 opciones', 'error'); return; }
      const pollBlock = `📊 **ENCUESTA:** ${q}\n${opts.map((o, i) => `  ${i + 1}. ${o}`).join('\n')}\n\n_Reacciona para votar_`;
      finalText = finalText ? `${finalText}\n\n${pollBlock}` : pollBlock;
    }

    if (!finalText && !attachment) return;
    if (chatSending) return;

    setChatSending(true);
    try {
      const payload = { text: finalText || '', privacy: 'Public' };
      if (community?.shortUrl) payload.shortUrl = community.shortUrl;
      if (attachment) {
        payload.attachmentFile = attachment.file;
        payload.attachmentType = attachment.type;
      }
      if (replyTo) payload.replyTo = replyTo.id;

      const newPost = await publishCommunityPost(payload);

      // If it's a reply, add to replies map if loaded, otherwise add to top
      if (replyTo && repliesMap[replyTo.id]?.loaded) {
        setRepliesMap((prev) => ({
          ...prev,
          [replyTo.id]: {
            ...prev[replyTo.id],
            replies: [...(prev[replyTo.id]?.replies || []), newPost]
          }
        }));
      } else {
        setChatPosts((prev) => [newPost, ...prev]);
      }

      setChatMsg('');
      clearAttachment();
      setReplyTo(null);
      if (showPollBuilder) {
        setShowPollBuilder(false);
        setPollQuestion('');
        setPollOptions(['', '']);
      }
      addToast('Mensaje publicado', 'success');
    } catch (err) {
      addToast(err?.response?.data?.message || 'Error al publicar', 'error');
    } finally {
      setChatSending(false);
    }
  };

  const handleChatLike = async (postId, isReply, parentId) => {
    try {
      const result = await toggleCommunityPostLike(postId);
      const update = (p) => p.id === postId ? { ...p, liked: result.likedByMe, likes: result.likesCount } : p;

      if (isReply && parentId && repliesMap[parentId]) {
        setRepliesMap((prev) => ({
          ...prev,
          [parentId]: {
            ...prev[parentId],
            replies: prev[parentId].replies.map(update)
          }
        }));
      } else {
        setChatPosts((prev) => prev.map(update));
      }
    } catch (_) {}
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  // ─── 3-dot menu actions ───
  const handleDeletePost = async (postId) => {
    setActiveMenu(null);
    try {
      await deleteCommunityPost(postId);
      setChatPosts((prev) => prev.filter((p) => p.id !== postId));
      addToast('Mensaje eliminado', 'success');
    } catch (err) {
      addToast(err?.response?.data?.message || 'Error al eliminar', 'error');
    }
  };

  const handleReportPost = async () => {
    if (!reportModal || !reportReason.trim()) {
      addToast('Selecciona un motivo', 'error');
      return;
    }
    try {
      await reportCommunityPost(reportModal.postId, { reason: reportReason.trim() });
      addToast('Reporte enviado', 'success');
    } catch (err) {
      addToast(err?.response?.data?.message || 'Error al reportar', 'error');
    }
    setReportModal(null);
    setReportReason('');
  };

  const handleBlockUser = async (userId, username) => {
    setActiveMenu(null);
    try {
      await blockCommunityUser(userId);
      addToast(`${username} bloqueado`, 'success');
    } catch (err) {
      addToast(err?.response?.data?.message || 'Error al bloquear', 'error');
    }
  };

  // Close menu on outside click
  useEffect(() => {
    if (!activeMenu) return;
    const handleClick = () => setActiveMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [activeMenu]);

  /* ─── Render a single chat message ─── */
  const renderChatMsg = (post, depth = 0, parentId = null) => {
    const isReply = depth > 0;
    const replyData = repliesMap[post.id];

    return (
      <div key={post.id} className={`ct__chat-msg ${depth > 0 ? 'ct__chat-msg--reply' : ''}`}>
        <div className="ct__chat-msg-avatar">
          {post.avatar ? (
            <img src={post.avatar} alt="" />
          ) : (
            <span>{(post.user || 'U')[0].toUpperCase()}</span>
          )}
        </div>
        <div className="ct__chat-msg-body">
          <div className="ct__chat-msg-head">
            <strong>{post.user}</strong>
            <span className="ct__chat-msg-time">{post.time}</span>
            {/* 3-dot menu */}
            <div className="ct__chat-msg-menu-wrap">
              <button
                className="ct__chat-msg-menu-btn"
                onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === post.id ? null : post.id); }}
              >
                <FaEllipsisH />
              </button>
              {activeMenu === post.id && (
                <div className="ct__chat-msg-dropdown" onClick={(e) => e.stopPropagation()}>
                  {post.isOwner && (
                    <button className="ct__dropdown-item ct__dropdown-item--danger" onClick={() => handleDeletePost(post.id)}>
                      <FaTrash /> Eliminar
                    </button>
                  )}
                  <button className="ct__dropdown-item" onClick={() => { setActiveMenu(null); setReportModal({ postId: post.id }); }}>
                    <FaExclamationTriangle /> Reportar
                  </button>
                  {!post.isOwner && post.authorId && (
                    <button className="ct__dropdown-item ct__dropdown-item--danger" onClick={() => handleBlockUser(post.authorId, post.user)}>
                      <FaBan /> Bloquear
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reply reference */}
          {post.replyTo && (
            <div className="ct__chat-msg-reply-ref">
              <FaReply />
              <span>respondió a <strong>{post.replyTo.author?.username || 'alguien'}</strong></span>
              {post.replyTo.text && <span className="ct__reply-ref-text">: {post.replyTo.text}</span>}
            </div>
          )}

          <p className="ct__chat-msg-text">{renderRichText(post.text)}</p>

          {post.image && <img src={post.image} alt="" className="ct__chat-msg-img" />}
          {post.file && (
            <a href={post.file.url} target="_blank" rel="noreferrer" className="ct__chat-msg-file">
              <FaFile /> <span>{post.file.name}</span>
            </a>
          )}

          {/* Hashtags */}
          {post.hashtags?.length > 0 && (
            <div className="ct__chat-msg-tags">
              {post.hashtags.map((tag) => (
                <span key={tag} className="ct__hashtag-chip"><FaHashtag />{tag}</span>
              ))}
            </div>
          )}

          {/* Actions row */}
          <div className="ct__chat-msg-actions">
            <button
              className={`ct__chat-like ${post.liked ? 'ct__chat-like--active' : ''}`}
              onClick={() => handleChatLike(post.id, isReply, parentId)}
            >
              {post.liked ? <FaHeart /> : <FaRegHeart />}
              {post.likes > 0 && <span>{post.likes}</span>}
            </button>
            {(community.joined || community.isOwner) && (
              <button className="ct__chat-reply-btn" onClick={() => handleReply(post)}>
                <FaReply /> Responder
              </button>
            )}
            {!isReply && (
              <button className="ct__chat-replies-toggle" onClick={() => toggleReplies(post.id)}>
                <FaCommentDots /> {replyData?.loaded ? 'Ocultar' : 'Ver'} respuestas
              </button>
            )}
          </div>

          {/* Nested replies */}
          {replyData?.loading && (
            <div className="ct__section-loading"><div className="ct__spinner ct__spinner--sm" /></div>
          )}
          {replyData?.loaded && replyData.replies.length > 0 && (
            <div className="ct__chat-replies">
              {replyData.replies.map((reply) => renderChatMsg(reply, depth + 1, post.id))}
            </div>
          )}
          {replyData?.loaded && replyData.replies.length === 0 && (
            <div className="ct__chat-no-replies">Sin respuestas aún</div>
          )}
        </div>
      </div>
    );
  };

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="ct">
        <div className="ct__loader">
          <div className="ct__spinner" />
          <span>Cargando comunidad...</span>
        </div>
      </div>
    );
  }

  /* ─── Error / Not found ─── */
  if (!community) {
    return (
      <div className="ct">
        <div className="ct__empty-state">
          <button className="ct__back" onClick={() => navigate('/comunidad')}>
            <FaArrowLeft /> Volver
          </button>
          <div className="ct__empty-card">
            <FaUsers className="ct__empty-icon" />
            <h2>Comunidad no encontrada</h2>
            <p>{error || 'No existe o fue eliminada.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const members = sortCommunityMembersByRole(community.members);
  const owner = community.createdBy;
  const games = Array.isArray(community.mainGames) ? community.mainGames : [];

  const activeTournaments = tournaments.filter((t) => t.status === 'open' || t.status === 'ongoing');
  const pastTournaments = tournaments.filter((t) => t.status === 'finished');

  return (
    <div className="ct">
      {/* ═══ HERO ═══ */}
      <header className="ct__hero">
        {community.bannerUrl && (
          <img src={community.bannerUrl} alt="" className="ct__hero-bg" />
        )}
        <div className="ct__hero-overlay" />

        <div className="ct__hero-inner">
          <button className="ct__back ct__back--hero" onClick={() => navigate('/comunidad')}>
            <FaArrowLeft />
          </button>

          <div className="ct__hero-profile">
            {community.avatarUrl ? (
              <img src={community.avatarUrl} alt={community.name} className="ct__avatar" />
            ) : (
              <div className="ct__avatar ct__avatar--fallback">
                {(community.name || 'C')[0].toUpperCase()}
              </div>
            )}

            <div className="ct__hero-info">
              <h1 className="ct__title">{community.name}</h1>
              {community.description && (
                <p className="ct__tagline">{community.description}</p>
              )}

              <div className="ct__meta-row">
                <span className="ct__meta-chip">
                  <FaUsers /> {community.membersCount || 0} miembros
                </span>
                {community.region && (
                  <span className="ct__meta-chip">
                    <FaMapMarkerAlt /> {community.region}
                  </span>
                )}
                {community.language && (
                  <span className="ct__meta-chip">
                    <FaGlobe /> {community.language}
                  </span>
                )}
                {community.role && community.role !== 'guest' && (
                  <span className="ct__meta-chip ct__meta-chip--role">
                    <FaShieldAlt /> {ROLE_LABELS[community.role] || community.role}
                  </span>
                )}
              </div>
              {socialEntries.length > 0 && (
                <div className="ct__meta-row">
                  {socialEntries.map((entry) => (
                    <a
                      key={entry.key}
                      href={entry.url}
                      className="ct__meta-chip"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <i className={entry.iconClass} aria-hidden="true" /> {entry.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="ct__hero-actions">
            {community.isOwner ? (
              <>
                <span className="ct__badge-owner"><FaCrown /> Owner</span>
                <button className="ct__btn-action ct__btn-action--manage" onClick={handleOpenAdminPanel}>
                  <FaShieldAlt /> Administrar
                </button>
              </>
            ) : (
              <button
                className={`ct__btn-action ${community.joined ? 'ct__btn-action--leave' : ''}`}
                onClick={handleJoinLeave}
                disabled={joining}
              >
                {joining ? 'Procesando...' : community.joined ? (
                  <><FaSignOutAlt /> Salir</>
                ) : (
                  <><FaUserPlus /> Unirme</>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ═══ CONTENT ═══ */}
      <main className="ct__body">
        {/* Games strip */}
        {games.length > 0 && (
          <div className="ct__games-strip">
            {games.map((g) => (
              <span key={g} className="ct__game-tag">
                <FaGamepad /> {g}
              </span>
            ))}
          </div>
        )}

        {/* ═══ CHAT HUB ═══ */}
        <section className="ct__section ct__chat-section">
          <h2 className="ct__section-title"><FaCommentDots /> Hub</h2>

          {/* Prompts */}
          <div className="ct__chat-prompts">
            {CHAT_PROMPTS.map((p, i) => (
              <button
                key={i}
                className="ct__chat-prompt"
                onClick={() => handlePromptClick(p.text)}
              >
                <span className="ct__chat-prompt-emoji">{p.emoji}</span>
                {p.text.trim().replace(/ $/, '...')}
              </button>
            ))}
          </div>

          {/* Composer */}
          {community.joined || community.isOwner ? (
            <div className="ct__chat-composer-wrap">
              {/* Reply indicator */}
              {replyTo && (
                <div className="ct__chat-reply-indicator">
                  <FaReply />
                  <span>Respondiendo a <strong>{replyTo.user}</strong>: {replyTo.text}...</span>
                  <button className="ct__chat-reply-cancel" onClick={cancelReply}><FaTimes /></button>
                </div>
              )}

              {/* Attachment preview */}
              {attachment && (
                <div className="ct__chat-attachment-preview">
                  {attachment.type === 'image' && attachment.preview ? (
                    <img src={attachment.preview} alt="Preview" className="ct__attachment-thumb" />
                  ) : (
                    <div className="ct__attachment-file">
                      <FaFile />
                      <span>{attachment.file?.name || 'Archivo'}</span>
                    </div>
                  )}
                  <button className="ct__attachment-remove" onClick={clearAttachment} title="Quitar">
                    <FaTimes />
                  </button>
                </div>
              )}

              {/* Poll builder */}
              {showPollBuilder && (
                <div className="ct__poll-builder">
                  <div className="ct__poll-header">
                    <FaPoll />
                    <span>Crear encuesta</span>
                    <button className="ct__poll-close" onClick={handleTogglePoll}><FaTimes /></button>
                  </div>
                  <input
                    className="ct__poll-question"
                    placeholder="Pregunta de la encuesta..."
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    maxLength={200}
                  />
                  <div className="ct__poll-options">
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="ct__poll-option-row">
                        <span className="ct__poll-option-num">{i + 1}.</span>
                        <input
                          className="ct__poll-option-input"
                          placeholder={`Opción ${i + 1}`}
                          value={opt}
                          onChange={(e) => updatePollOption(i, e.target.value)}
                          maxLength={100}
                        />
                        {pollOptions.length > 2 && (
                          <button className="ct__poll-option-del" onClick={() => removePollOption(i)}>
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {pollOptions.length < 6 && (
                    <button className="ct__poll-add-option" onClick={addPollOption}>
                      <FaPlus /> Agregar opción
                    </button>
                  )}
                </div>
              )}

              <div className="ct__chat-composer">
                <div className="ct__chat-composer-avatar">
                  {authUser?.avatar ? (
                    <img src={authUser.avatar} alt="" />
                  ) : (
                    <span>{(authUser?.username || 'U')[0].toUpperCase()}</span>
                  )}
                </div>

                <div className="ct__chat-input-wrap">
                  <textarea
                    ref={chatInputRef}
                    className="ct__chat-input"
                    placeholder={replyTo ? `Responder a @${replyTo.user}...` : 'Escribe algo... usa @usuario o #hashtag'}
                    value={chatMsg}
                    onChange={handleChatInputChange}
                    onKeyDown={handleChatKeyDown}
                    rows={1}
                    maxLength={1200}
                  />

                  {/* @mention autocomplete dropdown */}
                  {showMentionDropdown && mentionResults.length > 0 && (
                    <div className="ct__mention-dropdown">
                      {mentionResults.map((u) => (
                        <button key={u.id} className="ct__mention-option" onClick={() => insertMention(u.username)}>
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="ct__mention-option-avatar" />
                          ) : (
                            <span className="ct__mention-option-avatar ct__mention-option-avatar--fallback">
                              {u.username[0].toUpperCase()}
                            </span>
                          )}
                          <span>@{u.username}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ct__chat-toolbar">
                  <button className="ct__chat-tool-btn" onClick={() => imageInputRef.current?.click()} title="Subir imagen">
                    <FaImage />
                  </button>
                  <button className="ct__chat-tool-btn" onClick={() => docInputRef.current?.click()} title="Subir documento">
                    <FaPaperclip />
                  </button>
                  <button
                    className={`ct__chat-tool-btn ${showPollBuilder ? 'ct__chat-tool-btn--active' : ''}`}
                    onClick={handleTogglePoll}
                    title="Crear encuesta"
                  >
                    <FaPoll />
                  </button>
                </div>
                <button
                  className="ct__chat-send"
                  onClick={handleSendChat}
                  disabled={(!chatMsg.trim() && !attachment && !showPollBuilder) || chatSending}
                  title="Enviar"
                >
                  <FaPaperPlane />
                </button>
              </div>

              <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
              <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar" style={{ display: 'none' }} onChange={handleDocSelect} />
            </div>
          ) : (
            <div className="ct__chat-locked">
              <FaLock />
              <span>Únete a la comunidad para publicar en el Hub</span>
            </div>
          )}

          {/* Messages */}
          {chatLoading ? (
            <div className="ct__section-loading"><div className="ct__spinner ct__spinner--sm" /> Cargando mensajes...</div>
          ) : chatPosts.length > 0 ? (
            <div className="ct__chat-feed">
              {chatPosts.map((post) => renderChatMsg(post))}
            </div>
          ) : (
            <div className="ct__empty-section">
              <FaCommentDots />
              <p>Sé el primero en escribir en el Hub</p>
            </div>
          )}
        </section>

        {/* Owner */}
        {owner && owner.username && (
          <section className="ct__section">
            <h2 className="ct__section-title"><FaCrown /> Creador</h2>
            <div className="ct__owner-row">
              {owner.avatar ? (
                <img src={owner.avatar} alt={owner.username} className="ct__owner-avatar" />
              ) : (
                <div className="ct__owner-avatar ct__owner-avatar--fallback">
                  {owner.username[0].toUpperCase()}
                </div>
              )}
              <div>
                <strong>{owner.username}</strong>
                <span>Owner</span>
              </div>
            </div>
          </section>
        )}

        {/* Rules PDF */}
        {community.rulesPdfUrl && (
          <section className="ct__section">
            <h2 className="ct__section-title"><FaShieldAlt /> Reglamento</h2>
            <a href={community.rulesPdfUrl} target="_blank" rel="noreferrer" className="ct__pdf-link">
              <FaFilePdf />
              <span>{community.rulesPdfName || 'Ver reglamento (PDF)'}</span>
            </a>
          </section>
        )}

        {/* ═══ TOURNAMENTS ═══ */}
        <section className="ct__section">
          <h2 className="ct__section-title">
            <FaTrophy /> Torneos
            {tournaments.length > 0 && <span className="ct__count">{tournaments.length}</span>}
          </h2>

          {hubLoading ? (
            <div className="ct__section-loading"><div className="ct__spinner ct__spinner--sm" /> Cargando...</div>
          ) : tournaments.length > 0 ? (
            <>
              {activeTournaments.length > 0 && (
                <div className="ct__tournament-list">
                  {activeTournaments.map((t) => (
                    <div key={t.tournamentId || t._id} className="ct__tournament-item" onClick={() => navigate(`/tournaments/${t.tournamentId}`)}>
                      <div className="ct__tournament-head">
                        <span className={`ct__status ct__status--${t.status}`}>
                          {t.status === 'ongoing' && <FaCircle className="ct__status-dot" />}
                          {STATUS_LABELS[t.status] || t.status}
                        </span>
                        <span className="ct__tournament-game">{t.game}</span>
                      </div>
                      <h3>{t.name}</h3>
                      <div className="ct__tournament-meta">
                        {t.prizePool && <span><FaTrophy /> {t.prizePool} {t.currency || ''}</span>}
                        <span><FaUsers /> {t.currentSlots || 0}/{t.maxSlots || '?'}</span>
                        {t.modality && <span><FaGamepad /> {t.modality}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {pastTournaments.length > 0 && (
                <>
                  <h3 className="ct__subsection-title">Finalizados</h3>
                  <div className="ct__tournament-list ct__tournament-list--past">
                    {pastTournaments.map((t) => (
                      <div key={t.tournamentId || t._id} className="ct__tournament-item ct__tournament-item--past" onClick={() => navigate(`/tournaments/${t.tournamentId}`)}>
                        <div className="ct__tournament-head">
                          <span className="ct__status ct__status--finished">{STATUS_LABELS.finished}</span>
                          <span className="ct__tournament-game">{t.game}</span>
                        </div>
                        <h3>{t.name}</h3>
                        <div className="ct__tournament-meta">
                          {t.prizePool && <span><FaTrophy /> {t.prizePool}</span>}
                          <span><FaUsers /> {t.currentSlots || 0}/{t.maxSlots || '?'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="ct__empty-section">
              <FaTrophy />
              <p>No hay torneos asociados a los juegos de esta comunidad</p>
            </div>
          )}
        </section>

        {/* ═══ TEAMS ═══ */}
        <section className="ct__section">
          <h2 className="ct__section-title">
            <FaFlag /> Equipos
            {teams.length > 0 && <span className="ct__count">{teams.length}</span>}
          </h2>

          {hubLoading ? (
            <div className="ct__section-loading"><div className="ct__spinner ct__spinner--sm" /> Cargando...</div>
          ) : teams.length > 0 ? (
            <div className="ct__teams-grid">
              {teams.map((t) => {
                const rosterCount = (t.roster?.starters?.length || 0) + (t.roster?.subs?.length || 0);
                return (
                  <div key={t.teamCode || t._id} className="ct__team-item" onClick={() => navigate(`/teams/${t.teamCode || t._id}`)}>
                    <div className="ct__team-top">
                      {t.logoUrl ? (
                        <img src={t.logoUrl} alt={t.name} className="ct__team-logo" />
                      ) : (
                        <div className="ct__team-logo ct__team-logo--fallback">
                          {(t.tag || t.name || 'T')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="ct__team-info">
                        <strong>{t.name}</strong>
                        {t.tag && <span className="ct__team-tag">[{t.tag}]</span>}
                      </div>
                    </div>
                    <div className="ct__team-details">
                      <span><FaGamepad /> {t.game}</span>
                      <span><FaUsers /> {rosterCount} jugadores</span>
                      {t.teamCountry && <span><FaMapMarkerAlt /> {t.teamCountry}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="ct__empty-section">
              <FaFlag />
              <p>No hay equipos asociados a los juegos de esta comunidad</p>
            </div>
          )}
        </section>

        {/* ═══ MEMBERS ═══ */}
        <section className="ct__section">
          <h2 className="ct__section-title">
            <FaUsers /> Miembros
            <span className="ct__count">{community.membersCount || members.length}</span>
          </h2>

          {members.length > 0 ? (
            <div className="ct__members-grid">
              {members.map((m, i) => {
                const role = m.role || 'member';
                const username = m.user?.username || 'Usuario';
                return (
                  <div key={m.user?.id || i} className={`ct__member ${role === 'owner' ? 'ct__member--owner' : ''}`}>
                    {m.user?.avatar ? (
                      <img src={m.user.avatar} alt={username} className="ct__member-avatar" />
                    ) : (
                      <div className="ct__member-avatar ct__member-avatar--fallback">
                        {username[0].toUpperCase()}
                      </div>
                    )}
                    <div className="ct__member-info">
                      <strong>{username}</strong>
                      <span className={`ct__role ct__role--${role}`}>
                        {getCommunityMemberRoleLabel(role) || role}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="ct__empty-section">
              <FaUsers />
              <p>Aún no hay miembros</p>
            </div>
          )}
        </section>

        {/* Info footer */}
        <footer className="ct__info-footer">
          <span><FaCalendarAlt /> Comunidad en GLITCH GANG</span>
        </footer>
      </main>

      {/* ═══ REPORT MODAL ═══ */}
      {reportModal && (
        <div className="ct__modal-overlay" onClick={() => { setReportModal(null); setReportReason(''); }}>
          <div className="ct__modal" onClick={(e) => e.stopPropagation()}>
            <h3><FaExclamationTriangle /> Reportar mensaje</h3>
            <select
              className="ct__modal-select"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            >
              <option value="">Selecciona un motivo...</option>
              {COMMUNITY_REPORT_REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="ct__modal-actions">
              <button className="ct__modal-btn ct__modal-btn--cancel" onClick={() => { setReportModal(null); setReportReason(''); }}>
                Cancelar
              </button>
              <button className="ct__modal-btn ct__modal-btn--confirm" onClick={handleReportPost} disabled={!reportReason}>
                Enviar reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityTemplateV2;
