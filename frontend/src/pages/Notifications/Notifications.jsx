import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
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

const Notifications = () => {
  const { notifications, removeNotification, addToast, loadNotifications } = useNotification();
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setLoading(false); return; }
        const res = await axios.get(`${API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        loadNotifications(res.data);
      } catch (_) { }
      finally { setLoading(false); }
    };
    fetchNotifications();
  }, [loadNotifications]);

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
      const token = localStorage.getItem('token');
      if (token) {
        await axios.delete(`${API_URL}/api/notifications/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (_) { }
    removeNotification(id);
    addToast('Notificación eliminada', 'success');
  };

  const handleArchive = async (id) => {
    const note = notifications.find(n => n.id === id || n._id === id);
    const newArchived = !note?.isArchived;
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.patch(`${API_URL}/api/notifications/${id}/archive`, { archived: newArchived }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (_) { }
    loadNotifications(notifications.map(n =>
      (n.id === id || n._id === id) ? { ...n, isArchived: newArchived } : n
    ));
    addToast(newArchived ? 'Notificación archivada' : 'Notificación restaurada', 'info');
  };

  const handleMarkRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.patch(`${API_URL}/api/notifications/${id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (_) { }
    loadNotifications(notifications.map(n =>
      (n.id === id || n._id === id) ? { ...n, status: 'read' } : n
    ));
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.patch(`${API_URL}/api/notifications/read-all`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      loadNotifications(notifications.map((n) => ({ ...n, status: 'read' })));
      addToast('Todas marcadas como leídas', 'success');
    } catch (_) {
      addToast('Error al marcar', 'error');
    }
  };

  const handleClearAll = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.delete(`${API_URL}/api/notifications/clear-all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      loadNotifications([]);
      addToast('Historial limpiado', 'success');
    } catch (_) {
      addToast('Error al limpiar', 'error');
    }
  };

  const handleSendTest = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.post(`${API_URL}/api/notifications/test-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fresh = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadNotifications(fresh.data);
      addToast(`${res.data.count} notificaciones enviadas`, 'success');
    } catch (_) {
      addToast('Error al enviar test', 'error');
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
