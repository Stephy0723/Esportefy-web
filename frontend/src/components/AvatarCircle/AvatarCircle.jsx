import React from 'react';
import './AvatarCircle.css';

const AvatarCircle = ({ 
  src,           
  alt = "Avatar", 
  size = "160px", 
  status = "offline", // Nuevo: online, dnd, tournament, offline
  isActive = false,   // Mantenemos por compatibilidad (si es true forzará online)
  frameConfig = null 
}) => {
  
  // 1. Configuración del Marco (Tu lógica existente)
  // Mapeamos el ID del marco a la clase CSS correspondiente
  const frameClass = frameConfig?.type === 'css' ? `frame-${frameConfig.id}` : '';
  const themeClass = frameConfig?.id || ''; // Fallback para tus marcos antiguos

  // 2. Lógica del Estado
  // Si isActive es true, forzamos 'online', si no, usamos el prop 'status'
  const currentStatus = isActive ? 'online' : status;

  const styles = {
    width: size,
    height: size,
  };

  return (
    <div className={`avatar-circle-container ${frameClass} ${themeClass} ${currentStatus}`} style={styles}>
      
      {/* 1. EL ANILLO PRINCIPAL (Puro CSS) */}
      <div className="fantasy-ring">
        <div className="crystal-leaf pos-1"></div>
        <div className="crystal-leaf pos-2"></div>
        <div className="crystal-leaf pos-3"></div>
        {/* Polvo mágico si no es tóxico */}
        {themeClass !== 'toxic' && <div className="magic-dust"></div>}
      </div>

      {/* 2. LA FOTO DE USUARIO */}
      <div className="avatar-core">
        <img src={src} alt={alt} />
      </div>

      {/* 3. INDICADOR DE ESTADO (Dinámico) */}
      {/* Solo lo mostramos si NO es offline */}
      {currentStatus !== 'offline' && (
        <span className={`status-dot ${currentStatus}`} title={currentStatus}></span>
      )}
    </div>
  );
};

export default AvatarCircle;