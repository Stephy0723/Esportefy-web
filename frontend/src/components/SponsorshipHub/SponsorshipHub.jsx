import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBolt,
  FaCommentDots,
  FaCompactDisc,
  FaHandshake,
  FaHeadphones,
  FaHeadset,
  FaPaperPlane,
  FaPause,
  FaPlay,
  FaStop,
  FaStepForward,
  FaTimes,
} from 'react-icons/fa';
import './SponsorshipHub.css';

const INITIAL_FORM = {
  brand: '',
  contact: '',
  email: '',
  budget: '',
  objective: '',
  message: '',
};

const INITIAL_AGENT_MESSAGES = [
  {
    id: 1,
    role: 'agent',
    text: 'Hola, soy Esportefy Agent. Puedo ayudarte con patrocinios, activaciones y soporte comercial.',
  },
];

const MUSIC_STATE_KEY = 'spm-music-state';

const TRACKS = [
  { title: 'Neon Drift', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', accent: '#4cc9f0' },
  { title: 'Cyber Calm', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', accent: '#89f7c8' },
  { title: 'Arena Focus', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', accent: '#f3c667' },
  { title: 'Pulse Runner', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', accent: '#f66dff' },
  { title: 'Night Strategy', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', accent: '#7da1ff' },
];

const HUB_ACTIONS = [
  { id: 'music', icon: FaHeadphones, label: 'Música', color: '#4cc9f0' },
  { id: 'agent', icon: FaCommentDots, label: 'Agente', color: '#8EDB15' },
  { id: 'sponsor', icon: FaHandshake, label: 'Patrocinio', color: '#f3c667' },
  { id: 'quick', icon: FaBolt, label: 'Esportefy TV', color: '#c084fc' },
];

const ACTION_LAYOUT = {
  music: { x: '-54px', y: '-112px' },
  agent: { x: '-104px', y: '-58px' },
  sponsor: { x: '-6px', y: '-58px' },
};

const DEFAULT_MUSIC_STATE = { trackIndex: 0, volume: 0.42 };

const readStoredMusicState = () => {
  if (typeof window === 'undefined') return DEFAULT_MUSIC_STATE;

  try {
    const raw = window.localStorage.getItem(MUSIC_STATE_KEY);
    if (!raw) return DEFAULT_MUSIC_STATE;

    const parsed = JSON.parse(raw);
    return {
      trackIndex: Math.min(Math.max(Number.isInteger(parsed.trackIndex) ? parsed.trackIndex : 0, 0), TRACKS.length - 1),
      volume: Math.min(Math.max(typeof parsed.volume === 'number' ? parsed.volume : 0.42, 0), 1),
    };
  } catch {
    return DEFAULT_MUSIC_STATE;
  }
};

const getAgentReply = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes('patro') || lower.includes('marca'))
    return 'Si buscas patrocinio, abre la burbuja dorada. Si prefieres, dejame tu presupuesto y tipo de activacion y lo preparo aqui.';
  if (lower.includes('torneo') || lower.includes('evento'))
    return 'Para torneos y eventos, lo ideal es definir alcance, fechas y audiencia. Si quieres, te ayudo a estructurarlo en 3 puntos.';
  if (lower.includes('hola') || lower.includes('buenas'))
    return 'Hola. Dime si necesitas patrocinio, musica ambiental para el hub, o hablar con soporte comercial.';
  return 'Puedo ayudarte a conectar con el equipo correcto. Si me dices tu objetivo, te preparo el siguiente paso.';
};

/* ─── Sub-components ─── */

const BubbleButton = ({ action, commandOpen, onClick }) => {
  const Icon = action.icon;
  return (
    <button
      type="button"
      className={`spm-action${commandOpen ? ' is-open' : ''}`}
      onClick={onClick}
      aria-label={action.label}
      style={{ '--ac-color': action.color, '--ac-delay': action.delay, '--ac-x': action.x, '--ac-y': action.y }}
    >
      <Icon />
    </button>
  );
};

const MusicPanel = ({
  currentTrack,
  currentTrackIndex,
  isPlaying,
  musicPanelOpen,
  onClose,
  onNextTrack,
  onPlayPause,
  onSelectTrack,
  onStopTrack,
  setVolume,
  volume,
}) => (
  <section className={`spm-music-panel${musicPanelOpen ? ' is-open' : ''}`} aria-hidden={!musicPanelOpen}>
    {/* Accent top border */}
    <div className="spm-mp__accent" style={{ background: `linear-gradient(90deg, transparent, ${currentTrack.accent}, transparent)` }} />

    <div className="spm-mp__head">
      <div className="spm-mp__now">
        <div className="spm-mp__vis" style={{ '--vis-c': currentTrack.accent }}>
          {isPlaying && <>
            <span /><span /><span /><span /><span />
          </>}
          {!isPlaying && <FaHeadphones style={{ color: currentTrack.accent, fontSize: '1rem' }} />}
        </div>
        <div>
          <span className="spm-mp__label">REPRODUCIENDO</span>
          <strong className="spm-mp__title">{currentTrack.title}</strong>
        </div>
      </div>
      <button type="button" className="spm-mp__close" onClick={onClose} aria-label="Cerrar">
        <FaTimes />
      </button>
    </div>

    <div className="spm-mp__tracks">
      {TRACKS.map((track, index) => (
        <button
          key={track.title}
          type="button"
          className={`spm-mp__track${currentTrackIndex === index ? ' is-active' : ''}`}
          onClick={() => onSelectTrack(index)}
          style={{ '--t-c': track.accent }}
        >
          <span className="spm-mp__track-idx">{String(index + 1).padStart(2, '0')}</span>
          <span className="spm-mp__track-name">{track.title}</span>
          {currentTrackIndex === index && isPlaying && (
            <span className="spm-mp__track-live">LIVE</span>
          )}
        </button>
      ))}
    </div>

    <div className="spm-mp__controls">
      <button type="button" className="spm-mp__btn spm-mp__btn--main" onClick={onPlayPause} aria-label={isPlaying ? 'Pausar' : 'Reproducir'} style={{ '--btn-c': currentTrack.accent }}>
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      <button type="button" className="spm-mp__btn" onClick={onNextTrack} aria-label="Siguiente">
        <FaStepForward />
      </button>
      <button type="button" className="spm-mp__btn" onClick={onStopTrack} aria-label="Detener">
        <FaStop />
      </button>
      <label className="spm-mp__vol">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="Volumen"
        />
      </label>
    </div>
  </section>
);

const SponsorDialog = ({ form, onChange, onClose, onSubmit, sent }) => (
  <div className="spm-overlay" onClick={onClose} role="dialog" aria-modal="true">
    <div className="spm-modal" onClick={(e) => e.stopPropagation()}>
      <button type="button" className="spm-close" onClick={onClose} aria-label="Cerrar">
        <FaTimes />
      </button>

      <header className="spm-head">
        <div className="spm-head__icon">
          <FaHandshake />
        </div>
        <div>
          <h3>Patrocinio Esportefy</h3>
          <p>Envia tu propuesta y te contactamos para activaciones, torneos y branding.</p>
        </div>
      </header>

      {sent ? (
        <div className="spm-success">
          <strong>Solicitud enviada</strong>
          <span>El equipo comercial revisara tu propuesta en breve.</span>
        </div>
      ) : (
        <form className="spm-form" onSubmit={onSubmit}>
          <label>
            Marca o empresa
            <input name="brand" value={form.brand} onChange={onChange} required />
          </label>
          <label>
            Contacto
            <input name="contact" value={form.contact} onChange={onChange} required />
          </label>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={onChange} required />
          </label>
          <label>
            Presupuesto estimado
            <select name="budget" value={form.budget} onChange={onChange} required>
              <option value="">Seleccionar</option>
              <option value="1k-5k">USD 1,000 - 5,000</option>
              <option value="5k-20k">USD 5,000 - 20,000</option>
              <option value="20k+">USD 20,000+</option>
            </select>
          </label>
          <label>
            Objetivo principal
            <select name="objective" value={form.objective} onChange={onChange} required>
              <option value="">Seleccionar</option>
              <option value="branding">Branding y visibilidad</option>
              <option value="torneo">Patrocinar torneos</option>
              <option value="creadores">Campana con creadores</option>
            </select>
          </label>
          <label>
            Mensaje
            <textarea
              name="message"
              rows={4}
              value={form.message}
              onChange={onChange}
              placeholder="Cuentanos el tipo de activacion que buscas..."
              required
            />
          </label>
          <button type="submit" className="spm-submit">
            <FaPaperPlane />
            Enviar propuesta
          </button>
        </form>
      )}
    </div>
  </div>
);

const AgentDialog = ({ agentDraft, agentMessages, onClose, onSubmit, setAgentDraft }) => {
  const threadRef = useRef(null);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [agentMessages]);

  return (
    <div className="spm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="spm-agent-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="spm-close" onClick={onClose} aria-label="Cerrar">
          <FaTimes />
        </button>

        <header className="spm-agent-head">
          <div className="spm-agent-head__icon">
            <FaHeadset />
          </div>
          <div>
            <h3>Agent Console</h3>
            <p>Habla con un agente virtual para soporte comercial y activaciones.</p>
          </div>
        </header>

        <div className="spm-agent-thread" ref={threadRef}>
          {agentMessages.map((msg) => (
            <article
              key={msg.id}
              className={`spm-agent-msg ${msg.role === 'user' ? 'is-user' : 'is-bot'}`}
            >
              <div className="spm-agent-msg__header">
                {msg.role !== 'user' && (
                  <div className="spm-agent-msg__avatar">
                    <FaHeadset />
                  </div>
                )}
                <span>{msg.role === 'user' ? 'Tu' : 'Esportefy Agent'}</span>
              </div>
              <p>{msg.text}</p>
            </article>
          ))}
        </div>

        <form className="spm-agent-form" onSubmit={onSubmit}>
          <input
            value={agentDraft}
            onChange={(e) => setAgentDraft(e.target.value)}
            placeholder="Escribe tu consulta..."
          />
          <button type="submit" aria-label="Enviar mensaje">
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
};

/* ─── Main Component ─── */

const SponsorshipHub = () => {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const hubRef = useRef(null);
  const closePanelTimerRef = useRef(null);
  const closeSponsorTimerRef = useRef(null);

  const [{ trackIndex: initialTrackIndex, volume: initialVolume }] = useState(readStoredMusicState);
  const [commandOpen, setCommandOpen] = useState(false);
  const [bursting, setBursting] = useState(false);
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [agentDraft, setAgentDraft] = useState('');
  const [agentMessages, setAgentMessages] = useState(INITIAL_AGENT_MESSAGES);
  const [musicPanelOpen, setMusicPanelOpen] = useState(false);
  const [compactDiscVisible, setCompactDiscVisible] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(initialTrackIndex);
  const [volume, setVolume] = useState(initialVolume);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  const [hasActivatedMusic, setHasActivatedMusic] = useState(false);

  const currentTrack = TRACKS[currentTrackIndex];
  const actions = HUB_ACTIONS
    .filter((action) => action.id !== 'quick')
    .map((action, index) => ({
      ...action,
      ...(ACTION_LAYOUT[action.id] || {}),
      delay: `${index * 60}ms`,
    }));

  // Persist music state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(MUSIC_STATE_KEY, JSON.stringify({ trackIndex: currentTrackIndex, volume }));
  }, [currentTrackIndex, volume]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Autoplay handler
  useEffect(() => {
    if (!shouldAutoplay || !audioRef.current) return;
    const playPromise = audioRef.current.play();
    if (playPromise?.catch) playPromise.catch(() => setIsPlaying(false));
    setShouldAutoplay(false);
  }, [currentTrackIndex, shouldAutoplay]);

  // Click outside & escape
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (commandOpen && !hubRef.current?.contains(e.target)) setCommandOpen(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setCommandOpen(false);
        setMusicPanelOpen(false);
        setSponsorOpen(false);
        setAgentOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [commandOpen]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (closePanelTimerRef.current) window.clearTimeout(closePanelTimerRef.current);
      if (closeSponsorTimerRef.current) window.clearTimeout(closeSponsorTimerRef.current);
    };
  }, []);

  // Hide disc when not playing
  useEffect(() => {
    if (!isPlaying) setCompactDiscVisible(false);
  }, [isPlaying]);

  const triggerBurst = useCallback(() => {
    setBursting(true);
    window.clearTimeout(closePanelTimerRef.current);
    closePanelTimerRef.current = window.setTimeout(() => setBursting(false), 400);
  }, []);

  const handleHubToggle = useCallback(() => {
    triggerBurst();
    setCommandOpen((prev) => !prev);
  }, [triggerBurst]);

  const handleTrackSelect = useCallback((index) => {
    setCurrentTrackIndex(index);
    setHasActivatedMusic(true);
    setShouldAutoplay(true);
    setMusicPanelOpen(true);
    setCompactDiscVisible(false);
  }, []);

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!hasActivatedMusic) {
      setHasActivatedMusic(true);
      setShouldAutoplay(true);
      return;
    }

    if (audio.paused) {
      setShouldAutoplay(true);
    } else {
      audio.pause();
    }
  }, [hasActivatedMusic]);

  const handleNextTrack = useCallback(() => {
    handleTrackSelect((currentTrackIndex + 1) % TRACKS.length);
  }, [currentTrackIndex, handleTrackSelect]);

  const handleCloseMusicPanel = useCallback(() => {
    setMusicPanelOpen(false);
    setCompactDiscVisible(isPlaying && hasActivatedMusic);
  }, [isPlaying, hasActivatedMusic]);

  const handleStopTrack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCompactDiscVisible(false);
  }, []);

  const handleDiscClick = useCallback(() => {
    setMusicPanelOpen(true);
    setCompactDiscVisible(false);
  }, []);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSponsorSubmit = useCallback((e) => {
    e.preventDefault();
    setSent(true);
    setForm(INITIAL_FORM);
    window.clearTimeout(closeSponsorTimerRef.current);
    closeSponsorTimerRef.current = window.setTimeout(() => {
      setSent(false);
      setSponsorOpen(false);
    }, 1500);
  }, []);

  const handleAgentSubmit = useCallback((e) => {
    e.preventDefault();
    const text = agentDraft.trim();
    if (!text) return;

    setAgentMessages((prev) => [
      ...prev,
      { id: Date.now(), role: 'user', text },
      { id: Date.now() + 1, role: 'agent', text: getAgentReply(text) },
    ]);
    setAgentDraft('');
  }, [agentDraft]);

  const handleAction = useCallback((actionId) => {
    setCommandOpen(false);
    if (actionId === 'music') { setMusicPanelOpen(true); setCompactDiscVisible(false); return; }
    if (actionId === 'agent') { setAgentOpen(true); return; }
    if (actionId === 'sponsor') { setSponsorOpen(true); return; }
    navigate('/tv');
  }, [navigate]);

  return (
    <>
      <div className="spm-hub" ref={hubRef}>
        {compactDiscVisible && (
          <button
            type="button"
            className={`spm-disc${isPlaying ? ' is-spinning' : ''}`}
            onClick={handleDiscClick}
            aria-label="Reabrir music hub"
            style={{ '--disc-accent': currentTrack.accent }}
          >
            <FaCompactDisc />
          </button>
        )}

        <MusicPanel
          currentTrack={currentTrack}
          currentTrackIndex={currentTrackIndex}
          isPlaying={isPlaying}
          musicPanelOpen={musicPanelOpen}
          onClose={handleCloseMusicPanel}
          onNextTrack={handleNextTrack}
          onPlayPause={handlePlayPause}
          onSelectTrack={handleTrackSelect}
          onStopTrack={handleStopTrack}
          setVolume={setVolume}
          volume={volume}
        />

        {actions.map((action) => (
          <BubbleButton
            key={action.id}
            action={action}
            commandOpen={commandOpen}
            onClick={() => handleAction(action.id)}
          />
        ))}

        <button
          type="button"
          className={`spm-core${commandOpen ? ' is-open' : ''}${bursting ? ' is-bursting' : ''}`}
          onClick={handleHubToggle}
          aria-label="Abrir command hub"
        >
          <span className="spm-core__ring" />
          <span className="spm-core__icon">
            {commandOpen ? <FaTimes /> : <FaBolt />}
          </span>
        </button>
      </div>

      {sponsorOpen && (
        <SponsorDialog
          form={form}
          onChange={handleFormChange}
          onClose={() => setSponsorOpen(false)}
          onSubmit={handleSponsorSubmit}
          sent={sent}
        />
      )}

      {agentOpen && (
        <AgentDialog
          agentDraft={agentDraft}
          agentMessages={agentMessages}
          onClose={() => setAgentOpen(false)}
          onSubmit={handleAgentSubmit}
          setAgentDraft={setAgentDraft}
        />
      )}

      <audio
        ref={audioRef}
        src={currentTrack.url}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => { setIsPlaying(false); setCompactDiscVisible(false); }}
        onEnded={() => { setIsPlaying(false); handleNextTrack(); }}
      />
    </>
  );
};

export default SponsorshipHub;
