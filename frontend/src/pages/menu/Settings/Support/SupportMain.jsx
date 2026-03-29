import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import { getAuthToken } from '../../../../utils/authSession';
import {
    FaChevronDown, FaSearch, FaQuestionCircle,
    FaArrowLeft, FaTimes, FaDiscord, FaHeadset, FaBook,
    FaCheckCircle, FaEnvelope, FaBug,
    FaLightbulb, FaShieldAlt, FaGamepad, FaTrophy, FaCreditCard,
    FaUser, FaExternalLinkAlt, FaMedal,
    FaCalendarAlt, FaUsers, FaUserFriends, FaUserAlt,
    FaCrown, FaCloudUploadAlt, FaTrash
} from 'react-icons/fa';
import './SupportPage.css';

const SUPPORTED_GAMES = [
    { id: 'mlbb', name: 'Mobile Legends', short: 'MLBB' },
    { id: 'valorant', name: 'Valorant', short: 'Valorant' },
    { id: 'lol', name: 'League of Legends', short: 'LoL' },
    { id: 'fortnite', name: 'Fortnite', short: 'Fortnite' },
    { id: 'warzone', name: 'Warzone', short: 'WZ' },
    { id: 'rocket', name: 'Rocket League', short: 'RL' },
    { id: 'fifa', name: 'EA FC / FIFA', short: 'EA FC' },
    { id: 'smash', name: 'Smash Bros', short: 'Smash' },
    { id: 'brawlhalla', name: 'Brawlhalla', short: 'Brawl' },
    { id: 'sf6', name: 'Street Fighter 6', short: 'SF6' },
    { id: 'tekken', name: 'Tekken 8', short: 'Tekken' },
    { id: 'freefire', name: 'Free Fire', short: 'FF' },
    { id: 'pubg', name: 'PUBG Mobile', short: 'PUBG' },
    { id: 'codm', name: 'COD Mobile', short: 'CODM' },
];

const FAQ_CATEGORIES = [
    { id: 'all', label: 'Todos', icon: FaBook },
    { id: 'account', label: 'Cuenta', icon: FaUser },
    { id: 'teams', label: 'Equipos', icon: FaGamepad },
    { id: 'tournaments', label: 'Torneos', icon: FaTrophy },
    { id: 'payments', label: 'Pagos', icon: FaCreditCard },
    { id: 'security', label: 'Seguridad', icon: FaShieldAlt },
];

const FAQS = [
    { id: 1, category: 'account', question: "¿Cómo creo mi cuenta en GLITCH GANG?", answer: "Regístrate con tu correo electrónico o inicia sesión con Google/Discord. Completa tu perfil con tu gamertag, región y juegos principales para empezar a competir." },
    { id: 2, category: 'account', question: "¿Puedo cambiar mi nombre de usuario?", answer: "Sí, puedes actualizar tu nombre de usuario desde Ajustes > Perfil. Este cambio está disponible una vez cada 30 días para evitar confusión en torneos activos." },
    { id: 3, category: 'account', question: "¿Cómo recupero mi contraseña?", answer: "En la pantalla de inicio de sesión, selecciona 'Olvidé mi contraseña'. Recibirás un enlace de restablecimiento en tu correo registrado. Si no lo recibes, revisa tu carpeta de spam." },
    { id: 4, category: 'account', question: "¿Hay límite de edad para usar GLITCH GANG?", answer: "Debes tener al menos 13 años para registrarte. Para participar en torneos con premios en efectivo, necesitas ser mayor de 18 años o contar con autorización parental verificada." },
    { id: 5, category: 'account', question: "¿Cómo elimino mi cuenta?", answer: "Dirígete a Ajustes > Seguridad > Eliminar Cuenta. Este proceso es permanente e irreversible: perderás tu historial de torneos, estadísticas y cualquier solicitud o premio pendiente asociado a la cuenta." },
    { id: 6, category: 'account', question: "¿Tienen aplicación móvil?", answer: "Actualmente estamos desarrollando la app nativa para iOS y Android. Mientras tanto, nuestra plataforma web está totalmente optimizada para dispositivos móviles desde cualquier navegador." },
    { id: 7, category: 'teams', question: "¿Cómo creo un equipo competitivo?", answer: "Navega al Hub de Equipos y selecciona 'Crear Equipo'. Define el nombre, logo, juego principal y nivel competitivo. Recibirás un código de invitación único para reclutar miembros." },
    { id: 8, category: 'teams', question: "¿Puedo pertenecer a varios equipos?", answer: "Sí, puedes ser miembro de múltiples equipos siempre que sean de juegos diferentes (ejemplo: un equipo de Valorant y otro de LoL). Esto evita conflictos en torneos del mismo título." },
    { id: 9, category: 'teams', question: "¿Cómo invito jugadores a mi equipo?", answer: "Desde el panel de gestión de tu equipo, copia el código de invitación y compártelo. Los jugadores interesados también pueden solicitar unirse directamente desde el Hub de Equipos." },
    { id: 10, category: 'teams', question: "¿Qué roles tienen los miembros del equipo?", answer: "Cada equipo tiene un Capitán (creador), Titulares, Suplentes y opcionalmente un Coach. El capitán gestiona el roster, acepta solicitudes y representa al equipo en torneos." },
    { id: 11, category: 'tournaments', question: "¿Cómo inscribo a mi equipo en un torneo?", answer: "Busca el torneo en la sección Torneos, verifica que tu equipo cumple los requisitos (juego, roster, elegibilidad y conexiones requeridas) y haz clic en 'Inscribirse'. Solo el capitán puede realizar la inscripción. En juegos Riot puede exigirse cuenta Riot vinculada y, para VALORANT, autorización previa mediante Riot Sign On." },
    { id: 12, category: 'tournaments', question: "¿Qué formatos de torneo soportan?", answer: "GLITCH GANG soporta eliminación simple, eliminación doble, round robin (todos contra todos) y formatos híbridos con fases de grupos + playoffs. El organizador define el formato al crear el torneo." },
    { id: 13, category: 'tournaments', question: "¿Qué hago si mi rival no se presenta?", answer: "Espera 15 minutos en el lobby. Si el equipo rival no aparece, toma capturas de pantalla como evidencia y repórtalas en el centro de partidos. Se otorgará victoria por W.O. (walkover) tras verificación." },
    { id: 14, category: 'tournaments', question: "¿Cómo subo los resultados de mi partida?", answer: "Al finalizar la partida, ambos capitanes deben subir una captura del marcador final en el centro de partidos del torneo. Si hay discrepancia, un administrador revisará las evidencias." },
    { id: 15, category: 'tournaments', question: "¿Qué pasa si pierdo conexión durante la partida?", answer: "Cada equipo tiene derecho a una pausa técnica de 10 minutos. Si no logras reconectar, tu equipo deberá continuar con un suplente o en desventaja numérica según las reglas del torneo." },
    { id: 16, category: 'tournaments', question: "¿Puedo ser organizador de torneos?", answer: "Sí. Desde la sección 'Crear Torneo' puedes configurar tu propio evento. Organizadores verificados acceden a herramientas avanzadas como gestión de brackets, streams integrados y premios." },
    { id: 17, category: 'tournaments', question: "¿Los torneos son para todas las regiones?", answer: "Cada torneo especifica su servidor y región (LAN, LAS, NA, EUW, etc.). Revisa los requisitos antes de inscribirte para asegurar compatibilidad de latencia y elegibilidad." },
    { id: 18, category: 'payments', question: "¿Cómo funcionan los premios en GLITCH GANG?", answer: "Los premios se validan segun el resultado oficial del torneo y luego se liquidan por el flujo habilitado para ese evento. El organizador y la plataforma pueden requerir evidencia adicional antes de liberar un premio o resolver una disputa." },
    { id: 19, category: 'payments', question: "¿Cuáles son los métodos de retiro?", answer: "Los metodos de retiro y liquidacion dependen del despliegue activo, la jurisdiccion del evento y los proveedores habilitados en ese momento. Si un torneo usa flujo financiero interno, la forma de cobro o retiro se comunica antes de publicar o participar." },
    { id: 20, category: 'payments', question: "¿GLITCH GANG cobra comisión?", answer: "Los torneos gratuitos no llevan comision de plataforma. Si un torneo de pago aplica comision, se informa antes de publicarse. En torneos Riot con inscripcion paga, el prize pool debe reflejar al menos el 70% de lo recaudado por inscripciones." },
    { id: 21, category: 'security', question: "¿Qué es el sistema de verificación anti-smurf?", answer: "Vinculamos tu cuenta real del juego para reforzar elegibilidad competitiva y reducir smurfs. En Riot usamos tu identidad Riot y, para VALORANT, el consentimiento adicional mediante Riot Sign On cuando el torneo lo requiere." },
    { id: 22, category: 'security', question: "¿Cómo reporto conducta tóxica o trampas?", answer: "Utiliza el botón 'Reportar' en el perfil del jugador o en el centro de partidos. Adjunta capturas de pantalla o clips de video como evidencia. Nuestro equipo revisa cada reporte en menos de 48 horas." },
    { id: 23, category: 'security', question: "¿Qué medidas de seguridad protegen mi cuenta?", answer: "Tu cuenta está protegida con encriptación de contraseña, tokens de sesión seguros y verificación por email. Recomendamos usar una contraseña única y no compartir tus credenciales con terceros." },
    { id: 24, category: 'security', question: "¿Qué es el Modo Streamer?", answer: "Una función en Ajustes que oculta información sensible (emails, códigos de lobby, códigos de invitación) de tu pantalla mientras transmites, para evitar stream sniping y proteger tu privacidad." },
];

const SupportPage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [activeQuestion, setActiveQuestion] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inquiry, setInquiry] = useState('');
    const [inquiryType, setInquiryType] = useState('question');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
    const [achievementData, setAchievementData] = useState({
        game: '', mode: 'team', tournamentName: '', tournamentDate: '',
        placement: 1, teamName: '', partnerName: '', description: '', proofFiles: []
    });

    const filteredFaqs = useMemo(() => {
        return FAQS.filter(faq => {
            const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, activeCategory]);

    const activeCategoryLabel = useMemo(
        () => FAQ_CATEGORIES.find((cat) => cat.id === activeCategory)?.label || 'Todos',
        [activeCategory]
    );

    const hasActiveFilters = Boolean(searchTerm.trim()) || activeCategory !== 'all';

    const faqSummary = useMemo(() => {
        const trimmedSearch = searchTerm.trim();
        if (trimmedSearch) {
            return `Resultados para "${trimmedSearch}" dentro de ${activeCategoryLabel.toLowerCase()}.`;
        }
        if (activeCategory !== 'all') {
            return `Mostrando preguntas de ${activeCategoryLabel.toLowerCase()} para resolver dudas más rápido.`;
        }
        return 'Busca respuestas sobre cuenta, equipos, torneos, pagos y seguridad desde un solo lugar.';
    }, [activeCategory, activeCategoryLabel, searchTerm]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
    };

    const toggleFaq = (id) => setActiveQuestion(activeQuestion === id ? null : id);

    const handleSubmitInquiry = async (e) => {
        e.preventDefault();
        if (!inquiry.trim()) { showToast('Por favor escribe tu mensaje', 'error'); return; }
        setIsSubmitting(true);
        try {
            const token = getAuthToken();
            await axios.post(`${API_URL}/api/auth/support/ticket`, {
                type: inquiryType,
                message: inquiry.trim(),
                subject: inquiryType === 'bug' ? 'Reporte de Bug' : inquiryType === 'suggestion' ? 'Sugerencia' : 'Consulta'
            }, { headers: { Authorization: `Bearer ${token}` } });
            setInquiry('');
            setIsModalOpen(false);
            showToast('Tu consulta ha sido enviada. Te responderemos en menos de 24 horas.');
        } catch (err) {
            showToast(err.response?.data?.message || 'Error al enviar. Intenta de nuevo.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024);
        if (validFiles.length !== files.length) showToast('Algunos archivos fueron ignorados (solo imágenes hasta 10MB)', 'error');
        const newFiles = validFiles.map(f => ({ file: f, preview: URL.createObjectURL(f), name: f.name }));
        setAchievementData(prev => ({ ...prev, proofFiles: [...prev.proofFiles, ...newFiles].slice(0, 5) }));
    };

    const removeProofFile = (index) => {
        setAchievementData(prev => ({ ...prev, proofFiles: prev.proofFiles.filter((_, i) => i !== index) }));
    };

    const handleSubmitAchievement = async (e) => {
        e.preventDefault();
        if (!achievementData.game) { showToast('Selecciona un juego', 'error'); return; }
        if (!achievementData.tournamentName.trim()) { showToast('Escribe el nombre del torneo', 'error'); return; }
        if (!achievementData.tournamentDate) { showToast('Selecciona la fecha', 'error'); return; }
        if (achievementData.proofFiles.length === 0) { showToast('Sube al menos una prueba', 'error'); return; }
        if (achievementData.mode === 'duo' && !achievementData.partnerName.trim()) { showToast('Escribe el nombre de tu compañero', 'error'); return; }
        if (achievementData.mode === 'team' && !achievementData.teamName.trim()) { showToast('Escribe el nombre del equipo', 'error'); return; }
        setIsSubmitting(true);
        try {
            const token = getAuthToken();
            await axios.post(`${API_URL}/api/auth/support/ticket`, {
                type: 'achievement',
                subject: `Logro: ${achievementData.tournamentName}`,
                message: `Juego: ${achievementData.game} | Torneo: ${achievementData.tournamentName} | Posicion: ${achievementData.placement} | Modo: ${achievementData.mode}${achievementData.description ? ' | ' + achievementData.description : ''}`,
                data: {
                    game: achievementData.game,
                    mode: achievementData.mode,
                    tournamentName: achievementData.tournamentName,
                    tournamentDate: achievementData.tournamentDate,
                    placement: achievementData.placement,
                    teamName: achievementData.teamName,
                    partnerName: achievementData.partnerName,
                    proofCount: achievementData.proofFiles.length
                }
            }, { headers: { Authorization: `Bearer ${token}` } });
            setAchievementData({ game: '', mode: 'team', tournamentName: '', tournamentDate: '', placement: 1, teamName: '', partnerName: '', description: '', proofFiles: [] });
            setIsAchievementModalOpen(false);
            showToast('Logro enviado. Nuestro equipo lo revisara en 24-48 horas.');
        } catch (err) {
            showToast(err.response?.data?.message || 'Error al enviar. Intenta de nuevo.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeAchievementModal = () => {
        if (!isSubmitting) {
            setIsAchievementModalOpen(false);
            setAchievementData({ game: '', mode: 'team', tournamentName: '', tournamentDate: '', placement: 1, teamName: '', partnerName: '', description: '', proofFiles: [] });
        }
    };

    const quickActions = [
        { icon: FaTrophy, title: 'Enviar Logro', desc: 'Reporta tus victorias en torneos', accent: 'gold', onClick: () => setIsAchievementModalOpen(true) },
        { icon: FaBook, title: 'Documentación', desc: 'Guías y tutoriales completos', accent: 'primary', onClick: () => navigate('/docs') },
        { icon: FaDiscord, title: 'Discord', desc: 'Comunidad y soporte en vivo', accent: 'discord', onClick: () => window.open('https://discord.gg/glitchgang', '_blank') },
        { icon: FaBug, title: 'Reportar Bug', desc: 'Ayúdanos a mejorar la plataforma', accent: 'warning', onClick: () => { setInquiryType('bug'); setIsModalOpen(true); } },
        { icon: FaLightbulb, title: 'Sugerencias', desc: 'Comparte tus ideas con nosotros', accent: 'info', onClick: () => { setInquiryType('suggestion'); setIsModalOpen(true); } },
    ];

    return (
        <div className="sp">
            {/* Toast */}
            {toast.show && (
                <div className={`sp-toast sp-toast--${toast.type}`}>
                    <i className={`bx ${toast.type === 'error' ? 'bx-error-circle' : 'bx-check-circle'}`}></i>
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Hero */}
            <header className="sp-hero">
                <div className="sp-hero__bg" />
                <div className="sp-hero__inner">
                    <div className="sp-hero__top">
                        <button className="sp-back" onClick={() => navigate(-1)}>
                            <FaArrowLeft /> <span>Volver</span>
                        </button>
                        <div className="sp-hero__signal">
                            <FaHeadset />
                            <span>Soporte activo</span>
                            <strong>&lt; 2h</strong>
                        </div>
                    </div>
                    <div className="sp-hero__badge">
                        <i className='bx bx-support'></i>
                    </div>
                    <h1 className="sp-hero__title">Centro de Ayuda</h1>
                    <p className="sp-hero__sub">Todo lo que necesitas para dominar GLITCH GANG</p>
                    <div className="sp-hero__games">
                        {SUPPORTED_GAMES.map((game) => (
                            <span key={game.id} className="sp-hero__game">{game.short}</span>
                        ))}
                    </div>

                    <div className="sp-hero__search">
                        <FaSearch className="sp-hero__search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar preguntas, guías, temas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="sp-hero__search-clear" onClick={() => setSearchTerm('')}>
                                <FaTimes />
                            </button>
                        )}
                    </div>

                    <div className="sp-hero__stats">
                        <div className="sp-hero__stat">
                            <strong>{FAQS.length}</strong>
                            <span>Artículos</span>
                        </div>
                        <div className="sp-hero__stat-sep" />
                        <div className="sp-hero__stat">
                            <strong>&lt; 2h</strong>
                            <span>Respuesta</span>
                        </div>
                        <div className="sp-hero__stat-sep" />
                        <div className="sp-hero__stat">
                            <strong>24/7</strong>
                            <span>Soporte</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Quick Actions */}
            <section className="sp-actions">
                <div className="sp-actions__grid">
                    {quickActions.map((a, i) => (
                        <button key={i} className={`sp-action sp-action--${a.accent}`} onClick={a.onClick} style={{ animationDelay: `${i * 0.08}s` }}>
                            <div className="sp-action__icon"><a.icon /></div>
                            <div className="sp-action__text">
                                <strong>{a.title}</strong>
                                <span>{a.desc}</span>
                            </div>
                            <FaExternalLinkAlt className="sp-action__arrow" />
                        </button>
                    ))}
                </div>
            </section>

            {/* Main Content */}
            <div className="sp-body">
                {/* FAQ */}
                <section className="sp-faq">
                    <div className="sp-faq__head">
                        <div className="sp-faq__head-copy">
                            <h2><FaQuestionCircle /> Preguntas Frecuentes</h2>
                            <p>{faqSummary}</p>
                        </div>
                        <div className="sp-faq__meta">
                            <span className="sp-faq__count">{filteredFaqs.length}</span>
                            {hasActiveFilters && (
                                <button
                                    className="sp-faq__reset"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setActiveCategory('all');
                                    }}
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="sp-faq__cats">
                        {FAQ_CATEGORIES.map(cat => {
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.id}
                                    className={`sp-cat ${activeCategory === cat.id ? 'sp-cat--active' : ''}`}
                                    onClick={() => setActiveCategory(cat.id)}
                                >
                                    <Icon /> <span>{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="sp-faq__list">
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq, index) => (
                                <div
                                    key={faq.id}
                                    className={`sp-q ${activeQuestion === faq.id ? 'sp-q--open' : ''}`}
                                    style={{ animationDelay: `${index * 0.04}s` }}
                                >
                                    <button className="sp-q__head" onClick={() => toggleFaq(faq.id)}>
                                        <span className="sp-q__num">{String(index + 1).padStart(2, '0')}</span>
                                        <span className="sp-q__text">{faq.question}</span>
                                        <span className="sp-q__chevron"><FaChevronDown /></span>
                                    </button>
                                    <div className="sp-q__body">
                                        <p>{faq.answer}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="sp-faq__empty">
                                <FaSearch />
                                <h3>Sin resultados</h3>
                                <p>Intenta con otros términos o categorías</p>
                                <button onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}>
                                    Ver todas las preguntas
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Sidebar */}
                <aside className="sp-side">
                    <div className="sp-contact">
                        <div className="sp-contact__icon"><FaHeadset /></div>
                        <h3>¿Necesitas más ayuda?</h3>
                        <p>Nuestro equipo está disponible para resolver cualquier duda que tengas sobre la plataforma.</p>
                        <button className="sp-contact__btn" onClick={() => { setInquiryType('question'); setIsModalOpen(true); }}>
                            <FaEnvelope /> Enviar Consulta
                        </button>
                        <div className="sp-contact__stats">
                            <div><strong>&lt; 2h</strong><span>Tiempo de respuesta</span></div>
                            <div><strong>98%</strong><span>Satisfacción</span></div>
                        </div>
                    </div>

                    <div className="sp-topics">
                        <h4>Temas Populares</h4>
                        <div className="sp-topics__list">
                            {['Inscripción', 'Premios', 'Verificación', 'Equipos', 'Brackets', 'Reportes'].map(tag => (
                                <button key={tag} className="sp-topics__tag" onClick={() => setSearchTerm(tag.toLowerCase())}>
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="sp-direct">
                        <h4>Contacto Directo</h4>
                        <a href="mailto:steliantsoft@gmail.com" className="sp-direct__link">
                            <FaEnvelope /> <span>steliantsoft@gmail.com</span>
                        </a>
                        <a href="https://discord.gg/glitchgang" target="_blank" rel="noopener noreferrer" className="sp-direct__link">
                            <FaDiscord /> <span>Servidor de Discord</span>
                        </a>
                    </div>
                </aside>
            </div>

            {/* ── Inquiry Modal ── */}
            {isModalOpen && (
                <div className="sp-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
                    <div className="sp-modal" onClick={e => e.stopPropagation()}>
                        <button className="sp-modal__close" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}><FaTimes /></button>
                        <div className="sp-modal__head">
                            <div className="sp-modal__badge">
                                {inquiryType === 'bug' ? <FaBug /> : inquiryType === 'suggestion' ? <FaLightbulb /> : <FaEnvelope />}
                            </div>
                            <h3>{inquiryType === 'bug' ? 'Reportar un Bug' : inquiryType === 'suggestion' ? 'Enviar Sugerencia' : 'Nueva Consulta'}</h3>
                            <p>{inquiryType === 'bug' ? 'Describe el problema con el mayor detalle posible' : inquiryType === 'suggestion' ? 'Comparte tu idea para mejorar GLITCH GANG' : 'Te responderemos en menos de 24 horas'}</p>
                        </div>
                        <form onSubmit={handleSubmitInquiry} className="sp-modal__form">
                            <div className="sp-modal__types">
                                {[
                                    { id: 'question', label: 'Pregunta', icon: FaQuestionCircle },
                                    { id: 'bug', label: 'Bug', icon: FaBug },
                                    { id: 'suggestion', label: 'Idea', icon: FaLightbulb },
                                ].map(type => (
                                    <button key={type.id} type="button" className={`sp-modal__type ${inquiryType === type.id ? 'active' : ''}`} onClick={() => setInquiryType(type.id)} disabled={isSubmitting}>
                                        <type.icon /> <span>{type.label}</span>
                                    </button>
                                ))}
                            </div>
                            <textarea
                                placeholder={inquiryType === 'bug' ? 'Describe qué pasó, qué esperabas que pasara, y los pasos para reproducirlo...' : inquiryType === 'suggestion' ? 'Cuéntanos tu idea y cómo mejoraría la plataforma...' : 'Escribe tu pregunta o consulta aquí...'}
                                value={inquiry} onChange={(e) => setInquiry(e.target.value)} disabled={isSubmitting} rows={6}
                            />
                            <div className="sp-modal__actions">
                                <button type="button" className="sp-modal__btn sp-modal__btn--ghost" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</button>
                                <button type="submit" className="sp-modal__btn sp-modal__btn--primary" disabled={isSubmitting || !inquiry.trim()}>
                                    {isSubmitting ? <><i className='bx bx-loader-alt bx-spin'></i> Enviando...</> : <><FaCheckCircle /> Enviar</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Achievement Modal ── */}
            {isAchievementModalOpen && (
                <div className="sp-overlay" onClick={closeAchievementModal}>
                    <div className="sp-modal sp-modal--lg" onClick={e => e.stopPropagation()}>
                        <button className="sp-modal__close" onClick={closeAchievementModal} disabled={isSubmitting}><FaTimes /></button>
                        <div className="sp-modal__head sp-modal__head--gold">
                            <div className="sp-modal__badge sp-modal__badge--gold"><FaTrophy /></div>
                            <h3>Enviar Logro</h3>
                            <p>Comparte tus victorias en torneos para que aparezcan en tu perfil</p>
                        </div>
                        <form onSubmit={handleSubmitAchievement} className="sp-modal__form sp-modal__form--ach">
                            <div className="sp-field">
                                <label><FaGamepad /> Juego</label>
                                <select value={achievementData.game} onChange={(e) => setAchievementData(prev => ({ ...prev, game: e.target.value }))} disabled={isSubmitting} required>
                                    <option value="">Selecciona un juego</option>
                                    {SUPPORTED_GAMES.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </div>
                            <div className="sp-field">
                                <label><FaUsers /> Modo de Competición</label>
                                <div className="sp-modes">
                                    {[{ id: 'solo', label: 'Solo', icon: FaUserAlt }, { id: 'duo', label: 'Duo', icon: FaUserFriends }, { id: 'team', label: 'Equipo', icon: FaUsers }].map(m => (
                                        <button key={m.id} type="button" className={`sp-mode ${achievementData.mode === m.id ? 'active' : ''}`} onClick={() => setAchievementData(prev => ({ ...prev, mode: m.id }))} disabled={isSubmitting}>
                                            <m.icon /> <span>{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="sp-row">
                                <div className="sp-field"><label><FaMedal /> Nombre del Torneo</label><input type="text" placeholder="Ej: Copa Nacional MLBB 2025" value={achievementData.tournamentName} onChange={(e) => setAchievementData(prev => ({ ...prev, tournamentName: e.target.value }))} disabled={isSubmitting} required /></div>
                                <div className="sp-field sp-field--sm"><label><FaCalendarAlt /> Fecha</label><input type="date" value={achievementData.tournamentDate} onChange={(e) => setAchievementData(prev => ({ ...prev, tournamentDate: e.target.value }))} disabled={isSubmitting} required /></div>
                            </div>
                            <div className="sp-row">
                                <div className="sp-field sp-field--sm">
                                    <label><FaCrown /> Posición</label>
                                    <select value={achievementData.placement} onChange={(e) => setAchievementData(prev => ({ ...prev, placement: parseInt(e.target.value) }))} disabled={isSubmitting}>
                                        <option value={1}>1er Lugar</option><option value={2}>2do Lugar</option><option value={3}>3er Lugar</option><option value={4}>4to Lugar</option><option value={5}>Top 5</option><option value={8}>Top 8</option>
                                    </select>
                                </div>
                                {achievementData.mode === 'team' && <div className="sp-field"><label><FaShieldAlt /> Nombre del Equipo</label><input type="text" placeholder="Ej: Hispaniola Esports" value={achievementData.teamName} onChange={(e) => setAchievementData(prev => ({ ...prev, teamName: e.target.value }))} disabled={isSubmitting} required /></div>}
                                {achievementData.mode === 'duo' && <div className="sp-field"><label><FaUserFriends /> Compañero</label><input type="text" placeholder="Nombre o IGN" value={achievementData.partnerName} onChange={(e) => setAchievementData(prev => ({ ...prev, partnerName: e.target.value }))} disabled={isSubmitting} required /></div>}
                            </div>
                            <div className="sp-field"><label><FaBook /> Descripción (opcional)</label><textarea placeholder="Formato del torneo, número de participantes, etc." value={achievementData.description} onChange={(e) => setAchievementData(prev => ({ ...prev, description: e.target.value }))} disabled={isSubmitting} rows={3} /></div>
                            <div className="sp-field">
                                <label><i className='bx bx-image'></i> Pruebas (máx. 5 imágenes)</label>
                                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} disabled={isSubmitting || achievementData.proofFiles.length >= 5} style={{ display: 'none' }} />
                                <div className="sp-proofs">
                                    {achievementData.proofFiles.map((f, i) => (
                                        <div key={i} className="sp-proof">
                                            <img src={f.preview} alt={`Prueba ${i + 1}`} />
                                            <button type="button" className="sp-proof__rm" onClick={() => removeProofFile(i)} disabled={isSubmitting}><FaTrash /></button>
                                        </div>
                                    ))}
                                    {achievementData.proofFiles.length < 5 && (
                                        <button type="button" className="sp-proof__add" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                                            <FaCloudUploadAlt /><span>Subir</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="sp-modal__actions">
                                <button type="button" className="sp-modal__btn sp-modal__btn--ghost" onClick={closeAchievementModal} disabled={isSubmitting}>Cancelar</button>
                                <button type="submit" className="sp-modal__btn sp-modal__btn--gold" disabled={isSubmitting}>
                                    {isSubmitting ? <><i className='bx bx-loader-alt bx-spin'></i> Enviando...</> : <><FaTrophy /> Enviar Logro</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportPage;
