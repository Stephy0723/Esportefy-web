import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * REGISTER
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔎 Validaciones básicas
    if (!email || email.trim() === "") {
      return res.status(400).json({ message: "Email requerido" });
    }

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    // 🔁 Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: "El usuario ya existe" });
    }

    // 🔐 Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 💾 Crear usuario
    const user = await User.create({
      email,
      password: hashedPassword,
    });

    // 📤 Respuesta (NUNCA devuelvas el password)
    res.status(201).json({
      _id: user._id,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al registrar usuario" });
  }
};

/**
 * LOGIN
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔎 Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // 🔍 Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 🔐 Comparar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // 🎫 Generar token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 📤 Respuesta
    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
};
