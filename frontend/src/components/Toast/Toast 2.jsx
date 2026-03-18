import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, show, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div className="toast-glitch">
      <span className="glitch" data-text={message}>{message}</span>
    </div>
  );
};

export default Toast;
