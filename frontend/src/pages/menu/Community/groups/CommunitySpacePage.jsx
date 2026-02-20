import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaUsers, FaMapMarkerAlt, FaGlobeAmericas, FaGamepad } from 'react-icons/fa';
import '../Community.css';
import './CommunitySpacePage.css';
import ValorantImg from '../../../../assets/comunidad/valorant.jpg';
import { useAuth } from '../../../../context/AuthContext';
import { useNotification } from '../../../../context/NotificationContext';
import {
  fetchCommunityByShortUrl,
  fetchCommunityAuditLogsByShortUrl,
  joinCommunityByShortUrl,
  leaveCommunityByShortUrl,
  removeMemberFromCommunityByShortUrl,
  updateMemberRoleInCommunityByShortUrl,
  transferCommunityOwnershipByShortUrl
} from '../community.service';

const MEMBER_ROLE_OPTIONS = [
  { value: 'member', label: 'Miembro' },
  { value: 'moderator', label: 'Moderador' },
  { value: 'admin', label: 'Admin' }
];

const formatAuditTimestamp = (value) => {
  if (!value) return 'Ahora';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Ahora';
  return date.toLocaleString();
};

const describeAuditLog = (entry) => {
  const action = String(entry?.action || '');
  const actor = entry?.actor?.username || 'Usuario';
  const target = entry?.target?.username || 'usuario';
  const fromRole = String(entry?.metadata?.fromRole || '');
  const toRole = String(entry?.metadata?.toRole || '');
  const removedRole = String(entry?.metadata?.removedRole || '');
  const previousRole = String(entry?.metadata?.previousRole || '');

  if (action === 'community_created') return `@${actor} creó la comunidad`;
  if (action === 'member_joined') return `@${actor} se unió a la comunidad`;
  if (action === 'member_left') return `@${actor} salió de la comunidad (${previousRole || 'member'})`;
  if (action === 'member_removed') return `@${actor} removió a @${target} (${removedRole || 'member'})`;
  if (action === 'member_role_updated') {
    return `@${actor} cambió el rol de @${target} de ${fromRole || '-'} a ${toRole || '-'}`;
  }
  if (action === 'ownership_transferred') return `@${actor} transfirió ownership a @${target}`;
  return `${action} por @${actor}`;
};

const CommunitySpacePage = () => {
  const { shortUrl } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useNotification();
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState('');
  const [updatingRoleMemberId, setUpdatingRoleMemberId] = useState('');
  const [transferringOwnerMemberId, setTransferringOwnerMemberId] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');

  const currentUserId = String(user?._id || user?.id || '');

  const loadAuditLogs = async (communitySlug) => {
    if (!communitySlug) return;
    setAuditLoading(true);
    setAuditError('');
    try {
      const logs = await fetchCommunityAuditLogsByShortUrl(communitySlug, 60);
      setAuditLogs(logs);
    } catch (error) {
      setAuditLogs([]);
      setAuditError(error?.response?.data?.message || 'No se pudo cargar la bitácora');
    } finally {
      setAuditLoading(false);
    }
  };

  const loadCommunity = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const data = await fetchCommunityByShortUrl(shortUrl);
      setCommunity(data);
      if (data?.canManageMembers) {
        await loadAuditLogs(data.shortUrl);
      } else {
        setAuditLogs([]);
        setAuditError('');
      }
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'No se pudo cargar la comunidad');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shortUrl) {
      loadCommunity();
    }
  }, [shortUrl]);

  const handleJoinLeave = async () => {
    if (!community || actionLoading || community.isOwner) return;

    setActionLoading(true);
    try {
      const updated = community.joined
        ? await leaveCommunityByShortUrl(community.shortUrl)
        : await joinCommunityByShortUrl(community.shortUrl);
      setCommunity(updated);
      addToast(community.joined ? 'Saliste de la comunidad' : 'Te uniste a la comunidad', 'success');
    } catch (error) {
      addToast(error?.response?.data?.message || 'No se pudo actualizar tu membresía', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (member) => {
    const targetUserId = String(member?.user?.id || '');
    if (!targetUserId || !community?.shortUrl) return;

    if (!window.confirm(`¿Remover a @${member.user?.username || 'usuario'} de la comunidad?`)) {
      return;
    }

    setRemovingMemberId(targetUserId);
    try {
      const updated = await removeMemberFromCommunityByShortUrl(community.shortUrl, targetUserId);
      setCommunity(updated);
      if (updated?.canManageMembers) {
        await loadAuditLogs(updated.shortUrl);
      }
      addToast('Miembro removido', 'success');
    } catch (error) {
      addToast(error?.response?.data?.message || 'No se pudo remover el miembro', 'error');
    } finally {
      setRemovingMemberId('');
    }
  };

  const handleUpdateMemberRole = async (member, nextRole) => {
    const targetUserId = String(member?.user?.id || '');
    const currentRole = String(member?.role || 'member').toLowerCase();

    if (!community?.isOwner || !targetUserId || !community?.shortUrl) return;
    if (currentRole === nextRole) return;

    setUpdatingRoleMemberId(targetUserId);
    try {
      const updated = await updateMemberRoleInCommunityByShortUrl(community.shortUrl, targetUserId, nextRole);
      setCommunity(updated);
      if (updated?.canManageMembers) {
        await loadAuditLogs(updated.shortUrl);
      }
      addToast(`Rol actualizado a ${nextRole}`, 'success');
    } catch (error) {
      addToast(error?.response?.data?.message || 'No se pudo actualizar el rol', 'error');
    } finally {
      setUpdatingRoleMemberId('');
    }
  };

  const handleTransferOwnership = async (member) => {
    const targetUserId = String(member?.user?.id || '');
    if (!community?.isOwner || !community?.shortUrl || !targetUserId) return;

    const username = member?.user?.username || 'usuario';
    const shouldContinue = window.confirm(
      `Vas a transferir el ownership a @${username}. Esta acción te cambiará a admin. ¿Continuar?`
    );
    if (!shouldContinue) return;

    setTransferringOwnerMemberId(targetUserId);
    try {
      const updated = await transferCommunityOwnershipByShortUrl(community.shortUrl, targetUserId);
      setCommunity(updated);
      if (updated?.canManageMembers) {
        await loadAuditLogs(updated.shortUrl);
      }
      addToast(`Ownership transferido a @${username}`, 'success');
    } catch (error) {
      addToast(error?.response?.data?.message || 'No se pudo transferir el ownership', 'error');
    } finally {
      setTransferringOwnerMemberId('');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="community-space-page">
          <div className="community-space-card">
            <p>Cargando comunidad...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="dashboard-wrapper">
        <div className="community-space-page">
          <button className="community-space-back" onClick={() => navigate('/comunidad')}>
            <FaArrowLeft /> Volver
          </button>
          <div className="community-space-card" style={{ marginTop: 12 }}>
            <h3>Comunidad no disponible</h3>
            <p>{errorMessage || 'No encontramos esta comunidad'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="community-space-page">
        <button className="community-space-back" onClick={() => navigate('/comunidad')}>
          <FaArrowLeft /> Volver al Hub
        </button>

        <section className="community-space-header">
          <div
            className="community-space-banner"
            style={{
              backgroundImage: community.bannerUrl ? `url(${community.bannerUrl})` : undefined
            }}
          />
          <div className="community-space-meta">
            <img
              src={community.avatarUrl || ValorantImg}
              alt={community.name}
              className="community-space-avatar"
            />
            <div className="community-space-title">
              <h1>{community.name}</h1>
              <p>{community.description || 'Comunidad competitiva en Esportefy.'}</p>
              <div className="community-space-chips">
                <span className="community-chip">
                  <FaUsers /> {community.membersCount || 0} miembros
                </span>
                <span className="community-chip">
                  <FaMapMarkerAlt /> {community.region || 'Global'}
                </span>
                <span className="community-chip">
                  <FaGlobeAmericas /> {community.language || 'Español'}
                </span>
                <span className="community-chip">{community.role || 'member'}</span>
              </div>
            </div>
            <div className="community-space-actions">
              {community.isOwner ? (
                <button className="community-space-owner-badge" disabled>
                  Owner
                </button>
              ) : (
                <button className="community-space-join-btn" onClick={handleJoinLeave} disabled={actionLoading}>
                  {actionLoading ? 'Procesando...' : community.joined ? 'Salir' : 'Unirme'}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="community-space-grid">
          <article className="community-space-card">
            <h3>Descripción</h3>
            <p>{community.description || 'Sin descripción disponible.'}</p>
            {community.rulesPdfUrl && (
              <p style={{ marginTop: 10 }}>
                Reglamento:{' '}
                <a href={community.rulesPdfUrl} target="_blank" rel="noreferrer">
                  {community.rulesPdfName || 'Ver PDF'}
                </a>
              </p>
            )}
          </article>

          <aside className="community-space-card">
            <h3>Organizador</h3>
            <div className="community-space-owner">
              <img src={community.createdBy?.avatar || ValorantImg} alt={community.createdBy?.username || 'owner'} />
              <div className="community-member-meta">
                <strong>{community.createdBy?.username || 'Organizador'}</strong>
                <span>owner</span>
              </div>
            </div>
          </aside>
        </section>

        <section className="community-space-card" style={{ marginTop: 18 }}>
          <h3>Miembros</h3>
          {Array.isArray(community.members) && community.members.length > 0 ? (
            <div className="community-members-list">
              {community.members.map((member, idx) => (
                <div className="community-member-item" key={`${member.user?.id || idx}-${idx}`}>
                  <img src={member.user?.avatar || ValorantImg} alt={member.user?.username || 'user'} />
                  <div className="community-member-meta">
                    <strong>{member.user?.username || 'Usuario'}</strong>
                    <span>{member.role || 'member'}</span>
                  </div>
                  <div className="community-member-controls">
                    {community.isOwner && member.role !== 'owner' && (
                      <div className="community-member-role-actions">
                        {MEMBER_ROLE_OPTIONS.map((option) => (
                          <button
                            key={`${member.user?.id || idx}-${option.value}`}
                            className={`community-member-role-btn ${
                              String(member.role || '').toLowerCase() === option.value ? 'is-active' : ''
                            }`}
                            onClick={() => handleUpdateMemberRole(member, option.value)}
                            disabled={
                              updatingRoleMemberId === String(member.user?.id || '') ||
                              transferringOwnerMemberId === String(member.user?.id || '') ||
                              String(member.role || '').toLowerCase() === option.value
                            }
                          >
                            {option.label}
                          </button>
                        ))}
                        <button
                          className="community-member-transfer-btn"
                          onClick={() => handleTransferOwnership(member)}
                          disabled={
                            updatingRoleMemberId === String(member.user?.id || '') ||
                            transferringOwnerMemberId === String(member.user?.id || '') ||
                            removingMemberId === String(member.user?.id || '')
                          }
                        >
                          {transferringOwnerMemberId === String(member.user?.id || '') ? '...' : 'Hacer owner'}
                        </button>
                      </div>
                    )}
                    {community.canManageMembers &&
                      member.role !== 'owner' &&
                      String(member.user?.id || '') !== currentUserId && (
                        <button
                          className="community-member-remove-btn"
                          onClick={() => handleRemoveMember(member)}
                          disabled={
                            removingMemberId === String(member.user?.id || '') ||
                            updatingRoleMemberId === String(member.user?.id || '') ||
                            transferringOwnerMemberId === String(member.user?.id || '')
                          }
                        >
                          {removingMemberId === String(member.user?.id || '') ? '...' : 'Remover'}
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="community-space-empty">
              No hay miembros disponibles para mostrar.
            </div>
          )}
        </section>

        {community.canManageMembers && (
          <section className="community-space-card" style={{ marginTop: 18 }}>
            <div className="community-audit-header">
              <h3>Bitácora de moderación</h3>
              <button
                className="community-audit-refresh-btn"
                onClick={() => loadAuditLogs(community.shortUrl)}
                disabled={auditLoading}
              >
                {auditLoading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>

            {auditError && <p className="community-audit-error">{auditError}</p>}

            {!auditError && auditLoading ? (
              <p>Cargando bitácora...</p>
            ) : Array.isArray(auditLogs) && auditLogs.length > 0 ? (
              <div className="community-audit-list">
                {auditLogs.map((entry, idx) => (
                  <div className="community-audit-item" key={`${entry.action}-${entry.createdAt || idx}-${idx}`}>
                    <p className="community-audit-item-title">{describeAuditLog(entry)}</p>
                    <span className="community-audit-item-time">{formatAuditTimestamp(entry.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="community-space-empty">Sin actividad registrada.</div>
            )}
          </section>
        )}

        {Array.isArray(community.mainGames) && community.mainGames.length > 0 && (
          <section className="community-space-card" style={{ marginTop: 18 }}>
            <h3>
              <FaGamepad /> Juegos principales
            </h3>
            <div className="community-space-chips">
              {community.mainGames.map((game) => (
                <span key={game} className="community-chip">
                  {game}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CommunitySpacePage;
