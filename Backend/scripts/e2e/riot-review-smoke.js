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
      throw new Error('MongoDB no estuvo listo a tiempo para riot-review-smoke');
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const randomDigits = (size) => String(Math.floor(Math.random() * (10 ** size))).padStart(size, '0');
const randomSuffix = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const createUser = async ({
  suffix,
  isOrganizer = false,
  riotGameName,
  riotTagLine
}) => {
  const plainPassword = 'SmokePass123!';
  const password = await bcrypt.hash(plainPassword, 10);

  const user = await User.create({
    fullName: `Riot Smoke ${suffix}`,
    phone: `8${randomDigits(9)}`,
    gender: 'Otro',
    country: 'República Dominicana',
    birthDate: new Date('2000-01-01'),
    selectedGames: ['Valorant'],
    experience: [],
    platforms: [],
    goals: [],
    username: `riot-smoke-${suffix}`,
    email: `riot.smoke.${suffix}@esportefy.local`,
    password,
    checkTerms: true,
    isOrganizer,
    connections: {
      riot: {
        puuid: `puuid-${suffix}`,
        gameName: riotGameName,
        tagLine: riotTagLine,
        accountRegion: 'americas',
        verified: true,
        linkedAt: new Date()
      }
    }
  });

  return { user, plainPassword };
};

const login = async ({ email, password }) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  assert(res.status === 200, `Login falló para ${email}: ${res.status} ${res.text}`);
  assert(Boolean(res.body?.token), `Login sin token para ${email}`);
  return res.body.token;
};

const buildTournamentPayload = ({ title, entryFee, maxSlots, modality }) => {
  const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return {
    title,
    description: 'Smoke test Riot review mode',
    game: 'Valorant',
    gender: 'Mixto',
    modality,
    date: futureDate,
    time: '20:00',
    timezone: 'America/Santo_Domingo',
    prizePool: '0',
    currency: 'USD',
    prizeMode: 'none',
    prizeDetails: '',
    prizesByRank: { first: '', second: '', third: '' },
    entryFee,
    maxSlots,
    format: 'Eliminacion Directa',
    server: 'LATAM',
    platform: 'PC',
    registrationWindow: { start: futureDate, end: futureDate },
    checkInWindow: { start: futureDate, end: futureDate },
    eligibility: { minAge: 13, allowedCountries: ['Global'], notes: '', universityOnly: false },
    contact: { email: 'legal@esportefy.local', phone: '', discordInvite: 'https://discord.gg/esportefy' },
    broadcast: { streamUrl: '', streamLanguage: 'es' },
    matchConfig: { seriesType: 'BO1', mapPool: [], patchVersion: '' },
    legalCompliance: {
      jurisdiction: 'República Dominicana',
      governingLaw: 'Normativa local aplicable',
      claimsContact: 'legal@esportefy.local',
      rulesAccepted: true,
      privacyAccepted: true,
      organizerDeclaration: true
    },
    sponsors: [],
    staff: { moderators: [], casters: [] }
  };
};

const createTeam = async ({ suffix, captainId, starterUserId, starterNickname, riotId }) => {
  return Team.create({
    name: `Riot Team ${suffix}`,
    slogan: 'Smoke',
    category: 'FPS',
    game: 'Valorant',
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
        role: 'Duelist',
        riotId
      }],
      subs: [],
      coach: null
    }
  });
};

const run = async () => {
  await waitForMongoose();

  if (String(process.env.RIOT_REVIEW_MODE || '').trim().toLowerCase() !== 'true') {
    throw new Error('Este smoke requiere RIOT_REVIEW_MODE=true');
  }

  const suffix = randomSuffix();
  const createdUserIds = [];
  const createdTeamIds = [];
  const createdTournamentIds = [];

  try {
    const organizerAccount = await createUser({
      suffix: `org-${suffix}`,
      isOrganizer: true,
      riotGameName: `Org${randomDigits(4)}`,
      riotTagLine: 'ORG'
    });
    const captainAAccount = await createUser({
      suffix: `a-${suffix}`,
      riotGameName: `Shared${randomDigits(3)}`,
      riotTagLine: 'R1'
    });
    const captainBAccount = await createUser({
      suffix: `b-${suffix}`,
      riotGameName: captainAAccount.user.connections.riot.gameName,
      riotTagLine: captainAAccount.user.connections.riot.tagLine
    });

    createdUserIds.push(
      organizerAccount.user._id,
      captainAAccount.user._id,
      captainBAccount.user._id
    );

    const organizerToken = await login({
      email: organizerAccount.user.email,
      password: organizerAccount.plainPassword
    });
    const captainAToken = await login({
      email: captainAAccount.user.email,
      password: captainAAccount.plainPassword
    });
    const captainBToken = await login({
      email: captainBAccount.user.email,
      password: captainBAccount.plainPassword
    });

    const invalidPaidRes = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(buildTournamentPayload({
        title: `Riot Paid ${suffix}`,
        entryFee: 'Pago',
        maxSlots: 20,
        modality: '5v5'
      }));
    assert(invalidPaidRes.status === 400, `Riot Pago debía fallar (400) y devolvió ${invalidPaidRes.status}`);

    const invalidCapacityRes = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(buildTournamentPayload({
        title: `Riot Low Capacity ${suffix}`,
        entryFee: 'Gratis',
        maxSlots: 8,
        modality: '1v1'
      }));
    assert(invalidCapacityRes.status === 400, `Riot capacidad baja debía fallar y devolvió ${invalidCapacityRes.status}`);

    const validCreateRes = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(buildTournamentPayload({
        title: `Riot Valid ${suffix}`,
        entryFee: 'Gratis',
        maxSlots: 20,
        modality: '1v1'
      }));
    assert(validCreateRes.status === 201, `Creación Riot válida falló: ${validCreateRes.status} ${validCreateRes.text}`);

    const tournamentCode = String(validCreateRes.body?.tournamentId || '').toUpperCase();
    assert(Boolean(tournamentCode), 'No se obtuvo tournamentId en creación válida');
    createdTournamentIds.push(tournamentCode);

    const invalidBracketRes = await request(app)
      .patch(`/api/tournaments/${tournamentCode}/bracket`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        bracket: {
          format: 'single_elimination',
          seedingMode: 'custom',
          rounds: []
        }
      });
    assert(
      invalidBracketRes.status === 400,
      `Bracket custom con registro abierto debía fallar y devolvió ${invalidBracketRes.status}`
    );

    const sharedRiotId = `${captainAAccount.user.connections.riot.gameName}#${captainAAccount.user.connections.riot.tagLine}`;
    const teamA = await createTeam({
      suffix: `a-${suffix}`,
      captainId: captainAAccount.user._id,
      starterUserId: captainAAccount.user._id,
      starterNickname: 'StarterA',
      riotId: sharedRiotId
    });
    const teamB = await createTeam({
      suffix: `b-${suffix}`,
      captainId: captainBAccount.user._id,
      starterUserId: captainBAccount.user._id,
      starterNickname: 'StarterB',
      riotId: sharedRiotId
    });
    createdTeamIds.push(teamA._id, teamB._id);

    const registerARes = await request(app)
      .post(`/api/tournaments/${tournamentCode}/register`)
      .set('Authorization', `Bearer ${captainAToken}`)
      .send({ teamId: String(teamA._id) });
    assert(registerARes.status === 200, `Registro Team A falló: ${registerARes.status} ${registerARes.text}`);

    const registerBRes = await request(app)
      .post(`/api/tournaments/${tournamentCode}/register`)
      .set('Authorization', `Bearer ${captainBToken}`)
      .send({ teamId: String(teamB._id) });
    assert(
      registerBRes.status === 400,
      `Registro Team B con Riot ID duplicado debía fallar y devolvió ${registerBRes.status}`
    );

    console.log('riot-review-smoke: OK');
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
    console.error('riot-review-smoke failed:', error?.message || error);
    process.exit(1);
  });
