// src/data/gameImages.js

// Importación de imágenes locales
import siege from '../assets/games/6siege.jpg';
import apex from '../assets/games/apex.jpg';
import clash from '../assets/games/clashroyal.jpg';
import cod from '../assets/games/cod.jpg';
import cs2 from '../assets/games/cs2.jpg';
import dota2 from '../assets/games/dota2.jpg';
import fifa from '../assets/games/fifa.jpg';
import fortnite from '../assets/games/fornite.jpg';
import freefire from '../assets/games/freefire.jpg'; //me quede aqui
import hearthstone from '../assets/games/hearthstone.jpg';
import hok from '../assets/games/hok.jpg';
import lol from '../assets/games/lol.jpg';
import mlbb from '../assets/games/mlbb.jpg';
import nba from '../assets/games/nba2k24.jpg';
import overwatch from '../assets/games/Overwhat2.jpg';
import pubg from '../assets/games/pubg.jpg';
import rocket from '../assets/games/rocket.jpg';
import runeterra from '../assets/games/runeterra.jpg';
import sf6 from '../assets/games/sf6.jpg';
import smite from '../assets/games/smite.jpg';
import starcraft from '../assets/games/starcraft.jpg';
import tekken from '../assets/games/tekken8.jpg';
import tft from '../assets/games/tft.jpg';
import valorant from '../assets/games/valorant.jpg';
import warzone from '../assets/games/warzone.jpg';
import wildrift from '../assets/games/wildrift.jpg';
import def from '../assets/games/valorant.jpg'; // Imagen por defecto (puedes poner un logo)

export const GAME_IMAGES = {
    // Shooter
    "Rainbow Six Siege": siege,
    "Valorant": valorant,
    "CS:GO 2": cs2,
    "Overwatch 2": overwatch,
    "Call of Duty": cod,
    "Warzone": warzone,
    "Free Fire": freefire,
    "PUBG": pubg,
    "Fortnite": fortnite,
    "Apex Legends": apex,

    // MOBA
    "League of Legends": lol,
    "Dota 2": dota2,
    "Mobile Legends": mlbb,
    "Honor of Kings": hok,
    "Smite": smite,
    "Wild Rift": wildrift,

    // Estrategia / Cartas
    "Clash Royale": clash,
    "Hearthstone": hearthstone,
    "Legends of Runeterra": runeterra,
    "Teamfight Tactics": tft,
    "StarCraft II": starcraft,

    // Deportes / Pelea
    "FIFA 24": fifa,
    "NBA 2K24": nba,
    "Rocket League": rocket,
    "Street Fighter 6": sf6,
    "Tekken 8": tekken,

    "LoL": lol,  // Alias para League of Legends
    "Dota": dota2,  // Alias para Dota 2
    "COD": cod,  // Alias para Call of Duty
    "CSGO": cs2,  // Alias para CS:GO 2
    "mlbb": mlbb,  // Alias para Mobile Legends
    "tft": tft,  // Alias para Teamfight Tactics
    "codm": cod,  // Alias para Call of Duty Mobile
    "free fire": freefire,  // Alias para Free Fire

    // Fallback
    "Default": def
};
