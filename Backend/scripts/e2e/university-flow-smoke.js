import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
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

const createUser = async ({ suffix, isAdmin = false }) => {
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
    email: `${isAdmin ? 'uniadmin' : 'uniplayer'}.${suffix}@esportefy.local`,
    password: hashedPassword,
    checkTerms: true,
    isAdmin
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

const run = async () => {
  await waitForMongoose();

  const suffix = randomSuffix();
  const createdUserIds = [];
  const createdApplicationIds = [];

  try {
    const [{ user: playerUser, password: playerPassword }, { user: adminUser, password: adminPassword }, { user: rejectedUser, password: rejectedPassword }] = await Promise.all([
      createUser({ suffix: `player-${suffix}` }),
      createUser({ suffix: `admin-${suffix}`, isAdmin: true }),
      createUser({ suffix: `reject-${suffix}` })
    ]);

    createdUserIds.push(playerUser._id, adminUser._id, rejectedUser._id);

    const [playerToken, adminToken, rejectedToken] = await Promise.all([
      login({ email: playerUser.email, password: playerPassword }),
      login({ email: adminUser.email, password: adminPassword }),
      login({ email: rejectedUser.email, password: rejectedPassword })
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

    const pendingApplicationRes = await request(app)
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

    const approveRes = await request(app)
      .patch(`/api/university/applications/${pendingApplicationId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'approved' });

    assert(approveRes.status === 200, `La aprobación admin falló: ${approveRes.status} ${approveRes.text}`);

    const playerStatusAfterApproval = await request(app)
      .get('/api/university/me')
      .set('Authorization', `Bearer ${playerToken}`);

    assert(playerStatusAfterApproval.status === 200, `No se pudo consultar el estado tras aprobar: ${playerStatusAfterApproval.status}`);
    assert(playerStatusAfterApproval.body?.university?.verificationStatus === 'verified', 'El usuario aprobado no quedó en verified');

    const rejectedApplicationRes = await request(app)
      .post('/api/university/applications')
      .set('Authorization', `Bearer ${rejectedToken}`)
      .send({
        universityId: 'intec',
        universityTag: 'INTEC',
        universityName: 'Instituto Tecnológico de Santo Domingo',
        region: 'rd',
        city: 'Santo Domingo',
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

    console.log('University smoke OK');
    console.log(JSON.stringify({
      approvedApplicationId: pendingApplicationId,
      rejectedApplicationId,
      approvedUserId: String(playerUser._id),
      rejectedUserId: String(rejectedUser._id),
      adminUserId: String(adminUser._id)
    }, null, 2));
  } finally {
    await Promise.all([
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
