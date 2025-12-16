import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import './Toast.css';

const ToastContainer = () => {
  const { toasts } = useNotification();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card ${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'success' && <i className='bx bx-check-circle'></i>}
            {toast.type === 'error' && <i className='bx bx-x-circle'></i>}
            {toast.type === 'info' && <i className='bx bx-info-circle'></i>}
          </div>
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;