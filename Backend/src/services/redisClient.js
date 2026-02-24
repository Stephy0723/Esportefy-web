let redisClient = null;
let redisAvailable = false;
let lastInitAttemptAt = 0;

const REDIS_RETRY_INTERVAL_MS = 60 * 1000;

export const getRedisClient = async () => {
    if (redisAvailable && redisClient) return redisClient;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return null;

    const now = Date.now();
    if (!redisAvailable && now - lastInitAttemptAt < REDIS_RETRY_INTERVAL_MS) {
        return null;
    }

    lastInitAttemptAt = now;

    try {
        const { default: Redis } = await import('ioredis');
        const client = new Redis(redisUrl, {
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false
        });

        await client.connect();
        await client.ping();

        redisClient = client;
        redisAvailable = true;
        console.log('Redis conectado');
        return redisClient;
    } catch (error) {
        redisAvailable = false;
        redisClient = null;
        console.warn('Redis no disponible. Usando fallback en memoria.');
        return null;
    }
};

export const hasRedis = () => redisAvailable;
