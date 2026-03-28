import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Team from '../../src/models/Team.js';
import Tournament from '../../src/models/Tournament.js';

const waitForMongoose = async (timeoutMs = 30000) => {
  const startedAt = Date.now();
  while (mongoose.connection.readyState !== 1) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error('MongoDB no estuvo listo a tiempo para tournament-reports-smoke');
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const randomDigits = (size) => String(Math.floor(Math.random() * (10 ** size))).padStart(size, '0');
const randomSuffix = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const createUser = async ({ suffix, isOrganizer = false, selectedGames = ['EA FC / FIFA'] }) => {
  const plainPassword = 'SmokePass123!';
  const password = await bcrypt.hash(plainPassword, 10);

  const user = await User.create({
    fullName: `Tournament Reports Smoke ${suffix}`,
    phone: `8${randomDigits(9)}`,
    gender: 'Otro',
    country: 'República Dominicana',
    birthDate: new Date('2000-01-01'),
    selectedGames,
    experience: [],
    platforms: ['Console'],
    goals: [],
    username: `tournament-reports-${suffix}`,
    email: `tournament.reports.${suffix}@glitchgang.local`,
    password,
    checkTerms: true,
    isOrganizer
  });

  return { user, plainPassword };
};

const login = async ({ email, password }) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  assert(res.status === 200, `Login falló para ${email}: ${res.status} ${res.text}`);
  assert(Boolean(res.body?.token), `Login sin token para ${email}`);
  return res.body.token;
};

const buildTournamentPayload = ({ title }) => {
  const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const checkInStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const checkInEnd = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  return {
    title,
    description: 'Smoke test torneo reportes',
    game: 'EA FC / FIFA',
    gender: 'Mixto',
    modality: '1v1',
    date: futureDate,
    time: '20:00',
    timezone: 'America/Santo_Domingo',
    prizePool: '0',
    currency: 'USD',
    prizeMode: 'none',
    prizeDetails: '',
    prizesByRank: { first: '', second: '', third: '' },
    entryFee: 'Gratis',
    maxSlots: 8,
    format: 'Eliminacion Directa',
    server: '',
    platform: 'Console',
    registrationWindow: { start: futureDate, end: futureDate },
    checkInWindow: { start: checkInStart, end: checkInEnd },
    eligibility: { minAge: 13, allowedCountries: ['República Dominicana'], notes: '', universityOnly: false },
    contact: { email: 'legal@glitchgang.local', phone: '', discordInvite: 'https://discord.gg/glitchgang' },
    broadcast: { streamUrl: '', streamLanguage: 'es' },
    matchConfig: { seriesType: 'BO1', mapPool: [], patchVersion: '' },
    legalCompliance: {
      jurisdiction: 'República Dominicana',
      governingLaw: 'Normativa local aplicable',
      claimsContact: 'legal@glitchgang.local',
      rulesAccepted: true,
      privacyAccepted: true,
      organizerDeclaration: true
    },
    sponsors: [],
    staff: { moderators: [], casters: [] }
  };
};

const createTeam = async ({ suffix, captainId, starterUserId, starterNickname }) => (
  Team.create({
    name: `Tournament Report Team ${suffix}`,
    slogan: 'Smoke',
    category: 'Sports',
    game: 'EA FC / FIFA',
    teamGender: 'Mixto',
    teamCountry: 'República Dominicana',
    teamLevel: 'Semi-Pro',
    teamLanguage: 'Español',
    maxMembers: 1,
    maxSubstitutes: 0,
    captain: captainId,
    inviteCode: `INV-${randomDigits(6)}`,
    roster: {
      starters: [{
        user: starterUserId,
        nickname: starterNickname,
        gameId: starterNickname,
        region: 'LATAM',
        role: 'Player'
      }],
      subs: [],
      coach: null
    }
  })
);

const playMatch = async ({
  tournamentCode,
  match,
  teamTokenByTeamId,
  organizerToken
}) => {
  const participantA = match?.teamA;
  const participantB = match?.teamB;
  assert(participantA?.refId && participantB?.refId, `El match ${match?.matchId || 'sin id'} no tiene ambos participantes listos`);

  const winnerParticipant = participantA;
  const loserParticipant = participantB;
  const winnerToken = teamTokenByTeamId.get(String(winnerParticipant?.teamId || ''));
  const loserToken = teamTokenByTeamId.get(String(loserParticipant?.teamId || ''));
  const winnerRefId = winnerParticipant?.refId;

  const submitWinnerRes = await request(app)
    .post(`/api/tournaments/${tournamentCode}/bracket/matches/${match.matchId}/submit`)
    .set('Authorization', `Bearer ${winnerToken}`)
    .send({ winnerRefId, scoreA: 1, scoreB: 0 });
  assert(submitWinnerRes.status === 200, `Reporte del ganador en ${match.matchId} falló: ${submitWinnerRes.status} ${submitWinnerRes.text}`);

  const submitLoserAgreementRes = await request(app)
    .post(`/api/tournaments/${tournamentCode}/bracket/matches/${match.matchId}/submit`)
    .set('Authorization', `Bearer ${loserToken}`)
    .send({ winnerRefId, scoreA: 1, scoreB: 0 });
  assert(submitLoserAgreementRes.status === 200, `Confirmación del rival en ${match.matchId} falló: ${submitLoserAgreementRes.status} ${submitLoserAgreementRes.text}`);

  const resolveRes = await request(app)
    .patch(`/api/tournaments/${tournamentCode}/bracket/matches/${match.matchId}/resolve`)
    .set('Authorization', `Bearer ${organizerToken}`)
    .send({ winnerRefId, scoreA: 1, scoreB: 0 });
  assert(resolveRes.status === 200, `Resolver ${match.matchId} falló: ${resolveRes.status} ${resolveRes.text}`);

  return resolveRes;
};

const run = async () => {
  await waitForMongoose();

  const suffix = randomSuffix();
  const createdUserIds = [];
  const createdTeamIds = [];
  const createdTournamentIds = [];

  try {
    const [organizerAccount, captainAAccount, captainBAccount, captainCAccount, captainDAccount] = await Promise.all([
      createUser({ suffix: `org-${suffix}`, isOrganizer: true }),
      createUser({ suffix: `a-${suffix}` }),
      createUser({ suffix: `b-${suffix}` }),
      createUser({ suffix: `c-${suffix}` }),
      createUser({ suffix: `d-${suffix}` })
    ]);

    createdUserIds.push(
      organizerAccount.user._id,
      captainAAccount.user._id,
      captainBAccount.user._id,
      captainCAccount.user._id,
      captainDAccount.user._id
    );

    const [organizerToken, captainAToken, captainBToken, captainCToken, captainDToken] = await Promise.all([
      login({ email: organizerAccount.user.email, password: organizerAccount.plainPassword }),
      login({ email: captainAAccount.user.email, password: captainAAccount.plainPassword }),
      login({ email: captainBAccount.user.email, password: captainBAccount.plainPassword }),
      login({ email: captainCAccount.user.email, password: captainCAccount.plainPassword }),
      login({ email: captainDAccount.user.email, password: captainDAccount.plainPassword })
    ]);

    const createRes = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(buildTournamentPayload({ title: `Tournament Reports ${suffix}` }));
    assert(createRes.status === 201, `Crear torneo falló: ${createRes.status} ${createRes.text}`);

    const tournamentCode = String(createRes.body?.tournamentId || '').toUpperCase();
    assert(Boolean(tournamentCode), 'No se obtuvo tournamentId al crear el torneo');
    createdTournamentIds.push(tournamentCode);

    const [teamA, teamB, teamC, teamD] = await Promise.all([
      createTeam({ suffix: `a-${suffix}`, captainId: captainAAccount.user._id, starterUserId: captainAAccount.user._id, starterNickname: `CaptainA-${randomDigits(3)}` }),
      createTeam({ suffix: `b-${suffix}`, captainId: captainBAccount.user._id, starterUserId: captainBAccount.user._id, starterNickname: `CaptainB-${randomDigits(3)}` }),
      createTeam({ suffix: `c-${suffix}`, captainId: captainCAccount.user._id, starterUserId: captainCAccount.user._id, starterNickname: `CaptainC-${randomDigits(3)}` }),
      createTeam({ suffix: `d-${suffix}`, captainId: captainDAccount.user._id, starterUserId: captainDAccount.user._id, starterNickname: `CaptainD-${randomDigits(3)}` })
    ]);
    createdTeamIds.push(teamA._id, teamB._id, teamC._id, teamD._id);

    const registrations = [
      [teamA, captainAToken, 'A'],
      [teamB, captainBToken, 'B'],
      [teamC, captainCToken, 'C'],
      [teamD, captainDToken, 'D']
    ];

    for (const [team, token, label] of registrations) {
      const registerRes = await request(app)
        .post(`/api/tournaments/${tournamentCode}/register`)
        .set('Authorization', `Bearer ${token}`)
        .send({ teamId: String(team._id) });
      assert(registerRes.status === 200, `Registro Team ${label} falló: ${registerRes.status} ${registerRes.text}`);
    }

    for (const [team, token, label] of registrations) {
      const checkInRes = await request(app)
        .post(`/api/tournaments/${tournamentCode}/check-in`)
        .set('Authorization', `Bearer ${token}`)
        .send({ teamId: String(team._id) });
      assert(checkInRes.status === 200, `Check-in Team ${label} falló: ${checkInRes.status} ${checkInRes.text}`);
    }

    const bracketRes = await request(app)
      .post(`/api/tournaments/${tournamentCode}/bracket/generate`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ seedingMode: 'random' });
    assert(bracketRes.status === 200, `Generar bracket falló: ${bracketRes.status} ${bracketRes.text}`);

    let currentBracket = bracketRes.body?.bracket;
    const firstRoundMatches = currentBracket?.rounds?.[0]?.matches || [];
    assert(firstRoundMatches.length === 2, `El bracket esperado debía generar 2 semifinales y generó ${firstRoundMatches.length}`);

    const startRes = await request(app)
      .patch(`/api/tournaments/${tournamentCode}/status`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ action: 'start' });
    assert(startRes.status === 200, `Iniciar torneo falló: ${startRes.status} ${startRes.text}`);

    const teamTokenByTeamId = new Map([
      [String(teamA._id), captainAToken],
      [String(teamB._id), captainBToken],
      [String(teamC._id), captainCToken],
      [String(teamD._id), captainDToken]
    ]);

    const semifinalOne = currentBracket.rounds[0].matches[0];
    const semifinalOneResolved = await playMatch({
      tournamentCode,
      match: semifinalOne,
      teamTokenByTeamId,
      organizerToken
    });
    currentBracket = semifinalOneResolved.body?.bracket || currentBracket;

    const semifinalTwo = currentBracket.rounds[0].matches[1];
    const reportedParticipant = semifinalTwo?.teamA;
    const beneficiaryParticipant = semifinalTwo?.teamB;
    assert(reportedParticipant?.teamName && beneficiaryParticipant?.teamName, 'La semifinal 2 no tiene ambos equipos listos');

    const reporterToken = teamTokenByTeamId.get(String(beneficiaryParticipant?.teamId || ''));
    assert(Boolean(reporterToken), 'No se encontró token del capitán reportante');

    const createReportRes = await request(app)
      .post(`/api/tournaments/${tournamentCode}/reports`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({
        type: 'cheating',
        reportedTeam: reportedParticipant.teamName,
        matchId: semifinalTwo.matchId,
        severity: 'high',
        evidence: 'https://glitchgang.local/evidence/report-smoke',
        description: 'Smoke: el capitán rival reporta una incidencia del match.'
      });
    assert(createReportRes.status === 201, `Crear reporte falló: ${createReportRes.status} ${createReportRes.text}`);
    const reportId = createReportRes.body?.reportId;
    assert(Boolean(reportId), 'No se generó reportId');

    const resolveReportRes = await request(app)
      .patch(`/api/tournaments/${tournamentCode}/reports/${reportId}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        sanction: 'disqualification',
        sanctionNote: 'Smoke sanction',
        status: 'resolved'
      });
    assert(resolveReportRes.status === 200, `Resolver reporte falló: ${resolveReportRes.status} ${resolveReportRes.text}`);

    currentBracket = resolveReportRes.body?.bracket || currentBracket;
    const sanctionedMatch = currentBracket?.rounds?.[0]?.matches?.find((match) => match?.matchId === semifinalTwo.matchId);
    assert(Boolean(sanctionedMatch), 'No se encontró la semifinal sancionada en el bracket resultante');
    assert(String(sanctionedMatch?.winnerRefId || '') === String(beneficiaryParticipant?.refId || ''), 'La sanción no avanzó al rival correcto');
    assert(String(sanctionedMatch?.confirmationStatus || '') === 'resolved', 'La semifinal sancionada no quedó resuelta');

    const finalMatch = currentBracket?.rounds?.[1]?.matches?.[0];
    assert(Boolean(finalMatch?.teamA?.refId) && Boolean(finalMatch?.teamB?.refId), 'La final no quedó lista tras resolver la sanción');

    const finalResolved = await playMatch({
      tournamentCode,
      match: finalMatch,
      teamTokenByTeamId,
      organizerToken
    });
    currentBracket = finalResolved.body?.bracket || currentBracket;

    const finalTournament = await Tournament.findOne({ tournamentId: tournamentCode }).lean();
    assert(finalTournament?.status === 'finished', 'El torneo persistido no quedó finished');
    const storedReport = (finalTournament?.reports || []).find((report) => report.reportId === reportId);
    assert(String(storedReport?.status || '') === 'resolved', 'El reporte no quedó resuelto');
    assert(String(storedReport?.sanction || '') === 'disqualification', 'La sanción persistida no fue descalificación');

    console.log('tournament-reports-smoke: OK');
  } finally {
    if (createdTournamentIds.length > 0) {
      await Tournament.deleteMany({ tournamentId: { $in: createdTournamentIds } });
    }
    if (createdTeamIds.length > 0) {
      await Team.deleteMany({ _id: { $in: createdTeamIds } });
    }
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    await mongoose.connection.close();
  }
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('tournament-reports-smoke failed:', error?.message || error);
    process.exit(1);
  });
