// Backend/src/controllers/auth.controller.js

import User from "../models/User.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import nodemailer from "nodemailer";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'auth_token';
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'csrf_token';
const AUTH_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const normalizeSameSite = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'strict' || normalized === 'lax' || normalized === 'none') {
        return normalized;
    }
    return '';
};

const envSecure = process.env.AUTH_COOKIE_SECURE
    ? process.env.AUTH_COOKIE_SECURE === 'true'
    : IS_PRODUCTION;
const envSameSite = normalizeSameSite(process.env.AUTH_COOKIE_SAME_SITE) || (envSecure ? 'none' : 'lax');
const AUTH_COOKIE_SECURE = envSameSite === 'none' ? true : envSecure;
const AUTH_COOKIE_SAME_SITE = envSameSite;

const buildAuthCookieOptions = () => {
    const options = {
        httpOnly: true,
        secure: AUTH_COOKIE_SECURE,
        sameSite: AUTH_COOKIE_SAME_SITE,
        maxAge: AUTH_TOKEN_TTL_MS,
        path: '/'
    };
    if (process.env.AUTH_COOKIE_DOMAIN) {
        options.domain = process.env.AUTH_COOKIE_DOMAIN;
    }
    return options;
};

const buildCsrfCookieOptions = () => {
    const options = {
        httpOnly: false,
        secure: AUTH_COOKIE_SECURE,
        sameSite: AUTH_COOKIE_SAME_SITE,
        maxAge: AUTH_TOKEN_TTL_MS,
        path: '/'
    };
    if (process.env.AUTH_COOKIE_DOMAIN) {
        options.domain = process.env.AUTH_COOKIE_DOMAIN;
    }
    return options;
};

const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/avatars/';

        // 1. PRIMERO: Verificar y crear la carpeta
        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log("Carpeta de avatares creada con éxito.");
            }
        } catch (err) {
            console.error("Error al crear la carpeta:", err);
        }

        // 2. SEGUNDO: Pasar el control a Multer
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        // Nombre único: ID-Timestamp.ext
        const ext = path.extname(file.originalname).toLowerCase();
        // Usamos req.userId (que viene del middleware verifyToken)
        cb(null, `${req.userId}-${Date.now()}${ext}`);
    }
});

export const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        const validMime = ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype);
        const validExt = ALLOWED_IMAGE_EXTENSIONS.has(ext);
        if (!validMime || !validExt) {
            return cb(new Error('Archivo inválido. Solo se permiten imágenes JPG, PNG o WEBP.'));
        }
        return cb(null, true);
    }
});

const normalizeStringArray = (value) => {
    if (Array.isArray(value)) {
        return value.map((v) => String(v || '').trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value.split(',').map((v) => v.trim()).filter(Boolean);
    }
    return [];
};

export const register = async (req, res) => {
    try {
        const payload = req.body || {};
        const username = String(payload.username || payload.userName || '').trim();
        const email = String(payload.email || '').trim().toLowerCase();
        const password = String(payload.password || '');
        const confirmPassword = String(payload.confirmPassword || '');
        const fullName = String(payload.fullName || '').trim();
        const phone = String(payload.phone || '').trim();
        const country = String(payload.country || '').trim();
        const birthDate = payload.birthDate;
        const checkTerms = payload.checkTerms === true;

        if (!fullName || !phone || !country || !birthDate || !username || !email || !password) {
            return res.status(400).json({ message: 'Faltan campos obligatorios para registro.' });
        }

        if (!checkTerms) {
            return res.status(400).json({ message: 'Debes aceptar términos y condiciones.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Correo inválido.' });
        }

        // 1. Validaciones básicas antes de tocar la DB
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Las contraseñas no coinciden' });
        }

        // 2. Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Crear usuario con whitelist explícita para evitar mass-assignment
        const user = await User.create({
            fullName,
            phone,
            gender: payload.gender,
            country,
            birthDate,
            selectedGames: normalizeStringArray(payload.selectedGames),
            experience: normalizeStringArray(payload.experience),
            platforms: normalizeStringArray(payload.platforms),
            goals: normalizeStringArray(payload.goals),
            username,
            email,
            password: hashedPassword,
            checkTerms: true
        });

        // Opcional: No devolver la contraseña en la respuesta
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json(userResponse);

    } catch (error) {
        console.error("Error en Registro:", error);
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!normalizedEmail || !password) {
            return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
        }

        // 1. Buscar usuario
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // 2. Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Configuración de autenticación incompleta' });
        }

        // 3. Generar Token
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        const csrfToken = generateCsrfToken();

        res.cookie(AUTH_COOKIE_NAME, token, buildAuthCookieOptions());
        res.cookie(CSRF_COOKIE_NAME, csrfToken, buildCsrfCookieOptions());

        res.status(200).json({ 
            session: true,
            user: {
                id: user._id,
                userName: user.username,
                username: user.username
            }
        });

    } catch (error) {
        console.error("Error en Login:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

export const logout = (req, res) => {
    const clearOptions = { ...buildAuthCookieOptions() };
    delete clearOptions.maxAge;
    clearOptions.expires = new Date(0);
    const clearCsrfOptions = { ...buildCsrfCookieOptions() };
    delete clearCsrfOptions.maxAge;
    clearCsrfOptions.expires = new Date(0);
    res.clearCookie(AUTH_COOKIE_NAME, clearOptions);
    res.clearCookie(CSRF_COOKIE_NAME, clearCsrfOptions);
    return res.status(200).json({ message: 'Sesión cerrada' });
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select('-password -resetPasswordToken -resetPasswordExpires -__v -connections.riot.pendingLink')
            .populate('teams', 'name avatar');
        
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.status(200).json(user);

    } catch (error) {
        console.error("Error en getProfile:", error);
        res.status(500).json({ message: "Error al obtener el perfil" });
    }
};

// 1. Solicitar recuperación (Envío de correo)
export const forgotPassword = async (req, res) => {
    try {
        const normalizedEmail = String(req.body?.email || '').trim().toLowerCase();
        const genericResponse = { message: "Si el correo existe, enviaremos instrucciones para recuperar la cuenta." };

        if (!normalizedEmail) {
            return res.status(200).json(genericResponse);
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(200).json(genericResponse);
        }

        // Código de 6 dígitos criptográficamente más robusto
        const token = crypto.randomInt(100000, 1000000).toString();
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Guardamos hash (nunca el código en texto plano)
        user.resetPasswordToken = tokenHash;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutos
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
                    Hola, <strong>${user.fullName}</strong>. Usa el siguiente código para restablecer tu contraseña. Este código expirará en 15 minutos.
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
        return res.status(200).json(genericResponse);

    } catch (error) {
        return res.status(500).json({ message: "Error al procesar la recuperación de contraseña" });
    }
};

// 2. Restablecer contraseña (Guardar nueva pass)
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const plainToken = String(token || '').trim();

        if (!plainToken || !password) {
            return res.status(400).json({ message: "Solicitud inválida." });
        }

        if (String(password).length < 8) {
            return res.status(400).json({ message: "La contraseña debe tener al menos 8 caracteres." });
        }

        const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: tokenHash,
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
        return res.status(500).json({ message: "Error al actualizar la contraseña" });
    }
};

// 3. Actualizar perfil
export const updateProfile = async (req, res) => {
    try {
        // Solo permitimos actualizar campos seguros del perfil
        const allowedFields = [
            'avatar', 'bio', 'fullName', 'phone', 'gender', 'country', 'birthDate',
            'selectedGames', 'platforms', 'experience', 'goals',
            'username', 'email', 'status', 'selectedFrameId', 'selectedBgId', 'selectedTagId'
        ];
        let updateData = {};
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // 1. Manejo de la imagen (Multer)
        if (req.file) {
            updateData.avatar = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
        }

        // 2. Limpieza de Arrays de Texto (Juegos, Metas, etc.)
        const arrayFields = ['selectedGames', 'platforms', 'experience', 'goals'];
        arrayFields.forEach(field => {
            if (updateData[field]) {
                // Si viene de FormData llega como string, lo convertimos a array y limpiamos
                const arr = typeof updateData[field] === 'string' 
                    ? updateData[field].split(',') 
                    : updateData[field];
                updateData[field] = arr.map(s => s.trim()).filter(Boolean);
            }
        });
        // 2.5 Normalización de campos simples
        const allowedSimpleFields = ['status', 'selectedFrameId', 'selectedBgId'];

        allowedSimpleFields.forEach(field => {
            if (updateData[field] === "" || updateData[field] === undefined) {
                delete updateData[field];
            }
        });


        // 3. No permitir arrays vacíos inválidos
        if (updateData.selectedGames && updateData.selectedGames.length === 0) delete updateData.selectedGames;

        // 4. Actualizar usuario
        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires -__v -connections.riot.pendingLink');

        res.status(200).json(updatedUser);

    } catch (error) {
        console.error("DETALLE DEL ERROR:", error);
        res.status(500).json({ message: "Error al actualizar el perfil" });
    }
};

// 4. Solicitar ser Organizador
export const applyOrganizer = async (req, res) => {
    const { fullName, idNumber, orgName,eventType, 
        website, experienceYears,maxSize, tools, description } = req.body;
    const file = req.file;

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        const mailOptions = {
            from: `"Esportefy Admin" <${process.env.EMAIL_USER}>`,
            to: 'steliantsoft@gmail.com',
            subject: `🚨 Solicitud de Organizador: ${orgName}`,
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 30px; border: 1px solid #8EDB15; border-radius: 10px;">
                    <h2 style="color: #8EDB15; text-align: center;">Nueva Solicitud de Verificación</h2>
                    <hr style="border: 0.5px solid #333;" />
                    <p><strong>Candidato:</strong> ${fullName}</p>
                    <p><strong>Identificación:</strong> ${idNumber}</p>
                    <p><strong>Organización:</strong> ${orgName}</p>
                    <p><strong>Tipo de Eventos:</strong> ${eventType}</p>
                    <p><strong>Sitio Web:</strong> ${website || 'N/A'}</p>
                    <p><strong>Experiencia:</strong> ${experienceYears}</p>
                    <p><strong>Tamaño de Torneos:</strong> ${maxSize}</p>
                    <p><strong>Herramientas:</strong> ${tools}</p>
                    <p style="background: #111; padding: 15px; border-radius: 5px;">${description}</p>
                    <p style="font-size: 12px; color: #666; margin-top: 20px; text-align: center;">
                        Revisar y aprobar desde el panel administrativo autenticado.
                    </p>
                </div>
            `,
            attachments: file ? [{ filename: file.originalname, path: file.path }] : []
        };

        await transporter.sendMail(mailOptions);
        if (file) fs.unlink(file.path, () => {});

        res.status(200).json({ message: "Solicitud enviada." });
    } catch (error) {
        if (file) fs.unlink(file.path, () => {});
        res.status(500).json({ message: "Error en el servidor." });
    }
};

// 5. Verificar solicitud de Organizador
export const verifyOrganizerAction = async (req, res) => {
    try {
        const { userId } = req.params;
        const { action = 'approve' } = req.body || {};

        const adminUser = await User.findById(req.userId).select('isAdmin');
        if (!adminUser?.isAdmin) {
            return res.status(403).json({ message: 'No autorizado. Solo administradores pueden realizar esta acción.' });
        }

        if (action !== 'approve') {
            return res.status(400).json({ message: 'Acción inválida. Solo se permite approve.' });
        }

        const target = await User.findByIdAndUpdate(
            userId,
            { isOrganizer: true },
            { new: true }
        ).select('_id isOrganizer');

        if (!target) {
            return res.status(404).json({ message: 'Usuario objetivo no encontrado.' });
        }

        return res.status(200).json({
            message: 'Usuario aprobado como organizador.',
            user: target
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error procesando la acción.' });
    }
};
