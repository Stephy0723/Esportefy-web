// src/data/esportsCatalog.jsx
import React from 'react';
import { FaGamepad, FaCrosshairs, FaChessKing } from 'react-icons/fa';

export const esportsCatalog = {
    "FPS (Shooters)": {
        "Valorant": { maxPlayers: 5, maxSubs: 2, icon: <FaCrosshairs /> }
    },
    "MOBA": {
        "League of Legends": { maxPlayers: 5, maxSubs: 2, icon: <FaChessKing /> },
        "Mobile Legends": { maxPlayers: 5, maxSubs: 3, icon: <FaGamepad /> }
    }
};
