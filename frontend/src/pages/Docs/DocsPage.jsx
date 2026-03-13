import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaArrowRight,
    FaBook,
    FaCheckCircle,
    FaCreditCard,
    FaGamepad,
    FaHeadset,
    FaPlayCircle,
    FaRocket,
    FaSearch,
    FaShieldAlt,
    FaTrophy,
    FaUsers,
} from 'react-icons/fa';
import './DocsPage.css';

const DOC_CATEGORIES = [
    { id: 'all', label: 'Todo', icon: FaBook },
    { id: 'inicio', label: 'Inicio', icon: FaRocket },
    { id: 'cuenta', label: 'Cuenta', icon: FaShieldAlt },
    { id: 'equipos', label: 'Equipos', icon: FaUsers },
    { id: 'torneos', label: 'Torneos', icon: FaTrophy },
    { id: 'pagos', label: 'Pagos', icon: FaCreditCard },
];

const GUIDES = [
    {
        id: 'primeros-pasos',
        category: 'inicio',
        icon: FaRocket,
        title: 'Primeros pasos en GLITCH GANG',
        summary: 'Crea tu cuenta, completa tu perfil y deja lista tu presencia competitiva en pocos minutos.',
        level: 'Basico',
        time: '5 min',
        ctaTo: '/register',
        ctaLabel: 'Crear cuenta',
        bullets: [
            'Registra tu cuenta con tus datos basicos.',
            'Completa username, foto y juego principal.',
            'Activa notificaciones para no perder mensajes ni matches.',
        ],
        steps: [
            'Abre el registro y completa los datos iniciales.',
            'Verifica tu correo si el flujo lo solicita.',
            'Entra a tu perfil y agrega tu informacion competitiva.',
            'Explora torneos, equipos y comunidad desde el menu principal.',
        ],
    },
    {
        id: 'seguridad-cuenta',
        category: 'cuenta',
        icon: FaShieldAlt,
        title: 'Seguridad y control de tu cuenta',
        summary: 'Aprende a revisar privacidad, sesiones y ajustes clave para mantener tu cuenta protegida.',
        level: 'Recomendado',
        time: '4 min',
        ctaTo: '/settings',
        ctaLabel: 'Abrir ajustes',
        bullets: [
            'Revisa sesiones activas y datos personales.',
            'Actualiza password y opciones de privacidad.',
            'Valida tus datos antes de competir o retirar premios.',
        ],
        steps: [
            'Abre la pantalla de configuracion.',
            'Revisa el bloque de seguridad y privacidad.',
            'Cierra sesiones viejas si cambiaste de dispositivo.',
            'Guarda cambios y verifica que tu cuenta quede al dia.',
        ],
    },
    {
        id: 'crear-equipo',
        category: 'equipos',
        icon: FaUsers,
        title: 'Crear y organizar un equipo',
        summary: 'Configura tu roster, roles e invitaciones desde un panel pensado para competencia.',
        level: 'Basico',
        time: '6 min',
        ctaTo: '/create-team',
        ctaLabel: 'Crear equipo',
        bullets: [
            'Define nombre, juego, region y logo.',
            'Invita jugadores con enlace o busqueda interna.',
            'Mantiene roster y disponibilidad actualizados.',
        ],
        steps: [
            'Pulsa Crear equipo desde el menu principal.',
            'Completa la informacion general del roster.',
            'Agrega capitanes, titulares y suplentes.',
            'Comparte el enlace de invitacion con tus jugadores.',
        ],
    },
    {
        id: 'inscripcion-torneo',
        category: 'torneos',
        icon: FaTrophy,
        title: 'Inscribirse a un torneo correctamente',
        summary: 'Encuentra eventos, valida reglas y registra tu equipo sin errores de ultima hora.',
        level: 'Basico',
        time: '7 min',
        ctaTo: '/torneos',
        ctaLabel: 'Ver torneos',
        bullets: [
            'Filtra por juego, region y formato.',
            'Revisa reglas, premios y horarios antes de inscribirte.',
            'Verifica que tu roster cumpla todos los requisitos.',
        ],
        steps: [
            'Abre la seccion de torneos.',
            'Selecciona el evento que te interesa.',
            'Lee reglas y requisitos del roster.',
            'Completa la inscripcion y monitorea las notificaciones.',
        ],
    },
    {
        id: 'reportar-resultados',
        category: 'torneos',
        icon: FaPlayCircle,
        title: 'Reportar resultados y subir evidencias',
        summary: 'Cierra partidos con orden y sube pruebas claras para evitar retrasos en validacion.',
        level: 'Intermedio',
        time: '3 min',
        ctaTo: '/support',
        ctaLabel: 'Ir a soporte',
        bullets: [
            'Usa capturas legibles del marcador final.',
            'Sube evidencia apenas termine la partida.',
            'Reporta problemas si el rival no se presenta o hay disputa.',
        ],
        steps: [
            'Confirma el marcador con tu rival.',
            'Sube la captura o evidencia requerida.',
            'Espera la validacion del sistema o del staff.',
            'Abre soporte si el partido queda detenido o en revision.',
        ],
    },
    {
        id: 'pagos-retiros',
        category: 'pagos',
        icon: FaCreditCard,
        title: 'Premios, pagos y retiros',
        summary: 'Entiende como se acreditan premios y que revisar antes de solicitar un retiro.',
        level: 'Importante',
        time: '5 min',
        ctaTo: '/support',
        ctaLabel: 'Hablar con soporte',
        bullets: [
            'Verifica el estado del premio antes de retirar.',
            'Confirma tus datos para evitar devoluciones.',
            'Guarda comprobantes si soporte necesita una revision.',
        ],
        steps: [
            'Revisa si tu premio ya fue validado.',
            'Confirma el metodo de retiro disponible.',
            'Solicita el retiro con los datos correctos.',
            'Da seguimiento al estado desde soporte si tarda mas de lo esperado.',
        ],
    },
];

const QUICK_LINKS = [
    { label: 'Centro de ayuda', to: '/support', icon: FaHeadset },
    { label: 'Configurar cuenta', to: '/settings', icon: FaShieldAlt },
    { label: 'Explorar torneos', to: '/torneos', icon: FaTrophy },
    { label: 'Administrar equipos', to: '/equipos', icon: FaGamepad },
];

const DocsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedGuideId, setSelectedGuideId] = useState(GUIDES[0].id);

    const filteredGuides = useMemo(() => {
        return GUIDES.filter((guide) => {
            const query = searchTerm.trim().toLowerCase();
            const matchesCategory = activeCategory === 'all' || guide.category === activeCategory;
            const matchesSearch =
                query.length === 0 ||
                guide.title.toLowerCase().includes(query) ||
                guide.summary.toLowerCase().includes(query) ||
                guide.bullets.some((bullet) => bullet.toLowerCase().includes(query));

            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchTerm]);

    const activeGuide =
        filteredGuides.find((guide) => guide.id === selectedGuideId) ||
        filteredGuides[0] ||
        GUIDES[0];

    return (
        <div className="docs-page">
            <section className="docs-hero">
                <div className="docs-hero__content">
                    <div className="docs-eyebrow">
                        <FaBook />
                        <span>Base de conocimiento</span>
                    </div>
                    <h1>Documentacion, guias y tutoriales</h1>
                    <p>
                        Reune lo esencial para empezar en GLITCH GANG, organizar tu equipo, competir en
                        torneos y resolver dudas comunes desde una sola ruta.
                    </p>

                    <div className="docs-search">
                        <FaSearch className="docs-search__icon" />
                        <input
                            type="text"
                            placeholder="Buscar una guia o un flujo..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                </div>

                <div className="docs-hero__stats">
                    <div className="docs-stat">
                        <strong>{GUIDES.length}</strong>
                        <span>Guias publicadas</span>
                    </div>
                    <div className="docs-stat">
                        <strong>24/7</strong>
                        <span>Apoyo del equipo de soporte</span>
                    </div>
                    <div className="docs-stat">
                        <strong>5 min</strong>
                        <span>Lectura promedio</span>
                    </div>
                </div>
            </section>

            <section className="docs-shell">
                <div className="docs-toolbar">
                    <div className="docs-categories">
                        {DOC_CATEGORIES.map((category) => (
                            <button
                                key={category.id}
                                type="button"
                                className={`docs-chip ${activeCategory === category.id ? 'is-active' : ''}`}
                                onClick={() => setActiveCategory(category.id)}
                            >
                                <category.icon />
                                <span>{category.label}</span>
                            </button>
                        ))}
                    </div>

                    <p className="docs-toolbar__meta">
                        {filteredGuides.length} resultado{filteredGuides.length === 1 ? '' : 's'}
                    </p>
                </div>

                <div className="docs-layout">
                    <div className="docs-guides">
                        {filteredGuides.length > 0 ? (
                            filteredGuides.map((guide) => (
                                <button
                                    key={guide.id}
                                    type="button"
                                    className={`docs-guide-card ${activeGuide.id === guide.id ? 'is-active' : ''}`}
                                    onClick={() => setSelectedGuideId(guide.id)}
                                >
                                    <div className="docs-guide-card__icon">
                                        <guide.icon />
                                    </div>
                                    <div className="docs-guide-card__body">
                                        <div className="docs-guide-card__meta">
                                            <span>{guide.level}</span>
                                            <span>{guide.time}</span>
                                        </div>
                                        <h2>{guide.title}</h2>
                                        <p>{guide.summary}</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="docs-empty">
                                <FaSearch />
                                <h2>No encontramos guias con ese filtro</h2>
                                <p>Prueba otra palabra o vuelve a la categoria general.</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setActiveCategory('all');
                                    }}
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        )}
                    </div>

                    <aside className="docs-detail">
                        <div className="docs-detail__panel">
                            <div className="docs-detail__header">
                                <div className="docs-detail__badge">
                                    <activeGuide.icon />
                                </div>
                                <div>
                                    <span className="docs-detail__kicker">{activeGuide.level}</span>
                                    <h2>{activeGuide.title}</h2>
                                </div>
                            </div>

                            <p className="docs-detail__summary">{activeGuide.summary}</p>

                            <div className="docs-detail__section">
                                <h3>Que cubre esta guia</h3>
                                <ul className="docs-checklist">
                                    {activeGuide.bullets.map((bullet) => (
                                        <li key={bullet}>
                                            <FaCheckCircle />
                                            <span>{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="docs-detail__section">
                                <h3>Tutorial paso a paso</h3>
                                <ol className="docs-steps">
                                    {activeGuide.steps.map((step) => (
                                        <li key={step}>{step}</li>
                                    ))}
                                </ol>
                            </div>

                            <Link to={activeGuide.ctaTo} className="docs-detail__cta">
                                <span>{activeGuide.ctaLabel}</span>
                                <FaArrowRight />
                            </Link>
                        </div>

                        <div className="docs-detail__panel docs-detail__panel--soft">
                            <h3>Accesos utiles</h3>
                            <div className="docs-links">
                                {QUICK_LINKS.map((link) => (
                                    <Link key={link.to} to={link.to} className="docs-link-card">
                                        <link.icon />
                                        <span>{link.label}</span>
                                        <FaArrowRight />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );
};

export default DocsPage;
