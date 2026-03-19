import axios from 'axios';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../../src/models/User.js';
import Team from '../../src/models/Team.js';
import Tournament from '../../src/models/Tournament.js';

const API_BASE_URL = String(process.env.API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
const JOIN_REQUESTS_TOTAL = Number.parseInt(String(process.env.LOAD_JOIN_TOTAL || '20'), 10);
const JOIN_CONCURRENCY = Number.parseInt(String(process.env.LOAD_JOIN_CONCURRENCY || '20'), 10);
const REGISTER_TEAMS_TOTAL = Number.parseInt(String(process.env.LOAD_REGISTER_TOTAL || '5'), 10);
const REGISTER_CONCURRENCY = Number.parseInt(String(process.env.LOAD_REGISTER_CONCURRENCY || '5'), 10);
const KEEP_DATA = String(process.env.LOAD_KEEP_DATA || '').trim().toLowerCase() === 'true';
const PASSWORD = 'GlitchGang123!';

if (!process.env.MONGO_URI) {
  console.error('Falta MONGO_URI');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET');
  process.exit(1);
}

const safeJoinTotal = Number.isFinite(JOIN_REQUESTS_TOTAL) && JOIN_REQUESTS_TOTAL > 0 ? JOIN_REQUESTS_TOTAL : 20;
const safeJoinConcurrency = Number.isFinite(JOIN_CONCURRENCY) && JOIN_CONCURRENCY > 0 ? JOIN_CONCURRENCY : 20;
const safeRegisterTotal = Number.isFinite(REGISTER_TEAMS_TOTAL) && REGISTER_TEAMS_TOTAL > 0 ? REGISTER_TEAMS_TOTAL : 5;
const safeRegisterConcurrency = Number.isFinite(REGISTER_CONCURRENCY) && REGISTER_CONCURRENCY > 0 ? REGISTER_CONCURRENCY : 5;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000
});

const authHeader = (userId) => ({
  headers: {
    Authorization: `Bearer ${jwt.sign({ id: String(userId) }, process.env.JWT_SECRET, { expiresIn: '24h' })}`
  }
});

const runId = Date.now();
const suffix = String(runId).slice(-6);
const cleanupState = {
  userIds: [],
  teamIds: [],
  tournamentIds: [],
  tournamentCodes: []
};

const createVerifiedMlbbUser = async ({ email, username, fullName, phone, playerId, zoneId, ign }) => {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const user = await User.create({
    fullName,
    phone,
    gender: 'Otro',
    country: 'República Dominicana',
    birthDate: new Date('2000-01-01'),
    selectedGames: ['Mobile Legends'],
    experience: ['Competitivo'],
    platforms: ['Mobile'],
    goals: ['Torneos'],
    username,
    email,
    password: passwordHash,
    checkTerms: true,
    connections: {
      mlbb: {
        playerId: String(playerId),
        zoneId: String(zoneId),
        ign,
        verificationStatus: 'verified',
        verified: true,
        linkedAt: new Date(),
        reviewRequestedAt: new Date(),
        reviewedAt: new Date(),
        reviewedBy: 'mlbb-write-load-smoke',
        rejectReason: ''
      }
    }
  });
  cleanupState.userIds.push(String(user._id));
  return user;
};

const summarizeResults = (results = []) => {
  const out = { ok: 0, failed: 0, statusCodes: {} };
  for (const item of results) {
    const code = String(item.code || 0);
    out.statusCodes[code] = (out.statusCodes[code] || 0) + 1;
    if (item.ok) out.ok += 1;
    else out.failed += 1;
  }
  return out;
};

const runConcurrent = async (items, concurrency, fn) => {
  let index = 0;
  const results = [];

  const worker = async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      results.push(await fn(current));
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, () => worker()));
  return results;
};

const seedJoinScenario = async () => {
  const captain = await createVerifiedMlbbUser({
    email: `mlbb.load.captain.${runId}@glitchgang.local`,
    username: `mlbb_load_captain_${runId}`,
    fullName: 'MLBB Load Captain',
    phone: `80911${suffix}`.slice(0, 10),
    playerId: `771${suffix}01`,
    zoneId: '7101',
    ign: `Captain${suffix}`
  });

  const team = await new Team({
    name: `MLBB Join Load Team ${runId}`,
    slogan: 'Join request load smoke',
    category: 'MOBA',
    game: 'Mobile Legends',
    teamGender: 'Mixto',
    teamCountry: 'República Dominicana',
    teamLevel: 'Amateur',
    teamLanguage: 'Español',
    logo: '/uploads/teams/default.png',
    maxMembers: 5,
    maxSubstitutes: safeJoinTotal,
    captain: captain._id,
    inviteCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
    roster: {
      starters: [
        {
          user: captain._id,
          nickname: `Captain${suffix}`,
          gameId: `771${suffix}01`,
          region: '7101',
          role: 'EXP'
        }
      ],
      subs: [],
      coach: null
    }
  }).save();

  cleanupState.teamIds.push(String(team._id));
  await User.updateOne({ _id: captain._id }, { $addToSet: { teams: team._id } });

  const joinUsers = [];
  for (let i = 0; i < safeJoinTotal; i += 1) {
    const user = await createVerifiedMlbbUser({
      email: `mlbb.load.join.${runId}.${i}@glitchgang.local`,
      username: `mlbb_load_join_${runId}_${i}`,
      fullName: `MLBB Load Join ${i}`,
      phone: `80921${suffix}${i}`.slice(0, 10),
      playerId: `772${suffix}${String(i).padStart(2, '0')}`,
      zoneId: `72${String(i).padStart(2, '0')}`,
      ign: `Join${suffix}${i}`
    });
    joinUsers.push(user);
  }

  const startedAt = Date.now();
  const results = await runConcurrent(joinUsers, safeJoinConcurrency, async (user, idx) => {
    try {
      const res = await api.post(
        `/api/teams/${team._id}/requests`,
        {
          inviteCode: team.inviteCode,
          slotType: 'subs',
          slotIndex: idx,
          player: {
            nickname: user.connections.mlbb.ign,
            gameId: user.connections.mlbb.playerId,
            region: user.connections.mlbb.zoneId,
            role: 'Suplente'
          }
        },
        authHeader(user._id)
      );
      return { ok: true, code: res.status };
    } catch (error) {
      return { ok: false, code: error?.response?.status || 0, message: error?.response?.data?.message || error.message };
    }
  });

  const refreshedTeam = await Team.findById(team._id).lean();

  return {
    elapsedMs: Date.now() - startedAt,
    summary: summarizeResults(results),
    pendingRequests: Array.isArray(refreshedTeam?.joinRequests) ? refreshedTeam.joinRequests.length : 0
  };
};

const seedRegisterScenario = async () => {
  const teams = [];
  for (let t = 0; t < safeRegisterTotal; t += 1) {
    const players = [];
    for (let i = 0; i < 5; i += 1) {
      const user = await createVerifiedMlbbUser({
        email: `mlbb.load.team.${runId}.${t}.${i}@glitchgang.local`,
        username: `mlbb_load_team_${runId}_${t}_${i}`,
        fullName: `MLBB Load Team ${t} Player ${i}`,
        phone: `8093${String(t).padStart(2, '0')}${suffix}${i}`.slice(0, 10),
        playerId: `88${suffix}${String(t).padStart(2, '0')}${i}`,
        zoneId: `73${String(t).padStart(2, '0')}`,
        ign: `T${t}P${i}${suffix}`
      });
      players.push(user);
    }

    const team = await new Team({
      name: `MLBB Register Load Team ${runId}-${t + 1}`,
      slogan: 'Register load smoke',
      category: 'MOBA',
      game: 'Mobile Legends',
      teamGender: 'Mixto',
      teamCountry: 'República Dominicana',
      teamLevel: 'Amateur',
      teamLanguage: 'Español',
      logo: '/uploads/teams/default.png',
      maxMembers: 5,
      maxSubstitutes: 0,
      captain: players[0]._id,
      inviteCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
      roster: {
        starters: [
          { user: players[0]._id, nickname: players[0].connections.mlbb.ign, gameId: players[0].connections.mlbb.playerId, region: players[0].connections.mlbb.zoneId, role: 'EXP' },
          { user: players[1]._id, nickname: players[1].connections.mlbb.ign, gameId: players[1].connections.mlbb.playerId, region: players[1].connections.mlbb.zoneId, role: 'Gold' },
          { user: players[2]._id, nickname: players[2].connections.mlbb.ign, gameId: players[2].connections.mlbb.playerId, region: players[2].connections.mlbb.zoneId, role: 'Mid' },
          { user: players[3]._id, nickname: players[3].connections.mlbb.ign, gameId: players[3].connections.mlbb.playerId, region: players[3].connections.mlbb.zoneId, role: 'Jungla' },
          { user: players[4]._id, nickname: players[4].connections.mlbb.ign, gameId: players[4].connections.mlbb.playerId, region: players[4].connections.mlbb.zoneId, role: 'Roam' }
        ],
        subs: [],
        coach: null
      }
    }).save();

    cleanupState.teamIds.push(String(team._id));
    await User.updateMany({ _id: { $in: players.map((p) => p._id) } }, { $addToSet: { teams: team._id } });
    teams.push(team);
  }

  const tournament = await new Tournament({
    tournamentId: `TOR-LOAD-${suffix}`,
    title: `MLBB Register Load Tournament ${runId}`,
    description: 'Register route load smoke for MLBB.',
    category: 'MOBA',
    game: 'Mobile Legends',
    modality: '5v5',
    platform: 'Mobile',
    server: 'LATAM',
    format: 'Eliminación Directa',
    date: new Date('2026-03-20T18:00:00.000Z'),
    time: '18:00',
    prizePool: '',
    currency: 'USD',
    prizeMode: 'none',
    prizeDetails: '',
    prizesByRank: { first: '0', second: '0', third: '0' },
    entryFee: 'Gratis',
    maxSlots: safeRegisterTotal + 2,
    currentSlots: 0,
    timezone: 'America/Santo_Domingo',
    registrationWindow: {
      start: new Date('2026-03-10T10:00:00.000Z'),
      end: new Date('2026-03-19T18:00:00.000Z')
    },
    checkInWindow: {
      start: new Date('2026-03-19T10:00:00.000Z'),
      end: new Date('2026-03-19T16:00:00.000Z')
    },
    eligibility: {
      minAge: 13,
      allowedCountries: ['República Dominicana'],
      notes: 'Load smoke'
    },
    contact: {
      email: 'mlbb-load@glitchgang.local',
      phone: '8090000000',
      discordInvite: ''
    },
    broadcast: {
      streamUrl: '',
      streamLanguage: 'es'
    },
    matchConfig: {
      seriesType: 'BO3',
      mapPool: [],
      patchVersion: ''
    },
    legalCompliance: {
      jurisdiction: 'República Dominicana',
      governingLaw: 'Ley aplicable de República Dominicana',
      claimsContact: 'legal@glitchgang.local',
      rulesAccepted: true,
      privacyAccepted: true,
      organizerDeclaration: true
    },
    organizer: teams[0].captain,
    status: 'open',
    registrationClosed: false,
    registrations: []
  }).save();

  cleanupState.tournamentIds.push(String(tournament._id));
  cleanupState.tournamentCodes.push(String(tournament.tournamentId));

  const startedAt = Date.now();
  const results = await runConcurrent(teams, safeRegisterConcurrency, async (team) => {
    try {
      const res = await api.post(
        `/api/tournaments/${tournament.tournamentId}/register`,
        { teamId: String(team._id) },
        authHeader(team.captain)
      );
      return { ok: true, code: res.status };
    } catch (error) {
      return { ok: false, code: error?.response?.status || 0, message: error?.response?.data?.message || error.message };
    }
  });

  const refreshedTournament = await Tournament.findById(tournament._id).lean();

  return {
    elapsedMs: Date.now() - startedAt,
    summary: summarizeResults(results),
    currentSlots: refreshedTournament?.currentSlots || 0,
    registrations: Array.isArray(refreshedTournament?.registrations) ? refreshedTournament.registrations.length : 0
  };
};

const cleanup = async () => {
  if (KEEP_DATA) return;

  if (cleanupState.teamIds.length) {
    await User.updateMany({}, { $pull: { teams: { $in: cleanupState.teamIds } } });
    await User.updateMany({}, { $pull: { notifications: { 'meta.teamId': { $in: cleanupState.teamIds } } } });
  }
  if (cleanupState.tournamentCodes.length) {
    await User.updateMany({}, { $pull: { notifications: { 'meta.tournamentId': { $in: cleanupState.tournamentCodes } } } });
  }
  if (cleanupState.userIds.length) {
    await Team.updateMany(
      {},
      {
        $pull: {
          'roster.starters': { user: { $in: cleanupState.userIds } },
          'roster.subs': { user: { $in: cleanupState.userIds } },
          joinRequests: { user: { $in: cleanupState.userIds } }
        }
      }
    );
    await Team.updateMany(
      { 'roster.coach.user': { $in: cleanupState.userIds } },
      { $set: { 'roster.coach': null } }
    );
  }

  if (cleanupState.tournamentIds.length) {
    await Tournament.deleteMany({ _id: { $in: cleanupState.tournamentIds } });
  }
  if (cleanupState.teamIds.length) {
    await Team.deleteMany({ _id: { $in: cleanupState.teamIds } });
  }
  if (cleanupState.userIds.length) {
    await User.deleteMany({ _id: { $in: cleanupState.userIds } });
  }
};

const main = async () => {
  const startedAt = Date.now();
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const join = await seedJoinScenario();
    const register = await seedRegisterScenario();

    console.log(JSON.stringify({
      apiBaseUrl: API_BASE_URL,
      keepData: KEEP_DATA,
      joinRequests: {
        total: safeJoinTotal,
        concurrency: safeJoinConcurrency,
        ...join
      },
      registerTeam: {
        total: safeRegisterTotal,
        concurrency: safeRegisterConcurrency,
        ...register
      },
      totalElapsedMs: Date.now() - startedAt
    }, null, 2));
  } finally {
    await cleanup();
    await mongoose.disconnect();
  }
};

main().catch((error) => {
  console.error('MLBB write load smoke falló:', error?.message || error);
  process.exit(1);
});
