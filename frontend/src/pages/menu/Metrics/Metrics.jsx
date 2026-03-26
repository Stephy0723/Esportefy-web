import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import Chart from 'react-apexcharts';
import { API_URL } from '../../../config/api';
import PageHud from '../../../components/PageHud/PageHud';
import { supportedGamesDetailedData as gamesDetailedData } from '../../../data/supportedGamesDetailedData';
import AvatarCircle from '../../../components/AvatarCircle/AvatarCircle.jsx';
import { FRAMES } from '../../../data/profileOptions';
import PlayerTag from '../../../components/PlayerTag/PlayerTag';
import { resolveMediaUrl, getTeamFallback, applyImageFallback } from '../../../utils/media';
import { getAuthToken } from '../../../utils/authSession';
import { useAuth } from '../../../context/AuthContext';
import { fetchMyCommunities } from '../Community/community.service';
import './Metrics.css';

const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
};

const CONNECTION_PROVIDERS_IDS = ['riot', 'discord', 'moonton', 'steam', 'epic', 'twitch'];

const stagger = { visible: { transition: { staggerChildren: 0.06 } } };
const fadeChild = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }
};

const Metrics = () => {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [myTeams, setMyTeams] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [myCommunities, setMyCommunities] = useState([]);
    const [expandedMetric, setExpandedMetric] = useState(null);

    /* ── Fetch data ── */
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [profileRes, teamsRes, tournRes] = await Promise.all([
                    axios.get(`${API_URL}/api/auth/profile`),
                    axios.get(`${API_URL}/api/teams`),
                    axios.get(`${API_URL}/api/tournaments`)
                ]);
                const userData = profileRes.data;
                setUser(userData);

                const uid = String(userData._id);
                const allTeams = teamsRes.data || [];
                let list = [];
                if (Array.isArray(userData.teams) && userData.teams.length > 0) {
                    const ids = userData.teams.map(t => String(t?._id || t));
                    list = allTeams.filter(t => ids.includes(String(t._id)));
                } else {
                    list = allTeams.filter(t => {
                        const starters = Array.isArray(t.roster?.starters) ? t.roster.starters : [];
                        const subs = Array.isArray(t.roster?.subs) ? t.roster.subs : [];
                        const coach = t.roster?.coach;
                        return starters.some(p => String(p?.user) === uid) ||
                            subs.some(p => String(p?.user) === uid) ||
                            (coach && String(coach.user) === uid);
                    });
                }
                setMyTeams(list);
                setTournaments(tournRes.data || []);

                if (getAuthToken()) {
                    const comms = await fetchMyCommunities();
                    setMyCommunities(Array.isArray(comms) ? comms : []);
                }
            } catch {
                /* silent */
            } finally {
                setLoading(false);
            }
        };
        if (authUser?._id) setUser(authUser);
        fetchAll();
    }, [authUser]);

    /* ── Derived data ── */
    const enrichedGames = useMemo(() =>
        (user?.selectedGames || []).map(id => gamesDetailedData[id]).filter(Boolean),
    [user?.selectedGames]);

    const accountAgeDays = useMemo(() => {
        if (!user?.createdAt) return 0;
        return Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000);
    }, [user?.createdAt]);

    const connCount = useMemo(() =>
        CONNECTION_PROVIDERS_IDS.filter(id => !!user?.connections?.[id === 'moonton' ? 'mlbb' : id]?.verified).length,
    [user?.connections]);

    /* ── User's tournaments ── */
    const myTournaments = useMemo(() => {
        if (!myTeams.length || !tournaments.length) return [];
        const teamIds = myTeams.map(t => String(t._id));
        return tournaments.filter(t => {
            const regs = Array.isArray(t.registrations) ? t.registrations : [];
            return regs.some(r => teamIds.includes(String(r.team?._id || r.team)));
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [myTeams, tournaments]);

    const finishedTournaments = useMemo(() =>
        myTournaments.filter(t => t.status === 'finished'),
    [myTournaments]);

    /* ── Last tournament bracket analysis ── */
    const lastTournamentAnalysis = useMemo(() => {
        const lastFinished = finishedTournaments[0];
        const lastAny = myTournaments[0];
        const target = lastFinished || lastAny;
        if (!target || !myTeams.length) return null;

        const teamIds = myTeams.map(t => String(t._id));
        const rounds = target.bracket?.rounds || [];
        let matchesPlayed = 0, matchesWon = 0, matchesLost = 0;
        let maxRound = 0;
        const matchResults = [];

        rounds.forEach(round => {
            (round.matches || []).forEach(match => {
                const isTeamA = teamIds.includes(String(match.teamA?.teamId));
                const isTeamB = teamIds.includes(String(match.teamB?.teamId));
                if (!isTeamA && !isTeamB) return;
                if (match.status !== 'finished' && match.status !== 'walkover') return;

                matchesPlayed++;
                const myTeamSide = isTeamA ? 'A' : 'B';
                const winnerTeamId = String(match.winnerTeamId || '');
                const myTeamId = isTeamA ? String(match.teamA?.teamId) : String(match.teamB?.teamId);
                const won = winnerTeamId === myTeamId;
                if (won) { matchesWon++; maxRound = Math.max(maxRound, round.round || 0); }
                else matchesLost++;

                matchResults.push({
                    round: round.round || 0,
                    roundName: round.name || `Ronda ${round.round}`,
                    opponent: isTeamA ? match.teamB?.teamName : match.teamA?.teamName,
                    opponentLogo: isTeamA ? match.teamB?.logoUrl : match.teamA?.logoUrl,
                    scoreA: match.scoreA,
                    scoreB: match.scoreB,
                    myScore: isTeamA ? match.scoreA : match.scoreB,
                    oppScore: isTeamA ? match.scoreB : match.scoreA,
                    won,
                    side: myTeamSide
                });
            });
        });

        const totalRounds = rounds.length;
        const myTeamInTournament = myTeams.find(t => {
            const regs = Array.isArray(target.registrations) ? target.registrations : [];
            return regs.some(r => String(r.team?._id || r.team) === String(t._id));
        });

        return {
            tournament: target,
            team: myTeamInTournament,
            matchesPlayed,
            matchesWon,
            matchesLost,
            maxRound,
            totalRounds,
            matchResults,
            winRate: matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0
        };
    }, [finishedTournaments, myTournaments, myTeams]);

    /* ── Team analysis ── */
    const teamAnalysis = useMemo(() => {
        return myTeams.map(team => {
            const uid = String(user?._id || '');
            const cid = String(team.captain?._id || team.captain);
            const isCaptain = cid === uid;
            const starters = Array.isArray(team.roster?.starters) ? team.roster.starters.filter(p => p && (p.user || p.nickname)) : [];
            const subs = Array.isArray(team.roster?.subs) ? team.roster.subs.filter(p => p && (p.user || p.nickname)) : [];
            const hasCoach = !!(team.roster?.coach && (team.roster.coach.user || team.roster.coach.nickname));
            const filledSlots = starters.length + subs.length + (hasCoach ? 1 : 0);
            const maxSlots = (team.maxMembers || 5) + (team.maxSubstitutes || 0) + 1;
            const fillRate = maxSlots > 0 ? Math.round((filledSlots / maxSlots) * 100) : 0;

            const teamTournaments = tournaments.filter(t => {
                const regs = Array.isArray(t.registrations) ? t.registrations : [];
                return regs.some(r => String(r.team?._id || r.team) === String(team._id));
            });

            return {
                team,
                isCaptain,
                role: isCaptain ? 'Capitán' : starters.some(p => String(p.user) === uid) ? 'Titular' : subs.some(p => String(p.user) === uid) ? 'Suplente' : 'Miembro',
                filledSlots,
                maxSlots,
                fillRate,
                tournamentCount: teamTournaments.length,
                finishedCount: teamTournaments.filter(t => t.status === 'finished').length,
                ageDays: team.createdAt ? Math.floor((Date.now() - new Date(team.createdAt).getTime()) / 86400000) : 0
            };
        });
    }, [myTeams, tournaments, user?._id]);

    /* ── 5 Metrics with full 5 tips each ── */
    const metricsData = useMemo(() => {
        if (!user) return [];
        const totalTourneys = myTournaments.length;
        const finishedCount = finishedTournaments.length;
        const winRate = totalTourneys > 0 ? Math.round((finishedCount / totalTourneys) * 100) : 0;

        const captainTeams = myTeams.filter(t => String(t.captain?._id || t.captain) === String(user._id)).length;
        const leadershipScore = Math.min(100, captainTeams * 25 + (myTeams.length * 10));
        const networkScore = Math.min(100, connCount * 15 + myCommunities.length * 10 + myTeams.length * 10);
        const consistencyScore = Math.min(100, Math.round((accountAgeDays / 365) * 40) + (enrichedGames.length * 8) + (myTeams.length * 10));

        const versatilityCategories = {};
        enrichedGames.forEach(g => { if (g.category) versatilityCategories[g.category] = (versatilityCategories[g.category] || 0) + 1; });
        const versatilityScore = Math.min(100, Object.keys(versatilityCategories).length * 20 + enrichedGames.length * 5);
        const catKeys = Object.keys(versatilityCategories);
        const catValues = Object.values(versatilityCategories);

        const mainGame = enrichedGames[0]?.name || 'tu juego principal';

        return [
            {
                id: 'winrate', icon: 'bx bx-trophy', label: 'WIN RATE', color: '#ffd700',
                value: `${winRate}%`, numericValue: winRate,
                subtitle: totalTourneys === 0 ? 'Sin torneos aún' : `${finishedCount}/${totalTourneys} completados`,
                definition: totalTourneys === 0
                    ? 'Mide tu porcentaje de torneos completados. Inscríbete en uno para empezar a trackear tu rendimiento.'
                    : `Has completado ${finishedCount} de ${totalTourneys} torneos. ${winRate >= 60 ? 'Excelente rendimiento.' : winRate >= 30 ? 'Buen progreso.' : 'Hay espacio para mejorar.'}`,
                chartType: 'radialBar',
                tips: totalTourneys === 0 ? [
                    'Inscríbete en tu primer torneo — la experiencia es el mejor maestro',
                    `Busca torneos de ${mainGame} con nivel principiante o abierto`,
                    'Forma o únete a un equipo antes de competir',
                    'Mira VODs de torneos para entender el formato competitivo',
                    'Configura tu perfil: avatar, bio, juegos y cuentas vinculadas'
                ] : winRate < 30 ? [
                    'Analiza tus derrotas — ¿estrategia, mecánica o comunicación?',
                    `Practica mecánicas específicas de ${mainGame} en modo personalizado`,
                    'Revisa guías y VODs de jugadores top en tu rol',
                    'Enfócate en 1 torneo a la vez, no te disperses',
                    'Graba tus partidas y revísalas con tu equipo'
                ] : winRate < 60 ? [
                    'Buen camino — mantén la consistencia en entrenamiento',
                    'Identifica tu error más frecuente y corrígelo',
                    `Domina 2-3 composiciones meta en ${mainGame}`,
                    'Mejora la comunicación: calls claras ganan rondas',
                    'Estudia a los rivales antes de cada torneo'
                ] : [
                    'Excelente — apunta a torneos de mayor nivel',
                    'Mentorear a otros refuerza tus propios fundamentos',
                    'Mantén tu roster estable — la sinergia es tu ventaja',
                    'Adapta estrategias al meta antes que los rivales',
                    'Documenta tus estrategias ganadoras para replicarlas'
                ],
                plan: totalTourneys === 0
                    ? `Semana 1: Explora torneos de ${mainGame}. Semana 2: Forma equipo. Semana 3: Inscríbete. Semana 4: Compite y aprende.`
                    : winRate < 30
                        ? `Semana 1-2: 1h diaria de práctica en ${mainGame}. Semana 3: Revisa tus últimas 3 derrotas. Mes 2: Aplica lo aprendido en 1 torneo.`
                        : winRate < 60
                            ? `Semana 1: Perfecciona picks + 1 counter. Semana 2-3: 3+ scrims con equipo. Meta: +10% win rate en 2 torneos.`
                            : 'Busca torneos de mayor prize pool. Postúlate como capitán/coach. Mantén el ritmo y analiza tendencias del meta.'
            },
            {
                id: 'leadership', icon: 'bx bx-crown', label: 'LIDERAZGO', color: '#a78bfa',
                value: `${leadershipScore}`, numericValue: leadershipScore,
                subtitle: captainTeams > 0 ? `Capitán de ${captainTeams} equipo${captainTeams > 1 ? 's' : ''}` : `${myTeams.length} equipo${myTeams.length !== 1 ? 's' : ''}`,
                definition: captainTeams > 0
                    ? `Lideras ${captainTeams} equipo${captainTeams > 1 ? 's' : ''} y participas en ${myTeams.length} en total.`
                    : myTeams.length > 0
                        ? `Miembro de ${myTeams.length} equipo${myTeams.length > 1 ? 's' : ''}. Crea tu propio equipo para subir.`
                        : 'Sin equipos aún. Crear o unirte a uno es el primer paso.',
                chartType: 'donut',
                chartSeries: [Math.max(1, captainTeams * 25), Math.max(1, myTeams.length * 10), Math.max(1, 100 - leadershipScore)],
                chartLabels: ['Capitán', 'Equipos', 'Potencial'],
                tips: captainTeams === 0 && myTeams.length === 0 ? [
                    'Crea tu primer equipo — ser capitán es la base del liderazgo',
                    `Recluta 4 jugadores activos de ${mainGame}`,
                    'Define nombre, slogan y reglas claras para tu equipo',
                    'Establece un horario de prácticas semanal',
                    'Busca jugadores en comunidades y torneos'
                ] : captainTeams === 0 ? [
                    'Propón ideas de estrategia para destacar en tu equipo',
                    'Considera crear tu propio equipo en otro juego',
                    'Ayuda al capitán con la coordinación de prácticas',
                    'Toma iniciativa en entrenamientos — lidera con el ejemplo',
                    'Propón revisiones post-torneo para mejorar en conjunto'
                ] : [
                    `Lidera ${captainTeams} equipo${captainTeams > 1 ? 's' : ''} — organiza prácticas semanales`,
                    'Rota roles en entrenamientos para entender todas las posiciones',
                    'Inscribe a tu equipo en el próximo torneo disponible',
                    'Da feedback constructivo a cada miembro después de cada partida',
                    leadershipScore < 60 ? 'Completa tu roster — un equipo lleno rinde mejor' : 'Celebra victorias y aprende de derrotas con tu equipo'
                ],
                plan: captainTeams === 0
                    ? `Semana 1: Crea equipo de ${mainGame}. Semana 2: Recluta miembros. Semana 3: Primera práctica. Semana 4: Primer torneo.`
                    : 'Prácticas semanales. Torneo mensual. Evalúa rendimiento del roster tras cada competencia.'
            },
            {
                id: 'network', icon: 'bx bx-network-chart', label: 'RED SOCIAL', color: '#00d2ff',
                value: `${networkScore}`, numericValue: networkScore,
                subtitle: `${connCount} cuentas · ${myCommunities.length} comunidades · ${myTeams.length} equipos`,
                definition: `Tu red: ${connCount} cuentas vinculadas, ${myCommunities.length} comunidades y ${myTeams.length} equipos. ${networkScore >= 70 ? 'Excelente presencia.' : 'Hay espacio para crecer.'}`,
                chartType: 'stackedBars',
                chartSeries: [
                    { name: 'Conexiones', data: [Math.max(1, connCount), Math.max(1, Math.ceil(connCount * 0.7)), Math.max(1, Math.ceil(connCount * 0.85)), Math.max(1, connCount)] },
                    { name: 'Comunidades', data: [Math.max(1, myCommunities.length), Math.max(1, Math.ceil(myCommunities.length * 0.8)), Math.max(1, myCommunities.length), Math.max(1, Math.ceil(myCommunities.length * 0.9))] },
                    { name: 'Equipos', data: [Math.max(1, myTeams.length), Math.max(1, Math.ceil(myTeams.length * 0.7)), Math.max(1, myTeams.length), Math.max(1, Math.ceil(myTeams.length * 0.8))] }
                ],
                chartAxis: ['S1', 'S2', 'S3', 'S4'],
                tips: connCount < 2 ? [
                    'Vincula Discord y Riot/MLBB — esenciales para competir',
                    'Ve a Ajustes y conecta al menos 2 plataformas',
                    `Únete a una comunidad de ${mainGame}`,
                    'Agrega amigos después de cada torneo',
                    'Comparte tu perfil en tus redes sociales'
                ] : [
                    `${connCount} cuentas vinculadas — mantén perfiles actualizados`,
                    myCommunities.length === 0 ? `Únete a una comunidad de ${mainGame}` : `Activo en ${myCommunities.length} comunidad${myCommunities.length > 1 ? 'es' : ''} — participa más`,
                    'Agrega amigos de cada torneo que juegues',
                    'Participa en eventos comunitarios para ganar visibilidad',
                    'Conecta todas tus cuentas para que otros te encuentren'
                ],
                plan: networkScore < 40
                    ? `Prioridad: Vincula cuentas en Ajustes. Únete a 1-2 comunidades de ${mainGame}. Agrega 5 amigos.`
                    : 'Participa en comunidades, agrega compañeros de torneo y mantén tu perfil al día.'
            },
            {
                id: 'consistency', icon: 'bx bx-line-chart', label: 'CONSISTENCIA', color: '#8EDB15',
                value: `${consistencyScore}`, numericValue: consistencyScore,
                subtitle: `${accountAgeDays} días en la plataforma`,
                definition: `${accountAgeDays} días en GLITCH GANG con ${enrichedGames.length} juego${enrichedGames.length !== 1 ? 's' : ''} y ${myTeams.length} equipo${myTeams.length !== 1 ? 's' : ''}.`,
                chartType: 'stackedBars',
                chartSeries: [
                    { name: 'Antigüedad', data: [Math.max(1, Math.ceil(accountAgeDays / 30)), Math.max(1, Math.ceil(accountAgeDays / 45)), Math.max(1, Math.ceil(accountAgeDays / 25)), Math.max(1, Math.ceil(accountAgeDays / 30))] },
                    { name: 'Juegos', data: [Math.max(1, enrichedGames.length), Math.max(1, Math.ceil(enrichedGames.length * 0.8)), Math.max(1, enrichedGames.length), Math.max(1, Math.ceil(enrichedGames.length * 0.9))] },
                    { name: 'Equipos', data: [Math.max(1, myTeams.length), Math.max(1, Math.ceil(myTeams.length * 0.8)), Math.max(1, myTeams.length), Math.max(1, Math.ceil(myTeams.length * 0.9))] }
                ],
                chartAxis: ['S1', 'S2', 'S3', 'S4'],
                tips: accountAgeDays < 7 ? [
                    'Acabas de llegar — completa tu perfil',
                    'Añade tus juegos favoritos y configura tu avatar',
                    'Explora las comunidades de tus juegos',
                    'Vincula al menos una cuenta de juego',
                    'Revisa los torneos disponibles'
                ] : accountAgeDays < 30 ? [
                    `${accountAgeDays} días — buen ritmo, sigue activo`,
                    'Inscríbete en tu primer torneo',
                    enrichedGames.length < 3 ? 'Añade más juegos a tu perfil' : 'Buen catálogo — mantén perfil actualizado',
                    myTeams.length === 0 ? 'Únete a un equipo' : `Mantén actividad con tus equipos`,
                    'Revisa tu dashboard semanalmente'
                ] : [
                    `Veterano de ${Math.floor(accountAgeDays / 30)} mes${Math.floor(accountAgeDays / 30) > 1 ? 'es' : ''}`,
                    enrichedGames.length < 3 ? 'Añade más juegos' : `${enrichedGames.length} juegos activos — sólido`,
                    myTeams.length === 0 ? 'Únete a un equipo' : `Mantén tus ${myTeams.length} equipos activos`,
                    'Participa en 1 torneo al mes mínimo',
                    'Actualiza bio y avatar periódicamente'
                ],
                plan: consistencyScore < 40
                    ? `Completa perfil al 100%. Añade juegos. Únete a equipo de ${mainGame}. Torneo este mes.`
                    : 'Mantén actividad mensual. Actualiza perfil regularmente. 1 torneo al mes mínimo.'
            },
            {
                id: 'versatility', icon: 'bx bx-category-alt', label: 'VERSATILIDAD', color: '#f97316',
                value: `${versatilityScore}`, numericValue: versatilityScore,
                subtitle: `${enrichedGames.length} juego${enrichedGames.length !== 1 ? 's' : ''} · ${catKeys.length} género${catKeys.length !== 1 ? 's' : ''}`,
                definition: `${enrichedGames.length} juego${enrichedGames.length !== 1 ? 's' : ''} en ${catKeys.length} género${catKeys.length !== 1 ? 's' : ''}. ${versatilityScore >= 60 ? 'Perfil versátil.' : 'Explora nuevos géneros.'}`,
                chartType: 'donutMulti',
                chartSeries: catValues.length > 0 ? catValues : [1, 1, 1],
                chartLabels: catKeys.length > 0 ? catKeys : ['Tu género', 'Otros', 'Por explorar'],
                tips: catKeys.length <= 1 ? [
                    'Solo 1 género — explora otros para ser más versátil',
                    'Prueba estrategia si solo juegas FPS, o viceversa',
                    `${enrichedGames.length} juego${enrichedGames.length !== 1 ? 's' : ''} — ${enrichedGames.length < 5 ? 'añade más' : 'buena colección'}`,
                    'Las habilidades de un género mejoran tu rendimiento en otros',
                    'Compite en torneos de juegos que no domines'
                ] : catKeys.length < 3 ? [
                    `${catKeys.length} géneros — agrega 1 más para subir`,
                    'Las habilidades se transfieren entre géneros',
                    `${enrichedGames.length} juego${enrichedGames.length !== 1 ? 's' : ''} — ${enrichedGames.length < 5 ? 'añade más' : 'buena colección'}`,
                    'Inscríbete en torneo de un juego diferente',
                    'Mira tutoriales de géneros nuevos'
                ] : [
                    `${catKeys.length} géneros — perfil completo`,
                    'Compite en torneos de diferentes juegos',
                    `${enrichedGames.length} juegos — buena colección`,
                    'Comparte tips entre géneros con tu equipo',
                    'Mantén colección actualizada y prueba lanzamientos nuevos'
                ],
                plan: versatilityScore < 30
                    ? 'Añade 3+ juegos de diferentes géneros. Prueba un juego nuevo esta semana.'
                    : versatilityScore < 60
                        ? `Añade 1 juego de género nuevo. Torneo diferente a ${mainGame}.`
                        : 'Mantén colección actualizada. Compite en múltiples juegos.'
            }
        ];
    }, [user, myTournaments, finishedTournaments, myTeams, connCount, myCommunities, accountAgeDays, enrichedGames]);

    /* ── Overall score ── */
    const overallScore = useMemo(() => {
        if (!metricsData.length) return 0;
        return Math.round(metricsData.reduce((sum, m) => sum + m.numericValue, 0) / metricsData.length);
    }, [metricsData]);

    const weakestMetric = useMemo(() => {
        if (!metricsData.length) return null;
        return metricsData.reduce((min, m) => m.numericValue < min.numericValue ? m : min, metricsData[0]);
    }, [metricsData]);

    const strongestMetric = useMemo(() => {
        if (!metricsData.length) return null;
        return metricsData.reduce((max, m) => m.numericValue > max.numericValue ? m : max, metricsData[0]);
    }, [metricsData]);

    const currentFrame = FRAMES.find(f => f.id === user?.selectedFrameId) || FRAMES[0];

    const resolveTeamRole = useCallback((team) => {
        if (!team || !user?._id) return '';
        const uid = String(user._id);
        if (String(team.captain?._id || team.captain) === uid) return 'Capitán';
        const starters = Array.isArray(team.roster?.starters) ? team.roster.starters : [];
        const subs = Array.isArray(team.roster?.subs) ? team.roster.subs : [];
        if (starters.some(p => String(p?.user) === uid)) return 'Titular';
        if (subs.some(p => String(p?.user) === uid)) return 'Suplente';
        if (team.roster?.coach && String(team.roster.coach.user) === uid) return 'Coach';
        return 'Miembro';
    }, [user?._id]);

    /* ── Render helpers ── */
    const renderChart = (m, size = 220) => {
        if (m.chartType === 'radialBar') {
            return <Chart options={{
                chart: { type: 'radialBar', background: 'transparent', sparkline: { enabled: true } },
                plotOptions: { radialBar: { startAngle: -135, endAngle: 135, hollow: { size: '60%' }, track: { background: 'rgba(255,255,255,0.04)' }, dataLabels: { name: { show: true, fontSize: '11px', color: m.color, offsetY: 22 }, value: { show: true, fontSize: '36px', fontWeight: 900, color: m.color, offsetY: -10, formatter: () => m.value } } } },
                colors: [m.color], labels: [m.label], stroke: { lineCap: 'round' }, theme: { mode: 'dark' }
            }} series={[m.numericValue]} type="radialBar" height={size} />;
        }
        if (m.chartType === 'donut') {
            return <Chart options={{
                chart: { type: 'donut', background: 'transparent' },
                colors: [m.color, hexToRgba(m.color, 0.5), 'rgba(255,255,255,0.06)'],
                labels: m.chartLabels, legend: { show: true, position: 'bottom', labels: { colors: '#999' }, fontSize: '11px' },
                dataLabels: { enabled: false },
                plotOptions: { pie: { donut: { size: '58%', labels: { show: true, total: { show: true, label: m.label, color: '#888', fontSize: '10px', formatter: () => m.value } } } } },
                stroke: { width: 2, colors: ['transparent'] }, theme: { mode: 'dark' }
            }} series={m.chartSeries} type="donut" height={size} />;
        }
        if (m.chartType === 'stackedBars') {
            return <Chart options={{
                chart: { type: 'bar', stacked: true, background: 'transparent', toolbar: { show: false } },
                colors: [m.color, hexToRgba(m.color, 0.7), hexToRgba(m.color, 0.4)],
                plotOptions: { bar: { columnWidth: '40%', borderRadius: 3, borderRadiusApplication: 'end' } },
                dataLabels: { enabled: false }, stroke: { show: false },
                xaxis: { categories: m.chartAxis || [], labels: { style: { colors: 'rgba(255,255,255,0.4)', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
                yaxis: { labels: { show: false } },
                grid: { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 3, xaxis: { lines: { show: false } } },
                legend: { show: true, position: 'bottom', labels: { colors: '#999' }, fontSize: '10px', markers: { size: 5 } },
                tooltip: { theme: 'dark' }, theme: { mode: 'dark' }
            }} series={m.chartSeries} type="bar" height={size} />;
        }
        if (m.chartType === 'donutMulti') {
            const palette = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];
            return <Chart options={{
                chart: { type: 'donut', background: 'transparent' },
                colors: (m.chartLabels || []).map((_, i) => palette[i % palette.length]),
                labels: m.chartLabels, legend: { show: true, position: 'bottom', labels: { colors: '#999' }, fontSize: '11px' },
                dataLabels: { enabled: true, style: { fontSize: '12px', fontWeight: 700 }, dropShadow: { enabled: false } },
                plotOptions: { pie: { donut: { size: '52%', labels: { show: true, total: { show: true, label: 'TOTAL', color: '#888', fontSize: '10px', formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0) } } } } },
                stroke: { width: 3, colors: ['rgba(0,0,0,0.3)'] }, theme: { mode: 'dark' }
            }} series={m.chartSeries} type="donut" height={size} />;
        }
        return null;
    };

    if (loading) {
        return <div className="mt-loading"><div className="mt-loading__pulse"></div><p>Cargando métricas...</p></div>;
    }
    if (!user) {
        return <div className="mt-loading"><p>No se pudo cargar tu perfil.</p></div>;
    }

    return (
        <div className="mt">
            <PageHud page="MÉTRICAS" />

            {/* ═══ HEADER ═══ */}
            <section className="mt__header">
                <motion.div className="mt__header-inner" initial="hidden" animate="visible" variants={stagger}>
                    <motion.div className="mt__header-profile" variants={fadeChild}>
                        <AvatarCircle src={resolveMediaUrl(user.avatar) || `https://ui-avatars.com/api/?name=${user.username}`} frameConfig={currentFrame} size="80px" status={user.status} />
                        <div className="mt__header-info">
                            <PlayerTag name={user.username?.toUpperCase()} tagId={user.selectedTagId} size="small" fontTag="1.4rem" />
                            <span className="mt__header-sub">{user.country || ''} · {enrichedGames.length} juegos · {myTeams.length} equipos</span>
                        </div>
                    </motion.div>

                    <motion.div className="mt__header-score" variants={fadeChild}>
                        <div className="mt__overall-ring">
                            <Chart options={{
                                chart: { type: 'radialBar', background: 'transparent', sparkline: { enabled: true } },
                                plotOptions: { radialBar: { startAngle: -135, endAngle: 135, hollow: { size: '65%' }, track: { background: 'rgba(255,255,255,0.04)' }, dataLabels: { name: { show: true, fontSize: '10px', color: '#8EDB15', offsetY: 20 }, value: { show: true, fontSize: '32px', fontWeight: 900, color: '#8EDB15', offsetY: -8, formatter: () => `${overallScore}` } } } },
                                colors: ['#8EDB15'], labels: ['OVERALL'], stroke: { lineCap: 'round' }, theme: { mode: 'dark' }
                            }} series={[overallScore]} type="radialBar" height={180} />
                        </div>
                        <div className="mt__overall-labels">
                            {strongestMetric && <span className="mt__overall-label mt__overall-label--strong"><i className="bx bx-up-arrow-alt"></i> Más fuerte: {strongestMetric.label}</span>}
                            {weakestMetric && <span className="mt__overall-label mt__overall-label--weak"><i className="bx bx-down-arrow-alt"></i> A mejorar: {weakestMetric.label}</span>}
                        </div>
                    </motion.div>

                    {/* Radar chart */}
                    <motion.div className="mt__header-radar" variants={fadeChild}>
                        <Chart options={{
                            chart: { type: 'radar', background: 'transparent', toolbar: { show: false } },
                            xaxis: { categories: metricsData.map(m => m.label) },
                            yaxis: { show: false, max: 100 },
                            colors: ['#8EDB15'],
                            fill: { opacity: 0.2 },
                            stroke: { width: 2 },
                            markers: { size: 4, colors: ['#8EDB15'] },
                            plotOptions: { radar: { polygons: { strokeColors: 'rgba(255,255,255,0.08)', fill: { colors: ['transparent', 'rgba(255,255,255,0.02)'] } } } },
                            tooltip: { theme: 'dark' }, theme: { mode: 'dark' }
                        }} series={[{ name: 'Score', data: metricsData.map(m => m.numericValue) }]} type="radar" height={250} />
                    </motion.div>
                </motion.div>

                <button className="mt__back-btn" onClick={() => navigate('/dashboard')}>
                    <i className="bx bx-arrow-back"></i> Dashboard
                </button>
            </section>

            {/* ═══ LAST TOURNAMENT ═══ */}
            <section className="mt__section">
                <h2 className="mt__section-title"><i className="bx bx-trophy" style={{ color: '#ffd700' }}></i> Último Torneo</h2>
                {lastTournamentAnalysis ? (
                    <motion.div className="mt__tournament" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                        <motion.div className="mt__tourn-header" variants={fadeChild}>
                            <div className="mt__tourn-info">
                                <h3>{lastTournamentAnalysis.tournament.title}</h3>
                                <div className="mt__tourn-meta">
                                    <span><i className="bx bx-game"></i> {lastTournamentAnalysis.tournament.game}</span>
                                    <span><i className="bx bx-calendar"></i> {new Date(lastTournamentAnalysis.tournament.date).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    <span><i className="bx bx-group"></i> {lastTournamentAnalysis.team?.name || 'Tu equipo'}</span>
                                    {lastTournamentAnalysis.tournament.bracket?.format?.type && (
                                        <span><i className="bx bx-layout"></i> {lastTournamentAnalysis.tournament.bracket.format.type.replace(/_/g, ' ')}</span>
                                    )}
                                </div>
                            </div>
                            <div className="mt__tourn-stats">
                                <div className="mt__tourn-stat">
                                    <span className="mt__tourn-stat-val">{lastTournamentAnalysis.matchesPlayed}</span>
                                    <span className="mt__tourn-stat-lbl">Partidas</span>
                                </div>
                                <div className="mt__tourn-stat mt__tourn-stat--won">
                                    <span className="mt__tourn-stat-val">{lastTournamentAnalysis.matchesWon}</span>
                                    <span className="mt__tourn-stat-lbl">Victorias</span>
                                </div>
                                <div className="mt__tourn-stat mt__tourn-stat--lost">
                                    <span className="mt__tourn-stat-val">{lastTournamentAnalysis.matchesLost}</span>
                                    <span className="mt__tourn-stat-lbl">Derrotas</span>
                                </div>
                                <div className="mt__tourn-stat">
                                    <span className="mt__tourn-stat-val">{lastTournamentAnalysis.winRate}%</span>
                                    <span className="mt__tourn-stat-lbl">Win Rate</span>
                                </div>
                            </div>
                        </motion.div>

                        {lastTournamentAnalysis.matchResults.length > 0 && (
                            <motion.div className="mt__tourn-matches" variants={stagger}>
                                <h4 className="mt__tourn-matches-title">Resultados por ronda</h4>
                                {lastTournamentAnalysis.matchResults.map((match, i) => (
                                    <motion.div key={i} className={`mt__tourn-match ${match.won ? 'mt__tourn-match--won' : 'mt__tourn-match--lost'}`} variants={fadeChild}>
                                        <span className="mt__tourn-match-round">{match.roundName}</span>
                                        <span className="mt__tourn-match-vs">vs {match.opponent || 'TBD'}</span>
                                        <span className="mt__tourn-match-score">
                                            {match.myScore ?? '—'} - {match.oppScore ?? '—'}
                                        </span>
                                        <span className={`mt__tourn-match-result ${match.won ? 'mt__tourn-match-result--w' : 'mt__tourn-match-result--l'}`}>
                                            {match.won ? 'VICTORIA' : 'DERROTA'}
                                        </span>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {lastTournamentAnalysis.matchResults.length === 0 && (
                            <div className="mt__empty-sub">
                                <p>El torneo no tiene resultados de bracket registrados aún</p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <div className="mt__empty">
                        <i className="bx bx-trophy"></i>
                        <p>No has participado en torneos aún</p>
                        <button className="mt__btn mt__btn--primary" onClick={() => navigate('/tournaments')}>
                            <i className="bx bx-search"></i> Buscar torneos
                        </button>
                    </div>
                )}
            </section>

            {/* ═══ TEAM PERFORMANCE ═══ */}
            <section className="mt__section">
                <h2 className="mt__section-title"><i className="bx bx-group" style={{ color: '#a78bfa' }}></i> Rendimiento de Equipos</h2>
                {teamAnalysis.length > 0 ? (
                    <motion.div className="mt__teams-grid" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                        {teamAnalysis.map(ta => (
                            <motion.div key={ta.team._id} className="mt__team-card" variants={fadeChild}>
                                <div className="mt__team-card-head">
                                    <div className="mt__team-card-logo">
                                        {ta.team.logo ? (
                                            <img src={resolveMediaUrl(ta.team.logo)} alt={ta.team.name} onError={(e) => applyImageFallback(e, getTeamFallback(ta.team.name))} />
                                        ) : <i className="bx bx-group"></i>}
                                    </div>
                                    <div className="mt__team-card-info">
                                        <strong>{ta.team.name}</strong>
                                        <span>{ta.team.game || 'Sin juego'} · {ta.role}</span>
                                    </div>
                                    {ta.isCaptain && <span className="mt__team-badge"><i className="bx bx-crown"></i></span>}
                                </div>
                                <div className="mt__team-card-stats">
                                    <div className="mt__team-card-stat">
                                        <span className="mt__team-card-stat-val">{ta.filledSlots}/{ta.maxSlots}</span>
                                        <span className="mt__team-card-stat-lbl">Roster</span>
                                    </div>
                                    <div className="mt__team-card-stat">
                                        <span className="mt__team-card-stat-val">{ta.tournamentCount}</span>
                                        <span className="mt__team-card-stat-lbl">Torneos</span>
                                    </div>
                                    <div className="mt__team-card-stat">
                                        <span className="mt__team-card-stat-val">{ta.ageDays}d</span>
                                        <span className="mt__team-card-stat-lbl">Antigüedad</span>
                                    </div>
                                </div>
                                <div className="mt__team-card-bar">
                                    <div className="mt__team-card-fill" style={{ width: `${ta.fillRate}%` }}></div>
                                </div>
                                <span className="mt__team-card-fill-label">Roster {ta.fillRate}% completo</span>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="mt__empty">
                        <i className="bx bx-group"></i>
                        <p>No perteneces a ningún equipo</p>
                        <button className="mt__btn mt__btn--primary" onClick={() => navigate('/create-team')}>
                            <i className="bx bx-plus"></i> Crear equipo
                        </button>
                    </div>
                )}
            </section>

            {/* ═══ 5 METRICS DETAIL ═══ */}
            <section className="mt__section">
                <h2 className="mt__section-title"><i className="bx bx-bar-chart-alt-2" style={{ color: '#8EDB15' }}></i> Análisis de Métricas</h2>
                <motion.div className="mt__metrics-list" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                    {metricsData.map(m => {
                        const isExpanded = expandedMetric === m.id;
                        return (
                            <motion.div key={m.id} className={`mt__metric-card ${isExpanded ? 'mt__metric-card--expanded' : ''}`} variants={fadeChild} style={{ '--mt-c': m.color }}>
                                <div className="mt__metric-card-top" onClick={() => setExpandedMetric(isExpanded ? null : m.id)}>
                                    <div className="mt__metric-card-icon"><i className={m.icon}></i></div>
                                    <div className="mt__metric-card-main">
                                        <div className="mt__metric-card-label">{m.label}</div>
                                        <div className="mt__metric-card-subtitle">{m.subtitle}</div>
                                    </div>
                                    <div className="mt__metric-card-score">{m.value}</div>
                                    <i className={`bx bx-chevron-${isExpanded ? 'up' : 'down'} mt__metric-card-chevron`}></i>
                                </div>

                                {/* Progress bar */}
                                <div className="mt__metric-card-bar">
                                    <div className="mt__metric-card-fill" style={{ width: `${m.numericValue}%` }}></div>
                                </div>

                                {isExpanded && (
                                    <div className="mt__metric-card-detail">
                                        <div className="mt__metric-detail-split">
                                            <div className="mt__metric-chart-col">{renderChart(m, 240)}</div>
                                            <div className="mt__metric-info-col">
                                                <div className="mt__metric-block">
                                                    <h4><i className="bx bx-book-open" style={{ color: m.color }}></i> Qué mide</h4>
                                                    <p>{m.definition}</p>
                                                </div>
                                                <div className="mt__metric-block">
                                                    <h4><i className="bx bx-bulb" style={{ color: m.color }}></i> 5 Consejos</h4>
                                                    <ul className="mt__metric-tips">
                                                        {m.tips.map((tip, i) => (
                                                            <li key={i}><i className="bx bx-check" style={{ color: m.color }}></i> {tip}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="mt__metric-block">
                                                    <h4><i className="bx bx-target-lock" style={{ color: m.color }}></i> Plan de Mejora</h4>
                                                    <p className="mt__metric-plan">{m.plan}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>
            </section>

            {/* ═══ IMPROVEMENT ROADMAP ═══ */}
            {weakestMetric && (
                <section className="mt__section mt__section--roadmap">
                    <h2 className="mt__section-title"><i className="bx bx-road" style={{ color: '#ff6b6b' }}></i> Hoja de Ruta</h2>
                    <motion.div className="mt__roadmap" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeChild}>
                        <div className="mt__roadmap-focus">
                            <div className="mt__roadmap-focus-icon" style={{ color: weakestMetric.color, borderColor: hexToRgba(weakestMetric.color, 0.3) }}>
                                <i className={weakestMetric.icon}></i>
                            </div>
                            <div className="mt__roadmap-focus-info">
                                <span className="mt__roadmap-kicker">Tu área de mayor oportunidad</span>
                                <h3>{weakestMetric.label} — {weakestMetric.value}</h3>
                                <p>{weakestMetric.plan}</p>
                            </div>
                        </div>
                        <div className="mt__roadmap-actions">
                            {weakestMetric.id === 'winrate' && <button className="mt__btn mt__btn--outline" onClick={() => navigate('/tournaments')}><i className="bx bx-trophy"></i> Buscar torneos</button>}
                            {weakestMetric.id === 'leadership' && <button className="mt__btn mt__btn--outline" onClick={() => navigate('/create-team')}><i className="bx bx-group"></i> Crear equipo</button>}
                            {weakestMetric.id === 'network' && <button className="mt__btn mt__btn--outline" onClick={() => navigate('/settings')}><i className="bx bx-link-alt"></i> Vincular cuentas</button>}
                            {weakestMetric.id === 'consistency' && <button className="mt__btn mt__btn--outline" onClick={() => navigate('/edit-profile')}><i className="bx bx-user"></i> Completar perfil</button>}
                            {weakestMetric.id === 'versatility' && <button className="mt__btn mt__btn--outline" onClick={() => navigate('/edit-profile', { state: { activeTab: 'gamer' } })}><i className="bx bx-game"></i> Añadir juegos</button>}
                            <button className="mt__btn mt__btn--ghost" onClick={() => navigate('/dashboard')}><i className="bx bx-arrow-back"></i> Volver al Dashboard</button>
                        </div>
                    </motion.div>
                </section>
            )}
        </div>
    );
};

export default Metrics;
