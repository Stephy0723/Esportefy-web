import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    try {
        // 1. Obtener el token del encabezado 'Authorization'
        // El formato estándar es: "Bearer <token>"
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(403).json({ message: "Acceso denegado. No se proporcionó un token." });
        }

        const token = authHeader.split(' ')[1];

        // 2. Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Guardar los datos del usuario decodificados en el objeto 'req'
        // Esto permite que las siguientes funciones tengan acceso al ID del usuario
        req.userId = decoded.id;

        // 4. Continuar con la ejecución
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token inválido o expirado" });
    }
};