// Backend/src/controllers/auth.controller.js
import User from "../models/User.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import nodemailer from "nodemailer";

export const register = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        // 1. Validaciones básicas antes de tocar la DB
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Las contraseñas no coinciden' });
        }

        // 2. Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Crear usuario con todos los campos del body
        // Usamos el spread operator (...) para capturar todos los campos de las Etapas 1-4
        const user = await User.create({
            ...req.body,
            password: hashedPassword
        });

        // Opcional: No devolver la contraseña en la respuesta
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json(userResponse);

    } catch (error) {
        console.error("Error en Registro:", error);
        res.status(500).json({ 
            message: 'Error al registrar el usuario', 
            error: error.message 
        });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Buscar usuario
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // 2. Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // 3. Generar Token
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET || 'secret_fallback', // Siempre usa variables de entorno
            { expiresIn: '24h' }
        );

        res.status(200).json({ 
            token, 
            user: { id: user._id, userName: user.userName } 
        });

    } catch (error) {
        console.error("Error en Login:", error);
        res.status(500).json({ 
            message: 'Error en el servidor', 
            error: error.message 
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        // Buscamos al usuario por ID, pero excluimos el campo password por seguridad
        const user = await User.findById(req.userId).select('-password -confirmPassword');
        
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el perfil" });
    }
};

// 1. Solicitar recuperación (Envío de correo)
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "No existe un usuario con ese correo." });
        }

        // Generar un token único de 20 caracteres
        const token = crypto.randomBytes(20).toString('hex');

        // El token expira en 1 hora
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; 

        await user.save();

        // Configurar el transporte de correo (Ejemplo con Gmail)
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER, // Tu correo
                pass: process.env.EMAIL_PASS  // Tu contraseña de aplicación
            }
        });

        const resetUrl = `http://localhost:5173/reset-password/${token}`;

        const mailOptions = {
            to: user.email,
            from: 'Esportefy Team <tu-correo@gmail.com>',
            subject: 'Recuperación de Contraseña - Esportefy',
            text: `Estás recibiendo este correo porque solicitaste restablecer tu contraseña.\n\n` +
                  `Haz clic en el siguiente enlace o pégalo en tu navegador para completar el proceso:\n\n` +
                  `${resetUrl}\n\n` +
                  `Si no solicitaste esto, ignora el correo y tu contraseña seguirá igual.\n`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Correo de recuperación enviado." });

    } catch (error) {
        res.status(500).json({ message: "Error al enviar el correo", error: error.message });
    }
};

// 2. Restablecer contraseña (Guardar nueva pass)
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } // Verifica que no haya expirado
        });

        if (!user) {
            return res.status(400).json({ message: "El token es inválido o ha expirado." });
        }

        // Hashear la nueva contraseña
        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
        res.status(200).json({ message: "Contraseña actualizada correctamente." });

    } catch (error) {
        res.status(500).json({ message: "Error al actualizar la contraseña" });
    }
};