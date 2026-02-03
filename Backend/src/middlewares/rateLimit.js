const buckets = new Map();

const cleanupBucket = (key, now, windowMs) => {
    const entry = buckets.get(key);
    if (!entry) return;
    if (now - entry.start >= windowMs) buckets.delete(key);
};

export const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, keyPrefix = 'rl' } = {}) => {
    return (req, res, next) => {
        const now = Date.now();
        const key = `${keyPrefix}:${req.ip}`;
        cleanupBucket(key, now, windowMs);
        const entry = buckets.get(key);
        if (!entry) {
            buckets.set(key, { count: 1, start: now });
            return next();
        }
        if (now - entry.start >= windowMs) {
            buckets.set(key, { count: 1, start: now });
            return next();
        }
        entry.count += 1;
        if (entry.count > max) {
            return res.status(429).json({ message: 'Demasiadas solicitudes. Intenta más tarde.' });
        }
        return next();
    };
};
