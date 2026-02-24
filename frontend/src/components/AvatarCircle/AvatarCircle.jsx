import React from 'react';
import './AvatarCircle.css';

/* Status icon mapping (Boxicons classes) */
const STATUS_ICONS = {
  online:     null,               // simple dot, no icon
  gaming:     'bx bx-joystick',
  tournament: 'bx bx-trophy',
  streaming:  'bx bx-broadcast',
  searching:  'bx bx-radar',
  afk:        'bx bx-moon',
  dnd:        'bx bx-block',
  offline:    null,
};

const AvatarCircle = ({ 
  src,           
  alt = "Avatar", 
  size = "160px", 
  status = "offline",
  isActive = false,
  frameConfig = null 
}) => {
  
  const frameClass = frameConfig?.type === 'css' ? `frame-${frameConfig.id}` : '';
  const themeClass = frameConfig?.id || '';
  const currentStatus = isActive ? 'online' : status;

  const styles = { width: size, height: size };
  const iconClass = STATUS_ICONS[currentStatus];

  return (
    <div className={`avatar-circle-container ${frameClass} ${themeClass} ${currentStatus}`} style={styles}>
      
      {/* 1. EL ANILLO PRINCIPAL (Puro CSS) */}
      <div className="fantasy-ring">
        <div className="crystal-leaf pos-1"></div>
        <div className="crystal-leaf pos-2"></div>
        <div className="crystal-leaf pos-3"></div>
        {themeClass !== 'toxic' && <div className="magic-dust"></div>}
      </div>

      {/* 2. LA FOTO DE USUARIO */}
      <div className="avatar-core">
        <img src={src} alt={alt} />
      </div>

      {/* 3. INDICADOR DE ESTADO — Animated orbit/drop system */}
      {currentStatus !== 'offline' && (
        <div className={`status-indicator si--${currentStatus}`}>
          <div className="si__orbit-track">
            <div className="si__dot">
              {iconClass && <i className={iconClass}></i>}
            </div>
          </div>
          {/* Ripple rings for pulse effect */}
          <div className="si__ripple si__ripple--1"></div>
          <div className="si__ripple si__ripple--2"></div>
        </div>
      )}
    </div>
  );
};

export default AvatarCircle;