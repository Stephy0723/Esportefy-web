export const logger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const safePath = req.path || (req.originalUrl || req.url || '/').split('?')[0];
    console.log(`${req.method} ${safePath} ${timestamp}`);
    next();
};
