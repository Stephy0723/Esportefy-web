import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import {
    FaUser, FaGamepad, FaLock, FaSave, FaArrowLeft,
    FaCamera, FaPaintBrush, FaCheck, FaExclamationTriangle,
    FaLink, FaTwitch, FaYoutube, FaTwitter, FaInstagram, FaTiktok,
    FaBirthdayCake, FaGlobeAmericas, FaUsers, FaHandshake
} from 'react-icons/fa';
import PlayerTag from '../../../components/PlayerTag/PlayerTag';
import { PLAYER_TAGS } from '../../../data/playerTags';
import { FRAMES, BACKGROUNDS } from '../../../data/profileOptions';
import AvatarCircle from '../../../components/AvatarCircle/AvatarCircle';
import { STATUS_LIST, DEFAULT_AVATARS } from '../../../data/defaultAvatars';
import PageHud from '../../../components/PageHud/PageHud';
import { applyImageFallback, getAvatarFallback, resolveMediaUrl } from '../../../utils/media';
import './EditProfile.css';

// ─── Game assets ───
import imgLol from '../../../assets/gameImages/lol.png';
import imgMlbb from '../../../assets/gameImages/mlbb.png';
import imgHok from '../../../assets/gameImages/hok.png';
import imgMoco from '../../../assets/gameImages/moco.png';
import imgMarvel from '../../../assets/gameImages/marvel.png';
import imgFreeFire from '../../../assets/gameImages/freefire.png';
import imgFortnite from '../../../assets/gameImages/fortnite.png';
import imgCodm from '../../../assets/gameImages/codm.png';
import imgMk11 from '../../../assets/gameImages/mk11.png';
import imgMarioKart from '../../../assets/gameImages/mariokart.png';

const mobaGames = [
    { id: 'lol', name: 'League of Legends', img: imgLol },
    { id: 'mlbb', name: 'Mobile Legends', img: imgMlbb },
    { id: 'hok', name: 'Honor of Kings', img: imgHok },
    { id: 'marvel', name: 'Marvel Rivals', img: imgMarvel },
    { id: 'moco', name: 'Mo.co', img: imgMoco },
    { id: 'freefire', name: 'Free Fire', img: imgFreeFire },
    { id: 'fortnite', name: 'Fortnite', img: imgFortnite },
    { id: 'codm', name: 'CoD Mobile', img: imgCodm },
    { id: 'mk11', name: 'Mortal Kombat', img: imgMk11 },
    { id: 'mariokart', name: 'Mario Kart', img: imgMarioKart }
];

const platformsList = [
    { id: 'pc', name: 'PC', icon: 'bx-laptop' },
    { id: 'mobile', name: 'Mobile', icon: 'bx-mobile' },
    { id: 'console', name: 'Consola', icon: 'bx-joystick' }
];

const goalsList = [
    { id: 'Torneos', label: 'Torneos', icon: 'bx-joystick' },
    { id: 'Equipo', label: 'Equipo / Duo', icon: 'bx-group' },
    { id: 'Fun', label: 'Diversión', icon: 'bx-smile' }
];

const experienceLevels = [
    { id: 'Rookie', label: 'ROOKIE', desc: 'Principiante', icon: 'bx-user' },
    { id: 'Mid', label: 'MID', desc: 'Intermedio', icon: 'bx-medal' },
    { id: 'Pro', label: 'PRO', desc: 'Avanzado', icon: 'bx-trophy' }
];

const genderOptions = [
    { id: 'Masculino', label: 'Masculino' },
    { id: 'Femenino', label: 'Femenino' },
    { id: 'Otro', label: 'Otro' }
];

const countryList = [
    'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica',
    'Cuba', 'Ecuador', 'El Salvador', 'España', 'Estados Unidos', 'Guatemala',
    'Honduras', 'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú',
    'Puerto Rico', 'Rep. Dominicana', 'Uruguay', 'Venezuela'
];

const languagesList = [
    { id: 'Español', label: 'Español', flag: '🇪🇸' },
    { id: 'English', label: 'English', flag: '🇺🇸' },
    { id: 'Português', label: 'Português', flag: '🇧🇷' },
    { id: 'Français', label: 'Français', flag: '🇫🇷' },
    { id: 'Deutsch', label: 'Deutsch', flag: '🇩🇪' },
    { id: 'Italiano', label: 'Italiano', flag: '🇮🇹' }
];

const rolesList = [
    { id: 'Top', label: 'Top', icon: 'bx-shield' },
    { id: 'Jungle', label: 'Jungle', icon: 'bx-leaf' },
    { id: 'Mid', label: 'Mid', icon: 'bx-target-lock' },
    { id: 'ADC', label: 'ADC', icon: 'bx-crosshair' },
    { id: 'Support', label: 'Support', icon: 'bx-heart' },
    { id: 'Fill', label: 'Fill', icon: 'bx-shuffle' },
    { id: 'IGL', label: 'IGL', icon: 'bx-microphone' },
    { id: 'Fragger', label: 'Fragger', icon: 'bx-crosshair' },
    { id: 'Lurker', label: 'Lurker', icon: 'bx-ghost' },
    { id: 'Flex', label: 'Flex', icon: 'bx-transfer' }
];

const EditProfile = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState(null); // { type: 'success'|'error', text }
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [currentUserId, setCurrentUserId] = useState('');
    const [phoneAvailability, setPhoneAvailability] = useState({
        loading: false,
        checked: false,
        available: true,
        message: '',
        warning: false
    });

    const [formData, setFormData] = useState({
        username: '',
        userCode: '',
        fullName: '',
        country: '',
        phone: '',
        gender: 'Otro',
        birthDate: '',
        avatar: '',
        bio: '',
        selectedGames: [],
        platforms: [],
        goals: [],
        experience: [],
        languages: [],
        preferredRoles: [],
        lookingForTeam: false,
        socialLinks: { twitch: '', youtube: '', twitter: '', instagram: '', tiktok: '' },
        isProfileHidden: false,
        showPublicUserCode: true,
        selectedFrameId: 'none',
        selectedBgId: 'bg-1',
        status: 'online',
        selectedTagId: 'tag-obsidian'
    });

    const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');
    const normalizePhone = (value = '') => String(value).replace(/[^\d]/g, '');
    const isValidPhone = (value = '') => /^\d+$/.test(String(value)) && Number(value) >= 0;

    // Helpers for live preview
    const currentFrame = FRAMES.find(f => f.id === formData.selectedFrameId) || FRAMES[0];
    const currentBg = BACKGROUNDS.find(b => b.id === formData.selectedBgId) || BACKGROUNDS[0];

    // ─── Fetch profile from API (not stale localStorage) ───
    const fetchProfile = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) { navigate('/login'); return; }
            const res = await axios.get(`${API_URL}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const u = res.data;
            setCurrentUserId(u?._id || u?.id || '');
            setFormData({
                username: u.username || '',
                userCode: u.userCode || '',
                fullName: u.fullName || '',
                country: u.country || '',
                phone: u.phone || '',
                gender: u.gender || 'Otro',
                birthDate: u.birthDate ? u.birthDate.split('T')[0] : '',
                avatar: resolveMediaUrl(u.avatar) || '',
                bio: u.bio || '',
                selectedGames: Array.isArray(u.selectedGames) ? u.selectedGames : [],
                platforms: Array.isArray(u.platforms) ? u.platforms : [],
                goals: Array.isArray(u.goals) ? u.goals : [],
                experience: Array.isArray(u.experience) ? u.experience : (u.experience ? [u.experience] : []),
                languages: Array.isArray(u.languages) ? u.languages : [],
                preferredRoles: Array.isArray(u.preferredRoles) ? u.preferredRoles : [],
                lookingForTeam: u.lookingForTeam || false,
                socialLinks: {
                    twitch: u.socialLinks?.twitch || '',
                    youtube: u.socialLinks?.youtube || '',
                    twitter: u.socialLinks?.twitter || '',
                    instagram: u.socialLinks?.instagram || '',
                    tiktok: u.socialLinks?.tiktok || ''
                },
                isProfileHidden: u.isProfileHidden || false,
                showPublicUserCode: u?.privacy?.showPublicUserCode !== false,
                selectedFrameId: u.selectedFrameId || 'none',
                selectedBgId: u.selectedBgId || 'bg-1',
                status: u.status || 'online',
                selectedTagId: u.selectedTagId || 'tag-obsidian'
            });
            setPreview(resolveMediaUrl(u.avatar) || '');
            setLoading(false);
        } catch (err) {
            console.error('Error fetching profile:', err);
            if (err.response?.status === 401) navigate('/login');
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.pathname, location.state, navigate]);

    // ─── Form handlers ───
    const updateField = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        setHasChanges(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const nextValue = type === 'checkbox'
            ? checked
            : name === 'phone'
                ? normalizePhone(value)
                : value;

        if (name === 'phone') {
            setPhoneAvailability({
                loading: false,
                checked: false,
                available: true,
                message: '',
                warning: false
            });
        }

        updateField(name, nextValue);
    };

    const toggleSelection = (field, id) => {
        setFormData(prev => {
            const list = prev[field] || [];
            const newList = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
            return { ...prev, [field]: newList };
        });
        setHasChanges(true);
    };

    const selectExperience = (lvlId) => {
        // Single-select stored as array with one element
        setFormData(prev => ({ ...prev, experience: [lvlId] }));
        setHasChanges(true);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                setSaveMsg({ type: 'error', text: 'La imagen no puede superar 5MB.' });
                return;
            }
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setHasChanges(true);
        }
    };

    const selectDefaultAvatar = (src) => {
        setFormData(prev => ({ ...prev, avatar: src }));
        setPreview(src);
        setFile(null);
        setHasChanges(true);
    };

    const handleSocialChange = (platform, value) => {
        setFormData(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, [platform]: value }
        }));
        setHasChanges(true);
    };

    const checkPhoneAvailability = useCallback(async (phoneValue) => {
        const normalized = normalizePhone(phoneValue);
        if (!normalized) {
            const message = 'El teléfono es obligatorio.';
            setPhoneAvailability({
                loading: false,
                checked: true,
                available: false,
                message,
                warning: false
            });
            return { available: false, message, warning: false };
        }
        if (!isValidPhone(normalized)) {
            const message = 'El teléfono debe contener solo números y no puede ser negativo.';
            setPhoneAvailability({
                loading: false,
                checked: true,
                available: false,
                message,
                warning: false
            });
            return { available: false, message, warning: false };
        }

        setPhoneAvailability({
            loading: true,
            checked: false,
            available: true,
            message: '',
            warning: false
        });

        try {
            const token = getToken();
            const endpoints = [
                `${API_URL}/api/auth/check-phone`,
                `${API_URL}/auth/check-phone`,
                `${API_URL}/check-phone`
            ];

            let response = null;
            let lastError = null;
            for (const endpoint of endpoints) {
                try {
                    response = await axios.get(endpoint, {
                        params: {
                            phone: normalized,
                            excludeUserId: currentUserId || undefined
                        },
                        headers: token ? { Authorization: `Bearer ${token}` } : undefined
                    });
                    break;
                } catch (error) {
                    if (error?.response?.status === 404 || error?.response?.status === 405) {
                        lastError = error;
                        continue;
                    }
                    throw error;
                }
            }

            if (!response) throw lastError || new Error('No se encontró endpoint de verificación de teléfono');

            const available = Boolean(response.data?.available);
            const message = available ? '' : 'Este teléfono ya está registrado.';
            setPhoneAvailability({
                loading: false,
                checked: true,
                available,
                message,
                warning: false
            });
            return { available, message, warning: false };
        } catch (error) {
            const message = 'No se pudo verificar el teléfono ahora. Se validará al guardar.';
            console.warn('No se pudo verificar teléfono en edición:', error?.response?.status || error?.message || error);
            setPhoneAvailability({
                loading: false,
                checked: true,
                available: true,
                message,
                warning: true
            });
            return { available: true, message, warning: true };
        }
    }, [API_URL, currentUserId]);

    // ─── Save ───
    const handleSave = async (e) => {
        e.preventDefault();
        if (saving) return;

        // Basic validation
        if (!formData.username.trim()) {
            setSaveMsg({ type: 'error', text: 'El nickname es obligatorio.' });
            return;
        }
        if (!formData.fullName.trim()) {
            setSaveMsg({ type: 'error', text: 'El nombre completo es obligatorio.' });
            return;
        }
        const normalizedPhone = normalizePhone(formData.phone);
        if (!normalizedPhone) {
            setSaveMsg({ type: 'error', text: 'El teléfono es obligatorio.' });
            return;
        }
        if (!isValidPhone(normalizedPhone)) {
            setSaveMsg({ type: 'error', text: 'El teléfono debe contener solo números y no puede ser negativo.' });
            return;
        }

        const phoneValidation = await checkPhoneAvailability(normalizedPhone);
        if (!phoneValidation.available) {
            setSaveMsg({ type: 'error', text: phoneValidation.message || 'Este teléfono ya está registrado.' });
            return;
        }

        setSaving(true);
        setSaveMsg(null);
        const token = getToken();
        // Only send fields that the backend allowedFields supports
        const data = new FormData();

        // String fields
        const stringFields = [
            'username', 'fullName', 'country', 'phone', 'gender',
            'avatar', 'bio', 'status', 'selectedFrameId', 'selectedBgId', 'selectedTagId'
        ];
        stringFields.forEach(key => {
            const val = key === 'phone' ? normalizedPhone : formData[key];
            if (val !== undefined && val !== null && val !== '') {
                data.append(key, val);
            }
        });

        // Date fields — only send if valid (not empty)
        if (formData.birthDate) {
            data.append('birthDate', formData.birthDate);
        }

        // Array fields — send as comma-separated (backend splits on comma)
        const arrayFields = [
            'selectedGames',
            'platforms',
            'goals',
            'experience',
            'languages',
            'preferredRoles'
        ];
        arrayFields.forEach(key => {
            const val = formData[key];
            if (Array.isArray(val)) {
                data.append(key, val.join(','));
            }
        });

        // Boolean fields — always send, so user can also disable them
        data.append('lookingForTeam', String(Boolean(formData.lookingForTeam)));
        data.append('isProfileHidden', String(Boolean(formData.isProfileHidden)));
        data.append('showPublicUserCode', String(Boolean(formData.showPublicUserCode)));

        // Social links — send as JSON payload
        data.append('socialLinks', JSON.stringify({
            twitch: formData.socialLinks?.twitch || '',
            youtube: formData.socialLinks?.youtube || '',
            twitter: formData.socialLinks?.twitter || '',
            instagram: formData.socialLinks?.instagram || '',
            tiktok: formData.socialLinks?.tiktok || ''
        }));

        if (file) data.append('avatarFile', file);

        try {
            const res = await axios.put(`${API_URL}/api/auth/update-profile`, data, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            // Sync localStorage for other components
            localStorage.setItem('esportefyUser', JSON.stringify(res.data));
            sessionStorage.setItem('esportefyUser', JSON.stringify(res.data));
            window.dispatchEvent(new Event('user-update'));
            setSaveMsg({ type: 'success', text: '¡Perfil actualizado correctamente!' });
            setHasChanges(false);
            setFile(null);
            // Refresh formData from response
            const u = res.data;
            setFormData(prev => ({
                ...prev,
                avatar: resolveMediaUrl(u.avatar) || prev.avatar,
                bio: u.bio ?? prev.bio,
                fullName: u.fullName ?? prev.fullName,
                username: u.username ?? prev.username,
                userCode: u.userCode ?? prev.userCode,
                country: u.country ?? prev.country,
                phone: u.phone ?? prev.phone,
                gender: u.gender ?? prev.gender,
                birthDate: u.birthDate ? String(u.birthDate).split('T')[0] : prev.birthDate,
                selectedGames: Array.isArray(u.selectedGames) ? u.selectedGames : prev.selectedGames,
                platforms: Array.isArray(u.platforms) ? u.platforms : prev.platforms,
                goals: Array.isArray(u.goals) ? u.goals : prev.goals,
                experience: Array.isArray(u.experience) ? u.experience : prev.experience,
                languages: Array.isArray(u.languages) ? u.languages : prev.languages,
                preferredRoles: Array.isArray(u.preferredRoles) ? u.preferredRoles : prev.preferredRoles,
                lookingForTeam: typeof u.lookingForTeam === 'boolean' ? u.lookingForTeam : prev.lookingForTeam,
                isProfileHidden: typeof u.isProfileHidden === 'boolean' ? u.isProfileHidden : prev.isProfileHidden,
                showPublicUserCode: u?.privacy?.showPublicUserCode !== false,
                socialLinks: {
                    twitch: u.socialLinks?.twitch ?? prev.socialLinks.twitch,
                    youtube: u.socialLinks?.youtube ?? prev.socialLinks.youtube,
                    twitter: u.socialLinks?.twitter ?? prev.socialLinks.twitter,
                    instagram: u.socialLinks?.instagram ?? prev.socialLinks.instagram,
                    tiktok: u.socialLinks?.tiktok ?? prev.socialLinks.tiktok
                },
                selectedFrameId: u.selectedFrameId || prev.selectedFrameId,
                selectedBgId: u.selectedBgId || prev.selectedBgId,
                selectedTagId: u.selectedTagId || prev.selectedTagId,
                status: u.status || prev.status,
            }));
            if (u.avatar) setPreview(resolveMediaUrl(u.avatar));
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al guardar los cambios.';
            setSaveMsg({ type: 'error', text: msg });
        } finally {
            setSaving(false);
            // Auto-clear success message
            setTimeout(() => setSaveMsg(null), 4000);
        }
    };

    if (loading) {
        return (
            <div className="ep__loading">
                <div className="ep__spinner" />
                <p>Cargando perfil...</p>
            </div>
        );
    }

    return (
        <div className="ep fade-in">
            <PageHud page="EDITAR PERFIL" />
            {/* Top bar */}
            <div className="ep__topbar">
                <button className="ep__back" onClick={() => navigate('/profile')}>
                    <FaArrowLeft /> Volver al Perfil
                </button>
                {hasChanges && <span className="ep__unsaved">Cambios sin guardar</span>}
            </div>

            <div className="ep__layout">
                {/* Sidebar */}
                <aside className="ep__sidebar">
                    <h2>Editar Perfil</h2>
                    <nav>
                        {[
                            { id: 'general', icon: <FaUser />, label: 'General' },
                            { id: 'social', icon: <FaLink />, label: 'Social' },
                            { id: 'customization', icon: <FaPaintBrush />, label: 'Personalización' },
                            { id: 'gamer', icon: <FaGamepad />, label: 'Perfil Gamer' },
                            { id: 'privacy', icon: <FaLock />, label: 'Privacidad' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                className={activeTab === tab.id ? 'active' : ''}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Content */}
                <main className="ep__content">
                    <form onSubmit={handleSave}>

                        {/* ═══ TAB: GENERAL ═══ */}
                        {activeTab === 'general' && (
                            <div className="ep__tab fade-in">
                                <h3>Información Personal</h3>

                                {/* Avatar section */}
                                <div className="ep__avatar-section">
                                    <img
                                        src={resolveMediaUrl(preview || formData.avatar) || `https://ui-avatars.com/api/?name=${formData.username}`}
                                        alt="Avatar"
                                        className="ep__avatar-preview"
                                        onError={(e) => applyImageFallback(e, getAvatarFallback(formData.username))}
                                    />
                                    <div className="ep__avatar-actions">
                                        <label className="ep__upload-btn">
                                            <FaCamera /> Subir Foto
                                            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                        </label>
                                        <input
                                            type="text"
                                            name="avatar"
                                            value={formData.avatar}
                                            onChange={handleChange}
                                            placeholder="O pega una URL de imagen..."
                                            className="ep__url-input"
                                        />
                                        <span className="ep__file-hint">JPG, PNG o GIF. Máx 5MB.</span>
                                    </div>
                                </div>

                                {/* Default avatars */}
                                <label className="ep__label">Avatares Predeterminados</label>
                                <div className="ep__default-avatars">
                                    {DEFAULT_AVATARS.map(av => (
                                        <button
                                            key={av.id}
                                            type="button"
                                            className={`ep__default-av ${formData.avatar === av.src ? 'active' : ''}`}
                                            onClick={() => selectDefaultAvatar(av.src)}
                                            title={av.name}
                                        >
                                            <img src={av.src} alt={av.name} />
                                            <span>{av.name}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Form fields */}
                                <div className="ep__fields-grid">
                                    <div className="ep__field">
                                        <label>Nickname <span className="ep__req">*</span></label>
                                        <input type="text" name="username" value={formData.username} onChange={handleChange} maxLength={20} />
                                    </div>
                                    <div className="ep__field">
                                        <label>Nombre Completo <span className="ep__req">*</span></label>
                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} />
                                    </div>
                                    <div className="ep__field">
                                        <label>País</label>
                                        <select name="country" value={formData.country} onChange={handleChange}>
                                            <option value="">Seleccionar...</option>
                                            {countryList.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="ep__field">
                                        <label>Teléfono</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            onBlur={() => checkPhoneAvailability(formData.phone)}
                                            placeholder="Solo números (sin + ni espacios)"
                                            className={phoneAvailability.checked && !phoneAvailability.available ? 'ep__input-error' : ''}
                                        />
                                        {phoneAvailability.loading && (
                                            <span className="ep__helper-text"><i className='bx bx-loader-alt bx-spin'></i> Verificando teléfono...</span>
                                        )}
                                        {phoneAvailability.checked && !phoneAvailability.available && (
                                            <span className="ep__error-text"><i className='bx bx-error-circle'></i> {phoneAvailability.message}</span>
                                        )}
                                        {phoneAvailability.warning && (
                                            <span className="ep__helper-text"><i className='bx bx-info-circle'></i> {phoneAvailability.message}</span>
                                        )}
                                    </div>
                                    <div className="ep__field">
                                        <label>Fecha de Nacimiento</label>
                                        <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="ep__date-input" />
                                    </div>
                                    <div className="ep__field">
                                        <label>Género</label>
                                        <div className="ep__gender-row">
                                            {genderOptions.map(g => (
                                                <button
                                                    key={g.id}
                                                    type="button"
                                                    className={`ep__gender-btn ${formData.gender === g.id ? 'active' : ''}`}
                                                    onClick={() => updateField('gender', g.id)}
                                                >
                                                    {g.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Bio */}
                                <div className="ep__field ep__field--full">
                                    <label>Biografía</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        placeholder="Cuéntanos sobre ti, tu estilo de juego, tus metas..."
                                        rows={4}
                                        maxLength={300}
                                    />
                                    <span className="ep__char-count">{formData.bio.length}/300</span>
                                </div>
                            </div>
                        )}

                        {/* ═══ TAB: SOCIAL & CONEXIONES ═══ */}
                        {activeTab === 'social' && (
                            <div className="ep__tab fade-in">
                                <h3>Social & Conexiones</h3>

                                {/* Social links */}
                                <label className="ep__label">Redes Sociales</label>
                                <p className="ep__label-desc">Agrega tus redes para que otros jugadores te encuentren.</p>
                                <div className="ep__social-grid">
                                    {[
                                        { key: 'twitch', icon: <FaTwitch />, placeholder: 'tu_canal', color: '#9146FF', prefix: 'twitch.tv/' },
                                        { key: 'youtube', icon: <FaYoutube />, placeholder: '@tu_canal', color: '#FF0000', prefix: 'youtube.com/' },
                                        { key: 'twitter', icon: <FaTwitter />, placeholder: '@usuario', color: '#1DA1F2', prefix: 'x.com/' },
                                        { key: 'instagram', icon: <FaInstagram />, placeholder: '@usuario', color: '#E4405F', prefix: 'instagram.com/' },
                                        { key: 'tiktok', icon: <FaTiktok />, placeholder: '@usuario', color: '#00f2ea', prefix: 'tiktok.com/@' },
                                    ].map(social => (
                                        <div key={social.key} className="ep__social-item">
                                            <div className="ep__social-icon" style={{ color: social.color }}>
                                                {social.icon}
                                            </div>
                                            <div className="ep__social-input-wrap">
                                                <span className="ep__social-prefix">{social.prefix}</span>
                                                <input
                                                    type="text"
                                                    value={formData.socialLinks[social.key]}
                                                    onChange={e => handleSocialChange(social.key, e.target.value)}
                                                    placeholder={social.placeholder}
                                                    className="ep__social-input"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Languages */}
                                <label className="ep__label">Idiomas</label>
                                <p className="ep__label-desc">¿En qué idiomas puedes comunicarte con tu equipo?</p>
                                <div className="ep__chips-row">
                                    {languagesList.map(lang => (
                                        <div
                                            key={lang.id}
                                            className={`ep__chip ep__chip--lang ${formData.languages.includes(lang.id) ? 'selected' : ''}`}
                                            onClick={() => toggleSelection('languages', lang.id)}
                                        >
                                            <span className="ep__chip-flag">{lang.flag}</span> {lang.label}
                                        </div>
                                    ))}
                                </div>

                                {/* Looking for team */}
                                <label className="ep__label">Búsqueda de Equipo</label>
                                <div className="ep__lft-card">
                                    <div className="ep__lft-info">
                                        <FaUsers className="ep__lft-icon" />
                                        <div>
                                            <h4>Buscando Equipo / Duo</h4>
                                            <p>Activa esto para que otros jugadores y organizadores sepan que estás disponible.</p>
                                        </div>
                                    </div>
                                    <label className="ep__switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.lookingForTeam}
                                            onChange={e => updateField('lookingForTeam', e.target.checked)}
                                        />
                                        <span className="ep__switch-slider" />
                                    </label>
                                    {formData.lookingForTeam && (
                                        <div className="ep__lft-active">
                                            <FaHandshake /> Visible para reclutadores
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ═══ TAB: CUSTOMIZATION ═══ */}
                        {activeTab === 'customization' && (
                            <div className="ep__tab fade-in">
                                <h3>Estilo Visual</h3>

                                {/* Live preview */}
                                <div className="ep__live-preview" style={{ backgroundImage: `url(${currentBg.src})` }}>
                                    <div className="ep__preview-overlay" />
                                    <div className="ep__preview-center">
                                        <AvatarCircle
                                            src={resolveMediaUrl(preview || formData.avatar) || `https://ui-avatars.com/api/?name=${formData.username}`}
                                            frameConfig={currentFrame}
                                            size="120px"
                                            status={formData.status}
                                        />
                                        <div style={{ marginTop: '15px' }}>
                                            <PlayerTag
                                                name={formData.username || "Player"}
                                                tagId={formData.selectedTagId}
                                                size="normal"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Status selector */}
                                <label className="ep__label">Tu Estado</label>
                                <div className="ep__status-grid">
                                    {STATUS_LIST.map(status => (
                                        <button
                                            key={status.id}
                                            type="button"
                                            className={`ep__status-btn ${formData.status === status.id ? 'active' : ''}`}
                                            onClick={() => updateField('status', status.id)}
                                            style={{ '--status-color': status.color }}
                                        >
                                            <span className="ep__status-indicator">
                                                <span className="ep__status-dot-bg" style={{ backgroundColor: status.color }} />
                                                <i className={`bx ${status.icon}`} style={{ color: status.color }} />
                                            </span>
                                            <span className="ep__status-text">
                                                <span className="ep__status-label">{status.label}</span>
                                                <span className="ep__status-desc">{status.desc}</span>
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Player tags */}
                                <label className="ep__label">Placa de Jugador</label>
                                <div className="ep__tags-grid">
                                    {PLAYER_TAGS.map(tag => (
                                        <div
                                            key={tag.id}
                                            className={`ep__tag-option ${formData.selectedTagId === tag.id ? 'active' : ''}`}
                                            onClick={() => updateField('selectedTagId', tag.id)}
                                        >
                                            <PlayerTag name="Preview" tagId={tag.id} size="small" />
                                        </div>
                                    ))}
                                </div>

                                {/* Frame selector */}
                                <label className="ep__label">Marco de Avatar</label>
                                <div className="ep__frames-grid">
                                    {FRAMES.map(frame => (
                                        <div
                                            key={frame.id}
                                            className={`ep__frame-card ${formData.selectedFrameId === frame.id ? 'active' : ''}`}
                                            onClick={() => updateField('selectedFrameId', frame.id)}
                                        >
                                            <div className="ep__frame-preview">
                                                {frame.type === 'image' ? (
                                                    <img src={frame.src} alt={frame.name} />
                                                ) : (
                                                    <div className="ep__frame-dot" style={{ borderColor: frame.color || '#555' }} />
                                                )}
                                            </div>
                                            <span>{frame.name}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Background selector */}
                                <label className="ep__label">Fondo de Perfil</label>
                                <div className="ep__bg-grid">
                                    {BACKGROUNDS.map(bg => (
                                        <div
                                            key={bg.id}
                                            className={`ep__bg-card ${formData.selectedBgId === bg.id ? 'active' : ''}`}
                                            onClick={() => updateField('selectedBgId', bg.id)}
                                        >
                                            <img src={bg.src} alt={bg.name} loading="lazy" />
                                            {formData.selectedBgId === bg.id && <div className="ep__bg-check"><FaCheck /></div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ═══ TAB: GAMER ═══ */}
                        {activeTab === 'gamer' && (
                            <div className="ep__tab fade-in">
                                <h3>Perfil de Jugador</h3>

                                {/* Experience level */}
                                <label className="ep__label">Nivel de Experiencia</label>
                                <div className="ep__levels-row">
                                    {experienceLevels.map(lvl => (
                                        <div
                                            key={lvl.id}
                                            className={`ep__level-card ${formData.experience.includes(lvl.id) ? 'selected' : ''}`}
                                            onClick={() => selectExperience(lvl.id)}
                                        >
                                            <i className={`bx ${lvl.icon} ep__level-icon`} />
                                            <div className="ep__level-info">
                                                <span className="ep__level-label">{lvl.label}</span>
                                                <span className="ep__level-desc">{lvl.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Preferred Roles */}
                                <label className="ep__label">Roles Preferidos</label>
                                <p className="ep__label-desc">Selecciona los roles que sueles jugar.</p>
                                <div className="ep__roles-grid">
                                    {rolesList.map(role => (
                                        <div
                                            key={role.id}
                                            className={`ep__role-chip ${formData.preferredRoles.includes(role.id) ? 'selected' : ''}`}
                                            onClick={() => toggleSelection('preferredRoles', role.id)}
                                        >
                                            <i className={`bx ${role.icon}`} />
                                            <span>{role.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Games */}
                                <label className="ep__label">Tus Juegos</label>
                                <div className="ep__games-grid">
                                    {mobaGames.map(game => (
                                        <div
                                            key={game.id}
                                            className={`ep__game-card ${formData.selectedGames.includes(game.id) ? 'selected' : ''}`}
                                            onClick={() => toggleSelection('selectedGames', game.id)}
                                        >
                                            <div className="ep__game-img"><img src={game.img} alt={game.name} /></div>
                                            <span>{game.name}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Platforms */}
                                <label className="ep__label">Plataformas</label>
                                <div className="ep__chips-row">
                                    {platformsList.map(p => (
                                        <div
                                            key={p.id}
                                            className={`ep__chip ${formData.platforms.includes(p.id) ? 'selected' : ''}`}
                                            onClick={() => toggleSelection('platforms', p.id)}
                                        >
                                            <i className={`bx ${p.icon}`} /> {p.name}
                                        </div>
                                    ))}
                                </div>

                                {/* Goals */}
                                <label className="ep__label">¿Qué buscas?</label>
                                <div className="ep__chips-row">
                                    {goalsList.map(goal => (
                                        <div
                                            key={goal.id}
                                            className={`ep__chip ${formData.goals.includes(goal.id) ? 'selected' : ''}`}
                                            onClick={() => toggleSelection('goals', goal.id)}
                                        >
                                            <i className={`bx ${goal.icon}`} /> {goal.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ═══ TAB: PRIVACY ═══ */}
                        {activeTab === 'privacy' && (
                            <div className="ep__tab fade-in">
                                <h3>Privacidad</h3>
                                <div className="ep__privacy-option ep__privacy-option--id">
                                    <div>
                                        <h4>Tu ID</h4>
                                        <p>
                                            Este código único te permite que otros te encuentren rápido:
                                            <strong className="ep__user-code-label"> ID {formData.userCode || 'Generando...'}</strong>
                                        </p>
                                    </div>
                                </div>
                                <div className="ep__privacy-option">
                                    <div>
                                        <h4>Mostrar ID públicamente</h4>
                                        <p>Si lo desactivas, tu ID no aparecerá en búsquedas ni listados públicos.</p>
                                    </div>
                                    <button
                                        type="button"
                                        className={`ep__toggle-btn ${formData.showPublicUserCode ? 'is-on' : 'is-off'}`}
                                        onClick={() => updateField('showPublicUserCode', !formData.showPublicUserCode)}
                                    >
                                        {formData.showPublicUserCode ? 'Visible' : 'Oculto'}
                                    </button>
                                </div>
                                <div className="ep__privacy-option">
                                    <div>
                                        <h4>Ocultar Perfil</h4>
                                        <p>Nadie podrá ver tu perfil en búsquedas globales.</p>
                                    </div>
                                    <label className="ep__switch">
                                        <input type="checkbox" name="isProfileHidden" checked={formData.isProfileHidden} onChange={handleChange} />
                                        <span className="ep__switch-slider" />
                                    </label>
                                </div>
                                <div className="ep__privacy-alert">
                                    <h4>Zona de Seguridad</h4>
                                    <p>Para cambiar contraseña o email, usa la sección de <strong>Configuración</strong>.</p>
                                    <button type="button" className="ep__btn-link" onClick={() => navigate('/settings')}>
                                        Ir a Configuración
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Save bar */}
                        <div className="ep__save-bar">
                            {saveMsg && (
                                <div className={`ep__toast ep__toast--${saveMsg.type}`}>
                                    {saveMsg.type === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
                                    {saveMsg.text}
                                </div>
                            )}
                            <button type="submit" className="ep__save-btn" disabled={saving}>
                                {saving ? (
                                    <><div className="ep__save-spinner" /> Guardando...</>
                                ) : (
                                    <><FaSave /> Guardar Cambios</>
                                )}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
};

export default EditProfile;
