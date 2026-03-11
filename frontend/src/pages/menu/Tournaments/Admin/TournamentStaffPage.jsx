import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import {
  TournamentAdminShell,
  useTournamentAdminData,
} from './TournamentAdminShared';
import './TournamentAdmin.css';

const STAFF_ROLES = [
  { value: 'admin', label: 'Administrador', desc: 'Control total del torneo', icon: 'bx-crown' },
  { value: 'moderator', label: 'Moderador', desc: 'Gestion de equipos y reportes', icon: 'bx-shield' },
  { value: 'referee', label: 'Arbitro', desc: 'Supervision de partidas', icon: 'bx-bullseye' },
  { value: 'caster', label: 'Caster', desc: 'Narrador del torneo', icon: 'bx-microphone' },
  { value: 'producer', label: 'Productor', desc: 'Produccion de stream', icon: 'bx-camera-movie' },
];

const ROLE_COLORS = {
  admin: '#ef4444',
  moderator: '#8EDB15',
  referee: '#f59e0b',
  caster: '#3b82f6',
  producer: '#a855f7',
};

const TournamentStaffPage = () => {
  const { code } = useParams();
  const { loading, tournament } = useTournamentAdminData(code);
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const authConfig = useMemo(() => ({
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }), [token]);

  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Add form
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('moderator');
  const [displayRole, setDisplayRole] = useState('');

  const fetchStaff = useCallback(async () => {
    if (!code) return;
    try {
      setStaffLoading(true);
      const res = await axios.get(`${API_URL}/api/tournaments/${code}/staff`);
      setStaff(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error cargando staff:', err);
    } finally {
      setStaffLoading(false);
    }
  }, [code]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const addMember = async () => {
    if (!username.trim()) return alert('Ingresa un nombre de usuario.');
    try {
      const res = await axios.post(`${API_URL}/api/tournaments/${code}/staff`, {
        username: username.trim(),
        role,
        displayRole: displayRole.trim(),
      }, authConfig);
      setStaff((prev) => [...prev, res.data]);
      setUsername('');
      setRole('moderator');
      setDisplayRole('');
      setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo agregar al staff.');
    }
  };

  const updateMember = async (memberUsername, updates) => {
    try {
      const res = await axios.patch(
        `${API_URL}/api/tournaments/${code}/staff/${memberUsername}`,
        updates,
        authConfig
      );
      setStaff((prev) => prev.map((m) => m.username === memberUsername ? { ...m, ...res.data } : m));
      setEditingMember(null);
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo actualizar el miembro.');
    }
  };

  const removeMember = async (memberUsername) => {
    if (!window.confirm(`Remover a ${memberUsername} del staff?`)) return;
    try {
      await axios.delete(`${API_URL}/api/tournaments/${code}/staff/${memberUsername}`, authConfig);
      setStaff((prev) => prev.filter((m) => m.username !== memberUsername));
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo remover al miembro.');
    }
  };

  const roleStats = useMemo(() => {
    const counts = {};
    STAFF_ROLES.forEach((r) => { counts[r.value] = 0; });
    staff.forEach((m) => { if (counts[m.role] !== undefined) counts[m.role]++; });
    return counts;
  }, [staff]);

  if (loading) return <div className="ta-page"><div className="ta-empty">Cargando...</div></div>;
  if (!tournament) return <div className="ta-page"><div className="ta-empty">No se encontro el torneo.</div></div>;

  return (
    <TournamentAdminShell tournament={tournament} currentTab="staff">
      {/* Stats */}
      <div className="ta-hero__metrics" style={{ marginBottom: 18 }}>
        <div className="ta-metric">
          <strong>{staff.length}</strong>
          <span>Total staff</span>
        </div>
        {STAFF_ROLES.filter((r) => roleStats[r.value] > 0).map((r) => (
          <div key={r.value} className="ta-metric">
            <strong style={{ color: ROLE_COLORS[r.value] }}>{roleStats[r.value]}</strong>
            <span>{r.label}s</span>
          </div>
        ))}
      </div>

      {/* Add member */}
      <div className="ta-toolbar" style={{ marginTop: 0 }}>
        <div />
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Agregar miembro'}
        </button>
      </div>

      {showForm && (
        <section className="ta-panel" style={{ marginTop: 16 }}>
          <div className="ta-panel__head">
            <div>
              <span className="ta-kicker">Nuevo miembro</span>
              <h2>Agregar al staff</h2>
            </div>
          </div>

          <div className="ta-staff-role-selector">
            {STAFF_ROLES.map((r) => (
              <button
                key={r.value}
                className={`ta-staff-role-btn ${role === r.value ? 'is-active' : ''}`}
                onClick={() => setRole(r.value)}
                style={{ '--role-color': ROLE_COLORS[r.value] }}
              >
                <i className={`bx ${r.icon}`} />
                <strong>{r.label}</strong>
                <span>{r.desc}</span>
              </button>
            ))}
          </div>

          <div className="ta-form-grid">
            <label>
              <span>Nombre de usuario</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username en la plataforma"
              />
            </label>
            <label>
              <span>Titulo personalizado (opcional)</span>
              <input
                value={displayRole}
                onChange={(e) => setDisplayRole(e.target.value)}
                placeholder="Ej: Director de torneo, Observador..."
              />
            </label>
          </div>

          <div className="ta-shortcuts" style={{ marginTop: 12 }}>
            <button onClick={addMember}>Agregar al staff</button>
          </div>
        </section>
      )}

      {/* Staff list */}
      <section className="ta-panel" style={{ marginTop: 16 }}>
        <div className="ta-panel__head">
          <div>
            <span className="ta-kicker">Equipo de trabajo</span>
            <h2>Staff del torneo</h2>
          </div>
        </div>

        {/* Organizer card */}
        <div className="ta-staff-grid">
          <article className="ta-staff-card ta-staff-card--organizer">
            <div className="ta-staff-card__avatar">
              <i className="bx bx-crown" />
            </div>
            <div className="ta-staff-card__info">
              <strong>Organizador</strong>
              <span className="ta-staff-card__name">
                {tournament.organizer?.username || tournament.organizer?.name || 'Propietario'}
              </span>
              <span className="ta-staff-card__role" style={{ color: '#ffd700' }}>
                Propietario del torneo
              </span>
            </div>
          </article>

          {staffLoading ? (
            <div className="ta-empty" style={{ gridColumn: '1 / -1' }}>Cargando staff...</div>
          ) : staff.length === 0 ? (
            <div className="ta-empty" style={{ gridColumn: '1 / -1' }}>
              No hay miembros en el staff. Agrega moderadores, arbitros o casters.
            </div>
          ) : (
            staff.map((member) => {
              const roleMeta = STAFF_ROLES.find((r) => r.value === member.role) || STAFF_ROLES[1];
              const color = ROLE_COLORS[member.role] || '#8EDB15';
              const isEditing = editingMember === member.username;

              return (
                <article key={member.username} className="ta-staff-card">
                  <div className="ta-staff-card__avatar" style={{ borderColor: color }}>
                    <i className={`bx ${roleMeta.icon}`} style={{ color }} />
                  </div>
                  <div className="ta-staff-card__info">
                    <strong>{member.username}</strong>
                    <span className="ta-staff-card__role" style={{ color }}>
                      {member.displayRole || roleMeta.label}
                    </span>
                    <small>Desde {new Date(member.addedAt).toLocaleDateString('es-DO')}</small>
                  </div>

                  {isEditing ? (
                    <div className="ta-staff-card__edit">
                      <select
                        value={member.role}
                        onChange={(e) => updateMember(member.username, { role: e.target.value })}
                      >
                        {STAFF_ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <button className="ta-btn-sm ta-btn-sm--secondary" onClick={() => setEditingMember(null)}>
                        Cerrar
                      </button>
                    </div>
                  ) : (
                    <div className="ta-staff-card__actions">
                      <button className="ta-btn-sm ta-btn-sm--secondary" onClick={() => setEditingMember(member.username)}>
                        Editar
                      </button>
                      <button className="ta-btn-sm ta-btn-sm--danger" onClick={() => removeMember(member.username)}>
                        Remover
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* Public view preview */}
      <section className="ta-panel" style={{ marginTop: 16 }}>
        <div className="ta-panel__head">
          <div>
            <span className="ta-kicker">Vista publica</span>
            <h2>Asi se vera el staff para los participantes</h2>
          </div>
        </div>

        <div className="ta-staff-public-preview">
          <div className="ta-staff-public-card">
            <i className="bx bx-crown" style={{ color: '#ffd700', fontSize: '1.6rem' }} />
            <strong>{tournament.organizer?.username || 'Organizador'}</strong>
            <span>Organizador</span>
          </div>
          {staff.map((member) => {
            const roleMeta = STAFF_ROLES.find((r) => r.value === member.role) || STAFF_ROLES[1];
            const color = ROLE_COLORS[member.role] || '#8EDB15';
            return (
              <div key={member.username} className="ta-staff-public-card">
                <i className={`bx ${roleMeta.icon}`} style={{ color, fontSize: '1.6rem' }} />
                <strong>{member.username}</strong>
                <span>{member.displayRole || roleMeta.label}</span>
              </div>
            );
          })}
        </div>
      </section>
    </TournamentAdminShell>
  );
};

export default TournamentStaffPage;
