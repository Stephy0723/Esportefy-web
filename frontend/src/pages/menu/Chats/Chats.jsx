import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  FaBars, FaComments, FaGamepad, FaPaperclip,
  FaPaperPlane, FaSearch, FaShieldAlt, FaSmile,
  FaTimes, FaUsers, FaWifi
} from 'react-icons/fa';
import PageHud from '../../../components/PageHud/PageHud';
import { API_URL, CHAT_URL } from '../../../config/api';
import { getAuthToken, getStoredUser } from '../../../utils/authSession';
import { applyImageFallback, getAvatarFallback, getTeamFallback, resolveMediaUrl } from '../../../utils/media';
import './Chats.css';

/* ── helpers ── */
const clean = (v = '') => String(v || '').trim();
const toId = (v = null) => { if (!v) return ''; if (typeof v === 'string') return clean(v); if (typeof v === 'object') return clean(v?._id || v?.id || ''); return clean(v); };
const uniqueIds = (a = []) => Array.from(new Set((Array.isArray(a) ? a : []).map(toId).filter(Boolean)));
const authCfg = (t = '') => { const tk = clean(t); return { headers: tk && tk !== 'cookie-session' ? { Authorization: `Bearer ${tk}` } : {}, withCredentials: true }; };
const teamHasUser = (t = {}, uid = '') => { const id = toId(uid); if (!id) return false; if (toId(t?.captain) === id) return true; const s = Array.isArray(t?.roster?.starters) ? t.roster.starters : []; const b = Array.isArray(t?.roster?.subs) ? t.roster.subs : []; const c = t?.roster?.coach?.user ? [t.roster.coach] : []; return [...s, ...b, ...c].some((sl) => toId(sl?.user) === id); };
const buildUserDetail = (u = {}) => ({ userId: toId(u?._id || u?.id), username: clean(u?.username), fullName: clean(u?.fullName || u?.username || 'Jugador'), avatar: clean(u?.avatar), role: clean(Array.isArray(u?.roles) && u.roles[0] ? u.roles[0] : 'Jugador') });

const buildTeamMembers = (team = {}, me = {}, dir = new Map()) => {
  const m = new Map();
  const add = (e = {}) => { const uid = toId(e?.userId); if (!uid) return; const p = m.get(uid) || { userId: uid, username: '', fullName: '', avatar: '', role: '' }; m.set(uid, { userId: uid, username: clean(e?.username || p.username), fullName: clean(e?.fullName || p.fullName || e?.username || 'Jugador'), avatar: clean(e?.avatar || p.avatar), role: clean(e?.role || p.role || 'Jugador') }); };
  const merge = (uid, fb = {}) => { const d = dir.get(uid) || {}; const isMe = uid === toId(me?._id || me?.id); const cu = isMe ? buildUserDetail(me) : {}; add({ userId: uid, username: fb.username || d.username || cu.username, fullName: fb.fullName || d.fullName || cu.fullName, avatar: fb.avatar || d.avatar || cu.avatar, role: fb.role || d.role || cu.role }); };
  merge(toId(team?.captain), { fullName: clean(team?.captain?.fullName || team?.captain?.username), avatar: clean(team?.captain?.avatar), role: 'Capitan' });
  (Array.isArray(team?.roster?.starters) ? team.roster.starters : []).forEach((sl) => merge(toId(sl?.user), { fullName: clean(sl?.nickname || sl?.user?.fullName || sl?.user?.username), avatar: clean(sl?.photo || sl?.user?.avatar), role: clean(sl?.role || 'Titular') }));
  (Array.isArray(team?.roster?.subs) ? team.roster.subs : []).forEach((sl) => merge(toId(sl?.user), { fullName: clean(sl?.nickname || sl?.user?.fullName || sl?.user?.username), avatar: clean(sl?.photo || sl?.user?.avatar), role: clean(sl?.role || 'Suplente') }));
  if (team?.roster?.coach?.user) merge(toId(team.roster.coach.user), { fullName: clean(team.roster.coach.nickname || team.roster.coach.user?.fullName), avatar: clean(team.roster.coach.photo || team.roster.coach.user?.avatar), role: 'Coach' });
  return Array.from(m.values());
};

const buildContacts = ({ teams = [], friends = [], me = {} }) => {
  const myId = toId(me?._id || me?.id); const idx = new Map();
  const save = (e = {}) => { const uid = toId(e?.userId || e?.id); if (!uid || uid === myId) return; const p = idx.get(uid) || { userId: uid, username: '', fullName: '', avatar: '', role: '', source: '' }; idx.set(uid, { userId: uid, username: clean(e?.username || p.username), fullName: clean(e?.fullName || e?.name || p.fullName || 'Jugador'), avatar: clean(e?.avatar || p.avatar), role: clean(e?.role || p.role || 'Jugador'), source: clean(e?.source || p.source) }); };
  friends.forEach((f) => save({ userId: f?.id, username: f?.username, fullName: f?.name, avatar: f?.avatar, role: f?.rank || 'Amigo', source: 'Amigo' }));
  const fd = new Map(Array.from(idx.values()).map((e) => [e.userId, e]));
  teams.forEach((t) => buildTeamMembers(t, me, fd).forEach((mb) => save({ ...mb, source: clean(t?.name || 'Equipo') })));
  return Array.from(idx.values()).sort((a, b) => (a.fullName || a.username).localeCompare(b.fullName || b.username, 'es', { sensitivity: 'base' }));
};

const normConvo = (c = {}) => ({ id: toId(c?._id || c?.id), type: clean(c?.type || 'individual').toLowerCase() === 'team' ? 'team' : 'individual', participants: uniqueIds(c?.participants), teamId: clean(c?.teamId), title: clean(c?.title), image: clean(c?.image), teamCode: clean(c?.teamCode), game: clean(c?.game), createdBy: clean(c?.createdBy), participantDetails: Array.isArray(c?.participantDetails) ? c.participantDetails.map((e) => ({ userId: toId(e?.userId), username: clean(e?.username), fullName: clean(e?.fullName), avatar: clean(e?.avatar), role: clean(e?.role) })) : [], lastMessage: clean(c?.lastMessage), lastSenderId: clean(c?.lastSenderId), lastSenderName: clean(c?.lastSenderName), createdAt: c?.createdAt || null, updatedAt: c?.updatedAt || c?.createdAt || null });

const normMsg = (m = {}) => ({
  id: toId(m?._id || m?.id), conversationId: toId(m?.conversationId), senderId: clean(m?.senderId),
  senderName: clean(m?.senderName || 'Jugador'), text: clean(m?.text || m?.content),
  msgType: clean(m?.msgType || 'text'), fileUrl: clean(m?.fileUrl), fileName: clean(m?.fileName),
  fileSize: Number(m?.fileSize) || 0, fileMime: clean(m?.fileMime), voiceDuration: Number(m?.voiceDuration) || 0,
  pollQuestion: clean(m?.pollQuestion), pollOptions: Array.isArray(m?.pollOptions) ? m.pollOptions : [],
  pollClosed: Boolean(m?.pollClosed), timestamp: m?.timestamp || m?.createdAt || new Date().toISOString()
});

const fmtTime = (v) => { if (!v) return ''; const d = new Date(v); return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }); };
const fmtDay = (v) => { if (!v) return ''; const d = new Date(v); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es', { day: 'numeric', month: 'short' }); };
const sortConvos = (a = []) => [...a].sort((x, y) => new Date(y?.updatedAt || 0).getTime() - new Date(x?.updatedAt || 0).getTime());

const convoMeta = (c = {}, myId = '') => {
  if (c?.type === 'team') { const n = c?.participantDetails?.length || c?.participants?.length || 0; return { title: clean(c?.title || 'Equipo'), subtitle: [c?.teamCode, c?.game, n ? `${n} miembros` : ''].filter(Boolean).join(' · '), image: resolveMediaUrl(c?.image), fallback: getTeamFallback(c?.title || 'Equipo'), badge: 'Equipo' }; }
  const other = (c?.participantDetails || []).find((e) => toId(e?.userId) !== myId) || c?.participantDetails?.[0] || {};
  return { title: clean(other?.username || other?.fullName || c?.title || 'Chat'), subtitle: clean(other?.role || 'Directo'), image: resolveMediaUrl(other?.avatar || c?.image), fallback: getAvatarFallback(other?.fullName || other?.username || 'Jugador'), badge: 'Directo' };
};

/* ── Emoji data ── */
const EMOJI_SETS = [
  ['😀','😂','🤣','😍','🥳','😎','🤩','🥺','😤','🔥','💯','👏','🙌','💪','🎮','🏆','⚡','💀','👀','❤️','💚','💙','🖤','✅','❌'],
  ['🎯','🚀','💎','🗡️','🛡️','👑','🎖️','🏅','🎪','🎲','🃏','♟️','🕹️','📱','💻','🖥️','⌨️','🖱️','📡','🔔'],
  ['👍','👎','✌️','🤝','🫡','🫠','💅','🧠','👻','🤖','😈','🤡','💩','🎃','☠️','👽','🦾','🦿','🧿','🪬']
];

/* ── Component ── */
const Chats = () => {
  const [user, setUser] = useState(() => getStoredUser());
  const [teams, setTeams] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [convos, setConvos] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [error, setError] = useState('');
  const [creatingDm, setCreatingDm] = useState('');
  const [sidebar, setSidebar] = useState(false);
  const [unread, setUnread] = useState({});
  const [connected, setConnected] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);

  const sock = useRef(null);
  const activeRef = useRef('');
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  const myId = useMemo(() => toId(user?._id || user?.id), [user]);
  const myUsername = useMemo(() => clean(user?.username || user?.fullName || 'Jugador'), [user]);

  useEffect(() => { activeRef.current = activeId; }, [activeId]);

  /* ── load workspace ── */
  useEffect(() => {
    let dead = false;
    (async () => {
      setLoading(true); setError('');
      const token = getAuthToken(); const stored = getStoredUser();
      try {
        const [pR, fR, tR] = await Promise.allSettled([axios.get(`${API_URL}/api/auth/profile`, authCfg(token)), axios.get(`${API_URL}/api/auth/friends`, authCfg(token)), axios.get(`${API_URL}/api/team`)]);
        const u = pR.status === 'fulfilled' ? pR.value?.data : stored;
        if (!u) throw new Error('Inicia sesion para usar el chat.');
        const uid = toId(u?._id || u?.id); if (!uid) throw new Error('No se pudo identificar tu sesion.');
        const profileTeams = Array.isArray(u?.teams) ? u.teams : [];
        const publicTeams = tR.status === 'fulfilled' && Array.isArray(tR.value?.data) ? tR.value.data : [];
        const tm = new Map();
        profileTeams.forEach((t) => { const id = toId(t?._id || t?.id); if (id) tm.set(id, t); });
        publicTeams.forEach((t) => { const id = toId(t?._id || t?.id); if (!id) return; if (teamHasUser(t, uid) || tm.has(id)) { const prev = tm.get(id) || {}; tm.set(id, { ...prev, ...t, roster: t?.roster || prev?.roster, captain: t?.captain || prev?.captain }); } });
        const myTeams = Array.from(tm.values()).filter((t) => teamHasUser(t, uid));
        const friends = fR.status === 'fulfilled' && Array.isArray(fR.value?.data?.friends) ? fR.value.data.friends : [];
        const cts = buildContacts({ teams: myTeams, friends, me: u });
        if (dead) return;
        setUser(u); setTeams(myTeams); setContacts(cts);
        await Promise.allSettled(myTeams.map((t) => { const dir = new Map(cts.map((c) => [c.userId, c])); const members = buildTeamMembers(t, u, dir); const pl = { teamId: toId(t?._id || t?.id), title: clean(t?.name || 'Equipo'), image: clean(t?.logo), teamCode: clean(t?.teamCode), game: clean(t?.game), createdBy: toId(t?.captain), participants: members.map((m) => m.userId), participantDetails: members }; return pl.teamId && pl.participants.length > 0 ? axios.post(`${CHAT_URL}/conversations/ensure-team`, pl) : null; }).filter(Boolean));
        const cRes = await axios.get(`${CHAT_URL}/conversations`, { params: { userId: uid } });
        if (dead) return;
        const list = sortConvos((Array.isArray(cRes?.data) ? cRes.data : []).map(normConvo));
        setConvos(list);
        setActiveId((prev) => (prev && list.some((c) => c.id === prev)) ? prev : list[0]?.id || '');
      } catch (err) { if (!dead) setError(err?.response?.data?.message || err?.message || 'Error cargando el chat.'); }
      finally { if (!dead) setLoading(false); }
    })();
    return () => { dead = true; };
  }, []);

  /* ── socket ── */
  useEffect(() => {
    if (!myId) return;
    const s = io(CHAT_URL, { transports: ['websocket', 'polling'], reconnectionAttempts: 15, reconnectionDelay: 2000 });
    sock.current = s;
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', () => setConnected(false));
    s.on('receive_message', (payload) => {
      const msg = normMsg(payload);
      if (!msg.conversationId) return;
      setConvos((prev) => sortConvos(prev.map((c) => c.id === msg.conversationId ? { ...c, lastMessage: msg.text || '', lastSenderId: msg.senderId, lastSenderName: msg.senderName, updatedAt: msg.timestamp } : c)));
      if (activeRef.current === msg.conversationId) {
        setMsgs((prev) => { const cl = prev.filter((e) => !(e.id?.startsWith('temp-') && e.senderId === msg.senderId && e.text === msg.text)); return cl.some((e) => e.id && e.id === msg.id) ? cl : [...cl, msg]; });
        setUnread((p) => ({ ...p, [msg.conversationId]: 0 }));
      } else { setUnread((p) => ({ ...p, [msg.conversationId]: (Number(p?.[msg.conversationId]) || 0) + 1 })); }
    });
    return () => { s.disconnect(); sock.current = null; };
  }, [myId]);

  useEffect(() => { if (!sock.current) return; convos.forEach((c) => { if (c?.id) sock.current.emit('join_chat', c.id); }); }, [convos]);

  useEffect(() => {
    if (!activeId) { setMsgs([]); setLoadingMsgs(false); return; }
    let dead = false;
    (async () => {
      setLoadingMsgs(true); setUnread((p) => ({ ...p, [activeId]: 0 }));
      try { const r = await axios.get(`${CHAT_URL}/messages/${activeId}`); if (!dead) setMsgs((Array.isArray(r?.data) ? r.data : []).map(normMsg)); }
      catch (_e) { if (!dead) setError('No se pudo cargar el historial.'); }
      finally { if (!dead) setLoadingMsgs(false); }
    })();
    return () => { dead = true; };
  }, [activeId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs, activeId]);

  /* ── derived ── */
  const active = useMemo(() => convos.find((c) => c.id === activeId) || null, [activeId, convos]);
  const meta = useMemo(() => convoMeta(active || {}, myId), [active, myId]);
  const convoByTeam = useMemo(() => { const m = new Map(); convos.forEach((c) => { if (c?.type === 'team' && c?.teamId) m.set(c.teamId, c); }); return m; }, [convos]);
  const needle = useMemo(() => clean(search).toLowerCase(), [search]);
  const visibleConvos = useMemo(() => { const s = sortConvos(convos); if (!needle) return s; return s.filter((c) => { const m = convoMeta(c, myId); return [m.title, m.subtitle, c?.lastMessage].filter(Boolean).join(' ').toLowerCase().includes(needle); }); }, [convos, myId, needle]);
  const visibleContacts = useMemo(() => { if (!needle) return contacts; return contacts.filter((c) => [c?.fullName, c?.username, c?.role, c?.source].filter(Boolean).join(' ').toLowerCase().includes(needle)); }, [contacts, needle]);
  const members = useMemo(() => active?.participantDetails || [], [active]);
  const nickMap = useMemo(() => { const m = new Map(); (active?.participantDetails || []).forEach((p) => { const uid = toId(p?.userId); if (uid && p?.username) m.set(uid, clean(p.username)); }); return m; }, [active]);
  const resolveNick = useCallback((senderId, fallback) => nickMap.get(senderId) || fallback, [nickMap]);

  /* ── actions ── */
  const pick = useCallback((id) => { if (!clean(id)) return; setError(''); setActiveId(clean(id)); setUnread((p) => ({ ...p, [clean(id)]: 0 })); setSidebar(false); setShowEmoji(false); }, []);

  const openDm = useCallback(async (contact) => {
    const tid = toId(contact?.userId); if (!tid || !myId) return;
    const exists = convos.find((c) => c?.type === 'individual' && c?.participants?.length === 2 && c.participants.includes(myId) && c.participants.includes(tid));
    if (exists) { pick(exists.id); return; }
    setCreatingDm(tid); setError('');
    try {
      const r = await axios.post(`${CHAT_URL}/conversations`, { type: 'individual', participants: [myId, tid], participantDetails: [buildUserDetail(user), { userId: tid, username: clean(contact?.username), fullName: clean(contact?.fullName || contact?.username || 'Jugador'), avatar: clean(contact?.avatar), role: clean(contact?.role || 'Jugador') }] });
      const c = normConvo(r?.data); if (!c?.id) throw new Error('Error abriendo chat.');
      setConvos((prev) => sortConvos([c, ...prev.filter((e) => e.id !== c.id)]));
      if (sock.current) sock.current.emit('join_chat', c.id); pick(c.id);
    } catch (e) { setError(e?.response?.data?.error || 'No se pudo crear el chat.'); }
    finally { setCreatingDm(''); }
  }, [convos, myId, pick, user]);

  const send = useCallback(() => {
    const text = clean(draft); if (!text || !activeRef.current || !myId) return;
    if (!sock.current || !connected) { setError('Sin conexion. Reconectando...'); return; }
    setMsgs((prev) => [...prev, { id: `temp-${Date.now()}`, conversationId: activeRef.current, senderId: myId, senderName: myUsername, text, msgType: 'text', timestamp: new Date().toISOString() }]);
    sock.current.emit('send_message', { conversationId: activeRef.current, senderId: myId, senderName: myUsername, content: text, msgType: 'text' });
    setDraft(''); setShowEmoji(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [draft, myId, myUsername, connected]);

  const onKey = useCallback((e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }, [send]);

  const addEmoji = useCallback((emoji) => { setDraft((p) => p + emoji); textareaRef.current?.focus(); }, []);

  const handleFile = useCallback(async (e) => {
    const file = e.target.files?.[0]; if (!file || !activeRef.current || !myId) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await axios.post(`${CHAT_URL}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { fileUrl, fileName, fileSize, fileMime, msgType } = res.data;
      sock.current?.emit('send_message', { conversationId: activeRef.current, senderId: myId, senderName: myUsername, content: '', msgType, fileUrl, fileName, fileSize, fileMime });
    } catch (_e) { setError('Error subiendo archivo.'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }, [myId, myUsername]);

  /* ── LOADING ── */
  if (loading) return (<div className="cht"><PageHud page="MENSAJERIA" /><div className="cht-loading"><FaComments className="cht-loading__icon" /><h2>Cargando mensajeria...</h2><p>Conectando equipos, amigos y conversaciones.</p></div></div>);

  /* ── RENDER ── */
  return (
    <div className="cht">
      <PageHud page="MENSAJERIA" />

      <header className="cht-topbar">
        <div className="cht-topbar__left">
          <button type="button" className="cht-icon-btn cht-mobile-menu" onClick={() => setSidebar(true)}><FaBars /></button>
          <div><span className="cht-kicker">Centro de mensajeria</span><h1>Chats</h1></div>
        </div>
        <div className="cht-topbar__stats">
          <div className="cht-stat"><span>{convos.length}</span><small>Chats</small></div>
          <div className="cht-stat"><span>{teams.length}</span><small>Equipos</small></div>
          <div className="cht-stat"><span>{contacts.length}</span><small>Contactos</small></div>
        </div>
      </header>

      {error && <div className="cht-banner cht-banner--error"><FaShieldAlt /><span>{error}</span><button type="button" onClick={() => setError('')} className="cht-banner__close"><FaTimes /></button></div>}
      {!loading && !connected && !error && <div className="cht-banner cht-banner--warn"><FaWifi /><span>Conectando al servidor de chat...</span></div>}
      {sidebar && <button type="button" className="cht-backdrop" onClick={() => setSidebar(false)} aria-label="Cerrar" />}

      <div className="cht-layout">
        {/* SIDEBAR */}
        <aside className={`cht-side ${sidebar ? 'is-open' : ''}`}>
          <div className="cht-side__head"><h2>Conversaciones</h2><button type="button" className="cht-icon-btn cht-side__close" onClick={() => setSidebar(false)}><FaTimes /></button></div>
          <label className="cht-search"><FaSearch /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." /></label>
          <div className="cht-group">
            <div className="cht-group__head"><span>Chats activos</span><small>{visibleConvos.length}</small></div>
            <div className="cht-list">
              {visibleConvos.length > 0 ? visibleConvos.map((c) => { const cm = convoMeta(c, myId); const ur = Number(unread?.[c.id] || 0); return (
                <button type="button" key={c.id} className={`cht-row ${activeId === c.id ? 'is-active' : ''}`} onClick={() => pick(c.id)}>
                  <img className="cht-av" src={cm.image || cm.fallback} alt="" onError={(ev) => applyImageFallback(ev, cm.fallback)} />
                  <div className="cht-row__body">
                    <div className="cht-row__top"><strong>{cm.title}</strong><time>{fmtDay(c.updatedAt)}</time></div>
                    <div className="cht-row__bot"><span>{c.lastMessage || cm.subtitle || 'Sin mensajes'}</span>{ur > 0 && <em className="cht-pill">{ur}</em>}</div>
                  </div>
                </button>);
              }) : <div className="cht-empty cht-empty--sm"><FaComments /><p>Sin resultados.</p></div>}
            </div>
          </div>
          <div className="cht-group">
            <div className="cht-group__head"><span>Contactos</span><small>{visibleContacts.length}</small></div>
            <div className="cht-list">
              {visibleContacts.length > 0 ? visibleContacts.map((ct) => (
                <div key={ct.userId} className="cht-contact">
                  <img className="cht-av cht-av--sm" src={resolveMediaUrl(ct?.avatar) || getAvatarFallback(ct?.fullName || ct?.username)} alt="" onError={(ev) => applyImageFallback(ev, getAvatarFallback(ct?.fullName || ct?.username))} />
                  <div className="cht-contact__info"><strong>{ct.username || ct.fullName}</strong><span>{ct.source} · {ct.role}</span></div>
                  <button type="button" className="cht-btn-ghost" onClick={() => openDm(ct)} disabled={creatingDm === ct.userId}>{creatingDm === ct.userId ? '...' : 'Chat'}</button>
                </div>
              )) : <div className="cht-empty cht-empty--sm"><FaUsers /><p>Agrega amigos o unete a equipos.</p></div>}
            </div>
          </div>
        </aside>

        {/* MAIN CHAT */}
        <main className="cht-main">
          {active ? (<>
            <header className="cht-main__head">
              <button type="button" className="cht-icon-btn cht-mobile-menu" onClick={() => setSidebar(true)}><FaBars /></button>
              <img className="cht-av" src={meta.image || meta.fallback} alt="" onError={(ev) => applyImageFallback(ev, meta.fallback)} />
              <div className="cht-main__who">
                <div className="cht-main__name"><h3>{meta.title}</h3><span className={`cht-tag ${active.type === 'team' ? 'cht-tag--team' : 'cht-tag--dm'}`}>{meta.badge}</span></div>
                <p>{meta.subtitle}</p>
              </div>
            </header>

            <div className="cht-thread">
              {loadingMsgs ? (<div className="cht-empty"><FaComments /><p>Cargando mensajes...</p></div>) :
                msgs.length > 0 ? msgs.map((m, i) => {
                  const own = m.senderId === myId;
                  const type = m.msgType || 'text';
                  return (
                    <div key={m.id || `${m.senderId}-${i}`} className={`cht-msg ${own ? 'cht-msg--own' : ''}`}>
                      {!own && <span className="cht-msg__author">{resolveNick(m.senderId, m.senderName)}</span>}
                      {type === 'image' && m.fileUrl && <img className="cht-msg__img" src={m.fileUrl} alt={m.fileName || 'imagen'} />}
                      {type === 'file' && m.fileUrl && (
                        <a className="cht-msg__file" href={m.fileUrl} target="_blank" rel="noopener noreferrer">
                          <FaPaperclip /> {m.fileName || 'Archivo'}
                        </a>
                      )}
                      <p>{m.text}<time>{fmtTime(m.timestamp)}</time></p>
                    </div>
                  );
                }) : (<div className="cht-empty"><FaComments /><p>Sin mensajes aun. Envia el primero.</p></div>)
              }
              <div ref={bottomRef} />
            </div>

            {/* Emoji picker */}
            {showEmoji && (
              <div className="cht-emoji">
                {EMOJI_SETS.map((set, si) => (<div key={si} className="cht-emoji__row">{set.map((e) => (<button key={e} type="button" onClick={() => addEmoji(e)}>{e}</button>))}</div>))}
              </div>
            )}

            {/* Composer */}
            <form className="cht-composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" hidden onChange={handleFile} />
              <div className="cht-composer__left">
                <button type="button" className="cht-icon-btn" onClick={() => setShowEmoji((p) => !p)} title="Emojis"><FaSmile /></button>
                <button type="button" className="cht-icon-btn" onClick={() => fileRef.current?.click()} disabled={uploading} title="Adjuntar archivo"><FaPaperclip /></button>
              </div>
              <textarea ref={textareaRef} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} rows={1} placeholder={active.type === 'team' ? 'Escribe al equipo...' : 'Escribe un mensaje...'} />
              <button type="submit" className="cht-btn-send" disabled={!clean(draft) || uploading}><FaPaperPlane /></button>
            </form>
          </>) : (
            <div className="cht-empty cht-empty--full"><FaComments /><h2>Selecciona un chat</h2><p>Elige una conversacion o abre un directo desde contactos.</p><button type="button" className="cht-btn-primary" onClick={() => setSidebar(true)}><FaComments /> Ver chats</button></div>
          )}
        </main>

        {/* RIGHT PANEL */}
        <aside className="cht-detail">
          <div className="cht-detail__card"><span className="cht-kicker">Info del chat</span><div className="cht-detail__hero"><img className="cht-av cht-av--lg" src={meta.image || meta.fallback} alt="" onError={(ev) => applyImageFallback(ev, meta.fallback)} /><div><h4>{meta.title || 'Mensajeria'}</h4><p>{meta.subtitle || 'Selecciona un chat.'}</p></div></div></div>
          <div className="cht-detail__card">
            <div className="cht-group__head"><span>{active?.type === 'team' ? 'Miembros' : 'Participantes'}</span><small>{members.length}</small></div>
            {members.length > 0 ? (<div className="cht-members">{members.map((mb) => (<div key={mb.userId} className="cht-member"><img className="cht-av cht-av--sm" src={resolveMediaUrl(mb?.avatar) || getAvatarFallback(mb?.fullName || mb?.username)} alt="" onError={(ev) => applyImageFallback(ev, getAvatarFallback(mb?.fullName || mb?.username))} /><div><strong>{mb.username || mb.fullName}</strong><span>{mb.role}</span></div></div>))}</div>) : <div className="cht-empty cht-empty--sm"><FaUsers /><p>Sin participantes.</p></div>}
          </div>
          <div className="cht-detail__card">
            <div className="cht-group__head"><span>Equipos</span><small>{teams.length}</small></div>
            {teams.length > 0 ? (<div className="cht-teams">{teams.map((t) => { const tid = toId(t?._id || t?.id); const linked = convoByTeam.get(tid); return (<button type="button" key={tid} className={`cht-team ${active?.teamId === tid ? 'is-active' : ''}`} onClick={() => linked && pick(linked.id)} disabled={!linked}><img className="cht-av cht-av--sm" src={resolveMediaUrl(t?.logo) || getTeamFallback(t?.name)} alt="" onError={(ev) => applyImageFallback(ev, getTeamFallback(t?.name))} /><div><strong>{t?.name || 'Equipo'}</strong><span>{[t?.teamCode, t?.game].filter(Boolean).join(' · ')}</span></div></button>); })}</div>) : <div className="cht-empty cht-empty--sm"><FaGamepad /><p>Sin equipos aun.</p></div>}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Chats;
