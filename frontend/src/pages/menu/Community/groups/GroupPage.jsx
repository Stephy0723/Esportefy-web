import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';
import { useLang } from '../../../../context/LanguageContext';
import '../Community.css';

const GroupPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLang();

    // Datos simulados para Grupos
    const groups = {
        "tl": { name: "Team Liquid Fan Club", members: "12k", img: "https://liquipedia.net/commons/images/thumb/f/f6/Team_Liquid_2017_logo.png/600px-Team_Liquid_2017_logo.png" },
        "kru": { name: "KRÜ Esports Latam", members: "45k", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/KR%C3%9C_Esports_Logo.png/800px-KR%C3%9C_Esports_Logo.png" },
        "g2": { name: "G2 Army", members: "80k", img: "https://upload.wikimedia.org/wikipedia/en/thumb/1/12/G2_Esports_logo.svg/1200px-G2_Esports_logo.svg.png" }
    };

    const group = groups[id] || { name: t('gpUnknownGroup'), members: "0", img: "" };

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-container">
                <button className="btn-back" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> {t('gpBack')}
                </button>

                <div className="group-header-card" style={{
                    background: 'var(--bg-card)', 
                    borderRadius: '16px', 
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden'
                }}>
                    <div style={{height: '150px', background: 'linear-gradient(45deg, #111, #333)'}}></div>
                    <div style={{padding: '20px 30px', display: 'flex', alignItems: 'flex-end', gap: '20px', marginTop: '-50px'}}>
                        <img src={group.img} alt="Logo" style={{
                            width: '100px', height: '100px', borderRadius: '50%', 
                            border: '4px solid var(--bg-card)', background: '#000', objectFit: 'contain'
                        }}/>
                        <div style={{flexGrow: 1, paddingBottom: '5px'}}>
                            <h2 style={{margin: 0, fontSize: '1.8rem', color: 'var(--text-main)'}}>{group.name}</h2>
                            <p style={{color: 'var(--text-muted)', margin: '5px 0'}}>{t('gpOfficialFanCommunity')}</p>
                        </div>
                        <button className="btn-create-community">
                            <FaPlus /> {t('gpJoinGroup')}
                        </button>
                    </div>
                </div>

                <div className="feed-section" style={{marginTop: '30px'}}>
                    <div className="section-title"><h3>{t('gpGroupActivity')}</h3></div>
                    <div className="post-card">
                        <p className="post-text">{t('gpWelcomePost')} {group.name}!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupPage;