import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './TeamRegistration.css';
import axios from 'axios';

const TeamRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL de imagen Genérica de Alta Calidad (Cyberpunk/Esports Arena)
  const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop";

  // LÓGICA BLINDADA:
  // 1. Intentamos leer del estado.
  // 2. Si existe el estado pero NO tiene imagen, usamos la DEFAULT.
  // 3. Si no existe el estado, usamos todo DEFAULT.
  const incomingTournament = location.state?.tournament;
  
  const tournament = {
    title: incomingTournament?.title || "Torneo Global",
    // Aquí está el truco: Si no hay banner, usa DEFAULT_IMAGE
    image: incomingTournament?.bannerImage || incomingTournament?.image || DEFAULT_IMAGE,
    tournamentId: incomingTournament?.tournamentId || ''
  };

  const [teamName, setTeamName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [starters, setStarters] = useState(['', '', '', '', '']);
  const [sub, setSub] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateStarter = (index, value) => {
    setStarters((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!tournament.tournamentId) {
      alert('No se pudo identificar el torneo.');
      return;
    }
    if (!teamName.trim()) {
      alert('Nombre de equipo requerido.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes iniciar sesión.');
      return;
    }
    try {
      setSubmitting(true);
      await axios.post(
        `http://localhost:4000/api/tournaments/${tournament.tournamentId}/register`,
        {
          teamName: teamName.trim(),
          logoUrl: logoUrl.trim(),
          roster: {
            starters: starters.map(s => s.trim()).filter(Boolean),
            subs: sub ? [sub.trim()] : []
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("¡Equipo Registrado! GL HF.");
      navigate('/tournaments');
    } catch (err) {
      const msg = err.response?.data?.message || 'No se pudo registrar el equipo';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Función de respaldo por si la URL falla al cargar (404, bloqueo, etc)
  const handleImageError = (e) => {
    e.target.src = "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop"; // Imagen de backup (Gaming Setup)
  };

  return (
    <div className="registration-content">
       
        <div className="center-stage">
            
            <div className="glass-card">
                
                {/* IZQUIERDA: FORMULARIO */}
                <div className="form-section">
                    <div className="header-box">
                        <span className="step-tag">FASE 1</span>
                        <h1>Registro <span className="highlight">{tournament.title}</span></h1>
                        <p>Prepara a tu escuadra para la gloria.</p>
                    </div>

                    <form onSubmit={handleRegister}>
                        <div className="neon-input-group">
                            <input type="text" required placeholder=" " value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                            <label>Nombre del Equipo</label>
                            <span className="bar"></span>
                        </div>

                        <div className="neon-input-group">
                            <input type="text" placeholder=" " value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
                            <label>Logo URL (Opcional)</label>
                            <span className="bar"></span>
                        </div>

                        <h3 className="roster-title">Alineación (Roster)</h3>
                        
                        <div className="roster-grid">
                            <div className="neon-input-group compact">
                                <input type="text" placeholder=" " value={starters[0]} onChange={(e) => updateStarter(0, e.target.value)} />
                                <label className="fixed-label">Capitán</label>
                            </div>
                            <div className="neon-input-group compact">
                                <input type="text" placeholder=" " value={starters[1]} onChange={(e) => updateStarter(1, e.target.value)} />
                                <label>Jugador 2</label>
                                <span className="bar"></span>
                            </div>
                            <div className="neon-input-group compact">
                                <input type="text" placeholder=" " value={starters[2]} onChange={(e) => updateStarter(2, e.target.value)} />
                                <label>Jugador 3</label>
                                <span className="bar"></span>
                            </div>
                            <div className="neon-input-group compact">
                                <input type="text" placeholder=" " value={starters[3]} onChange={(e) => updateStarter(3, e.target.value)} />
                                <label>Jugador 4</label>
                                <span className="bar"></span>
                            </div>
                            <div className="neon-input-group compact">
                                <input type="text" placeholder=" " value={starters[4]} onChange={(e) => updateStarter(4, e.target.value)} />
                                <label>Jugador 5</label>
                                <span className="bar"></span>
                            </div>
                            <div className="neon-input-group compact">
                                <input type="text" placeholder=" " value={sub} onChange={(e) => setSub(e.target.value)} />
                                <label>Suplente</label>
                                <span className="bar"></span>
                            </div>
                        </div>

                        <div className="actions">
                            <button type="button" className="btn-cancel" onClick={() => navigate('/tournaments')}>Cancelar</button>
                            <button type="submit" className="btn-confirm" disabled={submitting}>
                              {submitting ? 'Registrando...' : 'Confirmar Registro'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* DERECHA: IMAGEN */}
                <div className="image-section">
                    <div className="overlay-gradient"></div>
                    {/* AÑADIDO: onError para manejar fallos de carga */}
                    <img 
                        src={tournament.image} 
                        alt="Game Art" 
                        className="cinematic-bg"
                        onError={handleImageError} 
                    />
                    <div className="image-text">
                        <h2>Domina el Juego</h2>
                        <p>La competencia empieza aquí.</p>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default TeamRegistration;
