import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaTrophy } from 'react-icons/fa';
import '../Community.css';

const OrganizerPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const organizers = {
        "lpg": { name: "Liga Pro Gaming", role: "Torneos Elite", img: "https://colorlib.com/wp/wp-content/uploads/sites/2/esports-logo-templates.jpg" },
        "latam": { name: "Torneos Latam", role: "Comunidad", img: "https://marketplace.canva.com/EAFJz3t3bmg/1/0/1600w/canva-black-and-red-modern-esports-tournament-twitch-banner-147-1Q5z4z8.jpg" },
        "esl": { name: "ESL Pro", role: "Oficial", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/ESL_logo.svg/1200px-ESL_logo.svg.png" }
    };

    const org = organizers[id] || { name: "Organizador", role: "", img: "" };

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-container">
                <button className="btn-back" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Volver
                </button>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: '20px',
                    background: 'var(--bg-card)', padding: '30px', borderRadius: '16px',
                    border: '1px solid var(--border-color)', marginBottom: '30px'
                }}>
                    <img src={org.img} alt="Org" style={{width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover'}} />
                    <div>
                        <h1 style={{margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)'}}>
                            {org.name} <FaCheckCircle style={{color: '#3b82f6', fontSize:'1.5rem'}}/>
                        </h1>
                        <p style={{color: 'var(--text-muted)'}}>{org.role} - Organizador Verificado</p>
                    </div>
                    <button className="btn-join-mini" style={{padding: '10px 30px', marginLeft: 'auto'}}>Seguir</button>
                </div>

                <div className="tournaments-list">
                    <div className="section-title"><h3><FaTrophy /> Torneos Activos</h3></div>
                    <div className="post-card">
                        <div className="post-header">
                            <h4 style={{color: 'var(--text-main)'}}>Copa de Invierno 2024</h4>
                            <span className="game-badge" style={{position:'static', marginLeft:'10px'}}>Inscripciones</span>
                        </div>
                        <p className="post-text">Compite por un premio de $500 USD. Modalidad 5v5.</p>
                        <button className="btn-create-community" style={{width: '100%', justifyContent: 'center'}}>
                            Ver Detalles
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizerPage;