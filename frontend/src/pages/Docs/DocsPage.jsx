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
import { useLang } from '../../context/LanguageContext';
import './DocsPage.css';

const DOC_CATEGORIES = (t) => [
    { id: 'all', label: t('docsCatAll'), icon: FaBook },
    { id: 'review', label: t('docsCatReview'), icon: FaShieldAlt },
    { id: 'inicio', label: t('docsCatStart'), icon: FaRocket },
    { id: 'cuenta', label: t('docsCatAccount'), icon: FaShieldAlt },
    { id: 'perfil', label: t('docsCatProfile'), icon: FaMedal },
    { id: 'equipos', label: t('docsCatTeams'), icon: FaUsers },
    { id: 'torneos', label: t('docsCatTourneys'), icon: FaTrophy },
    { id: 'contenido', label: t('docsCatContent'), icon: FaNewspaper },
    { id: 'pagos', label: t('docsCatPayments'), icon: FaCreditCard },
];

const GUIDES = (t) => {
    const pointLevels = [
        { name: t('docsLvlRookie'), minPoints: 0 },
        { name: t('docsLvlAspirante'), minPoints: 200 },
        { name: t('docsLvlCompetidor'), minPoints: 500 },
        { name: t('docsLvlEstratega'), minPoints: 900 },
        { name: t('docsLvlCapitan'), minPoints: 1400 },
        { name: t('docsLvlElite'), minPoints: 2000 },
        { name: t('docsLvlCampeon'), minPoints: 2600 },
        { name: t('docsLvlLeyenda'), minPoints: 3200 },
    ];

    return [
        {
            id: 'riot-review-flow',
            category: 'review',
            icon: FaShieldAlt,
            title: t('docsGRiotTitle'),
            summary: t('docsGRiotSummary'),
            level: t('docsGRiotLevel'),
            time: '3 min',
            ctaTo: '/review/riot',
            ctaLabel: t('docsGRiotCta'),
            bullets: [t('docsGRiotB1'), t('docsGRiotB2'), t('docsGRiotB3')],
            steps: [t('docsGRiotS1'), t('docsGRiotS2'), t('docsGRiotS3'), t('docsGRiotS4')],
            highlights: [
                { label: t('docsGRiotH1L'), value: '/review/riot', note: t('docsGRiotH1N') },
                { label: t('docsGRiotH2L'), value: t('docsGRiotH2V'), note: t('docsGRiotH2N') },
                { label: t('docsGRiotH3L'), value: t('docsGRiotH3V'), note: t('docsGRiotH3N') },
                { label: t('docsGRiotH4L'), value: t('docsGRiotH4V'), note: t('docsGRiotH4N') },
            ],
            detailGroups: [
                {
                    title: t('docsGRiotDG1T'),
                    items: [
                        { label: t('docsGRiotDG1I1L'), value: '/review/riot' },
                        { label: t('docsGRiotDG1I2L'), value: '/torneos/publicos' },
                        { label: t('docsGRiotDG1I3L'), value: '/torneos/publicos/:code' },
                        { label: t('docsGRiotDG1I4L'), value: '/legal/terms, /legal/privacy, /legal/payment-policy, /legal/organizer-terms' },
                    ],
                },
                {
                    title: t('docsGRiotDG2T'),
                    items: [
                        { label: t('docsGRiotDG2I1L'), value: t('docsGRiotDG2I1V') },
                        { label: t('docsGRiotDG2I2L'), value: t('docsGRiotDG2I2V') },
                        { label: t('docsGRiotDG2I3L'), value: t('docsGRiotDG2I3V') },
                        { label: t('docsGRiotDG2I4L'), value: t('docsGRiotDG2I4V') },
                    ],
                },
            ],
        },
        {
            id: 'primeros-pasos',
            category: 'inicio',
            icon: FaRocket,
            title: t('docsGFirstTitle'),
            summary: t('docsGFirstSummary'),
            level: t('docsGFirstLevel'),
            time: '5 min',
            ctaTo: '/register',
            ctaLabel: t('docsGFirstCta'),
            bullets: [t('docsGFirstB1'), t('docsGFirstB2'), t('docsGFirstB3')],
            steps: [t('docsGFirstS1'), t('docsGFirstS2'), t('docsGFirstS3'), t('docsGFirstS4')],
        },
        {
            id: 'sistema-puntos',
            category: 'perfil',
            icon: FaMedal,
            title: t('docsGPtsTitle'),
            summary: t('docsGPtsSummary'),
            level: t('docsGPtsLevel'),
            time: '6 min',
            ctaTo: '/edit-profile',
            ctaLabel: t('docsGPtsCta'),
            bullets: [t('docsGPtsB1'), t('docsGPtsB2'), t('docsGPtsB3')],
            steps: [t('docsGPtsS1'), t('docsGPtsS2'), t('docsGPtsS3'), t('docsGPtsS4')],
            highlights: [
                { label: t('docsGPtsH1L'), value: '19', note: t('docsGPtsH1N') },
                { label: t('docsGPtsH2L'), value: '20', note: t('docsGPtsH2N') },
                { label: t('docsGPtsH3L'), value: '8', note: t('docsGPtsH3N') },
                { label: t('docsGPtsH4L'), value: '3308 pts', note: t('docsGPtsH4N') },
            ],
            detailGroups: [
                {
                    title: t('docsGPtsDG1T'),
                    items: [
                        { label: t('docsGPtsDG1I1L'), value: t('docsGPtsDG1I1V') },
                        { label: t('docsGPtsDG1I2L'), value: t('docsGPtsDG1I2V') },
                        { label: t('docsGPtsDG1I3L'), value: t('docsGPtsDG1I3V') },
                        { label: t('docsGPtsDG1I4L'), value: t('docsGPtsDG1I4V') },
                    ],
                },
                {
                    title: t('docsGPtsDG2T'),
                    items: [
                        { label: t('docsGPtsDG2I1L'), value: t('docsGPtsDG2I1V') },
                        { label: t('docsGPtsDG2I2L'), value: t('docsGPtsDG2I2V') },
                        { label: t('docsGPtsDG2I3L'), value: t('docsGPtsDG2I3V') },
                        { label: t('docsGPtsDG2I4L'), value: t('docsGPtsDG2I4V') },
                    ],
                },
                {
                    title: t('docsGPtsDG3T'),
                    items: pointLevels.map((level) => ({
                        label: level.name,
                        value: t('docsFromPts').replace('{{n}}', level.minPoints),
                    })),
                },
            ],
        },
        {
            id: 'seguridad-cuenta',
            category: 'cuenta',
            icon: FaShieldAlt,
            title: t('docsGSecTitle'),
            summary: t('docsGSecSummary'),
            level: t('docsGSecLevel'),
            time: '4 min',
            ctaTo: '/settings',
            ctaLabel: t('docsGSecCta'),
            bullets: [t('docsGSecB1'), t('docsGSecB2'), t('docsGSecB3')],
            steps: [t('docsGSecS1'), t('docsGSecS2'), t('docsGSecS3'), t('docsGSecS4')],
        },
        {
            id: 'crear-equipo',
            category: 'equipos',
            icon: FaUsers,
            title: t('docsGTeamTitle'),
            summary: t('docsGTeamSummary'),
            level: t('docsGTeamLevel'),
            time: '6 min',
            ctaTo: '/create-team',
            ctaLabel: t('docsGTeamCta'),
            bullets: [t('docsGTeamB1'), t('docsGTeamB2'), t('docsGTeamB3')],
            steps: [t('docsGTeamS1'), t('docsGTeamS2'), t('docsGTeamS3'), t('docsGTeamS4')],
        },
        {
            id: 'inscripcion-torneo',
            category: 'torneos',
            icon: FaTrophy,
            title: t('docsGJoinTitle'),
            summary: t('docsGJoinSummary'),
            level: t('docsGJoinLevel'),
            time: '7 min',
            ctaTo: '/torneos',
            ctaLabel: t('docsGJoinCta'),
            bullets: [t('docsGJoinB1'), t('docsGJoinB2'), t('docsGJoinB3')],
            steps: [t('docsGJoinS1'), t('docsGJoinS2'), t('docsGJoinS3'), t('docsGJoinS4')],
        },
        {
            id: 'reportar-resultados',
            category: 'torneos',
            icon: FaPlayCircle,
            title: t('docsGRepTitle'),
            summary: t('docsGRepSummary'),
            level: t('docsGRepLevel'),
            time: '3 min',
            ctaTo: '/support',
            ctaLabel: t('docsGRepCta'),
            bullets: [t('docsGRepB1'), t('docsGRepB2'), t('docsGRepB3')],
            steps: [t('docsGRepS1'), t('docsGRepS2'), t('docsGRepS3'), t('docsGRepS4')],
        },
        {
            id: 'crear-noticias',
            category: 'contenido',
            icon: FaNewspaper,
            title: t('docsGCreateTitle'),
            summary: t('docsGCreateSummary'),
            level: t('docsGCreateLevel'),
            time: '5 min',
            ctaTo: '/noticias',
            ctaLabel: t('docsGCreateCta'),
            bullets: [t('docsGCreateB1'), t('docsGCreateB2'), t('docsGCreateB3')],
            steps: [t('docsGCreateS1'), t('docsGCreateS2'), t('docsGCreateS3'), t('docsGCreateS4')],
            highlights: [
                { label: t('docsGCreateH1L'), value: t('docsGCreateH1V'), note: t('docsGCreateH1N') },
                { label: t('docsGCreateH2L'), value: t('docsGCreateH2V'), note: t('docsGCreateH2N') },
                { label: t('docsGCreateH3L'), value: 'JPG, PNG, WEBP', note: t('docsGCreateH3N') },
                { label: t('docsGCreateH4L'), value: t('docsGCreateH4V'), note: t('docsGCreateH4N') },
            ],
            detailGroups: [
                {
                    title: t('docsGCreateDG1T'),
                    items: [
                        { label: t('docsGCreateDG1I1L'), value: t('docsGCreateDG1I1V') },
                        { label: t('docsGCreateDG1I2L'), value: t('docsGCreateDG1I2V') },
                        { label: t('docsGCreateDG1I3L'), value: t('docsGCreateDG1I3V') },
                        { label: t('docsGCreateDG1I4L'), value: t('docsGCreateDG1I4V') },
                    ],
                },
                {
                    title: t('docsGCreateDG2T'),
                    items: [
                        { label: t('docsGCreateDG2I1L'), value: '/noticias' },
                        { label: t('docsGCreateDG2I2L'), value: t('docsGCreateDG2I2V') },
                        { label: t('docsGCreateDG2I3L'), value: t('docsGCreateDG2I3V') },
                        { label: t('docsGCreateDG2I4L'), value: t('docsGCreateDG2I4V') },
                    ],
                },
            ],
        },
        {
            id: 'newsletter-alertas',
            category: 'contenido',
            icon: FaBell,
            title: t('docsGNewslTitle'),
            summary: t('docsGNewslSummary'),
            level: t('docsGNewslLevel'),
            time: '3 min',
            ctaTo: '/noticias',
            ctaLabel: t('docsGNewslCta'),
            bullets: [t('docsGNewslB1'), t('docsGNewslB2'), t('docsGNewslB3')],
            steps: [t('docsGNewslS1'), t('docsGNewslS2'), t('docsGNewslS3'), t('docsGNewslS4')],
            highlights: [
                { label: t('docsGNewslH1L'), value: t('docsGNewslH1V'), note: t('docsGNewslH1N') },
                { label: t('docsGNewslH2L'), value: t('docsGNewslH2V'), note: t('docsGNewslH2N') },
                { label: t('docsGNewslH3L'), value: t('docsGNewslH3V'), note: t('docsGNewslH3N') },
                { label: t('docsGNewslH4L'), value: t('docsGNewslH4V'), note: t('docsGNewslH4N') },
            ],
            detailGroups: [
                {
                    title: t('docsGNewslDG1T'),
                    items: [
                        { label: t('docsGNewslDG1I1L'), value: t('docsGNewslDG1I1V') },
                        { label: t('docsGNewslDG1I2L'), value: t('docsGNewslDG1I2V') },
                        { label: t('docsGNewslDG1I3L'), value: t('docsGNewslDG1I3V') },
                        { label: t('docsGNewslDG1I4L'), value: t('docsGNewslDG1I4V') },
                    ],
                },
            ],
        },
        {
            id: 'pagos-retiros',
            category: 'pagos',
            icon: FaCreditCard,
            title: t('docsGPayTitle'),
            summary: t('docsGPaySummary'),
            level: t('docsGPayLevel'),
            time: '5 min',
            ctaTo: '/support',
            ctaLabel: t('docsGPayCta'),
            bullets: [t('docsGPayB1'), t('docsGPayB2'), t('docsGPayB3')],
            steps: [t('docsGPayS1'), t('docsGPayS2'), t('docsGPayS3'), t('docsGPayS4')],
        },
    ];
};

const QUICK_LINKS = (t) => [
    { label: t('docsQuickRiot'), to: '/review/riot', icon: FaShieldAlt },
    { label: t('docsQuickProgress'), to: '/edit-profile', icon: FaMedal },
    { label: t('docsQuickNews'), to: '/noticias', icon: FaNewspaper },
    { label: t('docsQuickHelp'), to: '/support', icon: FaHeadset },
    { label: t('docsQuickSettings'), to: '/settings', icon: FaShieldAlt },
    { label: t('docsQuickTourneys'), to: '/torneos', icon: FaTrophy },
    { label: t('docsQuickTeams'), to: '/equipos', icon: FaGamepad },
];

const DocsPage = () => {
    const { t } = useLang();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedGuideId, setSelectedGuideId] = useState('riot-review-flow');

    const docCategories = useMemo(() => DOC_CATEGORIES(t), [t]);
    const guides = useMemo(() => GUIDES(t), [t]);
    const quickLinks = useMemo(() => QUICK_LINKS(t), [t]);

    const filteredGuides = useMemo(() => {
        return guides.filter((guide) => {
            const query = searchTerm.trim().toLowerCase();
            const matchesCategory = activeCategory === 'all' || guide.category === activeCategory;
            const matchesSearch =
                query.length === 0 ||
                guide.title.toLowerCase().includes(query) ||
                guide.summary.toLowerCase().includes(query) ||
                guide.bullets.some((bullet) => bullet.toLowerCase().includes(query));
            return matchesCategory && matchesSearch;
        });
    }, [guides, activeCategory, searchTerm]);

    const activeGuide =
        filteredGuides.find((guide) => guide.id === selectedGuideId) ||
        filteredGuides[0] ||
        guides[0];

    return (
        <div className="docs-page">
            <section className="docs-hero">
                <div className="docs-hero__content">
                    <div className="docs-eyebrow">
                        <FaBook />
                        <span>{t('docsHeroEyebrow')}</span>
                    </div>
                    <h1>{t('docsHeroTitle')}</h1>
                    <p>{t('docsHeroDesc')}</p>

                    <div className="docs-search">
                        <FaSearch className="docs-search__icon" />
                        <input
                            type="text"
                            placeholder={t('docsSearchPlaceholder')}
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                </div>

                <div className="docs-hero__stats">
                    <div className="docs-stat">
                        <strong>{guides.length}</strong>
                        <span>{t('docsStatGuides')}</span>
                    </div>
                    <div className="docs-stat">
                        <strong>19</strong>
                        <span>{t('docsStatPoints')}</span>
                    </div>
                    <div className="docs-stat">
                        <strong>5</strong>
                        <span>{t('docsStatImages')}</span>
                    </div>
                </div>
            </section>

            <section className="docs-shell">
                <div className="docs-toolbar">
                    <div className="docs-categories">
                        {docCategories.map((category) => (
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
                        {filteredGuides.length} {filteredGuides.length === 1 ? t('docsResult1') : t('docsResultN')}
                    </p>
                </div>

                <div className="docs-layout">
                    <div className="docs-guides">
                        {filteredGuides.length > 0 ? (
                            filteredGuides.map((guide) => (
                                <button
                                    key={guide.id}
                                    type="button"
                                    className={`docs-guide-card ${activeGuide?.id === guide.id ? 'is-active' : ''}`}
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
                                <h2>{t('docsEmptyTitle')}</h2>
                                <p>{t('docsEmptyDesc')}</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setActiveCategory('all');
                                    }}
                                >
                                    {t('docsEmptyBtn')}
                                </button>
                            </div>
                        )}
                    </div>

                    {activeGuide && (
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
                                    <h3>{t('docsDetailCovers')}</h3>
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
                                    <h3>{t('docsDetailSteps')}</h3>
                                    <ol className="docs-steps">
                                        {activeGuide.steps.map((step) => (
                                            <li key={step}>{step}</li>
                                        ))}
                                    </ol>
                                </div>

                                {Array.isArray(activeGuide.highlights) && activeGuide.highlights.length > 0 && (
                                    <div className="docs-detail__section">
                                        <h3>{t('docsDetailKeyData')}</h3>
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
                                <h3>{t('docsAccessTitle')}</h3>
                                <div className="docs-links">
                                    {quickLinks.map((link) => (
                                        <Link key={link.to} to={link.to} className="docs-link-card">
                                            <link.icon />
                                            <span>{link.label}</span>
                                            <FaArrowRight />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </aside>
                    )}
                </div>
            </section>
        </div>
    );
};

export default DocsPage;
