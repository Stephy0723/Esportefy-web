import React from 'react';
import Navbar from '../../../../components/Navbar/Navbar';
import Sidebar from '../../../../components/Sidebar/Sidebar';
import { useNavigate } from 'react-router-dom';
import './OrganizerApplication.css';

const OrganizerApplication = () => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Solicitud enviada.");
    navigate('/tournaments');
  };

  return (
    <div className="reg-page">
      <Sidebar />
      <div className="main-content-wrapper">
        <Navbar />
        
        <div className="split-layout">
            
            <div className="form-side">
                <div className="form-header">
                    <span className="step-badge" style={{color: '#00ff88', borderColor: '#00ff88'}}>VERIFICACIÓN</span>
                    <h1>Solicitud de <span className="highlight" style={{color: '#00ff88'}}>Organizador</span></h1>
                    <p>Valida tu identidad para crear eventos oficiales.</p>
                </div>

                <form className="gamer-form" onSubmit={handleSubmit}>
                    <div className="grid-inputs">
                        <div className="input-group">
                            <input type="text" required placeholder=" " />
                            <label>Nombre Legal</label>
                        </div>
                        <div className="input-group">
                            <input type="text" required placeholder=" " />
                            <label>DNI / Pasaporte</label>
                        </div>
                    </div>

                    <div className="input-group">
                        <input type="text" required placeholder=" " />
                        <label>Nombre de Organización / Marca</label>
                    </div>

                    <div className="input-group">
                        <input type="url" placeholder=" " />
                        <label>Link a Portafolio / Web</label>
                    </div>

                    <div className="input-group">
                        <input type="text" required placeholder=" " />
                        <label>Redes Sociales (IG, Twitter, LinkedIn)</label>
                    </div>

                    <div className="input-group">
                        <input type="text" required placeholder=" " style={{borderBottomStyle: 'dashed'}} />
                        <label>Experiencia Previa (Resumen)</label>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-ghost" onClick={() => navigate('/tournaments')}>Volver</button>
                        <button type="submit" className="btn-neon" style={{background: '#00ff88', color:'#000'}}>Enviar Solicitud</button>
                    </div>
                </form>
            </div>

            <div className="visual-side" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 15% 100%)'}}>
                <div className="image-overlay" style={{background: 'linear-gradient(to right, #0a0a0a 0%, rgba(0, 255, 136, 0.1) 100%)'}}></div>
                <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop" alt="Setup" className="moving-bg" />
                
                <div className="visual-content">
                    <h2 style={{color: '#00ff88'}}>Lidera el Juego</h2>
                    <p>Crea experiencias inolvidables para la comunidad.</p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default OrganizerApplication;