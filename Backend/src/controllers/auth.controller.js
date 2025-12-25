import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

/**
 * REGISTER
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const {
      // Etapa 1
      fullName,
      phone,
      country,
      birthDate,

      // Etapa 2
      selectedGames,

      // Etapa 3
      experience,
      platforms,
      goals,

      // Etapa 4
      username,
      email,
      password,
      confirmPassword,
      checkTerms
    } = req.body;

    // ===== VALIDACIONES =====
    if (
      !fullName ||
      !phone ||
      !country ||
      !birthDate ||
      !selectedGames?.length ||
      !experience ||
      !platforms?.length ||
      !goals?.length ||
      !username ||
      !email ||
      !password
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    if (!checkTerms) {
      return res
        .status(400)
        .json({ message: "Debes aceptar los términos y condiciones" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Las contraseñas no coinciden" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    // ===== VALIDAR DUPLICADOS =====
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(409).json({ message: "El email ya está registrado" });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(409).json({ message: "El username ya está en uso" });
    }

    // ===== HASH PASSWORD =====
    const hashedPassword = await bcrypt.hash(password, 10);

    // ===== CREAR USUARIO =====
    const user = await User.create({
      fullName,
      phone,
      country,
      birthDate,
      selectedGames,
      experience,
      platforms,
      goals,
      username,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      message: "Usuario registrado correctamente",
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });

  } catch (error) {
    console.error(error);
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

    if (!email || !password) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
};

/**
 * FORGOT PASSWORD
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 3600000; // 1 hora

    await user.save();

    res.json({ message: "Token de recuperación generado" });
  } catch (error) {
    res.status(500).json({ message: "Error en recuperación de contraseña" });
  }
};

/**
 * RESET PASSWORD
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetTokenExpire = null;

    await user.save();

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al resetear contraseña" });
  }
};
