const timestamp = new Date().toISOString("es-DO");

export const logger = (req, res, next) => {
    console.log(` ${req.method} ${req.url} ${timestamp}`);
    next();
}