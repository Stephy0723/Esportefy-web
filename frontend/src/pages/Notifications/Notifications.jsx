import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config/api';
import { useNotification } from '../../context/NotificationContext';
import './Notifications.css';

const FILTERS = [
  { key: 'all', label: 'Todas', icon: 'bx-bell' },
  { key: 'system', label: 'Sistema', icon: 'bx-cog', dot: '#8EDB15' },
  { key: 'team', label: 'Equipos', icon: 'bx-group', dot: '#4facfe' },
  { key: 'tournament', label: 'Torneos', icon: 'bx-trophy', dot: '#FFD700' },
  { key: 'social', label: 'Social', icon: 'bx-user-plus', dot: '#f093fb' },
];

const RIOT_GAMES = new Set([
  'League of Legends',
  'Valorant',
  'Wild Rift',
  'Teamfight Tactics',
  'Legends of Runeterra'
]);

const MLBB_GAMES = new Set([
  'Mobile Legends',
  'Mobile Legends: Bang Bang',
  'MLBB'
]);

const ROLE_TEMPLATES_BY_GAME = {
  'Mobile Legends': ['EXP', 'Gold', 'Mid', 'Jungla', 'Roam'],
  'Mobile Legends: Bang Bang': ['EXP', 'Gold', 'Mid', 'Jungla', 'Roam'],
  'MLBB': ['EXP', 'Gold', 'Mid', 'Jungla', 'Roam'],
  'League of Legends': ['Top', 'Jungle', 'Mid', 'ADC', 'Supp'],
  'Wild Rift': ['Baron', 'Jungle', 'Mid', 'Dragon', 'Supp'],
  'Valorant': ['Duelist', 'Sentinel', 'Controller', 'Initiator', 'Flex'],
  'CS2': ['Entry', 'AWPer', 'Lurker', 'Support', 'IGL'],
  'Overwatch 2': ['Tank', 'DPS', 'DPS', 'Support', 'Support'],
  'Rainbow Six Siege': ['Entry', 'Support', 'Flex', 'Hard Breach', 'Anchor'],
  'Free Fire': ['Rusher', 'Support', 'Sniper', 'IGL'],
  'Fortnite': ['Fragger', 'IGL', 'Support', 'Builder'],
  'PUBG': ['Fragger', 'IGL', 'Support', 'Scout'],
  'Apex Legends': ['Fragger', 'IGL', 'Support'],
  'Call of Duty': ['Slayer', 'OBJ', 'Support', 'Flex'],
  'Dota 2': ['Carry', 'Mid', 'Offlane', 'Soft Supp', 'Hard Supp'],
  'Rocket League': ['Striker', 'Midfielder', 'Defender']
};

const Notifications = () => {
  const { notifications, addToast, loadNotifications } = useNotification();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [acceptingById, setAcceptingById] = useState({});
  const rateLimitedUntilRef = useRef(0);
  const lastRateLimitToastAtRef = useRef(0);

  const getAuthToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  const fetchNotifications = useCallback(async (withLoading = false, silent = false) => {
    if (withLoading) setLoading(true);
    const now = Date.now();
    if (now < rateLimitedUntilRef.current) {
      if (withLoading) setLoading(false);
      return;
    }
    try {
      const token = getAuthToken();
      if (!token) {
        loadNotifications([]);
        if (!silent) {
          addToast('Tu sesión expiró. Inicia sesión nuevamente.', 'error');
          navigate('/login');
        }
        return;
      }
      const res = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadNotifications(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      const status = Number(error?.response?.status || 0);
      if (status === 429) {
        const retryAfterHeader = Number(error?.response?.headers?.['retry-after']);
        const retryMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
          ? retryAfterHeader * 1000
          : 15000;
        rateLimitedUntilRef.current = Date.now() + retryMs;

        if (!silent) {
          const elapsed = Date.now() - lastRateLimitToastAtRef.current;
          if (elapsed > 8000) {
            addToast('Demasiadas solicitudes. Espera unos segundos.', 'error');
            lastRateLimitToastAtRef.current = Date.now();
          }
        }
        return;
      }
      if ((status === 401 || status === 403) && !silent) {
        addToast(error?.response?.data?.message || 'Tu sesión expiró. Inicia sesión nuevamente.', 'error');
        navigate('/login');
      } else if (!silent) {
        addToast(error?.response?.data?.message || 'No se pudieron cargar las notificaciones.', 'error');
      }
    } finally {
      if (withLoading) setLoading(false);
    }
  }, [addToast, loadNotifications, navigate]);

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return undefined;

    const refreshSilently = () => {
      if (document.visibilityState !== 'visible') return;
      fetchNotifications(false, true);
    };

    const intervalId = window.setInterval(refreshSilently, 12000);
    window.addEventListener('focus', refreshSilently);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshSilently);
    };
  }, [fetchNotifications]);

  const visibleNotes = useMemo(() => {
    return notifications.filter((n) => {
      if (n.isArchived && filter !== 'archived') return false;
      if (filter === 'archived') return n.isArchived;
      if (filter === 'all') return true;
      return n.category === filter || n.type === filter;
    });
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => n.status === 'unread' && !n.isArchived).length;

  const handleRemove = async (id) => {
    try {
      const token = getAuthToken();
      if (token) {
        await axios.delete(`${API_URL}/api/notifications/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      void error;
    }
    await fetchNotifications();
    addToast('Notificación eliminada', 'success');
  };

  const handleArchive = async (id) => {
    const note = notifications.find(n => n.id === id || n._id === id);
    const newArchived = !note?.isArchived;
    try {
      const token = getAuthToken();
      if (token) {
        await axios.patch(`${API_URL}/api/notifications/${id}/archive`, { archived: newArchived }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      void error;
    }
    await fetchNotifications();
    addToast(newArchived ? 'Notificación archivada' : 'Notificación restaurada', 'info');
  };

  const handleMarkRead = async (id) => {
    try {
      const token = getAuthToken();
      if (token) {
        await axios.patch(`${API_URL}/api/notifications/${id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      void error;
    }
    await fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        await axios.patch(`${API_URL}/api/notifications/read-all`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await fetchNotifications();
      addToast('Todas marcadas como leídas', 'success');
    } catch (error) {
      void error;
      addToast('Error al marcar', 'error');
    }
  };

  const handleClearAll = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        await axios.delete(`${API_URL}/api/notifications/clear-all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await fetchNotifications();
      addToast('Historial limpiado', 'success');
    } catch (error) {
      void error;
      addToast('Error al limpiar', 'error');
    }
  };

  const handleSendTest = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await axios.post(`${API_URL}/api/notifications/test-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchNotifications();
      addToast(`${res.data.count} notificaciones enviadas`, 'success');
    } catch (error) {
      void error;
      addToast('Error al enviar test', 'error');
    }
  };

  const readStoredUser = () => {
    const raw = localStorage.getItem('esportefyUser') || sessionStorage.getItem('esportefyUser');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  };

  const loadCurrentProfileForJoin = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response?.data || null;
    } catch (_) {
      return readStoredUser();
    }
  };

  const buildAutoJoinPlayer = (note, profile, resolvedGame = '') => {
    const game = String(resolvedGame || note?.meta?.game || '').trim();
    const invitedRole = String(note?.meta?.slotRole || '').trim();
    const fallbackName = String(
      profile?.fullName
      || profile?.username
      || profile?.name
      || 'Jugador'
    ).trim();

    if (RIOT_GAMES.has(game)) {
      return {
        nickname: String(profile?.connections?.riot?.gameName || '').trim() || fallbackName,
        gameId: String(profile?.connections?.riot?.tagLine || '').trim(),
        region: String(
          profile?.gameProfiles?.valorant?.shard
          || profile?.gameProfiles?.lol?.platformRegion
          || profile?.connections?.riot?.accountRegion
          || ''
        ).trim(),
        role: invitedRole,
        email: String(profile?.email || '').trim()
      };
    }

    if (MLBB_GAMES.has(game)) {
      return {
        nickname: String(profile?.gameProfiles?.mlbb?.ign || profile?.connections?.mlbb?.ign || '').trim() || fallbackName,
        gameId: String(profile?.connections?.mlbb?.playerId || '').trim(),
        region: String(profile?.connections?.mlbb?.zoneId || '').trim(),
        role: invitedRole,
        email: String(profile?.email || '').trim()
      };
    }

    return {
      nickname: fallbackName,
      gameId: '',
      region: '',
      role: invitedRole,
      email: String(profile?.email || '').trim()
    };
  };

  const fetchInviteTeamByCode = async (inviteCode) => {
    if (!inviteCode) return null;
    try {
      const response = await axios.get(`${API_URL}/api/teams/invite/${inviteCode}`);
      return response?.data || null;
    } catch (_) {
      return null;
    }
  };

  const resolveInviteSlotRole = (inviteTeam, slotType, slotIndex, fallbackRole = '', resolvedGame = '') => {
    const fallback = String(fallbackRole || '').trim();
    if (fallback) return fallback;
    const team = inviteTeam || {};
    const normalizedType = String(slotType || '').trim();
    const idx = Number(slotIndex);

    if (normalizedType === 'coach') {
      return String(team?.roster?.coach?.role || 'Coach').trim();
    }

    if (!['starters', 'subs'].includes(normalizedType)) return '';
    if (!Number.isFinite(idx) || idx < 0) return '';
    const rosterRole = String(team?.roster?.[normalizedType]?.[idx]?.role || '').trim();
    if (rosterRole) return rosterRole;
    const game = String(resolvedGame || team?.game || '').trim();
    const templates = ROLE_TEMPLATES_BY_GAME[game] || [];
    if (templates[idx]) return templates[idx];
    return normalizedType === 'subs' ? `Suplente ${idx + 1}` : `Titular ${idx + 1}`;
  };

  const formatInviteSlotLabel = (slotType, slotIndex) => {
    const normalizedType = String(slotType || '').trim();
    const idx = Number(slotIndex);
    if (normalizedType === 'coach') return 'Coach';
    if (normalizedType === 'subs') {
      return Number.isFinite(idx) && idx >= 0 ? `Suplente #${idx + 1}` : 'Suplente';
    }
    if (normalizedType === 'starters') {
      return Number.isFinite(idx) && idx >= 0 ? `Titular #${idx + 1}` : 'Titular';
    }
    return 'Slot';
  };

  const handleAcceptTeamInvite = async (note) => {
    const noteId = note?.id || note?._id;
    if (!noteId || acceptingById[noteId]) return;

    const teamId = String(note?.meta?.teamId || '').trim();
    const inviteCode = String(note?.meta?.inviteCode || '').trim().toUpperCase();
    const slotType = String(note?.meta?.slotType || 'starters').trim();
    const slotIndex = Number(note?.meta?.slotIndex);

    if (!teamId || !inviteCode) {
      addToast('La invitación no tiene datos válidos. Ábrela manualmente.', 'error');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      addToast('Debes iniciar sesión para aceptar invitaciones.', 'error');
      return;
    }

    setAcceptingById((prev) => ({ ...prev, [noteId]: true }));
    try {
      const profile = await loadCurrentProfileForJoin(token);
      const inviteTeam = await fetchInviteTeamByCode(inviteCode);
      const resolvedGame = String(note?.meta?.game || inviteTeam?.game || '').trim();
      const player = buildAutoJoinPlayer(note, profile, resolvedGame);
      const resolvedRole = resolveInviteSlotRole(
        inviteTeam,
        slotType,
        Number.isFinite(slotIndex) ? slotIndex : 0,
        player?.role,
        resolvedGame
      );

      if (RIOT_GAMES.has(resolvedGame) && (!player?.nickname || !player?.gameId)) {
        addToast('Te falta sincronizar Riot ID para aceptar esta invitación.', 'error');
        navigate('/settings');
        return;
      }
      if (MLBB_GAMES.has(resolvedGame) && (!player?.gameId || !player?.region)) {
        addToast('Te falta verificar MLBB para aceptar esta invitación.', 'error');
        navigate('/settings');
        return;
      }

      const finalPlayer = {
        ...player,
        role: resolvedRole || String(player?.role || '').trim()
      };

      await axios.post(
        `${API_URL}/api/teams/join`,
        {
          teamId,
          inviteCode,
          slotType,
          slotIndex: Number.isFinite(slotIndex) ? slotIndex : 0,
          player: finalPlayer
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await handleMarkRead(noteId);
      addToast('Te uniste al equipo correctamente.', 'success');
      navigate('/teams', { state: { teamId, openPreview: true } });
    } catch (error) {
      const message = error?.response?.data?.message || 'No se pudo completar el ingreso directo al equipo.';
      addToast(message, 'error');
      navigate('/teams', {
        state: {
          teamId,
          openPreview: true
        }
      });
    } finally {
      setAcceptingById((prev) => ({ ...prev, [noteId]: false }));
    }
  };

  const filterLabel = FILTERS.find(f => f.key === filter)?.label || 'Todas';
  const archivedCount = notifications.filter(n => n.isArchived).length;

  return (
    <div className="nt__layout">
      {/* ── SIDEBAR ── */}
      <aside className="nt__sidebar">
        <div className="nt__sidebar-head">
          <h3 className="nt__sidebar-title">
            <i className='bx bx-bell'></i> Notificaciones
          </h3>
          {unreadCount > 0 && <span className="nt__unread-badge">{unreadCount}</span>}
        </div>

        <nav className="nt__filters">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`nt__filter-btn ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.dot ? (
                <span className="nt__filter-dot" style={{ background: f.dot }} />
              ) : (
                <i className={`bx ${f.icon}`} />
              )}
              <span>{f.label}</span>
              {f.key !== 'all' && (
                <span className="nt__filter-count">
                  {notifications.filter(n => !n.isArchived && (n.category === f.key || n.type === f.key)).length}
                </span>
              )}
            </button>
          ))}
          <button
            className={`nt__filter-btn ${filter === 'archived' ? 'active' : ''}`}
            onClick={() => setFilter('archived')}
          >
            <i className='bx bx-archive-in'></i>
            <span>Archivadas</span>
            {archivedCount > 0 && <span className="nt__filter-count">{archivedCount}</span>}
          </button>
        </nav>

        <div className="nt__sidebar-actions">
          <button className="nt__action-btn nt__action-btn--primary" onClick={handleSendTest}>
            <i className='bx bx-send'></i> Enviar pruebas
          </button>
          <button className="nt__action-btn" onClick={handleMarkAllRead}>
            <i className='bx bx-check-double'></i> Marcar leídas
          </button>
          <button className="nt__action-btn nt__action-btn--danger" onClick={handleClearAll}>
            <i className='bx bx-trash'></i> Eliminar todo
          </button>
        </div>
      </aside>

      {/* ── FEED ── */}
      <main className="nt__feed">
        <div className="nt__feed-header">
          <h2 className="nt__feed-title">{filterLabel}</h2>
          <span className="nt__feed-count">
            {visibleNotes.length} {visibleNotes.length === 1 ? 'notificación' : 'notificaciones'}
          </span>
        </div>

        <div className="nt__list">
          {loading ? (
            <div className="nt__empty">
              <i className='bx bx-loader-alt bx-spin'></i>
              <p>Cargando...</p>
            </div>
          ) : visibleNotes.length > 0 ? (
            visibleNotes.map((note) => {
              const icon = note.visuals?.icon || 'bx-bell';
              const color = note.visuals?.color || '#8EDB15';
              const isGlow = note.visuals?.glow;
              const isUnread = note.status === 'unread';
              const isExpanded = expandedId === note.id;
              const isTeamInvite = note?.meta?.action === 'team_invite' && note?.meta?.teamId;
              const inviteSlotLabel = formatInviteSlotLabel(note?.meta?.slotType, note?.meta?.slotIndex);
              const inviteRoleLabel = String(note?.meta?.slotRole || '').trim();

              return (
                <div
                  key={note.id}
                  className={`nt__card ${isGlow ? 'nt__card--glow' : ''} ${isUnread ? 'nt__card--unread' : 'nt__card--read'} ${isExpanded ? 'nt__card--expanded' : ''}`}
                  style={{ '--card-accent': color }}
                >
                  <div className="nt__card-accent" />

                  <div className="nt__card-icon" style={{ background: `${color}15`, color }}>
                    <i className={`bx ${icon}`}></i>
                  </div>

                  <div className="nt__card-content">
                    <div className="nt__card-row">
                      <h4 className="nt__card-title">{note.title}</h4>
                      <span className="nt__card-source">{note.source}</span>
                      <span className="nt__card-time">{note.time}</span>
                      {isUnread && <span className="nt__card-dot" style={{ background: color }} />}
                    </div>

                    {isExpanded && (
                      <p className="nt__card-msg">{note.message}</p>
                    )}

                    {isTeamInvite && (
                      <div className="nt__invite-meta">
                        <span>{inviteSlotLabel}</span>
                        {inviteRoleLabel && <span>Rol: {inviteRoleLabel}</span>}
                      </div>
                    )}

                    {/* ── ACTION BAR ── */}
                    <div className="nt__card-actions">
                      <button
                        className="nt__btn-action"
                        onClick={() => {
                          setExpandedId(isExpanded ? null : note.id);
                          if (isUnread) handleMarkRead(note.id);
                        }}
                      >
                        <i className={`bx ${isExpanded ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
                        {isExpanded ? 'Menos' : 'Ver más'}
                      </button>

                      <button
                        className="nt__btn-action"
                        onClick={() => handleArchive(note.id)}
                      >
                        <i className={`bx ${note.isArchived ? 'bx-undo' : 'bx-archive-in'}`}></i>
                        {note.isArchived ? 'Restaurar' : 'Archivar'}
                      </button>

                      {isTeamInvite && (
                        <button
                          className="nt__btn-action"
                          onClick={() => handleAcceptTeamInvite(note)}
                          disabled={Boolean(acceptingById[note.id || note._id])}
                        >
                          <i className='bx bx-check-circle'></i>
                          {acceptingById[note.id || note._id] ? 'Aceptando...' : 'Aceptar invitación'}
                        </button>
                      )}

                      {isTeamInvite && (
                        <button
                          className="nt__btn-action"
                          onClick={() => {
                            navigate('/teams', {
                              state: {
                                teamId: note.meta.teamId,
                                openPreview: true,
                                openJoinForm: true,
                                inviteCode: String(note?.meta?.inviteCode || '').toUpperCase(),
                                slotType: String(note?.meta?.slotType || '').trim(),
                                slotIndex: Number(note?.meta?.slotIndex),
                                slotRole: String(note?.meta?.slotRole || '').trim()
                              }
                            });
                          }}
                        >
                          <i className='bx bx-log-in-circle'></i>
                          Ver invitación
                        </button>
                      )}

                      {note?.category === 'social' && note?.meta?.action === 'follow' && note?.meta?.userId && (
                        <button
                          className="nt__btn-action"
                          onClick={() => {
                            navigate('/friends', {
                              state: {
                                openDiscover: true,
                                query: String(note?.meta?.userId || '').trim()
                              }
                            });
                          }}
                        >
                          <i className='bx bx-search-alt-2'></i>
                          Ver usuario
                        </button>
                      )}

                      <button
                        className="nt__btn-action nt__btn-action--danger"
                        onClick={() => handleRemove(note.id)}
                      >
                        <i className='bx bx-trash'></i>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="nt__empty">
              <div className="nt__empty-icon">
                <i className='bx bx-bell-off'></i>
              </div>
              <p>No hay notificaciones</p>
              <small>
                {filter === 'archived'
                  ? 'No tienes notificaciones archivadas.'
                  : 'Cuando haya actividad, aparecerá aquí.'}
              </small>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
