import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNotification } from '../../context/NotificationContext';
import './Notifications.css';

const Notifications = () => {
  const { notifications, removeNotification, addToast, loadNotifications } = useNotification();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get('http://localhost:4000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        loadNotifications(res.data);
      } catch (_) {
        // fallback a locales
      }
    };

    fetchNotifications();
  }, [loadNotifications]);

  const visibleNotes = useMemo(() => {
    return notifications.filter((n) => {
      if (n.status === 'read' && filter !== 'archived' && filter !== 'saved') return false;
      if (filter === 'archived') return n.isArchived;
      if (filter === 'saved') return n.isSaved && !n.isArchived;
      if (n.isArchived) return false;
      if (filter === 'all') return n.status !== 'read';
      return n.category === filter || n.type === filter;
    });
  }, [notifications, filter]);

  const handleAction = (id, status) => {
    addToast(status === 'accepted' ? 'Solicitud aceptada' : 'Solicitud rechazada', status === 'accepted' ? 'success' : 'info');
  };

  const handleRemove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.patch(`http://localhost:4000/api/notifications/${id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (_) {
      // no bloquear UI
    }
    removeNotification(id);
  };

  const handleMarkAll = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.patch('http://localhost:4000/api/notifications/read-all', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      loadNotifications(
        notifications.map((n) => ({
          ...n,
          status: 'read'
        }))
      );
      addToast('Todas las notificaciones fueron marcadas', 'success');
    } catch (_) {
      addToast('No se pudieron marcar todas', 'error');
    }
  };

  const titleText = filter === 'all' ? 'Bandeja de Entrada' : filter.toUpperCase();

  return (
    <div className="notifications-layout">
      <div className="notif-feed">
        <div className="feed-header">
          <div>
            <h2>{titleText}</h2>
            <p className="feed-sub">Actividad reciente de tu cuenta</p>
          </div>
          <div className="feed-controls">
            <button className="mark-read-btn" onClick={handleMarkAll}>
              <i className='bx bx-check-double'></i> Marcar todo leído
            </button>
          </div>
        </div>

        <div className="notif-list">
          {visibleNotes.length > 0 ? (
            visibleNotes.map((note) => {
              const icon = note.visuals?.icon || note.icon || 'bx-bell';
              const color = note.visuals?.color || note.color || '#fff';
              const glowClass = note.visuals?.glow ? 'glow-effect' : '';

              return (
                <div key={note.id} className={`notif-card-pro ${note.status} ${glowClass}`}>
                  <div className="card-top">
                    <div className="icon-box" style={{ background: `${color}15`, color: color }}>
                      <i className={`bx ${icon}`}></i>
                    </div>

                    <div className="card-meta">
                      <h4>{note.title} <span className="source">• {note.source}</span></h4>
                      <span className="time">{note.time}</span>
                    </div>

                    <div className="top-actions">
                      <button className="icon-btn close" onClick={() => handleRemove(note.id)}>
                        <i className='bx bx-x'></i>
                      </button>
                    </div>
                  </div>

                  <div className="card-body">
                    <p>{note.message}</p>

                    {note.badges && (
                      <div className="badge-container">
                        {note.badges.map((badge, idx) => (
                          <span key={idx} className={`special-badge ${badge.color}`}>
                            <i className={`bx ${badge.icon || 'bx-star'}`}></i> {badge.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="card-footer">
                    {note.type === 'welcome_reward' && (
                      <button className="btn-link">Ver mi Perfil <i className='bx bx-right-arrow-alt'></i></button>
                    )}

                    {note.status === 'pending' && (
                      <div className="decision-buttons">
                        <button className="btn-decision accept" onClick={() => handleAction(note.id, 'accepted')}>Aceptar</button>
                        <button className="btn-decision cancel" onClick={() => handleAction(note.id, 'rejected')}>Rechazar</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-feed">
              <i className='bx bx-ghost'></i>
              <p>Todo está tranquilo por aquí.</p>
              <small>Recibirás alertas cuando haya actividad en tu cuenta.</small>
            </div>
          )}
        </div>
      </div>

      <div className="notif-sidebar">
        <div className="sidebar-section">
          <h4>Filtros</h4>
          <ul>
            <li className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
              <i className='bx bx-inbox'></i> Bandeja Principal
            </li>
            <li className={filter === 'saved' ? 'active' : ''} onClick={() => setFilter('saved')}>
              <i className='bx bx-bookmark'></i> Guardados
            </li>
            <li className={filter === 'system' ? 'active' : ''} onClick={() => setFilter('system')}>
              <span className="dot" style={{ background: '#8EDB15' }}></span> Sistema
            </li>
            <li className={filter === 'team' ? 'active' : ''} onClick={() => setFilter('team')}>
              <span className="dot" style={{ background: '#4facfe' }}></span> Equipos
            </li>
          </ul>
        </div>

        <div className="sidebar-section">
          <h4>Otros</h4>
          <ul>
            <li className={filter === 'archived' ? 'active' : ''} onClick={() => setFilter('archived')}>
              <i className='bx bx-archive-in'></i> Archivo Histórico
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
