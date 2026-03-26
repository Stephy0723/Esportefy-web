import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTimes,
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
import {
    COMMUNITY_SOCIAL_FIELDS,
    getSuggestedCommunityWebsite,
    isRiotCommunitySelection
} from '../communitySocials';
import { useNotification } from '../../../../context/NotificationContext';
import {
    COMMUNITY_AUDIENCE_OPTIONS,
    COMMUNITY_CONTENT_CATEGORY_DEFAULTS,
    COMMUNITY_GAME_NAMES,
    COMMUNITY_LANGUAGE_OPTIONS,
    COMMUNITY_POST_TYPE_DEFAULTS,
    COMMUNITY_REGION_OPTIONS,
    COMMUNITY_REPORT_REASON_DEFAULTS,
    COMMUNITY_ROLE_DEFAULTS,
    COMMUNITY_ROLE_OPTIONS,
    COMMUNITY_SOCIAL_LINK_DEFAULTS,
    COMMUNITY_WHO_CAN_POST_OPTIONS
} from '../../../../../../shared/communityCatalog.js';
import './CreateCommunityModal.css';

const AVAILABLE_GAMES = [...COMMUNITY_GAME_NAMES];
const TAB_ORDER = ['identity', 'content', 'rules', 'team', 'settings'];

const StepperBar = ({ activeTab }) => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    return (
        <div className="ccm-stepper">
            {TAB_ORDER.map((tab, i) => (
                <div key={tab} className={`ccm-stepper__step ${i <= currentIndex ? 'is-done' : ''} ${i === currentIndex ? 'is-current' : ''}`}>
                    <div className="ccm-stepper__circle">
                        {i < currentIndex ? <FaCheck /> : <span>{i + 1}</span>}
                    </div>
                    {i < TAB_ORDER.length - 1 && (
                        <div className={`ccm-stepper__line ${i < currentIndex ? 'is-filled' : ''}`} />
                    )}
                </div>
            ))}
        </div>
    );
};

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
        name: '',
        shortUrl: '',
        description: '',
        type: 'Mixta',
        targetAudience: 'Mixto',
        language: 'Español',
        region: 'LATAM',
        launchDate: '',
        socialLinks: { ...COMMUNITY_SOCIAL_LINK_DEFAULTS },
        mainGames: [],
        allowAllGames: false,
        contentCategories: { ...COMMUNITY_CONTENT_CATEGORY_DEFAULTS },
        contentProhibited: '',
        postTypes: { ...COMMUNITY_POST_TYPE_DEFAULTS },
        whoCanPost: 'all',
        allowComments: true,
        preModeration: false,
        allowReactions: true,
        allowShare: true,
        roles: { ...COMMUNITY_ROLE_DEFAULTS },
        rulesText: '',
        toxicityFilter: true,
        spoilerTag: true,
        nsfwAllowed: false,
        reportReasons: { ...COMMUNITY_REPORT_REASON_DEFAULTS },
        emailVerification: true,
        antiSpamControl: true,
        discordIntegration: false,
        welcomeEmail: true,
        futureEvents: false,
        futureTournaments: false
    });
    const [media, setMedia] = useState({
        banner: { file: null, preview: null },
        rulesPdf: { file: null, name: '' }
    });
    const [adminInput, setAdminInput] = useState('');
    const [admins, setAdmins] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const bannerRef = useRef(null);
    const pdfRef = useRef(null);

    const resolvedSlug = useMemo(
        () => formData.shortUrl || slugify(formData.name),
        [formData.shortUrl, formData.name]
    );
    const suggestedWebsite = useMemo(
        () => getSuggestedCommunityWebsite(formData.mainGames),
        [formData.mainGames]
    );
    const isRiotCommunity = useMemo(
        () => isRiotCommunitySelection(formData.mainGames),
        [formData.mainGames]
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

    const handleSocialLinkChange = (key, value) => {
        setFormData((prev) => ({
            ...prev,
            socialLinks: {
                ...(prev.socialLinks || {}),
                [key]: value
            }
        }));
    };

    const handleImage = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setMedia((prev) => ({
            ...prev,
            banner: { file, preview: URL.createObjectURL(file) }
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
            setShowSuccess(true);
            await new Promise(r => setTimeout(r, 1800));
            navigate(`/communities/${created.shortUrl}`);
        } catch (error) {
            addToast(error?.response?.data?.message || 'No se pudo crear la comunidad', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="ccm-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onClick={(e) => e.target === e.currentTarget && handleClose()}
                >
                    <motion.div
                        className="ccm-modal"
                        initial={{ opacity: 0, y: 30, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.96 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    >
                        <AnimatePresence>
                            {showSuccess && (
                                <motion.div
                                    className="ccm-success"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', damping: 20 }}
                                >
                                    <div className="ccm-success__icon"><FaCheck /></div>
                                    <h3>Comunidad creada</h3>
                                    <p>Redirigiendo...</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="ccm-header">
                            <div className="ccm-header__copy">
                                <span className="ccm-kicker">Crear comunidad</span>
                                <h3>Usa el formulario que ya preparaste y publícala de una vez</h3>
                            </div>
                            <button type="button" className="ccm-close" onClick={handleClose} disabled={isSaving}>
                                <FaTimes />
                            </button>
                        </div>

                        <StepperBar activeTab={activeTab} />

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
                                    type="button"
                                    className={`ccm-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                    disabled={isSaving}
                                >
                                    <tab.icon />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="ccm-body">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    {activeTab === 'identity' && (
                                        <div className="ccm-panel">
                                            <div className="ccm-media">
                                                <button
                                                    type="button"
                                                    className="ccm-banner"
                                                    onClick={() => bannerRef.current?.click()}
                                                    style={{ backgroundImage: media.banner.preview ? `url(${media.banner.preview})` : 'none' }}
                                                >
                                                    {!media.banner.preview && <span><FaImage /> Subir banner</span>}
                                                    <input type="file" ref={bannerRef} hidden accept="image/*" onChange={handleImage} />
                                                </button>
                                            </div>

                                            <label className="ccm-field">
                                                <span>Nombre público</span>
                                                <input name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Valorant LATAM Oficial" />
                                            </label>

                                            <label className="ccm-field">
                                                <span>URL corta</span>
                                                <input name="shortUrl" value={formData.shortUrl} onChange={handleChange} placeholder="valorant-latam" />
                                                <small>Resultado: /communities/{resolvedSlug || 'tu-slug'}</small>
                                            </label>

                                            <label className="ccm-field">
                                                <span>Descripción pública</span>
                                                <textarea
                                                    name="description"
                                                    rows="4"
                                                    value={formData.description}
                                                    onChange={handleChange}
                                                    placeholder="¿Qué es esta comunidad y para quién?"
                                                />
                                            </label>

                                            <div className="ccm-grid">
                                                <label className="ccm-field">
                                                    <span>Región</span>
                                                    <select name="region" value={formData.region} onChange={handleChange}>
                                                        {COMMUNITY_REGION_OPTIONS.map((option) => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="ccm-field">
                                                    <span>Idioma</span>
                                                    <select name="language" value={formData.language} onChange={handleChange}>
                                                        {COMMUNITY_LANGUAGE_OPTIONS.map((option) => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                            </div>

                                            <div className="ccm-field">
                                                <span>Redes y enlaces</span>
                                                <small>Solo mostraremos los enlaces que llenes. Todo es opcional.</small>
                                                {isRiotCommunity && (
                                                    <small>
                                                        Si esta comunidad es de Riot, puedes usar el sitio oficial del juego y dejar solo las redes que realmente existan.
                                                    </small>
                                                )}
                                                {suggestedWebsite?.url && !String(formData.socialLinks?.website || '').trim() && (
                                                    <button
                                                        type="button"
                                                        className="ccm-btn ccm-btn--ghost"
                                                        onClick={() => handleSocialLinkChange('website', suggestedWebsite.url)}
                                                    >
                                                        Usar sitio oficial de {suggestedWebsite.gameName}
                                                    </button>
                                                )}
                                            </div>

                                            <div className="ccm-grid">
                                                {COMMUNITY_SOCIAL_FIELDS.map((field) => (
                                                    <label key={field.key} className="ccm-field">
                                                        <span>{field.label}</span>
                                                        <input
                                                            value={formData.socialLinks?.[field.key] || ''}
                                                            onChange={(e) => handleSocialLinkChange(field.key, e.target.value)}
                                                            placeholder={field.placeholder}
                                                        />
                                                    </label>
                                                ))}
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
                                                        {COMMUNITY_WHO_CAN_POST_OPTIONS.map((option) => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="ccm-field">
                                                    <span>Audiencia</span>
                                                    <select name="targetAudience" value={formData.targetAudience} onChange={handleChange}>
                                                        {COMMUNITY_AUDIENCE_OPTIONS.map((option) => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
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

                                            <button type="button" className="ccm-upload" onClick={() => pdfRef.current?.click()}>
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
                                                    {COMMUNITY_ROLE_OPTIONS.map((role) => (
                                                        <button key={role.value} type="button" className={`ccm-toggle ${formData.roles[role.value] ? 'is-on' : ''}`} onClick={() => handleNestedCheck('roles', role.value)}>
                                                            <FaCheck /> {role.label}
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
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="ccm-footer">
                            <button type="button" className="ccm-btn ccm-btn--ghost" onClick={handleClose} disabled={isSaving}>Cancelar</button>
                            <div className="ccm-footer__actions">
                                {activeTab !== 'identity' && (
                                    <button type="button" className="ccm-btn ccm-btn--ghost" onClick={goPrev} disabled={isSaving}>
                                        <FaChevronLeft /> Anterior
                                    </button>
                                )}
                                {activeTab !== 'settings' ? (
                                    <button type="button" className="ccm-btn ccm-btn--primary" onClick={goNext} disabled={isSaving}>
                                        Siguiente <FaChevronRight />
                                    </button>
                                ) : (
                                    <button type="button" className="ccm-btn ccm-btn--primary" onClick={handleLaunch} disabled={isSaving || !formData.name.trim()}>
                                        {isSaving ? 'Creando...' : <>Lanzar comunidad <FaRocket /></>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CreateCommunityModal;
