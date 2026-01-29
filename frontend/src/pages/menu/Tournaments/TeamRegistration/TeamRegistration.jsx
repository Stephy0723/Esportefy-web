import React, { useEffect, useState } from 'react';
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
  const [submitting, setSubmitting] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoadingTeams(true);
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('esportefyUser');
        const user = storedUser ? JSON.parse(storedUser) : null;
        const response = await axios.get('http://localhost:4000/api/teams', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const allTeams = response.data || [];
        const mine = user?._id
          ? allTeams.filter(t => String(t.captain?._id || t.captain) === String(user._id))
          : allTeams;
        setUserTeams(mine);
      } catch (err) {
        console.error('Error cargando equipos:', err);
      } finally {
        setLoadingTeams(false);
      }
    };
    loadTeams();
  }, []);

  useEffect(() => {
    const team = userTeams.find(t => String(t._id) === String(selectedTeamId));
    if (!team) return;
    setTeamName(team.name || '');
    setLogoUrl(team.logo || '');
  }, [selectedTeamId, userTeams]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!tournament.tournamentId) {
      alert('No se pudo identificar el torneo.');
      return;
    }
    if (!selectedTeamId) {
      alert('Selecciona un equipo.');
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
          teamId: selectedTeamId
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
                            <select
                              className="select-modern"
                              value={selectedTeamId}
                              onChange={(e) => setSelectedTeamId(e.target.value)}
                              disabled={loadingTeams}
                              required
                            >
                              <option value="">Selecciona tu equipo</option>
                              {userTeams.map(team => (
                                <option key={team._id} value={team._id}>{team.name}</option>
                              ))}
                            </select>
                            <label>Equipo</label>
                            
                            <span className="bar"></span>
                        </div>
                        {(!loadingTeams && userTeams.length === 0) && (
                          <div className="neon-input-group">
                            <button type="button" className="btn-confirm" onClick={() => navigate('/create-team')}>
                              Crear equipo
                            </button>
                          </div>
                        )}

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
