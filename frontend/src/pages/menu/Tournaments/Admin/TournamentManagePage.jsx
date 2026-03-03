import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  TournamentAdminShell,
  useTournamentAdminData,
} from './TournamentAdminShared';
import './TournamentAdmin.css';

const TournamentManagePage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const {
    loading,
    tournament,
    settings,
    setSettings,
    compliance,
    complianceLoading,
    registrations,
    isMlbbTournament,
    hasValidMlbbRoster,
    refreshCompliance,
    savePublicSettings,
    updateRegistration,
    removeRegistration,
  } = useTournamentAdminData(code);

  if (loading) return <div className="ta-page"><div className="ta-empty">Cargando...</div></div>;
  if (!tournament) return <div className="ta-page"><div className="ta-empty">No se encontro el torneo.</div></div>;

  return (
    <TournamentAdminShell tournament={tournament} currentTab="overview">
      <div className="ta-manage-layout">
        <section className="ta-panel">
          <div className="ta-panel__head">
            <div>
              <span className="ta-kicker">Publicacion</span>
              <h2>Presencia publica del torneo</h2>
            </div>
            <div className="ta-actions">
              <button onClick={savePublicSettings}>Guardar cambios</button>
              <button className="ghost" onClick={() => navigate(`/torneos/publicos/${tournament.tournamentId}`)}>
                Ver pagina publica
              </button>
            </div>
          </div>

          <div className="ta-form-grid">
            <label>
              <span>Visibilidad</span>
              <select value={settings.visibility} onChange={(e) => setSettings((prev) => ({ ...prev, visibility: e.target.value }))}>
                <option value="public">Publico</option>
                <option value="unlisted">No listado</option>
                <option value="private">Privado</option>
              </select>
            </label>
            <label>
              <span>Mensaje de portada</span>
              <input
                value={settings.customMessage || ''}
                onChange={(e) => setSettings((prev) => ({ ...prev, customMessage: e.target.value }))}
                placeholder="Mensaje visible en la pagina del torneo"
              />
            </label>
          </div>

          <div className="ta-toggles">
            {[
              ['showPrize', 'Mostrar premios'],
              ['showSponsors', 'Mostrar sponsors'],
              ['showRules', 'Mostrar reglamento'],
              ['showSchedule', 'Mostrar horario'],
              ['showContact', 'Mostrar stream y contacto'],
              ['showTeams', 'Mostrar equipos'],
              ['showBracket', 'Mostrar bracket'],
            ].map(([key, label]) => (
              <label key={key} className="ta-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(settings[key])}
                  onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.checked }))}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="ta-side-stack">
          <article className="ta-panel ta-panel--compact">
            <span className="ta-kicker">Atajos</span>
            <h3>Flujo de produccion</h3>
            <div className="ta-shortcuts">
              <button onClick={() => navigate(`/tournaments/manage/${tournament.tournamentId}/bracket`)}>
                Abrir bracket
              </button>
              <button onClick={() => navigate(`/tournaments/manage/${tournament.tournamentId}/roulette`)}>
                Abrir ruleta
              </button>
              <button className="ghost" onClick={() => navigate(`/torneos/publicos/${tournament.tournamentId}`)}>
                Vista publica
              </button>
            </div>
          </article>

          <article className="ta-panel ta-panel--compact">
            <span className="ta-kicker">Estado</span>
            <h3>Lectura rapida</h3>
            <div className="ta-summary-grid">
              <div>
                <span>Juego</span>
                <strong>{tournament.game}</strong>
              </div>
              <div>
                <span>Estatus</span>
                <strong>{tournament.status || 'draft'}</strong>
              </div>
              <div>
                <span>Slots</span>
                <strong>{tournament.currentSlots || 0}/{tournament.maxSlots || 0}</strong>
              </div>
              <div>
                <span>Fecha</span>
                <strong>{tournament.date ? new Date(tournament.date).toLocaleDateString('es-DO') : '-'}</strong>
              </div>
            </div>
          </article>

          <article className="ta-panel ta-panel--compact">
            <div className="ta-panel__head">
              <div>
                <span className="ta-kicker">Compliance</span>
                <h3>Revision backend</h3>
              </div>
              <div className="ta-actions">
                <button className="ghost" onClick={refreshCompliance} disabled={complianceLoading}>
                  {complianceLoading ? 'Verificando...' : 'Actualizar'}
                </button>
              </div>
            </div>

            {!compliance ? (
              <div className="ta-empty">No se pudo cargar el estado de cumplimiento.</div>
            ) : (
              <div className="ta-compliance-list">
                {compliance.checks?.map((check) => (
                  <article key={check.id} className={`ta-compliance-card ${check.ok ? 'ok' : 'warn'}`}>
                    <strong>{check.label}</strong>
                    <p>{check.detail}</p>
                  </article>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>

      <section className="ta-panel ta-panel--teams">
        <div className="ta-panel__head">
          <div>
            <span className="ta-kicker">Operacion</span>
            <h2>Revision de equipos</h2>
          </div>
        </div>

        {registrations.length === 0 ? (
          <div className="ta-empty">No hay equipos inscritos.</div>
        ) : (
          <div className="ta-list">
            {registrations.map((item) => (
              <article key={item._id} className="ta-row">
                <div>
                  <strong>{item.teamName}</strong>
                  <p>Estado actual: {item.status}</p>
                  <div className="ta-row-meta">
                    {item?.teamMeta?.teamCountry ? <span className="ta-pill">{item.teamMeta.teamCountry}</span> : null}
                    {item?.teamMeta?.teamLevel ? <span className="ta-pill">{item.teamMeta.teamLevel}</span> : null}
                    {isMlbbTournament ? (
                      <span className={`ta-pill ${hasValidMlbbRoster(item) ? 'ok' : 'warn'}`}>
                        {hasValidMlbbRoster(item) ? 'MLBB listo' : 'MLBB incompleto'}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="ta-row-actions">
                  <button
                    onClick={() => updateRegistration(item._id, 'approved')}
                    disabled={isMlbbTournament && !hasValidMlbbRoster(item)}
                    title={isMlbbTournament && !hasValidMlbbRoster(item) ? 'Faltan User ID/Zone ID en el roster MLBB.' : ''}
                  >
                    Aprobar
                  </button>
                  <button className="warn" onClick={() => updateRegistration(item._id, 'rejected')}>Rechazar</button>
                  <button className="danger" onClick={() => removeRegistration(item._id)}>Quitar</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </TournamentAdminShell>
  );
};

export default TournamentManagePage;
