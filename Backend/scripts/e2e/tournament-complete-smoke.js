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
      throw new Error('MongoDB no estuvo listo a tiempo para tournament-complete-smoke');
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
    fullName: `Tournament Smoke ${suffix}`,
    phone: `8${randomDigits(9)}`,
    gender: 'Otro',
    country: 'República Dominicana',
    birthDate: new Date('2000-01-01'),
    selectedGames,
    experience: [],
    platforms: ['Console'],
    goals: [],
    username: `tournament-smoke-${suffix}`,
    email: `tournament.smoke.${suffix}@glitchgang.local`,
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
  return {
    title,
    description: 'Smoke test torneo completo',
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
    checkInWindow: { start: futureDate, end: futureDate },
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

const createTeam = async ({ suffix, captainId, starterUserId, starterNickname }) => {
  return Team.create({
    name: `Tournament Team ${suffix}`,
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
  });
};

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

  assert(Boolean(winnerToken), `No se encontró token para el ganador del match ${match?.matchId}`);
  assert(Boolean(loserToken), `No se encontró token para el rival del match ${match?.matchId}`);

  const submitWinnerRes = await request(app)
    .post(`/api/tournaments/${tournamentCode}/bracket/matches/${match.matchId}/submit`)
    .set('Authorization', `Bearer ${winnerToken}`)
    .send({ winnerRefId, scoreA: 1, scoreB: 0 });
  assert(
    submitWinnerRes.status === 200,
    `Reporte del ganador en ${match.matchId} falló: ${submitWinnerRes.status} ${submitWinnerRes.text}`
  );

  const submitLoserAgreementRes = await request(app)
    .post(`/api/tournaments/${tournamentCode}/bracket/matches/${match.matchId}/submit`)
    .set('Authorization', `Bearer ${loserToken}`)
    .send({ winnerRefId, scoreA: 1, scoreB: 0 });
  assert(
    submitLoserAgreementRes.status === 200,
    `Confirmación del rival en ${match.matchId} falló: ${submitLoserAgreementRes.status} ${submitLoserAgreementRes.text}`
  );
  const resolvedConfirmationStatus = (submitLoserAgreementRes.body?.bracket?.rounds || [])
    .flatMap((round) => round?.matches || [])
    .find((candidate) => candidate?.matchId === match.matchId)?.confirmationStatus;
  assert(
    resolvedConfirmationStatus === 'agreed',
    `El match ${match.matchId} debía quedar agreed y quedó ${resolvedConfirmationStatus || 'vacío'}`
  );

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
      .send(buildTournamentPayload({ title: `Tournament Complete ${suffix}` }));
    assert(createRes.status === 201, `Crear torneo falló: ${createRes.status} ${createRes.text}`);

    const tournamentCode = String(createRes.body?.tournamentId || '').toUpperCase();
    assert(Boolean(tournamentCode), 'No se obtuvo tournamentId al crear el torneo');
    createdTournamentIds.push(tournamentCode);

    const [teamA, teamB, teamC, teamD] = await Promise.all([
      createTeam({
        suffix: `a-${suffix}`,
        captainId: captainAAccount.user._id,
        starterUserId: captainAAccount.user._id,
        starterNickname: `CaptainA-${randomDigits(3)}`
      }),
      createTeam({
        suffix: `b-${suffix}`,
        captainId: captainBAccount.user._id,
        starterUserId: captainBAccount.user._id,
        starterNickname: `CaptainB-${randomDigits(3)}`
      }),
      createTeam({
        suffix: `c-${suffix}`,
        captainId: captainCAccount.user._id,
        starterUserId: captainCAccount.user._id,
        starterNickname: `CaptainC-${randomDigits(3)}`
      }),
      createTeam({
        suffix: `d-${suffix}`,
        captainId: captainDAccount.user._id,
        starterUserId: captainDAccount.user._id,
        starterNickname: `CaptainD-${randomDigits(3)}`
      })
    ]);
    createdTeamIds.push(teamA._id, teamB._id, teamC._id, teamD._id);

    const registerARes = await request(app)
      .post(`/api/tournaments/${tournamentCode}/register`)
      .set('Authorization', `Bearer ${captainAToken}`)
      .send({ teamId: String(teamA._id) });
    assert(registerARes.status === 200, `Registro Team A falló: ${registerARes.status} ${registerARes.text}`);

    const registerBRes = await request(app)
      .post(`/api/tournaments/${tournamentCode}/register`)
      .set('Authorization', `Bearer ${captainBToken}`)
      .send({ teamId: String(teamB._id) });
    assert(registerBRes.status === 200, `Registro Team B falló: ${registerBRes.status} ${registerBRes.text}`);

    const registerCRes = await request(app)
      .post(`/api/tournaments/${tournamentCode}/register`)
      .set('Authorization', `Bearer ${captainCToken}`)
      .send({ teamId: String(teamC._id) });
    assert(registerCRes.status === 200, `Registro Team C falló: ${registerCRes.status} ${registerCRes.text}`);

    const registerDRes = await request(app)
      .post(`/api/tournaments/${tournamentCode}/register`)
      .set('Authorization', `Bearer ${captainDToken}`)
      .send({ teamId: String(teamD._id) });
    assert(registerDRes.status === 200, `Registro Team D falló: ${registerDRes.status} ${registerDRes.text}`);

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
    assert(startRes.body?.status === 'ongoing', 'El torneo no quedó en estado ongoing');

    const teamTokenByTeamId = new Map([
      [String(teamA._id), captainAToken],
      [String(teamB._id), captainBToken],
      [String(teamC._id), captainCToken],
      [String(teamD._id), captainDToken]
    ]);

    for (const roundIndex of [0, 1]) {
      const matches = currentBracket?.rounds?.[roundIndex]?.matches || [];
      for (const match of matches) {
        const resolveRes = await playMatch({
          tournamentCode,
          match,
          teamTokenByTeamId,
          organizerToken
        });
        currentBracket = resolveRes.body?.bracket || currentBracket;
      }
    }

    const finalTournament = await Tournament.findOne({ tournamentId: tournamentCode }).lean();
    assert(finalTournament?.status === 'finished', 'El torneo persistido no quedó finished');
    const finalMatch = finalTournament?.bracket?.rounds?.[1]?.matches?.[0];
    assert(Boolean(finalMatch?.winnerRefId), 'La final no dejó un ganador persistido');

    console.log('tournament-complete-smoke: OK');
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
    console.error('tournament-complete-smoke failed:', error?.message || error);
    process.exit(1);
  });
