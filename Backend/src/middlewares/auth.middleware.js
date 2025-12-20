import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Verificar que exista el header
  if (!authHeader) {
    return res.status(401).json({ message: 'No token' });
  }

  // 2. Extraer el token (Bearer TOKEN)
  const token = authHeader.split(' ')[1];

  try {
    // 3. Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Guardar el ID del usuario en la request
    req.userId = decoded.id;

    next(); // deja pasar a la ruta
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};
