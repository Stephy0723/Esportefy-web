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
       // Generar un código numérico de 6 dígitos
        const token = Math.floor(100000 + Math.random() * 900000).toString();

        // El resto sigue igual (guardar en resetPasswordToken y resetPasswordExpires)
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

        const mailOptions = {
    to: user.email,
    from: 'Esportefy Team <no-reply@esportefy.com>',
    subject: `${token} es tu código de recuperación`,
    html: `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 50px 0;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #eeeeee; overflow: hidden;">
            
            <div style="padding: 30px; text-align: center;">
                <h1 style="color: #000; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">
                    ESPORTEFY<span style="color: #00ff00;">.</span>
                </h1>
                <p style="color: #666; font-size: 14px; margin-top: 10px;">RECUPERACIÓN DE CUENTA</p>
            </div>

            <div style="padding: 0 40px 40px 40px; text-align: center;">
                <p style="color: #333; font-size: 16px; line-height: 1.5;">
                    Hola, <strong>${user.fullName}</strong>. Usa el siguiente código para restablecer tu contraseña. Este código expirará en 60 minutos.
                </p>

                <div style="margin: 30px 0; background-color: #f4f4f4; border-radius: 8px; padding: 20px; border: 1px dashed #cccccc;">
                    <span style="font-family: monospace; font-size: 36px; font-weight: bold; color: #000; letter-spacing: 5px;">
                        ${token}
                    </span>
                </div>

                <p style="color: #999; font-size: 12px;">
                    Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Alguien pudo haber escrito tu dirección por error.
                </p>
            </div>

            <div style="background-color: #000; padding: 15px; text-align: center;">
                <p style="color: #fff; font-size: 11px; margin: 0; opacity: 0.7;">
                    © ${new Date().getFullYear()} Esportefy Platform. Todos los derechos reservados.
                </p>
            </div>
        </div>
    </div>
    `
}

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