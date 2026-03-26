import React from 'react';
import { PLAYER_TAGS } from '../../data/playerTags';
import './PlayerTag.css';

const PlayerTag = ({ nickname, name, username, tagId = 'tag-obsidian', size = 'normal', fontTag }) => {
    const tagConfig = PLAYER_TAGS.find(t => t.id === tagId) || PLAYER_TAGS[0];
    const resolvedName = nickname || name || username || "Player";

    return (
        <div className={`player-tag ${tagConfig.id} size-${size}`}>
            {/* Decorative layers */}
            <div className="tag-bg"></div>
            <div className="tag-accent"></div>
            <div className="tag-shine"></div>

            {/* Player name */}
            <span 
                className="tag-name"
                style={fontTag ? { fontSize: fontTag } : undefined}
            >
                {resolvedName}
            </span>
        </div>
    );
};

export default PlayerTag;
