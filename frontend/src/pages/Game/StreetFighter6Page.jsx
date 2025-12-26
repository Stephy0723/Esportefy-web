import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHandshake, FaUsers, FaStar } from 'react-icons/fa';
import { gamesDetailedData } from '../../data/gamesDetailedData';
import BannerSF6 from '../../assets/banner/BannerSf6.jpg';
import './GamePageIndividual.css';

const StreetFighter6Page = () => {
    const navigate = useNavigate();
    const data = gamesDetailedData?.streetfighter6;

    if (!data) return <div className="loading-state">Entrando al World Tour...</div>;

    return (
        <div className="game-page-premium theme-streetfighter6">
            <div className="background-hero" style={{ backgroundImage: `url(${BannerSF6})` }}>
                <div className="dark-vignette"></div>
            </div>

            <button className="minimal-back-btn" onClick={() => navigate(-1)}>
                <FaArrowLeft /> VOLVER
            </button>

            <main className="content-overlay">
                <header className="game-header">
                    <h1 className="game-main-title">{data.name}</h1>
                    <div className="passion-tags">
                        {data.tags?.map((t, i) => <span key={i}>{t}</span>)}
                    </div>
                </header>

                <div className="game-details-grid">
                    <section className="main-column-content">
                        <div className="glass-section">
                            <div className="section-header">
                                <FaStar className="icon-accent" />
                                <h3>HISTORIA</h3>
                            </div>
                            <p className="description-text">{data.history}</p>
                            <div className="sponsors-container">
                                <p className="sponsors-label">PATROCINADORES OFICIALES</p>
                                <div className="sponsors-flex">
                                    {data.sponsors?.map((s, i) => (
                                        <div key={i} className="sponsor-pill">{s.name}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className="stats-sidebar">
                        <div className="glass-section">
                            <div className="section-header">
                                <FaHandshake className="icon-accent" />
                                <h4>ORGANIZADORES</h4>
                            </div>
                            {data.organizers?.map((o, i) => (
                                <div key={i} className="dynamic-item-card">
                                    <strong>{o.name}</strong>
                                    <p>{o.motto}</p>
                                </div>
                            ))}
                        </div>
                        <div className="glass-section">
                            <div className="section-header">
                                <FaUsers className="icon-accent" />
                                <h4>COMUNIDADES</h4>
                            </div>
                            {data.userCommunities?.map((c, i) => (
                                <div key={i} className="footer-comm-pill">
                                    <b className="comm-name">{c.name}</b>
                                    <span className="comm-count">{c.members}</span>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default StreetFighter6Page;