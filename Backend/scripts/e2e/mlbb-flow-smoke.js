import axios from 'axios';

const API_BASE_URL = String(process.env.API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

const PLAYER_TOKEN = String(process.env.E2E_PLAYER_TOKEN || '').trim();
const PLAYER_EMAIL = String(process.env.E2E_PLAYER_EMAIL || '').trim().toLowerCase();
const PLAYER_PASSWORD = String(process.env.E2E_PLAYER_PASSWORD || '').trim();
const ADMIN_TOKEN = String(process.env.E2E_ADMIN_TOKEN || '').trim();
const ADMIN_EMAIL = String(process.env.E2E_ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = String(process.env.E2E_ADMIN_PASSWORD || '').trim();

const MLBB_PLAYER_ID = String(process.env.E2E_MLBB_PLAYER_ID || '').trim();
const MLBB_ZONE_ID = String(process.env.E2E_MLBB_ZONE_ID || '').trim();
const MLBB_IGN = String(process.env.E2E_MLBB_IGN || '').trim();

const OPTIONAL_TOURNAMENT_CODE = String(process.env.E2E_TOURNAMENT_CODE || '').trim().toUpperCase();
const OPTIONAL_TEAM_ID = String(process.env.E2E_TEAM_ID || '').trim();

const VERIFIED_STATUSES = new Set(['verified', 'verified_auto', 'verified_manual']);

if (!MLBB_PLAYER_ID) {
  console.error('Falta variable requerida: E2E_MLBB_PLAYER_ID');
  process.exit(1);
}
if (!MLBB_ZONE_ID) {
  console.error('Falta variable requerida: E2E_MLBB_ZONE_ID');
  process.exit(1);
}
if (!PLAYER_TOKEN && (!PLAYER_EMAIL || !PLAYER_PASSWORD)) {
  console.error('Debes definir E2E_PLAYER_TOKEN o E2E_PLAYER_EMAIL + E2E_PLAYER_PASSWORD');
  process.exit(1);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25_000
});

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const login = async (email, password) => {
  const res = await api.post('/api/auth/login', { email, password });
  const token = res?.data?.token;
  if (!token) throw new Error(`Login sin token para ${email}`);
  return token;
};

const resolveToken = async ({ token, email, password, label, required }) => {
  if (token) return token;
  if (email && password) return login(email, password);
  if (required) {
    throw new Error(`Token de ${label} requerido. Define ${label === 'admin' ? 'E2E_ADMIN_TOKEN o E2E_ADMIN_EMAIL + E2E_ADMIN_PASSWORD' : 'E2E_PLAYER_TOKEN o E2E_PLAYER_EMAIL + E2E_PLAYER_PASSWORD'}.`);
  }
  return '';
};

const findPendingRequest = (items = []) =>
  items.find((item) =>
    String(item?.playerId || '') === MLBB_PLAYER_ID && String(item?.zoneId || '') === MLBB_ZONE_ID
  );

const main = async () => {
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log('1) Resolver autenticación...');
  const playerToken = await resolveToken({
    token: PLAYER_TOKEN,
    email: PLAYER_EMAIL,
    password: PLAYER_PASSWORD,
    label: 'player',
    required: true
  });
  let adminToken = await resolveToken({
    token: ADMIN_TOKEN,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    label: 'admin',
    required: false
  });

  console.log('2) Validar cuenta MLBB...');
  const validationRes = await api.post(
    '/api/auth/mlbb/validate',
    { playerId: MLBB_PLAYER_ID, zoneId: MLBB_ZONE_ID, ign: MLBB_IGN },
    { headers: authHeader(playerToken) }
  );
  const mode = String(validationRes?.data?.mode || '').toLowerCase();
  if (mode) console.log(`   -> Modo MLBB detectado: ${mode}`);

  console.log('3) Vincular cuenta MLBB...');
  let linkStatus = '';
  try {
    const linkRes = await api.post(
      '/api/auth/mlbb/link',
      { playerId: MLBB_PLAYER_ID, zoneId: MLBB_ZONE_ID, ign: MLBB_IGN },
      { headers: authHeader(playerToken) }
    );
    linkStatus = String(linkRes?.data?.status || '').toLowerCase();
  } catch (error) {
    const statusCode = Number(error?.response?.status || 0);
    if (statusCode === 429 || statusCode === 400) {
      const fallback = await api.get('/api/auth/mlbb/status', {
        headers: authHeader(playerToken)
      });
      linkStatus = String(fallback?.data?.status || '').toLowerCase();
      console.log(`   -> Vinculación respondió ${statusCode}, usando estado actual: ${linkStatus}`);
    } else {
      throw error;
    }
  }
  console.log(`   -> Estado recibido: ${linkStatus}`);

  if (linkStatus === 'pending') {
    if (!adminToken) {
      adminToken = await resolveToken({
        token: ADMIN_TOKEN,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        label: 'admin',
        required: true
      });
    }
    console.log('4) Revisar pendientes MLBB (admin) y aprobar...');
    const pending = await api.get('/api/auth/mlbb/review/pending', {
      headers: authHeader(adminToken)
    });
    const request = findPendingRequest(pending?.data?.items || []);
    if (!request?.userId) {
      throw new Error('No se encontró la solicitud pendiente en la bandeja admin.');
    }

    await api.patch(
      `/api/auth/mlbb/review/${request.userId}`,
      { action: 'approve' },
      { headers: authHeader(adminToken) }
    );
  }

  console.log('5) Verificar estado final MLBB del jugador...');
  const statusRes = await api.get('/api/auth/mlbb/status', {
    headers: authHeader(playerToken)
  });
  const finalStatus = String(statusRes?.data?.status || '').toLowerCase();
  if (!VERIFIED_STATUSES.has(finalStatus)) {
    throw new Error(`Estado final inesperado: ${finalStatus}`);
  }
  console.log('   -> OK, cuenta MLBB verificada.');

  if (OPTIONAL_TOURNAMENT_CODE && OPTIONAL_TEAM_ID) {
    console.log('6) Registro opcional de equipo en torneo...');
    await api.post(
      `/api/tournaments/${OPTIONAL_TOURNAMENT_CODE}/register`,
      { teamId: OPTIONAL_TEAM_ID },
      { headers: authHeader(playerToken) }
    );
    console.log('   -> Registro enviado.');
  }

  console.log('Flujo E2E MLBB completado.');
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('E2E MLBB falló:', error?.response?.data || error?.message || error);
    process.exit(1);
  });
