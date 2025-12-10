import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../../../components/Navbar/Navbar';
import Sidebar from '../../../../components/Sidebar/Sidebar';
import './TeamRegistration.css';

const TeamRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ESTADO PARA EL SIDEBAR (Vital para que el botón funcione)
  const [isSidebarClosed, setIsSidebarClosed] = useState(true);
  
  // Cálculo del margen: Si está cerrado 88px, si está abierto 250px
  const sidebarWidth = isSidebarClosed ? '88px' : '250px';

  const tournament = location.state?.tournament || { 
    title: "Torneo", 
    image: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt55979c3b06db2369/63d8650e75a31a57c4df974e/VALORANT_Jett_1920x1080.jpg" 
  };

  const handleRegister = (e) => {
    e.preventDefault();
    alert("¡Equipo Registrado! GL HF.");
    navigate('/tournaments');
  };

  return (
    <div className="reg-page-wrapper">
      {/* Pasamos los estados al Sidebar para que el botón funcione */}
      <Sidebar isClosed={isSidebarClosed} setIsClosed={setIsSidebarClosed} />
      
      <div 
        className="main-content-area"
        style={{ 
            marginLeft: sidebarWidth, 
            width: `calc(100% - ${sidebarWidth})`
        }}
      >
        <Navbar />
        
        {/* CONTENEDOR CENTRALIZADO */}
        <div className="center-stage">
            
            {/* LA TARJETA FLOTANTE DE CRISTAL */}
            <div className="glass-card">
                
                {/* IZQUIERDA: FORMULARIO */}
                <div className="form-section">
                    <div className="header-box">
                        <span className="step-tag">FASE 1</span>
                        <h1>Registro <span className="highlight">{tournament.title}</span></h1>
                        <p>Prepara a tu escuadra para la gloria.</p>
                    </div>

                    <form onSubmit={handleRegister}>
                        {/* Input Estilo Línea Neon */}
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

                {/* DERECHA: IMAGEN CINEMÁTICA */}
                <div className="image-section">
                    <div className="overlay-gradient"></div>
                    <img src={tournament.image} alt="Game Art" className="cinematic-bg" />
                    <div className="image-text">
                        <h2>Domina el Juego</h2>
                        <p>La competencia empieza aquí.</p>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default TeamRegistration;