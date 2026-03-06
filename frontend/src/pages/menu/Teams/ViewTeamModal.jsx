import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { esportsCatalog } from '../../../data/esportsCatalog.jsx';
import { API_URL } from '../../../config/api';
import { applyImageFallback, getBotAvatarFallback, getTeamFallback, resolveMediaUrl } from '../../../utils/media';
import { formatTeamPublicId } from '../../../utils/publicIds';
import './ViewTeamModal.css';

/* ── Role names per game ── */
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

const RIOT_GAMES = new Set(['Valorant', 'League of Legends', 'Wild Rift', 'Teamfight Tactics', 'Legends of Runeterra']);
const MLBB_GAMES = new Set(['Mobile Legends', 'Mobile Legends: Bang Bang', 'MLBB']);
const REGION_OPTIONS = ["LAN", "LAS", "NA", "BR", "EUW", "EUNE", "TR", "RU", "OCE", "KR", "JP", "PH", "SG", "TH", "TW", "VN", "LATAM", "GLOBAL"];

const LEVEL_OPTIONS = ['Casual', 'Amateur', 'Semi-Pro', 'Universitario', 'Profesional', 'Leyenda (Elite)'];
const GENDER_OPTIONS = ['Mixto', 'Femenino', 'Masculino'];
const LANGUAGE_OPTIONS = ['Español', 'English', 'Português', 'Français'];

const TABS = [
    { key: 'info', icon: 'bx-info-circle', label: 'Info' },
    { key: 'roster', icon: 'bx-group', label: 'Roster' },
    { key: 'requests', icon: 'bx-time-five', label: 'Solicitudes' },
    { key: 'settings', icon: 'bx-cog', label: 'Ajustes' },
];

const ViewTeamModal = ({ isOpen, onClose, team, currentUser, onTeamUpdated, initialInviteCode, initialTab = 'info' }) => {
    if (!isOpen || !team) return null;

    /* ── helpers ── */
    const normalizeGame = (v) => String(v || '').trim().toLowerCase();
    const isRiotGame = (g) => RIOT_GAMES.has(String(g || '').trim());
    const getGameRules = (game) => {
        const target = normalizeGame(game);
        if (!target) return null;
        for (const cat of Object.values(esportsCatalog || {})) {
            if (!cat) continue;
            for (const [name, rules] of Object.entries(cat)) {
                if (normalizeGame(name) === target) return rules;
            }
        }
        return null;
    };

    const rules = getGameRules(team.game);
    const starterSlots = Number.isFinite(Number(team.maxMembers)) && team.maxMembers > 0
        ? Number(team.maxMembers)
        : (rules?.maxPlayers || team.roster?.starters?.length || 0);
    const subSlots = Number.isFinite(Number(team.maxSubstitutes)) && team.maxSubstitutes > 0
        ? Number(team.maxSubstitutes)
        : (rules?.maxSubs || team.roster?.subs?.length || 0);

    const captainId = team.captain?._id || team.captain;
    const isCaptain = currentUser?._id && String(captainId) === String(currentUser._id);
    const isAdmin = Boolean(currentUser?.isAdmin);
    const canManage = isCaptain || isAdmin;
    const isMember = (() => {
        if (!currentUser?._id) return false;
        const uid = String(currentUser._id);
        return String(captainId) === uid
            || (team.roster?.starters || []).some(p => String(p?.user) === uid)
            || (team.roster?.subs || []).some(p => String(p?.user) === uid)
            || (team.roster?.coach && String(team.roster.coach.user) === uid);
    })();

    const pendingRequests = useMemo(() =>
        (team.joinRequests || []).filter(r => r.status === 'pending'),
        [team.joinRequests]
    );

    /* ── state ── */
    const [activeTab, setActiveTab] = useState(initialTab === 'roster' ? 'roster' : 'info');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    // Edit info
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    // Privacy / settings
    const [hideEmail, setHideEmail] = useState(true);
    const [hideGameId, setHideGameId] = useState(false);
    const [acceptingInvites, setAcceptingInvites] = useState(true);

    // Add player
    const [slotType, setSlotType] = useState('starters');
    const [slotIndex, setSlotIndex] = useState(0);
    const [player, setPlayer] = useState({ nickname: '', gameId: '', region: '', email: '', role: '' });
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [friendsOptions, setFriendsOptions] = useState([]);
    const [inviteSubmitting, setInviteSubmitting] = useState(false);
    const [inviteFriendSearch, setInviteFriendSearch] = useState('');
    const [inviteForm, setInviteForm] = useState({
        targetUserId: '',
        slotType: 'starters',
        slotIndex: 0,
        note: ''
    });

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');
    const slotHasMember = (slot) => Boolean(slot?.user || slot?.nickname || slot?.gameId || slot?.email || slot?.role);
    const normalizeRoleKey = (value = '') => String(value || '').trim().toLowerCase();
    const gameRoles = useMemo(() => ROLE_NAMES[team.game] || [], [team.game]);

    /* ── Edit handlers ── */
    const startEdit = () => {
        setEditForm({
            name: team.name || '',
            slogan: team.slogan || '',
            category: team.category || '',
            game: team.game || '',
            teamGender: team.teamGender || 'Mixto',
            teamCountry: team.teamCountry || '',
            teamLevel: team.teamLevel || '',
            teamLanguage: team.teamLanguage || 'Español',
        });
        setLogoFile(null);
        setLogoPreview(null);
        setEditing(true);
    };

    const cancelEdit = () => {
        setEditing(false);
        setLogoFile(null);
        setLogoPreview(null);
    };

    const saveEdit = async () => {
        try {
            setSubmitting(true);
            const token = localStorage.getItem('token');
            let updated = team;
            const res = await axios.patch(`${API_URL}/api/teams/${team._id}`, editForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            updated = res.data.team || updated;
            if (logoFile) {
                const fd = new FormData();
                fd.append('logo', logoFile);
                const lr = await axios.patch(`${API_URL}/api/teams/${team._id}/logo`, fd, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                updated = lr.data.team || updated;
            }
            if (onTeamUpdated) onTeamUpdated(updated);
            setEditing(false);
            showToast('Equipo actualizado');
        } catch (err) {
            showToast(err.response?.data?.message || 'Error al guardar', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogoChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setLogoFile(f);
        const reader = new FileReader();
        reader.onloadend = () => setLogoPreview(reader.result);
        reader.readAsDataURL(f);
    };

    /* ── Roster handlers ── */
    const handleAddPlayer = async (e) => {
        e.preventDefault();
        if (!player.nickname.trim()) return showToast('Nickname requerido', 'error');
        try {
            setSubmitting(true);
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/teams/${team._id}/roster`,
                { slotType, slotIndex, player },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (onTeamUpdated) onTeamUpdated(res.data.team);
            setPlayer({ nickname: '', gameId: '', region: '', email: '', role: '' });
            showToast('Jugador agregado');
        } catch (err) {
            showToast(err.response?.data?.message || 'Error al agregar jugador', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemovePlayer = async (entry) => {
        if (!window.confirm(`Remover a ${entry.name}?`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`${API_URL}/api/teams/${team._id}/roster/remove`,
                { slotType: entry.slotType, slotIndex: entry.slotIndex, userId: entry.userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (onTeamUpdated) onTeamUpdated(res.data.team);
            showToast('Jugador removido');
        } catch (err) {
            showToast(err.response?.data?.message || 'Error al remover', 'error');
        }
    };

    const handleRequestAction = async (requestId, action) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`${API_URL}/api/teams/${team._id}/requests/${requestId}`,
                { action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (onTeamUpdated) onTeamUpdated(res.data.team);
            showToast(action === 'approve' ? 'Solicitud aprobada' : 'Solicitud rechazada');
        } catch (err) {
            showToast(err.response?.data?.message || 'Error', 'error');
        }
    };

    const fetchFriends = async () => {
        if (!canManage) return;
        try {
            setFriendsLoading(true);
            const token = getToken();
            if (!token) return;
            const res = await axios.get(`${API_URL}/api/auth/social`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const items = Array.isArray(res?.data?.friends) ? res.data.friends : [];
            setFriendsOptions(items);
            setInviteForm((prev) => ({
                ...prev,
                targetUserId: prev.targetUserId || items[0]?.id || ''
            }));
        } catch (_) {
            setFriendsOptions([]);
        } finally {
            setFriendsLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen || !canManage) return;
        fetchFriends();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, canManage, team?._id]);

    useEffect(() => {
        if (!Array.isArray(friendsOptions) || friendsOptions.length === 0) return;
        setInviteForm((prev) => {
            if (prev.targetUserId && friendsOptions.some((friend) => String(friend?.id) === String(prev.targetUserId))) {
                return prev;
            }
            return { ...prev, targetUserId: String(friendsOptions[0]?.id || '') };
        });
    }, [friendsOptions]);

    useEffect(() => {
        setInviteForm((prev) => {
            if (prev.slotType === 'coach') {
                return prev.slotIndex === 0 ? prev : { ...prev, slotIndex: 0 };
            }
            const max = prev.slotType === 'starters' ? starterSlots : subSlots;
            if (!Number.isFinite(max) || max <= 0) return { ...prev, slotIndex: 0 };
            const nextIndex = Number(prev.slotIndex);
            if (nextIndex >= 0 && nextIndex < max) return prev;
            return { ...prev, slotIndex: 0 };
        });
    }, [starterSlots, subSlots]);

    const roleHintsByType = useMemo(() => {
        const starters = Array.isArray(team?.roster?.starters) ? team.roster.starters : [];
        const subs = Array.isArray(team?.roster?.subs) ? team.roster.subs : [];
        const coach = team?.roster?.coach || null;

        const usedRoles = new Set();
        [...starters, ...subs, coach].forEach((member) => {
            if (!slotHasMember(member)) return;
            const key = normalizeRoleKey(member?.role);
            if (key) usedRoles.add(key);
        });

        const availableRoles = gameRoles.filter((role) => !usedRoles.has(normalizeRoleKey(role)));
        let roleCursor = 0;

        const startersHints = {};
        const subsHints = {};

        for (let idx = 0; idx < starterSlots; idx += 1) {
            if (slotHasMember(starters[idx])) continue;
            if (availableRoles[roleCursor]) {
                startersHints[idx] = availableRoles[roleCursor];
                roleCursor += 1;
            }
        }

        for (let idx = 0; idx < subSlots; idx += 1) {
            if (slotHasMember(subs[idx])) continue;
            if (availableRoles[roleCursor]) {
                subsHints[idx] = availableRoles[roleCursor];
                roleCursor += 1;
            }
        }

        return { starters: startersHints, subs: subsHints };
    }, [team?.roster, starterSlots, subSlots, gameRoles]);

    const inviteSlotOptions = useMemo(() => {
        if (inviteForm.slotType === 'coach') {
            return [{ value: 0, label: 'Coach', disabled: slotHasMember(team?.roster?.coach) }];
        }
        const max = inviteForm.slotType === 'starters' ? starterSlots : subSlots;
        const list = Array.isArray(team?.roster?.[inviteForm.slotType]) ? team.roster[inviteForm.slotType] : [];
        return Array.from({ length: Math.max(0, max) }).map((_, idx) => {
            const current = list[idx];
            const currentLabel = current?.nickname || current?.role;
            const roleHint = inviteForm.slotType === 'starters'
                ? roleHintsByType.starters?.[idx]
                : roleHintsByType.subs?.[idx];
            return {
                value: idx,
                disabled: slotHasMember(current),
                label: currentLabel
                    ? `${inviteForm.slotType === 'starters' ? 'Titular' : 'Suplente'} #${idx + 1} · ${currentLabel}`
                    : `${inviteForm.slotType === 'starters' ? 'Titular' : 'Suplente'} #${idx + 1}${roleHint ? ` · ${roleHint}` : ''} (Disponible)`
            };
        });
    }, [inviteForm.slotType, starterSlots, subSlots, team?.roster, roleHintsByType]);

    const filteredFriendsOptions = useMemo(() => {
        const q = String(inviteFriendSearch || '').trim().toLowerCase();
        if (!q) return friendsOptions;
        return friendsOptions.filter((friend) => {
            const name = String(friend?.name || '').toLowerCase();
            const username = String(friend?.username || '').toLowerCase();
            const code = String(friend?.userCode || '').toLowerCase();
            return name.includes(q) || username.includes(q) || code.includes(q);
        });
    }, [friendsOptions, inviteFriendSearch]);

    const handleInviteFriend = async (event) => {
        event.preventDefault();
        if (inviteSubmitting) return;
        if (!inviteForm.targetUserId) return showToast('Selecciona un amigo para invitar.', 'error');
        if (inviteForm.slotType !== 'coach') {
            const chosen = inviteSlotOptions.find((option) => Number(option.value) === Number(inviteForm.slotIndex));
            if (!chosen || chosen.disabled) {
                return showToast('Selecciona un slot disponible para invitar.', 'error');
            }
        }

        try {
            setInviteSubmitting(true);
            const token = getToken();
            if (!token) return showToast('Debes iniciar sesión.', 'error');

            await axios.post(
                `${API_URL}/api/teams/${team._id}/invite-friend`,
                {
                    targetUserId: inviteForm.targetUserId,
                    slotType: inviteForm.slotType,
                    slotIndex: inviteForm.slotType === 'coach' ? 0 : Number(inviteForm.slotIndex),
                    note: inviteForm.note
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setInviteForm((prev) => ({ ...prev, note: '' }));
            showToast('Invitación enviada por notificación.');
        } catch (err) {
            showToast(err?.response?.data?.message || 'No se pudo enviar la invitación.', 'error');
        } finally {
            setInviteSubmitting(false);
        }
    };

    const handleLeaveTeam = async () => {
        if (!window.confirm('¿Seguro que quieres salir del equipo?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/teams/leave/${team._id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Saliste del equipo');
            window.dispatchEvent(new Event('user-update'));
            setTimeout(() => onClose(), 600);
        } catch (err) {
            showToast(err.response?.data?.message || 'Error', 'error');
        }
    };

    const handleDeleteTeam = async () => {
        if (!window.confirm('¿ELIMINAR este equipo permanentemente? Esta acción no se puede deshacer.')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/teams/${team._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Equipo eliminado');
            window.dispatchEvent(new Event('user-update'));
            setTimeout(() => {
                onClose();
                window.location.reload();
            }, 250);
        } catch (err) {
            showToast(err.response?.data?.message || 'Error', 'error');
        }
    };

    const copyInviteCode = () => {
        const code = team.inviteCode || '';
        const link = `${window.location.origin}/teams?invite=${code}`;
        const payload = `Código: ${code}\nLink: ${link}`;
        navigator.clipboard?.writeText(payload).then(() => showToast('Copiado al portapapeles'));
    };

    /* ── Build roster entries ── */
    const rosterEntries = useMemo(() => {
        const list = [];
        const starters = team.roster?.starters || [];
        const subs = team.roster?.subs || [];
        const roles = gameRoles;
        const isMlbbTeam = MLBB_GAMES.has(String(team?.game || '').trim());
        const getSyncMeta = (member) => {
            if (!isMlbbTeam || !member) return null;
            const hasUser = Boolean(member?.user);
            const hasIds = Boolean(member?.gameId && member?.region);
            if (hasUser && hasIds) return { label: 'Sincronizado', tone: 'ready' };
            if (hasUser) return { label: 'Datos incompletos', tone: 'warn' };
            return { label: 'Sin vincular', tone: 'missing' };
        };

        for (let i = 0; i < starterSlots; i++) {
            const m = starters[i];
            list.push({
                id: m?._id || `s-${i}`, name: m?.nickname || '', role: m?.role || roleHintsByType.starters?.[i] || roles[i] || `Titular ${i + 1}`,
                userId: m?.user || null, gameId: m?.gameId || '', email: m?.email || '', region: m?.region || '',
                photo: m?.photo || '', slotType: 'starters', slotIndex: i, filled: Boolean(m?.nickname || m?.user),
                syncMeta: getSyncMeta(m)
            });
        }
        for (let i = 0; i < subSlots; i++) {
            const m = subs[i];
            list.push({
                id: m?._id || `sub-${i}`, name: m?.nickname || '', role: m?.role || roleHintsByType.subs?.[i] || `Suplente ${i + 1}`,
                userId: m?.user || null, gameId: m?.gameId || '', email: m?.email || '', region: m?.region || '',
                photo: m?.photo || '', slotType: 'subs', slotIndex: i, filled: Boolean(m?.nickname || m?.user),
                syncMeta: getSyncMeta(m)
            });
        }
        const c = team.roster?.coach;
        list.push({
            id: c?._id || 'coach', name: c?.nickname || '', role: c?.role || 'Coach',
            userId: c?.user || null, gameId: c?.gameId || '', email: c?.email || '', region: c?.region || '',
            photo: c?.photo || '', slotType: 'coach', slotIndex: 0, filled: Boolean(c?.nickname || c?.user),
            syncMeta: getSyncMeta(c)
        });
        return list;
    }, [team, starterSlots, subSlots, gameRoles, roleHintsByType]);

    const filledCount = rosterEntries.filter(e => e.filled).length;
    const totalSlots = rosterEntries.length;
    const isMlbbTeam = MLBB_GAMES.has(String(team?.game || '').trim());
    const mlbbSyncSummary = useMemo(() => {
        if (!isMlbbTeam) return null;
        const active = rosterEntries.filter((entry) => entry.filled && entry.slotType !== 'coach');
        return {
            total: active.length,
            ready: active.filter((entry) => entry.syncMeta?.tone === 'ready').length,
            issues: active.filter((entry) => entry.syncMeta && entry.syncMeta.tone !== 'ready').length
        };
    }, [isMlbbTeam, rosterEntries]);

    /* ═══════════════ RENDER ═══════════════ */
    return (
        <div className="vtm-overlay" onClick={onClose}>
            <div className="vtm" onClick={(e) => e.stopPropagation()}>

                {/* Toast */}
                {toast && (
                    <div className={`vtm-toast vtm-toast--${toast.type}`}>
                        <i className={`bx ${toast.type === 'error' ? 'bx-error-circle' : 'bx-check-circle'}`}></i>
                        {toast.msg}
                    </div>
                )}

                {/* ── HEADER ── */}
                <div className="vtm-header">
                    <div className="vtm-header-top">
                        <div className="vtm-header-logo">
                            {team.logo
                                ? (
                                    <img
                                        src={resolveMediaUrl(team.logo)}
                                        alt=""
                                        onError={(e) => applyImageFallback(e, getTeamFallback(team.name))}
                                    />
                                )
                                : <span>{(team.name || '??').substring(0, 2).toUpperCase()}</span>
                            }
                        </div>
                        <div className="vtm-header-info">
                            {formatTeamPublicId(team) && (
                                <span className="tournament-id-tag">{formatTeamPublicId(team)}</span>
                            )}
                            <h2>{team.name}</h2>
                            <div className="vtm-header-tags">
                                <span className="vtm-tag vtm-tag--game">{(team.game || 'SIN JUEGO').toUpperCase()}</span>
                                <span className="vtm-tag vtm-tag--level">{team.teamLevel || 'Sin nivel'}</span>
                                {isCaptain && <span className="vtm-tag vtm-tag--captain"><i className='bx bxs-crown'></i> Capitán</span>}
                            </div>
                        </div>
                        <button className="vtm-close" onClick={onClose}><i className='bx bx-x'></i></button>
                    </div>
                    <div className="vtm-tabs">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                className={`vtm-tab ${activeTab === tab.key ? 'vtm-tab--active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                <i className={`bx ${tab.icon}`}></i>
                                <span>{tab.label}</span>
                                {tab.key === 'requests' && pendingRequests.length > 0 && (
                                    <span className="vtm-tab-badge">{pendingRequests.length}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── BODY ── */}
                <div className="vtm-body">

                    {/* ═══ TAB: INFO ═══ */}
                    {activeTab === 'info' && (
                        <div className="vtm-panel">
                            {!editing ? (
                                <>
                                    {team.slogan && (
                                        <div className="vtm-quote">"{team.slogan}"</div>
                                    )}
                                    <div className="vtm-info-grid">
                                        <div className="vtm-info-card">
                                            <i className='bx bx-category'></i>
                                            <div><label>Categoría</label><p>{team.category || '—'}</p></div>
                                        </div>
                                        <div className="vtm-info-card">
                                            <i className='bx bx-map'></i>
                                            <div><label>País</label><p>{team.teamCountry || '—'}</p></div>
                                        </div>
                                        <div className="vtm-info-card">
                                            <i className='bx bx-trophy'></i>
                                            <div><label>Nivel</label><p>{team.teamLevel || '—'}</p></div>
                                        </div>
                                        <div className="vtm-info-card">
                                            <i className='bx bx-globe-alt'></i>
                                            <div><label>Idioma</label><p>{team.teamLanguage || '—'}</p></div>
                                        </div>
                                        <div className="vtm-info-card">
                                            <i className='bx bx-male-female'></i>
                                            <div><label>Género</label><p>{team.teamGender || '—'}</p></div>
                                        </div>
                                        <div className="vtm-info-card">
                                            <i className='bx bx-group'></i>
                                            <div><label>Roster</label><p>{filledCount}/{totalSlots} jugadores</p></div>
                                        </div>
                                    </div>

                                    {canManage && team.inviteCode && (
                                        <div className="vtm-invite-section">
                                            <div className="vtm-invite-header">
                                                <i className='bx bx-key'></i>
                                                <span>Código de Invitación</span>
                                            </div>
                                            <div className="vtm-invite-row">
                                                <code className="vtm-invite-code">{team.inviteCode}</code>
                                                <button className="vtm-btn vtm-btn--sm vtm-btn--ghost" onClick={copyInviteCode}>
                                                    <i className='bx bx-copy'></i> Copiar
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {canManage && (
                                        <button className="vtm-btn vtm-btn--primary vtm-btn--full" onClick={startEdit}>
                                            <i className='bx bx-edit'></i> Editar Información
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="vtm-edit-form">
                                    <div className="vtm-form-group">
                                        <label>Nombre del equipo</label>
                                        <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Nombre" />
                                    </div>
                                    <div className="vtm-form-group">
                                        <label>Slogan</label>
                                        <input value={editForm.slogan} onChange={e => setEditForm({ ...editForm, slogan: e.target.value })} placeholder="Slogan del equipo" />
                                    </div>
                                    <div className="vtm-form-row">
                                        <div className="vtm-form-group">
                                            <label>Categoría</label>
                                            <input value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} placeholder="FPS, MOBA..." />
                                        </div>
                                        <div className="vtm-form-group">
                                            <label>Juego</label>
                                            <input value={editForm.game} onChange={e => setEditForm({ ...editForm, game: e.target.value })} placeholder="Valorant" />
                                        </div>
                                    </div>
                                    <div className="vtm-form-row">
                                        <div className="vtm-form-group">
                                            <label>Nivel</label>
                                            <select value={editForm.teamLevel} onChange={e => setEditForm({ ...editForm, teamLevel: e.target.value })}>
                                                <option value="">Seleccionar...</option>
                                                {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>
                                        <div className="vtm-form-group">
                                            <label>Género</label>
                                            <select value={editForm.teamGender} onChange={e => setEditForm({ ...editForm, teamGender: e.target.value })}>
                                                {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="vtm-form-row">
                                        <div className="vtm-form-group">
                                            <label>País / Región</label>
                                            <input value={editForm.teamCountry} onChange={e => setEditForm({ ...editForm, teamCountry: e.target.value })} placeholder="México" />
                                        </div>
                                        <div className="vtm-form-group">
                                            <label>Idioma</label>
                                            <select value={editForm.teamLanguage} onChange={e => setEditForm({ ...editForm, teamLanguage: e.target.value })}>
                                                {LANGUAGE_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="vtm-form-group">
                                        <label>Logo del equipo</label>
                                        <div className="vtm-logo-upload">
                                            <div className="vtm-logo-preview">
                                                {(logoPreview || team.logo)
                                                    ? (
                                                        <img
                                                            src={resolveMediaUrl(logoPreview || team.logo)}
                                                            alt=""
                                                            onError={(e) => applyImageFallback(e, getTeamFallback(team.name))}
                                                        />
                                                    )
                                                    : <i className='bx bx-image-add'></i>
                                                }
                                            </div>
                                            <label className="vtm-btn vtm-btn--sm vtm-btn--ghost vtm-upload-label">
                                                <i className='bx bx-upload'></i> Subir logo
                                                <input type="file" accept="image/*" onChange={handleLogoChange} hidden />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="vtm-form-actions">
                                        <button className="vtm-btn vtm-btn--ghost" onClick={cancelEdit} disabled={submitting}>Cancelar</button>
                                        <button className="vtm-btn vtm-btn--primary" onClick={saveEdit} disabled={submitting}>
                                            {submitting ? 'Guardando...' : 'Guardar Cambios'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ TAB: ROSTER ═══ */}
                    {activeTab === 'roster' && (
                        <div className="vtm-panel">
                            <div className="vtm-roster-progress">
                                <div className="vtm-roster-bar">
                                    <div className="vtm-roster-fill" style={{ width: `${totalSlots > 0 ? (filledCount / totalSlots) * 100 : 0}%` }} />
                                </div>
                                <span>{filledCount}/{totalSlots} slots ocupados</span>
                            </div>
                            {isMlbbTeam && mlbbSyncSummary && (
                                <div className="vtm-roster-sync-summary">
                                    <span className="vtm-roster-sync-pill vtm-roster-sync-pill--ready">Sincronizados: {mlbbSyncSummary.ready}</span>
                                    <span className="vtm-roster-sync-pill vtm-roster-sync-pill--warn">Con problemas: {mlbbSyncSummary.issues}</span>
                                </div>
                            )}

                            <div className="vtm-roster-section">
                                <h4><i className='bx bx-star'></i> Titulares</h4>
                                <div className="vtm-roster-list">
                                    {rosterEntries.filter(e => e.slotType === 'starters').map(entry => (
                                        <div key={entry.id} className={`vtm-player ${entry.filled ? '' : 'vtm-player--empty'}`}>
                                            <div className="vtm-player-avatar">
                                                {entry.photo
                                                    ? (
                                                        <img
                                                            src={resolveMediaUrl(entry.photo)}
                                                            alt=""
                                                            onError={(e) => applyImageFallback(e, getBotAvatarFallback(entry.name))}
                                                        />
                                                    )
                                                    : entry.filled
                                                        ? <img src={getBotAvatarFallback(entry.name)} alt="" />
                                                        : <i className='bx bx-user-plus'></i>
                                                }
                                                {entry.userId && String(entry.userId) === String(captainId) && (
                                                    <span className="vtm-crown"><i className='bx bxs-crown'></i></span>
                                                )}
                                            </div>
                                            <div className="vtm-player-info">
                                                <span className="vtm-player-name">{entry.filled ? entry.name : 'Vacante'}</span>
                                                <span className="vtm-player-role">{entry.role}</span>
                                                {entry.filled && entry.syncMeta && (
                                                    <span className={`vtm-player-sync vtm-player-sync--${entry.syncMeta.tone}`}>{entry.syncMeta.label}</span>
                                                )}
                                                {entry.filled && entry.gameId && !hideGameId && (
                                                    <span className="vtm-player-meta"><i className='bx bx-id-card'></i> {entry.gameId}</span>
                                                )}
                                                {entry.filled && entry.region && (
                                                    <span className="vtm-player-meta"><i className='bx bx-map-pin'></i> {entry.region}</span>
                                                )}
                                                {entry.filled && entry.email && !hideEmail && canManage && (
                                                    <span className="vtm-player-meta"><i className='bx bx-envelope'></i> {entry.email}</span>
                                                )}
                                            </div>
                                            {canManage && entry.filled && String(entry.userId) !== String(captainId) && (
                                                <button className="vtm-btn-icon vtm-btn-icon--danger" onClick={() => handleRemovePlayer(entry)} title="Remover">
                                                    <i className='bx bx-user-minus'></i>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {subSlots > 0 && (
                                <div className="vtm-roster-section">
                                    <h4><i className='bx bx-transfer-alt'></i> Suplentes</h4>
                                    <div className="vtm-roster-list">
                                        {rosterEntries.filter(e => e.slotType === 'subs').map(entry => (
                                            <div key={entry.id} className={`vtm-player ${entry.filled ? '' : 'vtm-player--empty'}`}>
                                                <div className="vtm-player-avatar">
                                                    {entry.photo
                                                        ? (
                                                            <img
                                                                src={resolveMediaUrl(entry.photo)}
                                                                alt=""
                                                                onError={(e) => applyImageFallback(e, getBotAvatarFallback(entry.name))}
                                                            />
                                                        )
                                                        : entry.filled
                                                            ? <img src={getBotAvatarFallback(entry.name)} alt="" />
                                                            : <i className='bx bx-user-plus'></i>
                                                    }
                                                </div>
                                                <div className="vtm-player-info">
                                                    <span className="vtm-player-name">{entry.filled ? entry.name : 'Vacante'}</span>
                                                    <span className="vtm-player-role">{entry.role}</span>
                                                    {entry.filled && entry.syncMeta && (
                                                        <span className={`vtm-player-sync vtm-player-sync--${entry.syncMeta.tone}`}>{entry.syncMeta.label}</span>
                                                    )}
                                                    {entry.filled && entry.gameId && !hideGameId && (
                                                        <span className="vtm-player-meta"><i className='bx bx-id-card'></i> {entry.gameId}</span>
                                                    )}
                                                    {entry.filled && entry.region && (
                                                        <span className="vtm-player-meta"><i className='bx bx-map-pin'></i> {entry.region}</span>
                                                    )}
                                                </div>
                                                {canManage && entry.filled && (
                                                    <button className="vtm-btn-icon vtm-btn-icon--danger" onClick={() => handleRemovePlayer(entry)} title="Remover">
                                                        <i className='bx bx-user-minus'></i>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="vtm-roster-section">
                                <h4><i className='bx bx-user-voice'></i> Coach / Staff</h4>
                                {(() => {
                                    const coach = rosterEntries.find(e => e.slotType === 'coach');
                                    if (!coach) return null;
                                    return (
                                        <div className={`vtm-player vtm-player--coach ${coach.filled ? '' : 'vtm-player--empty'}`}>
                                            <div className="vtm-player-avatar">
                                                {coach.photo
                                                    ? (
                                                        <img
                                                            src={resolveMediaUrl(coach.photo)}
                                                            alt=""
                                                            onError={(e) => applyImageFallback(e, getBotAvatarFallback(coach.name))}
                                                        />
                                                    )
                                                    : coach.filled
                                                        ? <img src={getBotAvatarFallback(coach.name)} alt="" />
                                                        : <i className='bx bx-user-voice'></i>
                                                }
                                            </div>
                                            <div className="vtm-player-info">
                                                <span className="vtm-player-name">{coach.filled ? coach.name : 'Sin coach'}</span>
                                                <span className="vtm-player-role">{coach.role}</span>
                                                {coach.filled && coach.syncMeta && (
                                                    <span className={`vtm-player-sync vtm-player-sync--${coach.syncMeta.tone}`}>{coach.syncMeta.label}</span>
                                                )}
                                                {coach.filled && coach.gameId && !hideGameId && (
                                                    <span className="vtm-player-meta"><i className='bx bx-id-card'></i> {coach.gameId}</span>
                                                )}
                                            </div>
                                            {canManage && coach.filled && (
                                                <button className="vtm-btn-icon vtm-btn-icon--danger" onClick={() => handleRemovePlayer(coach)} title="Remover">
                                                    <i className='bx bx-user-minus'></i>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            {canManage && (
                                <div className="vtm-add-player">
                                    <h4><i className='bx bx-plus-circle'></i> Agregar Jugador</h4>
                                    <form onSubmit={handleAddPlayer} className="vtm-add-form">
                                        <div className="vtm-form-row">
                                            <div className="vtm-form-group">
                                                <label>Tipo de Slot</label>
                                                <select value={slotType} onChange={e => setSlotType(e.target.value)}>
                                                    <option value="starters">Titular</option>
                                                    {subSlots > 0 && <option value="subs">Suplente</option>}
                                                    <option value="coach">Coach</option>
                                                </select>
                                            </div>
                                            {slotType !== 'coach' && (
                                                <div className="vtm-form-group">
                                                    <label>Slot</label>
                                                    <select value={slotIndex} onChange={e => setSlotIndex(Number(e.target.value))}>
                                                        {Array.from({ length: slotType === 'starters' ? starterSlots : subSlots }).map((_, i) => {
                                                            const current = slotType === 'starters' ? team.roster?.starters?.[i] : team.roster?.subs?.[i];
                                                            const roleHint = slotType === 'starters'
                                                                ? roleHintsByType.starters?.[i]
                                                                : roleHintsByType.subs?.[i];
                                                            const label = current?.nickname
                                                                || current?.role
                                                                || `${slotType === 'starters' ? 'Titular' : 'Suplente'} #${i + 1}${roleHint ? ` · ${roleHint}` : ''}`;
                                                            return <option key={i} value={i} disabled={Boolean(current?.nickname)}>{label}{current?.nickname ? ' ✓' : ''}</option>;
                                                        })}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                        <div className="vtm-form-row">
                                            <div className="vtm-form-group">
                                                <input value={player.nickname} onChange={e => setPlayer({ ...player, nickname: e.target.value })} placeholder="Nickname *" required />
                                            </div>
                                            <div className="vtm-form-group">
                                                <input value={player.gameId} onChange={e => setPlayer({ ...player, gameId: e.target.value })} placeholder={isRiotGame(team.game) ? 'Riot ID (Tag)' : 'Game ID'} />
                                            </div>
                                        </div>
                                        <div className="vtm-form-row">
                                            <div className="vtm-form-group">
                                                <select value={player.region} onChange={e => setPlayer({ ...player, region: e.target.value })}>
                                                    <option value="">Región...</option>
                                                    {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </div>
                                            {/* <div className="vtm-form-group">
                                                <select value={player.role} onChange={e => setPlayer({ ...player, role: e.target.value })}>
                                                    <option value="">Rol...</option>
                                                    {(ROLE_NAMES[team.game] || []).map(r => <option key={r} value={r}>{r}</option>)}
                                                    <option value="Coach">Coach</option>
                                                </select>
                                            </div> */}
                                        </div>
                                        <div className="vtm-form-group">
                                            <input value={player.email} onChange={e => setPlayer({ ...player, email: e.target.value })} placeholder="Email (opcional)" type="email" />
                                        </div>
                                        <button type="submit" className="vtm-btn vtm-btn--primary vtm-btn--full" disabled={submitting}>
                                            <i className='bx bx-plus'></i> {submitting ? 'Agregando...' : 'Agregar al Roster'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {canManage && (
                                <div className="vtm-invite-friends">
                                    <h4><i className='bx bx-user-plus'></i> Invitar amigo por notificación</h4>
                                    <p className="vtm-invite-friends__hint">
                                        Solo puedes invitar amigos con seguimiento mutuo. La invitación se envía por notificación, no por chat.
                                    </p>

                                    {friendsLoading ? (
                                        <div className="vtm-empty vtm-empty--compact">
                                            <p>Cargando amigos...</p>
                                        </div>
                                    ) : friendsOptions.length === 0 ? (
                                        <div className="vtm-empty vtm-empty--compact">
                                            <p>No tienes amigos mutuos disponibles para invitar.</p>
                                            <span>Síganse mutuamente en el módulo de Amigos para habilitar invitaciones.</span>
                                        </div>
                                    ) : (
                                        <form className="vtm-add-form" onSubmit={handleInviteFriend}>
                                            {friendsOptions.length > 6 && (
                                                <div className="vtm-form-group">
                                                    <label>Buscar amigo</label>
                                                    <input
                                                        type="text"
                                                        value={inviteFriendSearch}
                                                        onChange={(e) => setInviteFriendSearch(e.target.value)}
                                                        placeholder="Buscar por nombre, @username o #número"
                                                    />
                                                </div>
                                            )}
                                            <div className="vtm-form-group">
                                                <label>Amigo</label>
                                                <select
                                                    value={inviteForm.targetUserId}
                                                    onChange={(e) => setInviteForm((prev) => ({ ...prev, targetUserId: e.target.value }))}
                                                >
                                                    <option value="">Seleccionar amigo...</option>
                                                    {filteredFriendsOptions.map((friend) => (
                                                        <option key={friend.id} value={friend.id}>
                                                            {friend.name} @{friend.username || 'user'}{friend.userCode ? ` · #${friend.userCode}` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                {inviteFriendSearch && filteredFriendsOptions.length === 0 && (
                                                    <small className="vtm-muted">No hay amigos que coincidan con esa búsqueda.</small>
                                                )}
                                            </div>
                                            <div className="vtm-form-row">
                                                <div className="vtm-form-group">
                                                    <label>Tipo de slot</label>
                                                    <select
                                                        value={inviteForm.slotType}
                                                        onChange={(e) => setInviteForm((prev) => ({
                                                            ...prev,
                                                            slotType: e.target.value,
                                                            slotIndex: 0
                                                        }))}
                                                    >
                                                        <option value="starters">Titular</option>
                                                        {subSlots > 0 && <option value="subs">Suplente</option>}
                                                        <option value="coach">Coach</option>
                                                    </select>
                                                </div>
                                                <div className="vtm-form-group">
                                                    <label>Slot</label>
                                                    <select
                                                        value={inviteForm.slotType === 'coach' ? 0 : inviteForm.slotIndex}
                                                        onChange={(e) => setInviteForm((prev) => ({ ...prev, slotIndex: Number(e.target.value) }))}
                                                        disabled={inviteForm.slotType === 'coach'}
                                                    >
                                                        {inviteSlotOptions.map((option) => (
                                                            <option key={`${option.value}-${option.label}`} value={option.value} disabled={option.disabled}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="vtm-form-group">
                                                <label>Nota (opcional)</label>
                                                <input
                                                    value={inviteForm.note}
                                                    onChange={(e) => setInviteForm((prev) => ({ ...prev, note: e.target.value.slice(0, 120) }))}
                                                    placeholder="Ej: Te necesito para el roster titular"
                                                    maxLength={120}
                                                />
                                            </div>
                                            <button type="submit" className="vtm-btn vtm-btn--primary vtm-btn--full" disabled={inviteSubmitting}>
                                                <i className='bx bx-send'></i> {inviteSubmitting ? 'Enviando...' : 'Enviar invitación'}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ TAB: REQUESTS ═══ */}
                    {activeTab === 'requests' && (
                        <div className="vtm-panel">
                            {pendingRequests.length === 0 ? (
                                <div className="vtm-empty">
                                    <i className='bx bx-check-double'></i>
                                    <p>No hay solicitudes pendientes</p>
                                    <span>Cuando alguien quiera unirse a tu equipo, aparecerá aquí.</span>
                                </div>
                            ) : (
                                <div className="vtm-requests-list">
                                    {pendingRequests.map(r => (
                                        <div key={r._id} className="vtm-request">
                                            <div className="vtm-request-info">
                                                <div className="vtm-request-avatar">
                                                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${r.player?.nickname || 'user'}`} alt="" />
                                                </div>
                                                <div>
                                                    <span className="vtm-request-name">{r.player?.nickname || 'Jugador'}</span>
                                                    <span className="vtm-request-detail">
                                                        {r.player?.role || 'Sin rol'} · {r.slotType === 'starters' ? 'Titular' : r.slotType === 'subs' ? 'Suplente' : 'Coach'}
                                                    </span>
                                                    {r.player?.gameId && <span className="vtm-request-detail"><i className='bx bx-id-card'></i> {r.player.gameId}</span>}
                                                    {r.player?.region && <span className="vtm-request-detail"><i className='bx bx-map-pin'></i> {r.player.region}</span>}
                                                </div>
                                            </div>
                                            <div className="vtm-request-actions">
                                                <button className="vtm-btn vtm-btn--sm vtm-btn--success" onClick={() => handleRequestAction(r._id, 'approve')}>
                                                    <i className='bx bx-check'></i> Aprobar
                                                </button>
                                                <button className="vtm-btn vtm-btn--sm vtm-btn--danger" onClick={() => handleRequestAction(r._id, 'reject')}>
                                                    <i className='bx bx-x'></i> Rechazar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ TAB: SETTINGS ═══ */}
                    {activeTab === 'settings' && (
                        <div className="vtm-panel">
                            <div className="vtm-settings-section">
                                <h4><i className='bx bx-shield-quarter'></i> Privacidad</h4>
                                <div className="vtm-toggle-row" onClick={() => setHideEmail(!hideEmail)}>
                                    <div className="vtm-toggle-info">
                                        <span>Ocultar Emails</span>
                                        <small>Los emails de los jugadores no se mostrarán en el roster</small>
                                    </div>
                                    <div className={`vtm-toggle ${hideEmail ? 'vtm-toggle--on' : ''}`}>
                                        <div className="vtm-toggle-dot" />
                                    </div>
                                </div>
                                <div className="vtm-toggle-row" onClick={() => setHideGameId(!hideGameId)}>
                                    <div className="vtm-toggle-info">
                                        <span>Ocultar Game ID</span>
                                        <small>Los IDs de juego no serán visibles para externos</small>
                                    </div>
                                    <div className={`vtm-toggle ${hideGameId ? 'vtm-toggle--on' : ''}`}>
                                        <div className="vtm-toggle-dot" />
                                    </div>
                                </div>
                                <div className="vtm-toggle-row" onClick={() => setAcceptingInvites(!acceptingInvites)}>
                                    <div className="vtm-toggle-info">
                                        <span>Aceptar Solicitudes</span>
                                        <small>Permitir que nuevos jugadores soliciten unirse</small>
                                    </div>
                                    <div className={`vtm-toggle ${acceptingInvites ? 'vtm-toggle--on' : ''}`}>
                                        <div className="vtm-toggle-dot" />
                                    </div>
                                </div>
                            </div>

                            {canManage && team.inviteCode && (
                                <div className="vtm-settings-section">
                                    <h4><i className='bx bx-key'></i> Invitación</h4>
                                    <div className="vtm-invite-card">
                                        <div className="vtm-invite-code-display">
                                            <code>{team.inviteCode}</code>
                                        </div>
                                        <div className="vtm-invite-actions">
                                            <button className="vtm-btn vtm-btn--sm vtm-btn--ghost" onClick={copyInviteCode}>
                                                <i className='bx bx-copy'></i> Copiar
                                            </button>
                                            <button className="vtm-btn vtm-btn--sm vtm-btn--ghost" onClick={() => {
                                                const link = `${window.location.origin}/teams?invite=${team.inviteCode}`;
                                                navigator.clipboard?.writeText(link).then(() => showToast('Link copiado'));
                                            }}>
                                                <i className='bx bx-link'></i> Link
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="vtm-settings-section vtm-settings-section--danger">
                                <h4><i className='bx bx-error-alt'></i> Zona de Peligro</h4>
                                {isMember && !isCaptain && (
                                    <button className="vtm-btn vtm-btn--danger vtm-btn--full" onClick={handleLeaveTeam}>
                                        <i className='bx bx-log-out'></i> Salir del Equipo
                                    </button>
                                )}
                                {canManage && (
                                    <button className="vtm-btn vtm-btn--danger-outline vtm-btn--full" onClick={handleDeleteTeam}>
                                        <i className='bx bx-trash'></i> Eliminar Equipo Permanentemente
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewTeamModal;
