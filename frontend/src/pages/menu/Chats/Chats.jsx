import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  FaArrowLeft,
  FaComments,
  FaGamepad,
  FaPaperPlane,
  FaSearch,
  FaShieldAlt,
  FaUserCircle,
  FaUsers
} from 'react-icons/fa';
import PageHud from '../../../components/PageHud/PageHud';
import { API_URL, CHAT_URL } from '../../../config/api';
import { getAuthToken, getStoredUser } from '../../../utils/authSession';
import {
  applyImageFallback,
  getAvatarFallback,
  getTeamFallback,
  resolveMediaUrl
} from '../../../utils/media';
import './Chats.css';

const clean = (value = '') => String(value || '').trim();
const toId = (value = null) => {
  if (!value) return '';
  if (typeof value === 'string') return clean(value);
  if (typeof value === 'object') return clean(value?._id || value?.id || '');
  return clean(value);
};

const uniqueIds = (items = []) => Array.from(new Set((Array.isArray(items) ? items : []).map((item) => toId(item)).filter(Boolean)));

const authConfig = (token = '') => {
  const normalizedToken = clean(token);
  const headers = normalizedToken && normalizedToken !== 'cookie-session'
    ? { Authorization: `Bearer ${normalizedToken}` }
    : {};

  return {
    headers,
    withCredentials: true
  };
};

const teamHasUser = (team = {}, userId = '') => {
  const normalizedUserId = toId(userId);
  if (!normalizedUserId) return false;

  if (toId(team?.captain) === normalizedUserId) return true;

  const starters = Array.isArray(team?.roster?.starters) ? team.roster.starters : [];
  const subs = Array.isArray(team?.roster?.subs) ? team.roster.subs : [];
  const coach = team?.roster?.coach?.user ? [team.roster.coach] : [];

  return [...starters, ...subs, ...coach].some((slot) => toId(slot?.user) === normalizedUserId);
};

const buildCurrentUserDetail = (user = {}) => ({
  userId: toId(user?._id || user?.id),
  username: clean(user?.username),
  fullName: clean(user?.fullName || user?.username || 'Jugador'),
  avatar: clean(user?.avatar),
  role: clean(Array.isArray(user?.roles) && user.roles[0] ? user.roles[0] : 'Jugador')
});

const buildTeamParticipants = (team = {}, currentUser = {}, contactsIndex = new Map()) => {
  const members = new Map();

  const saveMember = (entry = {}) => {
    const userId = toId(entry?.userId);
    if (!userId) return;

    const previous = members.get(userId) || { userId, username: '', fullName: '', avatar: '', role: '' };
    members.set(userId, {
      userId,
      username: clean(entry?.username || previous.username),
      fullName: clean(entry?.fullName || previous.fullName || entry?.username || 'Jugador'),
      avatar: clean(entry?.avatar || previous.avatar),
      role: clean(entry?.role || previous.role || 'Jugador')
    });
  };

  const mergeFromDirectory = (userId, fallback = {}) => {
    const directoryEntry = contactsIndex.get(userId) || {};
    const isCurrentUser = userId === toId(currentUser?._id || currentUser?.id);
    const currentEntry = isCurrentUser ? buildCurrentUserDetail(currentUser) : {};

    saveMember({
      userId,
      username: fallback.username || directoryEntry.username || currentEntry.username,
      fullName: fallback.fullName || directoryEntry.fullName || currentEntry.fullName,
      avatar: fallback.avatar || directoryEntry.avatar || currentEntry.avatar,
      role: fallback.role || directoryEntry.role || currentEntry.role
    });
  };

  mergeFromDirectory(toId(team?.captain), {
    username: clean(team?.captain?.username),
    fullName: clean(team?.captain?.fullName || team?.captain?.username),
    avatar: clean(team?.captain?.avatar),
    role: 'Capitan'
  });

  (Array.isArray(team?.roster?.starters) ? team.roster.starters : []).forEach((slot) => {
    mergeFromDirectory(toId(slot?.user), {
      username: clean(slot?.user?.username),
      fullName: clean(slot?.nickname || slot?.user?.fullName || slot?.user?.username),
      avatar: clean(slot?.photo || slot?.user?.avatar),
      role: clean(slot?.role || 'Titular')
    });
  });

  (Array.isArray(team?.roster?.subs) ? team.roster.subs : []).forEach((slot) => {
    mergeFromDirectory(toId(slot?.user), {
      username: clean(slot?.user?.username),
      fullName: clean(slot?.nickname || slot?.user?.fullName || slot?.user?.username),
      avatar: clean(slot?.photo || slot?.user?.avatar),
      role: clean(slot?.role || 'Suplente')
    });
  });

  if (team?.roster?.coach?.user) {
    mergeFromDirectory(toId(team.roster.coach.user), {
      username: clean(team?.roster?.coach?.user?.username),
      fullName: clean(team?.roster?.coach?.nickname || team?.roster?.coach?.user?.fullName || team?.roster?.coach?.user?.username),
      avatar: clean(team?.roster?.coach?.photo || team?.roster?.coach?.user?.avatar),
      role: clean(team?.roster?.coach?.role || 'Coach')
    });
  }

  return Array.from(members.values());
};

const buildDirectContacts = ({ teams = [], friends = [], currentUser = {} }) => {
  const currentUserId = toId(currentUser?._id || currentUser?.id);
  const index = new Map();

  const saveContact = (entry = {}) => {
    const userId = toId(entry?.userId || entry?.id);
    if (!userId || userId === currentUserId) return;

    const previous = index.get(userId) || {
      userId,
      username: '',
      fullName: '',
      avatar: '',
      role: '',
      source: '',
      sourceType: '',
      status: ''
    };

    index.set(userId, {
      userId,
      username: clean(entry?.username || previous.username),
      fullName: clean(entry?.fullName || entry?.name || previous.fullName || 'Jugador'),
      avatar: clean(entry?.avatar || previous.avatar),
      role: clean(entry?.role || previous.role || 'Jugador'),
      source: clean(entry?.source || previous.source),
      sourceType: clean(entry?.sourceType || previous.sourceType),
      status: clean(entry?.status || previous.status)
    });
  };

  friends.forEach((friend) => {
    saveContact({
      userId: friend?.id,
      username: friend?.username,
      fullName: friend?.name,
      avatar: friend?.avatar,
      role: friend?.rank || 'Amigo',
      source: 'Amistad',
      sourceType: 'friend',
      status: friend?.status
    });
  });

  const friendIndex = new Map(Array.from(index.values()).map((entry) => [entry.userId, entry]));

  teams.forEach((team) => {
    buildTeamParticipants(team, currentUser, friendIndex).forEach((member) => {
      saveContact({
        ...member,
        source: clean(team?.name || 'Equipo'),
        sourceType: 'team'
      });
    });
  });

  return Array.from(index.values()).sort((left, right) =>
    (left.fullName || left.username).localeCompare(right.fullName || right.username, 'es', { sensitivity: 'base' })
  );
};

const normalizeConversation = (conversation = {}) => ({
  id: toId(conversation?._id || conversation?.id),
  type: clean(conversation?.type || 'individual').toLowerCase() === 'team' ? 'team' : 'individual',
  participants: uniqueIds(conversation?.participants),
  teamId: clean(conversation?.teamId),
  title: clean(conversation?.title),
  image: clean(conversation?.image),
  teamCode: clean(conversation?.teamCode),
  game: clean(conversation?.game),
  createdBy: clean(conversation?.createdBy),
  participantDetails: Array.isArray(conversation?.participantDetails) ? conversation.participantDetails.map((entry) => ({
    userId: toId(entry?.userId),
    username: clean(entry?.username),
    fullName: clean(entry?.fullName),
    avatar: clean(entry?.avatar),
    role: clean(entry?.role)
  })) : [],
  lastMessage: clean(conversation?.lastMessage),
  lastSenderId: clean(conversation?.lastSenderId),
  lastSenderName: clean(conversation?.lastSenderName),
  createdAt: conversation?.createdAt || null,
  updatedAt: conversation?.updatedAt || conversation?.createdAt || null
});

const normalizeMessage = (message = {}) => ({
  id: toId(message?._id || message?.id),
  conversationId: toId(message?.conversationId),
  senderId: clean(message?.senderId),
  senderName: clean(message?.senderName || 'Jugador'),
  text: clean(message?.text || message?.content),
  timestamp: message?.timestamp || message?.createdAt || new Date().toISOString()
});

const formatTime = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
};

const formatDay = (value) => {
  if (!value) return 'Ahora';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Ahora';
  return parsed.toLocaleDateString('es', { day: 'numeric', month: 'short' });
};

const sortConversations = (items = []) => [...items].sort((left, right) => {
  const leftTime = new Date(left?.updatedAt || left?.createdAt || 0).getTime();
  const rightTime = new Date(right?.updatedAt || right?.createdAt || 0).getTime();
  return rightTime - leftTime;
});

const buildTeamSyncPayload = (team = {}, currentUser = {}, contacts = []) => {
  const directory = new Map((Array.isArray(contacts) ? contacts : []).map((entry) => [toId(entry?.userId), entry]));
  const participantDetails = buildTeamParticipants(team, currentUser, directory);

  return {
    teamId: toId(team?._id || team?.id),
    title: clean(team?.name || 'Equipo'),
    image: clean(team?.logo),
    teamCode: clean(team?.teamCode),
    game: clean(team?.game),
    createdBy: toId(team?.captain),
    participants: participantDetails.map((entry) => entry.userId),
    participantDetails
  };
};

const buildConversationMeta = (conversation = {}, currentUserId = '') => {
  if (conversation?.type === 'team') {
    const membersCount = Array.isArray(conversation?.participantDetails) && conversation.participantDetails.length > 0
      ? conversation.participantDetails.length
      : conversation?.participants?.length || 0;

    return {
      title: clean(conversation?.title || 'Equipo'),
      subtitle: [clean(conversation?.teamCode), clean(conversation?.game), membersCount ? `${membersCount} integrantes` : 'Chat de equipo']
        .filter(Boolean)
        .join(' · '),
      image: resolveMediaUrl(conversation?.image),
      fallback: getTeamFallback(conversation?.title || 'Equipo'),
      badge: 'Equipo',
      icon: FaShieldAlt
    };
  }

  const participant = (Array.isArray(conversation?.participantDetails) ? conversation.participantDetails : [])
    .find((entry) => toId(entry?.userId) !== currentUserId)
    || (Array.isArray(conversation?.participantDetails) ? conversation.participantDetails[0] : {})
    || {};

  return {
    title: clean(participant?.fullName || participant?.username || conversation?.title || 'Chat directo'),
    subtitle: clean(participant?.role || conversation?.lastSenderName || 'Mensaje directo'),
    image: resolveMediaUrl(participant?.avatar || conversation?.image),
    fallback: getAvatarFallback(participant?.fullName || participant?.username || 'Jugador'),
    badge: 'Directo',
    icon: FaUserCircle
  };
};

const Chats = () => {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [teamChats, setTeamChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [draft, setDraft] = useState('');
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [creatingDmFor, setCreatingDmFor] = useState('');
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [unreadMap, setUnreadMap] = useState({});

  const socketRef = useRef(null);
  const activeConversationIdRef = useRef('');
  const bottomRef = useRef(null);

  const currentUserId = useMemo(() => toId(currentUser?._id || currentUser?.id), [currentUser]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    let cancelled = false;

    const loadWorkspace = async () => {
      setLoadingWorkspace(true);
      setWorkspaceError('');

      const token = getAuthToken();
      const storedUser = getStoredUser();

      try {
        const [profileResult, friendsResult, teamsResult] = await Promise.allSettled([
          axios.get(`${API_URL}/api/auth/profile`, authConfig(token)),
          axios.get(`${API_URL}/api/auth/friends`, authConfig(token)),
          axios.get(`${API_URL}/api/team`)
        ]);

        const nextUser = profileResult.status === 'fulfilled'
          ? profileResult.value?.data
          : storedUser;

        if (!nextUser) {
          throw new Error('Debes iniciar sesion para usar mensajeria.');
        }

        const userId = toId(nextUser?._id || nextUser?.id);
        if (!userId) {
          throw new Error('No pudimos identificar tu sesion actual.');
        }

        const profileTeams = Array.isArray(nextUser?.teams) ? nextUser.teams : [];
        const publicTeams = teamsResult.status === 'fulfilled' && Array.isArray(teamsResult.value?.data)
          ? teamsResult.value.data
          : [];
        const teamMap = new Map();

        profileTeams.forEach((team) => {
          const teamId = toId(team?._id || team?.id);
          if (teamId) teamMap.set(teamId, team);
        });

        publicTeams.forEach((team) => {
          const teamId = toId(team?._id || team?.id);
          if (!teamId) return;
          if (teamHasUser(team, userId) || teamMap.has(teamId)) {
            const previous = teamMap.get(teamId) || {};
            teamMap.set(teamId, {
              ...previous,
              ...team,
              roster: team?.roster || previous?.roster,
              captain: team?.captain || previous?.captain
            });
          }
        });

        const myTeams = Array.from(teamMap.values()).filter((team) => teamHasUser(team, userId));
        const friends = friendsResult.status === 'fulfilled' && Array.isArray(friendsResult.value?.data?.friends)
          ? friendsResult.value.data.friends
          : [];
        const nextContacts = buildDirectContacts({
          teams: myTeams,
          friends,
          currentUser: nextUser
        });

        if (cancelled) return;

        setCurrentUser(nextUser);
        setTeamChats(myTeams);
        setContacts(nextContacts);

        await Promise.allSettled(
          myTeams
            .map((team) => buildTeamSyncPayload(team, nextUser, nextContacts))
            .filter((payload) => payload.teamId && payload.participants.length > 0)
            .map((payload) => axios.post(`${CHAT_URL}/conversations/ensure-team`, payload))
        );

        const conversationsResponse = await axios.get(`${CHAT_URL}/conversations`, {
          params: { userId }
        });

        if (cancelled) return;

        const nextConversations = sortConversations(
          (Array.isArray(conversationsResponse?.data) ? conversationsResponse.data : []).map(normalizeConversation)
        );

        setConversations(nextConversations);
        setActiveConversationId((previous) => {
          if (previous && nextConversations.some((conversation) => conversation.id === previous)) {
            return previous;
          }
          return nextConversations[0]?.id || '';
        });
      } catch (error) {
        if (cancelled) return;
        setWorkspaceError(error?.response?.data?.message || error?.message || 'No se pudo cargar la mensajeria.');
      } finally {
        if (!cancelled) {
          setLoadingWorkspace(false);
        }
      }
    };

    loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) return undefined;

    const socket = io(CHAT_URL, {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('receive_message', (payload) => {
      const message = normalizeMessage(payload);
      if (!message.conversationId || !message.text) return;

      setConversations((previous) => sortConversations(previous.map((conversation) => (
        conversation.id === message.conversationId
          ? {
            ...conversation,
            lastMessage: message.text,
            lastSenderId: message.senderId,
            lastSenderName: message.senderName,
            updatedAt: message.timestamp
          }
          : conversation
      ))));

      if (activeConversationIdRef.current === message.conversationId) {
        setMessages((previous) => (
          previous.some((entry) => entry.id && entry.id === message.id)
            ? previous
            : [...previous, message]
        ));
        setUnreadMap((previous) => ({ ...previous, [message.conversationId]: 0 }));
      } else {
        setUnreadMap((previous) => ({
          ...previous,
          [message.conversationId]: Number(previous?.[message.conversationId] || 0) + 1
        }));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!socketRef.current) return;
    conversations.forEach((conversation) => {
      if (conversation?.id) {
        socketRef.current.emit('join_chat', conversation.id);
      }
    });
  }, [conversations]);

  useEffect(() => {
    if (!activeConversationId) {
      setLoadingMessages(false);
      setMessages([]);
      return undefined;
    }

    let cancelled = false;

    const loadMessages = async () => {
      setLoadingMessages(true);
      setUnreadMap((previous) => ({ ...previous, [activeConversationId]: 0 }));

      try {
        const response = await axios.get(`${CHAT_URL}/messages/${activeConversationId}`);
        if (cancelled) return;
        setMessages((Array.isArray(response?.data) ? response.data : []).map(normalizeMessage));
      } catch (error) {
        if (cancelled) return;
        setWorkspaceError(error?.response?.data?.error || 'No se pudo cargar esta conversacion.');
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    };

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [activeConversationId]);

  useEffect(() => {
    if (!bottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, activeConversationId]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [activeConversationId, conversations]
  );

  const activeMeta = useMemo(
    () => buildConversationMeta(activeConversation || {}, currentUserId),
    [activeConversation, currentUserId]
  );

  const conversationByTeamId = useMemo(() => {
    const nextMap = new Map();
    conversations.forEach((conversation) => {
      if (conversation?.type === 'team' && conversation?.teamId) {
        nextMap.set(conversation.teamId, conversation);
      }
    });
    return nextMap;
  }, [conversations]);

  const searchNeedle = useMemo(() => clean(searchTerm).toLowerCase(), [searchTerm]);

  const visibleConversations = useMemo(() => {
    const items = sortConversations(conversations);
    if (!searchNeedle) return items;

    return items.filter((conversation) => {
      const meta = buildConversationMeta(conversation, currentUserId);
      const bucket = [
        meta.title,
        meta.subtitle,
        conversation?.lastMessage,
        conversation?.game,
        conversation?.teamCode
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return bucket.includes(searchNeedle);
    });
  }, [conversations, currentUserId, searchNeedle]);

  const visibleContacts = useMemo(() => {
    if (!searchNeedle) return contacts;

    return contacts.filter((contact) => {
      const bucket = [
        contact?.fullName,
        contact?.username,
        contact?.role,
        contact?.source
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return bucket.includes(searchNeedle);
    });
  }, [contacts, searchNeedle]);

  const activeMembers = useMemo(
    () => (Array.isArray(activeConversation?.participantDetails) ? activeConversation.participantDetails : []),
    [activeConversation]
  );

  const stats = useMemo(() => ({
    teams: teamChats.length,
    conversations: conversations.length,
    contacts: contacts.length
  }), [contacts.length, conversations.length, teamChats.length]);

  const selectConversation = (conversationId = '') => {
    const normalizedConversationId = clean(conversationId);
    if (!normalizedConversationId) return;
    setWorkspaceError('');
    setActiveConversationId(normalizedConversationId);
    setUnreadMap((previous) => ({ ...previous, [normalizedConversationId]: 0 }));
    setMobileListOpen(false);
  };

  const handleCreateDirectChat = async (contact = {}) => {
    const targetUserId = toId(contact?.userId);
    if (!targetUserId || !currentUserId) return;

    const existingConversation = conversations.find((conversation) =>
      conversation?.type === 'individual'
      && conversation?.participants?.length === 2
      && conversation.participants.includes(currentUserId)
      && conversation.participants.includes(targetUserId)
    );

    if (existingConversation) {
      selectConversation(existingConversation.id);
      return;
    }

    setCreatingDmFor(targetUserId);
    setWorkspaceError('');

    try {
      const response = await axios.post(`${CHAT_URL}/conversations`, {
        type: 'individual',
        participants: [currentUserId, targetUserId],
        participantDetails: [
          buildCurrentUserDetail(currentUser),
          {
            userId: targetUserId,
            username: clean(contact?.username),
            fullName: clean(contact?.fullName || contact?.username || 'Jugador'),
            avatar: clean(contact?.avatar),
            role: clean(contact?.role || 'Jugador')
          }
        ]
      });

      const conversation = normalizeConversation(response?.data);
      if (!conversation?.id) {
        throw new Error('No se pudo abrir el chat directo.');
      }

      setConversations((previous) => sortConversations([
        conversation,
        ...previous.filter((entry) => entry.id !== conversation.id)
      ]));

      if (socketRef.current) {
        socketRef.current.emit('join_chat', conversation.id);
      }

      selectConversation(conversation.id);
    } catch (error) {
      setWorkspaceError(error?.response?.data?.error || error?.response?.data?.message || 'No se pudo iniciar el chat directo.');
    } finally {
      setCreatingDmFor('');
    }
  };

  const handleSendMessage = () => {
    const text = clean(draft);
    if (!text || !activeConversationIdRef.current || !currentUserId) return;
    if (!socketRef.current) {
      setWorkspaceError('La conexion en tiempo real aun no esta lista. Intenta de nuevo.');
      return;
    }

    socketRef.current.emit('send_message', {
      conversationId: activeConversationIdRef.current,
      senderId: currentUserId,
      senderName: clean(currentUser?.fullName || currentUser?.username || 'Jugador'),
      content: text
    });

    setDraft('');
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  if (loadingWorkspace) {
    return (
      <div className="chats-page chats-page--loading">
        <PageHud page="MENSAJERIA" />
        <div className="chats-loading-card">
          <FaComments className="chats-loading-card__icon" />
          <h2>Preparando mensajeria...</h2>
          <p>Estamos conectando tus equipos, conversaciones y accesos en tiempo real.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chats-page">
      <PageHud page="MENSAJERIA" />
      <section className="chats-hero">
        <div className="chats-hero__copy">
          <span className="chats-hero__eyebrow">Tiempo real para equipos y torneos</span>
          <h1>Centro de Mensajeria</h1>
          <p>
            Los chats de equipo se sincronizan con nombre, logo e integrantes para que jugadores,
            capitanes y organizadores tengan una base real de comunicacion.
          </p>
        </div>

        <div className="chats-hero__stats">
          <div className="chats-stat-card">
            <span className="chats-stat-card__label">Chats</span>
            <strong>{stats.conversations}</strong>
          </div>
          <div className="chats-stat-card">
            <span className="chats-stat-card__label">Equipos</span>
            <strong>{stats.teams}</strong>
          </div>
          <div className="chats-stat-card">
            <span className="chats-stat-card__label">Contactos</span>
            <strong>{stats.contacts}</strong>
          </div>
        </div>
      </section>

      {workspaceError && (
        <div className="chats-error-banner">
          <FaShieldAlt />
          <span>{workspaceError}</span>
        </div>
      )}

      {mobileListOpen && (
        <button
          type="button"
          className="chats-backdrop"
          onClick={() => setMobileListOpen(false)}
          aria-label="Cerrar panel de conversaciones"
        />
      )}

      <section className="chats-shell">
        <aside className={`chats-sidebar ${mobileListOpen ? 'is-open' : ''}`}>
          <div className="chats-sidebar__top">
            <div>
              <span className="chats-section-kicker">Bandeja</span>
              <h2>Conversaciones</h2>
            </div>
            <button
              type="button"
              className="chats-sidebar__close"
              onClick={() => setMobileListOpen(false)}
              aria-label="Cerrar conversaciones"
            >
              <FaArrowLeft />
            </button>
          </div>

          <label className="chats-search">
            <FaSearch />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Busca por equipo, mensaje o jugador"
            />
          </label>

          <div className="chats-section">
            <div className="chats-section__head">
              <span>Chats activos</span>
              <strong>{visibleConversations.length}</strong>
            </div>

            <div className="chats-conversation-list">
              {visibleConversations.length > 0 ? visibleConversations.map((conversation) => {
                const meta = buildConversationMeta(conversation, currentUserId);
                const unread = Number(unreadMap?.[conversation.id] || 0);
                return (
                  <button
                    type="button"
                    key={conversation.id}
                    className={`chats-conversation-row ${activeConversationId === conversation.id ? 'is-active' : ''}`}
                    onClick={() => selectConversation(conversation.id)}
                  >
                    <div className="chats-avatar chats-avatar--conversation">
                      <img
                        src={meta.image || meta.fallback}
                        alt={meta.title}
                        onError={(event) => applyImageFallback(event, meta.fallback)}
                      />
                    </div>

                    <div className="chats-conversation-row__body">
                      <div className="chats-conversation-row__top">
                        <strong>{meta.title}</strong>
                        <span>{formatDay(conversation?.updatedAt)}</span>
                      </div>
                      <div className="chats-conversation-row__meta">
                        <span>{conversation?.lastMessage || meta.subtitle || 'Chat listo para usar'}</span>
                        {unread > 0 && <em className="chats-unread-pill">{unread}</em>}
                      </div>
                    </div>
                  </button>
                );
              }) : (
                <div className="chats-empty-block chats-empty-block--compact">
                  <FaComments />
                  <p>No encontramos conversaciones para ese filtro.</p>
                </div>
              )}
            </div>
          </div>

          <div className="chats-section">
            <div className="chats-section__head">
              <span>Iniciar directo</span>
              <strong>{visibleContacts.length}</strong>
            </div>

            <div className="chats-contact-list">
              {visibleContacts.length > 0 ? visibleContacts.map((contact) => (
                <div key={contact.userId} className="chats-contact-row">
                  <div className="chats-contact-row__main">
                    <div className="chats-avatar chats-avatar--contact">
                      <img
                        src={resolveMediaUrl(contact?.avatar) || getAvatarFallback(contact?.fullName || contact?.username)}
                        alt={contact?.fullName || 'Jugador'}
                        onError={(event) => applyImageFallback(event, getAvatarFallback(contact?.fullName || contact?.username))}
                      />
                    </div>

                    <div className="chats-contact-row__copy">
                      <strong>{contact?.fullName || contact?.username || 'Jugador'}</strong>
                      <span>{contact?.source ? `${contact.source} | ${contact.role}` : contact?.role}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="chats-secondary-btn"
                    onClick={() => handleCreateDirectChat(contact)}
                    disabled={creatingDmFor === contact.userId}
                  >
                    {creatingDmFor === contact.userId ? 'Abriendo...' : 'Abrir'}
                  </button>
                </div>
              )) : (
                <div className="chats-empty-block chats-empty-block--compact">
                  <FaUsers />
                  <p>Agrega amigos o miembros de equipo para abrir directos.</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="chats-main">
          {activeConversation ? (
            <>
              <header className="chats-main__header">
                <button
                  type="button"
                  className="chats-mobile-toggle"
                  onClick={() => setMobileListOpen(true)}
                  aria-label="Ver conversaciones"
                >
                  <FaComments />
                </button>

                <div className="chats-main__identity">
                  <div className="chats-avatar chats-avatar--hero">
                    <img
                      src={activeMeta.image || activeMeta.fallback}
                      alt={activeMeta.title}
                      onError={(event) => applyImageFallback(event, activeMeta.fallback)}
                    />
                  </div>

                  <div>
                    <div className="chats-main__title-row">
                      <h2>{activeMeta.title}</h2>
                      <span className={`chats-badge ${activeConversation?.type === 'team' ? 'is-team' : 'is-direct'}`}>
                        {activeMeta.badge}
                      </span>
                    </div>
                    <p>{activeMeta.subtitle || 'Conversacion activa'}</p>
                  </div>
                </div>
              </header>

              <div className="chats-thread">
                {loadingMessages ? (
                  <div className="chats-empty-block">
                    <FaComments />
                    <p>Cargando historial...</p>
                  </div>
                ) : messages.length > 0 ? messages.map((message, index) => {
                  const ownMessage = message.senderId === currentUserId;
                  return (
                    <article
                      key={message.id || `${message.senderId}-${message.timestamp}-${index}`}
                      className={`chats-bubble ${ownMessage ? 'is-own' : ''}`}
                    >
                      <span className="chats-bubble__author">{ownMessage ? 'Tu' : message.senderName}</span>
                      <p>{message.text}</p>
                      <time>{formatTime(message.timestamp)}</time>
                    </article>
                  );
                }) : (
                  <div className="chats-empty-block">
                    <FaComments />
                    <p>No hay mensajes todavia. Rompe el hielo.</p>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="chats-composer">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  rows={1}
                  placeholder={activeConversation?.type === 'team' ? 'Escribe al equipo...' : 'Escribe un mensaje directo...'}
                />
                <button
                  type="button"
                  className="chats-primary-btn"
                  onClick={handleSendMessage}
                  disabled={!clean(draft)}
                >
                  <FaPaperPlane />
                  Enviar
                </button>
              </div>
            </>
          ) : (
            <div className="chats-empty-block chats-empty-block--main">
              <FaComments />
              <h2>Aun no tienes una conversacion abierta</h2>
              <p>Selecciona un chat del panel izquierdo o crea un directo desde tus equipos y amistades.</p>
              <button
                type="button"
                className="chats-primary-btn"
                onClick={() => setMobileListOpen(true)}
              >
                <FaComments />
                Ver bandeja
              </button>
            </div>
          )}
        </main>

        <aside className="chats-info">
          <div className="chats-info__card chats-info__card--hero">
            <span className="chats-section-kicker">Detalle activo</span>
            <div className="chats-info__headline">
              <div className="chats-avatar chats-avatar--info">
                <img
                  src={activeMeta.image || activeMeta.fallback}
                  alt={activeMeta.title}
                  onError={(event) => applyImageFallback(event, activeMeta.fallback)}
                />
              </div>
              <div>
                <h3>{activeMeta.title || 'Mensajeria lista'}</h3>
                <p>{activeMeta.subtitle || 'Selecciona una conversacion para ver su contexto.'}</p>
              </div>
            </div>
          </div>

          <div className="chats-info__card">
            <div className="chats-section__head">
              <span>{activeConversation?.type === 'team' ? 'Integrantes' : 'Participantes'}</span>
              <strong>{activeMembers.length}</strong>
            </div>

            {activeMembers.length > 0 ? (
              <div className="chats-member-list">
                {activeMembers.map((member) => (
                  <div key={member.userId} className="chats-member-row">
                    <div className="chats-avatar chats-avatar--member">
                      <img
                        src={resolveMediaUrl(member?.avatar) || getAvatarFallback(member?.fullName || member?.username)}
                        alt={member?.fullName || member?.username || 'Jugador'}
                        onError={(event) => applyImageFallback(event, getAvatarFallback(member?.fullName || member?.username))}
                      />
                    </div>
                    <div className="chats-member-row__copy">
                      <strong>{member?.fullName || member?.username || 'Jugador'}</strong>
                      <span>{member?.role || 'Jugador'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="chats-empty-block chats-empty-block--compact">
                <FaUsers />
                <p>Este espacio mostrara a los miembros cuando exista una conversacion activa.</p>
              </div>
            )}
          </div>

          <div className="chats-info__card">
            <div className="chats-section__head">
              <span>Tus equipos</span>
              <strong>{teamChats.length}</strong>
            </div>

            {teamChats.length > 0 ? (
              <div className="chats-team-list">
                {teamChats.map((team) => {
                  const teamId = toId(team?._id || team?.id);
                  const linkedConversation = conversationByTeamId.get(teamId);
                  return (
                    <button
                      type="button"
                      key={teamId}
                      className={`chats-team-row ${activeConversation?.teamId === teamId ? 'is-active' : ''}`}
                      onClick={() => linkedConversation && selectConversation(linkedConversation.id)}
                      disabled={!linkedConversation}
                    >
                      <div className="chats-avatar chats-avatar--team">
                        <img
                          src={resolveMediaUrl(team?.logo) || getTeamFallback(team?.name)}
                          alt={team?.name || 'Equipo'}
                          onError={(event) => applyImageFallback(event, getTeamFallback(team?.name))}
                        />
                      </div>
                      <div className="chats-team-row__copy">
                        <strong>{team?.name || 'Equipo'}</strong>
                        <span>{[clean(team?.teamCode), clean(team?.game)].filter(Boolean).join(' | ')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="chats-empty-block chats-empty-block--compact">
                <FaGamepad />
                <p>Cuando formes parte de un equipo, su chat aparecera aqui automaticamente.</p>
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
};

export default Chats;
