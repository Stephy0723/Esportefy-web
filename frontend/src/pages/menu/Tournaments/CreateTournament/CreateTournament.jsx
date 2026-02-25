import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../../../../components/Navbar/Navbar';
import Sidebar from '../../../../components/Sidebar/Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import axios from 'axios'; // Importamos Axios
import { API_URL, RIOT_MIN_ACTIVE_PARTICIPANTS, RIOT_REVIEW_MODE } from '../../../../config/api';
import { 
    FaPlus, FaGamepad, FaUsers, FaMicrophone, FaAward, 
    FaCalendarAlt, FaSitemap, FaTicketAlt, FaFileUpload, FaFilePdf,
    FaServer, FaTrash, FaCheckCircle, FaStar, FaGift, FaTag, FaLink, FaImage, FaCheck
} from 'react-icons/fa';
import './CreateTournament.css';

const GAME_CONFIG = {
  "All": { color: "#ffffff", icon: "bx-grid-alt" },
  "Valorant": { color: "#ff4655", icon: "bx-crosshair" },
  "CS:GO 2": { color: "#de9b35", icon: "bx-target-lock" },
  "Call of Duty": { color: "#54b946", icon: "bx-run" },
  "Warzone": { color: "#54b946", icon: "bx-radar" },
  "Fortnite": { color: "#a349a4", icon: "bx-building" },
  "Free Fire": { color: "#f39c12", icon: "bx-flame" },
  "PUBG": { color: "#f1c40f", icon: "bx-target-lock" },
  "Apex Legends": { color: "#e74c3c", icon: "bx-shield-quarter" },
  "Overwatch 2": { color: "#f39c12", icon: "bx-shield" },
  "Rainbow Six Siege": { color: "#3498db", icon: "bx-window" },
  "League of Legends": { color: "#c1a05e", icon: "bx-world" },
  "Dota 2": { color: "#e74c3c", icon: "bx-map-alt" },
  "Mobile Legends": { color: "#ffbf00", icon: "bx-mobile-landscape" },
  "Honor of Kings": { color: "#e6b333", icon: "bx-crown" },
  "Smite": { color: "#f1c40f", icon: "bx-bolt-circle" },
  "Wild Rift": { color: "#00a8ff", icon: "bx-mobile" },
  "FIFA 24": { color: "#2ecc71", icon: "bx-football" },
  "NBA 2K24": { color: "#e67e22", icon: "bx-basketball" },
  "Rocket League": { color: "#0088ff", icon: "bx-car" },
  "Street Fighter 6": { color: "#f39c12", icon: "bx-walk" },
  "Tekken 8": { color: "#c0392b", icon: "bx-angry" },
  "Clash Royale": { color: "#3498db", icon: "bx-crown" },
  "Teamfight Tactics": { color: "#f1c40f", icon: "bx-grid" },
  "Hearthstone": { color: "#f39c12", icon: "bx-book" },
  "Legends of Runeterra": { color: "#3498db", icon: "bx-book-open" },
  "StarCraft II": { color: "#00a8ff", icon: "bx-planet" }
};

const FORMAT_OPTIONS = [
  { value: 'single_elimination', label: 'Eliminación Directa' },
  { value: 'double_elimination', label: 'Doble Eliminación' },
  { value: 'swiss', label: 'Suizo (Swiss)' },
  { value: 'round_robin', label: 'Round Robin' }
];

const PLATFORM_OPTIONS = [
  { value: 'PC', label: 'PC' },
  { value: 'Mobile', label: 'Mobile' },
  { value: 'Console', label: 'Consola' },
  { value: 'Crossplay', label: 'Crossplay' }
];
const REGION_OPTIONS = [
  { value: 'LAN', label: 'LATAM Norte (LAN)' },
  { value: 'LAS', label: 'LATAM Sur (LAS)' },
  { value: 'NA', label: 'Norteamerica (NA)' },
  { value: 'EUW', label: 'Europa Oeste (EUW)' },
  { value: 'EUNE', label: 'Europa Noreste (EUNE)' },
  { value: 'BR', label: 'Brasil (BR)' },
  { value: 'KR', label: 'Corea (KR)' },
  { value: 'JP', label: 'Japon (JP)' },
  { value: 'OCE', label: 'Oceania (OCE)' },
  { value: 'GLOBAL', label: 'Global / Internacional' }
];
const BRACKET_SLOT_PRESETS = ['4', '8', '16', '32', '64'];
const INTEGER_INPUT_REGEX = /^\d*$/;
const MONEY_INPUT_REGEX = /^\d*(?:[.,]\d{0,2})?$/;

const RIOT_TITLES = new Set([
  'Valorant',
  'League of Legends',
  'Wild Rift',
  'Teamfight Tactics',
  'Legends of Runeterra'
]);

const parseTeamSizeFromModality = (modality = '') => {
  const raw = String(modality || '').trim().toLowerCase();
  const match = raw.match(/^(\d+)\s*v\s*(\d+)$/i);
  if (!match) return 1;
  const left = Number.parseInt(match[1], 10);
  const right = Number.parseInt(match[2], 10);
  if (!Number.isFinite(left) || left <= 0) return 1;
  if (!Number.isFinite(right) || right <= 0) return left;
  return Math.max(left, right);
};

const normalizeFormatValue = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'single_elimination';
  if (['single_elimination', 'double_elimination', 'swiss', 'round_robin'].includes(raw)) return raw;
  if (raw.includes('doble')) return 'double_elimination';
  if (raw.includes('swiss') || raw.includes('suizo')) return 'swiss';
  if (raw.includes('round robin') || raw.includes('round_robin')) return 'round_robin';
  if (raw.includes('elim')) return 'single_elimination';
  return 'single_elimination';
};

const normalizePlatformValue = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'PC';
  if (raw === 'pc') return 'PC';
  if (raw === 'mobile') return 'Mobile';
  if (raw === 'console' || raw === 'consola') return 'Console';
  if (raw === 'crossplay') return 'Crossplay';
  return 'PC';
};

const parsePositiveInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const normalizeMoneyValue = (value) => {
  const raw = String(value ?? '').trim().replace(',', '.');
  if (!raw) return '';
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return '';
  return parsed.toString();
};

const resolveMaxSlotsSelection = (value = '') => {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  if (BRACKET_SLOT_PRESETS.includes(normalized)) return normalized;
  return 'custom';
};

const CreateTournament = () => {
  // --- 1. HOOKS (Navegación y Autenticación) ---
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // --- 2. ESTADOS (States) ---
  const [isPublished, setIsPublished] = useState(false);
  const [tournament, setTournament] = useState({
    title: '',
    description: '',
    game: '',
    gender: '',
    modality: '',
    date: '',
    time: '',
    prizePool: '',
    currency: 'USD',
    prizesByRank: { first: '', second: '', third: '' },
    entryFee: 'Gratis',
    maxSlots: '',
    format: 'single_elimination',
    server: '',
    platform: 'PC',
    bannerFile: null,
    rulesPdf: null,
    organizerName: user?.username || 'Organizador Oficial',
    sponsors: [{ name: '', link: '', tier: 'Partner', logoFile: null }],
    staff: { moderators: [''], casters: [''] },
    incentives: [] 
  });
  const [maxSlotsSelection, setMaxSlotsSelection] = useState('');
  const editTournament = location.state?.editTournament;
  const isEditMode = Boolean(editTournament?.tournamentId);
  const isRiotTournament = RIOT_TITLES.has(String(tournament.game || '').trim());
  const requiresFreeEntryMode = RIOT_REVIEW_MODE || isRiotTournament;
  const tournamentTeamSize = parseTeamSizeFromModality(tournament.modality);
  const participantCapacity = Math.max(0, Number(tournament.maxSlots) || 0) * Math.max(1, tournamentTeamSize);

  const handleGameChange = (gameValue) => {
    const nextGame = String(gameValue || '').trim();
    const nextIsRiot = RIOT_TITLES.has(nextGame);
    const nextRequiresFreeEntry = RIOT_REVIEW_MODE || nextIsRiot;
    setTournament((prev) => ({
      ...prev,
      game: nextGame,
      // En review mode de Riot (o juegos Riot), forzamos registro gratuito.
      entryFee: nextRequiresFreeEntry ? 'Gratis' : prev.entryFee
    }));
  };

  const handleMaxSlotsSelectionChange = (selectionValue) => {
    const normalizedSelection = String(selectionValue || '').trim();
    setMaxSlotsSelection(normalizedSelection);

    if (!normalizedSelection) {
      setTournament((prev) => ({ ...prev, maxSlots: '' }));
      return;
    }

    if (normalizedSelection === 'custom') {
      setTournament((prev) => ({
        ...prev,
        maxSlots: resolveMaxSlotsSelection(prev.maxSlots) === 'custom' ? prev.maxSlots : ''
      }));
      return;
    }

    setTournament((prev) => ({ ...prev, maxSlots: normalizedSelection }));
  };

  const handleCustomMaxSlotsChange = (rawValue) => {
    if (!INTEGER_INPUT_REGEX.test(rawValue)) return;
    setMaxSlotsSelection('custom');
    setTournament((prev) => ({ ...prev, maxSlots: rawValue }));
  };

  useEffect(() => {
    if (!isEditMode) return;
    const dateValue = editTournament?.dateRaw ? new Date(editTournament.dateRaw) : null;
    const dateIso = dateValue ? dateValue.toISOString().slice(0, 10) : '';
    const editMaxSlots = editTournament?.maxSlots ? String(editTournament.maxSlots) : '';
    setMaxSlotsSelection(resolveMaxSlotsSelection(editMaxSlots));

    setTournament((prev) => ({
      ...prev,
      title: editTournament.title || '',
      description: editTournament.desc || editTournament.description || '',
      game: editTournament.game || '',
      gender: editTournament.gender || '',
      modality: editTournament.modality || '',
      date: dateIso || '',
      time: editTournament.time || '',
      prizePool: editTournament.prize || editTournament.prizePool || '',
      currency: editTournament.currency || prev.currency,
      prizesByRank: editTournament.prizesByRank || prev.prizesByRank,
      entryFee: editTournament.entry || editTournament.entryFee || prev.entryFee,
      maxSlots: editMaxSlots || prev.maxSlots,
      format: normalizeFormatValue(editTournament.format || prev.format),
      server: editTournament.server || '',
      platform: normalizePlatformValue(editTournament.platform || prev.platform),
      organizerName: editTournament.organizer || prev.organizerName,
      sponsors: Array.isArray(editTournament.sponsors) && editTournament.sponsors.length
        ? editTournament.sponsors.map((s) => ({ name: s.name || '', link: s.link || '', tier: s.tier || 'Partner', logoFile: null }))
        : prev.sponsors,
      staff: editTournament.staff || prev.staff
    }));
  }, [isEditMode, editTournament]);

  useEffect(() => {
    if (!requiresFreeEntryMode) return;
    if (String(tournament.entryFee || '').trim().toLowerCase() === 'gratis') return;
    setTournament((prev) => ({ ...prev, entryFee: 'Gratis' }));
  }, [requiresFreeEntryMode, tournament.entryFee]);

  // --- 3. HANDLERS DE FORMULARIO Y ARCHIVOS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedTitle = String(tournament.title || '').trim();
    const normalizedDescription = String(tournament.description || '').trim();
    const normalizedGame = String(tournament.game || '').trim();
    const normalizedGender = String(tournament.gender || '').trim();
    const normalizedModality = String(tournament.modality || '').trim();
    const normalizedDate = String(tournament.date || '').trim();
    const normalizedTime = String(tournament.time || '').trim();
    const normalizedMaxSlots = parsePositiveInt(tournament.maxSlots, 0);
    const normalizedFormat = normalizeFormatValue(tournament.format);
    const normalizedServer = String(tournament.server || '').trim();
    const normalizedPlatform = normalizePlatformValue(tournament.platform);
    const normalizedCurrency = String(tournament.currency || 'USD').trim() || 'USD';
    const normalizedEntryFee = requiresFreeEntryMode
      ? 'Gratis'
      : (String(tournament.entryFee || '').trim() || 'Gratis');

    const normalizedPrizePool = normalizeMoneyValue(tournament.prizePool);
    const normalizedPrizesByRank = {
      first: normalizeMoneyValue(tournament.prizesByRank?.first),
      second: normalizeMoneyValue(tournament.prizesByRank?.second),
      third: normalizeMoneyValue(tournament.prizesByRank?.third)
    };

    if (!normalizedTitle || !normalizedDescription || !normalizedGame || !normalizedGender || !normalizedModality || !normalizedDate || !normalizedTime || !normalizedServer) {
      alert('Completa todos los campos obligatorios del torneo antes de continuar.');
      return;
    }

    if (normalizedMaxSlots < 2) {
      alert('El torneo debe tener al menos 2 cupos.');
      return;
    }

    const distributedPrizeTotal = [normalizedPrizesByRank.first, normalizedPrizesByRank.second, normalizedPrizesByRank.third]
      .reduce((acc, value) => acc + (Number(value) || 0), 0);
    if (normalizedPrizePool !== '' && distributedPrizeTotal > Number(normalizedPrizePool)) {
      alert('La suma de premios por ranking no puede superar el monto total del torneo.');
      return;
    }

    const normalizedParticipantCapacity = normalizedMaxSlots * Math.max(1, parseTeamSizeFromModality(normalizedModality));
    if (isRiotTournament && normalizedParticipantCapacity < RIOT_MIN_ACTIVE_PARTICIPANTS) {
      alert(`Torneos Riot requieren capacidad mínima para ${RIOT_MIN_ACTIVE_PARTICIPANTS} participantes activos. Ajusta modalidad o cupos.`);
      return;
    }
    
    // Preparar FormData para Multer
    const data = new FormData();

    // Campos básicos
    data.append('title', normalizedTitle);
    data.append('description', normalizedDescription);
    data.append('game', normalizedGame);
    data.append('modality', normalizedModality);
    data.append('date', normalizedDate);
    data.append('time', normalizedTime);
    data.append('prizePool', normalizedPrizePool);
    data.append('currency', normalizedCurrency);
    data.append('entryFee', normalizedEntryFee);
    data.append('maxSlots', String(normalizedMaxSlots));
    data.append('format', normalizedFormat);
    data.append('server', normalizedServer);
    data.append('platform', normalizedPlatform);
    data.append('gender', normalizedGender);

    // Objetos complejos (se envían como JSON string para parsear en el backend)
    data.append('prizesByRank', JSON.stringify(normalizedPrizesByRank));
    data.append('staff', JSON.stringify(tournament.staff));

    const sponsorsPayload = [];
    let logoIndex = 0;
    tournament.sponsors.forEach((s) => {
        const payload = {
          name: String(s.name || '').trim(),
          link: String(s.link || '').trim(),
          tier: String(s.tier || 'Partner').trim() || 'Partner'
        };
        if (s.logoFile) {
            payload.logoIndex = logoIndex;
            data.append('sponsorLogos', s.logoFile);
            logoIndex += 1;
        }
        sponsorsPayload.push(payload);
    });
    data.append('sponsors', JSON.stringify(sponsorsPayload));

    // Archivos principales
    if (tournament.bannerFile) data.append('bannerFile', tournament.bannerFile);
    if (tournament.rulesPdf) data.append('rulesPdf', tournament.rulesPdf);

    // Archivos de Sponsors (Logos individuales)
    // sponsorLogos ya agregados en el bloque de sponsors

    try {
        const url = isEditMode
          ? `${API_URL}/api/tournaments/${editTournament.tournamentId}`
          : `${API_URL}/api/tournaments`;
        const method = isEditMode ? 'put' : 'post';

        await axios({
            url,
            method,
            data,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        setIsPublished(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        console.error("Error al publicar:", err.response?.data || err.message);
        alert("Hubo un error al publicar el torneo. Revisa la consola.");
    }
  };

  const handleFileChange = (e, field, index = null) => {
    const file = e.target.files[0];
    if (index !== null) {
      const newSponsors = [...tournament.sponsors];
      newSponsors[index].logoFile = file;
      setTournament({ ...tournament, sponsors: newSponsors });
    } else {
      setTournament({ ...tournament, [field]: file });
    }
  };

  // --- 4. FUNCIONES DE GESTIÓN (Añadir/Eliminar/Actualizar) ---
  const addSponsor = () => setTournament({ 
    ...tournament, 
    sponsors: [...tournament.sponsors, { name: '', link: '', tier: 'Partner', logoFile: null }] 
  });

  const addStaffField = (type) => setTournament({ 
    ...tournament, 
    staff: { ...tournament.staff, [type]: [...tournament.staff[type], ''] } 
  });

  const addIncentive = () => {
    setTournament({
      ...tournament,
      incentives: [...(tournament.incentives || []), { title: '', prize: '' }]
    });
  };

  const goToDashboard = () => {
    try {
      navigate('/dashboard', { replace: true });
    } finally {
      // Fallback duro por si el router no navega por algún motivo
      setTimeout(() => {
        if (window.location.pathname !== '/dashboard') {
          window.location.assign('/dashboard');
        }
      }, 0);
    }
  };

  const updateIncentive = (index, field, value) => {
    const newIncentives = [...tournament.incentives];
    newIncentives[index][field] = value;
    setTournament({ ...tournament, incentives: newIncentives });
  };

  const removeIncentive = (index) => {
    const newIncentives = tournament.incentives.filter((_, i) => i !== index);
    setTournament({ ...tournament, incentives: newIncentives });
  };


  return (
    <div className="profile-page">
    {!isPublished ? (        
        <form className="create-tournament-form" onSubmit={handleSubmit}>
          <header className="form-header-premium">
            <h1>{isEditMode ? 'Editar' : 'Configurar'} <span className="highlight">Torneo Profesional</span></h1>
            <p>Panel de Administración de: <strong>{tournament.organizerName}</strong></p>
          </header>

          <div className="profile-grid">
            
            {/* 1. IDENTIDAD Y REGLAS */}
            <div className="profile-card full-span-card">
  <div className="card-title"><FaAward /> <h3>Información General</h3></div>
  
  <div className="input-row-group">
    <div className="form-column">
      <div className="custom-input-box">
        <label>Título del Torneo</label>
        <input 
            type="text" 
            placeholder="Nombre oficial del evento" 
            required 
            value={tournament.title}
            onChange={(e) => setTournament({...tournament, title: e.target.value})}
        />
      </div>
    </div>
    <div className="form-column">
  <div className="custom-input-box">
    <label>Seleccionar Juego</label>
    <select 
      required 
      value={tournament.game}
      onChange={(e) => handleGameChange(e.target.value)}
    >
      <option value="">-- Elige un juego --</option>
      {/* Generamos las opciones dinámicamente desde GAME_CONFIG */}
      {Object.keys(GAME_CONFIG).map((game) => (
        game !== "All" && (
          <option key={game} value={game}>
            {game}
          </option>
        )
      ))}
    </select>
    <p className="file-help-text">
      <FaGamepad /> 
      {tournament.game ? `Compitiendo en ${tournament.game}` : "Título competitivo"}
    </p>
  </div>
</div>

  </div>

  <div className="input-row-group" style={{marginTop: '20px'}}>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Plataforma</label>
        <select
          required
          value={tournament.platform}
          onChange={(e) => setTournament({ ...tournament, platform: normalizePlatformValue(e.target.value) })}
        >
          {PLATFORM_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <p className="file-help-text"><FaServer /> Hardware requerido</p>
      </div>
    </div>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Región / Servidor</label>
        <select
          required
          value={tournament.server}
          onChange={(e) => setTournament({ ...tournament, server: e.target.value })}
        >
          <option value="">Seleccionar región</option>
          {tournament.server && !REGION_OPTIONS.some((option) => option.value === tournament.server) && (
            <option value={tournament.server}>{tournament.server}</option>
          )}
          {REGION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <p className="file-help-text"><FaServer /> Ubicación del servidor</p>
      </div>
    </div>
  </div>

  <div className="input-row-group" style={{marginTop: '20px'}}>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Descripción Breve</label>
        <textarea 
            required
            placeholder="Resumen rápido del torneo..." 
            rows="5"
            value={tournament.description}
            onChange={(e) => setTournament({...tournament, description: e.target.value})}
        ></textarea>
      </div>
    </div>

    <div className="form-column">
      <div className="custom-input-box">
        <label>Subir Banner del Torneo</label>
        <div className="file-upload-wrapper">
          <input type="file" id="banner" accept="image/*" onChange={(e) => handleFileChange(e, 'bannerFile')} />
          <label htmlFor="banner" className={`file-label ${tournament.bannerFile ? 'active-file' : ''}`}>
             {tournament.bannerFile ? tournament.bannerFile.name : 'ELEGIR ARCHIVO'}
          </label>
        </div>
        <p className="file-help-text"><FaFileUpload /> Seleccionar Imagen</p>
      </div>
      <div className="custom-input-box" style={{marginTop: '15px'}}>
        <label>Reglamento Oficial (PDF)</label>
        <div className="file-upload-wrapper pdf-style">
          <input type="file" id="rules" accept=".pdf" onChange={(e) => handleFileChange(e, 'rulesPdf')} />
          <label htmlFor="rules" className={`file-label ${tournament.rulesPdf ? 'active-file' : ''}`}>
             {tournament.rulesPdf ? tournament.rulesPdf.name : 'ELEGIR ARCHIVO'}
          </label>
        </div>
        <p className="file-help-text"><FaFilePdf /> Subir Normas en PDF</p>
      </div>
    </div>
  </div>
</div>

            {/* 2. FORMATO Y CUPOS */}
<div className="profile-card full-span-card" style={{ marginTop: '20px' }}>
  <div className="card-title"><FaSitemap /> <h3>Formato y Cupos</h3></div>

  <div className="input-row-group">
    <div className="form-column">
      <div className="custom-input-box">
        <label>Cupos Máximos</label>
        <select
          required
          value={maxSlotsSelection}
          onChange={(e) => handleMaxSlotsSelectionChange(e.target.value)}
        >
          <option value="">Seleccionar cupos</option>
          {BRACKET_SLOT_PRESETS.map((presetValue) => (
            <option key={presetValue} value={presetValue}>{presetValue} equipos</option>
          ))}
          <option value="custom">Personalizado</option>
        </select>
        {maxSlotsSelection === 'custom' && (
          <input
            type="number"
            placeholder="Escribe la cantidad"
            min="2"
            step="1"
            required
            value={tournament.maxSlots}
            onChange={(e) => handleCustomMaxSlotsChange(e.target.value)}
          />
        )}
        <p className="file-help-text"><FaUsers /> Capacidad total de equipos</p>
        {isRiotTournament && participantCapacity > 0 && participantCapacity < RIOT_MIN_ACTIVE_PARTICIPANTS && (
          <p className="file-help-text" style={{ color: '#f39c12' }}>
            Capacidad actual: {participantCapacity} participantes. Para Riot necesitas mínimo {RIOT_MIN_ACTIVE_PARTICIPANTS}.
          </p>
        )}
      </div>

      <div className="custom-input-box">
        <label>Categoría de Género</label>
        <select 
          required 
          value={tournament.gender}
          onChange={(e) => setTournament({...tournament, gender: e.target.value})}
        >
          <option value="">Seleccionar</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
          <option value="Mixto">Mixto</option>
        </select>
        <p className="file-help-text"><FaUsers /> Restricción de participantes</p>
      </div>

      <div className="custom-input-box">
        <label>Tamaño del Equipo</label>
        <select required value={tournament.modality} onChange={(e) => setTournament({...tournament, modality: e.target.value})}>
          <option value="">Seleccionar</option>
          <option value="1v1">1v1 (Solo)</option>
          <option value="2v2">2v2 (Duos)</option>
          <option value="4v4">4v4 (Squad)</option>
          <option value="5v5">5v5 (Full Team)</option>
        </select>
        <p className="file-help-text"><FaUsers /> Jugadores por escuadra</p>
      </div>
    </div>

    <div className="form-column">
      <div className="custom-input-box">
        <label>Tipo de Registro</label>
        <select
          value={tournament.entryFee}
          onChange={(e) => setTournament({...tournament, entryFee: e.target.value})}
        >
          <option value="Gratis">Abierto (Todo público)</option>
          <option value="Invitación" disabled={requiresFreeEntryMode}>Por Invitación</option>
          <option value="Password" disabled={requiresFreeEntryMode}>Con Contraseña</option>
          <option value="Pago" disabled={requiresFreeEntryMode}>Premium / Pago</option>
        </select>
        <p className="file-help-text"><FaTicketAlt /> Método de inscripción</p>
        {requiresFreeEntryMode && (
          <p className="file-help-text" style={{ color: '#f39c12' }}>
            {RIOT_REVIEW_MODE
              ? 'RIOT_REVIEW_MODE activo: solo se permite registro gratuito para el prototipo.'
              : 'Torneos Riot: solo registro gratuito para cumplir políticas del Developer Portal.'}
          </p>
        )}
      </div>

      <div className="custom-input-box">
        <label>Fecha y Hora de Inicio</label>
        <div style={{display: 'flex', gap: '10px'}}>
             <input type="date" required min={new Date().toISOString().split('T')[0]} value={tournament.date} onChange={(e) => setTournament({...tournament, date: e.target.value})} />
            <input type="time" required value={tournament.time} onChange={(e) => setTournament({...tournament, time: e.target.value})} />
        </div>
      </div>
    </div>
  </div>

  <div className="input-row-group" style={{ marginTop: '20px' }}>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Formato de Eliminación</label>
        <select value={tournament.format} onChange={(e) => setTournament({...tournament, format: e.target.value})}>
          {FORMAT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <p className="file-help-text"><FaSitemap /> Estructura de las llaves</p>
      </div>
    </div>
  </div>
</div>

            {/* 3. MARCAS */}
            <div className="profile-card">
  <div className="card-title">
    <h3>Marcas / Sponsors</h3> 
    <button type="button" className="add-btn-circle" onClick={addSponsor}><FaPlus /></button>
  </div>
  
  <div className="sponsors-list">
    {tournament.sponsors.map((s, i) => (
      <div key={i} className="sponsor-upload-row-premium">
        <input 
          type="text" 
          placeholder="Nombre Marca" 
          className="mini-input"
          value={s.name || ''}
          onChange={(e) => {
            const newSponsors = [...tournament.sponsors];
            newSponsors[i].name = e.target.value;
            setTournament({ ...tournament, sponsors: newSponsors });
          }}
        />

        <input 
          type="url" 
          placeholder="Link Web" 
          className="mini-input"
          value={s.link || ''}
          onChange={(e) => {
            const newSponsors = [...tournament.sponsors];
            newSponsors[i].link = e.target.value;
            setTournament({ ...tournament, sponsors: newSponsors });
          }}
        />

        <select 
          className="mini-select"
          value={s.tier || 'Partner'}
          onChange={(e) => {
            const newSponsors = [...tournament.sponsors];
            newSponsors[i].tier = e.target.value;
            setTournament({ ...tournament, sponsors: newSponsors });
          }}
        >
          <option value="Principal">Principal</option>
          <option value="Partner">Partner</option>
          <option value="Colaborador">Colaborador</option>
        </select>

        <div className="file-upload-wrapper small">
            <input 
              type="file" 
              id={`logo-${i}`} 
              hidden 
              onChange={(e) => handleFileChange(e, 'logoFile', i)} 
            />
            <label htmlFor={`logo-${i}`} className={`file-label-small ${s.logoFile ? 'active' : ''}`}>
                {s.logoFile ? <FaCheck /> : <FaFileUpload />}
            </label>
        </div>

        <button 
          type="button" 
          className="btn-del-mini"
          onClick={() => {
            const newSponsors = tournament.sponsors.filter((_, index) => index !== i);
            setTournament({ ...tournament, sponsors: newSponsors });
          }}
        >
          <FaTrash />
        </button>
      </div>
    ))}
  </div>
</div>

            {/* 4. PREMIOS */}
            <div className="profile-card full-span-card premium-prize-card">
  <div className="card-title">
    <div className="title-with-icon">
      <FaTicketAlt className="title-icon-gold" />
      <h3>Premios Desglosados</h3>
    </div>
    <div className="prize-pool-badge">
        Prize Pool: <span>{tournament.prizePool || '0.00'}</span>
    </div>
  </div>

  <div className="input-row-group" style={{ marginBottom: '25px' }}>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Monto Total del Torneo</label>
        <input 
          type="number"
          min="0" 
          placeholder="Ej: 1000" 
          value={tournament.prizePool}
          onChange={(e) => {
            const nextValue = e.target.value;
            if (MONEY_INPUT_REGEX.test(nextValue)) {
              setTournament({ ...tournament, prizePool: nextValue.replace(',', '.') });
            }
          }}
        />
      </div>
    </div>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Divisa / Moneda</label>
        <select 
          value={tournament.currency}
          onChange={(e) => setTournament({...tournament, currency: e.target.value})}
        >
          <option value="DO">DO - Peso Dominicano</option>
          <option value="USD">USD - Dólares</option>
          <option value="EUR">EUR - Euros</option>
        </select>
      </div>
    </div>
  </div>

  <div className="prize-distribution-grid">
    <div className="prize-item gold">
      <label>🥇 1er Lugar</label>
      <input 
        type="number"
        min="0"
        placeholder="Monto" 
        value={tournament.prizesByRank.first}
        onChange={(e) => {
          const nextValue = e.target.value;
          if (MONEY_INPUT_REGEX.test(nextValue)) {
            setTournament({
              ...tournament, 
              prizesByRank: { ...tournament.prizesByRank, first: nextValue.replace(',', '.') }
            });
          }
        }}
      />
    </div>
    <div className="prize-item silver">
      <label>🥈 2do Lugar</label>
      <input 
        type="number"
        min="0"
        placeholder="Monto" 
        value={tournament.prizesByRank.second}
        onChange={(e) => {
          const nextValue = e.target.value;
          if (MONEY_INPUT_REGEX.test(nextValue)) {
            setTournament({
              ...tournament, 
              prizesByRank: { ...tournament.prizesByRank, second: nextValue.replace(',', '.') }
            });
          }
        }}
      />
    </div>
    <div className="prize-item bronze">
      <label>🥉 3er Lugar</label>
      <input 
        type="number"
        min="0"
        placeholder="Monto" 
        value={tournament.prizesByRank.third}
        onChange={(e) => {
          const nextValue = e.target.value;
          if (MONEY_INPUT_REGEX.test(nextValue)) {
            setTournament({
              ...tournament, 
              prizesByRank: { ...tournament.prizesByRank, third: nextValue.replace(',', '.') }
            });
          }
        }}
      />
    </div>
  </div>  
</div>
</div>

         <div className="submit-container">
          {isEditMode && (
            <button type="button" className="btn-success-outline" onClick={() => navigate('/tournaments')}>
              Cancelar edición
            </button>
          )}
          <button type="submit" className="btn-main-publish">
            {isEditMode ? ' GUARDAR CAMBIOS' : ' PUBLICAR TORNEO'}
          </button>
        </div>
      </form>
    ) : (
      <div className="success-overlay animate-in">
    <div className="success-glass-card">
      <div className="success-check-wrapper">
        <FaCheckCircle className="success-pulse-icon" />
      </div>
      
      <h2 className="success-title">{isEditMode ? '¡Torneo Actualizado!' : '¡Torneo Registrado!'}</h2>
      <p className="success-text">
        El torneo <span className="highlight-text">"{tournament.title}"</span> {isEditMode ? 'ha sido actualizado con éxito.' : 'ha sido publicado con éxito.'}
      </p>

      <div className="success-button-group">
        {!isEditMode && (
          <button className="btn-success-outline" onClick={() => setIsPublished(false)}>
            <FaPlus /> Crear otro torneo
          </button>
        )}
        {isEditMode && (
          <button className="btn-success-outline" onClick={() => navigate('/tournaments')}>
            <FaPlus /> Volver a torneos
          </button>
        )}
        <button type="button" className="btn-success-solid" onClick={goToDashboard}>
          <FaSitemap /> Ir al Dashboard
        </button>
      </div>
        </div>
      </div>
    )}
  </div>
);
};

export default CreateTournament;
