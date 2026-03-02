import axios from 'axios';

const API_BASE_URL = String(process.env.API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
const AUTH_TOKEN = String(process.env.LOAD_AUTH_TOKEN || '').trim();
const METHOD = String(process.env.LOAD_METHOD || 'GET').trim().toUpperCase();
const PATHNAME = String(process.env.LOAD_PATH || '/api/auth/mlbb/status').trim();
const TOTAL_REQUESTS = Number.parseInt(String(process.env.LOAD_TOTAL_REQUESTS || '200'), 10);
const CONCURRENCY = Number.parseInt(String(process.env.LOAD_CONCURRENCY || '100'), 10);

if (!AUTH_TOKEN) {
  console.error('Falta LOAD_AUTH_TOKEN');
  process.exit(1);
}

const safeTotal = Number.isFinite(TOTAL_REQUESTS) && TOTAL_REQUESTS > 0 ? TOTAL_REQUESTS : 200;
const safeConcurrency = Number.isFinite(CONCURRENCY) && CONCURRENCY > 0 ? CONCURRENCY : 100;

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: {
    Authorization: `Bearer ${AUTH_TOKEN}`
  }
});

const payload = {
  playerId: String(process.env.LOAD_MLBB_PLAYER_ID || '123456789').trim(),
  zoneId: String(process.env.LOAD_MLBB_ZONE_ID || '1234').trim(),
  ign: String(process.env.LOAD_MLBB_IGN || 'LoadUser').trim()
};

const sendOnce = async () => {
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
  const start = Date.now();
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log(`Target: ${METHOD} ${PATHNAME}`);
  console.log(`Requests: ${safeTotal}, Concurrency: ${safeConcurrency}`);

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
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Load smoke falló:', error?.message || error);
    process.exit(1);
  });
