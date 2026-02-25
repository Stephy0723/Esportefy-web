import React, { useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import './Toast.css';

const ICON_MAP = {
  success:    'bx-check-circle',
  error:      'bx-x-circle',
  info:       'bx-info-circle',
  warning:    'bx-error',
  team:       'bx-group',
  tournament: 'bx-trophy',
  social:     'bx-user-plus',
};

const SUBTITLE_MAP = {
  success:    'Operación exitosa',
  error:      'Algo salió mal',
  info:       'Información',
  warning:    'Advertencia',
  team:       'Equipo',
  tournament: 'Torneo',
  social:     'Social',
};

const ToastContainer = () => {
  const { toasts, removeToast } = useNotification();

  const handleClose = useCallback((id) => {
    if (removeToast) removeToast(id);
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        const type = toast.type || 'info';
        const icon = ICON_MAP[type] || 'bx-bell';
        const subtitle = SUBTITLE_MAP[type] || '';

        return (
          <div key={toast.id} className={`toast-card ${type} ${toast.exiting ? 'toast-exit' : ''}`}>
            <div className="toast-icon-wrapper">
              <i className={`bx ${icon}`}></i>
            </div>
            <div className="toast-body">
              <span className="toast-title">{toast.message}</span>
              {subtitle && <span className="toast-subtitle">{subtitle}</span>}
            </div>
            <button className="toast-close" onClick={() => handleClose(toast.id)} aria-label="Cerrar">
              <i className='bx bx-x'></i>
            </button>
            <div className="toast-progress" />
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;