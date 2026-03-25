import { useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_URL, CHAT_URL } from '../../../config/api';
import { useTheme, THEMES } from '../../../context/ThemeContext';
import SecurityCenterUI from './SecurityCenterUI';
import { isMlbbVerifiedStatus, normalizeMlbbVerificationStatus } from '../../../utils/mlbbStatus';
import { getAuthToken } from '../../../utils/authSession';
import { startPlatformOAuth, unlinkPlatformOAuth } from '../../../utils/platformOAuth';
import './SettingsV2.css';

// Icons
import { 
    FaShieldAlt, FaGamepad, FaCreditCard, FaUserSecret,
    FaPaintBrush, FaHeadset, FaDiscord, FaCheckCircle,
    FaExclamationTriangle, FaKey, FaChevronRight, FaTimes,
    FaEyeSlash, FaExternalLinkAlt, FaFlag, FaSteam, FaTwitch,
    FaXbox, FaPlaystation, FaGoogle, FaMicrosoft, FaLink, FaInfoCircle
} from 'react-icons/fa';
import { SiEpicgames } from 'react-icons/si';

const TABS = [
    { id: 'security', label: 'Seguridad', icon: FaShieldAlt, description: 'Contraseña, sesiones y autenticación' },
    { id: 'connections', label: 'Conexiones', icon: FaGamepad, description: 'Vincula tus cuentas de juego' },
    { id: 'privacy', label: 'Privacidad', icon: FaUserSecret, description: 'Controla quién puede contactarte' },
    { id: 'appearance', label: 'Apariencia', icon: FaPaintBrush, description: 'Tema e interfaz visual' },
    { id: 'billing', label: 'Suscripción', icon: FaCreditCard, description: 'Planes y métodos de pago' },
    { id: 'support', label: 'Soporte', icon: FaHeadset, description: 'Ayuda y reportes' },
];

export default function SettingsV2() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('security');
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    
    // Appearance settings
    const [streamerMode, setStreamerMode] = useState(() => localStorage.getItem('streamerMode') === 'true');
    const [reduceAnimations, setReduceAnimations] = useState(() => localStorage.getItem('reduceAnimations') === 'true');
    
    // User data
    const normalizePrivacy = (value = {}) => ({
        allowTeamInvites: value?.allowTeamInvites !== false,
        showOnlineStatus: value?.showOnlineStatus !== false,
        allowTournamentInvites: value?.allowTournamentInvites !== false,
        showPublicUserCode: value?.showPublicUserCode !== false,
        showPublicRiotHandle: value?.showPublicRiotHandle === true
    });
    const [privacy, setPrivacy] = useState(() => normalizePrivacy());
    const [connections, setConnections] = useState({ discord: {}, riot: {}, mlbb: {}, steam: {}, epic: {} });
    const [gameProfiles, setGameProfiles] = useState({});
    const [oauthNotice, setOauthNotice] = useState({ provider: '', status: '', message: '' });
    const [epicLoading, setEpicLoading] = useState(false);

    // Riot State
    const [riotGameName, setRiotGameName] = useState('');
    const [riotTagLine, setRiotTagLine] = useState('');
    const [riotLoading, setRiotLoading] = useState(false);
    const [riotSyncing, setRiotSyncing] = useState(false);
    const [riotStep, setRiotStep] = useState('idle');
    const [riotOtp, setRiotOtp] = useState('');
    const [riotMsg, setRiotMsg] = useState('');
    const [riotStatus, setRiotStatus] = useState(null);
    const [valorantRsoLoading, setValorantRsoLoading] = useState(false);
    const [valorantRsoMsg, setValorantRsoMsg] = useState('');

    // MLBB State
    const [mlbbPlayerId, setMlbbPlayerId] = useState('');
    const [mlbbZoneId, setMlbbZoneId] = useState('');
    const [mlbbIgn, setMlbbIgn] = useState('');
    const [mlbbLoading, setMlbbLoading] = useState(false);
    const [mlbbValidating, setMlbbValidating] = useState(false);
    const [mlbbMsg, setMlbbMsg] = useState('');
    const [mlbbStatus, setMlbbStatus] = useState(null);
    const [mlbbPendingReviews, setMlbbPendingReviews] = useState([]);
    const [mlbbReviewLoading, setMlbbReviewLoading] = useState(false);
    const [mlbbReviewMsg, setMlbbReviewMsg] = useState('');
    const [mlbbReviewActionUserId, setMlbbReviewActionUserId] = useState('');
    const [mlbbRejectReasons, setMlbbRejectReasons] = useState({});
    const [mlbbOpsLoading, setMlbbOpsLoading] = useState(false);
    const [mlbbOpsStatus, setMlbbOpsStatus] = useState(null);

    // Support Section State
    const [systemStatus, setSystemStatus] = useState({
        overall: 'checking',
        services: {
            gameServers: 'checking',
            tournamentApi: 'checking',
            matchmaking: 'checking',
            liveChat: 'checking'
        },
        lastChecked: null
    });
    const [supportToast, setSupportToast] = useState({ show: false, message: '', type: 'success' });
    const [feedbackModal, setFeedbackModal] = useState({ open: false, type: 'suggestion', message: '', submitting: false });

    const token = getAuthToken();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const mlbbVerificationStatus = normalizeMlbbVerificationStatus(
        connections?.mlbb?.verificationStatus,
        connections?.mlbb?.verified
    );
    const mlbbLinked = isMlbbVerifiedStatus(mlbbVerificationStatus, connections?.mlbb?.verified);
    const epicLinked = connections?.epic?.verified === true;
    const epicLabel = connections?.epic?.displayName || connections?.epic?.username || connections?.epic?.email || 'Sin vincular';
    const riotProfileIconId = gameProfiles?.lol?.profileIconId ?? 0;
    const riotSummonerLevel = gameProfiles?.lol?.summonerLevel;
    const riotRank = gameProfiles?.lol?.rank;
    const valorantRso = riotStatus?.valorantRso || {};
    const valorantConsentGranted = valorantRso?.consentGranted === true;
    const valorantRsoEnabled = valorantRso?.enabled === true;

    // Particles
    const particles = useMemo(() => 
        Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: `${Math.random() * 100}%`,
            delay: `${Math.random() * 10}s`,
            duration: `${15 + Math.random() * 10}s`,
            size: Math.random() * 2 + 1
        })), []
    );

    const normalizeConnections = (value = {}) => ({
        discord: {},
        riot: {},
        mlbb: {},
        steam: {},
        epic: {},
        ...(value || {})
    });

    const providerLabel = (provider) => {
        const normalized = String(provider || '').trim().toLowerCase();
        if (normalized === 'steam') return 'Steam';
        if (normalized === 'epic') return 'Epic Games';
        if (normalized === 'discord') return 'Discord';
        if (normalized === 'riot') return 'Riot Sign On';
        return 'la plataforma';
    };

    const defaultOauthMessage = (provider, status) => {
        const label = providerLabel(provider);
        if (status === 'connected') return `${label} se vinculó correctamente.`;
        if (status === 'error') return `No se pudo completar la vinculación con ${label}.`;
        return '';
    };

    const emitUserUpdate = () => {
        window.dispatchEvent(new Event('user-update'));
    };

    // Handle appearance toggles
    const handleStreamerModeToggle = () => {
        const newValue = !streamerMode;
        setStreamerMode(newValue);
        localStorage.setItem('streamerMode', String(newValue));
        // Apply streamer mode class to body
        document.body.classList.toggle('streamer-mode', newValue);
    };

    const handleReduceAnimationsToggle = () => {
        const newValue = !reduceAnimations;
        setReduceAnimations(newValue);
        localStorage.setItem('reduceAnimations', String(newValue));
        // Apply reduced motion preference
        document.body.classList.toggle('reduce-motion', newValue);
    };

    // Apply saved settings on mount
    useEffect(() => {
        if (streamerMode) document.body.classList.add('streamer-mode');
        if (reduceAnimations) document.body.classList.add('reduce-motion');
        return () => {
            document.body.classList.remove('streamer-mode', 'reduce-motion');
        };
    }, []);

    // Fetch settings
    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/auth/profile`, {
                headers: authHeaders
            });
            setConnections(normalizeConnections(res.data.connections));
            setPrivacy(normalizePrivacy(res.data.privacy));
            setGameProfiles(res.data.gameProfiles || {});
            setIsAdmin(res.data?.isAdmin === true);
            setLoading(false);
            return res.data;
        } catch (error) {
            console.error('Error loading settings:', error);
            setLoading(false);
            return null;
        }
    };

    const fetchRiotStatus = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/auth/riot/status`, {
                headers: authHeaders
            });
            setRiotStatus(res.data);
        } catch { setRiotStatus(null); }
    };

    const fetchMlbbStatus = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/auth/mlbb/status`, {
                headers: authHeaders
            });
            setMlbbStatus(res.data);
        } catch { setMlbbStatus(null); }
    };

    useEffect(() => {
        if (token) {
            fetchSettings();
            fetchRiotStatus();
            fetchMlbbStatus();
        }
    }, [token]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const provider = String(params.get('oauthProvider') || '').trim().toLowerCase();
        const status = String(params.get('oauthStatus') || '').trim().toLowerCase();
        const message = String(params.get('oauthMessage') || '').trim();

        if (!provider || !status) return;

        setActiveTab('connections');
        setOauthNotice({
            provider,
            status,
            message: message || defaultOauthMessage(provider, status)
        });

        if (status === 'connected' && token) {
            fetchSettings();
            fetchRiotStatus();
            emitUserUpdate();
        }
    }, [location.search, token]);

    useEffect(() => {
        if (!token || !isAdmin) return;
        if (activeTab !== 'mlbb-review') return;
        fetchMlbbPendingReviews();
        fetchMlbbOpsStatus();
    }, [token, isAdmin, activeTab]);

    // Real system status check via endpoint pings
    useEffect(() => {
        const pingService = async (url) => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
                clearTimeout(timeoutId);
                return res.ok ? 'operational' : 'degraded';
            } catch {
                return 'outage';
            }
        };

        const checkSystemStatus = async () => {
            const [gameServers, tournamentApi, matchmaking, liveChat] = await Promise.all([
                pingService(`${API_URL}/api/healthz`),
                pingService(`${API_URL}/api/tournaments/healthz`),
                pingService(`${API_URL}/api/healthz`),
                pingService(`${CHAT_URL}/healthz`),
            ]);

            const services = { gameServers, tournamentApi, matchmaking, liveChat };
            const hasIssue = Object.values(services).some(s => s !== 'operational');

            setSystemStatus({
                overall: hasIssue ? 'degraded' : 'operational',
                services,
                lastChecked: new Date()
            });
        };

        // Initial check with a small delay to show "checking"
        const timeout = setTimeout(checkSystemStatus, 800);

        // Refresh every 30 seconds
        const interval = setInterval(checkSystemStatus, 30000);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, []);

    // Support helper functions
    const showSupportToast = (message, type = 'success') => {
        setSupportToast({ show: true, message, type });
        setTimeout(() => setSupportToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const copyEmailToClipboard = async (email) => {
        try {
            await navigator.clipboard.writeText(email);
            showSupportToast(`📋 ${email} copiado al portapapeles`);
        } catch {
            showSupportToast('Error al copiar', 'error');
        }
    };

    const handleFeedbackSubmit = async () => {
        if (!feedbackModal.message.trim()) {
            showSupportToast('Por favor escribe un mensaje', 'error');
            return;
        }
        
        setFeedbackModal(prev => ({ ...prev, submitting: true }));
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setFeedbackModal({ open: false, type: 'suggestion', message: '', submitting: false });
        showSupportToast('✅ ¡Gracias por tu feedback! Lo revisaremos pronto.');
    };

    const refreshSystemStatus = async () => {
        setSystemStatus(prev => ({ ...prev, overall: 'checking', services: {
            gameServers: 'checking',
            tournamentApi: 'checking',
            matchmaking: 'checking',
            liveChat: 'checking'
        }}));

        const pingService = async (url) => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
                clearTimeout(timeoutId);
                return res.ok ? 'operational' : 'degraded';
            } catch {
                return 'outage';
            }
        };

        const [gameServers, tournamentApi, matchmaking, liveChat] = await Promise.all([
            pingService(`${API_URL}/api/healthz`),
            pingService(`${API_URL}/api/tournaments/healthz`),
            pingService(`${API_URL}/api/healthz`),
            pingService(`${CHAT_URL}/healthz`),
        ]);

        const services = { gameServers, tournamentApi, matchmaking, liveChat };
        const hasIssue = Object.values(services).some(s => s !== 'operational');

        setSystemStatus({
            overall: hasIssue ? 'degraded' : 'operational',
            services,
            lastChecked: new Date()
        });
        showSupportToast('Estado actualizado');
    };

    // Privacy update
    const updatePrivacy = async (newPrivacy) => {
        try {
            const res = await axios.put(`${API_URL}/api/settings/privacy`, { privacy: newPrivacy }, {
                headers: authHeaders
            });
            setPrivacy(normalizePrivacy(res.data?.privacy || newPrivacy));
            emitUserUpdate();
            showSupportToast('Privacidad actualizada');
        } catch (error) {
            console.error(error);
            showSupportToast('No se pudo actualizar la privacidad', 'error');
        }
    };

    // Discord
    const startDiscordLink = async () => {
        try {
            const res = await axios.post(`${API_URL}/api/auth/discord/start`, {}, {
                headers: authHeaders
            });
            if (res?.data?.authorizeUrl) {
                window.location.href = res.data.authorizeUrl;
            }
        } catch (error) {
            console.error('Discord link error:', error);
            setOauthNotice({
                provider: 'discord',
                status: 'error',
                message: error?.response?.data?.message || 'No se pudo iniciar la vinculación con Discord.'
            });
        }
    };

    const unlinkDiscord = async () => {
        try {
            await axios.delete(`${API_URL}/api/auth/discord`, {
                headers: authHeaders
            });
            await fetchSettings();
            emitUserUpdate();
        } catch (error) {
            console.error('Discord unlink error:', error);
        }
    };

    const startEpicLink = async () => {
        try {
            setEpicLoading(true);
            await startPlatformOAuth('epic');
        } catch (error) {
            console.error('Epic link error:', error);
            setOauthNotice({
                provider: 'epic',
                status: 'error',
                message: error?.response?.data?.message || 'No se pudo iniciar la vinculación con Epic Games.'
            });
            setEpicLoading(false);
        }
    };

    const unlinkEpic = async () => {
        try {
            setEpicLoading(true);
            await unlinkPlatformOAuth('epic');
            await fetchSettings();
            emitUserUpdate();
        } catch (error) {
            console.error('Epic unlink error:', error);
            setOauthNotice({
                provider: 'epic',
                status: 'error',
                message: error?.response?.data?.message || 'No se pudo desvincular Epic Games.'
            });
        } finally {
            setEpicLoading(false);
        }
    };

    // Riot
    const initRiotLink = async () => {
        if (!riotGameName.trim() || !riotTagLine.trim()) {
            setRiotMsg('Completa GameName y TagLine');
            return;
        }
        try {
            setRiotLoading(true);
            setRiotMsg('');
            await axios.post(`${API_URL}/api/auth/riot/link/init`, 
                { riotId: `${riotGameName}#${riotTagLine}` },
                { headers: authHeaders }
            );
            setRiotStep('otpSent');
            setRiotMsg('Código enviado a tu correo');
        } catch (error) {
            setRiotMsg(error.response?.data?.message || 'Error enviando código');
        } finally {
            setRiotLoading(false);
        }
    };

    const confirmRiotLink = async () => {
        if (!riotOtp.trim()) {
            setRiotMsg('Ingresa el código');
            return;
        }
        try {
            setRiotLoading(true);
            const res = await axios.post(`${API_URL}/api/auth/riot/link/confirm`, 
                { otp: riotOtp },
                { headers: authHeaders }
            );
            await fetchSettings();
            await fetchRiotStatus();
            emitUserUpdate();
            const backendMessage = res?.data?.message || 'Riot vinculado correctamente.';
            const syncNotice = res?.data?.sync?.warning || res?.data?.sync?.lol?.note || '';
            setRiotMsg(syncNotice ? `${backendMessage} ${syncNotice}` : backendMessage);
            setRiotStep('idle');
            setRiotOtp('');
            setRiotGameName('');
            setRiotTagLine('');
        } catch (error) {
            setRiotMsg(error.response?.data?.message || 'Error confirmando código');
        } finally {
            setRiotLoading(false);
        }
    };

    const syncRiot = async () => {
        try {
            setRiotSyncing(true);
            setRiotMsg('');
            const res = await axios.post(`${API_URL}/api/auth/riot/sync`, {}, {
                headers: authHeaders
            });
            await fetchSettings();
            await fetchRiotStatus();
            emitUserUpdate();
            const syncNote = res?.data?.result?.lol?.note || res?.data?.result?.valorant?.note || '';
            setRiotMsg(syncNote ? `Sincronización completada: ${syncNote}` : (res?.data?.message || 'Sincronización Riot completada.'));
        } catch (error) {
            setRiotMsg(error.response?.data?.message || 'No se pudo sincronizar Riot.');
        } finally {
            setRiotSyncing(false);
        }
    };

    const unlinkRiot = async () => {
        try {
            const res = await axios.delete(`${API_URL}/api/auth/riot`, {
                headers: authHeaders
            });
            await fetchSettings();
            await fetchRiotStatus();
            setRiotMsg(res?.data?.message || 'Riot desvinculado.');
            emitUserUpdate();
        } catch (error) {
            console.error('Riot unlink error:', error);
        }
    };

    const startValorantRso = async () => {
        try {
            setValorantRsoLoading(true);
            setValorantRsoMsg('');
            const res = await axios.post(`${API_URL}/api/auth/riot/valorant/start`, {}, {
                headers: authHeaders
            });
            if (res?.data?.authorizeUrl) {
                window.location.assign(res.data.authorizeUrl);
                return;
            }
            setValorantRsoMsg(res?.data?.message || 'No se pudo iniciar Riot Sign On para VALORANT.');
        } catch (error) {
            setValorantRsoMsg(error.response?.data?.message || 'No se pudo iniciar Riot Sign On para VALORANT.');
        } finally {
            setValorantRsoLoading(false);
        }
    };

    // MLBB
    const validateMlbbDraft = async () => {
        if (!mlbbPlayerId.trim() || !mlbbZoneId.trim()) {
            setMlbbMsg('Completa User ID y Zone ID');
            return;
        }
        try {
            setMlbbValidating(true);
            setMlbbMsg('');
            const res = await axios.post(
                `${API_URL}/api/auth/mlbb/validate`,
                {
                    playerId: mlbbPlayerId.trim(),
                    zoneId: mlbbZoneId.trim(),
                    ign: mlbbIgn.trim()
                },
                { headers: authHeaders }
            );
            setMlbbMsg(res?.data?.message || 'ID válido');
        } catch (error) {
            setMlbbMsg(error.response?.data?.message || 'No se pudo validar el ID');
        } finally {
            setMlbbValidating(false);
        }
    };

    const linkMlbb = async () => {
        if (!mlbbPlayerId.trim() || !mlbbZoneId.trim()) {
            setMlbbMsg('Completa User ID y Zone ID');
            return;
        }
        try {
            setMlbbLoading(true);
            setMlbbMsg('');
            const res = await axios.post(
                `${API_URL}/api/auth/mlbb/link`,
                {
                    playerId: mlbbPlayerId.trim(),
                    zoneId: mlbbZoneId.trim(),
                    ign: mlbbIgn.trim()
                },
                { headers: authHeaders }
            );
            await fetchSettings();
            await fetchMlbbStatus();
            emitUserUpdate();
            setMlbbMsg(res?.data?.message || 'Cuenta MLBB actualizada correctamente.');
            setMlbbPlayerId('');
            setMlbbZoneId('');
            setMlbbIgn('');
        } catch (error) {
            setMlbbMsg(error.response?.data?.message || 'Error vinculando MLBB');
        } finally {
            setMlbbLoading(false);
        }
    };

    const unlinkMlbb = async () => {
        try {
            await axios.delete(`${API_URL}/api/auth/mlbb`, {
                headers: authHeaders
            });
            await fetchSettings();
            await fetchMlbbStatus();
            setMlbbMsg('Cuenta MLBB desvinculada.');
            emitUserUpdate();
        } catch (error) {
            setMlbbMsg(error.response?.data?.message || 'No se pudo desvincular MLBB.');
        }
    };

    const dismissOauthNotice = () => {
        setOauthNotice({ provider: '', status: '', message: '' });
        navigate('/settings', { replace: true });
    };

    const fetchMlbbPendingReviews = async () => {
        try {
            setMlbbReviewLoading(true);
            setMlbbReviewMsg('');
            const res = await axios.get(`${API_URL}/api/auth/mlbb/review/pending`, {
                headers: authHeaders
            });
            setMlbbPendingReviews(Array.isArray(res.data?.items) ? res.data.items : []);
        } catch (error) {
            setMlbbPendingReviews([]);
            setMlbbReviewMsg(error.response?.data?.message || 'No se pudo cargar la revisión MLBB.');
        } finally {
            setMlbbReviewLoading(false);
        }
    };

    const fetchMlbbOpsStatus = async () => {
        try {
            setMlbbOpsLoading(true);
            const res = await axios.get(`${API_URL}/api/auth/mlbb/ops/status`, {
                headers: authHeaders
            });
            setMlbbOpsStatus(res.data || null);
        } catch (error) {
            setMlbbOpsStatus(null);
            setMlbbReviewMsg(error.response?.data?.message || 'No se pudo cargar estado operativo MLBB.');
        } finally {
            setMlbbOpsLoading(false);
        }
    };

    const processMlbbQueueNow = async () => {
        try {
            setMlbbOpsLoading(true);
            setMlbbReviewMsg('');
            await axios.post(`${API_URL}/api/auth/mlbb/ops/process`, {}, {
                headers: authHeaders
            });
            await fetchMlbbOpsStatus();
            setMlbbReviewMsg('Cola MLBB procesada correctamente.');
        } catch (error) {
            setMlbbReviewMsg(error.response?.data?.message || 'No se pudo procesar cola MLBB.');
        } finally {
            setMlbbOpsLoading(false);
        }
    };

    const reviewMlbbRequest = async (targetUserId, action) => {
        if (!targetUserId) return;
        const reason = String(mlbbRejectReasons[targetUserId] || '').trim();
        if (action === 'reject' && !reason) {
            setMlbbReviewMsg('Debes escribir un motivo para rechazar la solicitud.');
            return;
        }
        try {
            setMlbbReviewActionUserId(targetUserId);
            setMlbbReviewMsg('');
            await axios.patch(
                `${API_URL}/api/auth/mlbb/review/${targetUserId}`,
                action === 'reject' ? { action: 'reject', reason } : { action: 'approve' },
                { headers: authHeaders }
            );
            setMlbbPendingReviews((prev) => prev.filter((item) => String(item.userId) !== String(targetUserId)));
            setMlbbRejectReasons((prev) => {
                const next = { ...prev };
                delete next[targetUserId];
                return next;
            });
            setMlbbReviewMsg(action === 'approve' ? 'Solicitud aprobada.' : 'Solicitud rechazada.');
        } catch (error) {
            setMlbbReviewMsg(error.response?.data?.message || 'No se pudo procesar la solicitud.');
        } finally {
            setMlbbReviewActionUserId('');
        }
    };

    // Render content
    const renderContent = () => {
        switch (activeTab) {
            case 'security':
                if (loading) return <div className="stv2-loading">Cargando...</div>;
                return (
                    <motion.div key="security" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <SecurityCenterUI email={connections?.email || 'usuario@glitchgang.net'} />
                    </motion.div>
                );

            case 'connections':
                return (
                    <motion.div key="connections" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="stv2-section">
                            <h2 className="stv2-section__title">Conexiones de Plataformas</h2>
                            <p className="stv2-section__desc">Vincula tus cuentas de juego y servicios para potenciar tu experiencia competitiva.</p>

                            {oauthNotice.message && (
                                <div className={`stv2-oauth-notice stv2-oauth-notice--${oauthNotice.status === 'error' ? 'error' : 'success'}`}>
                                    <div className="stv2-oauth-notice__content">
                                        <FaInfoCircle />
                                        <span>{oauthNotice.message}</span>
                                    </div>
                                    <button type="button" className="stv2-oauth-notice__close" onClick={dismissOauthNotice} aria-label="Cerrar aviso">
                                        <FaTimes />
                                    </button>
                                </div>
                            )}
                            
                            {/* Gaming Platforms */}
                            <h3 className="stv2-section__subtitle">Plataformas de Juego</h3>
                            <div className="stv2-connections">
                                {/* Discord */}
                                <div className={`stv2-connection ${connections?.discord?.id ? 'stv2-connection--active' : ''}`}>
                                    <div className="stv2-connection__icon stv2-connection__icon--discord">
                                        <FaDiscord />
                                    </div>
                                    <div className="stv2-connection__info">
                                        <h4>Discord</h4>
                                        <span>{connections?.discord?.username || 'Sin vincular'}</span>
                                    </div>
                                    <div className="stv2-connection__status">
                                        {connections?.discord?.id ? (
                                            <span className="stv2-badge stv2-badge--success">Conectado</span>
                                        ) : (
                                            <span className="stv2-badge stv2-badge--muted">Pendiente</span>
                                        )}
                                    </div>
                                    <div className="stv2-connection__action">
                                        {connections?.discord?.id ? (
                                            <button className="stv2-btn stv2-btn--ghost stv2-btn--danger" onClick={unlinkDiscord}>
                                                Desvincular
                                            </button>
                                        ) : (
                                            <button className="stv2-btn stv2-btn--primary" onClick={startDiscordLink}>
                                                Conectar
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Riot account */}
                                <div className={`stv2-connection ${connections?.riot?.verified ? 'stv2-connection--active' : ''}`}>
                                    <div className="stv2-connection__icon stv2-connection__icon--riot">
                                        <FaShieldAlt />
                                    </div>
                                    <div className="stv2-connection__info">
                                        <h4>Cuenta Riot</h4>
                                        {connections?.riot?.verified ? (
                                            <span>
                                                {connections.riot.gameName}#{connections.riot.tagLine}
                                                {valorantConsentGranted ? ' · VALORANT autorizado' : ''}
                                            </span>
                                        ) : (
                                            <span>Sin vincular</span>
                                        )}
                                    </div>
                                    <div className="stv2-connection__status">
                                        {connections?.riot?.verified ? (
                                            <span className="stv2-badge stv2-badge--success">
                                                {valorantConsentGranted ? 'LoL + VAL' : 'Verificado'}
                                            </span>
                                        ) : (
                                            <span className="stv2-badge stv2-badge--muted">Pendiente</span>
                                        )}
                                    </div>
                                    <div className="stv2-connection__action">
                                        {connections?.riot?.verified ? (
                                            <>
                                                <button className="stv2-btn stv2-btn--ghost" onClick={() => setActiveTab('riot-link')}>
                                                    Gestionar
                                                </button>
                                                <button className="stv2-btn stv2-btn--ghost stv2-btn--danger" onClick={unlinkRiot}>
                                                    Desvincular
                                                </button>
                                            </>
                                        ) : (
                                            <button className="stv2-btn stv2-btn--primary" onClick={() => setActiveTab('riot-link')}>
                                                Vincular
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Mobile Legends */}
                                <div className={`stv2-connection ${mlbbLinked ? 'stv2-connection--active' : ''}`}>
                                    <div className="stv2-connection__icon stv2-connection__icon--mlbb">
                                        <FaGamepad />
                                    </div>
                                    <div className="stv2-connection__info">
                                        <h4>Mobile Legends</h4>
                                        {(mlbbLinked || mlbbVerificationStatus === 'pending' || mlbbVerificationStatus === 'rejected')
                                            ? <span>ID: {connections?.mlbb?.playerId || '-'} ({connections?.mlbb?.zoneId || '-'})</span>
                                            : <span>Sin vincular</span>}
                                    </div>
                                    <div className="stv2-connection__status">
                                        {mlbbLinked ? (
                                            <span className="stv2-badge stv2-badge--success">Verificado</span>
                                        ) : mlbbVerificationStatus === 'pending' ? (
                                            <span className="stv2-badge stv2-badge--warning">En revisión</span>
                                        ) : mlbbVerificationStatus === 'rejected' ? (
                                            <span className="stv2-badge stv2-badge--danger">Rechazado</span>
                                        ) : (
                                            <span className="stv2-badge stv2-badge--muted">Pendiente</span>
                                        )}
                                    </div>
                                    <div className="stv2-connection__action">
                                        {mlbbLinked ? (
                                            <button className="stv2-btn stv2-btn--ghost stv2-btn--danger" onClick={unlinkMlbb}>
                                                Desvincular
                                            </button>
                                        ) : mlbbVerificationStatus === 'pending' ? (
                                            <button className="stv2-btn stv2-btn--ghost stv2-btn--danger" onClick={unlinkMlbb}>
                                                Cancelar
                                            </button>
                                        ) : (
                                            <button className="stv2-btn stv2-btn--primary" onClick={() => setActiveTab('mlbb-link')}>
                                                Vincular
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Steam */}
                                <div className="stv2-connection stv2-connection--soon">
                                    <div className="stv2-connection__icon stv2-connection__icon--steam">
                                        <FaSteam />
                                    </div>
                                    <div className="stv2-connection__info">
                                        <h4>Steam</h4>
                                        <span>Sin vincular</span>
                                    </div>
                                    <div className="stv2-connection__status">
                                        <span className="stv2-badge stv2-badge--muted">Pendiente</span>
                                    </div>
                                    <div className="stv2-connection__action">
                                        <button className="stv2-btn stv2-btn--outline" disabled>
                                            Próximamente
                                        </button>
                                    </div>
                                </div>

                                {/* Epic Games */}
                                <div className="stv2-connection">
                                    <div className="stv2-connection__icon stv2-connection__icon--epic">
                                        <SiEpicgames />
                                    </div>
                                    <div className="stv2-connection__info">
                                        <h4>Epic Games</h4>
                                        <span>{epicLabel}</span>
                                    </div>
                                    <div className="stv2-connection__status">
                                        {epicLinked ? (
                                            <span className="stv2-badge stv2-badge--success">Conectado</span>
                                        ) : (
                                            <span className="stv2-badge stv2-badge--muted">Pendiente</span>
                                        )}
                                    </div>
                                    <div className="stv2-connection__action">
                                        {epicLinked ? (
                                            <button className="stv2-btn stv2-btn--ghost stv2-btn--danger" onClick={unlinkEpic} disabled={epicLoading}>
                                                {epicLoading ? 'Procesando...' : 'Desvincular'}
                                            </button>
                                        ) : (
                                            <button className="stv2-btn stv2-btn--primary" onClick={startEpicLink} disabled={epicLoading}>
                                                {epicLoading ? 'Redirigiendo...' : 'Vincular'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                            </div>

                            {/* Streaming & Social */}
                            <h3 className="stv2-section__subtitle">Streaming y Social</h3>
                            <div className="stv2-connections">
                                {/* Twitch */}
                                <div className="stv2-connection">
                                    <div className="stv2-connection__icon stv2-connection__icon--twitch">
                                        <FaTwitch />
                                    </div>
                                    <div className="stv2-connection__info">
                                        <h4>Twitch</h4>
                                        <span>Sin vincular</span>
                                    </div>
                                    <div className="stv2-connection__status">
                                        <span className="stv2-badge stv2-badge--muted">Pendiente</span>
                                    </div>
                                    <div className="stv2-connection__action">
                                        <button className="stv2-btn stv2-btn--outline" disabled>
                                            Próximamente
                                        </button>
                                    </div>
                                </div>

                                {/* Google */}
                                <div className="stv2-connection">
                                    <div className="stv2-connection__icon stv2-connection__icon--google">
                                        <FaGoogle />
                                    </div>
                                    <div className="stv2-connection__info">
                                        <h4>Google</h4>
                                        <span>Sin vincular</span>
                                    </div>
                                    <div className="stv2-connection__status">
                                        <span className="stv2-badge stv2-badge--muted">Pendiente</span>
                                    </div>
                                    <div className="stv2-connection__action">
                                        <button className="stv2-btn stv2-btn--outline" disabled>
                                            Próximamente
                                        </button>
                                    </div>
                                </div>

                                {/* Microsoft */}
                                <div className="stv2-connection">
                                    <div className="stv2-connection__icon stv2-connection__icon--microsoft">
                                        <FaMicrosoft />
                                    </div>
                                    <div className="stv2-connection__info">
                                        <h4>Microsoft</h4>
                                        <span>Sin vincular</span>
                                    </div>
                                    <div className="stv2-connection__status">
                                        <span className="stv2-badge stv2-badge--muted">Pendiente</span>
                                    </div>
                                    <div className="stv2-connection__action">
                                        <button className="stv2-btn stv2-btn--outline" disabled>
                                            Próximamente
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Console Platforms */}
                            <h3 className="stv2-section__subtitle">Consolas</h3>
                            <div className="stv2-connections">
                                {/* Xbox */}
                                <div className="stv2-connection">
                                    <div className="stv2-connection__icon stv2-connection__icon--xbox">
                                        <FaXbox />
                                    </div>
                                    <div className="stv2-connection__info">
                                        <h4>Xbox Live</h4>
                                        <span>Sin vincular</span>
                                    </div>
                                    <div className="stv2-connection__status">
                                        <span className="stv2-badge stv2-badge--muted">Pendiente</span>
                                    </div>
                                    <div className="stv2-connection__action">
                                        <button className="stv2-btn stv2-btn--outline" disabled>
                                            Próximamente
                                        </button>
                                    </div>
                                </div>

                                {/* PlayStation */}
                                <div className="stv2-connection">
                                    <div className="stv2-connection__icon stv2-connection__icon--playstation">
                                        <FaPlaystation />
                                    </div>
                                    <div className="stv2-connection__info">
                                        <h4>PlayStation Network</h4>
                                        <span>Sin vincular</span>
                                    </div>
                                    <div className="stv2-connection__status">
                                        <span className="stv2-badge stv2-badge--muted">Pendiente</span>
                                    </div>
                                    <div className="stv2-connection__action">
                                        <button className="stv2-btn stv2-btn--outline" disabled>
                                            Próximamente
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Legal Disclaimer */}
                            <div className="stv2-disclaimer">
                                <div className="stv2-disclaimer__header">
                                    <FaShieldAlt className="stv2-disclaimer__icon" />
                                    <h4>Aviso Legal y Privacidad</h4>
                                </div>
                                <div className="stv2-disclaimer__content">
                                    <p>
                                        <strong>GLITCH GANG by Steliant</strong> no está respaldado, afiliado, asociado ni patrocinado por 
                                        <strong> Riot Games, Inc.</strong>, <strong>Moonton</strong>, <strong>Valve Corporation</strong>, 
                                        <strong> Epic Games, Inc.</strong>, <strong>Microsoft</strong>, <strong>Sony Interactive Entertainment</strong>, 
                                        <strong> Twitch Interactive</strong> ni <strong>Google LLC</strong>.
                                    </p>
                                    <p>
                                        Todas las marcas comerciales, logotipos e imágenes son propiedad de sus respectivos dueños.
                                        League of Legends y Valorant son marcas registradas de Riot Games, Inc.
                                        Mobile Legends: Bang Bang es una marca registrada de Moonton.
                                    </p>
                                    <p className="stv2-disclaimer__privacy">
                                        <FaLink /> Tus datos de conexión se procesan con controles de acceso y medidas de seguridad del servicio, y no se comparten con terceros sin base legal o consentimiento aplicable.
                                        Consulta nuestra <a href="/legal/privacy">Política de Privacidad</a> y <a href="/legal/terms">Términos de Servicio</a>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );

            case 'riot-link':
                return (
                    <motion.div key="riot-link" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="stv2-section">
                            <button className="stv2-back" onClick={() => setActiveTab('connections')}>
                                <i className="bx bx-arrow-left"></i> Volver a Conexiones
                            </button>
                            <h2 className="stv2-section__title">Centro Riot</h2>
                            <p className="stv2-section__desc">League of Legends usa tu identidad Riot actual. VALORANT requiere autorización explícita mediante Riot Sign On.</p>

                            {riotStatus?.linked ? (
                                <div className="stv2-notice stv2-notice--success">
                                    <i className="bx bx-check-shield"></i>
                                    <p>Identidad Riot lista para LoL: <strong>{riotStatus.riotId}</strong>.</p>
                                </div>
                            ) : (
                                <div className="stv2-notice stv2-notice--warning">
                                    <i className="bx bx-shield-quarter"></i>
                                    <p>Primero puedes vincular tu cuenta Riot para usar LoL. Si autorizas VALORANT con RSO, esa misma cuenta también quedará validada como identidad base.</p>
                                </div>
                            )}

                            {valorantConsentGranted ? (
                                <div className="stv2-notice stv2-notice--success">
                                    <i className="bx bx-badge-check"></i>
                                    <p>{valorantRso?.message || 'VALORANT ya está autorizado mediante Riot Sign On.'}</p>
                                </div>
                            ) : valorantRsoEnabled ? (
                                <div className="stv2-notice stv2-notice--warning">
                                    <i className="bx bx-shield-quarter"></i>
                                    <p>{valorantRso?.message || 'VALORANT necesita tu autorización por Riot Sign On antes de usar datos personales del juego.'}</p>
                                </div>
                            ) : (
                                <div className="stv2-notice stv2-notice--danger">
                                    <i className="bx bx-error-circle"></i>
                                    <p>{valorantRso?.message || 'VALORANT RSO todavía no está configurado en este entorno.'}</p>
                                </div>
                            )}

                            <div className="stv2-form">
                                <h3 className="stv2-section__subtitle">League of Legends / identidad base</h3>
                                {riotStatus?.linked && (
                                    <div className="stv2-form__actions-inline">
                                        <button
                                            className="stv2-btn stv2-btn--ghost"
                                            onClick={syncRiot}
                                            disabled={riotSyncing}
                                        >
                                            {riotSyncing ? 'Sincronizando...' : 'Sync ahora'}
                                        </button>
                                        <button
                                            className="stv2-btn stv2-btn--ghost stv2-btn--danger"
                                            onClick={unlinkRiot}
                                        >
                                            Desvincular Riot
                                        </button>
                                    </div>
                                )}
                                {riotStep === 'idle' ? (
                                    <>
                                        <div className="stv2-form__row">
                                            <div className="stv2-input-group">
                                                <label>Game Name</label>
                                                <input 
                                                    type="text" 
                                                    value={riotGameName} 
                                                    onChange={(e) => setRiotGameName(e.target.value)}
                                                    placeholder="Tu nombre de invocador"
                                                />
                                            </div>
                                            <div className="stv2-input-group">
                                                <label>Tag Line</label>
                                                <input 
                                                    type="text" 
                                                    value={riotTagLine} 
                                                    onChange={(e) => setRiotTagLine(e.target.value)}
                                                    placeholder="Ej: LAN1"
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            className="stv2-btn stv2-btn--primary stv2-btn--lg"
                                            onClick={initRiotLink}
                                            disabled={riotLoading}
                                        >
                                            {riotLoading ? 'Enviando...' : 'Enviar Código de Verificación'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="stv2-input-group">
                                            <label>Código de Verificación</label>
                                            <input 
                                                type="text" 
                                                value={riotOtp} 
                                                onChange={(e) => setRiotOtp(e.target.value)}
                                                placeholder="Ingresa el código de tu correo"
                                            />
                                        </div>
                                        <button 
                                            className="stv2-btn stv2-btn--primary stv2-btn--lg"
                                            onClick={confirmRiotLink}
                                            disabled={riotLoading}
                                        >
                                            {riotLoading ? 'Verificando...' : 'Confirmar Vinculación'}
                                        </button>
                                    </>
                                )}
                                {riotMsg && <p className="stv2-form__msg">{riotMsg}</p>}
                            </div>

                            <div className="stv2-form">
                                <h3 className="stv2-section__subtitle">VALORANT / Riot Sign On</h3>
                                <p className="stv2-section__desc">
                                    Este flujo registra el consentimiento del jugador para VALORANT mediante Riot Sign On. Al autorizarlo, permites que GlitchGang use los datos necesarios de tu cuenta VALORANT para funciones competitivas y de elegibilidad. No usa OTP por correo.
                                </p>
                                <ul className="stv2-consent-list">
                                    <li>Autoriza verificaciones de elegibilidad, integridad competitiva y controles anti-smurf para VALORANT.</li>
                                    <li>No reemplaza tus ajustes de privacidad: mostrar el Riot ID en publico sigue dependiendo de tu configuracion.</li>
                                    <li>Puedes retirar este consentimiento desvinculando tu cuenta Riot desde este mismo panel.</li>
                                </ul>
                                <p className="stv2-section__microcopy">
                                    Para entornos de revision, el alcance publico del flujo tambien queda resumido en <a href="/review/riot">/review/riot</a>.
                                </p>
                                <button
                                    className="stv2-btn stv2-btn--primary stv2-btn--lg"
                                    onClick={startValorantRso}
                                    disabled={valorantRsoLoading || valorantConsentGranted}
                                >
                                    {valorantConsentGranted
                                        ? 'VALORANT autorizado'
                                        : (valorantRsoLoading ? 'Redirigiendo a Riot...' : 'Autorizar VALORANT con Riot Sign On')}
                                </button>
                                {valorantRsoMsg && <p className="stv2-form__msg">{valorantRsoMsg}</p>}
                            </div>
                        </div>
                    </motion.div>
                );

            case 'mlbb-link':
                return (
                    <motion.div key="mlbb-link" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="stv2-section">
                            <button className="stv2-back" onClick={() => setActiveTab('connections')}>
                                <i className="bx bx-arrow-left"></i> Volver a Conexiones
                            </button>
                            <h2 className="stv2-section__title">Vincular Mobile Legends</h2>
                            <p className="stv2-section__desc">Ingresa tu User ID + Zone ID de MLBB para vincular tu cuenta. La mayoría de solicitudes pasan directo; solo escalamos a revisión si detectamos riesgo o cambios inusuales.</p>

                            {mlbbVerificationStatus === 'rejected' && (
                                <div className="stv2-notice stv2-notice--danger">
                                    <i className="bx bx-error"></i>
                                    <p>{connections?.mlbb?.rejectReason || 'La solicitud fue rechazada. Corrige y vuelve a enviar.'}</p>
                                </div>
                            )}

                            {mlbbVerificationStatus === 'pending' ? (
                                <div className="stv2-notice stv2-notice--warning">
                                    <i className="bx bx-time"></i>
                                    <p>Tienes una solicitud en revisión. Puedes cancelarla para volver a enviarla.</p>
                                    <button className="stv2-btn stv2-btn--ghost stv2-btn--danger" onClick={unlinkMlbb} disabled={mlbbLoading}>
                                        {mlbbLoading ? 'Procesando...' : 'Cancelar solicitud'}
                                    </button>
                                </div>
                            ) : mlbbLinked ? (
                                <div className="stv2-notice stv2-notice--success">
                                    <i className="bx bx-check-circle"></i>
                                    <p>Cuenta vinculada: ID {connections?.mlbb?.playerId} ({connections?.mlbb?.zoneId})</p>
                                    <button className="stv2-btn stv2-btn--ghost stv2-btn--danger" onClick={unlinkMlbb} disabled={mlbbLoading}>
                                        {mlbbLoading ? 'Procesando...' : 'Desvincular'}
                                    </button>
                                </div>
                            ) : (
                                <div className="stv2-form">
                                    <div className="stv2-form__row">
                                        <div className="stv2-input-group">
                                            <label>User ID</label>
                                            <input
                                                type="text"
                                                value={mlbbPlayerId}
                                                onChange={(e) => setMlbbPlayerId(e.target.value)}
                                                placeholder="Tu User ID"
                                                disabled={mlbbLoading || mlbbValidating}
                                            />
                                        </div>
                                        <div className="stv2-input-group">
                                            <label>Zone ID</label>
                                            <input
                                                type="text"
                                                value={mlbbZoneId}
                                                onChange={(e) => setMlbbZoneId(e.target.value)}
                                                placeholder="ID de zona/servidor"
                                                disabled={mlbbLoading || mlbbValidating}
                                            />
                                        </div>
                                    </div>
                                    <div className="stv2-input-group">
                                        <label>IGN (opcional)</label>
                                        <input
                                            type="text"
                                            value={mlbbIgn}
                                            onChange={(e) => setMlbbIgn(e.target.value)}
                                            placeholder="Tu nick en juego"
                                            disabled={mlbbLoading || mlbbValidating}
                                        />
                                    </div>
                                    <div className="stv2-form__actions">
                                        <button
                                            className="stv2-btn stv2-btn--outline"
                                            onClick={validateMlbbDraft}
                                            disabled={mlbbLoading || mlbbValidating}
                                        >
                                            {mlbbValidating ? 'Validando...' : 'Validar ID'}
                                        </button>
                                        <button
                                            className="stv2-btn stv2-btn--primary stv2-btn--lg"
                                            onClick={linkMlbb}
                                            disabled={mlbbLoading || mlbbValidating}
                                        >
                                            {mlbbLoading ? 'Enviando...' : 'Enviar Solicitud'}
                                        </button>
                                    </div>
                                    {mlbbMsg && <p className="stv2-form__msg">{mlbbMsg}</p>}
                                </div>
                            )}

                            <div className="stv2-notice stv2-notice--warning">
                                <i className="bx bx-info-circle"></i>
                                <p>La verificación de MLBB es interna. Normalmente no pedimos pasos extra, pero algunas solicitudes pueden pasar a revisión manual para proteger cuentas ya reclamadas o con cambios sospechosos.</p>
                            </div>
                        </div>
                    </motion.div>
                );

            case 'privacy':
                return (
                    <motion.div key="privacy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="stv2-section">
                            <h2 className="stv2-section__title">Privacidad</h2>
                            <p className="stv2-section__desc">Controla quién puede interactuar contigo en la plataforma.</p>

                            <div className="stv2-toggles">
                                <div className="stv2-toggle">
                                    <div className="stv2-toggle__info">
                                        <h4>Invitaciones de Equipos</h4>
                                        <p>Permite que capitanes te envíen ofertas de fichaje.</p>
                                    </div>
                                    <label className="stv2-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={privacy.allowTeamInvites}
                                            onChange={(e) => updatePrivacy({ ...privacy, allowTeamInvites: e.target.checked })}
                                        />
                                        <span className="stv2-switch__slider"></span>
                                    </label>
                                </div>

                                <div className="stv2-toggle">
                                    <div className="stv2-toggle__info">
                                        <h4>Estado en Línea</h4>
                                        <p>Muestra tu estado activo a otros usuarios.</p>
                                    </div>
                                    <label className="stv2-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={privacy.showOnlineStatus}
                                            onChange={(e) => updatePrivacy({ ...privacy, showOnlineStatus: e.target.checked })}
                                        />
                                        <span className="stv2-switch__slider"></span>
                                    </label>
                                </div>

                                <div className="stv2-toggle">
                                    <div className="stv2-toggle__info">
                                        <h4>Invitaciones a Torneos</h4>
                                        <p>Permite que organizadores te inscriban directamente.</p>
                                    </div>
                                    <label className="stv2-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={privacy.allowTournamentInvites}
                                            onChange={(e) => updatePrivacy({ ...privacy, allowTournamentInvites: e.target.checked })}
                                        />
                                        <span className="stv2-switch__slider"></span>
                                    </label>
                                </div>

                                <div className="stv2-toggle">
                                    <div className="stv2-toggle__info">
                                        <h4>ID público</h4>
                                        <p>Muestra tu #ID de usuario cuando otros te buscan o ven tarjetas sociales.</p>
                                    </div>
                                    <label className="stv2-switch">
                                        <input
                                            type="checkbox"
                                            checked={privacy.showPublicUserCode !== false}
                                            onChange={(e) => updatePrivacy({ ...privacy, showPublicUserCode: e.target.checked })}
                                        />
                                        <span className="stv2-switch__slider"></span>
                                    </label>
                                </div>

                                <div className="stv2-toggle">
                                    <div className="stv2-toggle__info">
                                        <h4>Riot ID público</h4>
                                        <p>Muestra tu Riot ID en tarjetas públicas de perfil. Para VALORANT conviene mantenerlo oculto hasta completar el flujo de consentimiento Riot.</p>
                                    </div>
                                    <label className="stv2-switch">
                                        <input
                                            type="checkbox"
                                            checked={privacy.showPublicRiotHandle === true}
                                            onChange={(e) => updatePrivacy({ ...privacy, showPublicRiotHandle: e.target.checked })}
                                        />
                                        <span className="stv2-switch__slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );

            case 'appearance':
                return (
                    <motion.div key="appearance" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="stv2-section">
                            <h2 className="stv2-section__title">Apariencia</h2>
                            <p className="stv2-section__desc">Personaliza tu experiencia visual.</p>

                            <div className="stv2-toggles">
                                <div className="stv2-toggle stv2-toggle--featured">
                                    <div className="stv2-toggle__icon">
                                        <FaEyeSlash />
                                    </div>
                                    <div className="stv2-toggle__info">
                                        <h4>Modo Streamer</h4>
                                        <p>Oculta información sensible mientras transmites.</p>
                                    </div>
                                    <label className="stv2-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={streamerMode}
                                            onChange={handleStreamerModeToggle}
                                        />
                                        <span className="stv2-switch__slider"></span>
                                    </label>
                                </div>

                                <div className="stv2-toggle">
                                    <div className="stv2-toggle__info">
                                        <h4>Reducir Animaciones</h4>
                                        <p>Desactiva animaciones para mejorar rendimiento.</p>
                                    </div>
                                    <label className="stv2-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={reduceAnimations}
                                            onChange={handleReduceAnimationsToggle}
                                        />
                                        <span className="stv2-switch__slider"></span>
                                    </label>
                                </div>
                            </div>

                            <h3 className="stv2-section__subtitle">Tema</h3>
                            <div className="stv2-themes">
                                <button 
                                    className={`stv2-theme ${theme === THEMES.DARK ? 'stv2-theme--active' : ''}`}
                                    onClick={() => setTheme(THEMES.DARK)}
                                >
                                    <div className="stv2-theme__preview stv2-theme__preview--dark"></div>
                                    <span>Oscuro</span>
                                </button>
                                <button 
                                    className={`stv2-theme ${theme === THEMES.LIGHT ? 'stv2-theme--active' : ''}`}
                                    onClick={() => setTheme(THEMES.LIGHT)}
                                >
                                    <div className="stv2-theme__preview stv2-theme__preview--light"></div>
                                    <span>Claro</span>
                                </button>
                                <button 
                                    className={`stv2-theme ${theme === THEMES.AMOLED ? 'stv2-theme--active' : ''}`}
                                    onClick={() => setTheme(THEMES.AMOLED)}
                                >
                                    <div className="stv2-theme__preview stv2-theme__preview--oled"></div>
                                    <span>AMOLED</span>
                                </button>
                                <button 
                                    className={`stv2-theme ${theme === THEMES.GRAY ? 'stv2-theme--active' : ''}`}
                                    onClick={() => setTheme(THEMES.GRAY)}
                                >
                                    <div className="stv2-theme__preview stv2-theme__preview--contrast"></div>
                                    <span>Gris</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );

            case 'billing':
                return (
                    <motion.div key="billing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="stv2-section">
                            <h2 className="stv2-section__title">Suscripción</h2>
                            <p className="stv2-section__desc">Gestiona tu plan y beneficios.</p>

                            {/* Current Plan */}
                            <div className="stv2-plan stv2-plan--current">
                                <div className="stv2-plan__header">
                                    <span className="stv2-plan__badge">Plan Actual</span>
                                    <h3>Rookie</h3>
                                    <span className="stv2-plan__price">Gratis</span>
                                </div>
                                <ul className="stv2-plan__features">
                                    <li><FaCheckCircle /> Estadísticas avanzadas</li>
                                    <li><FaCheckCircle /> 1 equipo por juego</li>
                                    <li><FaCheckCircle /> Torneos públicos</li>
                                </ul>
                            </div>

                            <h3 className="stv2-section__subtitle">Mejora tu Plan</h3>
                            <div className="stv2-plans">
                                <div className="stv2-plan">
                                    <div className="stv2-plan__header">
                                        <h3>Elite</h3>
                                        <span className="stv2-plan__price">RD$ 250<small>/mes</small></span>
                                    </div>
                                    <ul className="stv2-plan__features">
                                        <li><FaCheckCircle /> Multi-equipos</li>
                                        <li><FaCheckCircle /> Priority Pass en torneos</li>
                                        <li><FaCheckCircle /> Comisiones reducidas</li>
                                        <li><FaCheckCircle /> Insignia Elite</li>
                                    </ul>
                                    <button className="stv2-btn stv2-btn--outline">Suscribirse</button>
                                </div>

                                <div className="stv2-plan stv2-plan--featured">
                                    <div className="stv2-plan__ribbon">Mejor Valor</div>
                                    <div className="stv2-plan__header">
                                        <h3>Legend</h3>
                                        <span className="stv2-plan__price">RD$ 2,500<small>/año</small></span>
                                        <span className="stv2-plan__savings">Ahorras 2 meses</span>
                                    </div>
                                    <ul className="stv2-plan__features">
                                        <li><FaCheckCircle /> Todo de Elite</li>
                                        <li><FaCheckCircle /> 2 meses gratis</li>
                                        <li><FaCheckCircle /> Borde dorado exclusivo</li>
                                        <li><FaCheckCircle /> Soporte prioritario</li>
                                    </ul>
                                    <button className="stv2-btn stv2-btn--primary">Suscribirse</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );

            case 'support':
                const getStatusIndicator = (status) => {
                    switch (status) {
                        case 'operational': return 'online';
                        case 'degraded': return 'warning';
                        case 'outage': return 'offline';
                        default: return 'checking';
                    }
                };
                
                const getStatusLabel = (status) => {
                    switch (status) {
                        case 'operational': return 'Operativo';
                        case 'degraded': return 'Degradado';
                        case 'outage': return 'Caído';
                        default: return 'Verificando...';
                    }
                };
                
                const getOverallLabel = () => {
                    if (systemStatus.overall === 'checking') return 'Verificando sistemas...';
                    if (systemStatus.overall === 'operational') return 'Todos los sistemas operativos';
                    return 'Algunos servicios presentan problemas';
                };

                return (
                    <motion.div key="support" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {/* Toast Notification */}
                        <AnimatePresence>
                            {supportToast.show && (
                                <motion.div 
                                    className={`stv2-toast stv2-toast--${supportToast.type}`}
                                    initial={{ opacity: 0, y: -20, x: '-50%' }}
                                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    {supportToast.message}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="stv2-section">
                            <h2 className="stv2-section__title">Centro de Soporte</h2>
                            <p className="stv2-section__desc">Obtén ayuda, reporta problemas y mantente informado.</p>

                            {/* System Status */}
                            <div className="stv2-system-status">
                                <div className="stv2-system-status__header">
                                    <div className={`stv2-system-status__indicator stv2-system-status__indicator--${getStatusIndicator(systemStatus.overall)}`} />
                                    <span className="stv2-system-status__label">{getOverallLabel()}</span>
                                    <button 
                                        className="stv2-system-status__refresh"
                                        onClick={refreshSystemStatus}
                                        disabled={systemStatus.overall === 'checking'}
                                    >
                                        <i className={`bx bx-refresh ${systemStatus.overall === 'checking' ? 'spin' : ''}`} />
                                    </button>
                                </div>
                                <div className="stv2-system-status__services">
                                    <div className="stv2-system-status__service">
                                        <span>Servidores de Juego</span>
                                        <span className={`stv2-badge stv2-badge--${systemStatus.services.gameServers === 'operational' ? 'success' : systemStatus.services.gameServers === 'checking' ? 'info' : 'warning'}`}>
                                            {getStatusLabel(systemStatus.services.gameServers)}
                                        </span>
                                    </div>
                                    <div className="stv2-system-status__service">
                                        <span>API de Torneos</span>
                                        <span className={`stv2-badge stv2-badge--${systemStatus.services.tournamentApi === 'operational' ? 'success' : systemStatus.services.tournamentApi === 'checking' ? 'info' : 'warning'}`}>
                                            {getStatusLabel(systemStatus.services.tournamentApi)}
                                        </span>
                                    </div>
                                    <div className="stv2-system-status__service">
                                        <span>Matchmaking</span>
                                        <span className={`stv2-badge stv2-badge--${systemStatus.services.matchmaking === 'operational' ? 'success' : systemStatus.services.matchmaking === 'checking' ? 'info' : 'warning'}`}>
                                            {getStatusLabel(systemStatus.services.matchmaking)}
                                        </span>
                                    </div>
                                    <div className="stv2-system-status__service">
                                        <span>Chat en Vivo</span>
                                        <span className={`stv2-badge stv2-badge--${systemStatus.services.liveChat === 'operational' ? 'success' : systemStatus.services.liveChat === 'checking' ? 'info' : 'warning'}`}>
                                            {getStatusLabel(systemStatus.services.liveChat)}
                                        </span>
                                    </div>
                                </div>
                                {systemStatus.lastChecked && (
                                    <span className="stv2-system-status__timestamp">
                                        Última verificación: {systemStatus.lastChecked.toLocaleTimeString()}
                                    </span>
                                )}
                                <a href="/status" className="stv2-system-status__link">
                                    Ver historial de estado <FaExternalLinkAlt />
                                </a>
                            </div>

                            {/* Quick Actions */}
                            <h3 className="stv2-section__subtitle">Acciones Rápidas</h3>
                            <div className="stv2-support-cards">
                                <div className="stv2-support-card" onClick={() => navigate('/support')}>
                                    <div className="stv2-support-card__icon-wrapper stv2-support-card__icon-wrapper--primary">
                                        <FaHeadset className="stv2-support-card__icon" />
                                    </div>
                                    <div className="stv2-support-card__content">
                                        <h4>Centro de Ayuda</h4>
                                        <p>Base de conocimiento con +50 artículos y guías paso a paso</p>
                                    </div>
                                    <FaChevronRight className="stv2-support-card__arrow" />
                                </div>

                                <div className="stv2-support-card" onClick={() => window.open('https://discord.gg/glitchgang', '_blank')}>
                                    <div className="stv2-support-card__icon-wrapper stv2-support-card__icon-wrapper--discord">
                                        <FaDiscord className="stv2-support-card__icon" />
                                    </div>
                                    <div className="stv2-support-card__content">
                                        <h4>Comunidad Discord</h4>
                                        <p>Soporte en tiempo real y comunidad de jugadores</p>
                                        <span className="stv2-support-card__meta">5,234 miembros activos</span>
                                    </div>
                                    <FaExternalLinkAlt className="stv2-support-card__arrow" />
                                </div>

                                <div
                                    className="stv2-support-card"
                                    onClick={() => setFeedbackModal({ open: true, type: 'bug', message: '', submitting: false })}
                                >
                                    <div className="stv2-support-card__icon-wrapper stv2-support-card__icon-wrapper--warning">
                                        <FaFlag className="stv2-support-card__icon" />
                                    </div>
                                    <div className="stv2-support-card__content">
                                        <h4>Reportar Problema</h4>
                                        <p>Bugs, conductas tóxicas o errores técnicos</p>
                                    </div>
                                    <FaChevronRight className="stv2-support-card__arrow" />
                                </div>

                                <div className="stv2-support-card" onClick={() => setFeedbackModal({ ...feedbackModal, open: true })}>
                                    <div className="stv2-support-card__icon-wrapper stv2-support-card__icon-wrapper--info">
                                        <i className='bx bx-message-square-dots' style={{ fontSize: '1.2rem' }} />
                                    </div>
                                    <div className="stv2-support-card__content">
                                        <h4>Enviar Feedback</h4>
                                        <p>Sugerencias y mejoras para la plataforma</p>
                                    </div>
                                    <FaChevronRight className="stv2-support-card__arrow" />
                                </div>
                            </div>

                            {/* Contact Options */}
                            <h3 className="stv2-section__subtitle">Contacto Directo</h3>
                            <div className="stv2-contact-grid">
                                <div className="stv2-contact-item" onClick={() => copyEmailToClipboard('steliantsoft@gmail.com')}>
                                    <div className="stv2-contact-item__icon">
                                        <i className='bx bx-envelope' />
                                    </div>
                                    <div className="stv2-contact-item__info">
                                        <span className="stv2-contact-item__label">Soporte General</span>
                                        <span className="stv2-contact-item__value">steliantsoft@gmail.com</span>
                                    </div>
                                    <i className='bx bx-copy stv2-contact-item__copy' />
                                </div>
                                <div className="stv2-contact-item" onClick={() => copyEmailToClipboard('steliantsoft@gmail.com')}>
                                    <div className="stv2-contact-item__icon">
                                        <i className='bx bx-shield-quarter' />
                                    </div>
                                    <div className="stv2-contact-item__info">
                                        <span className="stv2-contact-item__label">Seguridad y Antifraude</span>
                                        <span className="stv2-contact-item__value">steliantsoft@gmail.com</span>
                                    </div>
                                    <i className='bx bx-copy stv2-contact-item__copy' />
                                </div>
                                <div className="stv2-contact-item" onClick={() => copyEmailToClipboard('steliantsoft@gmail.com')}>
                                    <div className="stv2-contact-item__icon">
                                        <i className='bx bx-briefcase' />
                                    </div>
                                    <div className="stv2-contact-item__info">
                                        <span className="stv2-contact-item__label">Asociaciones y Negocios</span>
                                        <span className="stv2-contact-item__value">steliantsoft@gmail.com</span>
                                    </div>
                                    <i className='bx bx-copy stv2-contact-item__copy' />
                                </div>
                                <div className="stv2-contact-item" onClick={() => copyEmailToClipboard('steliantsoft@gmail.com')}>
                                    <div className="stv2-contact-item__icon">
                                        <i className='bx bx-news' />
                                    </div>
                                    <div className="stv2-contact-item__info">
                                        <span className="stv2-contact-item__label">Prensa y Medios</span>
                                        <span className="stv2-contact-item__value">steliantsoft@gmail.com</span>
                                    </div>
                                    <i className='bx bx-copy stv2-contact-item__copy' />
                                </div>
                            </div>

                            {/* Social Links */}
                            <h3 className="stv2-section__subtitle">Síguenos</h3>
                            <div className="stv2-social-links">
                                <a href="https://twitter.com/glitchgang" target="_blank" rel="noopener noreferrer" className="stv2-social-link stv2-social-link--twitter">
                                    <i className='bx bxl-twitter' />
                                    <span>Twitter</span>
                                </a>
                                <a href="https://instagram.com/glitchgang" target="_blank" rel="noopener noreferrer" className="stv2-social-link stv2-social-link--instagram">
                                    <i className='bx bxl-instagram' />
                                    <span>Instagram</span>
                                </a>
                                <a href="https://tiktok.com/@glitchgang" target="_blank" rel="noopener noreferrer" className="stv2-social-link stv2-social-link--tiktok">
                                    <i className='bx bxl-tiktok' />
                                    <span>TikTok</span>
                                </a>
                                <a href="https://youtube.com/@glitchgang" target="_blank" rel="noopener noreferrer" className="stv2-social-link stv2-social-link--youtube">
                                    <i className='bx bxl-youtube' />
                                    <span>YouTube</span>
                                </a>
                            </div>

                            {/* App Info */}
                            <div className="stv2-app-info">
                                <div className="stv2-app-info__logo">
                                    <span className="stv2-app-info__name">GLITCH GANG</span>
                                    <span className="stv2-app-info__badge">BETA</span>
                                </div>
                                <div className="stv2-app-info__details">
                                    <div className="stv2-app-info__row">
                                        <span>Versión</span>
                                        <span>1.0.5-beta.1</span>
                                    </div>
                                    <div className="stv2-app-info__row">
                                        <span>Última actualización</span>
                                        <span>23 de marzo, 2026</span>
                                    </div>
                                    <div className="stv2-app-info__row">
                                        <span>Entorno</span>
                                        <span>Producción</span>
                                    </div>
                                </div>
                                <div className="stv2-app-info__links">
                                    <a href="/changelog">Registro de cambios</a>
                                    <span>·</span>
                                    <a href="/privacy">Privacidad</a>
                                    <span>·</span>
                                    <a href="/terms">Términos</a>
                                    <span>·</span>
                                    <a href="/licenses">Licencias</a>
                                </div>
                                <p className="stv2-app-info__copyright">
                                    © 2024-2026 GLITCH GANG. Todos los derechos reservados.
                                </p>
                            </div>
                        </div>

                        {/* Feedback Modal */}
                        <AnimatePresence>
                            {feedbackModal.open && (
                                <motion.div 
                                    className="stv2-modal-overlay"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => !feedbackModal.submitting && setFeedbackModal({ ...feedbackModal, open: false })}
                                >
                                    <motion.div 
                                        className="stv2-modal stv2-modal--feedback"
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="stv2-modal__header">
                                            <h3>Enviar Feedback</h3>
                                            <button 
                                                className="stv2-modal__close"
                                                onClick={() => setFeedbackModal({ ...feedbackModal, open: false })}
                                                disabled={feedbackModal.submitting}
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                        <div className="stv2-modal__body">
                                            <div className="stv2-feedback-types">
                                                {[
                                                    { id: 'suggestion', label: 'Sugerencia', icon: 'bx-bulb' },
                                                    { id: 'bug', label: 'Bug', icon: 'bx-bug' },
                                                    { id: 'feature', label: 'Nueva función', icon: 'bx-star' },
                                                    { id: 'other', label: 'Otro', icon: 'bx-dots-horizontal-rounded' }
                                                ].map(type => (
                                                    <button
                                                        key={type.id}
                                                        className={`stv2-feedback-type ${feedbackModal.type === type.id ? 'stv2-feedback-type--active' : ''}`}
                                                        onClick={() => setFeedbackModal({ ...feedbackModal, type: type.id })}
                                                        disabled={feedbackModal.submitting}
                                                    >
                                                        <i className={`bx ${type.icon}`} />
                                                        <span>{type.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                className="stv2-feedback-textarea"
                                                placeholder="Cuéntanos tu experiencia, sugerencia o el problema que encontraste..."
                                                value={feedbackModal.message}
                                                onChange={e => setFeedbackModal({ ...feedbackModal, message: e.target.value })}
                                                disabled={feedbackModal.submitting}
                                                rows={5}
                                            />
                                            <p className="stv2-feedback-hint">
                                                <FaInfoCircle /> Tu feedback nos ayuda a mejorar GLITCH GANG
                                            </p>
                                        </div>
                                        <div className="stv2-modal__footer">
                                            <button 
                                                className="stv2-btn stv2-btn--ghost"
                                                onClick={() => setFeedbackModal({ ...feedbackModal, open: false })}
                                                disabled={feedbackModal.submitting}
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                className="stv2-btn stv2-btn--primary"
                                                onClick={handleFeedbackSubmit}
                                                disabled={feedbackModal.submitting || !feedbackModal.message.trim()}
                                            >
                                                {feedbackModal.submitting ? (
                                                    <>
                                                        <i className='bx bx-loader-alt spin' /> Enviando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className='bx bx-send' /> Enviar Feedback
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );

            case 'mlbb-review':
                return (
                    <motion.div key="mlbb-review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="stv2-section">
                            <h2 className="stv2-section__title">Revisión MLBB (Admin)</h2>
                            <p className="stv2-section__desc">Aprueba o rechaza solicitudes pendientes de vinculación Mobile Legends.</p>

                            {mlbbReviewMsg && (
                                <div className="stv2-notice stv2-notice--warning">
                                    <i className="bx bx-info-circle" />
                                    <p>{mlbbReviewMsg}</p>
                                </div>
                            )}

                            <div className="stv2-admin-toolbar">
                                <button
                                    className="stv2-btn stv2-btn--outline"
                                    onClick={fetchMlbbPendingReviews}
                                    disabled={mlbbReviewLoading}
                                >
                                    {mlbbReviewLoading ? 'Cargando...' : 'Actualizar pendientes'}
                                </button>
                                <button
                                    className="stv2-btn stv2-btn--outline"
                                    onClick={fetchMlbbOpsStatus}
                                    disabled={mlbbOpsLoading}
                                >
                                    {mlbbOpsLoading ? 'Consultando...' : 'Actualizar estado cola'}
                                </button>
                                <button
                                    className="stv2-btn stv2-btn--primary"
                                    onClick={processMlbbQueueNow}
                                    disabled={mlbbOpsLoading}
                                >
                                    {mlbbOpsLoading ? 'Procesando...' : 'Procesar cola ahora'}
                                </button>
                            </div>

                            <div className="stv2-admin-queue">
                                <span>Modo: {mlbbOpsStatus?.mode || '-'}</span>
                                <span>Pendientes cola: {mlbbOpsStatus?.queue?.byStatus?.pending ?? 0}</span>
                                <span>Errores cola: {mlbbOpsStatus?.queue?.byStatus?.failed ?? 0}</span>
                                <span>SMTP: {mlbbOpsStatus?.queue?.smtpConfigured ? 'OK' : 'No configurado'}</span>
                            </div>

                            {mlbbReviewLoading ? (
                                <div className="stv2-empty-state">Cargando solicitudes...</div>
                            ) : mlbbPendingReviews.length === 0 ? (
                                <div className="stv2-empty-state">No hay solicitudes pendientes.</div>
                            ) : (
                                <div className="stv2-admin-grid">
                                    {mlbbPendingReviews.map((item) => (
                                        <article className="stv2-admin-card" key={item.userId}>
                                            <div className="stv2-admin-card__head">
                                                <h4>{item.fullName || item.username || 'Usuario'}</h4>
                                                <span>{item.email || 'Sin correo'}</span>
                                            </div>
                                            <div className="stv2-admin-card__meta">
                                                <strong>ID:</strong> {item.playerId} ({item.zoneId})<br />
                                                <strong>IGN:</strong> {item.ign || 'N/D'}<br />
                                                <strong>Solicitado:</strong> {item.reviewRequestedAt ? new Date(item.reviewRequestedAt).toLocaleString() : 'N/D'}
                                            </div>
                                            {Array.isArray(item.riskFlags) && item.riskFlags.length > 0 && (
                                                <div className="stv2-admin-card__risk">
                                                    Riesgo: {item.riskFlags.join(', ')}
                                                </div>
                                            )}
                                            <input
                                                type="text"
                                                placeholder="Motivo de rechazo (requerido para rechazar)"
                                                value={mlbbRejectReasons[item.userId] || ''}
                                                onChange={(e) => setMlbbRejectReasons((prev) => ({ ...prev, [item.userId]: e.target.value }))}
                                                disabled={mlbbReviewActionUserId === item.userId}
                                            />
                                            <div className="stv2-admin-card__actions">
                                                <button
                                                    className="stv2-btn stv2-btn--primary"
                                                    onClick={() => reviewMlbbRequest(item.userId, 'approve')}
                                                    disabled={mlbbReviewActionUserId === item.userId}
                                                >
                                                    {mlbbReviewActionUserId === item.userId ? 'Procesando...' : 'Aprobar'}
                                                </button>
                                                <button
                                                    className="stv2-btn stv2-btn--ghost stv2-btn--danger"
                                                    onClick={() => reviewMlbbRequest(item.userId, 'reject')}
                                                    disabled={mlbbReviewActionUserId === item.userId}
                                                >
                                                    {mlbbReviewActionUserId === item.userId ? 'Procesando...' : 'Rechazar'}
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    const currentTab =
        activeTab === 'mlbb-review'
            ? { label: 'Revisión MLBB', description: 'Gestión de solicitudes pendientes.' }
            : (TABS.find(t => t.id === activeTab) || TABS[0]);
    const isSubPage = ['riot-link', 'mlbb-link'].includes(activeTab);

    return (
        <div className="stv2">
            {/* Background Effects */}
            <div className="stv2__particles">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="stv2__particle"
                        style={{
                            left: p.x,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            animationDelay: p.delay,
                            animationDuration: p.duration
                        }}
                    />
                ))}
            </div>
            <div className="stv2__gradient stv2__gradient--1" />
            <div className="stv2__gradient stv2__gradient--2" />

            <div className="stv2__container">
                {/* Header */}
                <header className="stv2__header">
                    <div className="stv2__header-content">
                        <span className="stv2__header-kicker">Centro de control</span>
                        <div className="stv2__header-main">
                            <div>
                                <h1>Configuración</h1>
                                <p>Gestiona tu cuenta, conexiones y preferencias</p>
                            </div>
                            <div className="stv2__header-badges">
                                <span className="stv2__header-chip stv2__header-chip--active">{currentTab.label}</span>
                                <span className="stv2__header-chip">{currentTab.description}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="stv2__layout">
                    {/* Sidebar */}
                    <aside className="stv2__sidebar">
                        <nav className="stv2__nav">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        className={`stv2__nav-item ${activeTab === tab.id ? 'stv2__nav-item--active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        <Icon className="stv2__nav-icon" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        {isAdmin && (
                            <div className="stv2__nav-divider" />
                        )}
                        {isAdmin && (
                            <nav className="stv2__nav stv2__nav--admin">
                                <button
                                    className={`stv2__nav-item ${activeTab === 'mlbb-review' ? 'stv2__nav-item--active' : ''}`}
                                    onClick={() => setActiveTab('mlbb-review')}
                                >
                                    <FaKey className="stv2__nav-icon" />
                                    <span>Admin MLBB</span>
                                </button>
                            </nav>
                        )}
                    </aside>

                    {/* Main Content */}
                    <main className="stv2__content">
                        <AnimatePresence mode="wait">
                            {renderContent()}
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </div>
    );
}
