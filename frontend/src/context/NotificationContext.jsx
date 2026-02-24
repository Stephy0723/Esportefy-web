import React, { createContext, useState, useContext, useCallback } from 'react';

const NotificationContext = createContext();

// ── Formato relativo de tiempo ──
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return 'Ahora mismo';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  // --- ALERTAS FLOTANTES (TOASTS) ---
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  // --- NOTIFY (para uso local) ---
  const notify = (type, title, message) => {
    let config = { icon: 'bx-bell', color: '#8EDB15', category: 'system' };
    const configMap = {
      team: { icon: 'bx-group', color: '#4facfe', category: 'team' },
      tournament: { icon: 'bx-trophy', color: '#FFD700', category: 'tournament' },
      success: { icon: 'bx-medal', color: '#FFD700', category: 'social' },
      danger: { icon: 'bx-error-circle', color: '#ff6b6b', category: 'system' },
      info: { icon: 'bx-info-circle', color: '#f093fb', category: 'system' },
      social: { icon: 'bx-user-plus', color: '#f093fb', category: 'social' },
    };
    config = configMap[type] || config;

    const newNote = {
      id: Date.now(),
      category: config.category,
      type, title, message,
      source: 'Sistema',
      time: 'Ahora mismo',
      status: 'unread',
      visuals: { icon: config.icon, color: config.color, glow: type === 'success' }
    };

    setNotifications((prev) => [newNote, ...prev]);
    addToast(title, type === 'danger' ? 'error' : 'success');
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const loadNotifications = (list) => {
    if (!Array.isArray(list)) return;
    setNotifications(list.map((n) => ({
      id: n._id || n.id,
      _id: n._id || n.id,
      category: n.category || 'system',
      type: n.type || 'info',
      title: n.title || 'Notificación',
      source: n.source || 'Sistema',
      message: n.message || '',
      time: formatRelativeTime(n.createdAt),
      createdAt: n.createdAt,
      status: n.status || 'unread',
      visuals: n.visuals || { icon: 'bx-bell', color: '#8EDB15', glow: false },
      isArchived: n.isArchived || false
    })));
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <NotificationContext.Provider value={{
      notifications, toasts, notify, addToast,
      removeNotification, loadNotifications, unreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
