import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';

// Components
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import GamesCatalog from '../../components/Home/GamesCatalog';
import StatsCounter from '../../components/Home/StatsCounter';
import FeaturesShowcase from '../../components/Home/FeaturesShowcase';
import CallToAction from '../../components/Home/CallToAction';
import Footer from '../../components/Home/Footer';
import ScrollToTop from '../../components/Home/ScrollToTop';

// Assets
import videoInicio from '../../assets/video/inicio.mp4';

// Game images for marquee
import lolImg from '../../assets/games/lol.jpg';
import valorantImg from '../../assets/games/valorant.jpg';
import mlbbImg from '../../assets/games/mlbb.jpg';

import './Home.css';

/* ── Data ── */
const MARQUEE_GAMES = [
  { name: 'League of Legends', img: lolImg },
  { name: 'Valorant', img: valorantImg },
  { name: 'Mobile Legends', img: mlbbImg },
];

const ABOUT_CARDS = (t) => [
  {
    icon: 'bx-world',
    title: t('aboutCard1Title'),
    text: t('aboutCard1Text'),
    accent: '#8EDB15',
  },
  {
    icon: 'bx-target-lock',
    title: t('aboutCard2Title'),
    text: t('aboutCard2Text'),
    accent: '#4FACFE',
  },
  {
    icon: 'bx-rocket',
    title: t('aboutCard3Title'),
    text: t('aboutCard3Text'),
    accent: '#F093FB',
  },
];

/* ══════════════════════════════════════════════════ */

const Home = () => {
  const { t } = useLang();
  const aboutCards = ABOUT_CARDS(t);
  const [isSidebarClosed, setIsSidebarClosed] = useState(true);
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale  = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  return (
    <div className="home-page">
      <Sidebar isClosed={isSidebarClosed} setIsClosed={setIsSidebarClosed} />

      <div className={`main-layout ${isSidebarClosed ? 'collapsed' : 'expanded'}`}>
        {/* Navbar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 90 }}>
          <Navbar />
        </div>

        {/* ═══════════ HERO ═══════════ */}
        <section ref={heroRef} className="hero">
          {/* Video BG with parallax */}
          <motion.div className="hero__video" style={{ scale: heroScale }}>
            <video src={videoInicio} autoPlay muted loop playsInline />
          </motion.div>

          {/* Overlays */}
          <div className="hero__overlay" />
          <div className="hero__grid" />
          <div className="hero__scanline" />

          {/* HUD corner brackets */}
          <span className="hud hud--tl" />
          <span className="hud hud--tr" />
          <span className="hud hud--bl" />
          <span className="hud hud--br" />

          {/* Content */}
          <motion.div className="hero__content" style={{ opacity: heroOpacity }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hero__badge"
            >
              <span className="hero__badge-dot" />
              {t('heroBadge')}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="hero__title glitch"
              data-text="GLITCH GANG"
            >
              GLITCH GANG
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="hero__subtitle"
            >
              {t('heroSubtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="hero__actions"
            >
              <Link to="/register" className="hero__btn hero__btn--primary">
                <i className="bx bx-rocket"></i>
                {t('heroBtnStart')}
              </Link>
              <Link to="/login" className="hero__btn hero__btn--outline">
                <i className="bx bx-log-in"></i>
                {t('heroBtnLogin')}
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="hero__scroll"
            >
              <span>{t('heroScroll')}</span>
              <div className="hero__scroll-line" />
            </motion.div>
          </motion.div>
        </section>

        {/* ═══════════ MARQUEE STRIP ═══════════ */}
        <div className="marquee-strip">
          <div className="marquee-track">
            {[...MARQUEE_GAMES, ...MARQUEE_GAMES].map((game, i) => (
              <div key={i} className="marquee-item">
                <img src={game.img} alt={game.name} />
                <span>{game.name}</span>
                <span className="marquee-dot">&#9670;</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════ ABOUT ═══════════ */}
        <section className="about-section">
          <div className="about-section__inner">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="section-header"
            >
              <span className="section-tag">{t('aboutTag')}</span>
              <h2 className="section-title">
                {t('aboutHeading')} <span className="text-accent">{t('aboutHeadingAccent')}</span>
              </h2>
            </motion.div>

            <div className="about-grid">
              {aboutCards.map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="about-card"
                  style={{
                    '--card-accent': card.accent,
                    '--card-accent-dim': `${card.accent}18`,
                    '--card-accent-border': `${card.accent}35`,
                  }}
                >
                  <div className="about-card__icon">
                    <i className={`bx ${card.icon}`}></i>
                  </div>
                  <h3 className="about-card__title">{card.title}</h3>
                  <p className="about-card__text">{card.text}</p>
                  <div className="about-card__line" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ STATS ═══════════ */}
        <StatsCounter />

        {/* ═══════════ GAMES ═══════════ */}
        <GamesCatalog />

        {/* ═══════════ FEATURES ═══════════ */}
        <FeaturesShowcase />

        {/* ═══════════ CTA ═══════════ */}
        <CallToAction />

        {/* ═══════════ FOOTER ═══════════ */}
        <Footer />
      </div>

      <ScrollToTop />
    </div>
  );
};

export default Home;
