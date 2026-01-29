import React, { useMemo, useState } from 'react';
import axios from 'axios';

const ROLE_NAMES = {
    "Mobile Legends": ["EXP", "Gold", "Mid", "Jungla", "Roam"],
    "League of Legends": ["Top", "Jungle", "Mid", "ADC", "Supp"],
    "Valorant": ["Duelist", "Sentinel", "Controller", "Initiator", "Flex"],
    "Overwatch 2": ["Tank", "DPS", "DPS", "Support", "Support"],
    "TFT": ["Tactician"],
    "FIFA / EA FC": ["Player"],
    "Free Fire": ["Rusher", "Support", "Sniper", "IGL"]
};

const ViewTeamModal = ({ isOpen, onClose, team, currentUser, onTeamUpdated }) => {
    if (!isOpen || !team) return null;

    const gameLabel = team.game ? team.game.toUpperCase() : 'SIN JUEGO';
    const description = team.description || team.slogan || "Este equipo aún no tiene una descripción.";
    const membersRaw = Array.isArray(team.members) ? team.members : [];
    const rosterStarters = Array.isArray(team.roster?.starters) ? team.roster.starters : [];
    const rosterSubs = Array.isArray(team.roster?.subs) ? team.roster.subs : [];
    const rosterRaw = membersRaw.length ? membersRaw : [...rosterStarters, ...rosterSubs];
    const members = rosterRaw.map((m, i) => ({
        id: m?._id || m?.id || `${i}`,
        name: m?.fullName || m?.nickname || m?.email || (typeof m === 'string' ? m : 'Jugador'),
    }));
    const captainId = team.captain?._id || team.captain;
    const isCaptain = currentUser?._id && String(captainId) === String(currentUser._id);

    const starterSlots = Array.isArray(team.roster?.starters) ? team.roster.starters.length : 0;
    const subSlots = Array.isArray(team.roster?.subs) ? team.roster.subs.length : 0;
    const [inviteCode, setInviteCode] = useState('');
    const [slotType, setSlotType] = useState('starters');
    const [slotIndex, setSlotIndex] = useState(0);
    const [player, setPlayer] = useState({ nickname: '', gameId: '', region: '', email: '', role: '' });
    const [submitting, setSubmitting] = useState(false);

    const pendingRequests = useMemo(() => {
        const starters = Array.isArray(team.roster?.starters) ? team.roster.starters : [];
        const subs = Array.isArray(team.roster?.subs) ? team.roster.subs : [];
        return (team.joinRequests || []).filter(r => {
            if (r.status !== 'pending') return false;
            if (r.slotType === 'coach') return !team.roster?.coach;
            if (r.slotType === 'starters') return !starters[r.slotIndex];
            if (r.slotType === 'subs') return !subs[r.slotIndex];
            return true;
        });
    }, [team.joinRequests, team.roster]);

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!player.nickname) return alert('Nickname requerido');
        try {
            setSubmitting(true);
            const token = localStorage.getItem('token');
            if (!token) return alert('Debes iniciar sesión');
            if (inviteCode.trim()) {
                const res = await axios.post(
                    'http://localhost:4000/api/teams/join',
                    {
                        teamId: team._id,
                        inviteCode: inviteCode.trim(),
                        slotType,
                        slotIndex,
                        player
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (onTeamUpdated) onTeamUpdated(res.data.team);
                alert('Te uniste al equipo.');
            } else {
                await axios.post(
                    `http://localhost:4000/api/teams/${team._id}/requests`,
                    { slotType, slotIndex, player },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                alert('Solicitud enviada. Espera aprobación.');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Error al unirse al equipo');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestAction = async (requestId, action) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(
                `http://localhost:4000/api/teams/${team._id}/requests/${requestId}`,
                { action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (onTeamUpdated) onTeamUpdated(res.data.team);
            // Fallback: remover de la lista local si por algo no viene actualizado
            if (onTeamUpdated && res.data?.team?.joinRequests) return;
            if (onTeamUpdated) {
                const next = {
                    ...team,
                    joinRequests: (team.joinRequests || []).filter(r => String(r._id) !== String(requestId))
                };
                onTeamUpdated(next);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Error al gestionar solicitud');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-dark" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-text">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>{team.name}</h2>
                        <button className="btn-close-x" onClick={onClose}>&times;</button>
                    </div>
                    <p className="team-game-tag">{gameLabel}</p>
                </div>

                <div className="team-info-body">
                    <div className="info-section">
                        <label>Descripción</label>
                        <p>{description}</p>
                    </div>

                    <div className="info-section">
                        <label>Miembros de la escuadra ({members.length})</label>
                        <div className="members-scroll-list">
                            {members.length ? members.map((member) => (
                                <div key={member.id} className="member-row-item">
                                    <div className="member-avatar">
                                        <i className='bx bxs-user-circle'></i>
                                    </div>
                                    <div className="member-info">
                                        <span className="member-name">{member.name}</span>
                                        {captainId && String(captainId) === String(member.id) && (
                                            <span className="captain-badge">CAPITÁN</span>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="member-row-item">
                                    <div className="member-info">
                                        <span className="member-name">Sin miembros registrados</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="info-section">
                        <label>Unirse al equipo</label>
                        <form onSubmit={handleJoin} className="team-join-form">
                            <input
                                type="text"
                                placeholder="Código de invitación (opcional)"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                            />
                            <div className="join-row">
                                <select value={slotType} onChange={(e) => setSlotType(e.target.value)}>
                                    <option value="starters">Starter</option>
                                    <option value="subs">Suplente</option>
                                    <option value="coach">Coach</option>
                                </select>
                                {(slotType === 'starters' || slotType === 'subs') && (
                                    <select value={slotIndex} onChange={(e) => setSlotIndex(Number(e.target.value))}>
                                        {(slotType === 'starters' ? Array.from({ length: starterSlots }) : Array.from({ length: subSlots }))
                                            .map((_, i) => {
                                                const current = slotType === 'starters' ? team.roster?.starters?.[i] : team.roster?.subs?.[i];
                                                const roleLabel = current?.role || current?.nickname || `Rol ${i + 1}`;
                                                return (
                                                    <option key={i} value={i} disabled={Boolean(current)}>
                                                        {roleLabel}{current ? ' (ocupado)' : ''}
                                                    </option>
                                                );
                                            })}
                                    </select>
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder="Nickname"
                                value={player.nickname}
                                onChange={(e) => setPlayer({ ...player, nickname: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Game ID"
                                value={player.gameId}
                                onChange={(e) => setPlayer({ ...player, gameId: e.target.value })}
                            />
                            <select
                                value={player.region}
                                onChange={(e) => setPlayer({ ...player, region: e.target.value })}
                            >
                                <option value="">Selecciona región</option>
                                <option value="NA">NA</option>
                                <option value="LATAM">LATAM</option>
                                <option value="BR">BR</option>
                                <option value="EUW">EUW</option>
                                <option value="EUNE">EUNE</option>
                                <option value="KR">KR</option>
                                <option value="JP">JP</option>
                                <option value="OCE">OCE</option>
                                <option value="SEA">SEA</option>
                            </select>
                            <input
                                type="email"
                                placeholder="Email"
                                value={player.email}
                                onChange={(e) => setPlayer({ ...player, email: e.target.value })}
                            />
                            <select
                                value={player.role}
                                onChange={(e) => setPlayer({ ...player, role: e.target.value })}
                            >
                                <option value="">Selecciona rol</option>
                                {(ROLE_NAMES[team.game] || []).map((role) => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                                <option value="Suplente">Suplente</option>
                                <option value="Coach">Coach</option>
                            </select>
                            <button type="submit" className="btn-primary-small" disabled={submitting}>
                                {submitting ? 'Enviando...' : (inviteCode.trim() ? 'Unirme' : 'Solicitar')}
                            </button>
                        </form>
                    </div>

                    {isCaptain && pendingRequests.length > 0 && (
                        <div className="info-section">
                            <label>Solicitudes pendientes</label>
                            <div className="members-scroll-list">
                                {pendingRequests.map((r) => (
                                    <div key={r._id} className="member-row-item">
                                        <div className="member-info">
                                            <span className="member-name">{r.player?.nickname || 'Jugador'}</span>
                                            <span className="captain-badge">{r.player?.role || 'Rol'}</span>
                                        </div>
                                        <div className="request-actions">
                                            <button className="btn-primary-small" onClick={() => handleRequestAction(r._id, 'approve')}>
                                                Aprobar
                                            </button>
                                            <button className="btn-secondary-small" onClick={() => handleRequestAction(r._id, 'reject')}>
                                                Rechazar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="btn-primary-small" onClick={onClose}>CERRAR</button>
                </div>
            </div>
        </div>
    );
};

export default ViewTeamModal;
