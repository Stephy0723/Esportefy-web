import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBan,
  FaCalendarAlt,
  FaCheck,
  FaCheckCircle,
  FaClipboardList,
  FaCloudUploadAlt,
  FaCrown,
  FaDiscord,
  FaEdit,
  FaGlobe,
  FaImage,
  FaInfoCircle,
  FaLink,
  FaPen,
  FaSave,
  FaSearch,
  FaShieldAlt,
  FaSignOutAlt,
  FaTimes,
  FaTrash,
  FaTwitch,
  FaTwitter,
  FaUserCog,
  FaUsers,
} from 'react-icons/fa';
import { fetchCommunityByShortUrl } from '../community.service';
import '../CommunityTemplate/communityTemplateV2.css';

const TAB_OPTIONS = [
  { id: 'feed', label: 'Moderacion', icon: FaShieldAlt },
  { id: 'about', label: 'Informacion', icon: FaEdit },
  { id: 'staff', label: 'Staff', icon: FaUserCog },
  { id: 'recruitment', label: 'Solicitudes', icon: FaCheckCircle },
  { id: 'logs', label: 'Logs', icon: FaClipboardList },
];

const INITIAL_POSTS = [
  { id: 1, author: 'Player_X', text: 'Clip de jugada', status: 'pending' },
  { id: 2, author: 'ToxicUser', text: 'Comentario ofensivo', status: 'pending' },
];

const INITIAL_RECRUITMENT = [
  { id: 101, user: 'ModHunter', role: 'moderador', exp: '6 meses', status: 'pending' },
  { id: 102, user: 'TourneyPro', role: 'organizador', exp: '1 ano', status: 'pending' },
];

const buildCommunityState = (source = {}, slug = '') => ({
  name: source.name || 'Comunidad Ejemplo',
  tagline: source.tagline || source.description || 'Panel de administracion',
  description: source.description || 'Sin descripcion.',
  banner: source.banner || source.bannerUrl || 'https://via.placeholder.com/1400x560/111827/9ca3af?text=Comunidad',
  avatar: source.avatar || source.avatarUrl || 'https://via.placeholder.com/180/8EDB15/08120d?text=C',
  stats: source.stats || { members: Number(source.membersCount || 0), online: 0 },
  region: source.region || 'Global',
  createdAt: source.created_at || (source.createdAt ? String(new Date(source.createdAt).getFullYear()) : '2024'),
  shortUrl: source.shortUrl || slug,
  socialLinks: source.socialLinks || {},
  isOwner: Boolean(source.isOwner ?? true),
  members: Array.isArray(source.members) ? source.members : [],
});

const buildAboutDraft = (community) => ({
  tagline: community.tagline || '',
  region: community.region || '',
  description: community.description || 'Sin descripcion.',
  banner: community.banner || '',
  avatar: community.avatar || '',
  socialLinks: {
    discord: community.socialLinks?.discord || '',
    twitter: community.socialLinks?.twitter || '',
    twitch: community.socialLinks?.twitch || '',
  },
});

const buildStaffMembers = (community) => {
  if (Array.isArray(community.members) && community.members.length > 0) {
    return community.members
      .filter((member) => ['owner', 'admin', 'moderator'].includes(String(member?.role || '').toLowerCase()))
      .map((member, index) => ({
        id: member?.user?.id || member?._id || index + 1,
        name: member?.user?.username || 'Usuario',
        role: String(member?.role || 'member').toLowerCase(),
        status: 'active',
        avatar: member?.user?.avatar || '',
      }));
  }

  return [
    { id: 1, name: 'Admin_Master', role: 'owner', status: 'active', avatar: '' },
    { id: 2, name: 'Mod_Leader', role: 'admin', status: 'active', avatar: '' },
  ];
};

const CommunityAdminTemplate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: communitySlug } = useParams();

  const [community, setCommunity] = useState(() => buildCommunityState(location.state || {}, communitySlug));
  const [loading, setLoading] = useState(Boolean(communitySlug));
  const [accessError, setAccessError] = useState('');
  const [activeTab, setActiveTab] = useState('about');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [aboutDraft, setAboutDraft] = useState(() => buildAboutDraft(buildCommunityState(location.state || {}, communitySlug)));
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [recruitmentApps, setRecruitmentApps] = useState(INITIAL_RECRUITMENT);
  const [logs, setLogs] = useState([]);

  const bannerInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    let ignore = false;

    const loadCommunity = async () => {
      if (!communitySlug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setAccessError('');
        const data = await fetchCommunityByShortUrl(communitySlug);
        if (ignore || !data) return;

        const nextCommunity = buildCommunityState(data, communitySlug);
        setCommunity(nextCommunity);
        setAboutDraft(buildAboutDraft(nextCommunity));

        if (data.isOwner === false) {
          setAccessError('Solo el creador de la comunidad puede administrar este panel.');
        }
      } catch (error) {
        if (ignore) return;
        setAccessError(error?.response?.data?.message || 'No se pudo cargar la comunidad.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadCommunity();

    return () => {
      ignore = true;
    };
  }, [communitySlug]);

  const staffMembers = useMemo(() => buildStaffMembers(community), [community]);
  const returnTo = location.state?.returnTo || (community.shortUrl ? `/communities/${community.shortUrl}` : '/comunidad');

  const addLog = (action) => {
    setLogs((prev) => [{ id: Date.now() + Math.random(), action, at: new Date().toLocaleString() }, ...prev]);
  };

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return posts;
    return posts.filter((post) =>
      post.author.toLowerCase().includes(query) ||
      post.text.toLowerCase().includes(query) ||
      post.status.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  const filteredStaff = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return staffMembers;
    return staffMembers.filter((member) =>
      member.name.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query)
    );
  }, [staffMembers, searchQuery]);

  const filteredRecruitment = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return recruitmentApps;
    return recruitmentApps.filter((item) =>
      item.user.toLowerCase().includes(query) ||
      item.role.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query)
    );
  }, [recruitmentApps, searchQuery]);

  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((item) => item.action.toLowerCase().includes(query));
  }, [logs, searchQuery]);

  const visibleSocialLinks = useMemo(
    () => Object.entries(aboutDraft.socialLinks || {}).filter(([, value]) => String(value || '').trim()),
    [aboutDraft.socialLinks]
  );

  const metrics = useMemo(
    () => [
      { label: 'Miembros', value: Number(community.stats?.members || 0) },
      { label: 'Staff', value: staffMembers.length },
      { label: 'Posts pendientes', value: posts.filter((post) => post.status === 'pending').length },
      { label: 'Solicitudes', value: recruitmentApps.filter((item) => item.status === 'pending').length },
    ],
    [community.stats?.members, staffMembers.length, posts, recruitmentApps]
  );

  const handleApprovePost = (postId) => {
    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, status: 'approved' } : post)));
    addLog(`Post aprobado #${postId}`);
  };

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    addLog(`Post eliminado #${postId}`);
  };

  const handleBlockUser = (username) => {
    addLog(`Usuario bloqueado: ${username}`);
  };

  const handleRemoveStaff = (staffId) => {
    addLog(`Miembro staff eliminado #${staffId}`);
  };

  const handleAcceptApplication = (applicationId) => {
    const app = recruitmentApps.find((item) => item.id === applicationId);
    if (!app) return;
    setRecruitmentApps((prev) => prev.map((item) => (item.id === applicationId ? { ...item, status: 'accepted' } : item)));
    addLog(`Solicitud aceptada: ${app.user}`);
  };

  const handleRejectApplication = (applicationId) => {
    setRecruitmentApps((prev) => prev.map((item) => (item.id === applicationId ? { ...item, status: 'rejected' } : item)));
    addLog(`Solicitud rechazada #${applicationId}`);
  };

  const handleBannerChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAboutDraft((prev) => ({ ...prev, banner: preview }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAboutDraft((prev) => ({ ...prev, avatar: preview }));
  };

  const handleCancelEdit = () => {
    setAboutDraft(buildAboutDraft(community));
    setIsEditingAbout(false);
  };

  const handleSaveAbout = () => {
    const nextCommunity = {
      ...community,
      tagline: aboutDraft.tagline,
      description: aboutDraft.description,
      banner: aboutDraft.banner,
      avatar: aboutDraft.avatar,
      region: aboutDraft.region,
      socialLinks: {
        ...(community.socialLinks || {}),
        ...(aboutDraft.socialLinks || {}),
      },
    };

    setCommunity(nextCommunity);
    setAboutDraft(buildAboutDraft(nextCommunity));
    setIsEditingAbout(false);
    addLog('Se actualizo la informacion de la comunidad');
  };

  if (loading) {
    return (
      <div className="ct">
        <div className="ct__loader">
          <div className="ct__spinner" />
          <span>Cargando panel de administracion...</span>
        </div>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="ct">
        <div className="ct__empty-state">
          <button className="ct__back" onClick={() => navigate(returnTo)}>
            <FaArrowLeft /> Volver
          </button>
          <div className="ct__empty-card">
            <FaShieldAlt className="ct__empty-icon" />
            <h2>Acceso restringido</h2>
            <p>{accessError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ct">
      <header className="ct__hero">
        {community.banner && (
          <img src={community.banner} alt="" className="ct__hero-bg" />
        )}
        <div className="ct__hero-overlay" />

        <div className="ct__hero-inner">
          <button className="ct__back ct__back--hero" onClick={() => navigate(returnTo)}>
            <FaArrowLeft />
          </button>

          <div className="ct__hero-profile">
            {community.avatar ? (
              <img src={community.avatar} alt={community.name} className="ct__avatar" />
            ) : (
              <div className="ct__avatar ct__avatar--fallback">
                {(community.name || 'C')[0].toUpperCase()}
              </div>
            )}

            <div className="ct__hero-info">
              <h1 className="ct__title">{community.name}</h1>
              <p className="ct__tagline">Panel de administracion de comunidad</p>

              <div className="ct__meta-row">
                <span className="ct__meta-chip">
                  <FaUsers /> {community.stats?.members || 0} miembros
                </span>
                <span className="ct__meta-chip">
                  <FaGlobe /> {aboutDraft.region || 'Global'}
                </span>
                <span className="ct__meta-chip">
                  <FaCalendarAlt /> {community.createdAt}
                </span>
                <span className="ct__meta-chip ct__meta-chip--role">
                  <FaCrown /> Owner
                </span>
              </div>
            </div>
          </div>

          <div className="ct__hero-actions">
            <span className="ct__badge-owner"><FaCrown /> Admin</span>
            <button className="ct__btn-action ct__btn-action--manage" onClick={() => navigate(returnTo)}>
              <FaSignOutAlt /> Salir admin
            </button>
          </div>
        </div>
      </header>

      <main className="ct__body">
        <section className="ct__section">
          <div className="ct__admin-tabs">
            {TAB_OPTIONS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`ct__admin-tab ${activeTab === tab.id ? 'ct__admin-tab--active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon /> {tab.label}
                </button>
              );
            })}

            <label className="ct__admin-search">
              <FaSearch />
              <input
                type="search"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
          </div>
        </section>

        {activeTab === 'feed' && (
          <section className="ct__section ct__admin-section">
            <div className="ct__admin-section-header">
              <div>
                <h2 className="ct__section-title"><FaShieldAlt /> Centro de moderacion</h2>
                <p className="ct__admin-subtitle">Revisa publicaciones pendientes y toma accion rapida.</p>
              </div>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="ct__empty-section">
                <FaCheckCircle />
                <p>No hay publicaciones pendientes de revision.</p>
              </div>
            ) : (
              <div className="ct__admin-logs">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="ct__admin-log-item" style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <p>@{post.author}</p>
                      <small>{post.text}</small>
                    </div>
                    <div className="ct__admin-staff-actions">
                      <button type="button" className="ct__admin-action-btn" title="Aprobar" onClick={() => handleApprovePost(post.id)}>
                        <FaCheck />
                      </button>
                      <button type="button" className="ct__admin-action-btn ct__admin-action-btn--danger" title="Eliminar" onClick={() => handleDeletePost(post.id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'about' && (
          <section className="ct__section ct__admin-section">
            <div className="ct__admin-section-header">
              <div>
                <h2 className="ct__section-title"><FaEdit /> Editar perfil de comunidad</h2>
                <p className="ct__admin-subtitle">Mismo estilo del layout de comunidad, con contenido administrativo.</p>
              </div>

              <div className="ct__admin-header-actions">
                {!isEditingAbout ? (
                  <button className="ct__btn-action ct__btn-action--manage" onClick={() => setIsEditingAbout(true)}>
                    <FaPen /> Editar
                  </button>
                ) : (
                  <>
                    <button className="ct__btn-action ct__btn-action--manage" onClick={handleCancelEdit}>
                      <FaTimes /> Cancelar
                    </button>
                    <button className="ct__btn-action" onClick={handleSaveAbout}>
                      <FaSave /> Guardar
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className={`ct__admin-form ${!isEditingAbout ? 'ct__admin-form--readonly' : ''}`}>
              <div className="ct__admin-form-group">
                <h3 className="ct__admin-form-title"><FaGlobe /> Identidad y region</h3>
                <div className="ct__admin-form-grid">
                  <div className="ct__admin-input-group">
                    <label>Slogan</label>
                    <input
                      type="text"
                      value={aboutDraft.tagline}
                      onChange={(event) => setAboutDraft((prev) => ({ ...prev, tagline: event.target.value }))}
                      placeholder="Ej: La casa de los campeones"
                      disabled={!isEditingAbout}
                    />
                  </div>

                  <div className="ct__admin-input-group">
                    <label>Region</label>
                    <input
                      type="text"
                      value={aboutDraft.region}
                      onChange={(event) => setAboutDraft((prev) => ({ ...prev, region: event.target.value }))}
                      placeholder="Ej: LATAM"
                      disabled={!isEditingAbout}
                    />
                  </div>
                </div>
              </div>

              <div className="ct__admin-form-group">
                <h3 className="ct__admin-form-title"><FaImage /> Branding visual</h3>
                <div className="ct__admin-form-grid">
                  <div className="ct__admin-input-group">
                    <label>Banner</label>
                    <input ref={bannerInputRef} type="file" accept="image/*" hidden onChange={handleBannerChange} />
                    <label
                      className={`ct__admin-upload ${!isEditingAbout ? 'ct__admin-upload--disabled' : ''}`}
                      onClick={() => isEditingAbout && bannerInputRef.current?.click()}
                    >
                      {aboutDraft.banner ? (
                        <div className="ct__admin-upload-preview" style={{ backgroundImage: `url(${aboutDraft.banner})` }}>
                          <div className="ct__admin-upload-overlay"><FaCloudUploadAlt /> Cambiar</div>
                        </div>
                      ) : (
                        <div className="ct__admin-upload-placeholder">
                          <FaCloudUploadAlt />
                          <span>Subir banner</span>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="ct__admin-input-group">
                    <label>Avatar / logo</label>
                    <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                    <label
                      className={`ct__admin-upload ct__admin-upload--avatar ${!isEditingAbout ? 'ct__admin-upload--disabled' : ''}`}
                      onClick={() => isEditingAbout && avatarInputRef.current?.click()}
                    >
                      {aboutDraft.avatar ? (
                        <div className="ct__admin-upload-preview ct__admin-upload-preview--avatar" style={{ backgroundImage: `url(${aboutDraft.avatar})` }}>
                          <div className="ct__admin-upload-overlay ct__admin-upload-overlay--circle"><FaPen /></div>
                        </div>
                      ) : (
                        <div className="ct__admin-upload-placeholder">
                          <FaImage />
                          <span>Subir logo</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="ct__admin-form-group">
                <h3 className="ct__admin-form-title"><FaLink /> Redes sociales</h3>
                <div className="ct__admin-form-grid ct__admin-form-grid--3">
                  <div className="ct__admin-input-group">
                    <label className="ct__admin-label--discord"><FaDiscord /> Discord</label>
                    <input
                      type="text"
                      value={aboutDraft.socialLinks.discord}
                      onChange={(event) => setAboutDraft((prev) => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, discord: event.target.value },
                      }))}
                      placeholder="https://discord.gg/tucomunidad"
                      disabled={!isEditingAbout}
                    />
                  </div>

                  <div className="ct__admin-input-group">
                    <label className="ct__admin-label--twitter"><FaTwitter /> Twitter / X</label>
                    <input
                      type="text"
                      value={aboutDraft.socialLinks.twitter}
                      onChange={(event) => setAboutDraft((prev) => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, twitter: event.target.value },
                      }))}
                      placeholder="https://x.com/tucomunidad"
                      disabled={!isEditingAbout}
                    />
                  </div>

                  <div className="ct__admin-input-group">
                    <label className="ct__admin-label--twitch"><FaTwitch /> Twitch</label>
                    <input
                      type="text"
                      value={aboutDraft.socialLinks.twitch}
                      onChange={(event) => setAboutDraft((prev) => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, twitch: event.target.value },
                      }))}
                      placeholder="https://twitch.tv/tucomunidad"
                      disabled={!isEditingAbout}
                    />
                  </div>
                </div>
              </div>

              <div className="ct__admin-form-group">
                <h3 className="ct__admin-form-title"><FaInfoCircle /> Descripcion</h3>
                <div className="ct__admin-input-group">
                  <textarea
                    rows="5"
                    value={aboutDraft.description}
                    onChange={(event) => setAboutDraft((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Describe la comunidad, su historia y enfoque."
                    disabled={!isEditingAbout}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'staff' && (
          <section className="ct__section ct__admin-section">
            <div className="ct__admin-section-header">
              <div>
                <h2 className="ct__section-title"><FaUserCog /> Gestion de staff</h2>
                <p className="ct__admin-subtitle">Administra permisos, rangos y accesos del equipo.</p>
              </div>
            </div>

            {filteredStaff.length === 0 ? (
              <div className="ct__empty-section">
                <FaUsers />
                <p>No hay miembros en el equipo de staff.</p>
              </div>
            ) : (
              <div className="ct__members-grid">
                {filteredStaff.map((member) => (
                  <div key={member.id} className={`ct__member ${member.role === 'owner' ? 'ct__member--owner' : ''}`}>
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="ct__member-avatar" />
                    ) : (
                      <div className="ct__member-avatar ct__member-avatar--fallback">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="ct__member-info" style={{ flex: 1 }}>
                      <strong>{member.name}</strong>
                      <span className={`ct__role ct__role--${member.role}`}>{member.role}</span>
                    </div>

                    <div className="ct__admin-staff-actions">
                      <button type="button" className="ct__admin-action-btn ct__admin-action-btn--warn" title="Bloquear" onClick={() => handleBlockUser(member.name)}>
                        <FaBan />
                      </button>
                      <button type="button" className="ct__admin-action-btn ct__admin-action-btn--danger" title="Eliminar" onClick={() => handleRemoveStaff(member.id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'recruitment' && (
          <section className="ct__section ct__admin-section">
            <div className="ct__admin-section-header">
              <div>
                <h2 className="ct__section-title"><FaCheckCircle /> Solicitudes</h2>
                <p className="ct__admin-subtitle">Gestiona reclutamiento y aplicaciones al staff.</p>
              </div>
            </div>

            {filteredRecruitment.length === 0 ? (
              <div className="ct__empty-section">
                <FaCheckCircle />
                <p>Sin solicitudes pendientes.</p>
              </div>
            ) : (
              <div className="ct__members-grid">
                {filteredRecruitment.map((item) => (
                  <div key={item.id} className="ct__member">
                    <div className="ct__member-avatar ct__member-avatar--fallback">
                      {item.user.charAt(0).toUpperCase()}
                    </div>

                    <div className="ct__member-info" style={{ flex: 1 }}>
                      <strong>{item.user}</strong>
                      <span className="ct__role ct__role--moderator">{item.role}</span>
                      <span className="ct__role ct__role--member">Exp: {item.exp}</span>
                    </div>

                    <div className="ct__admin-staff-actions">
                      <button type="button" className="ct__admin-action-btn" title="Aceptar" onClick={() => handleAcceptApplication(item.id)}>
                        <FaCheck />
                      </button>
                      <button type="button" className="ct__admin-action-btn ct__admin-action-btn--danger" title="Rechazar" onClick={() => handleRejectApplication(item.id)}>
                        <FaTimes />
                      </button>
                      <button type="button" className="ct__admin-action-btn ct__admin-action-btn--warn" title="Bloquear" onClick={() => handleBlockUser(item.user)}>
                        <FaBan />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'logs' && (
          <section className="ct__section ct__admin-section">
            <div className="ct__admin-section-header">
              <div>
                <h2 className="ct__section-title"><FaClipboardList /> Logs de moderacion</h2>
                <p className="ct__admin-subtitle">Historial reciente de acciones dentro del panel.</p>
              </div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="ct__empty-section">
                <FaClipboardList />
                <p>Sin acciones registradas.</p>
              </div>
            ) : (
              <div className="ct__admin-logs">
                {filteredLogs.map((item) => (
                  <div key={item.id} className="ct__admin-log-item">
                    <p>{item.action}</p>
                    <small>{item.at}</small>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="ct__section">
          <h2 className="ct__section-title"><FaLink /> Redes visibles</h2>
          {visibleSocialLinks.length === 0 ? (
            <div className="ct__empty-section">
              <FaLink />
              <p>Esta comunidad aun no tiene redes configuradas.</p>
            </div>
          ) : (
            <div className="ct__meta-row">
              {visibleSocialLinks.map(([key, value]) => (
                <a key={key} href={value} className="ct__meta-chip" target="_blank" rel="noreferrer">
                  <FaLink /> {key}
                </a>
              ))}
            </div>
          )}
        </section>

        <footer className="ct__info-footer">
          <FaCalendarAlt />
          <span>Panel administrativo de comunidad</span>
        </footer>
      </main>
    </div>
  );
};

export default CommunityAdminTemplate;
