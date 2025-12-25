// src/data/gamesData.js

// 1. TUS IMPORTS (Asegúrate de que la ruta de carpetas sea correcta)
// Nota: Si este archivo está en 'src/data/', la ruta correcta a assets suele ser '../assets/...'
import FortniteImg from '../assets/comunidad/Fortnite.jpg';
import CS2Img from '../assets/comunidad/CS2.jpg';
import CRImg from '../assets/comunidad/CR.jpg';
import HoKImg from '../assets/comunidad/HoK_V.jpg';
import FFImg from '../assets/comunidad/FF.jpg';
import Dota2Img from '../assets/comunidad/Dota2.jpeg';
import HSImg from '../assets/comunidad/HS.webp';
import LoLImg from '../assets/comunidad/LoL.jpg';
import LoRImg from '../assets/comunidad/LoR.jpg';
import MLBBImg from '../assets/comunidad/MLBB.jpg';
import NBAImg from '../assets/comunidad/NBA2K24.jpg';
import OW2Img from '../assets/comunidad/OW2.jpeg';
import PUBGMImg from '../assets/comunidad/PUBGM.jpg';
import R6SImg from '../assets/comunidad/R6S.jpg';
import RLImg from '../assets/comunidad/RL.jpg';
import SC2Img from '../assets/comunidad/SC2.jpg';
import SF6Img from '../assets/comunidad/sf6.png';
import Tekken8Img from '../assets/comunidad/Tekken8.jpg';
import TFTImg from '../assets/comunidad/TFT.webp';
import ValorantImg from '../assets/comunidad/valorant.jpg';
import WarzoneImg from '../assets/comunidad/Warzone.jpg';
import WildRiftImg from '../assets/comunidad/WildRift.jpeg';

export const gamesList = [
    // =========================================
    // 🌟 JUEGOS CON TUS FOTOS LOCALES
    // =========================================
    { 
        id: 'lol', 
        name: 'League of Legends', 
        img: LoLImg, // ✅ Variable importada
        tags: ['MOBA', 'PC', 'Popular'],
        color: '#C1A058',
        desc: 'El rey de los MOBA. Estrategia en equipo y habilidad mecánica.',
        members: '10M', active: '1.5M'
    },
    { id: 'fortnite', name: 'Fortnite', img: FortniteImg, tags: ['Battle Royale', 'PC', 'Consola'], color: '#A94DE3' },
    { id: 'freefire', name: 'Free Fire', img: FFImg, tags: ['Móvil', 'Battle Royale'], color: '#FFA500' },
    { id: 'mlbb', name: 'Mobile Legends', img: MLBBImg, tags: ['MOBA', 'Móvil'], color: '#2980B9' },
    { id: 'hok', name: 'Honor of Kings', img: HoKImg, tags: ['MOBA', 'Móvil'], color: '#E67E22' },
    { id: 'mk11', name: 'Mortal Kombat 11', img: 'https://cdn1.epicgames.com/offer/21e35057a66c4495a6397227e7f694e9/EGS_MortalKombat11_NetherRealmStudios_S2_1200x1600-53243958742967262070396781223966', tags: ['Fighting'], color: '#C0392B' }, // Sin import proporcionado

    // SHOOTERS
    { id: 'val', name: 'Valorant', img: ValorantImg, tags: ['FPS', 'PC', 'Shooter'], color: '#FF4655' },
    { id: 'cs2', name: 'CS:GO 2', img: CS2Img, tags: ['FPS', 'PC', 'Shooter'], color: '#F39C12' },
    { id: 'overwatch', name: 'Overwatch 2', img: OW2Img, tags: ['FPS', 'PC'], color: '#FA9C1E' },
    { id: 'r6', name: 'Rainbow Six Siege', img: R6SImg, tags: ['FPS', 'PC', 'Táctico'], color: '#2C3E50' },
    { id: 'warzone', name: 'Call of Duty: Warzone', img: WarzoneImg, tags: ['Battle Royale', 'FPS'], color: '#7F8C8D' },
    { id: 'pubgm', name: 'PUBG Mobile', img: PUBGMImg, tags: ['Battle Royale', 'Móvil'], color: '#E67E22' },

    // MOBA & ESTRATEGIA
    { id: 'dota2', name: 'Dota 2', img: Dota2Img, tags: ['MOBA', 'PC'], color: '#C0392B' },
    { id: 'wildrift', name: 'LoL: Wild Rift', img: WildRiftImg, tags: ['MOBA', 'Móvil'], color: '#3498DB' },
    { id: 'clashroyale', name: 'Clash Royale', img: CRImg, tags: ['Estrategia', 'Móvil'], color: '#3498DB' },
    { id: 'tft', name: 'Teamfight Tactics', img: TFTImg, tags: ['Estrategia', 'PC', 'Móvil'], color: '#F39C12' },
    { id: 'starcraft', name: 'StarCraft II', img: SC2Img, tags: ['Estrategia', 'PC'], color: '#34495E' },
    { id: 'hearthstone', name: 'Hearthstone', img: HSImg, tags: ['Cartas', 'Estrategia'], color: '#F39C12' },
    { id: 'lor', name: 'Legends of Runeterra', img: LoRImg, tags: ['Cartas', 'Estrategia'], color: '#C0392B' },

    // PELEA & DEPORTES
    { id: 'sf6', name: 'Street Fighter 6', img: SF6Img, tags: ['Fighting', 'PC', 'Consola'], color: '#8E44AD' },
    { id: 'tekken8', name: 'Tekken 8', img: Tekken8Img, tags: ['Fighting', 'PC', 'Consola'], color: '#C0392B' },
    { id: 'rocket', name: 'Rocket League', img: RLImg, tags: ['Deportes', 'PC', 'Crossplay'], color: '#3498DB' },
    { id: 'nba2k', name: 'NBA 2K24', img: NBAImg, tags: ['Deportes', 'Consola'], color: '#F39C12' },

    // OTROS (Sin imports proporcionados, usan URLs de respaldo para no romper la app)
    { id: 'minecraft', name: 'Minecraft', img: 'https://image.api.playstation.com/vulcan/img/cfn/11307uYG0CXzRuA9aryByTHYrQLFz-HVQ3VVl7aA72B0q9sqosHMcNY589KkN-s_s.png', tags: ['Survival'], color: '#27AE60' },
    { id: 'roblox', name: 'Roblox', img: 'https://images.rbxcdn.com/222b40606b2b48938928928392.jpg', tags: ['Social'], color: '#C0392B' },
    { id: 'gta', name: 'GTA V', img: 'https://cdn1.epicgames.com/0584d2013f0149a791e7b9bad0eec102/offer/GTAV_EGS_Artwork_1200x1600_Portrait%20Store%20Banner-1200x1600-383929382938.jpg', tags: ['Acción'], color: '#2C3E50' },
    { id: 'genshin', name: 'Genshin Impact', img: 'https://cdn1.epicgames.com/offer/879b0d8776ab46a59a129983ba78f0ce/genshin-impact-1_1200x1600-482938293829.jpg', tags: ['RPG'], color: '#3498DB' },
    { id: 'codm', name: 'Call of Duty: Mobile', img: 'https://play-lh.googleusercontent.com/13_uM1m9e585f5e758775456434442657375_36128033068_73229649774_770', tags: ['Móvil', 'FPS'], color: '#F1C40F' },
    { id: 'pubg', name: 'PUBG: Battlegrounds', img: 'https://cdn1.epicgames.com/offer/52f57f57120c440fad9bfa0e6c279317/EGS_PUBGBATTLEGROUNDS_PUBGCorporation_S2_1200x1600-64299348924838283828382838283828', tags: ['Battle Royale', 'PC'], color: '#F1C40F' },
    { id: 'mariokart', name: 'Mario Kart', img: 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_656/b_white/f_auto/q_auto/ncom/software/switch/70010000000185/de6977ae6f5492658826354897f1f5869403d526786835252875154366629910', tags: ['Carreras', 'Consola'], color: '#E74C3C' },
    { id: 'marvel', name: 'Marvel Rivals', img: 'https://upload.wikimedia.org/wikipedia/en/e/e4/Marvel_Rivals_cover_art.jpg', tags: ['Shooter', 'PC'], color: '#3498DB' },
    { id: 'halo', name: 'Halo Infinite', img: 'https://store-images.s-microsoft.com/image/apps.43577.13781640578657662.63784102-132d-4560-8441-285647545456.963f458e-0453-4613-9828-568456845684', tags: ['FPS', 'Consola'], color: '#27AE60' },
    { id: 'amongus', name: 'Among Us', img: 'https://cdn1.epicgames.com/offer/24b9b5e323bc4cc2a644215162285a8b/EGS_AmongUs_Innersloth_S2_1200x1600-48392849382948392849382948392849', tags: ['Social', 'Móvil'], color: '#C0392B' },
    { id: 'fallguys', name: 'Fall Guys', img: 'https://cdn1.epicgames.com/offer/52f57f57120c440fad9bfa0e6c279317/EGS_FallGuys_Mediatonic_S2_1200x1600-48392849382948392849382948392849', tags: ['Party', 'PC'], color: '#E67E22' },
    { id: 'palworld', name: 'Palworld', img: 'https://cdn.akamai.steamstatic.com/steam/apps/1623730/header.jpg', tags: ['Survival', 'PC'], color: '#27AE60' }
];