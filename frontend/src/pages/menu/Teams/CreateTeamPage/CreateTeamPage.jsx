import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { esportsCatalog } from '../../../../data/esportsCatalog.jsx'; 
import { 
    FaCamera, FaUser, FaUserAstronaut, FaCheckCircle, FaPlus, FaWhatsapp, 
    FaArrowLeft, FaIdCard, FaGlobe, FaTrophy, FaVenusMars, FaLanguage, 
    FaMapMarkerAlt, FaCheck, FaCopy, FaSearch, FaDiscord, FaTwitter, 
    FaFacebook, FaPaperPlane, FaGamepad, FaUpload, FaLock
} from 'react-icons/fa';
import { withCsrfHeaders } from '../../../../utils/csrf';
import { useNotification } from '../../../../context/NotificationContext';
import { useAuth } from '../../../../context/AuthContext';
import { API_URL } from '../../../../config/api';
import { isMlbbVerifiedStatus, normalizeMlbbVerificationStatus } from '../../../../utils/mlbbStatus';
import './CreateTeamPage.css';

// Configuración de Roles Visuales
const ROLE_NAMES = {
    "Mobile Legends": ["EXP", "Gold", "Mid", "Jungla", "Roam"],
    "League of Legends": ["Top", "Jungle", "Mid", "ADC", "Supp"],
    "Wild Rift": ["Baron", "Jungle", "Mid", "Dragon", "Supp"],
    "Valorant": ["Duelist", "Sentinel", "Controller", "Initiator", "Flex"],
    "CS2": ["Entry", "AWPer", "Lurker", "Support", "IGL"],
    "Overwatch 2": ["Tank", "DPS", "DPS", "Support", "Support"],
    "Rainbow Six Siege": ["Entry", "Support", "Flex", "Hard Breach", "Anchor"],
    "TFT": ["Tactician"],
    "FIFA / EA FC": ["Player"],
    "NBA 2K": ["Player"],
    "F1 2024": ["Driver"],
    "Rocket League": ["Striker", "Midfielder", "Defender"],
    "Free Fire": ["Rusher", "Support", "Sniper", "IGL"],
    "Fortnite": ["Fragger", "IGL", "Support", "Builder"],
    "PUBG": ["Fragger", "IGL", "Support", "Scout"],
    "Apex Legends": ["Fragger", "IGL", "Support"],
    "Warzone": ["Slayer", "IGL", "Scout", "Support"],
    "Call of Duty": ["Slayer", "OBJ", "Support", "Flex"],
    "Dota 2": ["Carry", "Mid", "Offlane", "Soft Supp", "Hard Supp"],
    "Smite 2": ["Carry", "Mid", "Solo", "Jungle", "Support"],
    "Street Fighter 6": ["Fighter"],
    "Tekken 8": ["Fighter"],
    "Super Smash Bros": ["Fighter"],
    "Mortal Kombat 1": ["Fighter"],
    "Clash Royale": ["Player"],
    "Hearthstone": ["Player"],
    "Legends of Runeterra": ["Player"]
};

const RIOT_GAMES = new Set([
    'Valorant',
    'League of Legends',
    'Wild Rift',
    'Teamfight Tactics',
    'Legends of Runeterra'
]);
const MLBB_GAMES = new Set([
    'Mobile Legends',
    'Mobile Legends: Bang Bang',
    'MLBB'
]);

const CUSTOM_OPTION = '__custom__';

const COUNTRY_OPTIONS = [
    'República Dominicana',
    'México',
    'Colombia',
    'Argentina',
    'Chile',
    'Perú',
    'España',
    'Estados Unidos',
    'Canadá',
    'Brasil',
    'Internacional'
];

const RIOT_REGION_OPTIONS = [
    'LATAM',
    'LAS',
    'LAN',
    'NA',
    'BR',
    'EUW',
    'EUNE',
    'TR',
    'RU',
    'OCE',
    'KR',
    'JP',
    'PH',
    'SG',
    'TH',
    'TW',
    'VN'
];

const MLBB_REGION_OPTIONS = [
    'LATAM',
    'NA',
    'EU',
    'MENA',
    'SEA',
    'PH',
    'ID',
    'MY',
    'SG'
];

const DEFAULT_REGION_OPTIONS = ['LATAM', 'NA', 'EU', 'BR', 'SEA', 'Global'];
const MAX_LOGO_BYTES = 8 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const normalizeText = (value) => String(value || '').trim().toLowerCase();

const CreateTeamPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useNotification();
    const { user: authUser } = useAuth();
    const presetTeamLevel = useMemo(() => {
        const params = new URLSearchParams(location.search || '');
        const raw = String(params.get('teamLevel') || '').trim().toLowerCase();
        return raw === 'universitario' ? 'Universitario' : '';
    }, [location.search]);
    
    // --- ESTADOS Y DATOS ---
    const storedUser = useMemo(() => {
        const userString = localStorage.getItem('esportefyUser') || sessionStorage.getItem('esportefyUser');
        if (!userString) return { name: "Usuario" };
        try {
            return JSON.parse(userString);
        } catch (_) {
            return { name: "Usuario" };
        }
    }, []);
    const currentUser = authUser || storedUser;
    const currentUserId = String(currentUser?._id || currentUser?.id || '');

    const riotVerified = Boolean(currentUser?.connections?.riot?.verified);
    const riotGameName = String(currentUser?.connections?.riot?.gameName || '');
    const riotTagLine = String(currentUser?.connections?.riot?.tagLine || '');
    const riotRegionRaw =
        currentUser?.gameProfiles?.lol?.platformRegion ||
        currentUser?.gameProfiles?.valorant?.shard ||
        currentUser?.connections?.riot?.accountRegion ||
        '';
    const mlbbVerified = isMlbbVerifiedStatus(
        normalizeMlbbVerificationStatus(
            currentUser?.connections?.mlbb?.verificationStatus,
            currentUser?.connections?.mlbb?.verified
        ),
        currentUser?.connections?.mlbb?.verified
    );
    const mlbbPlayerId = String(currentUser?.connections?.mlbb?.playerId || '');
    const mlbbZoneId = String(currentUser?.connections?.mlbb?.zoneId || '');
    const currentUserUniversity = currentUser?.university || {};
    const currentUserUniversityVerified = Boolean(currentUserUniversity?.verified && currentUserUniversity?.universityId);
    
    const [step, setStep] = useState(1);
    const [logoPreview, setLogoPreview] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [createdTeamId, setCreatedTeamId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [friendsList, setFriendsList] = useState([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [inviteBusyByUser, setInviteBusyByUser] = useState({});
    const [invitedUserIds, setInvitedUserIds] = useState(new Set());
    const [reservedInviteSlots, setReservedInviteSlots] = useState([]);
    const [useCustomCountry, setUseCustomCountry] = useState(false);
    const [useCustomRegion, setUseCustomRegion] = useState(false);

    // Datos del formulario COMPLETO
    const [formData, setFormData] = useState({
        // Identidad
        name: '', 
        slogan: '', 
        category: '',
        game: '',
        // Perfil de Escuadra
        teamGender: 'Mixto',      
        teamCountry: '',          
        teamLevel: presetTeamLevel || 'Amateur',     
        teamLanguage: 'Español',  
        // Lógica interna
        maxMembers: 0, 
        maxSubstitutes: 0, 
        // Datos Capitán
        leaderRealName: '', 
        leaderIgn: '',      
        leaderGameId: '',   
        leaderRegion: '',   
        leaderRole: '' 
    });

    // Roster
    const [roster, setRoster] = useState({ starters: [], subs: [], coach: null });

    // Modal - Datos del Slot (AHORA CON FOTO)
    const [modalOpen, setModalOpen] = useState(false);
    const [currentSlot, setCurrentSlot] = useState(null); 
    const [slotData, setSlotData] = useState({ 
        nickname: '', 
        gameId: '', 
        region: '', 
        email: '', 
        role: '',
        photo: null // Nuevo campo para la foto del jugador/coach
    });

    // --- FUNCIONES ---

    const getThemeClass = () => {
        if (!formData.game) return 'theme-default';
        const cat = Object.keys(esportsCatalog).find(c => esportsCatalog[c][formData.game]);
        if (cat === 'FPS (Shooters)') return 'theme-fps';
        if (cat === 'MOBA') return 'theme-moba';
        if (cat === 'Fighting') return 'theme-fighting';
        if (cat === 'Battle Royale') return 'theme-fps';
        if (cat === 'Sports & Racing') return 'theme-default';
        if (cat === 'Estrategia / Táctico') return 'theme-moba';
        return 'theme-default';
    };

    const getRegionOptionsByGame = (gameName) => {
        const normalized = String(gameName || '').trim();
        if (RIOT_GAMES.has(normalized)) return RIOT_REGION_OPTIONS;
        if (MLBB_GAMES.has(normalized)) return MLBB_REGION_OPTIONS;
        return DEFAULT_REGION_OPTIONS;
    };

    const regionOptions = useMemo(() => {
        const base = [...getRegionOptionsByGame(formData.game)];
        if (formData.leaderRegion && !base.includes(formData.leaderRegion)) {
            return [formData.leaderRegion, ...base];
        }
        return base;
    }, [formData.game, formData.leaderRegion]);
    const selectedGameRoles = useMemo(() => ROLE_NAMES[formData.game] || [], [formData.game]);

    const mapRiotRegion = (raw) => {
        const value = String(raw || '').toLowerCase().trim();
        const map = {
            la1: 'LAS',
            la2: 'LAS',
            na1: 'NA',
            br1: 'BR',
            euw1: 'EUW',
            eun1: 'EUNE',
            tr1: 'TR',
            ru: 'RU',
            oc1: 'OCE',
            kr: 'KR',
            jp1: 'JP',
            ph2: 'PH',
            sg2: 'SG',
            th2: 'TH',
            tw2: 'TW',
            vn2: 'VN',
            na: 'NA',
            br: 'BR',
            latam: 'LATAM',
            americas: 'LATAM',
            eu: 'EUW'
        };
        return map[value] || '';
    };

    useEffect(() => {
        if (!RIOT_GAMES.has(String(formData.game || '').trim())) return;
        if (!riotVerified) return;
        const gameName = riotGameName;
        const tagLine = riotTagLine;
        const regionRaw = riotRegionRaw;
        const region = mapRiotRegion(regionRaw);

        setFormData((prev) => {
            const nextIgn = gameName || prev.leaderIgn;
            const nextGameId = tagLine || prev.leaderGameId;
            const nextRegion = prev.leaderRegion || region;
            if (
                prev.leaderIgn === nextIgn &&
                prev.leaderGameId === nextGameId &&
                prev.leaderRegion === nextRegion
            ) {
                return prev;
            }
            return {
                ...prev,
                leaderIgn: nextIgn,
                leaderGameId: nextGameId,
                leaderRegion: nextRegion
            };
        });
    }, [formData.game, riotVerified, riotGameName, riotTagLine, riotRegionRaw]);

    useEffect(() => {
        if (!MLBB_GAMES.has(String(formData.game || '').trim())) return;
        if (!mlbbVerified) return;
        const playerId = mlbbPlayerId;
        const zoneId = mlbbZoneId;

        setFormData((prev) => {
            if (prev.leaderGameId === playerId && prev.leaderRegion === zoneId) {
                return prev;
            }
            return {
                ...prev,
                leaderGameId: playerId,
                leaderRegion: zoneId
            };
        });
    }, [formData.game, mlbbVerified, mlbbPlayerId, mlbbZoneId]);

    const lockMlbbIdentity = useMemo(
        () => MLBB_GAMES.has(String(formData.game || '').trim()) && mlbbVerified,
        [formData.game, mlbbVerified]
    );
    const riotLinked = useMemo(
        () => riotVerified,
        [riotVerified]
    );
    const mlbbLinked = useMemo(
        () => {
            const status = normalizeMlbbVerificationStatus(
                currentUser?.connections?.mlbb?.verificationStatus,
                currentUser?.connections?.mlbb?.verified
            );
            return isMlbbVerifiedStatus(status, currentUser?.connections?.mlbb?.verified);
        },
        [currentUser]
    );
    const isRiotGame = useMemo(
        () => RIOT_GAMES.has(String(formData.game || '').trim()),
        [formData.game]
    );
    const isMlbbGameSelected = useMemo(
        () => MLBB_GAMES.has(String(formData.game || '').trim()),
        [formData.game]
    );
    const isUniversityTeamSelected = useMemo(
        () => normalizeText(formData.teamLevel) === 'universitario',
        [formData.teamLevel]
    );
    const lockRiotIdentity = useMemo(
        () => isRiotGame && riotLinked && Boolean(riotTagLine),
        [isRiotGame, riotLinked, riotTagLine]
    );
    const requiresLinkedAccount = useMemo(
        () => isRiotGame || isMlbbGameSelected,
        [isRiotGame, isMlbbGameSelected]
    );
    const hasRequiredLink = useMemo(() => {
        if (!requiresLinkedAccount) return true;
        if (isRiotGame) return riotLinked;
        if (isMlbbGameSelected) return mlbbLinked;
        return true;
    }, [requiresLinkedAccount, isRiotGame, isMlbbGameSelected, riotLinked, mlbbLinked]);
    const requiredLinkMessage = useMemo(() => {
        if (!requiresLinkedAccount) return '';
        if (isRiotGame) return 'Este juego requiere cuenta Riot vinculada y verificada en Conexiones.';
        if (isMlbbGameSelected) return 'Este juego requiere cuenta MLBB verificada en Conexiones.';
        return '';
    }, [requiresLinkedAccount, isRiotGame, isMlbbGameSelected]);
    const universityRequirementMessage = useMemo(() => {
        if (!isUniversityTeamSelected) return '';
        return 'Los equipos universitarios solo pueden crearse con una universidad verificada en tu perfil.';
    }, [isUniversityTeamSelected]);
    const mlbbManualRosterSlots = useMemo(() => {
        if (!isMlbbGameSelected) return [];
        const captainUserId = String(currentUser?._id || currentUser?.id || '');
        const players = []
            .concat(Array.isArray(roster.starters) ? roster.starters : [])
            .concat(Array.isArray(roster.subs) ? roster.subs : []);

        return players.filter((slot) => {
            if (!slot) return false;
            const filled = Boolean(slot.user || slot.nickname || slot.gameId || slot.region || slot.email || slot.role);
            if (!filled) return false;
            return String(slot.user || '') !== captainUserId;
        });
    }, [isMlbbGameSelected, roster, currentUser]);
    const universityManualRosterSlots = useMemo(() => {
        if (!isUniversityTeamSelected) return [];
        const captainUserId = String(currentUser?._id || currentUser?.id || '');
        const players = []
            .concat(Array.isArray(roster.starters) ? roster.starters : [])
            .concat(Array.isArray(roster.subs) ? roster.subs : []);

        return players.filter((slot) => {
            if (!slot) return false;
            const filled = Boolean(slot.user || slot.nickname || slot.gameId || slot.region || slot.email || slot.role);
            if (!filled) return false;
            return String(slot.user || '') !== captainUserId;
        });
    }, [isUniversityTeamSelected, roster, currentUser]);

    useEffect(() => {
        if (!presetTeamLevel) return;
        setFormData((prev) => (
            prev.teamLevel === presetTeamLevel
                ? prev
                : { ...prev, teamLevel: presetTeamLevel }
        ));
    }, [presetTeamLevel]);

    useEffect(() => {
        if (formData.teamCountry && !COUNTRY_OPTIONS.includes(formData.teamCountry)) {
            setUseCustomCountry(true);
        }
    }, [formData.teamCountry]);

    useEffect(() => {
        if (lockMlbbIdentity) {
            setUseCustomRegion(false);
        }
    }, [lockMlbbIdentity]);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!ALLOWED_LOGO_TYPES.has(file.type)) {
                addToast('Logo inválido. Usa JPG, PNG o WEBP.', 'error');
                e.target.value = '';
                return;
            }
            if (file.size > MAX_LOGO_BYTES) {
                addToast('El logo excede 8MB.', 'error');
                e.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    // Función para subir foto del jugador en el modal
    const handlePlayerPhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSlotData({ ...slotData, photo: reader.result });
            reader.readAsDataURL(file);
        }
    };

    const handleGameChange = (e) => {
        const gameName = e.target.value;
        if (!gameName) {
            setFormData(prev => ({ ...prev, game: '', maxMembers: 0, maxSubstitutes: 0, leaderRole: '' }));
            return;
        }
        
        const rules = esportsCatalog[selectedCategory][gameName];
        const defaultRole = (ROLE_NAMES[gameName] && ROLE_NAMES[gameName][0]) ? ROLE_NAMES[gameName][0] : '';
        setFormData(prev => ({
            ...prev, game: gameName, 
            maxMembers: rules.maxPlayers, 
            maxSubstitutes: rules.maxSubs,
            leaderRole: defaultRole
        }));

        setRoster({
            starters: Array(rules.maxPlayers).fill(null),
            subs: Array(rules.maxSubs).fill(null),
            coach: null
        });
    };

    useEffect(() => {
        if (step !== 2) return;
        if (!formData.game || !formData.leaderIgn) return;
        const captainUserId = String(currentUser?._id || currentUser?.id || '');
        const captainPayload = {
            user: captainUserId || null,
            nickname: String(formData.leaderIgn || '').trim(),
            gameId: String(formData.leaderGameId || '').trim(),
            region: String(formData.leaderRegion || '').trim(),
            email: '',
            role: String(formData.leaderRole || '').trim()
        };
        const isEmptySlot = (slot) => !slot || (!slot.user && !slot.nickname && !slot.gameId && !slot.email && !slot.role);
        const roleIdx = selectedGameRoles.findIndex((role) => normalizeText(role) === normalizeText(formData.leaderRole));

        setRoster((prev) => {
            const starters = Array.isArray(prev.starters) ? [...prev.starters] : [];
            if (!starters.length) return prev;

            const captainIndex = starters.findIndex((slot) => {
                if (!slot) return false;
                if (captainUserId && String(slot.user || '') === captainUserId) return true;
                return (
                    normalizeText(slot.nickname) === normalizeText(captainPayload.nickname) &&
                    normalizeText(slot.gameId) === normalizeText(captainPayload.gameId)
                );
            });

            if (captainIndex >= 0) {
                const merged = { ...(starters[captainIndex] || {}), ...captainPayload };
                const before = JSON.stringify(starters[captainIndex] || {});
                const after = JSON.stringify(merged);
                if (before === after) return prev;
                starters[captainIndex] = merged;
                return { ...prev, starters };
            }

            let targetIdx = -1;
            if (roleIdx >= 0 && isEmptySlot(starters[roleIdx])) {
                targetIdx = roleIdx;
            } else {
                targetIdx = starters.findIndex(isEmptySlot);
            }
            if (targetIdx < 0) return prev;

            starters[targetIdx] = { ...(starters[targetIdx] || {}), ...captainPayload };
            return { ...prev, starters };
        });
    }, [
        step,
        formData.game,
        formData.leaderIgn,
        formData.leaderGameId,
        formData.leaderRegion,
        formData.leaderRole,
        selectedGameRoles,
        currentUser
    ]);

    const handleSlotClick = (type, index) => {
        setCurrentSlot({ type, index });
        const existingData = type === 'coach' ? roster.coach : roster[type][index];
        
        let suggestedRole = '';
        if (type === 'starters' && !existingData) {
            const roles = ROLE_NAMES[formData.game];
            if (roles && roles[index]) suggestedRole = roles[index];
        }

        setSlotData(existingData || { 
            nickname: '', 
            gameId: '', 
            region: formData.leaderRegion, 
            email: '', 
            role: suggestedRole,
            photo: null 
        });
        setModalOpen(true);
    };

    const saveSlot = () => {
        if (!slotData.nickname) return alert("Nickname requerido.");
        if (currentSlot.type === 'coach') {
            setRoster({ ...roster, coach: slotData });
        } else {
            const newList = [...roster[currentSlot.type]];
            newList[currentSlot.index] = slotData;
            setRoster({ ...roster, [currentSlot.type]: newList });
        }
        setModalOpen(false);
    };

    const finalizeCreation = async () => {
    if (!hasRequiredLink) {
        addToast(requiredLinkMessage || 'Debes vincular la cuenta del juego en Conexiones', 'error');
        return;
    }
    if (isMlbbGameSelected && mlbbManualRosterSlots.length > 0) {
        addToast('En equipos MLBB solo el capitán se define al crear. Los demás jugadores deben unirse con su cuenta sincronizada.', 'error');
        return;
    }
    if (isUniversityTeamSelected && universityManualRosterSlots.length > 0) {
        addToast('En equipos universitarios solo el capitán se define al crear. Los demás jugadores deben unirse con su cuenta universitaria verificada.', 'error');
        return;
    }
    setSubmitting(true);
    
    try {
        const data = new FormData();

        // 1. Convertimos el logoPreview (base64) a un archivo real si existe
        if (logoPreview && logoPreview.startsWith('data:image')) {
            const response = await fetch(logoPreview);
            const blob = await response.blob();
            data.append('logo', blob, `logo-${Date.now()}.png`);
        }

        // 2. Adjuntamos los datos del formulario
        // Los enviamos como string para que el backend los parsee (JSON.parse)
        data.append('formData', JSON.stringify(formData));
        data.append('roster', JSON.stringify(roster));

        // 3. Petición al servidor
        const res = await fetch(`${API_URL}/api/teams/create`, {
            method: 'POST',
            credentials: 'include',
            headers: withCsrfHeaders(),
            body: data
        });

        const result = await res.json();

        if (res.ok) {
            setInviteLink(result.inviteLink); 
            setCreatedTeamId(String(result.teamId || ''));
            setInvitedUserIds(new Set());
            setReservedInviteSlots([]);
            setStep(3);
            addToast('Equipo creado exitosamente', 'success');
        } else {
            addToast(result.message || 'Error al guardar equipo', 'error');
            console.warn('[CreateTeam] Server error:', res.status, result.message);
        }
    } catch (error) {
        console.error('Error de red:', error);
        addToast('No se pudo conectar con el servidor', 'error');
    } finally {
        setSubmitting(false);
    }
};

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        const btn = document.getElementById('copy-btn');
        if(btn) btn.classList.add('copied');
        setTimeout(() => { if(btn) btn.classList.remove('copied'); }, 2000);
    };

    const inviteCode = useMemo(() => {
        if (!inviteLink) return '';
        try {
            const url = new URL(inviteLink);
            return String(url.searchParams.get('invite') || '').toUpperCase();
        } catch (e) {
            const match = inviteLink.match(/invite=([A-Za-z0-9]+)/);
            return match ? String(match[1]).toUpperCase() : '';
        }
    }, [inviteLink]);

    const copyCode = () => {
        if (!inviteCode) return;
        navigator.clipboard.writeText(inviteCode);
        const btn = document.getElementById('copy-code-btn');
        if(btn) btn.classList.add('copied');
        setTimeout(() => { if(btn) btn.classList.remove('copied'); }, 2000);
    };

    const getAuthToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

    const isRosterSlotFilled = (slot) => Boolean(
        slot && (slot.user || slot.nickname || slot.gameId || slot.region || slot.email || slot.role)
    );

    const getNextInviteSlot = () => {
        const starters = Array.isArray(roster?.starters) ? roster.starters : [];
        const subs = Array.isArray(roster?.subs) ? roster.subs : [];
        const startersMaxRaw = Number(formData?.maxMembers);
        const subsMaxRaw = Number(formData?.maxSubstitutes);
        const startersMax = Number.isFinite(startersMaxRaw) && startersMaxRaw > 0 ? startersMaxRaw : starters.length;
        const subsMax = Number.isFinite(subsMaxRaw) && subsMaxRaw > 0 ? subsMaxRaw : subs.length;
        const reservedKeys = new Set(
            (Array.isArray(reservedInviteSlots) ? reservedInviteSlots : [])
                .map((entry) => `${String(entry?.slotType || '')}:${Number(entry?.slotIndex)}`)
        );

        for (let i = 0; i < startersMax; i += 1) {
            const key = `starters:${i}`;
            if (!isRosterSlotFilled(starters[i]) && !reservedKeys.has(key)) {
                return { slotType: 'starters', slotIndex: i };
            }
        }
        for (let i = 0; i < subsMax; i += 1) {
            const key = `subs:${i}`;
            if (!isRosterSlotFilled(subs[i]) && !reservedKeys.has(key)) {
                return { slotType: 'subs', slotIndex: i };
            }
        }
        return null;
    };

    const ensureCreatedTeamId = async () => {
        if (createdTeamId) return createdTeamId;
        if (!inviteCode) return '';

        try {
            const response = await axios.get(`${API_URL}/api/teams/invite/${inviteCode}`);
            const id = String(response?.data?._id || '').trim();
            if (id) {
                setCreatedTeamId(id);
                return id;
            }
        } catch (_) {}
        return '';
    };

    const loadFriendsForInvites = async () => {
        const token = getAuthToken();
        if (!token) return;
        setFriendsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/auth/social`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFriendsList(Array.isArray(response?.data?.friends) ? response.data.friends : []);
        } catch (error) {
            setFriendsList([]);
            addToast('No se pudieron cargar tus amigos para invitación.', 'error');
        } finally {
            setFriendsLoading(false);
        }
    };

    useEffect(() => {
        if (step !== 3) return;
        loadFriendsForInvites();
    }, [step]);

    const visibleFriends = useMemo(() => {
        const q = String(searchQuery || '').trim().toLowerCase();
        if (!q) return friendsList;
        return friendsList.filter((friend) => {
            const name = String(friend?.name || '').toLowerCase();
            const code = String(friend?.userCode || '').toLowerCase();
            const rank = String(friend?.rank || '').toLowerCase();
            return name.includes(q) || code.includes(q) || rank.includes(q);
        });
    }, [friendsList, searchQuery]);

    const handleInviteFriend = async (friend) => {
        const targetUserId = String(friend?.id || '').trim();
        if (!targetUserId) return;
        if (inviteBusyByUser[targetUserId] || invitedUserIds.has(targetUserId)) return;

        const token = getAuthToken();
        if (!token) {
            addToast('Debes iniciar sesión para invitar amigos.', 'error');
            return;
        }

        setInviteBusyByUser((prev) => ({ ...prev, [targetUserId]: true }));
        try {
            const teamId = await ensureCreatedTeamId();
            if (!teamId) {
                addToast('No se pudo resolver el equipo para invitar.', 'error');
                return;
            }

            const nextSlot = getNextInviteSlot();
            if (!nextSlot) {
                addToast('No quedan slots disponibles para enviar más invitaciones.', 'error');
                return;
            }
            const { slotType, slotIndex } = nextSlot;
            const response = await axios.post(
                `${API_URL}/api/teams/${teamId}/invite-friend`,
                { targetUserId, slotType, slotIndex },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setInvitedUserIds((prev) => {
                const next = new Set(prev);
                next.add(targetUserId);
                return next;
            });
            const resolvedSlotType = String(response?.data?.invite?.slotType || slotType);
            const resolvedSlotIndex = Number.isFinite(Number(response?.data?.invite?.slotIndex))
                ? Number(response.data.invite.slotIndex)
                : slotIndex;
            setReservedInviteSlots((prev) => {
                const current = Array.isArray(prev) ? prev : [];
                const key = `${resolvedSlotType}:${resolvedSlotIndex}`;
                const alreadyExists = current.some((entry) => (
                    `${String(entry?.slotType || '')}:${Number(entry?.slotIndex)}` === key
                ));
                if (alreadyExists) return current;
                return [...current, { slotType: resolvedSlotType, slotIndex: resolvedSlotIndex }];
            });
            addToast(response?.data?.message || 'Invitación enviada.', 'success');
        } catch (error) {
            addToast(error?.response?.data?.message || 'No se pudo enviar la invitación.', 'error');
        } finally {
            setInviteBusyByUser((prev) => ({ ...prev, [targetUserId]: false }));
        }
    };

    const getRoleLabel = (index) => {
        const roles = ROLE_NAMES[formData.game];
        return roles ? roles[index] : `Player ${index + 1}`;
    };

    const isRosterSlotLocked = (type) => (isMlbbGameSelected || isUniversityTeamSelected) && type !== 'coach';
    const captainStarterIndex = useMemo(() => {
        const starters = Array.isArray(roster?.starters) ? roster.starters : [];
        if (!starters.length) return -1;

        if (currentUserId) {
            const byUser = starters.findIndex((slot) => String(slot?.user || '') === currentUserId);
            if (byUser >= 0) return byUser;
        }

        if (selectedGameRoles.length > 0 && formData.leaderRole) {
            const byRole = selectedGameRoles.findIndex((role) => normalizeText(role) === normalizeText(formData.leaderRole));
            if (byRole >= 0) return byRole;
        }

        return -1;
    }, [roster, currentUserId, selectedGameRoles, formData.leaderRole]);
    const isCaptainRoleReserved = (type, index) =>
        type === 'starters'
        && !isUniversityTeamSelected
        && captainStarterIndex >= 0
        && Number(index) === Number(captainStarterIndex);

    // --- RENDERIZADO ---
    return (
        <div className={`create-team-layout ${getThemeClass()}`}>
            <div className="form-wrapper">
                
                <div className="form-header-modern">
                    <h1>{step === 3 ? "¡Misión Cumplida!" : "Registro de Escuadra"}</h1>
                </div>

                {/* Step Indicator */}
                <div className="ct-stepper">
                    <div className={`ct-step ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}>
                        <div className="ct-step-dot">{step > 1 ? <FaCheck /> : '1'}</div>
                        <span className="ct-step-label">Identidad</span>
                    </div>
                    <div className={`ct-step-line ${step > 1 ? 'done' : ''}`} />
                    <div className={`ct-step ${step >= 2 ? (step > 2 ? 'done' : 'active') : ''}`}>
                        <div className="ct-step-dot">{step > 2 ? <FaCheck /> : '2'}</div>
                        <span className="ct-step-label">Roster</span>
                    </div>
                    <div className={`ct-step-line ${step > 2 ? 'done' : ''}`} />
                    <div className={`ct-step ${step >= 3 ? 'active' : ''}`}>
                        <div className="ct-step-dot">3</div>
                        <span className="ct-step-label">Compartir</span>
                    </div>
                </div>

                {/* PASO 1: DATOS GENERALES Y CAPITÁN */}
                {step === 1 && (
                    <div className="fade-in">
                        {/* 1. IDENTIDAD VISUAL */}
                        <div className="section-card branding-section">
                            <div className="logo-upload-container">
                                <label htmlFor="logo-upload" className="logo-placeholder">
                                    {logoPreview ? <img src={logoPreview} alt="Logo" className="logo-preview-img" /> : <FaCamera />}
                                </label>
                                <input id="logo-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoChange} hidden />
                            </div>

                            <div className="branding-inputs">
                                <input 
                                    type="text" 
                                    className="input-hero" 
                                    placeholder="Nombre del Equipo" 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                />
                                <input 
                                    type="text" 
                                    className="input-modern" 
                                    placeholder="Eslogan / Grito de Guerra" 
                                    value={formData.slogan} 
                                    onChange={e => setFormData({...formData, slogan: e.target.value})} 
                                />
                            </div>
                        </div>

                        {/* 2. PERFIL DE ESCUADRA (ACTUALIZADO CON UNIVERSITARIO) */}
                        <div className="section-card">
                            <h3 style={{marginBottom: '1rem', color: 'var(--theme-color)', fontSize: '1.2rem'}}>
                                <FaGlobe style={{marginRight: '8px'}}/> Perfil de la Escuadra
                            </h3>
                            
                            <div className="split-row">
                                <div className="form-group">
                                    <label className="section-label"><FaVenusMars/> Composición (Género)</label>
                                    <select className="select-modern" value={formData.teamGender} onChange={e => setFormData({...formData, teamGender: e.target.value})}>
                                        <option value="Mixto">Mixto (Cualquiera)</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="section-label"><FaMapMarkerAlt/> País / Región Base</label>
                                    <select
                                        className="select-modern"
                                        value={useCustomCountry ? CUSTOM_OPTION : (formData.teamCountry || '')}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === CUSTOM_OPTION) {
                                                setUseCustomCountry(true);
                                                setFormData({ ...formData, teamCountry: '' });
                                                return;
                                            }
                                            setUseCustomCountry(false);
                                            setFormData({ ...formData, teamCountry: value });
                                        }}
                                    >
                                        <option value="">Selecciona país</option>
                                        {COUNTRY_OPTIONS.map((country) => (
                                            <option key={country} value={country}>{country}</option>
                                        ))}
                                        <option value={CUSTOM_OPTION}>Personalizado</option>
                                    </select>
                                    {useCustomCountry && (
                                        <input
                                            type="text"
                                            className="input-modern"
                                            placeholder="Escribe el país o región"
                                            value={formData.teamCountry}
                                            onChange={(e) => setFormData({ ...formData, teamCountry: e.target.value })}
                                            style={{ marginTop: '8px' }}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="split-row">
                                <div className="form-group">
                                    <label className="section-label"><FaTrophy/> Nivel / Tipo de Equipo</label>
                                    <select className="select-modern" value={formData.teamLevel} onChange={e => setFormData({...formData, teamLevel: e.target.value})}>
                                        <option value="Casual">Casual / Fun</option>
                                        <option value="Amateur">Amateur (Torneos Menores)</option>
                                        <option value="Universitario">Universitario (Institucional)</option>
                                        <option value="Semi-Pro">Semi-Pro (Ligas)</option>
                                        <option value="Profesional">Profesional (Tier 1)</option>
                                        <option value="Leyenda">Leyenda (Elite)</option>
                                    </select>
                                    {presetTeamLevel === 'Universitario' && (
                                        <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
                                            Preseleccionado desde University como equipo institucional.
                                        </small>
                                    )}
                                    {isUniversityTeamSelected && (
                                        <small style={{ color: currentUserUniversityVerified ? 'var(--theme-color)' : '#ff6b6b', display: 'block', marginTop: '8px' }}>
                                            {currentUserUniversityVerified
                                                ? `Equipo universitario vinculado a ${currentUserUniversity.universityName || currentUserUniversity.universityTag || 'tu universidad verificada'}.`
                                                : universityRequirementMessage}
                                        </small>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="section-label"><FaLanguage/> Idioma Principal</label>
                                    <input 
                                        type="text" 
                                        className="input-modern" 
                                        placeholder="Ej: Español / Inglés" 
                                        value={formData.teamLanguage} 
                                        onChange={e => setFormData({...formData, teamLanguage: e.target.value})} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. CONFIGURACIÓN DE JUEGO */}
                        <div className="section-card game-section">
                            <h3 style={{marginBottom: '1rem', color: 'var(--theme-color)', fontSize: '1.2rem'}}>
                                <FaGamepad style={{marginRight: '8px'}}/> Disciplina
                            </h3>
                            <div className="split-row">
                                <div className="form-group">
                                    <label className="section-label">Categoría</label>
                                    <select
                                        className="select-modern"
                                        onChange={e => {
                                            const cat = e.target.value;
                                            setSelectedCategory(cat);
                                            setFormData(prev => ({ ...prev, category: cat }));
                                        }}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {Object.keys(esportsCatalog).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="section-label">Juego</label>
                                    <select className="select-modern" onChange={handleGameChange} disabled={!selectedCategory} value={formData.game}>
                                        <option value="">{selectedCategory ? 'Selecciona Título' : '---'}</option>
                                        {selectedCategory && Object.keys(esportsCatalog[selectedCategory]).map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                    {requiresLinkedAccount && !hasRequiredLink && (
                                        <small style={{ color: '#ff6b6b', display: 'block', marginTop: '8px' }}>
                                            {requiredLinkMessage}
                                        </small>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 4. DATOS DEL CAPITÁN */}
                        <div className="section-card">
                            <h3 style={{marginBottom: '1rem', color: 'var(--theme-color)', fontSize: '1.2rem'}}>
                                <FaIdCard style={{marginRight: '8px'}}/> Capitán (Verificación)
                            </h3>
                            
                            <label className="section-label">Nombre Completo (Verificación Interna)</label>
                            <input 
                                type="text" 
                                placeholder="Ej: Juan Pérez" 
                                value={formData.leaderRealName} 
                                onChange={e => setFormData({...formData, leaderRealName: e.target.value})} 
                            />

                            <div className="split-row">
                                <div>
                                    <label className="section-label">Nick In-Game</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: Faker" 
                                        value={formData.leaderIgn} 
                                        onChange={e => setFormData({...formData, leaderIgn: e.target.value})}
                                        disabled={lockRiotIdentity}
                                    />
                                </div>
                                <div>
                                    <label className="section-label">ID / Tag Único</label>
                                    <input 
                                        type="text" 
                                        placeholder="#TAG / UID" 
                                        value={formData.leaderGameId} 
                                        onChange={e => setFormData({...formData, leaderGameId: e.target.value})}
                                        disabled={lockMlbbIdentity || lockRiotIdentity}
                                    />
                                </div>
                            </div>

                            <div className="split-row">
                                <div>
                                    <label className="section-label">
                                        {isMlbbGameSelected ? 'Zone ID (MLBB)' : 'Región / Servidor'}
                                    </label>
                                    {isMlbbGameSelected ? (
                                        <input
                                            type="text"
                                            className="input-modern"
                                            placeholder="Ej: 5280"
                                            value={formData.leaderRegion}
                                            onChange={(e) => setFormData({ ...formData, leaderRegion: e.target.value.replace(/\D/g, '') })}
                                            disabled={lockMlbbIdentity}
                                        />
                                    ) : (
                                        <>
                                            <select
                                                className="select-modern"
                                                value={useCustomRegion ? CUSTOM_OPTION : (formData.leaderRegion || '')}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === CUSTOM_OPTION) {
                                                        setUseCustomRegion(true);
                                                        setFormData({ ...formData, leaderRegion: '' });
                                                        return;
                                                    }
                                                    setUseCustomRegion(false);
                                                    setFormData({ ...formData, leaderRegion: value });
                                                }}
                                            >
                                                <option value="">Selecciona región/servidor</option>
                                                {regionOptions.map((region) => (
                                                    <option key={region} value={region}>{region}</option>
                                                ))}
                                                <option value={CUSTOM_OPTION}>Personalizado</option>
                                            </select>
                                            {useCustomRegion && (
                                                <input
                                                    type="text"
                                                    className="input-modern"
                                                    placeholder="Escribe la región o servidor"
                                                    value={formData.leaderRegion}
                                                    onChange={(e) => setFormData({ ...formData, leaderRegion: e.target.value })}
                                                    style={{ marginTop: '8px' }}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                                <div>
                                    <label className="section-label">Tu Rol Principal</label>
                                    {selectedGameRoles.length > 0 ? (
                                        <select
                                            className="select-modern"
                                            value={formData.leaderRole || ''}
                                            onChange={(e) => setFormData({ ...formData, leaderRole: e.target.value })}
                                        >
                                            <option value="">Selecciona rol</option>
                                            {selectedGameRoles.map((role) => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder="Ej: IGL / Mid"
                                            value={formData.leaderRole}
                                            onChange={e => setFormData({ ...formData, leaderRole: e.target.value })}
                                        />
                                    )}
                                </div>
                            </div>
                            {lockMlbbIdentity && (
                                <small style={{ color: 'var(--theme-color)', display: 'block', marginTop: '8px' }}>
                                    Para MLBB usamos tu User ID + Zone ID verificados en Conexiones.
                                </small>
                            )}
                            {lockRiotIdentity && (
                                <small style={{ color: 'var(--theme-color)', display: 'block', marginTop: '8px' }}>
                                    Para Riot usamos tu Riot ID vinculado en Conexiones.
                                </small>
                            )}
                        </div>

                        <div className="form-footer-sticky">
                            <button className="btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
                            <button 
                                className="btn-primary-glow" 
                                disabled={!formData.game || !formData.name || !formData.leaderIgn || !hasRequiredLink || (isUniversityTeamSelected && !currentUserUniversityVerified)}
                                onClick={() => {
                                    if (!hasRequiredLink) {
                                        addToast(requiredLinkMessage || 'Debes vincular la cuenta del juego en Conexiones', 'error');
                                        return;
                                    }
                                    if (isUniversityTeamSelected && !currentUserUniversityVerified) {
                                        addToast(universityRequirementMessage, 'error');
                                        return;
                                    }
                                    if (selectedGameRoles.length > 0) {
                                        if (!formData.leaderRole) {
                                            addToast('Selecciona el rol principal del capitán.', 'error');
                                            return;
                                        }
                                        const validRole = selectedGameRoles.some(
                                            (role) => normalizeText(role) === normalizeText(formData.leaderRole)
                                        );
                                        if (!validRole) {
                                            addToast('El rol del capitán debe existir en el roster del juego.', 'error');
                                            return;
                                        }
                                    }
                                    setStep(2);
                                }}
                            >
                                Siguiente: Roster
                            </button>
                        </div>
                    </div>
                )}

                {/* PASO 2: ROSTER (DISEÑO CÍRCULOS CON FOTOS) */}
                {step === 2 && (
                    <div className="roster-container fade-in">
                        <div className="roster-header-row">
                            <h3>Alineación ({formData.teamLevel})</h3>
                            <span className="game-badge">{formData.game}</span>
                        </div>
                        {isMlbbGameSelected && (
                            <div className="section-card" style={{ marginBottom: '16px' }}>
                                <small style={{ color: 'var(--theme-color)', display: 'block' }}>
                                    Para MLBB el roster debe construirse con usuarios reales sincronizados.
                                    Crea el equipo con el capitán y luego comparte el código para que cada jugador se una con su cuenta.
                                </small>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
                                    En este paso no se agregan jugadores manualmente. Si necesitas cambiar el rol del capitán, vuelve al paso anterior.
                                </small>
                            </div>
                        )}
                        {isUniversityTeamSelected && (
                            <div className="section-card" style={{ marginBottom: '16px' }}>
                                <small style={{ color: currentUserUniversityVerified ? 'var(--theme-color)' : '#ff6b6b', display: 'block' }}>
                                    Los equipos universitarios deben formarse con estudiantes verificados de la misma universidad.
                                    Crea el equipo con el capitán y luego invita al resto para que entren con su cuenta validada.
                                </small>
                                {!currentUserUniversityVerified && (
                                    <small style={{ color: '#ff6b6b', display: 'block', marginTop: '8px' }}>
                                        No puedes continuar hasta verificar tu universidad en el módulo University.
                                    </small>
                                )}
                            </div>
                        )}

                        {/* Titulares */}
                        <div className="roles-section">
                            <label className="section-label">Titulares</label>
                            <div className="circles-grid">
                                {roster.starters.map((slot, idx) => {
                                    const isLocked = isRosterSlotLocked('starters') || isCaptainRoleReserved('starters', idx);
                                    return (
                                    <div
                                        key={idx}
                                        className={`role-item ${isLocked ? 'disabled' : ''}`}
                                        onClick={isLocked ? undefined : () => handleSlotClick('starters', idx)}
                                        role={isLocked ? 'presentation' : 'button'}
                                    >
                                        <div className={`role-circle ${slot ? 'filled' : 'empty'} ${isLocked ? 'locked' : ''}`}>
                                            {/* AQUÍ SE MUESTRA LA FOTO SI EXISTE */}
                                            {slot ? (
                                                slot.photo ? (
                                                    <img src={slot.photo} alt="Player" className="player-circle-img" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} />
                                                ) : (
                                                    <span className="initials">{slot.nickname.substring(0,2).toUpperCase()}</span>
                                                )
                                            ) : (
                                                isLocked ? <FaLock className="user-icon" /> : <FaUser className="user-icon" />
                                            )}
                                        </div>
                                        <span className="role-label-text">
                                            {slot ? slot.nickname : getRoleLabel(idx)}
                                        </span>
                                        {(isMlbbGameSelected || isUniversityTeamSelected) && (
                                            <span className="role-slot-hint">
                                                {slot ? 'Capitán validado' : 'Entra por invitación'}
                                            </span>
                                        )}
                                        {!isUniversityTeamSelected && !isMlbbGameSelected && isCaptainRoleReserved('starters', idx) && (
                                            <span className="role-slot-hint">Rol del capitán reservado</span>
                                        )}
                                    </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Suplentes */}
                        {formData.maxSubstitutes > 0 && (
                            <div className="roles-section">
                                <label className="section-label">Suplentes</label>
                                <div className="circles-grid">
                                    {roster.subs.map((slot, idx) => (
                                        <div
                                            key={idx}
                                            className={`role-item ${isRosterSlotLocked('subs') ? 'disabled' : ''}`}
                                            onClick={isRosterSlotLocked('subs') ? undefined : () => handleSlotClick('subs', idx)}
                                            role={isRosterSlotLocked('subs') ? 'presentation' : 'button'}
                                        >
                                            <div className={`role-circle small ${slot ? 'filled' : 'empty'} ${isRosterSlotLocked('subs') ? 'locked' : ''}`}>
                                                {slot ? (
                                                    slot.photo ? (
                                                        <img src={slot.photo} alt="Sub" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} />
                                                    ) : (
                                                        <span className="initials">{slot.nickname.substring(0,2)}</span>
                                                    )
                                                ) : (
                                                    isRosterSlotLocked('subs') ? <FaLock /> : <FaPlus />
                                                )}
                                            </div>
                                            <span className="role-label-text">Suplente {idx+1}</span>
                                            {(isMlbbGameSelected || isUniversityTeamSelected) && (
                                                <span className="role-slot-hint">Se une después</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Coach */}
                        <div className="roles-section">
                            <label className="section-label">Staff / Coach</label>
                            <div className="role-item" onClick={() => handleSlotClick('coach', 0)}>
                                <div className={`role-circle ${roster.coach ? 'filled' : 'empty'}`}>
                                    {roster.coach ? (
                                        roster.coach.photo ? (
                                            <img src={roster.coach.photo} alt="Coach" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} />
                                        ) : (
                                            <span className="initials">{roster.coach.nickname.substring(0,2)}</span>
                                        )
                                    ) : (
                                        <FaUserAstronaut />
                                    )}
                                </div>
                                <span className="role-label-text">{roster.coach ? roster.coach.nickname : "Coach"}</span>
                            </div>
                        </div>

                        <div className="form-footer-sticky">
                            <button className="btn-ghost" onClick={() => setStep(1)}><FaArrowLeft /> Datos</button>
                            <button className="btn-primary-glow" onClick={finalizeCreation} disabled={submitting || (isUniversityTeamSelected && !currentUserUniversityVerified)}>
                                {submitting ? "Registrando..." : (isMlbbGameSelected || isUniversityTeamSelected) ? "Crear Equipo y Generar Código" : "Confirmar Equipo"}
                            </button>
                        </div>
                    </div>
                )}

                {/* PASO 3: RECLUTAMIENTO PRO */}
                {step === 3 && (
                    <div className="share-screen fade-in">
                        <div className="success-header-hero">
                            <div className="success-icon-glow">
                                <FaCheckCircle />
                            </div>
                            <div>
                                <h2>¡Equipo Validado!</h2>
                                <p className="subtitle-glow">Tu escuadra está lista para competir.</p>
                            </div>
                        </div>

                        {(isMlbbGameSelected || isUniversityTeamSelected) && (
                            <div className="section-card mlbb-share-brief">
                                <h3>{isMlbbGameSelected ? 'Flujo MLBB' : 'Flujo universitario'}</h3>
                                <div className="mlbb-share-steps">
                                    <span>1. Comparte el código o link del equipo.</span>
                                    <span>2. Cada jugador debe tener su cuenta validada en el módulo correspondiente.</span>
                                    <span>3. Cada jugador entra con su propia cuenta verificada.</span>
                                    <span>4. El sistema valida la elegibilidad real antes de torneos y actividad.</span>
                                </div>
                            </div>
                        )}

                        <div className="recruit-grid">
                            {/* COLUMNA IZQUIERDA */}
                            <div className="share-column left glass-panel">
                                <label className="column-header-label">Centro de Invitación</label>
                                
                                <div className="qr-section-styled">
                                    <div className="qr-glow-container">
                                        <QRCodeCanvas value={inviteLink} size={150} level="H" bgColor="#FFFFFF" fgColor="#000000"/>
                                    </div>
                                    <span className="qr-label">Escanear QR</span>
                                </div>
                                
                                <div className="link-section-styled">
                                    <label className="sub-label">Link Único</label>
                                    <div className="link-action-box-pro">
                                        <div className="link-text-mask">{inviteLink}</div>
                                        <button id="copy-btn" onClick={copyLink} title="Copiar">
                                            <FaCopy />
                                        </button>
                                    </div>
                                </div>

                                <div className="link-section-styled">
                                    <label className="sub-label">Código de Invitación</label>
                                    <div className="code-action-box-pro">
                                        <div className="code-text-mask">{inviteCode || '---'}</div>
                                        <button id="copy-code-btn" onClick={copyCode} title="Copiar código" disabled={!inviteCode}>
                                            <FaCopy />
                                        </button>
                                    </div>
                                </div>

                                <div className="social-section-styled">
                                    <label className="sub-label">Redes</label>
                                    <div className="social-grid-pro">
                                        <button className="social-btn-pro whatsapp" onClick={() => window.open(`https://wa.me/?text=${inviteLink}`)}><FaWhatsapp /></button>
                                        <button className="social-btn-pro discord" onClick={() => window.open(`https://discord.com`)}><FaDiscord /></button>
                                        <button className="social-btn-pro twitter" onClick={() => window.open(`https://twitter.com`)}><FaTwitter /></button>
                                        <button className="social-btn-pro facebook" onClick={() => window.open(`https://facebook.com`)}><FaFacebook /></button>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMNA DERECHA */}
                            <div className="share-column right glass-panel">
                                <label className="column-header-label">Buscador Global</label>
                                
                                <div className="search-box-pro">
                                    <FaSearch className="search-icon-pro" />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar Nickname o ID..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="players-list-pro custom-scrollbar">
                                    {friendsLoading && (
                                        <div className="player-row-pro fade-in-item">
                                            <div className="player-info-pro">
                                                <div className="player-texts">
                                                    <span className="p-name-pro">Cargando amigos...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!friendsLoading && visibleFriends.length === 0 && (
                                        <div className="player-row-pro fade-in-item">
                                            <div className="player-info-pro">
                                                <div className="player-texts">
                                                    <span className="p-name-pro">No hay amigos disponibles para invitar.</span>
                                                    <span className="p-tag-pro">Solo aplica para amigos mutuos</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!friendsLoading && visibleFriends.map((friend) => {
                                        const targetUserId = String(friend?.id || '');
                                        const status = String(friend?.status || 'offline').toLowerCase();
                                        const isOnline = ['online', 'gaming', 'tournament', 'streaming', 'searching'].includes(status);
                                        const avatarUrl = resolveMediaUrl(friend?.avatar || '');
                                        const initials = String(friend?.name || 'U').trim().slice(0, 2).toUpperCase();
                                        const codeLabel = friend?.userCode ? `#${friend.userCode}` : '#USER';
                                        const isBusy = Boolean(inviteBusyByUser[targetUserId]);
                                        const alreadyInvited = invitedUserIds.has(targetUserId);

                                        return (
                                            <div key={targetUserId} className="player-row-pro fade-in-item">
                                                <div className="player-info-pro">
                                                    <div className={`avatar-mini-pro ${isOnline ? 'online' : 'busy'}`}>
                                                        {avatarUrl ? (
                                                            <img
                                                                src={avatarUrl}
                                                                alt={friend?.name || 'Amigo'}
                                                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            initials
                                                        )}
                                                        <span className="status-indicator"></span>
                                                    </div>
                                                    <div className="player-texts">
                                                        <span className="p-name-pro">{friend?.name || 'Jugador'}</span>
                                                        <span className="p-tag-pro">{codeLabel}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn-invite-pro"
                                                    onClick={() => handleInviteFriend(friend)}
                                                    disabled={isBusy || alreadyInvited}
                                                >
                                                    {alreadyInvited ? 'ENVIADO' : (isBusy ? 'ENVIANDO...' : 'INVITAR')}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <label className="column-header-label" style={{marginTop: '1.5rem'}}>Comunidades</label>
                                <div className="community-actions-pro">
                                    <button className="btn-community-pro">
                                        <div className="icon-box"><FaPaperPlane /></div>
                                        <span>Publicar en "Hub General"</span>
                                    </button>
                                    <button className="btn-community-pro">
                                        <div className="icon-box"><FaGamepad /></div>
                                        <span>Publicar en "Torneos {formData.game}"</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* BOTÓN FINAL */}
                        <div className="footer-actions-pro">
                            <button className="btn-primary-glow finish-btn-mega" onClick={() => navigate('/equipos')}>
                                <FaCheck /> IR AL DASHBOARD
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL CON SUBIDA DE FOTO */}
            {modalOpen && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
                    <div className="mini-form">
                        <h3 style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                            <span>Registro: <span className="highlight">{slotData.role || "Jugador"}</span></span>
                            {/* CAMPO DE FOTO DEL JUGADOR */}
                            <label className="player-photo-upload" style={{cursor:'pointer'}}>
                                <input type="file" hidden accept="image/*" onChange={handlePlayerPhotoChange} />
                                {slotData.photo ? (
                                    <img src={slotData.photo} alt="preview" style={{width:'50px', height:'50px', borderRadius:'50%', objectFit:'cover', border:'2px solid var(--theme-color)'}} />
                                ) : (
                                    <div style={{width:'50px', height:'50px', borderRadius:'50%', background:'#333', display:'flex', alignItems:'center', justifyContent:'center', border:'1px dashed #666'}}>
                                        <FaUpload style={{color:'#aaa', fontSize:'1.2rem'}}/>
                                    </div>
                                )}
                            </label>
                        </h3>
                        
                        <label className="section-label">Nickname</label>
                        <input 
                            type="text" 
                            placeholder="Ej: S1mple"
                            value={slotData.nickname} 
                            onChange={(e) => setSlotData({...slotData, nickname: e.target.value})} 
                            autoFocus 
                        />

                        <div className="split-row">
                            <div>
                                <label className="section-label">
                                    {isMlbbGameSelected ? 'User ID (MLBB)' : 'Game ID / Tag'}
                                </label>
                                <input 
                                    type="text" 
                                    placeholder={isMlbbGameSelected ? 'Ej: 853455730' : '#TAG / UID'}
                                    value={slotData.gameId} 
                                    onChange={(e) =>
                                        setSlotData({
                                            ...slotData,
                                            gameId: isMlbbGameSelected ? e.target.value.replace(/\D/g, '') : e.target.value
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <label className="section-label">
                                    {isMlbbGameSelected ? 'Zone ID (MLBB)' : 'Región'}
                                </label>
                                <input 
                                    type="text" 
                                    placeholder={isMlbbGameSelected ? 'Ej: 5280' : 'Ej: LAS'}
                                    value={slotData.region} 
                                    onChange={(e) =>
                                        setSlotData({
                                            ...slotData,
                                            region: isMlbbGameSelected ? e.target.value.replace(/\D/g, '') : e.target.value
                                        })
                                    }
                                />
                            </div>
                        </div>
                        
                        <label className="section-label">Email (Notificación)</label>
                        <input 
                            type="email" 
                            placeholder="correo@ejemplo.com"
                            value={slotData.email} 
                            onChange={(e) => setSlotData({...slotData, email: e.target.value})} 
                        />

                        <div className="modal-buttons">
                            <button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                            <button className="btn-primary-glow" onClick={saveSlot}>Guardar Slot</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateTeamPage;
