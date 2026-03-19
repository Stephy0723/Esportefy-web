import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import {
    FaUser, FaGamepad, FaLock, FaSave, FaArrowLeft,
    FaCamera, FaPaintBrush, FaCheck, FaExclamationTriangle,
    FaLink, FaTwitch, FaYoutube, FaTwitter, FaInstagram, FaTiktok,
    FaBirthdayCake, FaGlobeAmericas, FaUsers, FaHandshake, FaTrophy,
    FaDiscord, FaSteam, FaPlaystation, FaXbox
} from 'react-icons/fa';
import { SiRiotgames, SiEpicgames, SiNintendoswitch } from 'react-icons/si';
import PlayerTag from '../../../components/PlayerTag/PlayerTag';
import { PLAYER_TAGS } from '../../../data/playerTags';
import { FRAMES, BACKGROUNDS } from '../../../data/profileOptions';
import { EMPTY_PROFILE_PROGRESSION, normalizeProfileProgression } from '../../../data/profileProgression';
import AvatarCircle from '../../../components/AvatarCircle/AvatarCircle';
import { STATUS_LIST, DEFAULT_AVATARS } from '../../../data/defaultAvatars';
import PageHud from '../../../components/PageHud/PageHud';
import { getAuthToken } from '../../../utils/authSession';
import { applyImageFallback, getAvatarFallback, resolveMediaUrl } from '../../../utils/media';
import { isSupportedGameId, normalizeSupportedGameId } from '../../../../../shared/supportedGames.js';
import './EditProfile.css';

// ─── Game assets (todos los juegos disponibles) ───
import imgLol from '../../../assets/gameImages/lol.png';
import imgMlbb from '../../../assets/gameImages/mlbb.png';
import imgHok from '../../../assets/gameImages/hok.png';
import imgMoco from '../../../assets/gameImages/moco.png';
import imgMarvel from '../../../assets/gameImages/marvel.png';
import imgFreeFire from '../../../assets/gameImages/freefire.png';
import imgFortnite from '../../../assets/gameImages/fortnite.png';
import imgCodm from '../../../assets/gameImages/codm.png';
import imgMk11 from '../../../assets/gameImages/mk11.png';
import imgMarioKart from '../../../assets/gameImages/mariokart.png';
import imgValorant from '../../../assets/gameImages/Valorant.png';
import imgApex from '../../../assets/gameImages/Apex_Legends_logo.png';
import imgDota2 from '../../../assets/gameImages/Dota2.png';
import imgWildRift from '../../../assets/gameImages/WildRift.png';
import imgOverwatch from '../../../assets/gameImages/Overwatch2.png';
import imgClashRoyale from '../../../assets/gameImages/clashroyale.png';
import imgPubg from '../../../assets/gameImages/PubgMobile.jpg';
import imgRocket from '../../../assets/gameImages/RocketLeague.png';
import imgTft from '../../../assets/gameImages/teamfight.png';
import imgSf6 from '../../../assets/gameImages/sf6.png';
import imgTekken from '../../../assets/gameImages/Tekken8.png';
import imgSiege from '../../../assets/gameImages/Rainbow Six Siege.png';
import imgSmite from '../../../assets/gameImages/smite2.png';
import imgFifa from '../../../assets/gameImages/Fifa.png';
import imgStarcraft from '../../../assets/gameImages/StarCraft.png';
import imgHearthstone from '../../../assets/gameImages/Hearthstone-Emblem.png';
import imgRuneterra from '../../../assets/gameImages/Runeterra.jpg';
import imgGenshin from '../../../assets/gameImages/genshinImpact.png';
import imgWuwa from '../../../assets/gameImages/WutheringWaves.png';
import imgAmongUs from '../../../assets/gameImages/amongUs.png';
import imgFallGuys from '../../../assets/gameImages/FallGuys.png';
import imgMinecraft from '../../../assets/gameImages/Minecraft.png';
import imgPalworld from '../../../assets/gameImages/Palworld.png';
import imgHalo from '../../../assets/gameImages/Halo.png';
import imgWarzone from '../../../assets/gameImages/CallofDutyWarzone.png';
import imgGtaV from '../../../assets/gameImages/grandtheftautogtav.png';
import imgAov from '../../../assets/gameImages/ArenaOfValor.webp';

// Categorías de juegos
const gameCategoriesBase = [
    { id: 'all', name: 'Todos', icon: 'bx-grid-alt' },
    { id: 'moba', name: 'MOBA', icon: 'bx-shield-quarter' },
    { id: 'shooter', name: 'Shooter', icon: 'bx-crosshair' },
    { id: 'battle-royale', name: 'Battle Royale', icon: 'bx-target-lock' },
    { id: 'fighting', name: 'Pelea', icon: 'bx-boxing' },
    { id: 'sports', name: 'Deportes', icon: 'bx-football' },
    { id: 'strategy', name: 'Estrategia', icon: 'bx-chess' },
    { id: 'rpg', name: 'RPG/Aventura', icon: 'bx-map-alt' },
    { id: 'casual', name: 'Casual', icon: 'bx-happy' },
];

// Catálogo extendido para futuras integraciones.
// Editar perfil solo debe exponer los juegos con soporte real en backend.
const gameCatalog = [
    // MOBA
    { id: 'lol', name: 'League of Legends', img: imgLol, category: 'moba' },
    { id: 'mlbb', name: 'Mobile Legends', img: imgMlbb, category: 'moba' },
    { id: 'hok', name: 'Honor of Kings', img: imgHok, category: 'moba' },
    { id: 'dota2', name: 'Dota 2', img: imgDota2, category: 'moba' },
    { id: 'wildrift', name: 'Wild Rift', img: imgWildRift, category: 'moba' },
    { id: 'smite', name: 'Smite 2', img: imgSmite, category: 'moba' },
    { id: 'aov', name: 'Arena of Valor', img: imgAov, category: 'moba' },
    
    // Shooter
    { id: 'valorant', name: 'Valorant', img: imgValorant, category: 'shooter' },
    { id: 'codm', name: 'CoD Mobile', img: imgCodm, category: 'shooter' },
    { id: 'overwatch', name: 'Overwatch 2', img: imgOverwatch, category: 'shooter' },
    { id: 'siege', name: 'Rainbow Six Siege', img: imgSiege, category: 'shooter' },
    { id: 'halo', name: 'Halo Infinite', img: imgHalo, category: 'shooter' },
    { id: 'marvel', name: 'Marvel Rivals', img: imgMarvel, category: 'shooter' },
    
    // Battle Royale
    { id: 'fortnite', name: 'Fortnite', img: imgFortnite, category: 'battle-royale' },
    { id: 'freefire', name: 'Free Fire', img: imgFreeFire, category: 'battle-royale' },
    { id: 'apex', name: 'Apex Legends', img: imgApex, category: 'battle-royale' },
    { id: 'pubg', name: 'PUBG Mobile', img: imgPubg, category: 'battle-royale' },
    { id: 'warzone', name: 'Warzone', img: imgWarzone, category: 'battle-royale' },
    
    // Pelea
    { id: 'mk11', name: 'Mortal Kombat', img: imgMk11, category: 'fighting' },
    { id: 'sf6', name: 'Street Fighter 6', img: imgSf6, category: 'fighting' },
    { id: 'tekken', name: 'Tekken 8', img: imgTekken, category: 'fighting' },
    
    // Deportes
    { id: 'fifa', name: 'EA FC / FIFA', img: imgFifa, category: 'sports' },
    { id: 'rocket', name: 'Rocket League', img: imgRocket, category: 'sports' },
    { id: 'mariokart', name: 'Mario Kart', img: imgMarioKart, category: 'sports' },
    
    // Estrategia / Cartas
    { id: 'tft', name: 'Teamfight Tactics', img: imgTft, category: 'strategy' },
    { id: 'clashroyale', name: 'Clash Royale', img: imgClashRoyale, category: 'strategy' },
    { id: 'hearthstone', name: 'Hearthstone', img: imgHearthstone, category: 'strategy' },
    { id: 'runeterra', name: 'Legends of Runeterra', img: imgRuneterra, category: 'strategy' },
    { id: 'starcraft', name: 'StarCraft II', img: imgStarcraft, category: 'strategy' },
    
    // RPG / Aventura
    { id: 'genshin', name: 'Genshin Impact', img: imgGenshin, category: 'rpg' },
    { id: 'wuwa', name: 'Wuthering Waves', img: imgWuwa, category: 'rpg' },
    { id: 'palworld', name: 'Palworld', img: imgPalworld, category: 'rpg' },
    { id: 'minecraft', name: 'Minecraft', img: imgMinecraft, category: 'rpg' },
    { id: 'gtav', name: 'GTA V Online', img: imgGtaV, category: 'rpg' },
    { id: 'moco', name: 'Mo.co', img: imgMoco, category: 'rpg' },
    
    // Casual
    { id: 'amongus', name: 'Among Us', img: imgAmongUs, category: 'casual' },
    { id: 'fallguys', name: 'Fall Guys', img: imgFallGuys, category: 'casual' },
];

const allGames = gameCatalog.filter((game) => isSupportedGameId(game.id));

const gameCategories = gameCategoriesBase.filter(
    (category) => category.id === 'all' || allGames.some((game) => game.category === category.id)
);

const normalizeSelectedGameIds = (values = []) => {
    const list = Array.isArray(values) ? values : [values];
    const seen = new Set();
    const normalized = [];

    list.forEach((value) => {
        const gameId = normalizeSupportedGameId(value);
        if (!gameId || seen.has(gameId)) return;
        seen.add(gameId);
        normalized.push(gameId);
    });

    return normalized;
};

const platformsList = [
    { id: 'pc', name: 'PC', icon: 'bx-laptop' },
    { id: 'mobile', name: 'Mobile', icon: 'bx-mobile' },
    { id: 'console', name: 'Consola', icon: 'bx-joystick' }
];

const goalsList = [
    { id: 'Torneos', label: 'Torneos', icon: 'bx-joystick' },
    { id: 'Equipo', label: 'Equipo / Duo', icon: 'bx-group' },
    { id: 'Fun', label: 'Diversión', icon: 'bx-smile' }
];

const experienceLevels = [
    { id: 'Rookie', label: 'ROOKIE', desc: 'Principiante', icon: 'bx-user' },
    { id: 'Mid', label: 'MID', desc: 'Intermedio', icon: 'bx-medal' },
    { id: 'Pro', label: 'PRO', desc: 'Avanzado', icon: 'bx-trophy' }
];

const genderOptions = [
    { id: 'Masculino', label: 'Masculino' },
    { id: 'Femenino', label: 'Femenino' },
    { id: 'Otro', label: 'Otro' }
];

const countryList = [
    'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica',
    'Cuba', 'Ecuador', 'El Salvador', 'España', 'Estados Unidos', 'Guatemala',
    'Honduras', 'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú',
    'Puerto Rico', 'Rep. Dominicana', 'Uruguay', 'Venezuela'
];

const languagesList = [
    { id: 'Español', label: 'Español', flag: '🇪🇸' },
    { id: 'English', label: 'English', flag: '🇺🇸' },
    { id: 'Português', label: 'Português', flag: '🇧🇷' },
    { id: 'Français', label: 'Français', flag: '🇫🇷' },
    { id: 'Deutsch', label: 'Deutsch', flag: '🇩🇪' },
    { id: 'Italiano', label: 'Italiano', flag: '🇮🇹' }
];

const rolesList = [
    { id: 'Top', label: 'Top', icon: 'bx-shield' },
    { id: 'Jungle', label: 'Jungle', icon: 'bx-leaf' },
    { id: 'Mid', label: 'Mid', icon: 'bx-target-lock' },
    { id: 'ADC', label: 'ADC', icon: 'bx-crosshair' },
    { id: 'Support', label: 'Support', icon: 'bx-heart' },
    { id: 'Fill', label: 'Fill', icon: 'bx-shuffle' },
    { id: 'IGL', label: 'IGL', icon: 'bx-microphone' },
    { id: 'Fragger', label: 'Fragger', icon: 'bx-crosshair' },
    { id: 'Lurker', label: 'Lurker', icon: 'bx-ghost' },
    { id: 'Flex', label: 'Flex', icon: 'bx-transfer' }
];

const socialPlatforms = [
    { key: 'twitch', icon: <FaTwitch />, label: 'Twitch', placeholder: 'tu_canal', color: '#9146FF', prefix: 'twitch.tv/' },
    { key: 'youtube', icon: <FaYoutube />, label: 'YouTube', placeholder: '@tu_canal', color: '#FF0000', prefix: 'youtube.com/' },
    { key: 'twitter', icon: <FaTwitter />, label: 'X / Twitter', placeholder: '@usuario', color: '#1DA1F2', prefix: 'x.com/' },
    { key: 'instagram', icon: <FaInstagram />, label: 'Instagram', placeholder: '@usuario', color: '#E4405F', prefix: 'instagram.com/' },
    { key: 'tiktok', icon: <FaTiktok />, label: 'TikTok', placeholder: '@usuario', color: '#00f2ea', prefix: 'tiktok.com/@' },
];

const gamingConnections = [
    { key: 'discord', icon: <FaDiscord />, label: 'Discord', color: '#5865F2', description: 'Chat y comunidad', settingsKey: 'discord' },
    { key: 'riot', icon: <SiRiotgames />, label: 'Riot Games', color: '#D32936', description: 'LoL, Valorant, TFT', settingsKey: 'riot' },
    { key: 'mlbb', icon: <FaGamepad />, label: 'Mobile Legends', color: '#FF6B35', description: 'MLBB ID', settingsKey: 'mlbb' },
    { key: 'steam', icon: <FaSteam />, label: 'Steam', color: '#1b2838', description: 'PC Gaming', settingsKey: 'steam' },
    { key: 'epic', icon: <SiEpicgames />, label: 'Epic Games', color: '#2F2D2E', description: 'Fortnite, Rocket League', settingsKey: 'epic' },
    { key: 'playstation', icon: <FaPlaystation />, label: 'PlayStation', color: '#003087', description: 'PSN ID', settingsKey: 'playstation' },
    { key: 'xbox', icon: <FaXbox />, label: 'Xbox', color: '#107C10', description: 'Gamertag', settingsKey: 'xbox' },
    { key: 'nintendo', icon: <SiNintendoswitch />, label: 'Nintendo', color: '#E60012', description: 'Switch', settingsKey: 'nintendo' },
];

const EditProfile = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState(null); // { type: 'success'|'error', text }
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [gameQuery, setGameQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentUserId, setCurrentUserId] = useState('');
    const [profileProgression, setProfileProgression] = useState(EMPTY_PROFILE_PROGRESSION);
    const [userConnections, setUserConnections] = useState({ discord: {}, riot: {}, mlbb: {} }); // Real connections from Settings
    const [phoneAvailability, setPhoneAvailability] = useState({
        loading: false,
        checked: false,
        available: true,
        message: '',
        warning: false
    });

    const fetchProfileOverview = useCallback(async (token) => {
        try {
            const res = await axios.get(`${API_URL}/api/auth/profile/overview`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfileProgression(normalizeProfileProgression(res.data?.progression));
        } catch (err) {
            console.warn('No se pudo cargar el progreso del perfil:', err?.response?.status || err?.message || err);
            setProfileProgression(EMPTY_PROFILE_PROGRESSION);
        }
    }, []);

    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        country: '',
        phone: '',
        gender: 'Otro',
        birthDate: '',
        avatar: '',
        bio: '',
        selectedGames: [],
        platforms: [],
        goals: [],
        experience: [],
        languages: [],
        preferredRoles: [],
        lookingForTeam: false,
        socialLinks: { twitch: '', youtube: '', twitter: '', instagram: '', tiktok: '' },
        gamingConnections: { discord: '', riotId: '', steam: '', epic: '', playstation: '', xbox: '', nintendo: '' },
        isProfileHidden: false,
        selectedFrameId: 'none',
        selectedBgId: 'bg-1',
        status: 'online',
        selectedTagId: 'tag-obsidian',
        isOrganizer: false,
        roles: ['player'],
        roleApplications: {}
    });

    const getToken = () => getAuthToken();
    const normalizePhone = (value = '') => String(value).replace(/[^\d]/g, '');
    const isValidPhone = (value = '') => /^\d+$/.test(String(value)) && Number(value) >= 0;
    const sanitizeSocialHandle = (value = '') =>
        String(value)
            .trim()
            .replace(/^https?:\/\/(www\.)?/i, '')
            .replace(/^[a-z]+\.(com|tv)\//i, '')
            .replace(/^@+/, '');

    const renderProgressionIcon = (iconClass = '', fallback = 'bx bx-star') => {
        const safeClass = String(iconClass || fallback).trim() || fallback;
        return <i className={safeClass.startsWith('bx ') ? safeClass : fallback} aria-hidden="true" />;
    };

    // Helpers for live preview
    const currentFrame = FRAMES.find(f => f.id === formData.selectedFrameId) || FRAMES[0];
    const currentBg = BACKGROUNDS.find(b => b.id === formData.selectedBgId) || BACKGROUNDS[0];
    
    // Filtrado de juegos por categoría y búsqueda
    const filteredGames = allGames.filter(game => {
        const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
        const matchesSearch = game.name.toLowerCase().includes(gameQuery.toLowerCase().trim());
        return matchesCategory && matchesSearch;
    });

    // ─── Fetch profile from API (not stale localStorage) ───
    const fetchProfile = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) { navigate('/login'); return; }
            const [profileResult, overviewResult] = await Promise.allSettled([
                axios.get(`${API_URL}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/api/auth/profile/overview`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            if (profileResult.status !== 'fulfilled') throw profileResult.reason;
            const u = profileResult.value.data;
            setCurrentUserId(u?._id || u?.id || '');
            // Load real connections from Settings
            setUserConnections({
                discord: u.connections?.discord || {},
                riot: u.connections?.riot || {},
                mlbb: u.connections?.mlbb || {}
            });
            setFormData({
                username: u.username || '',
                fullName: u.fullName || '',
                country: u.country || '',
                phone: u.phone || '',
                gender: u.gender || 'Otro',
                birthDate: u.birthDate ? u.birthDate.split('T')[0] : '',
                avatar: resolveMediaUrl(u.avatar) || '',
                bio: u.bio || '',
                selectedGames: normalizeSelectedGameIds(u.selectedGames),
                platforms: Array.isArray(u.platforms) ? u.platforms : [],
                goals: Array.isArray(u.goals) ? u.goals : [],
                experience: Array.isArray(u.experience) ? u.experience : (u.experience ? [u.experience] : []),
                languages: Array.isArray(u.languages) ? u.languages : [],
                preferredRoles: Array.isArray(u.preferredRoles) ? u.preferredRoles : [],
                lookingForTeam: u.lookingForTeam || false,
                socialLinks: {
                    twitch: u.socialLinks?.twitch || '',
                    youtube: u.socialLinks?.youtube || '',
                    twitter: u.socialLinks?.twitter || '',
                    instagram: u.socialLinks?.instagram || '',
                    tiktok: u.socialLinks?.tiktok || ''
                },
                gamingConnections: {
                    discord: u.gamingConnections?.discord || '',
                    riotId: u.gamingConnections?.riotId || '',
                    steam: u.gamingConnections?.steam || '',
                    epic: u.gamingConnections?.epic || '',
                    playstation: u.gamingConnections?.playstation || '',
                    xbox: u.gamingConnections?.xbox || '',
                    nintendo: u.gamingConnections?.nintendo || ''
                },
                isProfileHidden: u.isProfileHidden || false,
                selectedFrameId: u.selectedFrameId || 'none',
                selectedBgId: u.selectedBgId || 'bg-1',
                status: u.status || 'online',
                selectedTagId: u.selectedTagId || 'tag-obsidian',
                isOrganizer: Boolean(u.isOrganizer),
                roles: Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : ['player'],
                roleApplications: u.roleApplications || {}
            });
            setPreview(resolveMediaUrl(u.avatar) || '');
            if (overviewResult.status === 'fulfilled') {
                setProfileProgression(normalizeProfileProgression(overviewResult.value.data?.progression));
            } else {
                setProfileProgression(EMPTY_PROFILE_PROGRESSION);
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching profile:', err);
            if (err.response?.status === 401) navigate('/login');
            setProfileProgression(EMPTY_PROFILE_PROGRESSION);
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.pathname, location.state, navigate]);

    // ─── Form handlers ───
    const updateField = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        setHasChanges(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const nextValue = type === 'checkbox'
            ? checked
            : name === 'phone'
                ? normalizePhone(value)
                : value;

        if (name === 'phone') {
            setPhoneAvailability({
                loading: false,
                checked: false,
                available: true,
                message: '',
                warning: false
            });
        }

        updateField(name, nextValue);
    };

    const toggleSelection = (field, id) => {
        setFormData(prev => {
            const list = prev[field] || [];
            const newList = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
            return { ...prev, [field]: newList };
        });
        setHasChanges(true);
    };

    const selectExperience = (lvlId) => {
        // Single-select stored as array with one element
        setFormData(prev => ({ ...prev, experience: [lvlId] }));
        setHasChanges(true);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                setSaveMsg({ type: 'error', text: 'La imagen no puede superar 5MB.' });
                return;
            }
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setHasChanges(true);
        }
    };

    const selectDefaultAvatar = (src) => {
        setFormData(prev => ({ ...prev, avatar: src }));
        setPreview(src);
        setFile(null);
        setHasChanges(true);
    };

    const handleSocialChange = (platform, value) => {
        setFormData(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, [platform]: sanitizeSocialHandle(value) }
        }));
        setHasChanges(true);
    };

    const handleGamingChange = (platform, value) => {
        setFormData(prev => ({
            ...prev,
            gamingConnections: { ...prev.gamingConnections, [platform]: value.trim() }
        }));
        setHasChanges(true);
    };

    const checkPhoneAvailability = useCallback(async (phoneValue) => {
        const normalized = normalizePhone(phoneValue);
        if (!normalized) {
            const message = 'El teléfono es obligatorio.';
            setPhoneAvailability({
                loading: false,
                checked: true,
                available: false,
                message,
                warning: false
            });
            return { available: false, message, warning: false };
        }
        if (!isValidPhone(normalized)) {
            const message = 'El teléfono debe contener solo números y no puede ser negativo.';
            setPhoneAvailability({
                loading: false,
                checked: true,
                available: false,
                message,
                warning: false
            });
            return { available: false, message, warning: false };
        }

        setPhoneAvailability({
            loading: true,
            checked: false,
            available: true,
            message: '',
            warning: false
        });

        try {
            const token = getToken();
            const endpoints = [
                `${API_URL}/api/auth/check-phone`,
                `${API_URL}/auth/check-phone`,
                `${API_URL}/check-phone`
            ];

            let response = null;
            let lastError = null;
            for (const endpoint of endpoints) {
                try {
                    response = await axios.get(endpoint, {
                        params: {
                            phone: normalized,
                            excludeUserId: currentUserId || undefined
                        },
                        headers: token ? { Authorization: `Bearer ${token}` } : undefined
                    });
                    break;
                } catch (error) {
                    if (error?.response?.status === 404 || error?.response?.status === 405) {
                        lastError = error;
                        continue;
                    }
                    throw error;
                }
            }

            if (!response) throw lastError || new Error('No se encontró endpoint de verificación de teléfono');

            const available = Boolean(response.data?.available);
            const message = available ? '' : 'Este teléfono ya está registrado.';
            setPhoneAvailability({
                loading: false,
                checked: true,
                available,
                message,
                warning: false
            });
            return { available, message, warning: false };
        } catch (error) {
            const message = 'No se pudo verificar el teléfono ahora. Se validará al guardar.';
            console.warn('No se pudo verificar teléfono en edición:', error?.response?.status || error?.message || error);
            setPhoneAvailability({
                loading: false,
                checked: true,
                available: true,
                message,
                warning: true
            });
            return { available: true, message, warning: true };
        }
    }, [API_URL, currentUserId]);

    // ─── Save ───
    const handleSave = async (e) => {
        e.preventDefault();
        if (saving) return;

        // Basic validation
        if (!formData.username.trim()) {
            setSaveMsg({ type: 'error', text: 'El nickname es obligatorio.' });
            return;
        }
        if (!formData.fullName.trim()) {
            setSaveMsg({ type: 'error', text: 'El nombre completo es obligatorio.' });
            return;
        }
        const normalizedPhone = normalizePhone(formData.phone);
        if (!normalizedPhone) {
            setSaveMsg({ type: 'error', text: 'El teléfono es obligatorio.' });
            return;
        }
        if (!isValidPhone(normalizedPhone)) {
            setSaveMsg({ type: 'error', text: 'El teléfono debe contener solo números y no puede ser negativo.' });
            return;
        }

        const phoneValidation = await checkPhoneAvailability(normalizedPhone);
        if (!phoneValidation.available) {
            setSaveMsg({ type: 'error', text: phoneValidation.message || 'Este teléfono ya está registrado.' });
            return;
        }

        setSaving(true);
        setSaveMsg(null);
        const token = getToken();
        // Only send fields that the backend allowedFields supports
        const data = new FormData();

        // String fields
        const stringFields = [
            'username', 'fullName', 'country', 'phone', 'gender',
            'avatar', 'bio', 'status', 'selectedFrameId', 'selectedBgId', 'selectedTagId'
        ];
        stringFields.forEach(key => {
            const val = key === 'phone' ? normalizedPhone : formData[key];
            if (val !== undefined && val !== null && val !== '') {
                data.append(key, val);
            }
        });

        // Date fields — only send if valid (not empty)
        if (formData.birthDate) {
            data.append('birthDate', formData.birthDate);
        }

        // Array fields — send as comma-separated (backend splits on comma)
        const arrayFields = ['selectedGames', 'platforms', 'goals', 'experience', 'languages', 'preferredRoles'];
        arrayFields.forEach(key => {
            const val = formData[key];
            if (Array.isArray(val) && val.length > 0) {
                data.append(key, val.join(','));
            }
        });
        data.append('lookingForTeam', String(Boolean(formData.lookingForTeam)));
        data.append('isProfileHidden', String(Boolean(formData.isProfileHidden)));
        data.append('socialLinks', JSON.stringify(formData.socialLinks || {}));
        data.append('gamingConnections', JSON.stringify(formData.gamingConnections || {}));

        if (file) data.append('avatarFile', file);

        try {
            const res = await axios.put(`${API_URL}/api/auth/update-profile`, data, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            // Sync localStorage for other components
            localStorage.setItem('esportefyUser', JSON.stringify(res.data));
            setSaveMsg({ type: 'success', text: '¡Perfil actualizado correctamente!' });
            setHasChanges(false);
            setFile(null);
            // Refresh formData from response
            const u = res.data;
            const normalizedSelectedGames = normalizeSelectedGameIds(u.selectedGames);
            setFormData(prev => ({
                ...prev,
                username: u.username || prev.username,
                fullName: u.fullName || prev.fullName,
                country: u.country || prev.country,
                phone: u.phone || prev.phone,
                gender: u.gender || prev.gender,
                birthDate: u.birthDate ? u.birthDate.split('T')[0] : prev.birthDate,
                avatar: resolveMediaUrl(u.avatar) || prev.avatar,
                bio: u.bio || prev.bio,
                selectedGames: Array.isArray(u.selectedGames) ? normalizedSelectedGames : prev.selectedGames,
                platforms: Array.isArray(u.platforms) ? u.platforms : prev.platforms,
                goals: Array.isArray(u.goals) ? u.goals : prev.goals,
                experience: Array.isArray(u.experience) ? u.experience : prev.experience,
                languages: Array.isArray(u.languages) ? u.languages : prev.languages,
                preferredRoles: Array.isArray(u.preferredRoles) ? u.preferredRoles : prev.preferredRoles,
                lookingForTeam: Boolean(u.lookingForTeam),
                isProfileHidden: Boolean(u.isProfileHidden),
                socialLinks: {
                    twitch: u.socialLinks?.twitch || '',
                    youtube: u.socialLinks?.youtube || '',
                    twitter: u.socialLinks?.twitter || '',
                    instagram: u.socialLinks?.instagram || '',
                    tiktok: u.socialLinks?.tiktok || ''
                },
                gamingConnections: {
                    discord: u.gamingConnections?.discord || '',
                    riotId: u.gamingConnections?.riotId || '',
                    steam: u.gamingConnections?.steam || '',
                    epic: u.gamingConnections?.epic || '',
                    playstation: u.gamingConnections?.playstation || '',
                    xbox: u.gamingConnections?.xbox || '',
                    nintendo: u.gamingConnections?.nintendo || ''
                },
                selectedFrameId: u.selectedFrameId || prev.selectedFrameId,
                selectedBgId: u.selectedBgId || prev.selectedBgId,
                selectedTagId: u.selectedTagId || prev.selectedTagId,
                status: u.status || prev.status,
                isOrganizer: typeof u.isOrganizer === 'boolean' ? u.isOrganizer : prev.isOrganizer,
            }));
            if (u.avatar) setPreview(resolveMediaUrl(u.avatar));
            await fetchProfileOverview(token);
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al guardar los cambios.';
            setSaveMsg({ type: 'error', text: msg });
        } finally {
            setSaving(false);
            // Auto-clear success message
            setTimeout(() => setSaveMsg(null), 4000);
        }
    };

    if (loading) {
        return (
            <div className="ep__loading">
                <div className="ep__spinner" />
                <p>Cargando perfil...</p>
            </div>
        );
    }

    return (
        <div className="ep fade-in">
            <PageHud page="EDITAR PERFIL" />
            
            {/* Animated background elements */}
            <div className="ep__grid-overlay" />
            
            {/* Unsaved Changes Modal */}
            {showUnsavedModal && (
                <div className="ep__unsaved-modal-overlay" onClick={() => setShowUnsavedModal(false)}>
                    <div className="ep__unsaved-modal" onClick={e => e.stopPropagation()}>
                        <div className="ep__unsaved-modal-icon">
                            <FaExclamationTriangle />
                        </div>
                        <h3 className="ep__unsaved-modal-title">Cambios sin guardar</h3>
                        <p className="ep__unsaved-modal-desc">
                            Tienes cambios pendientes que no se han guardado. ¿Qué deseas hacer?
                        </p>
                        <div className="ep__unsaved-modal-actions">
                            <button type="button" className="ep__unsaved-btn save" onClick={async () => {
                                setShowUnsavedModal(false);
                                await handleSave(new Event('submit'));
                                navigate('/profile');
                            }}>
                                <FaSave /> Guardar y salir
                            </button>
                            <button type="button" className="ep__unsaved-btn discard" onClick={() => {
                                setShowUnsavedModal(false);
                                navigate('/profile');
                            }}>
                                Descartar cambios
                            </button>
                            <button type="button" className="ep__unsaved-btn cancel" onClick={() => setShowUnsavedModal(false)}>
                                Seguir editando
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="ep__wrapper">
                {/* Header Bar */}
                <header className="ep__header">
                    <div className="ep__header-left">
                        <button type="button" className="ep__back" onClick={() => hasChanges ? setShowUnsavedModal(true) : navigate('/profile')}>
                            <FaArrowLeft />
                        </button>
                        <div className="ep__header-title">
                            <h1>Editar Perfil</h1>
                            <span>Personaliza tu identidad gamer</span>
                        </div>
                    </div>
                    <div className="ep__header-right">
                        {hasChanges && <span className="ep__unsaved">Cambios sin guardar</span>}
                    </div>
                </header>

                <div className="ep__layout">
                    {/* Sidebar */}
                    <aside className="ep__sidebar">
                        <h2>Secciones</h2>
                        <nav>
                            {[
                                { id: 'general', icon: <FaUser />, label: 'General' },
                                { id: 'social', icon: <FaLink />, label: 'Social' },
                                { id: 'customization', icon: <FaPaintBrush />, label: 'Estilo' },
                                { id: 'gamer', icon: <FaGamepad />, label: 'Gamer' },
                                { id: 'progress', icon: <FaTrophy />, label: 'Progreso' },
                                { id: 'privacy', icon: <FaLock />, label: 'Privacidad' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    className={activeTab === tab.id ? 'active' : ''}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Content */}
                    <main className="ep__content">
                        <form onSubmit={handleSave}>

                            {/* ═══ TAB: GENERAL ═══ */}
                            {activeTab === 'general' && (
                                <div className="ep__tab fade-in">
                                    <h3>Información General</h3>

                                    {/* ── SECCIÓN: FOTO DE PERFIL ── */}
                                    <div className="ep__section">
                                        <div className="ep__section-header">
                                            <span className="ep__section-icon"><FaCamera /></span>
                                            <div className="ep__section-title">
                                                <h4>Foto de Perfil</h4>
                                                <p>Tu imagen visible para otros</p>
                                            </div>
                                    </div>
                                    <div className="ep__section-content">
                                        <div className="ep__avatar-section">
                                            <img
                                                src={resolveMediaUrl(preview || formData.avatar) || `https://ui-avatars.com/api/?name=${formData.username}`}
                                                alt="Avatar"
                                                className="ep__avatar-preview"
                                                onError={(e) => applyImageFallback(e, getAvatarFallback(formData.username))}
                                            />
                                            <div className="ep__avatar-actions">
                                                <label className="ep__upload-btn">
                                                    <FaCamera /> Subir Foto
                                                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                                </label>
                                                <input
                                                    type="text"
                                                    name="avatar"
                                                    value={formData.avatar}
                                                    onChange={handleChange}
                                                    placeholder="O pega una URL de imagen..."
                                                    className="ep__url-input"
                                                />
                                                <span className="ep__file-hint">JPG, PNG o GIF. Máx 5MB.</span>
                                            </div>
                                        </div>

                                        {/* Default avatars */}
                                        <label className="ep__label">Avatares Predeterminados</label>
                                        <p className="ep__label-desc">Elige uno de nuestros avatares gaming si no quieres subir foto</p>
                                        <div className="ep__default-avatars">
                                            {DEFAULT_AVATARS.map(av => (
                                                <button
                                                    key={av.id}
                                                    type="button"
                                                    className={`ep__default-av ${formData.avatar === av.src ? 'active' : ''}`}
                                                    onClick={() => selectDefaultAvatar(av.src)}
                                                    title={av.name}
                                                >
                                                    <img src={av.src} alt={av.name} />
                                                    <span>{av.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ── SECCIÓN: INFORMACIÓN PERSONAL ── */}
                                <div className="ep__section">
                                    <div className="ep__section-header">
                                        <span className="ep__section-icon"><FaUser /></span>
                                        <div className="ep__section-title">
                                            <h4>Datos Personales</h4>
                                            <p>Información básica de tu cuenta</p>
                                        </div>
                                    </div>
                                    <div className="ep__section-content">
                                        <div className="ep__fields-grid">
                                    <div className="ep__field">
                                        <label>Nickname <span className="ep__req">*</span></label>
                                        <input type="text" name="username" value={formData.username} onChange={handleChange} maxLength={20} />
                                    </div>
                                    <div className="ep__field">
                                        <label>Nombre Completo <span className="ep__req">*</span></label>
                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} />
                                    </div>
                                    <div className="ep__field">
                                        <label>País</label>
                                        <select name="country" value={formData.country} onChange={handleChange}>
                                            <option value="">Seleccionar...</option>
                                            {countryList.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="ep__field">
                                        <label>Teléfono</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            onBlur={() => checkPhoneAvailability(formData.phone)}
                                            placeholder="Solo números (sin + ni espacios)"
                                            className={phoneAvailability.checked && !phoneAvailability.available ? 'ep__input-error' : ''}
                                        />
                                        {phoneAvailability.loading && (
                                            <span className="ep__helper-text"><i className='bx bx-loader-alt bx-spin'></i> Verificando teléfono...</span>
                                        )}
                                        {phoneAvailability.checked && !phoneAvailability.available && (
                                            <span className="ep__error-text"><i className='bx bx-error-circle'></i> {phoneAvailability.message}</span>
                                        )}
                                        {phoneAvailability.warning && (
                                            <span className="ep__helper-text"><i className='bx bx-info-circle'></i> {phoneAvailability.message}</span>
                                        )}
                                    </div>
                                    <div className="ep__field">
                                        <label>Fecha de Nacimiento</label>
                                        <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="ep__date-input" />
                                    </div>
                                    <div className="ep__field">
                                        <label>Género</label>
                                        <div className="ep__gender-row">
                                            {genderOptions.map(g => (
                                                <button
                                                    key={g.id}
                                                    type="button"
                                                    className={`ep__gender-btn ${formData.gender === g.id ? 'active' : ''}`}
                                                    onClick={() => updateField('gender', g.id)}
                                                >
                                                    {g.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                    </div>
                                </div>

                                {/* ── SECCIÓN: BIOGRAFÍA ── */}
                                <div className="ep__section">
                                    <div className="ep__section-header">
                                        <span className="ep__section-icon"><i className='bx bx-edit'></i></span>
                                        <div className="ep__section-title">
                                            <h4>Sobre Ti</h4>
                                            <p>Cuéntale al mundo quién eres</p>
                                        </div>
                                    </div>
                                    <div className="ep__section-content">
                                        <div className="ep__field ep__field--full">
                                            <label>Biografía</label>
                                            <textarea
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleChange}
                                                placeholder="Cuéntanos sobre ti, tu estilo de juego, tus metas..."
                                                rows={4}
                                                maxLength={300}
                                            />
                                            <span className="ep__char-count">{formData.bio.length}/300</span>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Roles de usuario ── */}
                                <div className="ep__section">
                                    <div className="ep__section-header">
                                        <FaUsers className="ep__section-icon" />
                                        <div className="ep__section-title">
                                            <h4>Roles en la Plataforma</h4>
                                            <p>Solicita roles adicionales para desbloquear herramientas especiales</p>
                                        </div>
                                    </div>
                                    <div className="ep__section-content">
                                        <div className="ep__roles-grid">
                                            {[
                                                { id: 'player', label: 'Jugador', icon: 'bx bx-joystick', color: '#3b82f6', locked: true },
                                                { id: 'organizer', label: 'Organizador', icon: 'bx bx-crown', color: '#f59e0b', route: '/organizer-application' },
                                                { id: 'content-creator', label: 'Creador de Contenido', icon: 'bx bx-video', color: '#c026d3', route: '/role/content-creator/apply' },
                                                { id: 'coach', label: 'Coach', icon: 'bx bx-chalkboard', color: '#d97706', route: '/role/coach/apply' },
                                                { id: 'caster', label: 'Caster', icon: 'bx bx-microphone', color: '#ef4444', route: '/role/caster/apply' },
                                                { id: 'analyst', label: 'Analista', icon: 'bx bx-line-chart', color: '#6366f1', route: '/role/analyst/apply' },
                                                { id: 'sponsor', label: 'Sponsor', icon: 'bx bx-dollar-circle', color: '#10b981', route: '/role/sponsor/apply' },
                                            ].map(role => {
                                                const userRoles = formData.roles || ['player'];
                                                const isOrganizerApproved = role.id === 'organizer' && Boolean(formData.isOrganizer);
                                                const isActive = userRoles.includes(role.id) || isOrganizerApproved;
                                                const appStatus = formData.roleApplications?.[role.id]?.status || 'none';
                                                const isPending = !isActive && appStatus === 'pending';
                                                const isApproved = isActive || appStatus === 'approved';
                                                const roleClassName = `ep__role-btn ${!role.locked && !isApproved && !isPending && role.route ? 'ep__role-btn--link' : ''} ${isApproved ? 'ep__role-btn--active' : ''} ${isPending ? 'ep__role-btn--pending' : ''} ${role.locked ? 'ep__role-btn--locked' : ''}`;
                                                const roleContent = (
                                                    <>
                                                        <i className={role.icon} style={{ color: (isApproved || isPending) ? role.color : undefined }} />
                                                        <span>{role.label}</span>
                                                        {isApproved && <FaCheck className="ep__role-check" />}
                                                        {isPending && <span className="ep__role-status ep__role-status--pending">Pendiente</span>}
                                                        {!isApproved && !isPending && !role.locked && <span className="ep__role-status ep__role-status--apply">Solicitar</span>}
                                                    </>
                                                );

                                                if (!role.locked && !isApproved && !isPending && role.route) {
                                                    return (
                                                        <Link
                                                            key={role.id}
                                                            to={role.route}
                                                            className={roleClassName}
                                                            style={{ '--role-color': role.color }}
                                                            aria-label={`Solicitar rol ${role.label}`}
                                                        >
                                                            {roleContent}
                                                        </Link>
                                                    );
                                                }

                                                return (
                                                    <div
                                                        key={role.id}
                                                        className={roleClassName}
                                                        style={{ '--role-color': role.color }}
                                                        aria-disabled="true"
                                                    >
                                                        {roleContent}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="ep__role-note">
                                            Cada solicitud abre un formulario y se envia al correo de Steliant para revision de administracion.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══ TAB: SOCIAL & CONEXIONES ═══ */}
                        {activeTab === 'social' && (
                            <div className="ep__tab fade-in">
                                <h3>Social & Conexiones</h3>

                                {/* Gaming Connections - Icon based */}
                                <div className="ep__section-header">
                                    <FaGamepad className="ep__section-icon" />
                                    <div>
                                        <label className="ep__label">Conexiones de Gaming</label>
                                        <p className="ep__label-desc">Haz clic en un icono para vincular tu cuenta.</p>
                                    </div>
                                </div>
                                <div className="ep__gaming-icons-grid">
                                    {gamingConnections.map(conn => {
                                        // Check if connected from Settings
                                        const connData = userConnections[conn.settingsKey] || {};
                                        const isConnected = conn.settingsKey === 'discord' 
                                            ? Boolean(connData.id)
                                            : conn.settingsKey === 'riot'
                                            ? Boolean(connData.verified)
                                            : conn.settingsKey === 'mlbb'
                                            ? Boolean(connData.verified || connData.verificationStatus === 'verified')
                                            : false;
                                        
                                        const displayName = conn.settingsKey === 'discord' 
                                            ? connData.username || ''
                                            : conn.settingsKey === 'riot'
                                            ? connData.gameName ? `${connData.gameName}#${connData.tagLine}` : ''
                                            : conn.settingsKey === 'mlbb'
                                            ? connData.playerId ? `ID: ${connData.playerId}` : ''
                                            : '';

                                        return (
                                            <button
                                                key={conn.key}
                                                type="button"
                                                className={`ep__gaming-icon-btn ${isConnected ? 'connected' : ''}`}
                                                onClick={() => navigate('/settings', { state: { activeTab: 'connections' } })}
                                                style={{ '--conn-color': conn.color }}
                                            >
                                                <div className="ep__gaming-icon-circle">
                                                    {conn.icon}
                                                    {isConnected && (
                                                        <div className="ep__gaming-check">
                                                            <FaCheck />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="ep__gaming-label">{conn.label}</span>
                                                {isConnected ? (
                                                    <span className="ep__gaming-username">{displayName}</span>
                                                ) : (
                                                    <span className="ep__gaming-pending">Vincular</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Social links */}
                                <div className="ep__section-header" style={{ marginTop: '30px' }}>
                                    <FaLink className="ep__section-icon" />
                                    <div>
                                        <label className="ep__label">Redes Sociales</label>
                                        <p className="ep__label-desc">Agrega tus redes para que otros jugadores te encuentren.</p>
                                    </div>
                                </div>
                                <div className="ep__social-grid">
                                    {socialPlatforms.map(social => (
                                        <div key={social.key} className="ep__social-item">
                                            <div className="ep__social-icon" style={{ color: social.color }}>
                                                {social.icon}
                                            </div>
                                            <div className="ep__social-input-wrap">
                                                <span className="ep__social-prefix">{social.prefix}</span>
                                                <input
                                                    type="text"
                                                    value={formData.socialLinks[social.key]}
                                                    onChange={e => handleSocialChange(social.key, e.target.value)}
                                                    placeholder={social.placeholder}
                                                    className="ep__social-input"
                                                />
                                            </div>
                                            {formData.socialLinks[social.key] && (
                                                <div className="ep__social-check">
                                                    <FaCheck />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Languages */}
                                <div className="ep__section-header" style={{ marginTop: '30px' }}>
                                    <FaGlobeAmericas className="ep__section-icon" />
                                    <div>
                                        <label className="ep__label">Idiomas</label>
                                        <p className="ep__label-desc">¿En qué idiomas puedes comunicarte con tu equipo?</p>
                                    </div>
                                </div>
                                <div className="ep__chips-row">
                                    {languagesList.map(lang => (
                                        <div
                                            key={lang.id}
                                            className={`ep__chip ep__chip--lang ${formData.languages.includes(lang.id) ? 'selected' : ''}`}
                                            onClick={() => toggleSelection('languages', lang.id)}
                                        >
                                            <span className="ep__chip-flag">{lang.flag}</span> {lang.label}
                                        </div>
                                    ))}
                                </div>

                                {/* Looking for team */}
                                <label className="ep__label" style={{ marginTop: '20px' }}>Búsqueda de Equipo</label>
                                <div className="ep__lft-card">
                                    <div className="ep__lft-info">
                                        <FaUsers className="ep__lft-icon" />
                                        <div>
                                            <h4>Buscando Equipo / Duo</h4>
                                            <p>Activa esto para que otros jugadores y organizadores sepan que estás disponible.</p>
                                        </div>
                                    </div>
                                    <label className="ep__switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.lookingForTeam}
                                            onChange={e => updateField('lookingForTeam', e.target.checked)}
                                        />
                                        <span className="ep__switch-slider" />
                                    </label>
                                    {formData.lookingForTeam && (
                                        <div className="ep__lft-active">
                                            <FaHandshake /> Visible para reclutadores
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ═══ TAB: CUSTOMIZATION ═══ */}
                        {activeTab === 'customization' && (
                            <div className="ep__tab fade-in">
                                <h3>Estilo Visual</h3>

                                {/* Live preview */}
                                <div className="ep__live-preview" style={{ backgroundImage: `url(${currentBg.src})` }}>
                                    <div className="ep__preview-overlay" />
                                    <div className="ep__preview-center">
                                        <AvatarCircle
                                            src={resolveMediaUrl(preview || formData.avatar) || `https://ui-avatars.com/api/?name=${formData.username}`}
                                            frameConfig={currentFrame}
                                            size="120px"
                                            status={formData.status}
                                        />
                                        <div style={{ marginTop: '15px' }}>
                                            <PlayerTag
                                                name={formData.username || "Player"}
                                                tagId={formData.selectedTagId}
                                                size="normal"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Status selector */}
                                <label className="ep__label">Tu Estado</label>
                                <div className="ep__status-grid">
                                    {STATUS_LIST.map(status => (
                                        <button
                                            key={status.id}
                                            type="button"
                                            className={`ep__status-btn ${formData.status === status.id ? 'active' : ''}`}
                                            onClick={() => updateField('status', status.id)}
                                            style={{ '--status-color': status.color }}
                                        >
                                            <span className="ep__status-indicator">
                                                <span className="ep__status-dot-bg" style={{ backgroundColor: status.color }} />
                                                <i className={`bx ${status.icon}`} style={{ color: status.color }} />
                                            </span>
                                            <span className="ep__status-text">
                                                <span className="ep__status-label">{status.label}</span>
                                                <span className="ep__status-desc">{status.desc}</span>
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Player tags */}
                                <label className="ep__label">Placa de Jugador</label>
                                <div className="ep__tags-grid">
                                    {PLAYER_TAGS.map(tag => (
                                        <div
                                            key={tag.id}
                                            className={`ep__tag-option ${formData.selectedTagId === tag.id ? 'active' : ''}`}
                                            onClick={() => updateField('selectedTagId', tag.id)}
                                        >
                                            <PlayerTag name="Preview" tagId={tag.id} size="small" />
                                        </div>
                                    ))}
                                </div>

                                {/* Frame selector */}
                                <label className="ep__label">Marco de Avatar</label>
                                <div className="ep__frames-grid">
                                    {FRAMES.map(frame => (
                                        <div
                                            key={frame.id}
                                            className={`ep__frame-card ${formData.selectedFrameId === frame.id ? 'active' : ''}`}
                                            onClick={() => updateField('selectedFrameId', frame.id)}
                                        >
                                            <div className="ep__frame-preview">
                                                {frame.type === 'image' ? (
                                                    <img src={frame.src} alt={frame.name} />
                                                ) : (
                                                    <div className="ep__frame-dot" style={{ borderColor: frame.color || '#555' }} />
                                                )}
                                            </div>
                                            <span>{frame.name}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Background selector */}
                                <label className="ep__label">Fondo de Perfil</label>
                                <div className="ep__bg-grid">
                                    {BACKGROUNDS.map(bg => (
                                        <div
                                            key={bg.id}
                                            className={`ep__bg-card ${formData.selectedBgId === bg.id ? 'active' : ''}`}
                                            onClick={() => updateField('selectedBgId', bg.id)}
                                        >
                                            <img src={bg.src} alt={bg.name} loading="lazy" />
                                            {formData.selectedBgId === bg.id && <div className="ep__bg-check"><FaCheck /></div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ═══ TAB: GAMER ═══ */}
                        {activeTab === 'gamer' && (
                            <div className="ep__tab fade-in">
                                <h3>Perfil de Jugador</h3>

                                {/* Experience level */}
                                <label className="ep__label">Nivel de Experiencia</label>
                                <div className="ep__levels-row">
                                    {experienceLevels.map(lvl => (
                                        <div
                                            key={lvl.id}
                                            className={`ep__level-card ${formData.experience.includes(lvl.id) ? 'selected' : ''}`}
                                            onClick={() => selectExperience(lvl.id)}
                                        >
                                            <i className={`bx ${lvl.icon} ep__level-icon`} />
                                            <div className="ep__level-info">
                                                <span className="ep__level-label">{lvl.label}</span>
                                                <span className="ep__level-desc">{lvl.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Preferred Roles */}
                                <label className="ep__label">Roles Preferidos</label>
                                <p className="ep__label-desc">Selecciona los roles que sueles jugar.</p>
                                <div className="ep__roles-grid">
                                    {rolesList.map(role => (
                                        <div
                                            key={role.id}
                                            className={`ep__role-chip ${formData.preferredRoles.includes(role.id) ? 'selected' : ''}`}
                                            onClick={() => toggleSelection('preferredRoles', role.id)}
                                        >
                                            <i className={`bx ${role.icon}`} />
                                            <span>{role.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Games */}
                                <label className="ep__label">Tus Juegos</label>
                                <p className="ep__label-desc">Selecciona los juegos que juegas. Puedes filtrar por categoría.</p>
                                
                                {/* Categorías */}
                                <div className="ep__categories-row">
                                    {gameCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            className={`ep__category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                                            onClick={() => setSelectedCategory(cat.id)}
                                        >
                                            <i className={`bx ${cat.icon}`} />
                                            <span>{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Toolbar con búsqueda */}
                                <div className="ep__games-toolbar">
                                    <div className="ep__games-search-wrap">
                                        <i className='bx bx-search'></i>
                                        <input
                                            type="text"
                                            value={gameQuery}
                                            onChange={(e) => setGameQuery(e.target.value)}
                                            placeholder="Buscar juego..."
                                            className="ep__games-search"
                                        />
                                        {gameQuery && (
                                            <button 
                                                type="button" 
                                                className="ep__search-clear"
                                                onClick={() => setGameQuery('')}
                                            >
                                                <i className='bx bx-x'></i>
                                            </button>
                                        )}
                                    </div>
                                    <div className="ep__games-actions">
                                        <span className="ep__games-count">
                                            <i className='bx bx-check-circle'></i> {formData.selectedGames.length} seleccionados
                                        </span>
                                        <button
                                            type="button"
                                            className="ep__mini-btn ep__mini-btn--danger"
                                            onClick={() => updateField('selectedGames', [])}
                                            disabled={formData.selectedGames.length === 0}
                                        >
                                            Limpiar
                                        </button>
                                        <button
                                            type="button"
                                            className="ep__mini-btn"
                                            onClick={() => updateField('selectedGames', allGames.slice(0, 3).map(g => g.id))}
                                        >
                                            Sugeridos
                                        </button>
                                    </div>
                                </div>
                                <p className="ep__games-note">
                                    Por ahora solo puedes usar juegos con soporte activo en perfil: League of Legends, Valorant y Mobile Legends.
                                </p>
                                <div className="ep__games-grid">
                                    {filteredGames.map(game => (
                                        <div
                                            key={game.id}
                                            className={`ep__game-card ${formData.selectedGames.includes(game.id) ? 'selected' : ''}`}
                                            onClick={() => toggleSelection('selectedGames', game.id)}
                                        >
                                            <div className="ep__game-img"><img src={game.img} alt={game.name} /></div>
                                            <span>{game.name}</span>
                                            {formData.selectedGames.includes(game.id) && (
                                                <div className="ep__game-check"><i className='bx bx-check'></i></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {filteredGames.length === 0 && (
                                    <div className="ep__games-empty">
                                        <i className='bx bx-search-alt'></i>
                                        <p>No encontramos juegos con "{gameQuery}"</p>
                                        <button type="button" onClick={() => { setGameQuery(''); setSelectedCategory('all'); }}>
                                            Ver todos
                                        </button>
                                    </div>
                                )}

                                {/* Platforms */}
                                <label className="ep__label">Plataformas</label>
                                <div className="ep__chips-row">
                                    {platformsList.map(p => (
                                        <div
                                            key={p.id}
                                            className={`ep__chip ${formData.platforms.includes(p.id) ? 'selected' : ''}`}
                                            onClick={() => toggleSelection('platforms', p.id)}
                                        >
                                            <i className={`bx ${p.icon}`} /> {p.name}
                                        </div>
                                    ))}
                                </div>

                                {/* Goals */}
                                <label className="ep__label">¿Qué buscas?</label>
                                <div className="ep__chips-row">
                                    {goalsList.map(goal => (
                                        <div
                                            key={goal.id}
                                            className={`ep__chip ${formData.goals.includes(goal.id) ? 'selected' : ''}`}
                                            onClick={() => toggleSelection('goals', goal.id)}
                                        >
                                            <i className={`bx ${goal.icon}`} /> {goal.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ═══ TAB: PRIVACY ═══ */}
                        {activeTab === 'progress' && (
                            <div className="ep__tab fade-in">
                                <h3>Progreso y Logros</h3>

                                <div className="ep__progress-hero">
                                    <div className="ep__progress-main">
                                        <span className="ep__progress-kicker">Puntos de perfil</span>
                                        <strong>{Number(profileProgression.totalPoints || 0).toLocaleString('es-ES')}</strong>
                                        <div className="ep__progress-level-row">
                                            <span className="ep__progress-level">{profileProgression.level.name}</span>
                                            <span className="ep__progress-next">
                                                {profileProgression.level.pointsNeeded > 0
                                                    ? `${profileProgression.level.pointsNeeded} para ${profileProgression.level.nextLevelName}`
                                                    : 'Nivel maximo alcanzado'}
                                            </span>
                                        </div>
                                        <div className="ep__progress-bar">
                                            <div style={{ width: `${profileProgression.level.progressPercent}%` }} />
                                        </div>
                                        <p className="ep__progress-note">
                                            Los puntos se calculan automaticamente segun tus acciones dentro de GlitchGang:
                                            completar el perfil, conectar cuentas, jugar, publicar y competir.
                                        </p>
                                    </div>

                                    <div className="ep__progress-highlights">
                                        {profileProgression.highlights.map((item) => (
                                            <div key={item.id} className="ep__progress-highlight">
                                                <span className="ep__progress-highlight-icon">
                                                    {renderProgressionIcon(item.iconClass)}
                                                </span>
                                                <div>
                                                    <strong>{Number(item.value || 0).toLocaleString('es-ES')}</strong>
                                                    <span>{item.label}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="ep__section">
                                    <div className="ep__section-header">
                                        <span className="ep__section-icon"><FaTrophy /></span>
                                        <div className="ep__section-title">
                                            <h4>Como se ganan los puntos</h4>
                                            <p>Desglose automatico por acciones dentro de la plataforma</p>
                                        </div>
                                    </div>
                                    <div className="ep__section-content">
                                        <div className="ep__points-grid">
                                            {profileProgression.pointSources.map((source) => (
                                                <div key={source.id} className="ep__points-card">
                                                    <div className="ep__points-card-top">
                                                        <strong>{source.label}</strong>
                                                        <span>{source.awardedPoints}/{source.maxPoints} pts</span>
                                                    </div>
                                                    <p>{source.description}</p>
                                                    <div className="ep__points-card-meta">
                                                        <span>{source.progressLabel}</span>
                                                        <span>{source.progressPercent}%</span>
                                                    </div>
                                                    <div className="ep__points-card-bar">
                                                        <div style={{ width: `${source.progressPercent}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="ep__section">
                                    <div className="ep__section-header">
                                        <span className="ep__section-icon"><i className='bx bx-medal' /></span>
                                        <div className="ep__section-title">
                                            <h4>20 logros desbloqueables</h4>
                                            <p>{profileProgression.unlockedAchievements}/{profileProgression.totalAchievements} desbloqueados</p>
                                        </div>
                                    </div>
                                    <div className="ep__section-content">
                                        <div className="ep__achievements-grid">
                                            {profileProgression.achievements.map((achievement) => (
                                                <div
                                                    key={achievement.id}
                                                    className={`ep__achievement-card ${achievement.unlocked ? 'is-unlocked' : ''}`}
                                                >
                                                    <div className="ep__achievement-card-top">
                                                        <span
                                                            className="ep__achievement-icon"
                                                            style={{ '--ach-color': achievement.accentColor }}
                                                        >
                                                            {renderProgressionIcon(achievement.iconClass, 'bx bx-trophy')}
                                                        </span>
                                                        <span className={`ep__achievement-status ${achievement.unlocked ? 'is-unlocked' : 'is-locked'}`}>
                                                            {achievement.unlocked ? 'Desbloqueado' : 'En progreso'}
                                                        </span>
                                                    </div>
                                                    <strong className="ep__achievement-title">{achievement.name}</strong>
                                                    <p className="ep__achievement-desc">{achievement.description}</p>
                                                    <div className="ep__achievement-meta">
                                                        <span>{achievement.progressLabel}</span>
                                                        <span>{achievement.category}</span>
                                                    </div>
                                                    <div className="ep__achievement-bar">
                                                        <div
                                                            style={{
                                                                width: `${achievement.progressPercent}%`,
                                                                background: achievement.accentColor
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'privacy' && (
                            <div className="ep__tab fade-in">
                                <h3>Privacidad</h3>
                                <div className="ep__privacy-option">
                                    <div>
                                        <h4>Ocultar Perfil</h4>
                                        <p>Nadie podrá ver tu perfil en búsquedas globales.</p>
                                    </div>
                                    <label className="ep__switch">
                                        <input type="checkbox" name="isProfileHidden" checked={formData.isProfileHidden} onChange={handleChange} />
                                        <span className="ep__switch-slider" />
                                    </label>
                                </div>
                                <div className="ep__privacy-alert">
                                    <h4>Zona de Seguridad</h4>
                                    <p>Para cambiar contraseña o email, usa la sección de <strong>Configuración</strong>.</p>
                                    <button type="button" className="ep__btn-link" onClick={() => navigate('/settings')}>
                                        Ir a Configuración
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Save bar */}
                        <div className="ep__save-bar">
                            {saveMsg && (
                                <div className={`ep__toast ep__toast--${saveMsg.type}`}>
                                    {saveMsg.type === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
                                    {saveMsg.text}
                                </div>
                            )}
                            <button type="submit" className="ep__save-btn" disabled={saving}>
                                {saving ? (
                                    <><div className="ep__save-spinner" /> Guardando...</>
                                ) : (
                                    <><FaSave /> Guardar Cambios</>
                                )}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
            </div>
        </div>
    );
};

export default EditProfile;
