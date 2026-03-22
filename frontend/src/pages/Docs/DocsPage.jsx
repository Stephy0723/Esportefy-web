import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaArrowRight,
    FaBell,
    FaBook,
    FaCheckCircle,
    FaCreditCard,
    FaGamepad,
    FaHeadset,
    FaMedal,
    FaNewspaper,
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
    { id: 'perfil', label: 'Perfil', icon: FaMedal },
    { id: 'equipos', label: 'Equipos', icon: FaUsers },
    { id: 'torneos', label: 'Torneos', icon: FaTrophy },
    { id: 'contenido', label: 'Contenido', icon: FaNewspaper },
    { id: 'pagos', label: 'Pagos', icon: FaCreditCard },
];

const POINT_LEVELS = [
    { name: 'Rookie', minPoints: 0 },
    { name: 'Aspirante', minPoints: 200 },
    { name: 'Competidor', minPoints: 500 },
    { name: 'Estratega', minPoints: 900 },
    { name: 'Capitan', minPoints: 1400 },
    { name: 'Elite', minPoints: 2000 },
    { name: 'Campeon', minPoints: 2600 },
    { name: 'Leyenda', minPoints: 3200 },
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
        id: 'sistema-puntos',
        category: 'perfil',
        icon: FaMedal,
        title: 'Como se distribuyen los puntos del perfil',
        summary: 'Consulta las fuentes reales del sistema, los umbrales de nivel y que acciones pesan mas dentro del progreso competitivo.',
        level: 'Importante',
        time: '6 min',
        ctaTo: '/edit-profile',
        ctaLabel: 'Ver progreso',
        bullets: [
            'Los puntos se recalculan automaticamente a partir de acciones reales dentro de la plataforma.',
            'El sistema actual usa 19 fuentes de puntos y 20 logros con progreso visible.',
            'El bloque competitivo es el que mas empuja tu nivel frente al perfil visual o la actividad social.',
        ],
        steps: [
            'Abre Editar perfil para revisar tu total, nivel actual y progreso por fuente.',
            'Completa datos base, bio, juegos, roles, idiomas y cuentas vinculadas para cerrar la parte de perfil.',
            'Suma comunidades, amistades y publicaciones para crecer la parte social.',
            'Participa en torneos, juega partidas oficiales, gana matches y consigue titulos para subir mas rapido.',
        ],
        highlights: [
            { label: 'Fuentes activas', value: '19', note: 'Perfil, social, equipos y competitivo.' },
            { label: 'Logros', value: '20', note: 'Se desbloquean con progreso real.' },
            { label: 'Niveles', value: '8', note: 'Van de Rookie a Leyenda.' },
            { label: 'Maximo teorico', value: '3308 pts', note: 'Con la configuracion vigente del sistema.' },
        ],
        detailGroups: [
            {
                title: 'Distribucion actual',
                items: [
                    { label: 'Perfil', value: 'hasta 208 pts' },
                    { label: 'Social', value: 'hasta 300 pts' },
                    { label: 'Equipos', value: 'hasta 300 pts' },
                    { label: 'Competitivo', value: 'hasta 2500 pts' },
                ],
            },
            {
                title: 'Fuentes que mas pesan',
                items: [
                    { label: 'Titulos de campeon', value: '250 pts por titulo, max 1250' },
                    { label: 'Torneos jugados', value: '100 pts por torneo, max 500' },
                    { label: 'Victorias oficiales', value: '50 pts por victoria, max 500' },
                    { label: 'Capitanias', value: '75 pts por equipo liderado, max 150' },
                ],
            },
            {
                title: 'Niveles vigentes',
                items: POINT_LEVELS.map((level) => ({
                    label: level.name,
                    value: `desde ${level.minPoints} pts`,
                })),
            },
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
        id: 'crear-noticias',
        category: 'contenido',
        icon: FaNewspaper,
        title: 'Crear y publicar noticias',
        summary: 'Publica al feed desde el editor interno con imagenes locales, resumen automatico y control de categoria, juego y portada.',
        level: 'Editor',
        time: '5 min',
        ctaTo: '/noticias',
        ctaLabel: 'Abrir noticias',
        bullets: [
            'El boton Crear noticia vive dentro del modulo de noticias.',
            'Solo pueden publicar usuarios admin o con rol content-creator.',
            'El resumen del feed y los bloques de detalle se generan automaticamente desde el texto base.',
        ],
        steps: [
            'Entra a Noticias y pulsa Crear noticia.',
            'Completa titular, categoria, juego y decide si quieres marcarla como primicia.',
            'Sube una imagen principal, agrega galeria opcional, tags y el texto base completo.',
            'Revisa la previsualizacion y publica para que la noticia entre al feed.',
        ],
        highlights: [
            { label: 'Permisos', value: 'Admin o content-creator', note: 'Sin ese rol el boton queda bloqueado.' },
            { label: 'Minimo para publicar', value: 'Titular + imagen + contenido', note: 'Es lo que el flujo valida antes de guardar.' },
            { label: 'Imagenes', value: 'JPG, PNG o WEBP', note: 'Cada archivo debe pesar menos de 8MB.' },
            { label: 'Galeria', value: 'Hasta 5 extras', note: 'La portada se maneja aparte.' },
        ],
        detailGroups: [
            {
                title: 'Campos del editor',
                items: [
                    { label: 'Texto', value: 'titular, autor, empresa, fecha y tags' },
                    { label: 'Clasificacion', value: 'categoria, juego y bandera de primicia' },
                    { label: 'Media', value: 'portada obligatoria y galeria opcional' },
                    { label: 'Contenido', value: 'texto base para resumen y detalle automatico' },
                ],
            },
            {
                title: 'Datos utiles del modulo',
                items: [
                    { label: 'Ruta', value: '/noticias' },
                    { label: 'Categorias', value: 'Torneos, Competitivo, Eventos, Institucional y Equipos' },
                    { label: 'Juegos', value: 'MLBB, Valorant, LoL o Multigame' },
                    { label: 'Publicacion', value: 'entra al feed apenas se guarda' },
                ],
            },
        ],
    },
    {
        id: 'newsletter-alertas',
        category: 'contenido',
        icon: FaBell,
        title: 'Newsletter y alertas de noticias',
        summary: 'Activa correos y usa el buzon para seguir el feed sin perder resumenes, publicaciones nuevas o movimientos del modulo.',
        level: 'Util',
        time: '3 min',
        ctaTo: '/noticias',
        ctaLabel: 'Ver newsletter',
        bullets: [
            'La suscripcion al newsletter se hace desde la misma pagina de noticias.',
            'La app tambien puede dejar avisos dentro del buzon cuando llegan resumenes o noticias nuevas.',
            'Puedes darte de baja desde el enlace de cancelacion que llega al correo.',
        ],
        steps: [
            'Abre Noticias y baja hasta el bloque Newsletter.',
            'Escribe tu correo y confirma la suscripcion.',
            'Consulta el feed o tus notificaciones cuando llegue un resumen o una noticia nueva.',
            'Si ya no lo quieres, usa el enlace de baja del correo para cancelar.',
        ],
        highlights: [
            { label: 'Alta', value: 'Desde /noticias', note: 'El formulario vive dentro del modulo.' },
            { label: 'Canal', value: 'Correo y buzon', note: 'Segun tu sesion y suscripcion activa.' },
            { label: 'Resumen', value: 'Diario', note: 'El servicio esta configurado como envio recurrente.' },
            { label: 'Baja', value: 'Automatica', note: 'Cada correo incluye la salida del newsletter.' },
        ],
        detailGroups: [
            {
                title: 'Datos utiles del feed',
                items: [
                    { label: 'Busqueda', value: 'por titulo, extracto, categoria o juego' },
                    { label: 'Filtros', value: 'categoria, juego y orden reciente o popular' },
                    { label: 'Acciones', value: 'guardar, dar like y compartir enlaces' },
                    { label: 'Detalle', value: 'cada noticia abre vista propia con galeria y relacionadas' },
                ],
            },
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

const DOC_STATS = [
    { value: GUIDES.length, label: 'Guias publicadas' },
    { value: '19', label: 'Fuentes reales de puntos' },
    { value: '5', label: 'Imagenes extra por noticia' },
];

const QUICK_LINKS = [
    { label: 'Ver progreso', to: '/edit-profile', icon: FaMedal },
    { label: 'Noticias y editor', to: '/noticias', icon: FaNewspaper },
    { label: 'Centro de ayuda', to: '/support', icon: FaHeadset },
    { label: 'Configurar cuenta', to: '/settings', icon: FaShieldAlt },
    { label: 'Explorar torneos', to: '/torneos', icon: FaTrophy },
    { label: 'Administrar equipos', to: '/equipos', icon: FaGamepad },
];

const DocsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedGuideId, setSelectedGuideId] = useState('sistema-puntos');

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
                        Reune lo esencial para empezar en GLITCH GANG, entender como suben los puntos,
                        publicar noticias, competir en torneos y resolver dudas comunes desde una sola ruta.
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
                    {DOC_STATS.map((stat) => (
                        <div key={stat.label} className="docs-stat">
                            <strong>{stat.value}</strong>
                            <span>{stat.label}</span>
                        </div>
                    ))}
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

                            {Array.isArray(activeGuide.highlights) && activeGuide.highlights.length > 0 && (
                                <div className="docs-detail__section">
                                    <h3>Datos clave</h3>
                                    <div className="docs-facts">
                                        {activeGuide.highlights.map((item) => (
                                            <article key={`${item.label}-${item.value}`} className="docs-fact-card">
                                                <span>{item.label}</span>
                                                <strong>{item.value}</strong>
                                                {item.note && <p>{item.note}</p>}
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {Array.isArray(activeGuide.detailGroups) && activeGuide.detailGroups.length > 0 && (
                                activeGuide.detailGroups.map((group) => (
                                    <div key={group.title} className="docs-detail__section">
                                        <h3>{group.title}</h3>
                                        <ul className="docs-reference-list">
                                            {group.items.map((item) => (
                                                <li key={`${item.label}-${item.value}`}>
                                                    <strong>{item.label}</strong>
                                                    <span>{item.value}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))
                            )}

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
