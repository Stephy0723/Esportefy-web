import { useNavigate, useLocation } from 'react-router-dom';
import React, { useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaShieldAlt, FaGamepad, FaCreditCard, FaUserSecret,
    FaPaintBrush, FaHeadset, FaSave, FaTrash, FaDiscord,
    FaSteam, FaCheckCircle, FaLock, FaEyeSlash, FaBug, FaExternalLinkAlt,
    FaExclamationTriangle, FaFlag, FaEnvelope, FaKey, FaMobileAlt,
    FaApple, FaAndroid, FaWindows, FaLinux
} from 'react-icons/fa';
import './Settings.css';
import axios from "axios";
import { API_URL } from '../../../config/api';
import { useEffect } from "react";
import SecurityCenterUI from './SecurityCenterUI';
import PageHud from '../../../components/PageHud/PageHud';
import { isMlbbVerifiedStatus, normalizeMlbbVerificationStatus } from '../../../utils/mlbbStatus';
import { getAuthToken, cacheAuthUser } from '../../../utils/authSession';

// Animation variants
const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.1 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
};

const sidebarVariants = {
    initial: { x: -50, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

const contentVariants = {
    initial: { y: 30, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
    exit: { y: -20, opacity: 0, transition: { duration: 0.2 } }
};

const navItemVariants = {
    initial: { x: -20, opacity: 0 },
    animate: (i) => ({
        x: 0,
        opacity: 1,
        transition: { delay: i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }
    })
};


export default function Settings() {

    const location = useLocation();

    // Generate floating particles
    const particles = useMemo(() => {
        return Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: `${Math.random() * 100}%`,
            delay: `${Math.random() * 8}s`,
            duration: `${12 + Math.random() * 10}s`,
            size: Math.random() * 3 + 1
        }));
    }, []);

    const [privacy, setPrivacy] = useState({
        allowTeamInvites: false,
        showOnlineStatus: false,
        allowTournamentInvites: false
    });


    const [connections, setConnections] = useState({
        discord: {},
        riot: {},
        mlbb: {},
        steam: {}
    });
    const [gameProfiles, setGameProfiles] = useState({});
    const [accountEmail, setAccountEmail] = useState('');
    const [emailVerified, setEmailVerified] = useState(false);

    // ===== RIOT STATE =====
    const [riotGameName, setRiotGameName] = useState('');
    const [riotTagLine, setRiotTagLine] = useState('');
    const [riotLoading, setRiotLoading] = useState(false);
    const [riotValidating, setRiotValidating] = useState(false);
    const [riotSyncing, setRiotSyncing] = useState(false);
    const [riotStatus, setRiotStatus] = useState(null);

    // ===== RIOT OTP FLOW =====
    const [riotStep, setRiotStep] = useState('idle'); // idle | otpSent
    const [riotOtp, setRiotOtp] = useState('');
    const [riotMsg, setRiotMsg] = useState('');

    // ===== MLBB STATE =====
    const [mlbbPlayerId, setMlbbPlayerId] = useState('');
    const [mlbbZoneId, setMlbbZoneId] = useState('');
    const [mlbbIgn, setMlbbIgn] = useState('');
    const [mlbbLoading, setMlbbLoading] = useState(false);
    const [mlbbValidating, setMlbbValidating] = useState(false);
    const [mlbbMsg, setMlbbMsg] = useState('');
    const [mlbbStatus, setMlbbStatus] = useState(null);
    const mlbbVerificationStatus = normalizeMlbbVerificationStatus(
        connections?.mlbb?.verificationStatus,
        connections?.mlbb?.verified
    );
    const mlbbLinked = isMlbbVerifiedStatus(mlbbVerificationStatus, connections?.mlbb?.verified);


    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [mlbbPendingReviews, setMlbbPendingReviews] = useState([]);
    const [mlbbReviewLoading, setMlbbReviewLoading] = useState(false);
    const [mlbbReviewMsg, setMlbbReviewMsg] = useState('');
    const [mlbbReviewActionUserId, setMlbbReviewActionUserId] = useState('');
    const [mlbbRejectReasons, setMlbbRejectReasons] = useState({});
    const [mlbbOpsLoading, setMlbbOpsLoading] = useState(false);
    const [mlbbOpsStatus, setMlbbOpsStatus] = useState(null);

    const token = getAuthToken();

    const updatePrivacy = async (newPrivacy) => {
        try {
            await axios.put(
                `${API_URL}/api/settings/privacy`,
                { privacy: newPrivacy },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setPrivacy(newPrivacy);
        } catch (error) {
            console.error(error);
        }
    };

    const [activeTab, setActiveTab] = useState('security');
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [expandedTabs, setExpandedTabs] = useState({});
    const tabsScrollRef = useRef(null);
    const [tabsOverflow, setTabsOverflow] = useState({ left: false, right: false });

    const settingsTabs = [
        { id: 'security', label: 'Seguridad', icon: FaShieldAlt, desc: 'Protege tu cuenta y accesos.' },
        { id: 'connections', label: 'Conexiones', icon: FaGamepad, desc: 'Vincula cuentas y Game IDs.' },
        { id: 'appearance', label: 'Apariencia', icon: FaPaintBrush, desc: 'Ajusta tema y experiencia visual.' },
        { id: 'preferences', label: 'Privacidad', icon: FaUserSecret, desc: 'Controla quién puede encontrarte.' },
        { id: 'billing', label: 'Suscripción', icon: FaCreditCard, desc: 'Administra planes y beneficios.' },
        { id: 'report', label: 'Reportar', icon: FaExclamationTriangle, desc: 'Denuncia errores o conductas.' },
        { id: 'support', label: 'Soporte', icon: FaHeadset, desc: 'Accede a ayuda y asistencia.' },
        ...(isAdmin ? [{ id: 'mlbb-review', label: 'Revisión MLBB', icon: FaKey, desc: 'Gestiona solicitudes pendientes.' }] : [])
    ];
    const activeTabMeta = settingsTabs.find((tab) => tab.id === activeTab) || settingsTabs[0];
    const isTabExpanded = !!expandedTabs[activeTab];
    const expandTab = (tabId) => setExpandedTabs((prev) => ({ ...prev, [tabId]: true }));
    const updateTabsOverflow = () => {
        const el = tabsScrollRef.current;
        if (!el) return;
        setTabsOverflow({
            left: el.scrollLeft > 8,
            right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8
        });
    };
    const scrollTabs = (direction) => {
        const el = tabsScrollRef.current;
        if (!el) return;
        el.scrollBy({ left: direction * 320, behavior: 'smooth' });
    };

    const syncCachedUser = (userData) => {
        if (!userData) return;
        cacheAuthUser(userData);
        window.dispatchEvent(new Event('user-update'));
    };

    const fetchSettings = async () => {
        try {
            const res = await axios.get(
                `${API_URL}/api/auth/profile`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setConnections(res.data.connections);
            setPrivacy(res.data.privacy);
            setGameProfiles(res.data.gameProfiles || {});
            setAccountEmail(String(res.data?.email || '').trim());
            setEmailVerified(res.data?.emailVerified === true);
            setIsAdmin(res.data?.isAdmin === true);
            syncCachedUser(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error cargando settings", error.response?.data || error.message);
        }
    };

    const fetchRiotStatus = async () => {
        try {
            const res = await axios.get(
                `${API_URL}/api/auth/riot/status`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRiotStatus(res.data);
        } catch (error) {
            setRiotStatus(null);
        }
    };

    const fetchMlbbStatus = async () => {
        try {
            const res = await axios.get(
                `${API_URL}/api/auth/mlbb/status`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMlbbStatus(res.data);
        } catch (error) {
            setMlbbStatus(null);
        }
    };

    const riotProfileIconId = gameProfiles?.lol?.profileIconId ?? 0;
    const riotSummonerLevel = gameProfiles?.lol?.summonerLevel;
    const riotRank = gameProfiles?.lol?.rank;

    const unlinkDiscord = async () => {
        try {
            await axios.delete(
                `${API_URL}/api/auth/discord`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            await fetchSettings(); // 🔥 refresca estado real
        } catch (error) {
            console.error(
                'Error al desvincular Discord',
                error.response?.data || error.message
            );
        }
    };

    const startDiscordLink = async () => {
        try {
            const res = await axios.post(
                `${API_URL}/api/auth/discord/start`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const authorizeUrl = res?.data?.authorizeUrl;
            if (!authorizeUrl) {
                console.error('Discord OAuth URL no recibida');
                return;
            }

            window.location.href = authorizeUrl;
        } catch (error) {
            console.error(
                'Error iniciando conexión con Discord',
                error.response?.data || error.message
            );
        }
    };

    const initRiotLink = async () => {
        if (!riotGameName.trim() || !riotTagLine.trim()) {
            setRiotMsg('Debes completar GameName y TagLine');
            return;
        }

        try {
            setRiotLoading(true);
            setRiotMsg('');

            await axios.post(
                `${API_URL}/api/auth/riot/link/init`,
                { riotId: `${riotGameName}#${riotTagLine}` },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setRiotStep('otpSent');
            setRiotMsg('Te enviamos un código al correo. Escríbelo para confirmar.');
        } catch (error) {
            setRiotMsg(error.response?.data?.message || 'Error enviando código');
        } finally {
            setRiotLoading(false);
        }
    };

    const validateRiotDraft = async () => {
        if (!riotGameName.trim() || !riotTagLine.trim()) {
            setRiotMsg('Debes completar GameName y TagLine');
            return;
        }

        try {
            setRiotValidating(true);
            setRiotMsg('');
            const res = await axios.post(
                `${API_URL}/api/auth/riot/validate`,
                { riotId: `${riotGameName}#${riotTagLine}` },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRiotMsg(res.data?.message || 'Riot ID válido');
        } catch (error) {
            setRiotMsg(error.response?.data?.message || 'Riot ID no válido');
        } finally {
            setRiotValidating(false);
        }
    };

    const confirmRiotLink = async () => {
        if (!riotOtp.trim()) {
            setRiotMsg('Escribe el código que te llegó al correo');
            return;
        }

        try {
            setRiotLoading(true);
            setRiotMsg('');

            await axios.post(
                `${API_URL}/api/auth/riot/link/confirm`,
                { otp: riotOtp },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await fetchSettings();
            await fetchRiotStatus();

            setRiotMsg('Riot vinculado y sincronizado ✅');
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

    useEffect(() => {
        if (token) {
            fetchSettings();
            fetchRiotStatus();
            fetchMlbbStatus();
        }
    }, [token]);

    useEffect(() => {
        if (!token || !isAdmin) return;
        if (activeTab !== 'mlbb-review') return;
        fetchMlbbPendingReviews();
        fetchMlbbOpsStatus();
    }, [token, isAdmin, activeTab]);

    useEffect(() => {
        updateTabsOverflow();
        const handleResize = () => updateTabsOverflow();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isAdmin]);

    const unlinkRiot = async () => {
        try {
            const token = getAuthToken();

            await axios.delete(
                `${API_URL}/api/auth/riot`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );


            // 🔥 refrescar estado real desde backend
            fetchSettings();
            fetchRiotStatus();

        } catch (error) {
            console.error(
                'Error al desvincular Riot',
                error.response?.data || error.message
            );
        }
    };

    const syncRiot = async () => {
        try {
            setRiotSyncing(true);
            setRiotMsg('');
            const res = await axios.post(
                `${API_URL}/api/auth/riot/sync`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const syncNote = res.data?.result?.lol?.note || 'Sync completado';
            setRiotMsg(`Sincronización completada: ${syncNote}`);
            await fetchSettings();
            await fetchRiotStatus();
        } catch (error) {
            setRiotMsg(error.response?.data?.message || 'No se pudo sincronizar Riot');
        } finally {
            setRiotSyncing(false);
        }
    };

    const validateMlbbDraft = async () => {
        const playerId = mlbbPlayerId.trim();
        const zoneId = mlbbZoneId.trim();
        const ign = mlbbIgn.trim();

        if (!playerId) {
            setMlbbMsg('User ID es obligatorio.');
            return;
        }
        if (!zoneId) {
            setMlbbMsg('Zone ID es obligatorio.');
            return;
        }
        if (!/^\d+$/.test(playerId)) {
            setMlbbMsg('User ID debe contener solo dígitos (ej: 853455730).');
            return;
        }
        if (!/^\d+$/.test(zoneId)) {
            setMlbbMsg('Zone ID debe contener solo dígitos (ej: 12345).');
            return;
        }

        try {
            setMlbbValidating(true);
            setMlbbMsg('');
            const res = await axios.post(
                `${API_URL}/api/auth/mlbb/validate`,
                { playerId, zoneId, ign },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMlbbMsg(res.data?.message || 'MLBB ID válido.');
        } catch (error) {
            setMlbbMsg(error.response?.data?.message || 'No se pudo validar la cuenta MLBB.');
        } finally {
            setMlbbValidating(false);
        }
    };

    const linkMlbb = async () => {
        if (!mlbbPlayerId.trim() || !mlbbZoneId.trim()) {
            setMlbbMsg('Debes completar User ID y Zone ID.');
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
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await fetchSettings();
            await fetchMlbbStatus();
            const nextStatus = String(res?.data?.status || '');
            setMlbbMsg(
                nextStatus === 'pending'
                    ? 'Solicitud enviada. Tu cuenta MLBB quedó en revisión.'
                    : 'Cuenta MLBB vinculada correctamente ✅'
            );
            setMlbbPlayerId('');
            setMlbbZoneId('');
            setMlbbIgn('');
        } catch (error) {
            setMlbbMsg(error.response?.data?.message || 'No se pudo vincular la cuenta MLBB.');
        } finally {
            setMlbbLoading(false);
        }
    };

    const unlinkMlbb = async () => {
        try {
            setMlbbLoading(true);
            setMlbbMsg('');
            await axios.delete(`${API_URL}/api/auth/mlbb`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchSettings();
            await fetchMlbbStatus();
            setMlbbMsg('Cuenta MLBB desvinculada.');
        } catch (error) {
            setMlbbMsg(error.response?.data?.message || 'No se pudo desvincular la cuenta MLBB.');
        } finally {
            setMlbbLoading(false);
        }
    };

    const fetchMlbbPendingReviews = async () => {
        try {
            setMlbbReviewLoading(true);
            setMlbbReviewMsg('');
            const res = await axios.get(
                `${API_URL}/api/auth/mlbb/review/pending`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMlbbPendingReviews(Array.isArray(res.data?.items) ? res.data.items : []);
        } catch (error) {
            setMlbbReviewMsg(error.response?.data?.message || 'No se pudo cargar la revisión MLBB.');
            setMlbbPendingReviews([]);
        } finally {
            setMlbbReviewLoading(false);
        }
    };

    const fetchMlbbOpsStatus = async () => {
        try {
            setMlbbOpsLoading(true);
            const res = await axios.get(
                `${API_URL}/api/auth/mlbb/ops/status`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
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
            await axios.post(
                `${API_URL}/api/auth/mlbb/ops/process`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
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
                action === 'reject'
                    ? { action: 'reject', reason }
                    : { action: 'approve' },
                { headers: { Authorization: `Bearer ${token}` } }
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


    const renderContent = () => {
        switch (activeTab) {
                        case 'security':
                if (loading || !privacy) return null;

                return (
                    <div className="settings-panel fade-in">
                        <SecurityCenterUI
                            email={accountEmail || 'usuario@glitchgang.net'}
                            isVerified={emailVerified}
                            onVerificationStatusChange={fetchSettings}
                        />
                    </div>
                );

            case 'connections':
                return (
                    <div className="settings-panel fade-in">
                        <div className="panel-header">
                            <h2>Conexiones (Game ID)</h2>
                            <p>Vincula tus cuentas para verificar estadísticas en torneos.</p>
                        </div>

                        <div className="integrations-grid">
                            <div className={`integration-card ${connections?.discord?.id ? 'connected' : ''}`}>

                                <div className={`int-status ${connections?.discord?.id ? '' : 'pending'}`}>
                                    {connections?.discord?.id ? 'Conectado' : 'No conectado'}
                                </div>

                                <div className="int-icon discord">
                                    <FaDiscord />
                                </div>

                                <div className="int-details">
                                    <h4>Discord</h4>
                                    <span>
                                        {connections?.discord?.username || 'Sin vincular'}
                                    </span>
                                </div>

                                {connections?.discord?.id ? (
                                    <button
                                        className="btn-disconnect"
                                        onClick={unlinkDiscord}
                                    >
                                        Desvincular
                                    </button>
                                ) : (
                                    <button
                                        className="btn-connect"
                                        onClick={startDiscordLink}
                                    >
                                        Conectar
                                    </button>
                                )}


                            </div>


                            <div className={`integration-card riot-card ${connections?.riot?.verified ? 'connected' : ''}`}>


                                <div className="int-status">
                                    {connections?.riot?.verified ? 'Conectado' : 'No conectado'}
                                </div>

                                <div className="int-icon riot" aria-hidden="true">
                                    <i className="bx bx-shield-quarter riot-generic-icon"></i>
                                </div>

                                <div className="int-details">
                                    <h4>Cuenta Riot</h4>
                                    {riotStatus?.api?.message && (
                                        <small className="riot-msg">
                                            {riotStatus.api.message}
                                        </small>
                                    )}
                                    <small className="riot-msg">
                                        GLITCH GANG no está respaldado por Riot Games y no refleja las opiniones o puntos de vista de Riot Games.
                                    </small>
                                    <small className="riot-msg">
                                        Riot Games y sus propiedades asociadas son marcas o marcas registradas de Riot Games, Inc.
                                    </small>

                                    {connections?.riot?.verified ? (
                                        <div className="riot-profile-box">
                                            <img
                                                src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${riotProfileIconId}.png`}
                                                alt="Riot Icon"
                                                className="riot-avatar"
                                            />

                                            <div className="riot-meta">
                                                <strong>
                                                    {connections.riot.gameName}#{connections.riot.tagLine}
                                                </strong>

                                                <span>Nivel {riotSummonerLevel ?? '-'}</span>

                                                <span>
                                                    {riotRank
                                                        ? `${riotRank.tier} ${riotRank.division} (${riotRank.lp} LP)`
                                                        : 'Sin clasificar'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="riot-form">
                                            <input
                                                type="text"
                                                placeholder="GameName"
                                                value={riotGameName}
                                                onChange={(e) => setRiotGameName(e.target.value)}
                                                disabled={riotLoading || riotStep === 'otpSent'}
                                            />
                                            <input
                                                type="text"
                                                placeholder="TagLine"
                                                value={riotTagLine}
                                                onChange={(e) => setRiotTagLine(e.target.value)}
                                                disabled={riotLoading || riotStep === 'otpSent'}
                                            />

                                            {riotStep === 'otpSent' && (
                                                <input
                                                    type="text"
                                                    className="riot-otp"
                                                    placeholder="Código (OTP)"
                                                    value={riotOtp}
                                                    onChange={(e) => setRiotOtp(e.target.value)}
                                                />
                                            )}

                                            {riotMsg && (
                                                <small className="riot-msg">
                                                    {riotMsg}
                                                </small>
                                            )}

                                            <div className="riot-actions">
                                                {riotStep !== 'otpSent' ? (
                                                    <>
                                                        <button
                                                            className="btn-connect"
                                                            onClick={validateRiotDraft}
                                                            disabled={riotLoading || riotValidating}
                                                        >
                                                            {riotValidating ? 'Validando...' : 'Validar Riot ID'}
                                                        </button>
                                                        <button
                                                            className="btn-connect"
                                                            onClick={initRiotLink}
                                                            disabled={riotLoading || riotValidating}
                                                        >
                                                            {riotLoading ? 'Enviando código...' : 'Enviar código'}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="btn-connect"
                                                            onClick={confirmRiotLink}
                                                            disabled={riotLoading}
                                                        >
                                                            {riotLoading ? 'Confirmando...' : 'Confirmar'}
                                                        </button>

                                                        <button
                                                            className="btn-disconnect"
                                                            type="button"
                                                            onClick={() => {
                                                                setRiotStep('idle');
                                                                setRiotOtp('');
                                                                setRiotMsg('');
                                                            }}
                                                            disabled={riotLoading}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                    )}

                                </div>

                                {connections?.riot?.verified ? (
                                    <div className="riot-actions">
                                        <button
                                            className="btn-connect"
                                            onClick={syncRiot}
                                            disabled={riotSyncing}
                                        >
                                            {riotSyncing ? 'Sincronizando...' : 'Sync ahora'}
                                        </button>
                                        <button className="btn-disconnect" onClick={unlinkRiot}>
                                            Desvincular
                                        </button>
                                    </div>
                                ) : null}
                            </div>


                            <div className={`integration-card ${mlbbLinked ? 'connected' : ''}`}>

                                <div className={`int-status ${mlbbLinked ? '' : 'pending'}`}>
                                    {mlbbLinked
                                        ? 'Conectado'
                                        : mlbbVerificationStatus === 'pending'
                                            ? 'En revisión'
                                            : mlbbVerificationStatus === 'rejected'
                                                ? 'Rechazado'
                                                : 'No conectado'}
                                </div>

                                <div className="int-icon mlbb">
                                    <FaMobileAlt />
                                </div>

                                <div className="int-details">
                                    <h4>Mobile Legends</h4>
                                    {mlbbStatus?.api?.message && (
                                        <small className="riot-msg">{mlbbStatus.api.message}</small>
                                    )}
                                    <small className="riot-msg">
                                        Verificación interna de GLITCH GANG. No es una validación oficial de Moonton/API pública de MLBB.
                                    </small>

                                    {mlbbVerificationStatus === 'pending' && (
                                        <small className="riot-msg">
                                            Solicitud enviada. Te confirmaremos por correo cuando sea revisada.
                                        </small>
                                    )}
                                    {mlbbVerificationStatus === 'rejected' && (
                                        <small className="riot-msg">
                                            {connections?.mlbb?.rejectReason || 'La solicitud fue rechazada. Corrige los datos y vuelve a enviar.'}
                                        </small>
                                    )}

                                    {(mlbbLinked || mlbbVerificationStatus === 'pending' || mlbbVerificationStatus === 'rejected') ? (
                                        <div className="riot-profile-box">
                                            <div className="riot-meta">
                                                <strong>
                                                    ID {connections.mlbb.playerId} ({connections.mlbb.zoneId})
                                                </strong>
                                                <span>
                                                    {connections.mlbb.ign || 'IGN no especificado'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="riot-form">
                                            <input
                                                type="text"
                                                placeholder="User ID"
                                                value={mlbbPlayerId}
                                                onChange={(e) => setMlbbPlayerId(e.target.value)}
                                                disabled={mlbbLoading || mlbbValidating}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Zone ID"
                                                value={mlbbZoneId}
                                                onChange={(e) => setMlbbZoneId(e.target.value)}
                                                disabled={mlbbLoading || mlbbValidating}
                                            />
                                            <input
                                                type="text"
                                                className="riot-otp"
                                                placeholder="IGN (opcional)"
                                                value={mlbbIgn}
                                                onChange={(e) => setMlbbIgn(e.target.value)}
                                                disabled={mlbbLoading || mlbbValidating}
                                            />

                                            {mlbbMsg && (
                                                <small className="riot-msg">{mlbbMsg}</small>
                                            )}

                                            <div className="riot-actions">
                                                <button
                                                    className="btn-connect"
                                                    onClick={validateMlbbDraft}
                                                    disabled={mlbbLoading || mlbbValidating}
                                                >
                                                    {mlbbValidating ? 'Validando...' : 'Validar ID'}
                                                </button>
                                                <button
                                                    className="btn-connect"
                                                    onClick={linkMlbb}
                                                    disabled={mlbbLoading || mlbbValidating}
                                                >
                                                    {mlbbLoading ? 'Conectando...' : 'Conectar'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                    {mlbbLinked ? (
                                        <button
                                            className="btn-disconnect"
                                            onClick={unlinkMlbb}
                                            disabled={mlbbLoading}
                                        >
                                            {mlbbLoading ? 'Procesando...' : 'Desvincular'}
                                        </button>
                                    ) : mlbbVerificationStatus === 'pending' ? (
                                        <button
                                            className="btn-disconnect"
                                            onClick={unlinkMlbb}
                                            disabled={mlbbLoading}
                                        >
                                            {mlbbLoading ? 'Procesando...' : 'Cancelar solicitud'}
                                        </button>
                                    ) : null}
                            </div>



                            {/* <div className={`integration-card ${connections?.steam?.steamId ? 'connected' : ''}`}>

                                <div className={`int-status ${connections?.steam?.steamId ? '' : 'pending'}`}>
                                    {connections?.steam?.steamId ? 'Conectado' : 'No conectado'}
                                </div>

                                <div className="int-icon steam">
                                    <FaSteam />
                                </div>

                                <div className="int-details">
                                    <h4>Steam</h4>
                                    <span>
                                        {connections?.steam?.steamId
                                            ? 'Cuenta vinculada'
                                            : 'Sin vincular'}
                                    </span>
                                </div>

                                {connections?.steam?.steamId ? (
                                    <button className="btn-disconnect">
                                        Desvincular
                                    </button>
                                ) : (
                                    <button
                                        className="btn-connect"
                                        onClick={() => {
                                            window.location.href =
                                                `${API_URL}/api/auth/steam?token=${token}`;
                                        }}
                                    >
                                        Conectar
                                    </button>
                                )}
                            </div> */}

                        </div>
                    </div>
                );

            case 'appearance':
                return (
                    <div className="settings-panel fade-in">
                        <div className="panel-header">
                            <h2>Apariencia e Interfaz</h2>
                            <p>Personaliza tu experiencia visual y privacidad.</p>
                        </div>

                        <div className="toggles-list">
                            {/* MODO STREAMER (Vital para gamers) */}
                            <div className="toggle-item streamer-mode-box">
                                <div className="toggle-info">
                                    <div className="icon-title">
                                        <FaEyeSlash />
                                        <h4>Modo Streamer</h4>
                                    </div>
                                    <p>Oculta correos electrónicos, IDs de invitación y notificaciones sensibles mientras transmites.</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" />
                                    <span className="slider round purple-slider"></span>
                                </label>
                            </div>

                            <div className="divider"></div>

                            <h3>Tema de Interfaz</h3>
                            <div className="theme-selector">
                                <div className="theme-option active">
                                    <div className="theme-preview dark"></div>
                                    <span>GLITCH GANG Dark</span>
                                </div>
                                <div className="theme-option">
                                    <div className="theme-preview midnight"></div>
                                    <span>OLED Black</span>
                                </div>
                                <div className="theme-option">
                                    <div className="theme-preview contrast"></div>
                                    <span>Alto Contraste</span>
                                </div>
                            </div>

                            <div className="divider"></div>

                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <h4>Reducir Movimiento</h4>
                                    <p>Desactiva animaciones complejas (Mejora rendimiento).</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                );

            case 'preferences':
                return (
                    <div className="settings-panel fade-in">
                        <div className="panel-header">
                            <h2>Privacidad</h2>
                            <p>Configura quién puede interactuar contigo.</p>
                        </div>

                        <div className="toggles-list">
                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <h4>Invitaciones de Equipos</h4>
                                    <p>Permitir ofertas de fichaje de cualquier capitán.</p>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={privacy.allowTeamInvites}
                                        onChange={(e) =>
                                            updatePrivacy({
                                                ...privacy,
                                                allowTeamInvites: e.target.checked
                                            })
                                        }
                                    />
                                    <span className="slider round"></span>
                                </label>

                            </div>

                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <h4>Estado en Línea</h4>
                                    <p>Mostrar tu estado en línea a otros usuarios.</p>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={privacy.showOnlineStatus}
                                        onChange={(e) =>
                                            updatePrivacy({
                                                ...privacy,
                                                showOnlineStatus: e.target.checked
                                            })
                                        }
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>


                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <h4>Invitaciones a Torneos</h4>
                                    <p>Permitir que organizadores te inscriban en torneos.</p>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={privacy.allowTournamentInvites}
                                        onChange={(e) =>
                                            updatePrivacy({
                                                ...privacy,
                                                allowTournamentInvites: e.target.checked
                                            })
                                        }
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                );

            case 'billing':
                return (
                    <div className="settings-panel fade-in">
                        <div className="panel-header">
                            <h2>Suscripción y Pagos</h2>
                            <p>Elige cómo quieres competir. Todos los planes incluyen estadísticas profesionales.</p>
                        </div>

                        {/* 1. PLAN ACTUAL (GRATUITO) */}
                        <div className="current-plan-section">
                            <h4>TU PLAN ACTUAL</h4>
                            <div className="plan-card rookie-wide">
                                <div className="rookie-info">
                                    <h3>Rookie (Gratis)</h3>
                                    <p>Perfecto para comenzar tu carrera.</p>
                                </div>
                                <div className="rookie-features">
                                    <span><FaCheckCircle /> Stats Avanzados (KDA, Heatmaps)</span>
                                    <span><FaCheckCircle /> 1 Equipo por Juego</span>
                                    <span><FaCheckCircle /> Torneos Públicos</span>
                                </div>
                                <div className="rookie-status">
                                    ACTIVO
                                </div>
                            </div>
                        </div>

                        <div className="divider" ></div>

                        {!isTabExpanded && (
                            <div className="settings-continue-card settings-continue-card--wide">
                                <h3>Comparar planes avanzados</h3>
                                <p>Continúa para ver Elite Mensual y Legend Anual con todos sus beneficios.</p>
                                <button className="btn-connect" onClick={() => expandTab('billing')}>
                                    Continuar
                                </button>
                            </div>
                        )}

                        {/* 2. OPCIONES DE PAGO (MENSUAL vs ANUAL) */}
                        <div className={`upgrade-title ${!isTabExpanded ? 'settings-collapsed-block' : ''}`}>
                            <h3>MEJORA TU NIVEL</h3>
                            <p>Desbloquea multigestión y prioridad.</p>
                        </div>

                        <div className={`billing-grid-comparison ${!isTabExpanded ? 'settings-collapsed-block' : ''}`}>

                            {/* MENSUAL */}
                            <div className="plan-card monthly">
                                <div className="plan-header">
                                    <h3>Elite Mensual</h3>
                                    <div className="price">RD$ 250 <span className="period">/mes</span></div>
                                    <p>Flexibilidad total.</p>
                                </div>
                                <ul className="plan-features">
                                    <li><FaCheckCircle className="icon-check neon" /> <strong>Multi-Equipos:</strong> Crea varios equipos del mismo juego (Ej: 2 rosters de Valorant).*</li>
                                    <li><FaCheckCircle className="icon-check neon" /> <strong>Priority Pass:</strong> Entra primero en torneos llenos.</li>
                                    <li><FaCheckCircle className="icon-check neon" /> <strong>Comisiones Reducidas</strong> al organizar.</li>
                                    <li><FaCheckCircle className="icon-check neon" /> Insignia de Perfil Elite.</li>
                                </ul>
                                <small className="disclaimer">*No puedes inscribir dos equipos propios en el mismo torneo.</small>
                                <button className="btn-upgrade-outline">
                                    SUSCRIBIRSE
                                </button>
                            </div>

                            {/* ANUAL (BEST VALUE) */}
                            <div className="plan-card annual">
                                <div className="glow-effect"></div>
                                <div className="best-value-badge">MEJOR VALOR</div>
                                <div className="plan-header">
                                    <h3>Legend Anual</h3>
                                    <div className="price">RD$ 2,500 <span className="period">/año</span></div>
                                    <p>Ahorras RD$ 500 (2 meses gratis).</p>
                                </div>
                                <ul className="plan-features">
                                    <li><FaCheckCircle className="icon-check gold" /> <strong>Todos los beneficios Elite.</strong></li>
                                    <li><FaCheckCircle className="icon-check gold" /> <strong>2 Meses GRATIS</strong> incluidos.</li>
                                    <li><FaCheckCircle className="icon-check gold" /> Borde de perfil <strong>Dorado Exclusivo</strong>.</li>
                                    <li><FaCheckCircle className="icon-check gold" /> Soporte directo por WhatsApp.</li>
                                </ul>
                                <button className="btn-upgrade-full">
                                    AHORRAR Y SUSCRIBIRSE
                                </button>
                            </div>

                        </div>
                    </div>
                );

            // --- NUEVA PESTAÑA: REPORTAR ---
            case 'report':
                return (
                    <div className="settings-panel fade-in">
                        <div className="panel-header">
                            <h2>Centro de Reportes</h2>
                            <p>Denuncia conductas inapropiadas, errores o problemas.</p>
                        </div>

                        {/* BANNER HERO DE REPORTE */}
                        <div className="support-hero-banner">
                            <div className="banner-content">
                                <div className="banner-icon">
                                    <FaExclamationTriangle />
                                </div>
                                <div className="banner-text">
                                    <h3>REPORTAR</h3>
                                    <p>Selecciona la categoría y describe la situación. Tu reporte es anónimo.</p>

                                    <div className="report-actions">
                                        <select className="select-banner">
                                            <option>Error / Bug de la Web</option>
                                            <option>Un Equipo (Trampas/Conducta)</option>
                                            <option>Una Organización</option>
                                            <option>Un Jugador (Toxicidad)</option>
                                            <option>Problema de Pagos</option>
                                        </select>
                                        <button className="btn-banner-action">
                                            HACER REPORTE
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="info-box" >
                            <FaFlag className="info-icon" />
                            <div>
                                <strong>Historial de Reportes</strong>
                                <p>No tienes reportes activos pendientes de revisión.</p>
                            </div>
                        </div>
                    </div>
                );

            case 'support':
                return (
                    <div className="settings-panel fade-in">
                        <div className="panel-header">
                            <h2>Soporte y Ayuda</h2>
                            <p>¿Encontraste un bug o necesitas ayuda?</p>
                        </div>

                        <div className="support-grid">
                            <div className="support-card">
                                <FaHeadset className="support-icon" />
                                <h4>Centro de Ayuda</h4>
                                <p>Preguntas frecuentes y tutoriales.</p>

                                {/* AQUÍ ESTÁ EL CAMBIO: onClick */}
                                <button
                                    className="btn-ghost small"
                                    onClick={() => navigate('/support')}
                                >
                                    Ver FAQ <FaExternalLinkAlt />
                                </button>
                            </div>

                            <div className="support-card">
                                <FaDiscord className="support-icon" />
                                <h4>Comunidad Discord</h4>
                                <p>Ayuda en tiempo real con moderadores.</p>
                                <button className="btn-ghost small">Unirse al Server</button>
                            </div>
                        </div>

                        <div className="app-version">
                            <span>GLITCH GANG Web v1.0.5 (Beta)</span>
                        </div>
                    </div>
                );

            case 'mlbb-review':
                return (
                    <div className="settings-panel fade-in">
                        <div className="panel-header">
                            <h2>Revisión MLBB (Admin)</h2>
                            <p>Aprueba o rechaza solicitudes pendientes de vinculación Mobile Legends.</p>
                        </div>

                        {mlbbReviewMsg && (
                            <div className="mlbb-admin-alert">
                                {mlbbReviewMsg}
                            </div>
                        )}

                        <div className="mlbb-admin-alert">
                            <strong>Estado cola:</strong>{' '}
                            {mlbbOpsStatus?.queue?.enabled ? 'Activa' : 'Desactivada'} ·{' '}
                            <strong>SMTP:</strong>{' '}
                            {mlbbOpsStatus?.queue?.smtpConfigured ? 'Configurado' : 'No configurado'} ·{' '}
                            <strong>Pendientes:</strong>{' '}
                            {mlbbOpsStatus?.queue?.byStatus?.pending ?? 0} ·{' '}
                            <strong>Fallidos:</strong>{' '}
                            {mlbbOpsStatus?.queue?.byStatus?.failed ?? 0}
                        </div>

                        <div className="mlbb-admin-actions">
                            <button
                                className="btn-connect"
                                onClick={fetchMlbbPendingReviews}
                                disabled={mlbbReviewLoading}
                                style={{ maxWidth: 220 }}
                            >
                                {mlbbReviewLoading ? 'Cargando...' : 'Actualizar pendientes'}
                            </button>
                            <button
                                className="btn-connect"
                                onClick={fetchMlbbOpsStatus}
                                disabled={mlbbOpsLoading}
                                style={{ maxWidth: 220 }}
                            >
                                {mlbbOpsLoading ? 'Consultando...' : 'Actualizar estado cola'}
                            </button>
                            <button
                                className="btn-disconnect"
                                onClick={processMlbbQueueNow}
                                disabled={mlbbOpsLoading}
                                style={{ maxWidth: 220 }}
                            >
                                {mlbbOpsLoading ? 'Procesando...' : 'Procesar cola ahora'}
                            </button>
                        </div>

                        {!isTabExpanded && (
                            <div className="settings-continue-card settings-continue-card--wide">
                                <h3>Revisar solicitudes pendientes</h3>
                                <p>Continúa para aprobar, rechazar y gestionar la cola completa de verificación MLBB.</p>
                                <button className="btn-connect" onClick={() => expandTab('mlbb-review')}>
                                    Continuar
                                </button>
                            </div>
                        )}

                        <div className={`mlbb-review-list ${!isTabExpanded ? 'settings-collapsed-block' : ''}`}>
                            {mlbbPendingReviews.length === 0 ? (
                                <div className="mlbb-empty-state">
                                    {mlbbReviewLoading ? 'Cargando solicitudes...' : 'No hay solicitudes pendientes.'}
                                </div>
                            ) : (
                                mlbbPendingReviews.map((item) => (
                                    <div className="mlbb-review-card" key={item.userId}>
                                        <div className="mlbb-review-main">
                                            <h4>{item.fullName || item.username || 'Usuario'}</h4>
                                            <span>@{item.username || 'sin-username'}</span>
                                            <small>{item.email || 'sin-email'}</small>
                                            <p>
                                                ID {item.playerId} ({item.zoneId}) {item.ign ? `• IGN: ${item.ign}` : ''}
                                            </p>
                                        </div>

                                        <div className="mlbb-review-controls">
                                            <input
                                                type="text"
                                                placeholder="Motivo de rechazo (obligatorio para rechazar)"
                                                value={mlbbRejectReasons[item.userId] || ''}
                                                onChange={(e) =>
                                                    setMlbbRejectReasons((prev) => ({
                                                        ...prev,
                                                        [item.userId]: e.target.value
                                                    }))
                                                }
                                                disabled={mlbbReviewActionUserId === item.userId}
                                            />
                                            <div className="mlbb-review-buttons">
                                                <button
                                                    className="btn-connect"
                                                    onClick={() => reviewMlbbRequest(item.userId, 'approve')}
                                                    disabled={mlbbReviewActionUserId === item.userId}
                                                >
                                                    {mlbbReviewActionUserId === item.userId ? 'Procesando...' : 'Aprobar'}
                                                </button>
                                                <button
                                                    className="btn-disconnect"
                                                    onClick={() => reviewMlbbRequest(item.userId, 'reject')}
                                                    disabled={mlbbReviewActionUserId === item.userId}
                                                >
                                                    Rechazar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <motion.div 
            className="settings-page"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            {/* Floating Particles Background */}
            <div className="settings-particles">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="settings-particle"
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

            {/* Ambient Gradient Orbs */}
            <div className="settings-ambient-orb settings-ambient-orb--1" />
            <div className="settings-ambient-orb settings-ambient-orb--2" />
            <div className="settings-ambient-orb settings-ambient-orb--3" />

            {/* Grid Background */}
            <div className="settings-grid" />

            <PageHud page="AJUSTES" />
            <div className="settings-layout">
                {/* SIDEBAR DE NAVEGACIÓN */}
                <motion.aside 
                    className="settings-sidebar"
                    variants={sidebarVariants}
                >
                    <div className="sidebar-header">
                        <div>
                            <h3>Ajustes</h3>
                            <p>Panel general de cuenta, privacidad y conexiones.</p>
                        </div>
                        <motion.div 
                            className="settings-active-tab"
                            key={activeTab}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <span>{activeTabMeta.label}</span>
                            <p>{activeTabMeta.desc}</p>
                        </motion.div>
                    </div>
                    <div className="settings-nav-shell">
                        {tabsOverflow.left && (
                            <button className="settings-nav-more settings-nav-more--back" onClick={() => scrollTabs(-1)}>
                                Volver
                            </button>
                        )}
                        <nav className="settings-nav settings-nav--rail" ref={tabsScrollRef} onScroll={updateTabsOverflow}>
                            {settingsTabs.map((tab, index) => {
                                const Icon = tab.icon;
                                return (
                                    <motion.button
                                        key={tab.id}
                                        className={`nav-item nav-item--rail ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                        variants={navItemVariants}
                                        custom={index}
                                        whileHover={{ x: 4, transition: { duration: 0.2 } }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Icon />
                                        <span className="nav-item__copy">
                                            <strong>{tab.label}</strong>
                                            <small>{tab.desc}</small>
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </nav>
                        {tabsOverflow.right && (
                            <button className="settings-nav-more" onClick={() => scrollTabs(1)}>
                                Continuar
                            </button>
                        )}
                    </div>
                    <nav className="settings-nav">
                        {[
                            { id: 'security', icon: FaShieldAlt, label: 'Seguridad' },
                            { id: 'connections', icon: FaGamepad, label: 'Conexiones' },
                            { id: 'appearance', icon: FaPaintBrush, label: 'Apariencia' },
                            { id: 'preferences', icon: FaUserSecret, label: 'Privacidad' },
                            { id: 'billing', icon: FaCreditCard, label: 'Suscripción' }
                        ].map((item, idx) => (
                            <motion.button
                                key={item.id}
                                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(item.id)}
                                variants={navItemVariants}
                                custom={idx}
                                whileHover={{ x: 4, transition: { duration: 0.2 } }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <item.icon /> {item.label}
                            </motion.button>
                        ))}

                        <div className="divider" />

                        {/* PESTAÑA REPORTAR */}
                        <motion.button 
                            className={`nav-item ${activeTab === 'report' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('report')}
                            variants={navItemVariants}
                            custom={5}
                            whileHover={{ x: 4, transition: { duration: 0.2 } }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <FaExclamationTriangle /> Reportar
                        </motion.button>

                        {/* PESTAÑA SOPORTE */}
                        <motion.button 
                            className={`nav-item ${activeTab === 'support' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('support')}
                            variants={navItemVariants}
                            custom={6}
                            whileHover={{ x: 4, transition: { duration: 0.2 } }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <FaHeadset /> Soporte
                        </motion.button>

                        {isAdmin && (
                            <motion.button 
                                className={`nav-item ${activeTab === 'mlbb-review' ? 'active' : ''}`} 
                                onClick={() => setActiveTab('mlbb-review')}
                                variants={navItemVariants}
                                custom={7}
                                whileHover={{ x: 4, transition: { duration: 0.2 } }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <FaKey /> Revisión MLBB
                            </motion.button>
                        )}
                    </nav>
                </motion.aside>

                {/* ÁREA DE CONTENIDO */}
                <main className="settings-content">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            variants={contentVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </motion.div>
    );
}
