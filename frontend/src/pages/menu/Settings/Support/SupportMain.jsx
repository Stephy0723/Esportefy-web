import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaChevronDown, FaChevronUp, FaSearch, FaQuestionCircle, 
    FaArrowLeft, FaTimes, FaDiscord, FaHeadset, FaBook,
    FaExclamationTriangle, FaCheckCircle, FaEnvelope, FaBug,
    FaLightbulb, FaShieldAlt, FaGamepad, FaTrophy, FaCreditCard,
    FaUser, FaCog, FaExternalLinkAlt, FaMedal, FaUpload, FaImage,
    FaCalendarAlt, FaUsers, FaUserFriends, FaUserAlt, FaAward,
    FaCrown, FaCloudUploadAlt, FaFileImage, FaTrash
} from 'react-icons/fa';
import './SupportPage.css';

// All supported games
const SUPPORTED_GAMES = [
    { id: 'mlbb', name: 'Mobile Legends: Bang Bang', short: 'MLBB' },
    { id: 'freefire', name: 'Free Fire', short: 'Free Fire' },
    { id: 'valorant', name: 'Valorant', short: 'Valorant' },
    { id: 'lol', name: 'League of Legends', short: 'LoL' },
    { id: 'eafc', name: 'EA Sports FC', short: 'EA FC' },
    { id: 'fortnite', name: 'Fortnite', short: 'Fortnite' },
    { id: 'pubgm', name: 'PUBG Mobile', short: 'PUBG Mobile' },
    { id: 'codm', name: 'Call of Duty Mobile', short: 'COD Mobile' },
    { id: 'apexmobile', name: 'Apex Legends Mobile', short: 'Apex Mobile' },
    { id: 'clashofclans', name: 'Clash of Clans', short: 'CoC' },
    { id: 'clashroyale', name: 'Clash Royale', short: 'Clash Royale' },
    { id: 'rocketleague', name: 'Rocket League', short: 'Rocket League' },
    { id: 'csgo', name: 'Counter-Strike 2', short: 'CS2' },
    { id: 'dota2', name: 'Dota 2', short: 'Dota 2' },
    { id: 'overwatch', name: 'Overwatch 2', short: 'OW2' },
    { id: 'smashbros', name: 'Super Smash Bros', short: 'Smash' },
    { id: 'tekken', name: 'Tekken 8', short: 'Tekken' },
    { id: 'sf6', name: 'Street Fighter 6', short: 'SF6' },
    { id: 'other', name: 'Otro Juego', short: 'Otro' },
];

// FAQ Categories with icons
const FAQ_CATEGORIES = [
    { id: 'all', label: 'Todos', icon: FaBook },
    { id: 'account', label: 'Cuenta', icon: FaUser },
    { id: 'teams', label: 'Equipos', icon: FaGamepad },
    { id: 'tournaments', label: 'Torneos', icon: FaTrophy },
    { id: 'payments', label: 'Pagos', icon: FaCreditCard },
    { id: 'security', label: 'Seguridad', icon: FaShieldAlt },
];

// Enhanced FAQs with categories
const FAQS = [
    { id: 1, category: 'teams', question: "¿Cómo creo un equipo competitivo?", answer: "Ve al menú 'Equipos' > 'Crear Equipo'. Necesitarás definir un nombre, subir un logo y elegir el juego principal. Recibirás un link para invitar a tus jugadores." },
    { id: 2, category: 'payments', question: "¿Cómo funcionan los premios?", answer: "Los premios se depositan automáticamente en la 'Wallet' del capitán una vez validado el resultado. El capitán es responsable de repartirlo." },
    { id: 3, category: 'teams', question: "¿Puedo estar en varios equipos?", answer: "Sí, puedes pertenecer a múltiples equipos siempre que sean de juegos diferentes (ej: uno de LoL y otro de Valorant)." },
    { id: 4, category: 'security', question: "¿Qué es el Nivel de Verificación?", answer: "Es nuestro sistema anti-smurf. Vinculamos tu ID real del juego para asegurar que tu rango coincida con la categoría del torneo." },
    { id: 5, category: 'tournaments', question: "¿Cómo me inscribo a un torneo?", answer: "Busca el torneo en la pestaña 'Torneos', asegúrate de que tu equipo cumpla los requisitos y haz clic en 'Inscribirse'. El capitán debe realizar esta acción." },
    { id: 6, category: 'tournaments', question: "¿Qué hago si mi rival no se presenta?", answer: "Debes esperar 15 minutos en el lobby. Si no aparecen, toma una captura de pantalla y súbela en el chat del partido para reclamar victoria por W.O." },
    { id: 7, category: 'security', question: "¿Cómo reportar una conducta tóxica?", answer: "Usa el botón de 'Reportar' en el perfil del jugador o al finalizar la partida. Adjunta pruebas visuales para agilizar el proceso." },
    { id: 8, category: 'payments', question: "¿Cuáles son los métodos de retiro?", answer: "Actualmente soportamos PayPal, transferencias bancarias locales y criptomonedas (USDT). El mínimo de retiro es de $10 USD." },
    { id: 9, category: 'account', question: "¿Puedo cambiar mi nombre de usuario?", answer: "Sí, puedes cambiarlo una vez cada 30 días desde la configuración de tu perfil." },
    { id: 10, category: 'tournaments', question: "¿Qué pasa si se cae mi conexión?", answer: "Cada equipo tiene derecho a 10 minutos de pausa técnica. Si no logras reconectar, tu equipo deberá jugar con un suplente o en desventaja." },
    { id: 11, category: 'tournaments', question: "¿Cómo subo los resultados?", answer: "Al terminar la partida, el sistema intentará detectarlo automáticamente. Si falla, ambos capitanes deben subir una captura del marcador final." },
    { id: 12, category: 'account', question: "¿Hay límite de edad?", answer: "Debes tener al menos 13 años para registrarte. Para torneos con premios en efectivo, se requiere ser mayor de 18 años o tener consentimiento parental." },
    { id: 13, category: 'teams', question: "¿Cómo invito amigos a mi equipo?", answer: "Desde el panel de gestión de tu equipo, copia el 'Link de Invitación' y envíalo. El enlace expira en 24 horas por seguridad." },
    { id: 14, category: 'account', question: "¿Olvidé mi contraseña, cómo la recupero?", answer: "En la pantalla de Login, pulsa 'Olvidé mi contraseña'. Te enviaremos un correo para restablecerla." },
    { id: 15, category: 'tournaments', question: "¿Puedo ser organizador de torneos?", answer: "Sí, puedes aplicar para ser Organizador Verificado desde el menú 'Crear Torneo'. Revisaremos tu solicitud en 48 horas." },
    { id: 16, category: 'security', question: "¿Qué es el Modo Streamer?", answer: "Es una función en Ajustes que oculta información sensible (emails, códigos de lobby) de tu pantalla para evitar stream sniping." },
    { id: 17, category: 'account', question: "¿Cómo elimino mi cuenta?", answer: "Debes solicitarlo en Ajustes > Seguridad > Eliminar Cuenta. Este proceso es irreversible y perderás tus estadísticas." },
    { id: 18, category: 'tournaments', question: "¿Los torneos son para todas las regiones?", answer: "Depende del torneo. Cada evento especifica su servidor (ej: NA, LAN, LAS, EUW). Revisa las reglas antes de inscribirte." },
    { id: 19, category: 'payments', question: "¿Cobran comisión por participar?", answer: "La inscripción suele ser gratuita o de pago según el torneo. Esportefy retiene una pequeña comisión (10%) solo sobre los premios generados para mantenimiento." },
    { id: 20, category: 'account', question: "¿Tienen aplicación móvil?", answer: "Actualmente estamos desarrollando la App para iOS y Android. Por ahora, nuestra web es 100% responsiva en navegadores móviles." },
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

    // Achievement Modal States
    const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
    const [achievementData, setAchievementData] = useState({
        game: '',
        mode: 'team', // solo, duo, team
        tournamentName: '',
        tournamentDate: '',
        placement: 1,
        teamName: '',
        partnerName: '',
        description: '',
        proofFiles: []
    });

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    // Filter FAQs
    const filteredFaqs = useMemo(() => {
        return FAQS.filter(faq => {
            const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, activeCategory]);

    // Show toast
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
    };

    // Handle FAQ toggle
    const toggleFaq = (id) => {
        setActiveQuestion(activeQuestion === id ? null : id);
    };

    // Handle form submit
    const handleSubmitInquiry = async (e) => {
        e.preventDefault();
        if (!inquiry.trim()) {
            showToast('Por favor escribe tu mensaje', 'error');
            return;
        }
        
        setIsSubmitting(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsSubmitting(false);
        setInquiry('');
        setIsModalOpen(false);
        showToast('✅ ¡Tu consulta ha sido enviada! Te responderemos en menos de 24 horas.');
    };

    // Handle file selection for achievements
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => {
            const isImage = file.type.startsWith('image/');
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB max
            return isImage && isValidSize;
        });

        if (validFiles.length !== files.length) {
            showToast('Algunos archivos fueron ignorados (solo imágenes de hasta 10MB)', 'error');
        }

        const newFiles = validFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name
        }));

        setAchievementData(prev => ({
            ...prev,
            proofFiles: [...prev.proofFiles, ...newFiles].slice(0, 5) // Max 5 files
        }));
    };

    // Remove proof file
    const removeProofFile = (index) => {
        setAchievementData(prev => ({
            ...prev,
            proofFiles: prev.proofFiles.filter((_, i) => i !== index)
        }));
    };

    // Handle achievement submission
    const handleSubmitAchievement = async (e) => {
        e.preventDefault();

        // Validation
        if (!achievementData.game) {
            showToast('Selecciona un juego', 'error');
            return;
        }
        if (!achievementData.tournamentName.trim()) {
            showToast('Escribe el nombre del torneo', 'error');
            return;
        }
        if (!achievementData.tournamentDate) {
            showToast('Selecciona la fecha del torneo', 'error');
            return;
        }
        if (achievementData.proofFiles.length === 0) {
            showToast('Sube al menos una prueba de tu victoria', 'error');
            return;
        }
        if (achievementData.mode === 'duo' && !achievementData.partnerName.trim()) {
            showToast('Escribe el nombre de tu compañero de duo', 'error');
            return;
        }
        if (achievementData.mode === 'team' && !achievementData.teamName.trim()) {
            showToast('Escribe el nombre de tu equipo', 'error');
            return;
        }

        setIsSubmitting(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setIsSubmitting(false);
        setAchievementData({
            game: '',
            mode: 'team',
            tournamentName: '',
            tournamentDate: '',
            placement: 1,
            teamName: '',
            partnerName: '',
            description: '',
            proofFiles: []
        });
        setIsAchievementModalOpen(false);
        showToast('🏆 ¡Logro enviado! Nuestro equipo lo revisará en 24-48 horas.');
    };

    // Reset achievement modal
    const closeAchievementModal = () => {
        if (!isSubmitting) {
            setIsAchievementModalOpen(false);
            setAchievementData({
                game: '',
                mode: 'team',
                tournamentName: '',
                tournamentDate: '',
                placement: 1,
                teamName: '',
                partnerName: '',
                description: '',
                proofFiles: []
            });
        }
    };

    // Quick actions
    const quickActions = [
        { 
            icon: FaTrophy, 
            title: 'Enviar Logro', 
            desc: 'Reporta tus victorias',
            color: 'gold',
            onClick: () => setIsAchievementModalOpen(true)
        },
        { 
            icon: FaBook, 
            title: 'Documentación', 
            desc: 'Guías completas y tutoriales',
            color: 'primary',
            onClick: () => window.open('/docs', '_blank')
        },
        { 
            icon: FaDiscord, 
            title: 'Discord', 
            desc: 'Soporte en tiempo real',
            color: 'discord',
            onClick: () => window.open('https://discord.gg/esportefy', '_blank')
        },
        { 
            icon: FaBug, 
            title: 'Reportar Bug', 
            desc: 'Ayúdanos a mejorar',
            color: 'warning',
            onClick: () => { setInquiryType('bug'); setIsModalOpen(true); }
        },
        { 
            icon: FaLightbulb, 
            title: 'Sugerencias', 
            desc: 'Comparte tus ideas',
            color: 'info',
            onClick: () => { setInquiryType('suggestion'); setIsModalOpen(true); }
        },
    ];

    return (
        <motion.div 
            className="sp-page"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Toast */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div 
                        className={`sp-toast sp-toast--${toast.type}`}
                        initial={{ opacity: 0, y: -30, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -30 }}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.header className="sp-header" variants={itemVariants}>
                <button className="sp-back-btn" onClick={() => navigate(-1)}>
                    <FaArrowLeft />
                    <span>Volver</span>
                </button>
                
                <div className="sp-header__content">
                    <div className="sp-header__icon">
                        <FaHeadset />
                    </div>
                    <h1>Centro de Ayuda</h1>
                    <p>Encuentra respuestas, reporta problemas y conecta con nuestro equipo</p>
                </div>

                {/* Search Bar */}
                <div className="sp-search">
                    <FaSearch className="sp-search__icon" />
                    <input 
                        type="text"
                        placeholder="Buscar en la base de conocimiento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="sp-search__clear" onClick={() => setSearchTerm('')}>
                            <FaTimes />
                        </button>
                    )}
                </div>
            </motion.header>

            {/* Quick Actions */}
            <motion.section className="sp-quick-actions" variants={itemVariants}>
                <h2 className="sp-section-title">
                    <FaExclamationTriangle />
                    Acciones Rápidas
                </h2>
                <div className="sp-quick-actions__grid">
                    {quickActions.map((action, index) => (
                        <motion.div
                            key={index}
                            className={`sp-action-card sp-action-card--${action.color}`}
                            onClick={action.onClick}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="sp-action-card__icon">
                                <action.icon />
                            </div>
                            <div className="sp-action-card__content">
                                <h3>{action.title}</h3>
                                <p>{action.desc}</p>
                            </div>
                            <FaExternalLinkAlt className="sp-action-card__arrow" />
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* Main Content */}
            <div className="sp-main">
                {/* FAQ Section */}
                <motion.section className="sp-faq" variants={itemVariants}>
                    <h2 className="sp-section-title">
                        <FaQuestionCircle />
                        Preguntas Frecuentes
                        <span className="sp-section-title__count">{filteredFaqs.length}</span>
                    </h2>

                    {/* Category Tabs */}
                    <div className="sp-faq__categories">
                        {FAQ_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                className={`sp-category-btn ${activeCategory === cat.id ? 'sp-category-btn--active' : ''}`}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                <cat.icon />
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* FAQ List */}
                    <div className="sp-faq__list">
                        <AnimatePresence mode="popLayout">
                            {filteredFaqs.length > 0 ? (
                                filteredFaqs.map((faq, index) => (
                                    <motion.div
                                        key={faq.id}
                                        className={`sp-faq-item ${activeQuestion === faq.id ? 'sp-faq-item--active' : ''}`}
                                        onClick={() => toggleFaq(faq.id)}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ delay: index * 0.03 }}
                                        layout
                                    >
                                        <div className="sp-faq-item__question">
                                            <span className="sp-faq-item__number">{String(index + 1).padStart(2, '0')}</span>
                                            <span className="sp-faq-item__text">{faq.question}</span>
                                            <motion.div
                                                className="sp-faq-item__chevron"
                                                animate={{ rotate: activeQuestion === faq.id ? 180 : 0 }}
                                            >
                                                <FaChevronDown />
                                            </motion.div>
                                        </div>
                                        <AnimatePresence>
                                            {activeQuestion === faq.id && (
                                                <motion.div 
                                                    className="sp-faq-item__answer"
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <p>{faq.answer}</p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div 
                                    className="sp-faq__empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <FaSearch />
                                    <h3>No encontramos resultados</h3>
                                    <p>Intenta con otros términos o categorías</p>
                                    <button onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}>
                                        Ver todas las preguntas
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.section>

                {/* Contact Sidebar */}
                <motion.aside className="sp-sidebar" variants={itemVariants}>
                    {/* Still need help card */}
                    <div className="sp-contact-card">
                        <div className="sp-contact-card__icon">
                            <FaHeadset />
                        </div>
                        <h3>¿Necesitas más ayuda?</h3>
                        <p>Nuestro equipo está disponible 24/7 para resolver tus dudas</p>
                        
                        <button 
                            className="sp-contact-card__btn"
                            onClick={() => { setInquiryType('question'); setIsModalOpen(true); }}
                        >
                            <FaEnvelope />
                            Enviar Consulta
                        </button>

                        <div className="sp-contact-card__stats">
                            <div className="sp-contact-card__stat">
                                <span className="sp-contact-card__stat-value">&lt; 2h</span>
                                <span className="sp-contact-card__stat-label">Tiempo de respuesta</span>
                            </div>
                            <div className="sp-contact-card__stat">
                                <span className="sp-contact-card__stat-value">98%</span>
                                <span className="sp-contact-card__stat-label">Satisfacción</span>
                            </div>
                        </div>
                    </div>

                    {/* Popular Topics */}
                    <div className="sp-popular">
                        <h4>Temas Populares</h4>
                        <div className="sp-popular__tags">
                            {['Torneos', 'Pagos', 'Verificación', 'Equipos', 'Reportes'].map(tag => (
                                <button 
                                    key={tag}
                                    className="sp-popular__tag"
                                    onClick={() => setSearchTerm(tag.toLowerCase())}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Contact info */}
                    <div className="sp-contact-info">
                        <h4>Contacto Directo</h4>
                        <a href="mailto:soporte@esportefy.com" className="sp-contact-info__item">
                            <FaEnvelope />
                            <span>soporte@esportefy.com</span>
                        </a>
                        <a href="https://discord.gg/esportefy" target="_blank" rel="noopener noreferrer" className="sp-contact-info__item">
                            <FaDiscord />
                            <span>Discord Server</span>
                        </a>
                    </div>
                </motion.aside>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div 
                        className="sp-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !isSubmitting && setIsModalOpen(false)}
                    >
                        <motion.div 
                            className="sp-modal"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button 
                                className="sp-modal__close"
                                onClick={() => setIsModalOpen(false)}
                                disabled={isSubmitting}
                            >
                                <FaTimes />
                            </button>

                            <div className="sp-modal__header">
                                <div className="sp-modal__icon">
                                    {inquiryType === 'bug' ? <FaBug /> : 
                                     inquiryType === 'suggestion' ? <FaLightbulb /> : <FaEnvelope />}
                                </div>
                                <h3>
                                    {inquiryType === 'bug' ? 'Reportar un Bug' : 
                                     inquiryType === 'suggestion' ? 'Enviar Sugerencia' : 'Nueva Consulta'}
                                </h3>
                                <p>
                                    {inquiryType === 'bug' ? 'Describe el problema lo más detallado posible' : 
                                     inquiryType === 'suggestion' ? 'Comparte tu idea para mejorar Esportefy' : 
                                     'Te responderemos en menos de 24 horas'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmitInquiry} className="sp-modal__form">
                                {/* Type selector */}
                                <div className="sp-modal__types">
                                    {[
                                        { id: 'question', label: 'Pregunta', icon: FaQuestionCircle },
                                        { id: 'bug', label: 'Bug', icon: FaBug },
                                        { id: 'suggestion', label: 'Idea', icon: FaLightbulb },
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            className={`sp-modal__type ${inquiryType === type.id ? 'sp-modal__type--active' : ''}`}
                                            onClick={() => setInquiryType(type.id)}
                                            disabled={isSubmitting}
                                        >
                                            <type.icon />
                                            <span>{type.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    placeholder={
                                        inquiryType === 'bug' ? 'Describe qué pasó, qué esperabas que pasara, y los pasos para reproducirlo...' :
                                        inquiryType === 'suggestion' ? 'Cuéntanos tu idea y cómo crees que mejoraría la plataforma...' :
                                        'Escribe tu pregunta o consulta aquí...'
                                    }
                                    value={inquiry}
                                    onChange={(e) => setInquiry(e.target.value)}
                                    disabled={isSubmitting}
                                    rows={6}
                                />

                                <div className="sp-modal__footer">
                                    <button 
                                        type="button"
                                        className="sp-modal__btn sp-modal__btn--ghost"
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        className="sp-modal__btn sp-modal__btn--primary"
                                        disabled={isSubmitting || !inquiry.trim()}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <i className='bx bx-loader-alt spin' />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <FaCheckCircle />
                                                Enviar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Achievement Submission Modal */}
            <AnimatePresence>
                {isAchievementModalOpen && (
                    <motion.div 
                        className="sp-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAchievementModal}
                    >
                        <motion.div 
                            className="sp-modal sp-modal--achievement"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button 
                                className="sp-modal__close"
                                onClick={closeAchievementModal}
                                disabled={isSubmitting}
                            >
                                <FaTimes />
                            </button>

                            <div className="sp-modal__header sp-modal__header--achievement">
                                <div className="sp-modal__icon sp-modal__icon--gold">
                                    <FaTrophy />
                                </div>
                                <h3>Enviar Logro</h3>
                                <p>Comparte tus victorias en torneos para que aparezcan en tu perfil</p>
                            </div>

                            <form onSubmit={handleSubmitAchievement} className="sp-modal__form sp-achievement-form">
                                {/* Game Selection */}
                                <div className="sp-form-group">
                                    <label><FaGamepad /> Juego</label>
                                    <select 
                                        value={achievementData.game}
                                        onChange={(e) => setAchievementData(prev => ({ ...prev, game: e.target.value }))}
                                        disabled={isSubmitting}
                                        required
                                    >
                                        <option value="">Selecciona un juego</option>
                                        {SUPPORTED_GAMES.map(game => (
                                            <option key={game.id} value={game.id}>{game.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Mode Selection */}
                                <div className="sp-form-group">
                                    <label><FaUsers /> Modo de Competición</label>
                                    <div className="sp-mode-selector">
                                        {[
                                            { id: 'solo', label: 'Solo', icon: FaUserAlt },
                                            { id: 'duo', label: 'Duo', icon: FaUserFriends },
                                            { id: 'team', label: 'Equipo', icon: FaUsers },
                                        ].map(mode => (
                                            <button
                                                key={mode.id}
                                                type="button"
                                                className={`sp-mode-btn ${achievementData.mode === mode.id ? 'sp-mode-btn--active' : ''}`}
                                                onClick={() => setAchievementData(prev => ({ ...prev, mode: mode.id }))}
                                                disabled={isSubmitting}
                                            >
                                                <mode.icon />
                                                <span>{mode.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tournament Info Row */}
                                <div className="sp-form-row">
                                    <div className="sp-form-group">
                                        <label><FaMedal /> Nombre del Torneo</label>
                                        <input 
                                            type="text"
                                            placeholder="Ej: Copa Nacional MLBB 2025"
                                            value={achievementData.tournamentName}
                                            onChange={(e) => setAchievementData(prev => ({ ...prev, tournamentName: e.target.value }))}
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </div>
                                    <div className="sp-form-group sp-form-group--small">
                                        <label><FaCalendarAlt /> Fecha</label>
                                        <input 
                                            type="date"
                                            value={achievementData.tournamentDate}
                                            onChange={(e) => setAchievementData(prev => ({ ...prev, tournamentDate: e.target.value }))}
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Placement Row */}
                                <div className="sp-form-row">
                                    <div className="sp-form-group sp-form-group--small">
                                        <label><FaCrown /> Posición</label>
                                        <select 
                                            value={achievementData.placement}
                                            onChange={(e) => setAchievementData(prev => ({ ...prev, placement: parseInt(e.target.value) }))}
                                            disabled={isSubmitting}
                                        >
                                            <option value={1}>🥇 1er Lugar</option>
                                            <option value={2}>🥈 2do Lugar</option>
                                            <option value={3}>🥉 3er Lugar</option>
                                            <option value={4}>4to Lugar</option>
                                            <option value={5}>Top 5</option>
                                            <option value={8}>Top 8</option>
                                            <option value={10}>Top 10</option>
                                            <option value={16}>Top 16</option>
                                        </select>
                                    </div>

                                    {/* Conditional: Team Name */}
                                    {achievementData.mode === 'team' && (
                                        <div className="sp-form-group">
                                            <label><FaShieldAlt /> Nombre del Equipo</label>
                                            <input 
                                                type="text"
                                                placeholder="Ej: Hispaniola Esports"
                                                value={achievementData.teamName}
                                                onChange={(e) => setAchievementData(prev => ({ ...prev, teamName: e.target.value }))}
                                                disabled={isSubmitting}
                                                required={achievementData.mode === 'team'}
                                            />
                                        </div>
                                    )}

                                    {/* Conditional: Partner Name */}
                                    {achievementData.mode === 'duo' && (
                                        <div className="sp-form-group">
                                            <label><FaUserFriends /> Compañero de Duo</label>
                                            <input 
                                                type="text"
                                                placeholder="Nombre o IGN del compañero"
                                                value={achievementData.partnerName}
                                                onChange={(e) => setAchievementData(prev => ({ ...prev, partnerName: e.target.value }))}
                                                disabled={isSubmitting}
                                                required={achievementData.mode === 'duo'}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="sp-form-group">
                                    <label><FaBook /> Descripción (opcional)</label>
                                    <textarea
                                        placeholder="Cuéntanos más sobre este logro, formato del torneo, número de participantes, etc."
                                        value={achievementData.description}
                                        onChange={(e) => setAchievementData(prev => ({ ...prev, description: e.target.value }))}
                                        disabled={isSubmitting}
                                        rows={3}
                                    />
                                </div>

                                {/* Proof Upload */}
                                <div className="sp-form-group">
                                    <label><FaImage /> Pruebas de Victoria (máx. 5 imágenes)</label>
                                    <div className="sp-proof-upload">
                                        <input 
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileSelect}
                                            disabled={isSubmitting || achievementData.proofFiles.length >= 5}
                                            style={{ display: 'none' }}
                                        />
                                        
                                        <div className="sp-proof-grid">
                                            {achievementData.proofFiles.map((file, index) => (
                                                <div key={index} className="sp-proof-item">
                                                    <img src={file.preview} alt={`Prueba ${index + 1}`} />
                                                    <button 
                                                        type="button"
                                                        className="sp-proof-remove"
                                                        onClick={() => removeProofFile(index)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            ))}
                                            
                                            {achievementData.proofFiles.length < 5 && (
                                                <button 
                                                    type="button"
                                                    className="sp-proof-add"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isSubmitting}
                                                >
                                                    <FaCloudUploadAlt />
                                                    <span>Subir prueba</span>
                                                </button>
                                            )}
                                        </div>
                                        
                                        <p className="sp-proof-hint">
                                            Sube capturas del scoreboard, bracket, certificado o cualquier imagen que demuestre tu victoria.
                                        </p>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="sp-modal__footer">
                                    <button 
                                        type="button"
                                        className="sp-modal__btn sp-modal__btn--ghost"
                                        onClick={closeAchievementModal}
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        className="sp-modal__btn sp-modal__btn--gold"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <i className='bx bx-loader-alt spin' />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <FaTrophy />
                                                Enviar Logro
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SupportPage;