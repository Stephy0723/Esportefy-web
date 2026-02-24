// src/data/esportsCatalog.jsx
import React from 'react';
import { FaGamepad, FaCrosshairs, FaChessKing, FaFistRaised } from 'react-icons/fa';

export const esportsCatalog = {
    "FPS (Shooters)": {
        "Valorant": { maxPlayers: 5, maxSubs: 2, icon: <FaCrosshairs /> },
        "CS:GO": { maxPlayers: 5, maxSubs: 2, icon: <FaCrosshairs /> },
        "Call of Duty": { maxPlayers: 4, maxSubs: 2, icon: <FaCrosshairs /> },
        "Overwatch 2": { maxPlayers: 5, maxSubs: 2, icon: <FaGamepad /> }
    },
    "MOBA": {
        "League of Legends": { maxPlayers: 5, maxSubs: 2, icon: <FaChessKing /> },
        "Dota 2": { maxPlayers: 5, maxSubs: 2, icon: <FaChessKing /> },
        "Mobile Legends": { maxPlayers: 5, maxSubs: 3, icon: <FaGamepad /> }
    },
    "Sports & Racing": {
        "FIFA / EA FC": { maxPlayers: 1, maxSubs: 0, icon: <FaGamepad /> },
        "Rocket League": { maxPlayers: 3, maxSubs: 1, icon: <FaGamepad /> },
        "F1 2024": { maxPlayers: 1, maxSubs: 0, icon: <FaGamepad /> }
    },
    "Fighting": {
        "Street Fighter 6": { maxPlayers: 1, maxSubs: 0, icon: <FaFistRaised /> },
        "Tekken 8": { maxPlayers: 1, maxSubs: 0, icon: <FaFistRaised /> },
        "Super Smash Bros": { maxPlayers: 1, maxSubs: 0, icon: <FaFistRaised /> }
    }
};