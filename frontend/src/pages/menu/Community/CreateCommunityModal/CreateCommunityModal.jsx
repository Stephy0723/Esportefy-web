import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaTimes,
    FaCamera,
    FaImage,
    FaGamepad,
    FaFilePdf,
    FaInfoCircle,
    FaGavel,
    FaUsers,
    FaShieldAlt,
    FaRocket,
    FaChevronRight,
    FaChevronLeft,
    FaCheck
} from 'react-icons/fa';
import { createCommunitySpace } from '../community.service';
import { useNotification } from '../../../../context/NotificationContext';
import './CreateCommunityModal.css';

const CURRENT_USER_ROLE = 'organizer';
const AVAILABLE_GAMES = ['Valorant', 'LoL', 'CS2', 'Fortnite', 'CoD', 'FIFA', 'Minecraft', 'Overwatch 2', 'Rocket League', 'GTA V'];
const TAB_ORDER = ['identity', 'content', 'rules', 'team', 'settings'];

const slugify = (value) =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);

const CreateCommunityModal = ({ isOpen, onClose, onCreated }) => {
    const navigate = useNavigate();
    const { addToast } = useNotification();
    const [activeTab, setActiveTab] = useState('identity');
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '', shortUrl: '', description: '', type: 'Mixta',
        targetAudience: 'Mixto', language: 'Español', region: 'LATAM', launchDate: '',
        mainGames: [], allowAllGames: false,
        contentCategories: { noticias: true, memes: true, opinion: true, clips: true, fanart: true, guias: true },
        contentProhibited: '',
        postTypes: { texto: true, imagen: true, video: true, enlace: true, encuestas: true },
        whoCanPost: 'all', allowComments: true, preModeration: false, allowReactions: true, allowShare: true,
        roles: { owner: true, admin: true, moderator: true, user: true, visitor: true },
        rulesText: '', toxicityFilter: true, spoilerTag: true, nsfwAllowed: false,
        reportReasons: { spam: true, hate: true, nsfw: true, spoiler: true },
        emailVerification: true, antiSpamControl: true,
        discordIntegration: false, welcomeEmail: true,
        futureEvents: false, futureTournaments: false
    });
    const [media, setMedia] = useState({
        banner: { file: null, preview: null },
        avatar: { file: null, preview: null },
        rulesPdf: { file: null, name: '' }
    });
    const [adminInput, setAdminInput] = useState('');
    const [admins, setAdmins] = useState([]);
    const bannerRef = useRef(null);
    const avatarRef = useRef(null);
    const pdfRef = useRef(null);

    const resolvedSlug = useMemo(
        () => formData.shortUrl || slugify(formData.name),
        [formData.shortUrl, formData.name]
    );

    const handleClose = () => {
        if (isSaving) return;
        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleNestedCheck = (category, key) => {
        setFormData((prev) => ({
            ...prev,
            [category]: { ...prev[category], [key]: !prev[category][key] }
        }));
    };

    const handleImage = (e, type) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setMedia((prev) => ({
            ...prev,
            [type]: { file, preview: URL.createObjectURL(file) }
        }));
    };

    const handlePdf = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setMedia((prev) => ({
            ...prev,
            rulesPdf: { file, name: file.name }
        }));
    };

    const toggleGame = (game) => {
        setFormData((prev) => {
            const current = prev.mainGames;
            if (current.includes(game)) {
                return { ...prev, mainGames: current.filter((item) => item !== game) };
            }
            if (current.length >= 5) return prev;
            return { ...prev, mainGames: [...current, game] };
        });
    };

    const addAdmin = (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const next = adminInput.trim().replace(/^@+/, '');
        if (!next) return;
        setAdmins((prev) => (prev.includes(next) ? prev : [...prev, next]));
        setAdminInput('');
    };

    const removeAdmin = (admin) => {
        setAdmins((prev) => prev.filter((item) => item !== admin));
    };

    const goNext = () => {
        const index = TAB_ORDER.indexOf(activeTab);
        if (index < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[index + 1]);
    };

    const goPrev = () => {
        const index = TAB_ORDER.indexOf(activeTab);
        if (index > 0) setActiveTab(TAB_ORDER[index - 1]);
    };

    const handleLaunch = async () => {
        if (!formData.name.trim()) {
            addToast('El nombre de la comunidad es obligatorio', 'error');
            return;
        }

        try {
            setIsSaving(true);
            const created = await createCommunitySpace({
                formData: {
                    ...formData,
                    shortUrl: resolvedSlug,
                    rulesText: formData.rulesText || '1. Respeto.\n2. No spam.\n3. Nada de toxicidad.',
                },
                media,
                admins,
            });

            addToast('Comunidad creada correctamente', 'success');
            onCreated?.(created);
            navigate(`/communities/${created.shortUrl}`);
        } catch (error) {
            addToast(error?.response?.data?.message || 'No se pudo crear la comunidad', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;
    if (CURRENT_USER_ROLE !== 'organizer') return null;

    return (
        <div className="ccm-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
            <div className="ccm-modal">
                <div className="ccm-header">
                    <div className="ccm-header__copy">
                        <span className="ccm-kicker">Crear comunidad</span>
                        <h3>Usa el formulario que ya preparaste y publícala de una vez</h3>
                    </div>
                    <button className="ccm-close" onClick={handleClose} disabled={isSaving}>
                        <FaTimes />
                    </button>
                </div>

                <div className="ccm-tabs">
                    {[
                        { id: 'identity', icon: FaInfoCircle, label: 'Identidad' },
                        { id: 'content', icon: FaGamepad, label: 'Contenido' },
                        { id: 'rules', icon: FaGavel, label: 'Reglas' },
                        { id: 'team', icon: FaUsers, label: 'Equipo' },
                        { id: 'settings', icon: FaShieldAlt, label: 'Avanzado' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            className={`ccm-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            disabled={isSaving}
                        >
                            <tab.icon /> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="ccm-body">
                    {activeTab === 'identity' && (
                        <div className="ccm-panel">
                            <div className="ccm-media">
                                <button className="ccm-banner" onClick={() => bannerRef.current?.click()} style={{ backgroundImage: media.banner.preview ? `url(${media.banner.preview})` : 'none' }}>
                                    {!media.banner.preview && <span><FaImage /> Subir banner</span>}
                                    <input type="file" ref={bannerRef} hidden accept="image/*" onChange={(e) => handleImage(e, 'banner')} />
                                </button>
                                <button className="ccm-avatar" onClick={() => avatarRef.current?.click()} style={{ backgroundImage: media.avatar.preview ? `url(${media.avatar.preview})` : 'none' }}>
                                    {!media.avatar.preview && <FaCamera />}
                                    <input type="file" ref={avatarRef} hidden accept="image/*" onChange={(e) => handleImage(e, 'avatar')} />
                                </button>
                            </div>

                            <div className="ccm-grid">
                                <label className="ccm-field">
                                    <span>Nombre público</span>
                                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Valorant LATAM Oficial" />
                                </label>
                                <label className="ccm-field">
                                    <span>URL corta</span>
                                    <input name="shortUrl" value={formData.shortUrl} onChange={handleChange} placeholder="valorant-latam" />
                                    <small>Resultado: /communities/{resolvedSlug || 'tu-slug'}</small>
                                </label>
                            </div>

                            <label className="ccm-field">
                                <span>Descripción pública</span>
                                <textarea name="description" rows="4" value={formData.description} onChange={handleChange} placeholder="¿Qué es esta comunidad y para quién?" />
                            </label>

                            <div className="ccm-grid">
                                <label className="ccm-field">
                                    <span>Región</span>
                                    <select name="region" value={formData.region} onChange={handleChange}>
                                        <option value="LATAM">LATAM</option>
                                        <option value="NA">NA</option>
                                        <option value="Global">Global</option>
                                    </select>
                                </label>
                                <label className="ccm-field">
                                    <span>Idioma</span>
                                    <select name="language" value={formData.language} onChange={handleChange}>
                                        <option value="Español">Español</option>
                                        <option value="Inglés">Inglés</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="ccm-panel">
                            <div className="ccm-field">
                                <span>Juegos principales</span>
                                <div className="ccm-chips">
                                    {AVAILABLE_GAMES.map((game) => (
                                        <button
                                            key={game}
                                            type="button"
                                            className={`ccm-chip ${formData.mainGames.includes(game) ? 'is-active' : ''}`}
                                            onClick={() => toggleGame(game)}
                                        >
                                            {game}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="ccm-grid">
                                <label className="ccm-field">
                                    <span>Quién puede publicar</span>
                                    <select name="whoCanPost" value={formData.whoCanPost} onChange={handleChange}>
                                        <option value="all">Todos</option>
                                        <option value="verified">Verificados</option>
                                        <option value="staff">Solo staff</option>
                                    </select>
                                </label>
                                <label className="ccm-field">
                                    <span>Audiencia</span>
                                    <select name="targetAudience" value={formData.targetAudience} onChange={handleChange}>
                                        <option value="Mixto">Mixto</option>
                                        <option value="Competitivo">Competitivo</option>
                                        <option value="Casual">Casual</option>
                                    </select>
                                </label>
                            </div>

                            <label className="ccm-field">
                                <span>Contenido prohibido</span>
                                <input name="contentProhibited" value={formData.contentProhibited} onChange={handleChange} placeholder="Piratería, cheats, NSFW explícito..." />
                            </label>

                            <div className="ccm-toggle-grid">
                                {[
                                    ['allowComments', 'Permitir comentarios'],
                                    ['allowReactions', 'Permitir reacciones'],
                                    ['allowShare', 'Permitir compartir'],
                                    ['preModeration', 'Pre-moderación']
                                ].map(([key, label]) => (
                                    <button key={key} type="button" className={`ccm-toggle ${formData[key] ? 'is-on' : ''}`} onClick={() => setFormData((prev) => ({ ...prev, [key]: !prev[key] }))}>
                                        <FaCheck /> {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'rules' && (
                        <div className="ccm-panel">
                            <label className="ccm-field">
                                <span>Reglas de la comunidad</span>
                                <textarea name="rulesText" rows="7" value={formData.rulesText} onChange={handleChange} placeholder={'1. Respeto ante todo\n2. No spam\n3. Usa los canales correctos'} />
                            </label>

                            <button className="ccm-upload" onClick={() => pdfRef.current?.click()}>
                                <FaFilePdf /> {media.rulesPdf.name || 'Subir reglamento en PDF'}
                                <input type="file" ref={pdfRef} hidden accept=".pdf" onChange={handlePdf} />
                            </button>

                            <div className="ccm-toggle-grid">
                                {[
                                    ['toxicityFilter', 'Filtro de toxicidad'],
                                    ['spoilerTag', 'Etiquetado de spoilers'],
                                    ['nsfwAllowed', 'Permitir NSFW']
                                ].map(([key, label]) => (
                                    <button key={key} type="button" className={`ccm-toggle ${formData[key] ? 'is-on' : ''}`} onClick={() => setFormData((prev) => ({ ...prev, [key]: !prev[key] }))}>
                                        <FaCheck /> {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="ccm-panel">
                            <label className="ccm-field">
                                <span>Agregar admins</span>
                                <input value={adminInput} onChange={(e) => setAdminInput(e.target.value)} onKeyDown={addAdmin} placeholder="Escribe un username y pulsa Enter" />
                            </label>

                            {admins.length > 0 && (
                                <div className="ccm-admins">
                                    {admins.map((admin) => (
                                        <button key={admin} type="button" className="ccm-admin-pill" onClick={() => removeAdmin(admin)}>
                                            @{admin} <FaTimes />
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="ccm-field">
                                <span>Roles disponibles</span>
                                <div className="ccm-toggle-grid">
                                    {Object.keys(formData.roles).map((role) => (
                                        <button key={role} type="button" className={`ccm-toggle ${formData.roles[role] ? 'is-on' : ''}`} onClick={() => handleNestedCheck('roles', role)}>
                                            <FaCheck /> {role}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="ccm-panel">
                            <div className="ccm-toggle-grid">
                                {[
                                    ['emailVerification', 'Verificación por email'],
                                    ['antiSpamControl', 'Anti spam'],
                                    ['discordIntegration', 'Integración Discord'],
                                    ['welcomeEmail', 'Correo de bienvenida'],
                                    ['futureEvents', 'Eventos futuros'],
                                    ['futureTournaments', 'Torneos futuros'],
                                ].map(([key, label]) => (
                                    <button key={key} type="button" className={`ccm-toggle ${formData[key] ? 'is-on' : ''}`} onClick={() => setFormData((prev) => ({ ...prev, [key]: !prev[key] }))}>
                                        <FaCheck /> {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="ccm-footer">
                    <button className="ccm-btn ccm-btn--ghost" onClick={handleClose} disabled={isSaving}>Cancelar</button>
                    <div className="ccm-footer__actions">
                        {activeTab !== 'identity' && (
                            <button className="ccm-btn ccm-btn--ghost" onClick={goPrev} disabled={isSaving}>
                                <FaChevronLeft /> Anterior
                            </button>
                        )}
                        {activeTab !== 'settings' ? (
                            <button className="ccm-btn ccm-btn--primary" onClick={goNext} disabled={isSaving}>
                                Siguiente <FaChevronRight />
                            </button>
                        ) : (
                            <button className="ccm-btn ccm-btn--primary" onClick={handleLaunch} disabled={isSaving || !formData.name.trim()}>
                                {isSaving ? 'Creando...' : <>Lanzar comunidad <FaRocket /></>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateCommunityModal;
