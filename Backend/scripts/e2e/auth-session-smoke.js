import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'auth_token';

const waitForMongoose = async (timeoutMs = 10000) => {
  const startedAt = Date.now();
  while (mongoose.connection.readyState !== 1) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error('MongoDB no estuvo listo a tiempo para el smoke de Auth');
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

const parseCookieMaxAge = (setCookies = [], cookieName = AUTH_COOKIE_NAME) => {
  const target = (setCookies || []).find((value) => String(value || '').startsWith(`${cookieName}=`));
  if (!target) return 0;
  const match = String(target).match(/Max-Age=(\d+)/i);
  if (!match) return 0;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : 0;
};

const createUser = async ({ suffix, plainPassword }) => {
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  const phoneSuffix = String(Math.floor(Math.random() * 10000000)).padStart(7, '0');

  return User.create({
    fullName: `Auth Smoke ${suffix}`,
    phone: `809${phoneSuffix}`,
    gender: 'Otro',
    country: 'República Dominicana',
    birthDate: new Date('2000-01-01'),
    selectedGames: ['Valorant'],
    experience: [],
    platforms: [],
    goals: [],
    username: `auth-smoke-${suffix}`,
    email: `auth.smoke.${suffix}@glitchgang.local`,
    password: hashedPassword,
    checkTerms: true
  });
};

const loginWithAgent = async ({ agent, email, password, rememberMe }) => {
  const res = await agent
    .post('/api/auth/login')
    .send({ email, password, rememberMe });

  assert(res.status === 200, `Login falló (remember=${rememberMe}): ${res.status} ${res.text}`);
  assert(Boolean(res.body?.token), 'Login no devolvió token');
  assert(Boolean(res.body?.user?.id), 'Login no devolvió user.id');
  return {
    response: res,
    token: res.body.token,
    rememberMe: Boolean(res.body?.rememberMe)
  };
};

const run = async () => {
  await waitForMongoose();

  const suffix = randomSuffix();
  const plainPassword = 'AuthSmoke123!';
  let createdUserId = '';

  try {
    const user = await createUser({ suffix, plainPassword });
    createdUserId = String(user._id);

    // Flujo 1: sesión normal + refresh + logout.
    const normalAgent = request.agent(app);
    const normalLogin = await loginWithAgent({
      agent: normalAgent,
      email: user.email,
      password: plainPassword,
      rememberMe: false
    });
    assert(normalLogin.rememberMe === false, 'Login normal devolvió rememberMe distinto a false');

    const cookieMaxAgeNormal = parseCookieMaxAge(normalLogin.response.headers?.['set-cookie']);
    assert(cookieMaxAgeNormal > 0, 'No se detectó Max-Age válido en cookie de sesión normal');

    const profileWithBearer = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${normalLogin.token}`);
    assert(profileWithBearer.status === 200, `Profile con Bearer falló: ${profileWithBearer.status}`);

    const profileFromCookieFirst = await normalAgent.get('/api/auth/profile');
    assert(profileFromCookieFirst.status === 200, `Profile por cookie (1) falló: ${profileFromCookieFirst.status}`);

    const profileFromCookieSecond = await normalAgent.get('/api/auth/profile');
    assert(profileFromCookieSecond.status === 200, `Profile por cookie (2) falló: ${profileFromCookieSecond.status}`);

    const logoutNormal = await normalAgent.post('/api/auth/logout');
    assert(logoutNormal.status === 200, `Logout normal falló: ${logoutNormal.status}`);

    const profileAfterLogout = await normalAgent.get('/api/auth/profile');
    assert(
      profileAfterLogout.status === 401 || profileAfterLogout.status === 403,
      `Profile después de logout debería fallar (401/403) y devolvió ${profileAfterLogout.status}`
    );

    // Flujo 2: remember me debe durar más que sesión normal.
    const rememberAgent = request.agent(app);
    const rememberLogin = await loginWithAgent({
      agent: rememberAgent,
      email: user.email,
      password: plainPassword,
      rememberMe: true
    });
    assert(rememberLogin.rememberMe === true, 'Login remember devolvió rememberMe distinto a true');

    const cookieMaxAgeRemember = parseCookieMaxAge(rememberLogin.response.headers?.['set-cookie']);
    assert(cookieMaxAgeRemember > cookieMaxAgeNormal, 'Remember me no aumentó el Max-Age de la cookie');

    const profileRemember = await rememberAgent.get('/api/auth/profile');
    assert(profileRemember.status === 200, `Profile remember flow falló: ${profileRemember.status}`);

    const logoutRemember = await rememberAgent.post('/api/auth/logout');
    assert(logoutRemember.status === 200, `Logout remember flow falló: ${logoutRemember.status}`);

    console.log('Auth session smoke: OK');
  } finally {
    if (createdUserId) {
      await User.deleteOne({ _id: createdUserId });
    }
    await mongoose.connection.close();
  }
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('auth-session-smoke failed:', error?.message || error);
    process.exit(1);
  });
