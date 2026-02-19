import { getRedisClient } from '../services/redisClient.js';

const buckets = new Map();

const cleanupBucket = (key, now, windowMs) => {
    const entry = buckets.get(key);
    if (!entry) return;
    if (now - entry.start >= windowMs) buckets.delete(key);
};

const incrementMemoryBucket = (key, now, windowMs) => {
    cleanupBucket(key, now, windowMs);
    const entry = buckets.get(key);
    if (!entry) {
        buckets.set(key, { count: 1, start: now });
        return 1;
    }
    if (now - entry.start >= windowMs) {
        buckets.set(key, { count: 1, start: now });
        return 1;
    }
    entry.count += 1;
    return entry.count;
};

const incrementRedisBucket = async (redisClient, key, windowMs) => {
    const count = await redisClient.incr(key);
    if (count === 1) {
        await redisClient.pexpire(key, windowMs);
    }
    return count;
};

export const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, keyPrefix = 'rl' } = {}) => {
    return async (req, res, next) => {
        try {
            const now = Date.now();
            const key = `${keyPrefix}:${req.ip}`;

            const redisClient = await getRedisClient();
            const count = redisClient
                ? await incrementRedisBucket(redisClient, key, windowMs)
                : incrementMemoryBucket(key, now, windowMs);

            if (count > max) {
                return res.status(429).json({ message: 'Demasiadas solicitudes. Intenta más tarde.' });
            }
            return next();
        } catch (error) {
            // fail-open para no tumbar rutas críticas si Redis falla temporalmente
            return next();
        }
    };
};
