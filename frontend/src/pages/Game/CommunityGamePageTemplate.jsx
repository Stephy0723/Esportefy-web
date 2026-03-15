import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBolt,
  FaBuilding,
  FaCalendarAlt,
  FaChartLine,
  FaChevronRight,
  FaCommentDots,
  FaGlobe,
  FaPlay,
  FaShieldAlt,
  FaSignInAlt,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import { COMMUNITY_GAMES, COMMUNITY_GAME_TAXONOMY, COMMUNITY_LIST } from '../../data/communityData';
import { supportedGamesDetailedData as gamesDetailedData } from '../../data/supportedGamesDetailedData';
import { TEAMS_DATA, TOURNAMENTS_DATA, formatDate, formatPrize, getStatusLabel } from '../../data/rankingsData';
import { isSupportedGameId } from '../../../../shared/supportedGames.js';
import { fetchGameHubStatsIndex, formatGameHubCount, joinGameHub } from '../menu/Community/gameHub.service';
import './CommunityGamePageTemplate.css';

const DATA_ALIASES = {
  ow2: 'overwatch',
  rl: 'rocket',
  ff: 'freefire',
  wr: 'wildrift',
  wildrift: 'wildrift',
  r6s: 'r6',
  r6: 'r6',
  pubg: 'pubgm',
  pubgm: 'pubgm',
  hs: 'hearthstone',
  nba2k: 'nba2k',
  lor: 'lor',
  cr: 'clashroyale',
  aov: 'hok',
};

const COMPANY_BY_ID = {
  lol: 'Riot Games',
  valorant: 'Riot Games',
  dota2: 'Valve',
  mlbb: 'Moonton',
  wildrift: 'Riot Games',
  fortnite: 'Epic Games',
  cs2: 'Valve',
  apex: 'Respawn Entertainment',
  warzone: 'Activision',
  pubgm: 'Tencent',
  rl: 'Psyonix',
  tekken8: 'Bandai Namco',
  sf6: 'Capcom',
  gta: 'Rockstar Games',
  genshin: 'HoYoverse',
  amongus: 'Innersloth',
  fallguys: 'Mediatonic',
  marvel: 'NetEase Games',
  xdefiant: 'Ubisoft',
  thefinals: 'Embark Studios',
  deadlock: 'Valve',
  eafc25: 'EA Sports',
  palworld: 'Pocketpair',
  ow2: 'Blizzard Entertainment',
  r6: 'Ubisoft',
  hs: 'Blizzard Entertainment',
  lor: 'Riot Games',
  tft: 'Riot Games',
  hok: 'Tencent',
};

const CREATOR_BLUEPRINTS = {
  moba: [
    {
      title: 'Meta y drafts',
      format: 'Analisis',
      description: 'Tier lists, counters, picks prioritarios y lectura de composiciones.',
    },
    {
      title: 'SoloQ y coaching',
      format: 'Directo',
      description: 'Ranked, review de partidas y mejora individual para cada rol.',
    },
    {
      title: 'Co-streams',
      format: 'Cobertura',
      description: 'Watch parties, resumenes de ligas y seguimiento de playoffs.',
    },
  ],
  fps: [
    {
      title: 'VOD review',
      format: 'Analisis',
      description: 'Rotaciones, utilidad, timings y ajustes tacticos del juego.',
    },
    {
      title: 'Ranked y scrims',
      format: 'Directo',
      description: 'Sesiones competitivas, tryouts y practica con equipos.',
    },
    {
      title: 'Highlights',
      format: 'Clips',
      description: 'Jugadas clave, mejores rondas y momentos virales del hub.',
    },
  ],
  fighting: [
    {
      title: 'Matchup lab',
      format: 'Analisis',
      description: 'Notas de matchup, frame data y respuestas a personajes meta.',
    },
    {
      title: 'Sets y FT',
      format: 'Directo',
      description: 'Sets largos, lobby abierto y sesiones de entrenamiento.',
    },
    {
      title: 'Clips de torneo',
      format: 'Cobertura',
      description: 'Highlights de brackets, resets y momentos clutch.',
    },
  ],
  default: [
    {
      title: 'Noticias y parches',
      format: 'Analisis',
      description: 'Cambios importantes, guias rapidas y contexto competitivo.',
    },
    {
      title: 'Comunidad en vivo',
      format: 'Directo',
      description: 'Streams del hub, watch parties y espacios para reaccionar.',
    },
    {
      title: 'Clips y resumenes',
      format: 'Cobertura',
      description: 'Contenido corto para seguir el ritmo del juego sin perder tiempo.',
    },
  ],
};

const STATUS_ORDER = {
  active: 0,
  upcoming: 1,
  completed: 2,
};

const fallbackArray = (value, fallback = []) => (Array.isArray(value) && value.length > 0 ? value : fallback);

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const toTitle = (value) =>
  String(value || '')
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const parseCompactNumber = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const raw = String(value || '0').toLowerCase().replace(/\s+/g, '');
  const base = parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;

  if (raw.includes('m')) return base * 1000000;
  if (raw.includes('k')) return base * 1000;
  return base;
};

const formatCompactLabel = (value) => {
  if (typeof value === 'number') {
    return formatGameHubCount(value);
  }

  const raw = String(value || '').trim();
  if (!raw) return '0';
  return raw;
};

const formatTournamentDate = (item) => {
  if (item?.startDate) {
    return formatDate(item.startDate);
  }

  return item?.date || 'Proximamente';
};

const formatTournamentPrize = (item) => {
  if (typeof item?.prize === 'number') {
    return formatPrize(item.prize, item.currency);
  }

  return item?.prize || 'Por definir';
};

const uniqueByName = (items) => {
  const seen = new Set();

  return items.filter((item) => {
    const key = normalizeText(item?.name || item?.title);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildHubRooms = (gameName, taxonomy, activeCount) => {
  const baseActive = Math.max(Number(activeCount || 0), 32);
  const modes = fallbackArray(taxonomy?.mode, []);
  const mechanics = fallbackArray(taxonomy?.mechanics, []);
  const mainMechanic = mechanics[0] ? toTitle(mechanics[0]) : 'Meta';
  const hasRanked = modes.some((mode) => normalizeText(mode) === 'ranked');

  return [
    {
      name: 'General',
      description: `Noticias, clips, agenda competitiva y debate de ${gameName}.`,
      users: Math.max(12, Math.round(baseActive * 0.42)),
      status: 'Abierto',
    },
    {
      name: hasRanked ? 'Ranked y duo' : 'LFG y scrims',
      description: 'Busca duo, roster, suplentes o bloque de practica.',
      users: Math.max(9, Math.round(baseActive * 0.28)),
      status: 'Buscando grupo',
    },
    {
      name: 'Torneos',
      description: 'Inscripciones, reglas, horarios y resultados del circuito.',
      users: Math.max(7, Math.round(baseActive * 0.18)),
      status: 'Competitivo',
    },
    {
      name: `${mainMechanic} y parches`,
      description: 'Cambios del meta, picks fuertes y guias rapidas.',
      users: Math.max(6, Math.round(baseActive * 0.12)),
      status: 'Analisis',
    },
  ];
};

const buildCreatorCards = (gameName, taxonomy) => {
  const primaryGenre = normalizeText(fallbackArray(taxonomy?.genre, ['default'])[0]);
  const blueprint = CREATOR_BLUEPRINTS[primaryGenre] || CREATOR_BLUEPRINTS.default;

  return blueprint.map((item, index) => ({
    ...item,
    title: index === 0 ? `${item.title} de ${gameName}` : item.title,
  }));
};

const SectionHeader = ({ icon, title, subtitle, actionLabel, onAction }) => (
  <div className="guh-section__head">
    <div>
      <span className="guh-section__eyebrow">
        {icon}
        {title}
      </span>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
    {actionLabel && onAction && (
      <button type="button" className="guh-btn guh-btn--ghost" onClick={onAction}>
        {actionLabel}
        <FaChevronRight />
      </button>
    )}
  </div>
);

const StatCard = ({ icon, label, value }) => (
  <div className="guh-stat">
    <span className="guh-stat__icon">{icon}</span>
    <strong>{value}</strong>
    <span>{label}</span>
  </div>
);

const EmptyState = ({ title, copy, actionLabel, onAction }) => (
  <div className="guh-empty">
    <strong>{title}</strong>
    <p>{copy}</p>
    {actionLabel && onAction && (
      <button type="button" className="guh-btn guh-btn--ghost" onClick={onAction}>
        {actionLabel}
      </button>
    )}
  </div>
);

const CommunityGamePageTemplate = () => {
  const { gameId: rawId } = useParams();
  const navigate = useNavigate();
  const [gameStatsMap, setGameStatsMap] = useState({});
  const [joiningHub, setJoiningHub] = useState(false);

  const id = normalizeText(rawId);
  const detailId = DATA_ALIASES[id] || id;
  const isSupportedCommunityGame = isSupportedGameId(id) || isSupportedGameId(detailId);

  useEffect(() => {
    if (!isSupportedCommunityGame) {
      navigate('/comunidad', { replace: true });
    }
  }, [isSupportedCommunityGame, navigate]);

  useEffect(() => {
    let cancelled = false;

    const loadGameStats = async () => {
      try {
        const nextStats = await fetchGameHubStatsIndex();
        if (!cancelled) {
          setGameStatsMap(nextStats);
        }
      } catch (_) {
        if (!cancelled) {
          setGameStatsMap({});
        }
      }
    };

    loadGameStats();

    return () => {
      cancelled = true;
    };
  }, [detailId, id]);

  const data = gamesDetailedData?.[detailId] || gamesDetailedData?.[id] || null;
  const communityGame =
    COMMUNITY_GAMES.find((game) => normalizeText(game.id) === id || normalizeText(game.id) === detailId) || null;
  const taxonomy = COMMUNITY_GAME_TAXONOMY?.[id] || COMMUNITY_GAME_TAXONOMY?.[detailId] || {};

  const name = data?.name || communityGame?.name || toTitle(id);
  const banner = data?.banner || communityGame?.img || '';
  const accentColor = data?.color || communityGame?.color || 'var(--primary)';
  const developer =
    data?.developer ||
    communityGame?.developer ||
    communityGame?.company ||
    COMPANY_BY_ID[id] ||
    COMPANY_BY_ID[detailId] ||
    'Studio';
  const history =
    data?.history ||
    `${name} tiene un hub dedicado para comunidades, torneos, equipos y conversacion competitiva.`;
  const category = data?.category || communityGame?.cat || toTitle(fallbackArray(taxonomy?.genre, ['competitivo'])[0]);
  const currentGameStats = gameStatsMap[id] || gameStatsMap[detailId] || { usersCount: 0, activeCount: 0, joined: false };

  const gameKeys = new Set(
    [id, detailId, normalizeText(name), normalizeText(communityGame?.name), normalizeText(category)].filter(Boolean)
  );

  const supportedCommunities = COMMUNITY_LIST.filter((community) => gameKeys.has(normalizeText(community.game))).map(
    (community) => ({
      key: community.id,
      name: community.name,
      description: community.description,
      membersLabel: formatGameHubCount(community.members),
      onlineLabel: formatGameHubCount(community.online),
      tags: fallbackArray(community.tags, [category]),
      actionLabel: community.slug ? 'Abrir comunidad' : 'Explorar',
      onClick: () => navigate(community.slug ? `/community/${community.slug}` : '/comunidad'),
    })
  );

  const fallbackCommunities = fallbackArray(data?.userCommunities, []).map((community, index) => ({
    key: `${normalizeText(community.name)}-${index}`,
    name: community.name,
    description: `Espacio para reclutamiento, scrims, clips y noticias de ${name}.`,
    membersLabel: formatCompactLabel(community.members),
    onlineLabel: formatGameHubCount(Math.max(18, Math.round(parseCompactNumber(community.members) * 0.02))),
    tags: [category, 'Hub', 'LFG'],
    actionLabel: 'Ver comunidad',
    onClick: () => navigate('/comunidad'),
  }));

  const communityCards = uniqueByName([
    ...supportedCommunities,
    ...fallbackCommunities,
    {
      key: `${id}-hub`,
      name: `${name} Hub`,
      description: `Canal principal para la comunidad competitiva de ${name}.`,
      membersLabel: formatGameHubCount(currentGameStats.usersCount),
      onlineLabel: formatGameHubCount(currentGameStats.activeCount),
      tags: [category, 'Hub', 'Competitivo'],
      actionLabel: 'Entrar al hub',
      onClick: () => navigate('/comunidad'),
    },
  ]).slice(0, 4);

  const baseOrganizers = fallbackArray(data?.organizers, [
    { name: developer, motto: 'Operacion del ecosistema y eventos del juego' },
  ]);

  const rankingTournaments = TOURNAMENTS_DATA.filter((tournament) => gameKeys.has(normalizeText(tournament.game)))
    .sort((a, b) => {
      const orderDiff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
      if (orderDiff !== 0) return orderDiff;
      return new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime();
    })
    .map((tournament) => ({
      key: `ranking-${tournament.id}`,
      title: tournament.name,
      status: getStatusLabel(tournament.status),
      tone: tournament.status || 'upcoming',
      prize: formatTournamentPrize(tournament),
      date: formatTournamentDate(tournament),
      format: tournament.format || 'Formato por definir',
      organizer: tournament.organizer || baseOrganizers[0]?.name || developer,
      location: tournament.location || 'Online',
      teamsLabel: `${tournament.registeredTeams || tournament.teams || 0}/${tournament.teams || tournament.registeredTeams || 0} equipos`,
      onClick: () => navigate('/torneos'),
    }));

  const fallbackTournaments = fallbackArray(data?.activeTournaments || data?.tournaments, []).map((tournament, index) => ({
    key: `fallback-${index}`,
    title: tournament.title || `${name} Open`,
    status: tournament.status ? getStatusLabel(tournament.status) : 'Proximamente',
    tone: tournament.status || 'upcoming',
    prize: formatTournamentPrize(tournament),
    date: formatTournamentDate(tournament),
    format: tournament.format || 'Open',
    organizer: tournament.organizer || baseOrganizers[0]?.name || developer,
    location: tournament.location || 'Online',
    teamsLabel: tournament.teams ? `${tournament.teams} equipos` : 'Cupos por definir',
    onClick: () => navigate('/torneos'),
  }));

  const tournamentCards = uniqueByName([...rankingTournaments, ...fallbackTournaments]).slice(0, 4);

  const teamCards = TEAMS_DATA.filter((team) =>
    fallbackArray(team.games, []).some((game) => gameKeys.has(normalizeText(game)))
  )
    .sort((a, b) => Number(b.points || 0) - Number(a.points || 0))
    .slice(0, 6);

  const tournamentOrganizerCount = rankingTournaments.reduce((acc, tournament) => {
    const key = normalizeText(tournament.organizer);
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const organizerCards = uniqueByName([
    ...baseOrganizers.map((organizer, index) => ({
      key: `organizer-${index}`,
      name: organizer.name,
      description: organizer.motto || 'Organiza comunidad, torneos y operaciones del hub.',
    })),
    ...rankingTournaments.map((tournament, index) => ({
      key: `tournament-organizer-${index}`,
      name: tournament.organizer,
      description: `${tournament.status} - ${tournament.format}`,
    })),
  ])
    .map((organizer) => ({
      ...organizer,
      tournamentsLabel:
        tournamentOrganizerCount[normalizeText(organizer.name)] > 0
          ? `${tournamentOrganizerCount[normalizeText(organizer.name)]} torneos en este juego`
          : 'Gestion y activaciones del ecosistema',
    }))
    .slice(0, 6);

  const creatorCards = buildCreatorCards(name, taxonomy);
  const hubRooms = buildHubRooms(name, taxonomy, currentGameStats.activeCount);

  const primaryFacts = [
    { label: 'Estudio', value: developer, icon: <FaBuilding /> },
    { label: 'Categoria', value: category, icon: <FaGlobe /> },
    { label: 'Plataforma', value: toTitle(fallbackArray(taxonomy?.platform, ['pc'])[0]), icon: <FaChartLine /> },
    { label: 'Modo', value: toTitle(fallbackArray(taxonomy?.mode, ['competitivo'])[0]), icon: <FaBolt /> },
  ];

  const summaryStats = [
    { label: 'Miembros del hub', value: formatGameHubCount(currentGameStats.usersCount), icon: <FaUsers /> },
    { label: 'Activos hoy', value: formatGameHubCount(currentGameStats.activeCount), icon: <FaBolt /> },
    { label: 'Comunidades', value: communityCards.length, icon: <FaGlobe /> },
    { label: 'Torneos', value: tournamentCards.length, icon: <FaTrophy /> },
    { label: 'Equipos', value: teamCards.length, icon: <FaShieldAlt /> },
  ];

  const goToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleJoinCurrentHub = async () => {
    if (!id || joiningHub) return;

    try {
      setJoiningHub(true);
      const response = await joinGameHub(id);
      setGameStatsMap((prev) => ({
        ...prev,
        [id]: response.stats,
        ...(detailId !== id ? { [detailId]: response.stats } : {}),
      }));
    } finally {
      setJoiningHub(false);
    }
  };

  return (
    <div className="guh" style={{ '--guh-accent': accentColor }}>
      <div className="guh__backdrop" style={banner ? { backgroundImage: `url(${banner})` } : undefined} />
      <div className="guh__overlay" />
      <div className="guh__inner">
        <header className="guh-hero">
          <button type="button" className="guh-back" onClick={() => navigate(-1)}>
            <FaArrowLeft />
            <span>Volver</span>
          </button>

          <div className="guh-hero__grid">
            <div className="guh-hero__copy">
              <span className="guh-hero__eyebrow">Hub util de juego</span>
              <h1>{name}</h1>
              <p>{history}</p>

              <div className="guh-facts">
                {primaryFacts.map((fact) => (
                  <div key={fact.label} className="guh-fact">
                    <span>{fact.icon}</span>
                    <div>
                      <small>{fact.label}</small>
                      <strong>{fact.value}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="guh-actions">
                <button type="button" className="guh-btn guh-btn--primary" onClick={handleJoinCurrentHub} disabled={joiningHub}>
                  <FaSignInAlt />
                  {currentGameStats.joined ? 'Ya estas en el hub' : joiningHub ? 'Uniendo...' : 'Unirme al hub'}
                </button>
                <button type="button" className="guh-btn guh-btn--ghost" onClick={() => navigate('/chats')}>
                  <FaCommentDots />
                  Abrir chat
                </button>
                <button type="button" className="guh-btn guh-btn--ghost" onClick={() => navigate('/torneos')}>
                  <FaTrophy />
                  Ver torneos
                </button>
              </div>
            </div>

            <aside className="guh-hero__aside">
              <div className="guh-status">
                <strong>
                  <span className={`guh-status__dot ${currentGameStats.joined ? 'is-on' : ''}`} />
                  {currentGameStats.joined ? 'Unido al hub' : 'Aun no te has unido'}
                </strong>
                <p>Todo lo importante de {name} reunido en una sola vista.</p>
              </div>

              <div className="guh-stats">
                {summaryStats.map((stat) => (
                  <StatCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} />
                ))}
              </div>
            </aside>
          </div>

          <div className="guh-anchor-nav">
            {[
              ['communities', 'Comunidades'],
              ['tournaments', 'Torneos'],
              ['teams', 'Equipos'],
              ['hub', 'Chat hub'],
              ['creators', 'Creadores'],
              ['organizers', 'Organizadores'],
            ].map(([sectionId, label]) => (
              <button key={sectionId} type="button" className="guh-anchor" onClick={() => goToSection(sectionId)}>
                {label}
              </button>
            ))}
          </div>
        </header>

        <main className="guh-panels">
          <section id="communities" className="guh-panel guh-panel--communities">
            <SectionHeader
              icon={<FaGlobe />}
              title="Comunidades del juego"
              subtitle="Entra a los espacios donde se recluta, se conversa del meta y se publican novedades."
              actionLabel="Ver comunidad"
              onAction={() => navigate('/comunidad')}
            />

            {communityCards.length > 0 ? (
              <div className="guh-community-list">
                {communityCards.map((community) => (
                  <article key={community.key} className="guh-community-card">
                    <div className="guh-community-card__top">
                      <div>
                        <h3>{community.name}</h3>
                        <p>{community.description}</p>
                      </div>
                      <button type="button" className="guh-btn guh-btn--ghost" onClick={community.onClick}>
                        {community.actionLabel}
                      </button>
                    </div>

                    <div className="guh-community-card__meta">
                      <span>
                        <FaUsers />
                        {community.membersLabel} miembros
                      </span>
                      <span>
                        <FaBolt />
                        {community.onlineLabel} activos
                      </span>
                    </div>

                    <div className="guh-tags">
                      {community.tags.map((tag) => (
                        <span key={`${community.key}-${tag}`} className="guh-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Todavia no hay comunidades cargadas"
                copy={`Cuando se activen comunidades para ${name}, apareceran aqui con acceso directo.`}
                actionLabel="Explorar comunidad"
                onAction={() => navigate('/comunidad')}
              />
            )}
          </section>

          <section id="hub" className="guh-panel guh-panel--hub">
            <SectionHeader
              icon={<FaCommentDots />}
              title="Chat hub de juego"
              subtitle="Canales listos para conversar, reclutar, coordinar scrims y seguir el meta."
              actionLabel="Ir a chats"
              onAction={() => navigate('/chats')}
            />

            <div className="guh-room-list">
              {hubRooms.map((room) => (
                <article key={room.name} className="guh-room">
                  <div className="guh-room__top">
                    <div>
                      <h3>{room.name}</h3>
                      <p>{room.description}</p>
                    </div>
                    <span className="guh-room__status">{room.status}</span>
                  </div>

                  <div className="guh-room__footer">
                    <strong>{formatGameHubCount(room.users)}</strong>
                    <span>usuarios activos</span>
                    <button type="button" className="guh-btn guh-btn--ghost" onClick={() => navigate('/chats')}>
                      Abrir chat
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="guh-utility-card">
              <strong>Acciones rapidas</strong>
              <div className="guh-utility-card__actions">
                <button type="button" className="guh-btn guh-btn--ghost" onClick={handleJoinCurrentHub} disabled={joiningHub}>
                  <FaSignInAlt />
                  {currentGameStats.joined ? 'Seguir activo' : 'Entrar al hub'}
                </button>
                <button type="button" className="guh-btn guh-btn--ghost" onClick={() => navigate('/tv')}>
                  <FaPlay />
                  Ver cobertura
                </button>
              </div>
            </div>
          </section>

          <section id="tournaments" className="guh-panel guh-panel--tournaments">
            <SectionHeader
              icon={<FaTrophy />}
              title="Torneos del juego"
              subtitle="Revisa los brackets, premios, fechas y organizadores que ya estan moviendo la escena."
              actionLabel="Abrir torneos"
              onAction={() => navigate('/torneos')}
            />

            {tournamentCards.length > 0 ? (
              <div className="guh-card-grid">
                {tournamentCards.map((tournament) => (
                  <article key={tournament.key} className="guh-info-card">
                    <div className="guh-info-card__top">
                      <span className={`guh-badge guh-badge--${tournament.tone}`}>{tournament.status}</span>
                      <button type="button" className="guh-inline-link" onClick={tournament.onClick}>
                        Ver torneos
                        <FaChevronRight />
                      </button>
                    </div>

                    <h3>{tournament.title}</h3>

                    <div className="guh-info-card__rows">
                      <div>
                        <small>Premio</small>
                        <strong>{tournament.prize}</strong>
                      </div>
                      <div>
                        <small>Fecha</small>
                        <strong>{tournament.date}</strong>
                      </div>
                      <div>
                        <small>Formato</small>
                        <strong>{tournament.format}</strong>
                      </div>
                      <div>
                        <small>Organizador</small>
                        <strong>{tournament.organizer}</strong>
                      </div>
                      <div>
                        <small>Equipos</small>
                        <strong>{tournament.teamsLabel}</strong>
                      </div>
                      <div>
                        <small>Ubicacion</small>
                        <strong>{tournament.location}</strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No hay torneos visibles"
                copy={`Todavia no aparecen torneos para ${name}. Cuando se publiquen, saldran aqui primero.`}
                actionLabel="Crear torneo"
                onAction={() => navigate('/create-tournament')}
              />
            )}
          </section>

          <section id="teams" className="guh-panel guh-panel--teams">
            <SectionHeader
              icon={<FaShieldAlt />}
              title="Equipos del juego"
              subtitle="Equipos activos para scrims, tryouts, torneos y reclutamiento competitivo."
              actionLabel="Abrir equipos"
              onAction={() => navigate('/equipos')}
            />

            {teamCards.length > 0 ? (
              <div className="guh-card-grid">
                {teamCards.map((team) => (
                  <article key={team.id} className="guh-info-card">
                    <div className="guh-team__head">
                      <div>
                        <span className="guh-team__tag">{team.tag}</span>
                        <h3>{team.name}</h3>
                      </div>
                      <span className="guh-team__region">{team.region}</span>
                    </div>

                    <div className="guh-info-card__rows">
                      <div>
                        <small>Jugadores</small>
                        <strong>{team.players}</strong>
                      </div>
                      <div>
                        <small>Win rate</small>
                        <strong>{team.winRate}%</strong>
                      </div>
                      <div>
                        <small>Puntos</small>
                        <strong>{Number(team.points || 0).toLocaleString('es-DO')}</strong>
                      </div>
                      <div>
                        <small>Titulos</small>
                        <strong>{team.trophies}</strong>
                      </div>
                    </div>

                    <button type="button" className="guh-btn guh-btn--ghost guh-btn--full" onClick={() => navigate('/equipos')}>
                      Ver equipos
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No hay equipos listados"
                copy={`Todavia no hay equipos cargados para ${name}. Puedes crear el primero desde aqui.`}
                actionLabel="Crear equipo"
                onAction={() => navigate('/create-team')}
              />
            )}
          </section>

          <section id="creators" className="guh-panel guh-panel--creators">
            <SectionHeader
              icon={<FaPlay />}
              title="Creadores y cobertura"
              subtitle="Solo contenido util para seguir el juego: analisis, directos, clips y watch parties."
              actionLabel="Abrir TV"
              onAction={() => navigate('/tv')}
            />

            <div className="guh-card-grid">
              {creatorCards.map((creator) => (
                <article key={creator.title} className="guh-info-card">
                  <div className="guh-info-card__top">
                    <span className="guh-badge guh-badge--neutral">{creator.format}</span>
                  </div>
                  <h3>{creator.title}</h3>
                  <p className="guh-copy">{creator.description}</p>
                  <button type="button" className="guh-btn guh-btn--ghost guh-btn--full" onClick={() => navigate('/tv')}>
                    Ver cobertura
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section id="organizers" className="guh-panel guh-panel--organizers">
            <SectionHeader
              icon={<FaCalendarAlt />}
              title="Organizadores"
              subtitle="Quienes estan moviendo esta escena con torneos, activaciones y operacion del circuito."
              actionLabel="Crear torneo"
              onAction={() => navigate('/create-tournament')}
            />

            {organizerCards.length > 0 ? (
              <div className="guh-organizer-list">
                {organizerCards.map((organizer) => (
                  <article key={organizer.key} className="guh-organizer">
                    <div className="guh-organizer__icon">
                      <FaShieldAlt />
                    </div>
                    <div className="guh-organizer__body">
                      <div className="guh-organizer__top">
                        <h3>{organizer.name}</h3>
                        <span className="guh-badge guh-badge--neutral">Verificado</span>
                      </div>
                      <p>{organizer.description}</p>
                      <small>{organizer.tournamentsLabel}</small>
                    </div>
                    <button type="button" className="guh-btn guh-btn--ghost" onClick={() => navigate('/torneos')}>
                      Ver torneos
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No hay organizadores visibles"
                copy={`Cuando se registren organizadores para ${name}, apareceran aqui con su actividad.`}
                actionLabel="Postularme como organizador"
                onAction={() => navigate('/organizer-application')}
              />
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default CommunityGamePageTemplate;
