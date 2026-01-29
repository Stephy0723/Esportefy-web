import React, { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext'; 
import './Notifications.css';
import axios from 'axios';

const Notifications = () => {
  // 1. OBTENER DATOS Y FUNCIONES DEL CEREBRO
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
      } catch (e) {
        // silencio: fallback a locales
      }
    };
    fetchNotifications();
  }, [loadNotifications]);

  // --- LÓGICA DE FILTRADO ---
  const getFilteredNotes = () => {
    return notifications.filter(n => {
      // Filtros de estado
      if (filter === 'archived') return n.isArchived;
      if (filter === 'saved') return n.isSaved && !n.isArchived;
      
      // Si no estamos en archivo, ocultamos las archivadas
      if (n.isArchived) return false;

      // Filtros de categoría
      if (filter === 'all') return true;
      
      // Compatibilidad con tipos viejos y nuevos
      return n.category === filter || n.type === filter; 
    });
  };

  const visibleNotes = getFilteredNotes();

  // Acción simulada de aceptar/rechazar (Solo visual)
  const handleAction = (id, status) => {
    addToast(status === 'accepted' ? 'Solicitud aceptada' : 'Solicitud rechazada', status === 'accepted' ? 'success' : 'info');
    // Aquí iría la lógica para actualizar el estado en la base de datos real
  };

  return (
    <div className="notifications-layout">
      
      {/* --- COLUMNA IZQUIERDA: FEED DE NOTIFICACIONES --- */}
      <div className="notif-feed">
        <div className="feed-header">
            <h2>{filter === 'all' ? 'Bandeja de Entrada' : filter.toUpperCase()}</h2>
            <div className="feed-controls">
                <button className="mark-read-btn">
                   <i className='bx bx-check-double'></i> Marcar todo leído
                </button>
            </div>
        </div>

        <div className="notif-list">
          {visibleNotes.length > 0 ? (
            visibleNotes.map(note => {
                // Normalizamos datos para asegurar que no falle si faltan campos
                const icon = note.visuals?.icon || note.icon || 'bx-bell';
                const color = note.visuals?.color || note.color || '#fff';
                const glowClass = note.visuals?.glow ? 'glow-effect' : '';
                
                return (
                  <div key={note.id} className={`notif-card-pro ${note.status} ${glowClass}`}>
                    
                    <div className="card-top">
                      {/* ICONO DINÁMICO */}
                      <div className="icon-box" style={{ background: `${color}15`, color: color }}>
                        <i className={`bx ${icon}`}></i>
                      </div>
                      
                      <div className="card-meta">
                        <h4>{note.title} <span className="source">• {note.source}</span></h4>
                        <span className="time">{note.time}</span>
                      </div>

                      <div className="top-actions">
                        <button className="icon-btn close" onClick={() => removeNotification(note.id)}>
                            <i className='bx bx-x'></i>
                        </button>
                      </div>
                    </div>

                    <div className="card-body">
                      <p>{note.message}</p>
                      
                      {/* SECCIÓN DE INSIGNIAS (Solo si la notificación trae medallas) */}
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
                       {/* BOTONES DE ACCIÓN (Contextuales) */}
                       
                       {/* Caso: Bienvenida */}
                       {note.type === 'welcome_reward' && (
                           <button className="btn-link">Ver mi Perfil <i className='bx bx-right-arrow-alt'></i></button>
                       )}
                       
                       {/* Caso: Invitación Pendiente */}
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
            /* ESTADO VACÍO (Cuando no hay notificaciones) */
            <div className="empty-feed">
                <i className='bx bx-ghost'></i>
                <p>Todo está tranquilo por aquí.</p>
                <small>Recibirás alertas cuando haya actividad en tu cuenta.</small>
            </div>
          )}
        </div>
      </div>

      {/* --- COLUMNA DERECHA: FILTROS (SIDEBAR) --- */}
      <div className="notif-sidebar">
        
        {/* Eliminamos el botón de crear. Ahora solo muestra filtros. */}
        
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
                <span className="dot" style={{background: '#8EDB15'}}></span> Sistema
            </li>
            <li className={filter === 'team' ? 'active' : ''} onClick={() => setFilter('team')}>
                <span className="dot" style={{background: '#4facfe'}}></span> Equipos
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
