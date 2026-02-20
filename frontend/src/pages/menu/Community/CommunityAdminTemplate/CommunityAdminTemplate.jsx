import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    FaUsers, FaCircle, FaEllipsisH, FaSearch, FaPen, 
    FaFire, FaGavel, FaGamepad, FaImage, FaShareAlt,
    FaCheck, FaInfoCircle, FaUserShield, FaClock, FaGlobe,
    FaTrophy, FaCalendarAlt, FaClipboardList, FaChessBoard,
    FaFilePdf, FaExclamationTriangle, FaSignOutAlt, FaEdit, 
    FaSave, FaTimes, FaTrash, FaBan, FaUserCog, FaShieldAlt,
    FaCloudUploadAlt, FaLink , FaDiscord, FaTwitter, FaTwitch,
    FaBriefcase, FaCheckCircle
} from 'react-icons/fa';
import './CommunityAdminTemplate.css';

const CommunityAdminTemplate = () => {
  const location = useLocation();
  const incomingData = location.state || {};
  const [isAdminMode, setIsAdminMode] = useState(true);
  const communityData = {
    name: incomingData.name || ' || Comunidad Ejemplo',
    tagline: incomingData.tagline || 'Panel de Administración',
    description: incomingData.description || 'Sin descripción.',
    banner: incomingData.banner || 'https://via.placeholder.com/1200x350/000/000',
    avatar: incomingData.avatar || 'https://via.placeholder.com/150/8EDB15/000',
    stats: incomingData.stats || { members: 1240, online: 45 },
    created_at: incomingData.created_at || '2024',
    admins: incomingData.admins || ['Admin_Master', 'Mod_Leader'],
    region: incomingData.region || 'Global'
  };

  const dynamicStyles = {
    '--hero-banner': `url(${communityData.banner})`,
    '--hero-avatar': `url(${communityData.avatar})`
  };

  const [activeTab, setActiveTab] = useState('feed');
  const [isJoined, setIsJoined] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingAbout, setIsEditingAbout] = useState(false);


const [aboutDraft, setAboutDraft] = useState({
  tagline: communityData.tagline || '',
  region: communityData.region || '',
  description: communityData.description || 'Sin descripción.',
  banner: communityData.banner || '',
  avatar: communityData.avatar || ''
});

  const [posts, setPosts] = useState([
    { id: 1, author: 'Player_X', text: 'Clip de jugada', status: 'pending' },
    { id: 2, author: 'ToxicUser', text: 'Comentario ofensivo', status: 'pending' }
  ]);

  const [staffMembers, setStaffMembers] = useState(
    communityData.admins.map((name, idx) => ({
      id: idx + 1,
      name,
      role: 'admin',
      status: 'active'
    }))
  );

  const [recruitmentApps, setRecruitmentApps] = useState([
    { id: 101, user: 'ModHunter', role: 'moderador', exp: '6 meses', status: 'pending' },
    { id: 102, user: 'TourneyPro', role: 'organizador', exp: '1 año', status: 'pending' }
  ]);

  const [logs, setLogs] = useState([]);

  const addLog = (action) => {
    setLogs((prev) => [{ id: Date.now() + Math.random(), action, at: new Date().toLocaleString() }, ...prev]);
  };

  const handleJoin = () => setIsJoined((prev) => !prev);

  const approvePost = (id) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p)));
    addLog(`Post aprobado #${id}`);
  };

  const deletePost = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    addLog(`Post eliminado #${id}`);
  };

  const removeStaff = (id) => {
    setStaffMembers((prev) => prev.filter((m) => m.id !== id));
    addLog(`Miembro staff eliminado #${id}`);
  };

  const blockUser = (username) => {
    addLog(`Usuario bloqueado: ${username}`);
  };

  const acceptApplication = (id) => {
    const app = recruitmentApps.find((a) => a.id === id);
    if (!app) return;

    setStaffMembers((prev) => [
      ...prev,
      { id: Date.now(), name: app.user, role: app.role, status: 'active' }
    ]);

    setRecruitmentApps((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'accepted' } : a))
    );

    addLog(`Solicitud aceptada: ${app.user}`);
  };

  const rejectApplication = (id) => {
    setRecruitmentApps((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'rejected' } : a))
    );
    addLog(`Solicitud rechazada #${id}`);
  };

  const saveAbout = () => {
    setIsEditingAbout(false);
    addLog('Se actualizó la información de la comunidad');
  };

  const q = searchQuery.trim().toLowerCase();

  const filteredPosts = posts.filter(
    (p) =>
      !q ||
      p.author.toLowerCase().includes(q) ||
      p.text.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q)
  );

  const filteredStaff = staffMembers.filter(
    (m) => !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)
  );

  const filteredRecruitment = recruitmentApps.filter(
    (a) =>
      !q ||
      a.user.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q) ||
      a.status.toLowerCase().includes(q)
  );

  const filteredLogs = logs.filter((l) => !q || l.action.toLowerCase().includes(q));
const renderFeedAdmin = () => (
    <div className="full-width-tab fade-in">
      <div className="tech-section-header">
          <div className="header-icon-box">
              <FaShieldAlt /> 
          </div>
          <div>
              <h3>Centro de Moderación</h3>
              <p>Revisa y gestiona el comportamiento de los usuarios.</p>
          </div>
      </div>

      <div className="admin-feed-list">
        {filteredPosts.length === 0 ? (
          <div className="empty-state-tech">
             <FaCheck className="empty-icon"/>
             <h3>Todo limpio</h3>
             <p>No hay publicaciones pendientes de revisión.</p>
          </div>
        ) : (
          filteredPosts.map((p) => (
            <div key={p.id} className="admin-post-card">
              
              {/* CABECERA DEL POST: Usuario y Estado */}
              <div className="post-admin-header">
                <div className="user-meta">
                    <div className="mini-avatar">
                        {p.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="meta-info">
                        <span className="author-name">{p.author}</span>
                        <span className="post-time"><FaClock/> Hace un momento</span>
                    </div>
                </div>
                <span className={`status-pill ${p.status.toLowerCase()}`}>
                    {p.status}
                </span>
              </div>

              {/* CONTENIDO DEL MENSAJE */}
              <div className="post-admin-body">
                <p>"{p.text}"</p>
              </div>

              {/* BARRA DE ACCIONES */}
              <div className="post-admin-actions">
                <button className="btn-tech primary small" onClick={() => approvePost(p.id)}>
                  <FaCheck /> APROBAR
                </button>
                <button className="btn-tech glass small warning" onClick={() => deletePost(p.id)}>
                  <FaTrash /> ELIMINAR
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
  const renderAboutAdmin = () => (
    <div className="full-width-tab fade-in">
      <div className="admin-container-tech">
        
        {/* CABECERA DE EDICIÓN */}
        <div className="tech-section-header">
            <div className="header-icon-box">
                <FaEdit />
            </div>
            <div>
                <h3>Editar Perfil de Comunidad</h3>
                <p>Gestiona la información pública y enlaces de tu organización.</p>
            </div>
             {/* BOTONES DE ACCIÓN FLOTANTES */}
            <div className="admin-actions-top">
                {!isEditingAbout ? (
                    <button className="btn-tech glass" onClick={() => setIsEditingAbout(true)}>
                        <FaPen /> EDITAR DATOS
                    </button>
                ) : (
                    <div className="edit-controls">
                        <button className="btn-tech ghost" onClick={() => setIsEditingAbout(false)}>
                            <FaTimes /> CANCELAR
                        </button>
                        <button className="btn-tech primary" onClick={saveAbout}>
                            <FaSave /> GUARDAR CAMBIOS
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* FORMULARIO (Deshabilitado si no se está editando) */}
        <div className={`admin-form-layout ${isEditingAbout ? 'editing' : 'view-only'}`}>
            
            {/* 1. IDENTIDAD */}
            <div className="form-section">
                <h4 className="form-title"> <FaGlobe className="neon-icon"/> Identidad & Región</h4>
                <div className="inputs-grid-2">
                    <div className="input-group-tech">
                        <label>Slogan (Tagline)</label>
                        <input
                            type="text"
                            placeholder="Ej: La casa de los campeones..."
                            value={aboutDraft.tagline}
                            onChange={(e) => setAboutDraft({...aboutDraft, tagline: e.target.value})}
                            disabled={!isEditingAbout}
                        />
                    </div>
                    <div className="input-group-tech">
                        <label>Región / País</label>
                        <input
                            type="text"
                            placeholder="Ej: LATAM, España, Global..."
                            value={aboutDraft.region}
                            onChange={(e) => setAboutDraft({...aboutDraft, region: e.target.value})}
                            disabled={!isEditingAbout}
                        />
                    </div>
                </div>
            </div>

           {/* 2. BRANDING (SUBIDA DE IMÁGENES LOCALES) */}
            <div className="form-section">
                <h4 className="form-title"> <FaImage className="neon-icon"/> Branding Visual</h4>
                <div className="inputs-grid-2">
                    
                    {/* SUBIR BANNER */}
                    <div className="input-group-tech">
                        <label>Banner de la Comunidad</label>
                        {/* Input invisible real */}
                        <input
                            type="file"
                            accept="image/*"
                            id="upload-banner"
                            style={{ display: 'none' }}
                            disabled={!isEditingAbout}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    const localUrl = URL.createObjectURL(e.target.files[0]);
                                    setAboutDraft({ ...aboutDraft, banner: localUrl });
                                }
                            }}
                        />
                        {/* Botón visual personalizado */}
                        <label htmlFor="upload-banner" className={`file-upload-zone ${!isEditingAbout ? 'disabled' : ''}`}>
                            {aboutDraft.banner ? (
                                <div className="preview-container" style={{backgroundImage: `url(${aboutDraft.banner})`}}>
                                    <div className="preview-overlay"><FaPen /> CAMBIAR</div>
                                </div>
                            ) : (
                                <div className="upload-placeholder">
                                    <FaCloudUploadAlt className="upload-icon"/>
                                    <span>Subir Banner (1200x350)</span>
                                </div>
                            )}
                        </label>
                    </div>

                    {/* SUBIR AVATAR */}
                    <div className="input-group-tech">
                        <label>Avatar / Logo</label>
                        <input
                            type="file"
                            accept="image/*"
                            id="upload-avatar"
                            style={{ display: 'none' }}
                            disabled={!isEditingAbout}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    const localUrl = URL.createObjectURL(e.target.files[0]);
                                    setAboutDraft({ ...aboutDraft, avatar: localUrl });
                                }
                            }}
                        />
                        <label htmlFor="upload-avatar" className={`file-upload-zone avatar-mode ${!isEditingAbout ? 'disabled' : ''}`}>
                            {aboutDraft.avatar ? (
                                <div className="preview-container avatar-preview" style={{backgroundImage: `url(${aboutDraft.avatar})`}}>
                                    <div className="preview-overlay circle"><FaPen /></div>
                                </div>
                            ) : (
                                <div className="upload-placeholder">
                                    <FaCloudUploadAlt className="upload-icon"/>
                                    <span>Subir Logo</span>
                                </div>
                            )}
                        </label>
                    </div>

                </div>
            </div>

            {/* 3. REDES SOCIALES */}
            <div className="form-section">
                <h4 className="form-title"> <FaLink className="neon-icon"/> Redes Sociales</h4>
                <div className="inputs-grid-3">
                    <div className="input-group-tech social discord">
                        <label><FaDiscord/> Discord</label>
                        <input
                            type="text"
                            placeholder="Invite Link"
                            disabled={!isEditingAbout}
                            // Asumiendo que agregas estos campos a tu estado aboutDraft
                        />
                    </div>
                    <div className="input-group-tech social twitter">
                        <label><FaTwitter/> Twitter / X</label>
                        <input type="text" placeholder="@usuario" disabled={!isEditingAbout} />
                    </div>
                    <div className="input-group-tech social twitch">
                        <label><FaTwitch/> Twitch</label>
                        <input type="text" placeholder="twitch.tv/..." disabled={!isEditingAbout} />
                    </div>
                </div>
            </div>

            {/* 4. DESCRIPCIÓN */}
            <div className="form-section full">
                <h4 className="form-title"> <FaInfoCircle className="neon-icon"/> Descripción Detallada</h4>
                <div className="input-group-tech">
                    <textarea
                        rows="5"
                        placeholder="Escribe sobre la historia de tu comunidad, logros, objetivos..."
                        value={aboutDraft.description}
                        onChange={(e) => setAboutDraft({...aboutDraft, description: e.target.value})}
                        disabled={!isEditingAbout}
                    />
                </div>
            </div>

        </div>
      </div>
    </div>
  );

 const renderStaffAdmin = () => (
    <div className="full-width-tab fade-in">
      {/* Cabecera de Sección */}
      <div className="tech-section-header">
          <div className="header-icon-box">
              <FaUserCog />
          </div>
          <div>
              <h3>Gestión de Staff</h3>
              <p>Administra permisos, rangos y accesos del equipo.</p>
          </div>
      </div>

      <div className="admin-staff-grid">
        {filteredStaff.length === 0 ? (
          <div className="empty-state-tech">
             <FaShieldAlt className="empty-icon"/>
             <h3>Sin miembros</h3>
             <p>Aún no hay nadie en el equipo de staff.</p>
          </div>
        ) : (
          filteredStaff.map((m) => (
            <div key={m.id} className="staff-admin-card">
              {/* Decoración visual tech */}
              <div className="card-corner-accent"></div>
              
              <div className="staff-card-content">
                {/* Avatar y Rol */}
                <div className="staff-identity">
                    <div className="mini-avatar-tech">
                        {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="staff-text">
                        <h4>{m.name}</h4>
                        {/* Renderizado condicional de badge según rol (puedes ajustar lógica) */}
                        <span className={`role-pill ${m.role.toLowerCase().includes('admin') ? 'admin' : 'mod'}`}>
                            {m.role.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Botonera de Acciones */}
                <div className="staff-actions-row">
                  <button 
                    className="btn-action-icon warning" 
                    onClick={() => blockUser(m.name)} 
                    title="Bloquear Acceso"
                  >
                    <FaBan />
                  </button>
                  <button 
                    className="btn-action-icon danger" 
                    onClick={() => removeStaff(m.id)} 
                    title="Expulsar del Staff"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderRecruitmentAdmin = () => (
    <div className="full-width-tab fade-in">
      <div className="section-header-tech"><h3>Reclutamiento</h3></div>
      {filteredRecruitment.length === 0 ? (
        <div className="widget-tech" style={{ padding: 16 }}>Sin solicitudes.</div>
      ) : (
        filteredRecruitment.map((a) => (
          <div key={a.id} className="widget-tech" style={{ padding: 16, marginBottom: 12 }}>
            <p><strong>{a.user}</strong> — {a.role} — Exp: {a.exp}</p>
            <p>Estado: {a.status}</p>
            <div className="t-actions">
              <button className="btn-tech neon" onClick={() => acceptApplication(a.id)}>
                <FaCheckCircle /> Aceptar
              </button>
              <button className="btn-tech glass" onClick={() => rejectApplication(a.id)}>
                <FaTrash /> Rechazar
              </button>
              <button className="btn-tech glass" onClick={() => blockUser(a.user)}>
                <FaBan /> Bloquear
              </button>
            </div>
          </div>
        ))
      )}
      <div className="widget-tech" style={{ padding: 16 }}>
        <p><FaBriefcase /> Reclutamiento activo para moderadores.</p>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="full-width-tab fade-in">
      <div className="section-header-tech"><h3>Logs de Moderación</h3></div>
      {filteredLogs.length === 0 ? (
        <div className="widget-tech" style={{ padding: 16 }}>Sin acciones registradas.</div>
      ) : (
        filteredLogs.map((log) => (
          <div key={log.id} className="widget-tech" style={{ padding: 12, marginBottom: 8 }}>
            <p>{log.action}</p>
            <small>{log.at}</small>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="community-layout" style={dynamicStyles}>
      <header className="tech-header">
        <div className="hero-banner">
          <div className="scanline"></div>
          <div className="hero-overlay"></div>
        </div>

        <div className="header-content container-limit">
          <div className="profile-grid">
            <div className="avatar-container">
              <div className="tech-avatar"></div>
              <div className="status-light"></div>
            </div>

            <div className="profile-info">
              <h1 className="glitch-text">{communityData.name} ADMIN</h1>
              <div className="badges-row">
                <span className="tech-badge official">PANEL</span>
                <span className="tech-badge region">{aboutDraft.region}</span>
              </div>
              <div className="stats-row">
                <span><strong className="neon-text">{communityData.stats.members}</strong> Miembros</span>
                <span><strong className="neon-text">{communityData.stats.online}</strong> Online</span>
              </div>
              <div className="stats-row">
                <span><FaGlobe /> {aboutDraft.region}</span>
                <span><FaClock /> {communityData.created_at}</span>
              </div>
            </div>

           

            <div className="profile-actions">
    <button className="btn-tech glass">
        <FaShareAlt /> COMPARTIR
    </button>

    <button 
        className="btn-tech exit-admin" 
        onClick={() => {
            // Usamos el nombre de la comunidad para construir el link exacto
            const communitySlug = communityData.name.toLowerCase().replace(/\s+/g, '-');
            window.location.href = `/community/${communitySlug}`;
        }} 
    >
        <FaSignOutAlt /> SALIR ADMIN
    </button>

    <button className="btn-tech glass icon-only">
        <FaEllipsisH />
    </button>
</div>
          </div>
        </div>

        <div className="tech-nav-bar">
          <div className="container-limit nav-flex">
            <nav className="nav-menu-container">
              {['feed', 'about', 'staff', 'recruitment', 'logs'].map((tab) => (
                <button
                  key={tab}
                  className={`nav-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </nav>

            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="BUSCAR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="main-content container-limit">
        {activeTab === 'feed' && renderFeedAdmin()}
        {activeTab === 'about' && renderAboutAdmin()}
        {activeTab === 'staff' && renderStaffAdmin()}
        {activeTab === 'recruitment' && renderRecruitmentAdmin()}
        {activeTab === 'logs' && renderLogs()}
      </main>
    </div>
  );
};

export default CommunityAdminTemplate;
