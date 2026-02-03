import React, { createContext, useState, useContext, useCallback } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  // --- 1. ALERTAS FLOTANTES (TOASTS) ---
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  // --- 2. EL GENERADOR MAESTRO DE NOTIFICACIONES ---
  const notify = (type, title, message) => {
    
    // Configuración automática de estilos según el tipo
    let config = { icon: 'bx-bell', color: '#fff', category: 'system' };
    
    switch(type) {
        case 'team':
            config = { icon: 'bx-group', color: '#4facfe', category: 'team' };
            break;
        case 'success': // Logros, subidas de nivel
            config = { icon: 'bx-medal', color: '#FFD700', category: 'social' };
            break;
        case 'danger': // Salidas, expulsiones
            config = { icon: 'bx-error-circle', color: '#ff6b6b', category: 'system' };
            break;
        case 'info': // Sistema general
            config = { icon: 'bx-info-circle', color: '#f093fb', category: 'system' };
            break;
        default:
            config = { icon: 'bx-bell', color: '#8EDB15', category: 'system' };
    }

    // Objeto de notificación
    const newNote = {
      id: Date.now(),
      category: config.category,
      type: type, 
      title: title,
      source: 'Sistema',
      message: message,
      time: 'Ahora mismo',
      status: 'unread',
      isSaved: false,
      isArchived: false,
      // Visuales
      icon: config.icon,
      color: config.color,
      visuals: {
        glow: type === 'success', // Brillar si es un logro
      }
    };

    // A) Guardar en Buzón
    setNotifications((prev) => [newNote, ...prev]);
    
    // B) Mostrar Alerta Flotante inmediata
    addToast(title, type === 'danger' ? 'error' : 'success');
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const loadNotifications = (list) => {
    if (!Array.isArray(list)) return;
    setNotifications(list.map((n) => ({
      id: n._id || n.id,
      category: n.category || 'system',
      type: n.type || 'info',
      title: n.title || 'Notificación',
      source: n.source || 'Sistema',
      message: n.message || '',
      time: n.createdAt ? 'Ahora mismo' : 'Ahora mismo',
      status: n.status || 'unread',
      isSaved: Boolean(n.isSaved),
      isArchived: Boolean(n.isArchived),
      meta: n.meta || {},
      visuals: n.visuals || { icon: 'bx-bell', color: '#8EDB15', glow: false }
    })));
  };

  // --- SECUENCIA DE BIENVENIDA (Usando nuestra nueva función notify) ---
  const triggerWelcomeSequence = () => {
     // Usamos la función genérica pero con datos personalizados
     const welcomeNote = {
        id: 'welcome-init',
        category: 'system',
        type: 'welcome_reward',
        title: '¡Bienvenido a la Grieta!',
        source: 'Esportefy',
        message: 'Tu perfil de JUGADOR ha sido creado. Comienza tu camino hacia el profesionalismo.',
        time: 'Ahora mismo',
        status: 'unread',
        visuals: { icon: 'bx-medal', color: '#8EDB15', glow: true },
        badges: [{ label: 'Nuevo Ingreso', color: 'green' }, { label: 'Rol: Jugador', color: 'blue' }]
     };
     setNotifications((prev) => [welcomeNote, ...prev]);
     addToast('¡Cuenta de Jugador Verificada!', 'success');
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      toasts, 
      notify, // <--- ESTA ES LA FUNCIÓN QUE EXPORTAMOS PARA USAR FUERA
      addToast,
      removeNotification,
      loadNotifications,
      triggerWelcomeSequence 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
