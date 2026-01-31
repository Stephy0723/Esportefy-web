import React from 'react';
import { PLAYER_TAGS } from '../../data/playerTags'; // Importamos para buscar la data
import './PlayerTag.css';

const PlayerTag = ({ name, tagId = 'tag1', size = 'normal', fontTag ="1.2 rem" }) => {
    // Buscamos la configuración de la etiqueta activa
    const tagConfig = PLAYER_TAGS.find(t => t.id === tagId) || PLAYER_TAGS[0];

    return (
        <div 
            className={`player-tag-container size-${size}`}
            style={{ 
                backgroundImage: `url(${tagConfig.src})`,
                color: tagConfig.textColor || 'white'
            }}
        >
            {/* Texto con sombra para asegurar lectura sobre la imagen */}
            <span 
                className="player-name-text"
                style={{ fontSize: fontTag }}
                >
                {name || "Player"}
            </span>
            
            {/* Brillo opcional para efecto "vidrio" */}
            <div className="tag-shine"></div>
        </div>
    );
};

export default PlayerTag;