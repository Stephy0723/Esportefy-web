import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';

const waitForMongoose = async (timeoutMs = 10000) => {
  const startedAt = Date.now();
  while (mongoose.connection.readyState !== 1) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error('MongoDB no estuvo listo a tiempo para el smoke de Social');
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

const createUser = async ({ suffix }) => {
  const password = 'TestPass123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    fullName: `Social User ${suffix}`,
    phone: `809${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
    gender: 'Otro',
    country: 'República Dominicana',
    birthDate: new Date('2000-01-01'),
    selectedGames: ['Valorant'],
    experience: [],
    platforms: [],
    goals: [],
    username: `social-${suffix}`,
    email: `social.${suffix}@glitchgang.local`,
    password: hashedPassword,
    checkTerms: true
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

const run = async () => {
  await waitForMongoose();

  const suffix = randomSuffix();
  const createdUserIds = [];

  try {
    const [{ user: userA, password: passwordA }, { user: userB, password: passwordB }, { user: userC, password: passwordC }] = await Promise.all([
      createUser({ suffix: `a-${suffix}` }),
      createUser({ suffix: `b-${suffix}` }),
      createUser({ suffix: `c-${suffix}` })
    ]);

    createdUserIds.push(userA._id, userB._id, userC._id);

    const [tokenA, tokenB, tokenC] = await Promise.all([
      login({ email: userA.email, password: passwordA }),
      login({ email: userB.email, password: passwordB }),
      login({ email: userC.email, password: passwordC })
    ]);

    // A sigue a B
    const followAB = await request(app)
      .post(`/api/auth/follow/${userB._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({});
    assert(followAB.status === 200, `A->B follow falló: ${followAB.status} ${followAB.text}`);
    assert(followAB.body?.followed === true, 'Se esperaba followed=true en A->B');

    // B sigue a A (ahora deben ser amigos mutuos)
    const followBA = await request(app)
      .post(`/api/auth/follow/${userA._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({});
    assert(followBA.status === 200, `B->A follow falló: ${followBA.status} ${followBA.text}`);
    assert(followBA.body?.followed === true, 'Se esperaba followed=true en B->A');

    const socialA = await request(app)
      .get('/api/auth/social')
      .set('Authorization', `Bearer ${tokenA}`);
    assert(socialA.status === 200, `Social overview A falló: ${socialA.status}`);
    assert(Array.isArray(socialA.body?.friends), 'Social overview A no devolvió friends');
    assert(socialA.body.friends.some((entry) => String(entry?.id) === String(userB._id)), 'B no aparece como amigo mutuo de A');

    // Buscar por username
    const byUsername = await request(app)
      .get('/api/auth/users/search')
      .set('Authorization', `Bearer ${tokenA}`)
      .query({ q: userC.username.slice(0, 6), limit: 10 });
    assert(byUsername.status === 200, `Búsqueda por username falló: ${byUsername.status}`);
    assert(
      Array.isArray(byUsername.body?.users) && byUsername.body.users.some((entry) => String(entry?.id) === String(userC._id)),
      'No se encontró al usuario C por username'
    );

    // Buscar por número de userCode visible
    const freshC = await User.findById(userC._id).select('userCode').lean();
    const visibleCode = String(freshC?.userCode || '');
    assert(visibleCode, 'Usuario C no tiene userCode generado');

    const byCodeVisible = await request(app)
      .get('/api/auth/users/search')
      .set('Authorization', `Bearer ${tokenA}`)
      .query({ q: visibleCode, limit: 10 });
    assert(byCodeVisible.status === 200, `Búsqueda por userCode visible falló: ${byCodeVisible.status}`);
    assert(
      Array.isArray(byCodeVisible.body?.users) && byCodeVisible.body.users.some((entry) => String(entry?.id) === String(userC._id)),
      'No se encontró al usuario C por userCode visible'
    );

    // Ocultar userCode de C y validar que ya no sale por código
    const hideCode = await request(app)
      .put('/api/auth/update-profile')
      .set('Authorization', `Bearer ${tokenC}`)
      .field('showPublicUserCode', 'false');
    assert(hideCode.status === 200, `No se pudo ocultar userCode de C: ${hideCode.status} ${hideCode.text}`);
    assert(hideCode.body?.privacy?.showPublicUserCode === false, 'showPublicUserCode no quedó en false');

    const byCodeHidden = await request(app)
      .get('/api/auth/users/search')
      .set('Authorization', `Bearer ${tokenA}`)
      .query({ q: visibleCode, limit: 10 });
    assert(byCodeHidden.status === 200, `Búsqueda por userCode oculto falló: ${byCodeHidden.status}`);
    assert(
      Array.isArray(byCodeHidden.body?.users) && !byCodeHidden.body.users.some((entry) => String(entry?.id) === String(userC._id)),
      'Usuario C sigue apareciendo por userCode oculto'
    );

    console.log('Social flow smoke: OK');
  } finally {
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    await mongoose.connection.close();
  }
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('social-flow-smoke failed:', error?.message || error);
    process.exit(1);
  });
