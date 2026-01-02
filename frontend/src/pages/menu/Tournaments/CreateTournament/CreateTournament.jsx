import React from 'react';
import Navbar from '../../../../components/Navbar/Navbar';
import Sidebar from '../../../../components/Sidebar/Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import './CreateTournament.css';

const TeamRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tournament = location.state?.tournament || { title: "Torneo", image: "https://c4.wallpaperflare.com/wallpaper/258/669/893/video-games-artwork-digital-art-league-of-legends-wallpaper-preview.jpg" };

  const handleRegister = (e) => {
    e.preventDefault();
    alert("¡Equipo Registrado! GL HF.");
    navigate('/tournaments');
  };

  return (
    <div className="reg-page">
      <Sidebar />
      <div className="main-content-wrapper">
        <Navbar />
        
        <div className="split-layout">
            
            {/* LADO IZQUIERDO: FORMULARIO */}
            <div className="form-side">
                <div className="form-header">
                    <span className="step-badge">FASE DE REGISTRO</span>
                    <h1>Inscribirse en <span className="highlight">{tournament.title}</span></h1>
                    <p>Completa los datos de tu escuadra para competir.</p>
                </div>

                <form className="gamer-form" onSubmit={handleRegister}>
                    <div className="input-group">
                        <input type="text" required placeholder=" " />
                        <label>Nombre del Equipo</label>
                    </div>

                    <div className="input-group">
                        <input type="text" required placeholder=" " />
                        <label>Logo URL (Opcional)</label>
                    </div>

                    <h3 className="section-title">Alineación (Roster)</h3>
                    
                    <div className="grid-inputs">
                        <div className="input-group">
                            <input type="text" defaultValue="GamerPro_99 (Tú)" readOnly className="read-only" />
                            <label>Capitán</label>
                        </div>
                        <div className="input-group">
                            <input type="text" required placeholder=" " />
                            <label>Jugador 2 (ID)</label>
                        </div>
                        <div className="input-group">
                            <input type="text" required placeholder=" " />
                            <label>Jugador 3 (ID)</label>
                        </div>
                        <div className="input-group">
                            <input type="text" required placeholder=" " />
                            <label>Jugador 4 (ID)</label>
                        </div>
                        <div className="input-group">
                            <input type="text" required placeholder=" " />
                            <label>Jugador 5 (ID)</label>
                        </div>
                        <div className="input-group">
                            <input type="text" placeholder=" " />
                            <label>Suplente</label>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-ghost" onClick={() => navigate('/tournaments')}>Cancelar</button>
                        <button type="submit" className="btn-neon">Confirmar Registro</button>
                    </div>
                </form>
            </div>

            {/* LADO DERECHO: VISUAL CON MOVIMIENTO */}
            <div className="visual-side">
                <div className="image-overlay"></div>
                {/* Usamos la imagen del torneo o una por defecto */}
                <img src={tournament.image || "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt55979c3b06db2369/63d8650e75a31a57c4df974e/VALORANT_Jett_1920x1080.jpg"} alt="Visual" className="moving-bg" />
                
                <div className="visual-content">
                    <h2>Domina la Arena</h2>
                    <p>La victoria está reservada para aquellos que se atreven.</p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default TeamRegistration;