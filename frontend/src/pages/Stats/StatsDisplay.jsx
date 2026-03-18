import React from 'react';
import './StatsDisplay.css';

const StatCard = ({ label, value, highlight = false }) => {
  if (!label || value == null || value === '') return null;

  return (
    <div className={`stat-card ${highlight ? 'highlight-card' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
};

const StatsSection = ({ section }) => {
  if (!section || !Array.isArray(section.cards) || section.cards.length === 0) {
    return null;
  }

  return (
    <section className="game-stats-container">
      <div className="game-stats-container__header">
        <h3>{section.title}</h3>
        {section.description ? <p>{section.description}</p> : null}
      </div>

      <div className="stats-grid">
        {section.cards.map((card, index) => (
          <StatCard
            key={`${section.id}-${card.label}-${index}`}
            label={card.label}
            value={card.value}
            highlight={card.highlight === true}
          />
        ))}
      </div>
    </section>
  );
};

const PlayerAvatar = ({ profile, game }) => {
  const avatarUrl = String(profile?.avatarUrl || '').trim();
  if (avatarUrl) {
    return <img src={avatarUrl} alt={`Avatar de ${profile?.handle || 'jugador'}`} className="player-avatar" />;
  }

  const fallbackText = String(profile?.handle || game?.name || '?').trim().charAt(0).toUpperCase() || '?';
  return <div className="player-avatar player-avatar--fallback">{fallbackText}</div>;
};

function StatsDisplay({ stats }) {
  if (!stats) return null;

  const sections = Array.isArray(stats.sections) ? stats.sections.filter(Boolean) : [];
  const notes = Array.isArray(stats.notes) ? stats.notes.filter(Boolean) : [];

  return (
    <div className="stats-display">
      <div className="player-header">
        <PlayerAvatar profile={stats.profile} game={stats.game} />

        <div className="player-header__body">
          <div className="player-header__eyebrow">{stats.game?.name || 'Perfil'}</div>
          <h2 className="player-name">{stats.profile?.handle || stats.identifier || 'Jugador'}</h2>

          <div className="player-summary">
            <span className="player-summary__label">{stats.summary?.headline?.label || 'Resumen'}</span>
            <strong className="player-summary__value">
              {stats.summary?.headline?.value || 'Sin datos destacados'}
            </strong>
          </div>

          {stats.summary?.subtitle ? (
            <p className="player-summary__subtitle">{stats.summary.subtitle}</p>
          ) : null}
        </div>
      </div>

      {notes.length > 0 ? (
        <div className="stats-notes">
          {notes.map((note, index) => (
            <div key={`tracker-note-${index}`} className="stats-note">
              {note}
            </div>
          ))}
        </div>
      ) : null}

      {sections.length > 0 ? (
        sections.map((section) => <StatsSection key={section.id} section={section} />)
      ) : (
        <div className="stats-empty-block">Tracker no devolvio una seccion util para este perfil.</div>
      )}

      <div className="raw-json-toggle">
        <h4>Payload crudo de Tracker</h4>
        <details>
          <summary>Ver detalles tecnicos</summary>
          <pre>{JSON.stringify(stats.raw || stats, null, 2)}</pre>
        </details>
      </div>
    </div>
  );
}

export default StatsDisplay;
