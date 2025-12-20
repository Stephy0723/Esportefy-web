import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './TeamRegistration.css';

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
    // Aquí está el truco: Si incoming.image es null/undefined/vacío, usa DEFAULT_IMAGE
    image: incomingTournament?.image ? incomingTournament.image : DEFAULT_IMAGE
  };

  const handleRegister = (e) => {
    e.preventDefault();
    alert("¡Equipo Registrado! GL HF.");
    navigate('/tournaments');
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
                            <input type="text" required placeholder=" " />
                            <label>Nombre del Equipo</label>
                            <span className="bar"></span>
                        </div>

                        <div className="neon-input-group">
                            <input type="text" required placeholder=" " />
                            <label>Logo URL (Opcional)</label>
                            <span className="bar"></span>
                        </div>

                        <h3 className="roster-title">Alineación (Roster)</h3>
                        
                        <div className="roster-grid">
                            <div className="neon-input-group compact">
                                <input type="text" defaultValue="GamerPro_99" readOnly />
                                <label className="fixed-label">Capitán</label>
                            </div>
                            <div className="neon-input-group compact">
                                <input type="text" required placeholder=" " />
                                <label>Jugador 2</label>
                                <span className="bar"></span>
                            </div>
                            <div className="neon-input-group compact">
                                <input type="text" required placeholder=" " />
                                <label>Jugador 3</label>
                                <span className="bar"></span>
                            </div>
                            <div className="neon-input-group compact">
                                <input type="text" required placeholder=" " />
                                <label>Jugador 4</label>
                                <span className="bar"></span>
                            </div>
                            <div className="neon-input-group compact">
                                <input type="text" required placeholder=" " />
                                <label>Jugador 5</label>
                                <span className="bar"></span>
                            </div>
                            <div className="neon-input-group compact">
                                <input type="text" placeholder=" " />
                                <label>Suplente</label>
                                <span className="bar"></span>
                            </div>
                        </div>

                        <div className="actions">
                            <button type="button" className="btn-cancel" onClick={() => navigate('/tournaments')}>Cancelar</button>
                            <button type="submit" className="btn-confirm">Confirmar Registro</button>
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