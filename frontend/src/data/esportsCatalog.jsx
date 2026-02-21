// src/data/esportsCatalog.jsx
import React from 'react';
import { FaGamepad, FaCrosshairs, FaChessKing, FaFistRaised, FaBullseye, FaDice } from 'react-icons/fa';

export const esportsCatalog = {
    "FPS (Shooters)": {
        "Valorant": { maxPlayers: 5, maxSubs: 2, icon: <FaCrosshairs /> },
        "CS2": { maxPlayers: 5, maxSubs: 2, icon: <FaCrosshairs /> },
        "Call of Duty": { maxPlayers: 4, maxSubs: 2, icon: <FaCrosshairs /> },
        "Overwatch 2": { maxPlayers: 5, maxSubs: 2, icon: <FaGamepad /> },
        "Rainbow Six Siege": { maxPlayers: 5, maxSubs: 2, icon: <FaCrosshairs /> }
    },
    "MOBA": {
        "League of Legends": { maxPlayers: 5, maxSubs: 2, icon: <FaChessKing /> },
        "Dota 2": { maxPlayers: 5, maxSubs: 2, icon: <FaChessKing /> },
        "Mobile Legends": { maxPlayers: 5, maxSubs: 3, icon: <FaGamepad /> },
        "Wild Rift": { maxPlayers: 5, maxSubs: 2, icon: <FaChessKing /> },
        "Smite 2": { maxPlayers: 5, maxSubs: 2, icon: <FaChessKing /> }
    },
    "Battle Royale": {
        "Fortnite": { maxPlayers: 4, maxSubs: 2, icon: <FaBullseye /> },
        "PUBG": { maxPlayers: 4, maxSubs: 2, icon: <FaBullseye /> },
        "Apex Legends": { maxPlayers: 3, maxSubs: 1, icon: <FaBullseye /> },
        "Free Fire": { maxPlayers: 4, maxSubs: 2, icon: <FaBullseye /> },
        "Warzone": { maxPlayers: 4, maxSubs: 2, icon: <FaBullseye /> }
    },
    "Sports & Racing": {
        "FIFA / EA FC": { maxPlayers: 1, maxSubs: 0, icon: <FaGamepad /> },
        "Rocket League": { maxPlayers: 3, maxSubs: 1, icon: <FaGamepad /> },
        "F1 2024": { maxPlayers: 1, maxSubs: 0, icon: <FaGamepad /> },
        "NBA 2K": { maxPlayers: 1, maxSubs: 0, icon: <FaGamepad /> }
    },
    "Fighting": {
        "Street Fighter 6": { maxPlayers: 1, maxSubs: 0, icon: <FaFistRaised /> },
        "Tekken 8": { maxPlayers: 1, maxSubs: 0, icon: <FaFistRaised /> },
        "Super Smash Bros": { maxPlayers: 1, maxSubs: 0, icon: <FaFistRaised /> },
        "Mortal Kombat 1": { maxPlayers: 1, maxSubs: 0, icon: <FaFistRaised /> }
    },
    "Estrategia / Táctico": {
        "TFT": { maxPlayers: 1, maxSubs: 0, icon: <FaDice /> },
        "Clash Royale": { maxPlayers: 1, maxSubs: 0, icon: <FaDice /> },
        "Hearthstone": { maxPlayers: 1, maxSubs: 0, icon: <FaDice /> },
        "Legends of Runeterra": { maxPlayers: 1, maxSubs: 0, icon: <FaDice /> }
    }
};