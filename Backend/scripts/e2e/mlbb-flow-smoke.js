import axios from 'axios';

const API_BASE_URL = String(process.env.API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

const PLAYER_EMAIL = String(process.env.E2E_PLAYER_EMAIL || '').trim().toLowerCase();
const PLAYER_PASSWORD = String(process.env.E2E_PLAYER_PASSWORD || '').trim();
const ADMIN_EMAIL = String(process.env.E2E_ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = String(process.env.E2E_ADMIN_PASSWORD || '').trim();

const MLBB_PLAYER_ID = String(process.env.E2E_MLBB_PLAYER_ID || '').trim();
const MLBB_ZONE_ID = String(process.env.E2E_MLBB_ZONE_ID || '').trim();
const MLBB_IGN = String(process.env.E2E_MLBB_IGN || '').trim();

const OPTIONAL_TOURNAMENT_CODE = String(process.env.E2E_TOURNAMENT_CODE || '').trim().toUpperCase();
const OPTIONAL_TEAM_ID = String(process.env.E2E_TEAM_ID || '').trim();

const required = [
  ['E2E_PLAYER_EMAIL', PLAYER_EMAIL],
  ['E2E_PLAYER_PASSWORD', PLAYER_PASSWORD],
  ['E2E_ADMIN_EMAIL', ADMIN_EMAIL],
  ['E2E_ADMIN_PASSWORD', ADMIN_PASSWORD],
  ['E2E_MLBB_PLAYER_ID', MLBB_PLAYER_ID],
  ['E2E_MLBB_ZONE_ID', MLBB_ZONE_ID]
];

for (const [key, value] of required) {
  if (!value) {
    console.error(`Falta variable requerida: ${key}`);
    process.exit(1);
  }
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

const findPendingRequest = (items = []) =>
  items.find((item) =>
    String(item?.playerId || '') === MLBB_PLAYER_ID && String(item?.zoneId || '') === MLBB_ZONE_ID
  );

const main = async () => {
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log('1) Login jugador/admin...');
  const playerToken = await login(PLAYER_EMAIL, PLAYER_PASSWORD);
  const adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);

  console.log('2) Validar cuenta MLBB...');
  await api.post(
    '/api/auth/mlbb/validate',
    { playerId: MLBB_PLAYER_ID, zoneId: MLBB_ZONE_ID, ign: MLBB_IGN },
    { headers: authHeader(playerToken) }
  );

  console.log('3) Vincular cuenta MLBB...');
  const linkRes = await api.post(
    '/api/auth/mlbb/link',
    { playerId: MLBB_PLAYER_ID, zoneId: MLBB_ZONE_ID, ign: MLBB_IGN },
    { headers: authHeader(playerToken) }
  );
  const linkStatus = String(linkRes?.data?.status || '').toLowerCase();
  console.log(`   -> Estado recibido: ${linkStatus}`);

  if (linkStatus === 'pending') {
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
  if (finalStatus !== 'verified') {
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
