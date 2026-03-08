import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Team from '../../src/models/Team.js';

const waitForMongoose = async (timeoutMs = 30000) => {
  const startedAt = Date.now();
  while (mongoose.connection.readyState !== 1) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error('MongoDB no estuvo listo a tiempo para el smoke de Teams');
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
  mlbbPlayerId,
  mlbbZoneId,
  mlbbIgn,
  universityId = '',
  universityTag = '',
  universityName = ''
}) => {
  const password = 'TestPass123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    fullName: `Team Smoke ${suffix}`,
    phone: `8${randomDigits(9)}`,
    gender: 'Otro',
    country: 'República Dominicana',
    birthDate: new Date('2000-01-01'),
    selectedGames: ['Mobile Legends'],
    experience: [],
    platforms: [],
    goals: [],
    username: `team-${suffix}`,
    email: `team.${suffix}@esportefy.local`,
    password: hashedPassword,
    checkTerms: true,
    connections: {
      mlbb: {
        playerId: String(mlbbPlayerId),
        zoneId: String(mlbbZoneId),
        ign: String(mlbbIgn),
        verificationStatus: 'verified',
        verified: true,
        linkedAt: new Date()
      }
    },
    university: universityId
      ? {
          universityId,
          universityTag,
          universityName,
          region: 'rd',
          city: 'Santo Domingo',
          campus: 'Sede Central',
          studentId: `MAT-${suffix}`,
          program: 'Ingeniería en Sistemas',
          academicLevel: '4',
          institutionalEmail: `${suffix}@uasd.edu.do`,
          verificationSource: 'manual',
          verificationStatus: 'verified',
          verified: true,
          verifiedAt: new Date()
        }
      : undefined
  });

  return { user, password };
};

const login = async ({ email, password }) => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  assert(res.status === 200, `Login falló para ${email}: ${res.status} ${res.text}`);
  assert(res.body?.token, `Login no devolvió token para ${email}`);
  return res.body.token;
};

const follow = async ({ token, targetUserId }) => {
  const res = await request(app)
    .post(`/api/auth/follow/${targetUserId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({});
  assert(res.status === 200, `Follow falló (${targetUserId}): ${res.status} ${res.text}`);
};

const createTeam = async ({ token, payload, roster }) => {
  return request(app)
    .post('/api/teams/create')
    .set('Authorization', `Bearer ${token}`)
    .field('formData', JSON.stringify(payload))
    .field('roster', JSON.stringify(roster));
};

const run = async () => {
  await waitForMongoose();

  const suffix = randomSuffix();
  const createdUserIds = [];
  const createdTeamIds = [];

  try {
    const [
      { user: captain, password: captainPassword },
      { user: friend, password: friendPassword },
      { user: outsider, password: outsiderPassword }
    ] = await Promise.all([
      createUser({
        suffix: `captain-${suffix}`,
        mlbbPlayerId: `9${randomDigits(8)}`,
        mlbbZoneId: `${randomDigits(4)}`,
        mlbbIgn: `Captain${randomDigits(3)}`,
        universityId: 'uasd',
        universityTag: 'UASD',
        universityName: 'Universidad Autónoma de Santo Domingo'
      }),
      createUser({
        suffix: `friend-${suffix}`,
        mlbbPlayerId: `8${randomDigits(8)}`,
        mlbbZoneId: `${randomDigits(4)}`,
        mlbbIgn: `Friend${randomDigits(3)}`,
        universityId: 'uasd',
        universityTag: 'UASD',
        universityName: 'Universidad Autónoma de Santo Domingo'
      }),
      createUser({
        suffix: `outsider-${suffix}`,
        mlbbPlayerId: `7${randomDigits(8)}`,
        mlbbZoneId: `${randomDigits(4)}`,
        mlbbIgn: `Out${randomDigits(3)}`,
        universityId: 'intec',
        universityTag: 'INTEC',
        universityName: 'Instituto Tecnológico de Santo Domingo'
      })
    ]);

    createdUserIds.push(captain._id, friend._id, outsider._id);

    const [captainToken, friendToken, outsiderToken] = await Promise.all([
      login({ email: captain.email, password: captainPassword }),
      login({ email: friend.email, password: friendPassword }),
      login({ email: outsider.email, password: outsiderPassword })
    ]);

    await follow({ token: captainToken, targetUserId: friend._id });
    await follow({ token: friendToken, targetUserId: captain._id });

    const baseTeamPayload = {
      name: `Smoke MLBB ${suffix}`,
      slogan: 'Smoke team',
      category: 'MOBA',
      game: 'Mobile Legends',
      teamGender: 'Mixto',
      teamCountry: 'República Dominicana',
      teamLevel: 'Semi-Pro',
      teamLanguage: 'Español',
      maxMembers: 5,
      maxSubstitutes: 2,
      leaderIgn: captain.connections?.mlbb?.ign || `Cap-${suffix}`,
      leaderRole: 'EXP',
      leaderGameId: '',
      leaderRegion: ''
    };

    const baseRoster = {
      starters: [{ user: String(captain._id), nickname: captain.connections?.mlbb?.ign || `Cap-${suffix}`, role: 'EXP' }, null, null, null, null],
      subs: [null, null],
      coach: null
    };

    const createNormalRes = await createTeam({
      token: captainToken,
      payload: baseTeamPayload,
      roster: baseRoster
    });

    assert(
      createNormalRes.status === 201,
      `Crear equipo normal falló: ${createNormalRes.status} ${createNormalRes.text}`
    );

    const normalTeamId = String(createNormalRes.body?.teamId || '');
    const normalInviteCode = String(createNormalRes.body?.inviteCode || '').toUpperCase();
    assert(normalTeamId && normalInviteCode, 'El create team normal no devolvió teamId + inviteCode');
    createdTeamIds.push(normalTeamId);

    const inviteFriendRes = await request(app)
      .post(`/api/teams/${normalTeamId}/invite-friend`)
      .set('Authorization', `Bearer ${captainToken}`)
      .send({
        targetUserId: String(friend._id),
        slotType: 'starters',
        slotIndex: 1
      });

    assert(
      inviteFriendRes.status === 200,
      `Invitar amigo mutuo falló: ${inviteFriendRes.status} ${inviteFriendRes.text}`
    );
    assert(
      String(inviteFriendRes.body?.invite?.slotRole || '') === 'Gold',
      'La invitación no resolvió el rol esperado para slot de MLBB (Gold)'
    );

    const friendDocAfterInvite = await User.findById(friend._id).select('notifications').lean();
    const pendingInvite = (friendDocAfterInvite?.notifications || []).find(
      (note) =>
        note?.status === 'unread'
        && String(note?.meta?.action || '') === 'team_invite'
        && String(note?.meta?.teamId || '') === normalTeamId
    );
    assert(Boolean(pendingInvite), 'El usuario invitado no recibió notificación de invitación');

    const inviteOutsiderRes = await request(app)
      .post(`/api/teams/${normalTeamId}/invite-friend`)
      .set('Authorization', `Bearer ${captainToken}`)
      .send({
        targetUserId: String(outsider._id),
        slotType: 'starters',
        slotIndex: 2
      });
    assert(
      inviteOutsiderRes.status === 403,
      `Invitación a no-amigo debía fallar 403 y devolvió ${inviteOutsiderRes.status}`
    );

    const invalidJoinRes = await request(app)
      .post('/api/teams/join')
      .set('Authorization', `Bearer ${friendToken}`)
      .send({
        teamId: normalTeamId,
        inviteCode: normalInviteCode,
        slotType: 'starters',
        slotIndex: 99,
        player: {
          nickname: friend.connections?.mlbb?.ign || `Friend-${suffix}`,
          gameId: String(friend.connections?.mlbb?.playerId || ''),
          region: String(friend.connections?.mlbb?.zoneId || ''),
          role: 'Roam'
        }
      });
    assert(
      invalidJoinRes.status === 400,
      `Join con slot inválido debía fallar y devolvió ${invalidJoinRes.status}`
    );

    const joinRes = await request(app)
      .post('/api/teams/join')
      .set('Authorization', `Bearer ${friendToken}`)
      .send({
        teamId: normalTeamId,
        inviteCode: normalInviteCode,
        slotType: 'starters',
        slotIndex: 1,
        player: {
          nickname: friend.connections?.mlbb?.ign || `Friend-${suffix}`,
          gameId: String(friend.connections?.mlbb?.playerId || ''),
          region: String(friend.connections?.mlbb?.zoneId || ''),
          role: 'Roam'
        }
      });

    assert(joinRes.status === 200, `Aceptar invitación falló: ${joinRes.status} ${joinRes.text}`);

    const normalTeamAfterJoin = await Team.findById(normalTeamId).lean();
    assert(normalTeamAfterJoin, 'No se encontró el equipo luego de aceptar invitación');
    assert(
      String(normalTeamAfterJoin?.roster?.starters?.[1]?.user || '') === String(friend._id),
      'El jugador invitado no quedó en el slot titular #2'
    );
    assert(
      String(normalTeamAfterJoin?.roster?.starters?.[1]?.role || '') === 'Gold',
      'El rol del slot MLBB no se respetó al aceptar la invitación'
    );

    const leaveRes = await request(app)
      .post(`/api/teams/leave/${normalTeamId}`)
      .set('Authorization', `Bearer ${friendToken}`)
      .send({});
    assert(leaveRes.status === 200, `Salir del equipo falló: ${leaveRes.status} ${leaveRes.text}`);

    const normalTeamAfterLeave = await Team.findById(normalTeamId).lean();
    assert(normalTeamAfterLeave, 'No se encontró el equipo luego de abandonar');
    assert(
      String(normalTeamAfterLeave?.roster?.starters?.[0]?.user || '') === String(captain._id),
      'El slot del capitán no se preservó al abandonar un miembro'
    );
    assert(
      !normalTeamAfterLeave?.roster?.starters?.some((slot) => String(slot?.user || '') === String(friend._id)),
      'El jugador que salió sigue en el roster'
    );

    await follow({ token: captainToken, targetUserId: outsider._id });
    await follow({ token: outsiderToken, targetUserId: captain._id });

    const createUniversityRes = await createTeam({
      token: captainToken,
      payload: {
        ...baseTeamPayload,
        name: `Smoke Uni ${suffix}`,
        teamLevel: 'Universitario'
      },
      roster: baseRoster
    });
    assert(
      createUniversityRes.status === 201,
      `Crear equipo universitario falló: ${createUniversityRes.status} ${createUniversityRes.text}`
    );

    const universityTeamId = String(createUniversityRes.body?.teamId || '');
    assert(universityTeamId, 'Equipo universitario sin teamId');
    createdTeamIds.push(universityTeamId);

    const inviteOutsiderUniRes = await request(app)
      .post(`/api/teams/${universityTeamId}/invite-friend`)
      .set('Authorization', `Bearer ${captainToken}`)
      .send({
        targetUserId: String(outsider._id),
        slotType: 'starters',
        slotIndex: 1
      });
    assert(
      inviteOutsiderUniRes.status === 400,
      `Invitar usuario de otra universidad debía fallar y devolvió ${inviteOutsiderUniRes.status}`
    );

    const deleteNormalRes = await request(app)
      .delete(`/api/teams/${normalTeamId}`)
      .set('Authorization', `Bearer ${captainToken}`);
    assert(
      deleteNormalRes.status === 200,
      `Eliminar equipo normal falló: ${deleteNormalRes.status} ${deleteNormalRes.text}`
    );

    const deletedNormalTeam = await Team.findById(normalTeamId).lean();
    assert(!deletedNormalTeam, 'El equipo normal no se eliminó');

    const deleteUniversityRes = await request(app)
      .delete(`/api/teams/${universityTeamId}`)
      .set('Authorization', `Bearer ${captainToken}`);
    assert(
      deleteUniversityRes.status === 200,
      `Eliminar equipo universitario falló: ${deleteUniversityRes.status} ${deleteUniversityRes.text}`
    );

    const deletedUniTeam = await Team.findById(universityTeamId).lean();
    assert(!deletedUniTeam, 'El equipo universitario no se eliminó');

    console.log('Team flow smoke: OK');
  } finally {
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
    console.error('team-flow-smoke failed:', error?.message || error);
    process.exit(1);
  });
