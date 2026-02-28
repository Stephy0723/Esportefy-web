import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import './TournamentAdmin.css';

const createEmptyBracket = () => ({
  title: 'Bracket principal',
  rounds: [{ name: 'Ronda 1', matches: [{ teamA: '', teamB: '', scoreA: '', scoreB: '' }] }]
});

const TournamentManagePage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [registrationFilter, setRegistrationFilter] = useState('all');
  const [registrationQuery, setRegistrationQuery] = useState('');
  const [settings, setSettings] = useState({
    visibility: 'public',
    showPrize: true,
    showSponsors: true,
    showRules: true,
    showSchedule: true,
    showContact: true,
    showTeams: false,
    showBracket: true,
    customMessage: ''
  });
  const [bracket, setBracket] = useState(createEmptyBracket());

  const authConfig = useMemo(
    () => ({
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }),
    [token]
  );

  const isMlbbTournament = useMemo(() => {
    const game = String(tournament?.game || '').trim();
    return ['Mobile Legends', 'Mobile Legends: Bang Bang', 'MLBB'].includes(game);
  }, [tournament?.game]);

  const hasValidMlbbRoster = (registration) => {
    const starters = Array.isArray(registration?.roster?.starters)
      ? registration.roster.starters
      : [];
    if (starters.length === 0) return false;
    return starters.every((p) => String(p?.gameId || '').trim() && String(p?.region || '').trim());
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/tournaments/${code}`, authConfig);
        setTournament(res.data);
        setSettings((prev) => ({ ...prev, ...(res.data?.publicSettings || {}) }));
        setBracket(res.data?.bracket || createEmptyBracket());
      } catch (e) {
        console.error('Error cargando torneo:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [code, authConfig]);

  const fetchCompliance = async () => {
    try {
      setComplianceLoading(true);
      const res = await axios.get(`${API_URL}/api/tournaments/${code}/compliance`, authConfig);
      setCompliance(res.data || null);
    } catch (e) {
      setCompliance(null);
      console.error('Error cargando cumplimiento:', e);
    } finally {
      setComplianceLoading(false);
    }
  };

  useEffect(() => {
    if (!code || !token) return;
    fetchCompliance();
  }, [code, token]);

  const registrations = useMemo(
    () => (Array.isArray(tournament?.registrations) ? tournament.registrations : []),
    [tournament]
  );

  const filteredRegistrations = useMemo(() => {
    const q = String(registrationQuery || '').trim().toLowerCase();
    return registrations.filter((r) => {
      const status = String(r?.status || '').toLowerCase();
      if (registrationFilter !== 'all' && status !== registrationFilter) return false;
      if (!q) return true;
      const name = String(r?.teamName || '').toLowerCase();
      return name.includes(q);
    });
  }, [registrations, registrationFilter, registrationQuery]);

  const savePublicSettings = async () => {
    try {
      await axios.patch(`${API_URL}/api/tournaments/${code}/public-settings`, settings, authConfig);
      await fetchCompliance();
      alert('Configuración pública guardada.');
    } catch (e) {
      alert(e.response?.data?.message || 'No se pudo guardar la configuración pública.');
    }
  };

  const saveBracket = async () => {
    try {
      await axios.patch(`${API_URL}/api/tournaments/${code}/bracket`, { bracket }, authConfig);
      alert('Bracket guardado.');
    } catch (e) {
      alert(e.response?.data?.message || 'No se pudo guardar el bracket.');
    }
  };

  const updateRegistration = async (registrationId, status) => {
    try {
      await axios.patch(
        `${API_URL}/api/tournaments/${code}/registrations/${registrationId}`,
        { status },
        authConfig
      );
      setTournament((prev) => ({
        ...prev,
        registrations: (prev.registrations || []).map((r) => (String(r._id) === String(registrationId) ? { ...r, status } : r))
      }));
      await fetchCompliance();
    } catch (e) {
      alert(e.response?.data?.message || 'No se pudo actualizar el estado.');
    }
  };

  const removeRegistration = async (registrationId) => {
    try {
      await axios.delete(`${API_URL}/api/tournaments/${code}/registrations/${registrationId}`, authConfig);
      setTournament((prev) => ({
        ...prev,
        registrations: (prev.registrations || []).filter((r) => String(r._id) !== String(registrationId))
      }));
      await fetchCompliance();
    } catch (e) {
      alert(e.response?.data?.message || 'No se pudo eliminar la inscripción.');
    }
  };

  const addRound = () => {
    setBracket((prev) => ({
      ...prev,
      rounds: [...(prev.rounds || []), { name: `Ronda ${(prev.rounds || []).length + 1}`, matches: [{ teamA: '', teamB: '', scoreA: '', scoreB: '' }] }]
    }));
  };

  const addMatch = (roundIndex) => {
    setBracket((prev) => {
      const rounds = [...(prev.rounds || [])];
      rounds[roundIndex].matches.push({ teamA: '', teamB: '', scoreA: '', scoreB: '' });
      return { ...prev, rounds };
    });
  };

  const updateRoundName = (roundIndex, value) => {
    setBracket((prev) => {
      const rounds = [...(prev.rounds || [])];
      rounds[roundIndex].name = value;
      return { ...prev, rounds };
    });
  };

  const updateMatchField = (roundIndex, matchIndex, field, value) => {
    setBracket((prev) => {
      const rounds = [...(prev.rounds || [])];
      rounds[roundIndex].matches[matchIndex][field] = value;
      return { ...prev, rounds };
    });
  };

  if (loading) return <div className="ta-page"><div className="ta-empty">Cargando...</div></div>;
  if (!tournament) return <div className="ta-page"><div className="ta-empty">No se encontró el torneo.</div></div>;

  return (
    <div className="ta-page">
      <header className="ta-header">
        <h1>Gestión de torneo</h1>
        <p>{tournament.title} · #{tournament.tournamentId}</p>
      </header>

      <section className="ta-section">
        <h2>Visibilidad pública</h2>
        <div className="ta-form-grid">
          <label>
            <span>Visibilidad</span>
            <select value={settings.visibility} onChange={(e) => setSettings((s) => ({ ...s, visibility: e.target.value }))}>
              <option value="public">Público</option>
              <option value="unlisted">No listado (solo con ID)</option>
              <option value="private">Privado</option>
            </select>
          </label>
          <label>
            <span>Mensaje público</span>
            <input value={settings.customMessage || ''} onChange={(e) => setSettings((s) => ({ ...s, customMessage: e.target.value }))} />
          </label>
        </div>
        <div className="ta-toggles">
          {[
            ['showPrize', 'Mostrar premios'],
            ['showSponsors', 'Mostrar sponsors'],
            ['showRules', 'Mostrar reglamento'],
            ['showSchedule', 'Mostrar calendario'],
            ['showContact', 'Mostrar contacto/stream'],
            ['showTeams', 'Mostrar equipos inscritos'],
            ['showBracket', 'Mostrar bracket']
          ].map(([key, label]) => (
            <label key={key} className="ta-toggle">
              <input
                type="checkbox"
                checked={Boolean(settings[key])}
                onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.checked }))}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <div className="ta-actions">
          <button onClick={savePublicSettings}>Guardar visibilidad</button>
          <button className="ghost" onClick={() => navigate(`/torneos/publicos/${tournament.tournamentId}`)}>Abrir vista pública</button>
        </div>
      </section>

      <section className="ta-section">
        <h2>Cumplimiento MLBB</h2>
        <div className="ta-actions">
          <button className="ghost" onClick={fetchCompliance} disabled={complianceLoading}>
            {complianceLoading ? 'Verificando...' : 'Revisar cumplimiento'}
          </button>
        </div>
        {!compliance ? (
          <div className="ta-empty">No se pudo obtener el estado de cumplimiento.</div>
        ) : (
          <>
            {compliance?.mode?.requireLinkedStarters === true && (
              <p className="ta-empty">Modo estricto activo: todos los titulares deben estar vinculados a cuentas reales de Esportefy.</p>
            )}
            <div className="ta-compliance-list">
              {(Array.isArray(compliance.checks) ? compliance.checks : []).map((check) => (
                <article key={check.id} className={`ta-compliance-card ${check.ok ? 'ok' : 'warn'}`}>
                  <strong>{check.label}</strong>
                  <p>{check.detail}</p>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="ta-section">
        <h2>Aceptar equipos</h2>
        <div className="ta-registration-toolbar">
          <input
            placeholder="Buscar equipo..."
            value={registrationQuery}
            onChange={(e) => setRegistrationQuery(e.target.value)}
          />
          <select value={registrationFilter} onChange={(e) => setRegistrationFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
          </select>
        </div>

        {filteredRegistrations.length === 0 ? (
          <div className="ta-empty">No hay equipos inscritos.</div>
        ) : (
          <div className="ta-list">
            {filteredRegistrations.map((r) => (
              <article key={r._id} className="ta-row">
                <div>
                  <strong>{r.teamName}</strong>
                  <p>Estado: {r.status}</p>
                  <div className="ta-row-meta">
                    {isMlbbTournament && (
                      <span className={`ta-pill ${hasValidMlbbRoster(r) ? 'ok' : 'warn'}`}>
                        {hasValidMlbbRoster(r) ? 'MLBB ID completo' : 'MLBB ID incompleto'}
                      </span>
                    )}
                    {r?.teamMeta?.teamCountry && (
                      <span className="ta-pill">{r.teamMeta.teamCountry}</span>
                    )}
                    {r?.teamMeta?.teamLevel && (
                      <span className="ta-pill">{r.teamMeta.teamLevel}</span>
                    )}
                  </div>
                </div>
                <div className="ta-row-actions">
                  <button
                    onClick={() => updateRegistration(r._id, 'approved')}
                    disabled={isMlbbTournament && !hasValidMlbbRoster(r)}
                    title={isMlbbTournament && !hasValidMlbbRoster(r) ? 'Faltan IDs MLBB en titulares' : ''}
                  >
                    Aprobar
                  </button>
                  <button className="warn" onClick={() => updateRegistration(r._id, 'rejected')}>Rechazar</button>
                  <button className="danger" onClick={() => removeRegistration(r._id)}>Quitar</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="ta-section">
        <h2>Bracket</h2>
        <label>
          <span>Título del bracket</span>
          <input value={bracket.title || ''} onChange={(e) => setBracket((b) => ({ ...b, title: e.target.value }))} />
        </label>
        {(bracket.rounds || []).map((round, rIdx) => (
          <div key={`round-${rIdx}`} className="ta-bracket-round">
            <input value={round.name || ''} onChange={(e) => updateRoundName(rIdx, e.target.value)} />
            {(round.matches || []).map((m, mIdx) => (
              <div key={`m-${mIdx}`} className="ta-bracket-match">
                <input placeholder="Equipo A" value={m.teamA || ''} onChange={(e) => updateMatchField(rIdx, mIdx, 'teamA', e.target.value)} />
                <input placeholder="Score A" value={m.scoreA || ''} onChange={(e) => updateMatchField(rIdx, mIdx, 'scoreA', e.target.value)} />
                <input placeholder="Equipo B" value={m.teamB || ''} onChange={(e) => updateMatchField(rIdx, mIdx, 'teamB', e.target.value)} />
                <input placeholder="Score B" value={m.scoreB || ''} onChange={(e) => updateMatchField(rIdx, mIdx, 'scoreB', e.target.value)} />
              </div>
            ))}
            <button className="ghost" onClick={() => addMatch(rIdx)}>Agregar match</button>
          </div>
        ))}
        <div className="ta-actions">
          <button className="ghost" onClick={addRound}>Agregar ronda</button>
          <button onClick={saveBracket}>Guardar bracket</button>
        </div>
      </section>
    </div>
  );
};

export default TournamentManagePage;
