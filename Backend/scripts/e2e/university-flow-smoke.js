import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Team from '../../src/models/Team.js';
import Tournament from '../../src/models/Tournament.js';
import UniversityApplication from '../../src/models/UniversityApplication.js';
import AdminAuditLog from '../../src/models/AdminAuditLog.js';

const waitForMongoose = async (timeoutMs = 10000) => {
  const startedAt = Date.now();
  while (mongoose.connection.readyState !== 1) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error('MongoDB no estuvo listo a tiempo para el smoke de University');
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const randomSuffix = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const createUser = async ({ suffix, isAdmin = false, isOrganizer = false }) => {
  const password = 'TestPass123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    fullName: isAdmin ? `University Admin ${suffix}` : `University Player ${suffix}`,
    phone: isAdmin ? `829${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}` : `849${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
    gender: 'Otro',
    country: 'República Dominicana',
    birthDate: new Date('2000-01-01'),
    selectedGames: [],
    experience: [],
    platforms: [],
    goals: [],
    username: `${isAdmin ? 'uniadmin' : 'uniplayer'}-${suffix}`,
    email: `${isAdmin ? 'uniadmin' : 'uniplayer'}.${suffix}@glitchgang.local`,
    password: hashedPassword,
    checkTerms: true,
    isAdmin,
    isOrganizer
  });

  return {
    user,
    password
  };
};

const login = async ({ email, password }) => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  assert(res.status === 200, `Login falló para ${email}: ${res.status} ${res.text}`);
  assert(res.body?.token, `Login no devolvió token para ${email}`);

  return res.body.token;
};

const submitApplication = async ({ token, universityId, universityTag, universityName, campus, studentId, program, academicLevel, institutionalEmail }) => {
  const res = await request(app)
    .post('/api/university/applications')
    .set('Authorization', `Bearer ${token}`)
    .send({
      universityId,
      universityTag,
      universityName,
      region: 'rd',
      city: 'Santo Domingo',
      campus,
      studentId,
      program,
      academicLevel,
      institutionalEmail
    });

  return res;
};

const approveApplication = async ({ adminToken, applicationId }) => {
  return request(app)
    .patch(`/api/university/applications/${applicationId}/review`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ decision: 'approved' });
};

const run = async () => {
  await waitForMongoose();

  const suffix = randomSuffix();
  const createdUserIds = [];
  const createdApplicationIds = [];
  const createdTeamIds = [];
  const createdTournamentIds = [];

  try {
    const [
      { user: playerUser, password: playerPassword },
      { user: adminUser, password: adminPassword },
      { user: rejectedUser, password: rejectedPassword },
      { user: teammateUser, password: teammatePassword },
      { user: outsiderUser, password: outsiderPassword }
    ] = await Promise.all([
      createUser({ suffix: `player-${suffix}`, isOrganizer: true }),
      createUser({ suffix: `admin-${suffix}`, isAdmin: true }),
      createUser({ suffix: `reject-${suffix}` }),
      createUser({ suffix: `mate-${suffix}` }),
      createUser({ suffix: `outsider-${suffix}` })
    ]);

    createdUserIds.push(playerUser._id, adminUser._id, rejectedUser._id, teammateUser._id, outsiderUser._id);

    const [playerToken, adminToken, rejectedToken, teammateToken, outsiderToken] = await Promise.all([
      login({ email: playerUser.email, password: playerPassword }),
      login({ email: adminUser.email, password: adminPassword }),
      login({ email: rejectedUser.email, password: rejectedPassword }),
      login({ email: teammateUser.email, password: teammatePassword }),
      login({ email: outsiderUser.email, password: outsiderPassword })
    ]);

    const invalidApplicationRes = await request(app)
      .post('/api/university/applications')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        universityId: 'uasd',
        universityTag: 'UASD',
        universityName: 'Universidad Autónoma de Santo Domingo',
        region: 'rd',
        city: 'Santo Domingo',
        campus: 'Sede Central',
        studentId: `MAT-${suffix}`,
        program: 'Ingeniería en Sistemas',
        academicLevel: '3',
        institutionalEmail: `tester.${suffix}@gmail.com`
      });

    assert(invalidApplicationRes.status === 400, `Se esperaba 400 en correo personal y devolvió ${invalidApplicationRes.status}`);

    const pendingApplicationRes = await submitApplication({
      token: playerToken,
      universityId: 'uasd',
      universityTag: 'UASD',
      universityName: 'Universidad Autónoma de Santo Domingo',
      campus: 'Sede Central',
      studentId: `MAT-${suffix}`,
      program: 'Ingeniería en Sistemas',
      academicLevel: '3',
      institutionalEmail: `tester.${suffix}@uasd.edu.do`
    });

    assert(pendingApplicationRes.status === 200, `La postulación válida no entró: ${pendingApplicationRes.status} ${pendingApplicationRes.text}`);

    const pendingApplicationId = pendingApplicationRes.body?.application?._id;
    assert(pendingApplicationId, 'La postulación válida no devolvió _id');
    createdApplicationIds.push(pendingApplicationId);

    const playerStatusAfterApply = await request(app)
      .get('/api/university/me')
      .set('Authorization', `Bearer ${playerToken}`);

    assert(playerStatusAfterApply.status === 200, `No se pudo consultar el estado universitario del jugador: ${playerStatusAfterApply.status}`);
    assert(playerStatusAfterApply.body?.university?.verificationStatus === 'pending', 'La postulación válida no quedó en pending');

    const adminQueueRes = await request(app)
      .get('/api/university/applications?status=pending&region=rd')
      .set('Authorization', `Bearer ${adminToken}`);

    assert(adminQueueRes.status === 200, `El admin no pudo listar postulaciones: ${adminQueueRes.status}`);
    assert(Array.isArray(adminQueueRes.body), 'La cola admin no devolvió un arreglo');
    assert(adminQueueRes.body.some((application) => application._id === pendingApplicationId), 'La postulación pending no apareció en la cola admin');

    const approveRes = await approveApplication({ adminToken, applicationId: pendingApplicationId });

    assert(approveRes.status === 200, `La aprobación admin falló: ${approveRes.status} ${approveRes.text}`);

    const playerStatusAfterApproval = await request(app)
      .get('/api/university/me')
      .set('Authorization', `Bearer ${playerToken}`);

    assert(playerStatusAfterApproval.status === 200, `No se pudo consultar el estado tras aprobar: ${playerStatusAfterApproval.status}`);
    assert(playerStatusAfterApproval.body?.university?.verificationStatus === 'verified', 'El usuario aprobado no quedó en verified');

    const rejectedApplicationRes = await submitApplication({
      token: rejectedToken,
      universityId: 'intec',
      universityTag: 'INTEC',
      universityName: 'Instituto Tecnológico de Santo Domingo',
      campus: 'Campus Principal',
      studentId: `INT-${suffix}`,
      program: 'Diseño Industrial',
      academicLevel: '2',
      institutionalEmail: `reject.${suffix}@intec.edu.do`
    });

    assert(rejectedApplicationRes.status === 200, `La postulación para rechazo falló: ${rejectedApplicationRes.status} ${rejectedApplicationRes.text}`);

    const rejectedApplicationId = rejectedApplicationRes.body?.application?._id;
    assert(rejectedApplicationId, 'La postulación a rechazar no devolvió _id');
    createdApplicationIds.push(rejectedApplicationId);

    const rejectRes = await request(app)
      .patch(`/api/university/applications/${rejectedApplicationId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'rejected', rejectReason: 'Documento institucional insuficiente' });

    assert(rejectRes.status === 200, `El rechazo admin falló: ${rejectRes.status} ${rejectRes.text}`);

    const rejectedStatus = await request(app)
      .get('/api/university/me')
      .set('Authorization', `Bearer ${rejectedToken}`);

    assert(rejectedStatus.status === 200, `No se pudo consultar el estado tras rechazo: ${rejectedStatus.status}`);
    assert(rejectedStatus.body?.university?.verificationStatus === 'rejected', 'El usuario rechazado no quedó en rejected');
    assert(
      String(rejectedStatus.body?.university?.rejectReason || '').includes('Documento institucional insuficiente'),
      'El motivo de rechazo no quedó guardado en el estado universitario'
    );

    await User.updateOne(
      { _id: rejectedUser._id },
      {
        $set: {
          'connections.microsoft.tenantId': 'tenant-test-rd',
          'connections.microsoft.userId': `entra-${suffix}`,
          'connections.microsoft.email': `reject.${suffix}@intec.edu.do`,
          'connections.microsoft.displayName': `Reject User ${suffix}`,
          'connections.microsoft.verified': true,
          'connections.microsoft.linkedAt': new Date(),
          'university.verificationSource': 'microsoft'
        }
      }
    );

    await UniversityApplication.updateOne(
      { _id: rejectedApplicationId },
      {
        $set: {
          verificationSource: 'microsoft',
          'microsoft.tenantId': 'tenant-test-rd',
          'microsoft.userId': `entra-${suffix}`,
          'microsoft.email': `reject.${suffix}@intec.edu.do`,
          'microsoft.displayName': `Reject User ${suffix}`
        }
      }
    );

    const microsoftStatusRes = await request(app)
      .get('/api/university/microsoft/status')
      .set('Authorization', `Bearer ${rejectedToken}`);

    assert(microsoftStatusRes.status === 200, `No se pudo consultar el estado Microsoft universitario: ${microsoftStatusRes.status}`);
    assert(microsoftStatusRes.body?.microsoftConnection?.verified === true, 'La conexión Microsoft sembrada no quedó marcada como verificada');
    assert(
      Array.isArray(microsoftStatusRes.body?.allowedDomains) && microsoftStatusRes.body.allowedDomains.includes('intec.edu.do'),
      'El endpoint de estado Microsoft no devolvió los dominios permitidos de la universidad'
    );

    const unlinkRejectedRes = await request(app)
      .delete('/api/university/microsoft')
      .set('Authorization', `Bearer ${rejectedToken}`);

    assert(unlinkRejectedRes.status === 200, `La desconexión Microsoft en rejected falló: ${unlinkRejectedRes.status} ${unlinkRejectedRes.text}`);
    assert(unlinkRejectedRes.body?.microsoftConnection?.verified === false, 'La desconexión Microsoft no limpió el estado');

    await User.updateOne(
      { _id: playerUser._id },
      {
        $set: {
          'connections.microsoft.tenantId': 'tenant-approved-rd',
          'connections.microsoft.userId': `entra-approved-${suffix}`,
          'connections.microsoft.email': `tester.${suffix}@uasd.edu.do`,
          'connections.microsoft.displayName': `Approved User ${suffix}`,
          'connections.microsoft.verified': true,
          'connections.microsoft.linkedAt': new Date(),
          'university.verificationSource': 'microsoft'
        }
      }
    );

    const unlinkApprovedRes = await request(app)
      .delete('/api/university/microsoft')
      .set('Authorization', `Bearer ${playerToken}`);

    assert(unlinkApprovedRes.status === 409, `La desconexión Microsoft de un usuario aprobado por Microsoft debía bloquearse y devolvió ${unlinkApprovedRes.status}`);

    const teammateApplicationRes = await submitApplication({
      token: teammateToken,
      universityId: 'uasd',
      universityTag: 'UASD',
      universityName: 'Universidad Autónoma de Santo Domingo',
      campus: 'Sede Central',
      studentId: `MAT-MATE-${suffix}`,
      program: 'Ingeniería Industrial',
      academicLevel: '2',
      institutionalEmail: `mate.${suffix}@uasd.edu.do`
    });
    assert(teammateApplicationRes.status === 200, `La postulación del compañero UASD falló: ${teammateApplicationRes.status} ${teammateApplicationRes.text}`);
    const teammateApplicationId = teammateApplicationRes.body?.application?._id;
    assert(teammateApplicationId, 'La postulación del compañero no devolvió _id');
    createdApplicationIds.push(teammateApplicationId);

    const teammateApproveRes = await approveApplication({ adminToken, applicationId: teammateApplicationId });
    assert(teammateApproveRes.status === 200, `La aprobación del compañero UASD falló: ${teammateApproveRes.status} ${teammateApproveRes.text}`);

    const outsiderApplicationRes = await submitApplication({
      token: outsiderToken,
      universityId: 'intec',
      universityTag: 'INTEC',
      universityName: 'Instituto Tecnológico de Santo Domingo',
      campus: 'Campus Principal',
      studentId: `INT-OUT-${suffix}`,
      program: 'Arquitectura',
      academicLevel: '4',
      institutionalEmail: `outsider.${suffix}@intec.edu.do`
    });
    assert(outsiderApplicationRes.status === 200, `La postulación del outsider INTEC falló: ${outsiderApplicationRes.status} ${outsiderApplicationRes.text}`);
    const outsiderApplicationId = outsiderApplicationRes.body?.application?._id;
    assert(outsiderApplicationId, 'La postulación del outsider no devolvió _id');
    createdApplicationIds.push(outsiderApplicationId);

    const outsiderApproveRes = await approveApplication({ adminToken, applicationId: outsiderApplicationId });
    assert(outsiderApproveRes.status === 200, `La aprobación del outsider INTEC falló: ${outsiderApproveRes.status} ${outsiderApproveRes.text}`);

    const createUniversityTeamRes = await request(app)
      .post('/api/teams/create')
      .set('Authorization', `Bearer ${playerToken}`)
      .field('formData', JSON.stringify({
        name: `UASD Smoke Team ${suffix}`,
        slogan: 'Universidad y competencia',
        category: 'Deportes y Carreras',
        game: 'FIFA / EA FC',
        teamGender: 'Mixto',
        teamCountry: 'República Dominicana',
        teamLevel: 'Universitario',
        teamLanguage: 'Español',
        maxMembers: 2,
        maxSubstitutes: 0,
        leaderIgn: `Captain-${suffix}`,
        leaderRole: 'Player'
      }))
      .field('roster', JSON.stringify({
        starters: [{}, {}],
        subs: [],
        coach: null
      }));

    assert(createUniversityTeamRes.status === 201, `La creación del equipo universitario falló: ${createUniversityTeamRes.status} ${createUniversityTeamRes.text}`);

    const universityTeam = await Team.findOne({
      name: `UASD Smoke Team ${suffix}`,
      captain: playerUser._id
    });
    assert(universityTeam?._id, 'No se encontró el equipo universitario creado');
    createdTeamIds.push(universityTeam._id);
    assert(universityTeam?.university?.isUniversityTeam === true, 'El equipo universitario no quedó marcado como universitario');
    assert(String(universityTeam?.university?.universityId) === 'uasd', 'El equipo universitario no guardó la universidad esperada');

    const teammateJoinRes = await request(app)
      .post(`/api/teams/${universityTeam._id}/requests`)
      .set('Authorization', `Bearer ${teammateToken}`)
      .send({
        slotType: 'starters',
        slotIndex: 1,
        inviteCode: universityTeam.inviteCode,
        player: {
          nickname: `Mate-${suffix}`,
          role: 'Player'
        }
      });
    assert(teammateJoinRes.status === 200, `La solicitud del compañero de la misma universidad falló: ${teammateJoinRes.status} ${teammateJoinRes.text}`);

    const outsiderJoinRes = await request(app)
      .post(`/api/teams/${universityTeam._id}/requests`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({
        slotType: 'starters',
        slotIndex: 1,
        inviteCode: universityTeam.inviteCode,
        player: {
          nickname: `Outsider-${suffix}`,
          role: 'Player'
        }
      });
    assert(outsiderJoinRes.status === 400, `La solicitud de otra universidad debía fallar y devolvió ${outsiderJoinRes.status}`);
    assert(
      String(outsiderJoinRes.body?.message || '').toLowerCase().includes('misma universidad'),
      'La solicitud de otra universidad no devolvió el mensaje esperado'
    );

    const universityTeamAfterRequest = await Team.findById(universityTeam._id);
    const teammateRequest = (universityTeamAfterRequest?.joinRequests || []).find(
      (item) => String(item?.user) === String(teammateUser._id)
    );
    assert(teammateRequest?._id, 'No se encontró la solicitud pendiente del compañero');

    const approveJoinRes = await request(app)
      .patch(`/api/teams/${universityTeam._id}/requests/${teammateRequest._id}`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ action: 'approve' });
    assert(approveJoinRes.status === 200, `La aprobación del compañero universitario falló: ${approveJoinRes.status} ${approveJoinRes.text}`);

    const approvedUniversityTeam = await Team.findById(universityTeam._id);
    const filledStarters = (approvedUniversityTeam?.roster?.starters || []).filter((slot) => slot?.user && slot?.nickname);
    assert(filledStarters.length === 2, 'El equipo universitario no quedó completo tras aprobar al compañero');

    const createRegularTeamRes = await request(app)
      .post('/api/teams/create')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .field('formData', JSON.stringify({
        name: `INTEC Regular ${suffix}`,
        slogan: 'Equipo regular de prueba',
        category: 'Deportes y Carreras',
        game: 'FIFA / EA FC',
        teamGender: 'Mixto',
        teamCountry: 'República Dominicana',
        teamLevel: 'Amateur',
        teamLanguage: 'Español',
        maxMembers: 1,
        maxSubstitutes: 0,
        leaderIgn: `Regular-${suffix}`,
        leaderRole: 'Player'
      }))
      .field('roster', JSON.stringify({
        starters: [{}],
        subs: [],
        coach: null
      }));
    assert(createRegularTeamRes.status === 201, `La creación del equipo regular de outsider falló: ${createRegularTeamRes.status} ${createRegularTeamRes.text}`);

    const regularTeam = await Team.findOne({
      name: `INTEC Regular ${suffix}`,
      captain: outsiderUser._id
    });
    assert(regularTeam?._id, 'No se encontró el equipo regular creado por el outsider');
    createdTeamIds.push(regularTeam._id);
    assert(regularTeam?.university?.isUniversityTeam !== true, 'El equipo regular del outsider no debía quedar marcado como universitario');

    const tournamentDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const createTournamentRes = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${playerToken}`)
      .field('title', `University Cup ${suffix}`)
      .field('description', 'Smoke universitario de equipos y torneos')
      .field('category', 'Universitario')
      .field('game', 'FIFA / EA FC')
      .field('modality', '1v1')
      .field('platform', 'PC')
      .field('server', 'LATAM')
      .field('format', 'Eliminación Directa')
      .field('date', tournamentDate.toISOString())
      .field('time', '18:00')
      .field('entryFee', 'Gratis')
      .field('prizeMode', 'none')
      .field('maxSlots', '8')
      .field('timezone', 'America/Santo_Domingo')
      .field('eligibility', JSON.stringify({
        minAge: 16,
        allowedCountries: ['República Dominicana'],
        notes: 'Solo equipos universitarios verificados',
        universityOnly: true
      }))
      .field('contact', JSON.stringify({
        email: `organizer.${suffix}@uasd.edu.do`,
        phone: '8090000000',
        discordInvite: ''
      }))
      .field('legalCompliance', JSON.stringify({
        jurisdiction: 'República Dominicana',
        governingLaw: 'Legislación dominicana',
        claimsContact: `legal.${suffix}@glitchgang.local`,
        rulesAccepted: true,
        privacyAccepted: true,
        organizerDeclaration: true
      }));

    assert(createTournamentRes.status === 201, `La creación del torneo universitario falló: ${createTournamentRes.status} ${createTournamentRes.text}`);
    const tournamentId = createTournamentRes.body?.tournamentId;
    assert(tournamentId, 'El torneo universitario no devolvió tournamentId');
    const tournamentDoc = await Tournament.findOne({ tournamentId });
    assert(tournamentDoc?._id, 'No se encontró el torneo universitario creado');
    createdTournamentIds.push(tournamentDoc._id);
    assert(tournamentDoc?.eligibility?.universityOnly === true, 'El torneo no quedó marcado como universitario');

    const manualRegisterRes = await request(app)
      .post(`/api/tournaments/${tournamentId}/register`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        teamName: 'Manual fake',
        logoUrl: '',
        roster: { starters: [{ nickname: 'Fake', role: 'Player' }], subs: [] }
      });
    assert(manualRegisterRes.status === 400, `El registro manual en torneo universitario debía fallar y devolvió ${manualRegisterRes.status}`);

    const regularTeamRegisterRes = await request(app)
      .post(`/api/tournaments/${tournamentId}/register`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ teamId: String(regularTeam._id) });
    assert(regularTeamRegisterRes.status === 400, `El registro de equipo no universitario debía fallar y devolvió ${regularTeamRegisterRes.status}`);
    assert(
      String(regularTeamRegisterRes.body?.message || '').toLowerCase().includes('equipos universitarios verificados'),
      'El registro del equipo no universitario no devolvió el mensaje esperado'
    );

    const universityRegisterRes = await request(app)
      .post(`/api/tournaments/${tournamentId}/register`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ teamId: String(universityTeam._id) });
    assert(universityRegisterRes.status === 200, `El registro del equipo universitario falló: ${universityRegisterRes.status} ${universityRegisterRes.text}`);

    const tournamentAfterRegister = await Tournament.findOne({ tournamentId });
    assert((tournamentAfterRegister?.registrations || []).length === 1, 'El torneo universitario no guardó el registro esperado');
    const savedRegistration = tournamentAfterRegister.registrations[0];
    assert(String(savedRegistration?.teamId) === String(universityTeam._id), 'El registro no apuntó al equipo universitario correcto');
    assert(savedRegistration?.teamMeta?.university?.universityId === 'uasd', 'El snapshot universitario no quedó guardado en la inscripción');

    console.log('University smoke OK');
    console.log(JSON.stringify({
      approvedApplicationId: pendingApplicationId,
      rejectedApplicationId,
      teammateApplicationId,
      outsiderApplicationId,
      approvedUserId: String(playerUser._id),
      teammateUserId: String(teammateUser._id),
      outsiderUserId: String(outsiderUser._id),
      rejectedUserId: String(rejectedUser._id),
      adminUserId: String(adminUser._id),
      universityTeamId: String(universityTeam._id),
      regularTeamId: String(regularTeam._id),
      tournamentId
    }, null, 2));
  } finally {
    await Promise.all([
      createdTournamentIds.length
        ? Tournament.deleteMany({ _id: { $in: createdTournamentIds } })
        : Promise.resolve(),
      createdTeamIds.length
        ? Team.deleteMany({ _id: { $in: createdTeamIds } })
        : Promise.resolve(),
      createdApplicationIds.length
        ? UniversityApplication.deleteMany({ _id: { $in: createdApplicationIds } })
        : Promise.resolve(),
      createdUserIds.length
        ? User.deleteMany({ _id: { $in: createdUserIds } })
        : Promise.resolve(),
      createdApplicationIds.length
        ? AdminAuditLog.deleteMany({ entityType: 'UniversityApplication', entityId: { $in: createdApplicationIds.map((id) => String(id)) } })
        : Promise.resolve()
    ]);
  }
};

run()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('University smoke FAILED');
    console.error(error);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  });
