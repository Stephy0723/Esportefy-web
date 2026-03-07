import axios from 'axios';

const API_BASE_URL = String(process.env.API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
const AUTH_TOKEN = String(process.env.LOAD_AUTH_TOKEN || '').trim();
const LOAD_EMAIL = String(process.env.LOAD_EMAIL || '').trim().toLowerCase();
const LOAD_PASSWORD = String(process.env.LOAD_PASSWORD || '').trim();
const METHOD = String(process.env.LOAD_METHOD || 'GET').trim().toUpperCase();
const PATHNAME = String(process.env.LOAD_PATH || '/api/auth/mlbb/status').trim();
const TOTAL_REQUESTS = Number.parseInt(String(process.env.LOAD_TOTAL_REQUESTS || '200'), 10);
const CONCURRENCY = Number.parseInt(String(process.env.LOAD_CONCURRENCY || '100'), 10);
const MAX_FAILURE_RATE = Number.parseFloat(String(process.env.LOAD_MAX_FAILURE_RATE || '0.05'));

const safeTotal = Number.isFinite(TOTAL_REQUESTS) && TOTAL_REQUESTS > 0 ? TOTAL_REQUESTS : 200;
const safeConcurrency = Number.isFinite(CONCURRENCY) && CONCURRENCY > 0 ? CONCURRENCY : 100;
const safeMaxFailureRate = Number.isFinite(MAX_FAILURE_RATE) && MAX_FAILURE_RATE >= 0
  ? Math.min(MAX_FAILURE_RATE, 1)
  : 0.05;

const resolveAuthToken = async () => {
  if (AUTH_TOKEN) return AUTH_TOKEN;
  if (!LOAD_EMAIL || !LOAD_PASSWORD) {
    throw new Error('Falta LOAD_AUTH_TOKEN o LOAD_EMAIL + LOAD_PASSWORD');
  }

  const loginClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20_000
  });
  const res = await loginClient.post('/api/auth/login', {
    email: LOAD_EMAIL,
    password: LOAD_PASSWORD
  });
  const token = String(res?.data?.token || '').trim();
  if (!token) {
    throw new Error('Login de carga sin token');
  }
  return token;
};

const payload = {
  playerId: String(process.env.LOAD_MLBB_PLAYER_ID || '123456789').trim(),
  zoneId: String(process.env.LOAD_MLBB_ZONE_ID || '1234').trim(),
  ign: String(process.env.LOAD_MLBB_IGN || 'LoadUser').trim()
};

let client = null;

const sendOnce = async () => {
  if (!client) {
    throw new Error('Cliente HTTP no inicializado');
  }
  if (METHOD === 'POST') {
    return client.post(PATHNAME, payload);
  }
  if (METHOD === 'PATCH') {
    return client.patch(PATHNAME, payload);
  }
  if (METHOD === 'DELETE') {
    return client.delete(PATHNAME);
  }
  return client.get(PATHNAME);
};

let sent = 0;
let ok = 0;
let failed = 0;
const statusCodes = new Map();

const worker = async () => {
  while (true) {
    const current = sent;
    sent += 1;
    if (current >= safeTotal) return;

    try {
      const res = await sendOnce();
      ok += 1;
      const code = res?.status || 0;
      statusCodes.set(code, (statusCodes.get(code) || 0) + 1);
    } catch (error) {
      failed += 1;
      const code = error?.response?.status || 0;
      statusCodes.set(code, (statusCodes.get(code) || 0) + 1);
    }
  }
};

const main = async () => {
  const token = await resolveAuthToken();
  client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20_000,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const start = Date.now();
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log(`Target: ${METHOD} ${PATHNAME}`);
  console.log(`Requests: ${safeTotal}, Concurrency: ${safeConcurrency}`);
  console.log(`Max failure rate: ${(safeMaxFailureRate * 100).toFixed(2)}%`);

  const workers = Array.from({ length: safeConcurrency }, () => worker());
  await Promise.all(workers);

  const elapsedMs = Date.now() - start;
  const rps = (safeTotal / Math.max(elapsedMs, 1)) * 1000;

  console.log('--- Resultado ---');
  console.log(`OK: ${ok}`);
  console.log(`Fallidos: ${failed}`);
  console.log(`Tiempo total: ${elapsedMs} ms`);
  console.log(`RPS aprox: ${rps.toFixed(2)}`);
  console.log('Status codes:');
  for (const [code, count] of [...statusCodes.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`  ${code}: ${count}`);
  }

  const failureRate = safeTotal > 0 ? failed / safeTotal : 1;
  if (failureRate > safeMaxFailureRate) {
    throw new Error(
      `Failure rate ${(failureRate * 100).toFixed(2)}% supera el máximo permitido ${(safeMaxFailureRate * 100).toFixed(2)}%`
    );
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Load smoke falló:', error?.message || error);
    process.exit(1);
  });
