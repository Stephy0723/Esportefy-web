import React, { useState } from 'react';
import './GameImage.css';

/**
 * Componente para mostrar imágenes de juegos con fallback visual
 * - Intenta cargar la imagen
 * - Si falla, muestra una tarjeta de fallback con icono y nombre del juego
 * - Props: src, alt, gameName, className, size (sm/md/lg)
 */
const GameImage = ({ src, alt = '', gameName = '', className = '', size = 'md' }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const sizeClasses = {
    sm: 'game-image--sm',
    md: 'game-image--md',
    lg: 'game-image--lg'
  };

  if (imageError || !src) {
    return (
      <div className={`game-image-fallback game-image-fallback--${size} ${className}`}>
        <i className='bx bx-joystick-alt' />
        {gameName && <span className="game-image-fallback__name">{gameName}</span>}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || gameName}
      className={`game-image ${sizeClasses[size] || sizeClasses.md} ${imageLoaded ? 'game-image--loaded' : 'game-image--loading'} ${className}`}
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  );
};

export default GameImage;
