import React from 'react';
import { FaCrosshairs, FaChessKing, FaGamepad } from 'react-icons/fa';
import { GAME_POLICIES } from '../../../shared/gamePolicies.js';

const CATEGORY_ORDER = [
  'FPS (Shooters)',
  'MOBA',
  'Battle Royale',
  'Sports & Racing',
  'Fighting',
];

const CATEGORY_ICONS = {
  'FPS (Shooters)': <FaCrosshairs />,
  MOBA: <FaChessKing />,
  'Battle Royale': <FaCrosshairs />,
  'Sports & Racing': <FaGamepad />,
  Fighting: <FaGamepad />,
};

const buildEsportsCatalog = () => {
  const grouped = {};

  CATEGORY_ORDER.forEach((category) => {
    grouped[category] = {};
  });

  GAME_POLICIES.forEach((policy) => {
    const category = policy.teamCategory;
    if (!grouped[category]) {
      grouped[category] = {};
    }

    grouped[category][policy.name] = {
      maxPlayers: policy.teamSize,
      maxSubs: policy.maxSubs,
      icon: CATEGORY_ICONS[category] || <FaGamepad />,
      defaultModality: policy.defaultModality,
      defaultPlatform: policy.defaultPlatform,
      supportedSeries: [...policy.tournamentSeries],
    };
  });

  return grouped;
};

export const esportsCatalog = buildEsportsCatalog();
