// Backend/src/controllers/auth.controller.js

import User from "../models/User.js";
import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import nodemailer from "nodemailer";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { NOTIF, pushNotification } from './notification.controller.js';

const isProduction = process.env.NODE_ENV === 'production';
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'auth_token';
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'csrf_token';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const baseCookieOptions = {
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
};

const getAuthCookieOptions = () => ({
    ...baseCookieOptions,
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_MS
});

const getCsrfCookieOptions = () => ({
    ...baseCookieOptions,
    httpOnly: false,
    maxAge: SESSION_MAX_AGE_MS
});

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
        const ext = path.extname(file.originalname);
        // Usamos req.userId (que viene del middleware verifyToken)
        cb(null, `${req.userId}-${Date.now()}${ext}`);
    }
});

export const upload = multer({ 
    storage,
   
});

const normalizeForCompare = (value = '') =>
    String(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isValidNonNegativeNumberString = (value = '') => /^\d+$/.test(String(value)) && Number(value) >= 0;
const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
const WEAK_PASSWORDS = new Set([
    '12345678',
    '123456789',
    '123123123',
    '11111111',
    'password',
    'password123',
    'qwerty123',
    'qwertyui',
    'admin123',
    'abc12345',
    'letmein',
    'esportefy',
    'contrasena',
    'contraseña'
].map(normalizeForCompare));

const hasNumericSequence = (value = '') => {
    const lower = String(value).toLowerCase();
    const patterns = [
        '0123', '1234', '2345', '3456', '4567', '5678', '6789', '7890',
        '9876', '8765', '7654', '6543', '5432', '4321', '3210'
    ];
    return patterns.some((p) => lower.includes(p));
};

const getPasswordPolicyError = (password, { username, userName, fullName, email } = {}) => {
    if (!password) return 'La contraseña es obligatoria';
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (/\s/.test(password)) return 'La contraseña no puede contener espacios';
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'La contraseña debe incluir letras y números';

    const personalTerms = new Set();
    const addTerm = (raw) => {
        const term = normalizeForCompare(raw);
        if (term.length >= 3) personalTerms.add(term);
    };

    addTerm(username || userName);
    String(fullName || '')
        .split(/\s+/)
        .filter(Boolean)
        .forEach(addTerm);
    String(email || '')
        .split('@')[0]
        ?.split(/[._-]+/)
        .filter(Boolean)
        .forEach(addTerm);

    const normalizedPassword = normalizeForCompare(password);
    const containsPersonalTerm = [...personalTerms].some((term) => normalizedPassword.includes(term));
    if (containsPersonalTerm) {
        return 'La contraseña no puede incluir tu nombre, usuario o partes del correo';
    }
    if (WEAK_PASSWORDS.has(normalizedPassword)) {
        return 'Esa contraseña es demasiado común o insegura';
    }
    if (/(.)\1{3,}/.test(password)) {
        return 'La contraseña no puede tener 4 caracteres repetidos seguidos';
    }
    if (hasNumericSequence(password)) {
        return 'La contraseña no puede contener secuencias numéricas (ej: 1234)';
    }

    return '';
};

export const checkPhoneAvailability = async (req, res) => {
    try {
        const rawPhone = String(req.query.phone || '').trim();
        const excludeUserId = String(req.query.excludeUserId || '').trim();

        if (!rawPhone) {
            return res.status(400).json({ available: false, message: 'El teléfono es obligatorio' });
        }

        if (!isValidNonNegativeNumberString(rawPhone)) {
            return res.status(400).json({ available: false, message: 'El teléfono debe contener solo números y no puede ser negativo' });
        }

        const query = { phone: rawPhone };
        if (excludeUserId) {
            if (!mongoose.Types.ObjectId.isValid(excludeUserId)) {
                return res.status(400).json({ available: false, message: 'ID de usuario inválido para exclusión' });
            }
            query._id = { $ne: excludeUserId };
        }

        const existingUser = await User.findOne(query).select('_id');
        return res.status(200).json({ available: !existingUser });
    } catch (error) {
        console.error('Error verificando teléfono:', error);
        return res.status(500).json({ available: false, message: 'Error verificando disponibilidad del teléfono' });
    }
};

export const register = async (req, res) => {
    try {
        const {
            email,
            password,
            confirmPassword,
            username,
            userName,
            fullName,
            phone,
            country,
            birthDate,
            selectedGames,
            checkTerms
        } = req.body;

        const normalizedUsername = String(username || userName || '').trim();
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const normalizedPhone = String(phone || '').trim();
        const normalizedFullName = String(fullName || '').trim();
        const normalizedCountry = String(country || '').trim();

        // 1. Validaciones básicas antes de tocar la DB
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Las contraseñas no coinciden' });
        }

        if (!normalizedFullName) {
            return res.status(400).json({ message: 'El nombre completo es obligatorio' });
        }
        if (!normalizedPhone) {
            return res.status(400).json({ message: 'El teléfono es obligatorio' });
        }
        if (!isValidNonNegativeNumberString(normalizedPhone)) {
            return res.status(400).json({ message: 'El teléfono debe contener solo números y no puede ser negativo' });
        }
        if (!normalizedCountry) {
            return res.status(400).json({ message: 'El país es obligatorio' });
        }
        if (!birthDate) {
            return res.status(400).json({ message: 'La fecha de nacimiento es obligatoria' });
        }
        const parsedBirthDate = new Date(birthDate);
        if (Number.isNaN(parsedBirthDate.getTime())) {
            return res.status(400).json({ message: 'La fecha de nacimiento no es válida' });
        }
        if (parsedBirthDate > new Date()) {
            return res.status(400).json({ message: 'La fecha de nacimiento no puede ser futura' });
        }
        if (!Array.isArray(selectedGames) || selectedGames.length === 0) {
            return res.status(400).json({ message: 'Debes seleccionar al menos un juego' });
        }
        if (!normalizedUsername) {
            return res.status(400).json({ message: 'El nombre de usuario es obligatorio' });
        }
        if (!normalizedEmail) {
            return res.status(400).json({ message: 'El correo es obligatorio' });
        }
        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({ message: 'El formato del correo no es válido' });
        }
        if (!password) {
            return res.status(400).json({ message: 'La contraseña es obligatoria' });
        }
        if (checkTerms !== true) {
            return res.status(400).json({ message: 'Debes aceptar los términos para continuar' });
        }

        const passwordPolicyError = getPasswordPolicyError(password, {
            username: normalizedUsername,
            fullName: normalizedFullName,
            email: normalizedEmail
        });
        if (passwordPolicyError) {
            return res.status(400).json({ message: passwordPolicyError });
        }

        const [emailExists, usernameExists, phoneExists] = await Promise.all([
            User.findOne({
                email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') }
            }).select('_id'),
            User.findOne({
                username: { $regex: new RegExp(`^${escapeRegex(normalizedUsername)}$`, 'i') }
            }).select('_id'),
            User.findOne({ phone: normalizedPhone }).select('_id')
        ]);

        if (emailExists) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }
        if (usernameExists) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
        }
        if (phoneExists) {
            return res.status(400).json({ message: 'El teléfono ya está registrado' });
        }

        // 2. Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Crear usuario con todos los campos del body
        // Usamos el spread operator (...) para capturar todos los campos de las Etapas 1-4
        const payload = { ...req.body };
        payload.fullName = normalizedFullName;
        payload.phone = normalizedPhone;
        payload.country = normalizedCountry;
        payload.birthDate = parsedBirthDate;
        payload.email = normalizedEmail;
        payload.username = normalizedUsername;

        const user = await User.create({
            ...payload,
            password: hashedPassword
        });

        // Push welcome notification
        await pushNotification(user._id, NOTIF.welcome(user.userName || user.fullName || 'Jugador'));

        // Opcional: No devolver la contraseña en la respuesta
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json(userResponse);

    } catch (error) {
        console.error("Error en Registro:", error);
        if (error?.code === 11000) {
            if (error?.keyPattern?.email) {
                return res.status(400).json({ message: 'El correo ya está registrado' });
            }
            if (error?.keyPattern?.username) {
                return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
            }
            if (error?.keyPattern?.phone) {
                return res.status(400).json({ message: 'El teléfono ya está registrado' });
            }
            return res.status(400).json({ message: 'Ya existe un usuario con esos datos' });
        }
        res.status(500).json({ 
            message: 'Error al registrar el usuario', 
            error: error.message 
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!normalizedEmail || !password) {
            return res.status(400).json({ message: 'Correo y contraseña son obligatorios' });
        }

        // 1. Buscar usuario
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') }
        });
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

        // Compatibilidad: cookie-based + token en respuesta para frontend legacy.
        const csrfToken = crypto.randomBytes(24).toString('hex');
        res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
        res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());

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

export const logout = async (req, res) => {
    try {
        res.clearCookie(AUTH_COOKIE_NAME, {
            ...baseCookieOptions,
            httpOnly: true
        });
        res.clearCookie(CSRF_COOKIE_NAME, {
            ...baseCookieOptions,
            httpOnly: false
        });
        return res.status(200).json({ message: 'Sesión cerrada correctamente' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al cerrar sesión' });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .populate('teams', 'name slogan category game teamGender teamCountry teamLevel teamLanguage logo maxMembers maxSubstitutes roster inviteCode captain')
            .populate('followers', '_id')
            .populate('following', '_id');
        
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

        const passwordPolicyError = getPasswordPolicyError(password, {
            username: user.username || user.userName,
            fullName: user.fullName,
            email: user.email
        });
        if (passwordPolicyError) {
            return res.status(400).json({ message: passwordPolicyError });
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

// 3. Actualizar perfil
export const updateProfile = async (req, res) => {
    try {
        // Copiamos los datos del body
        let updateData = { ...req.body };

        // 1. Manejo de la imagen (Multer)
        if (req.file) {
            updateData.avatar = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
        }

        // 2. Limpieza de Arrays de Texto (Juegos, Metas, etc.)
        const arrayFields = ['selectedGames', 'platforms', 'experience', 'goals', 'languages', 'preferredRoles'];
        arrayFields.forEach(field => {
            if (updateData[field]) {
                // Si viene de FormData llega como string, lo convertimos a array y limpiamos
                const arr = typeof updateData[field] === 'string' 
                    ? updateData[field].split(',') 
                    : updateData[field];
                updateData[field] = arr.map(s => s.trim()).filter(Boolean);
            }
        });
        // 2.5 Handle socialLinks (nested object from FormData)
        if (updateData['socialLinks.twitch'] !== undefined ||
            updateData['socialLinks.youtube'] !== undefined ||
            updateData['socialLinks.twitter'] !== undefined ||
            updateData['socialLinks.instagram'] !== undefined ||
            updateData['socialLinks.tiktok'] !== undefined) {
            updateData.socialLinks = {
                twitch: updateData['socialLinks.twitch'] || '',
                youtube: updateData['socialLinks.youtube'] || '',
                twitter: updateData['socialLinks.twitter'] || '',
                instagram: updateData['socialLinks.instagram'] || '',
                tiktok: updateData['socialLinks.tiktok'] || ''
            };
            delete updateData['socialLinks.twitch'];
            delete updateData['socialLinks.youtube'];
            delete updateData['socialLinks.twitter'];
            delete updateData['socialLinks.instagram'];
            delete updateData['socialLinks.tiktok'];
        }

        // 2.6 Boolean fields
        if (updateData.lookingForTeam !== undefined) {
            updateData.lookingForTeam = updateData.lookingForTeam === 'true' || updateData.lookingForTeam === true;
        }

        // 2.8 Validaciones de unicidad y formato en edición
        if (updateData.phone !== undefined) {
            const normalizedPhone = String(updateData.phone || '').trim();
            if (!normalizedPhone) {
                return res.status(400).json({ message: 'El teléfono es obligatorio' });
            }
            if (!isValidNonNegativeNumberString(normalizedPhone)) {
                return res.status(400).json({ message: 'El teléfono debe contener solo números y no puede ser negativo' });
            }
            const phoneExists = await User.findOne({
                phone: normalizedPhone,
                _id: { $ne: req.userId }
            }).select('_id');
            if (phoneExists) {
                return res.status(400).json({ message: 'El teléfono ya está registrado' });
            }
            updateData.phone = normalizedPhone;
        }

        if (updateData.username !== undefined) {
            const normalizedUsername = String(updateData.username || '').trim();
            if (!normalizedUsername) {
                return res.status(400).json({ message: 'El nombre de usuario es obligatorio' });
            }
            const usernameExists = await User.findOne({
                _id: { $ne: req.userId },
                username: { $regex: new RegExp(`^${escapeRegex(normalizedUsername)}$`, 'i') }
            }).select('_id');
            if (usernameExists) {
                return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
            }
            updateData.username = normalizedUsername;
        }

        // 2.7 Normalización de campos simples
        const allowedSimpleFields = ['status', 'selectedFrameId', 'selectedBgId', 'selectedTagId'];

        allowedSimpleFields.forEach(field => {
            if (updateData[field] === "" || updateData[field] === undefined) {
                delete updateData[field];
            }
        });

        // 2.6 Remove protected fields that should never be updated from this endpoint
        delete updateData.password;
        delete updateData.email;
        delete updateData._id;
        delete updateData.__v;
        delete updateData.isOrganizer;
        delete updateData.isAdmin;
        delete updateData.resetPasswordToken;
        delete updateData.resetPasswordExpires;
        delete updateData.followers;
        delete updateData.following;


        // 3. ¡SOLUCIÓN AL ERROR!: Limpieza del campo 'teams'
        if (updateData.teams) {
            // Si es un string vacío o un array con un string vacío
            if (updateData.teams === "" || (Array.isArray(updateData.teams) && (updateData.teams.length === 0 || updateData.teams[0] === ""))) {
                delete updateData.teams; // Eliminamos la propiedad para que no de error de casteo
            }
        }

        // 4. Actualizar usuario
        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json(updatedUser);

    } catch (error) {
        console.error("DETALLE DEL ERROR:", error);
        if (error?.code === 11000) {
            if (error?.keyPattern?.username) {
                return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
            }
            if (error?.keyPattern?.phone) {
                return res.status(400).json({ message: 'El teléfono ya está registrado' });
            }
            return res.status(400).json({ message: 'Ya existe un registro con esos datos' });
        }
        if (error?.name === 'ValidationError') {
            const firstError = Object.values(error.errors || {})[0];
            return res.status(400).json({ message: firstError?.message || 'Datos inválidos para actualizar perfil' });
        }
        res.status(500).json({ message: "Error al actualizar el perfil" });
    }
};

// ── Follow / Unfollow ──
export const followUser = async (req, res) => {
    try {
        const { targetId } = req.params;
        const myId = req.userId;
        if (targetId === myId) return res.status(400).json({ message: 'No puedes seguirte a ti mismo.' });

        const target = await User.findById(targetId);
        if (!target) return res.status(404).json({ message: 'Usuario no encontrado.' });

        const alreadyFollowing = target.followers.includes(myId);

        if (alreadyFollowing) {
            // Unfollow
            await User.findByIdAndUpdate(myId, { $pull: { following: targetId } });
            await User.findByIdAndUpdate(targetId, { $pull: { followers: myId } });
            return res.json({ followed: false });
        } else {
            // Follow
            await User.findByIdAndUpdate(myId, { $addToSet: { following: targetId } });
            await User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } });

            // Notify the target
            const me = await User.findById(myId).select('userName fullName');
            await pushNotification(targetId, NOTIF.newFollower(me?.userName || me?.fullName || 'Alguien'));

            return res.json({ followed: true });
        }
    } catch (err) {
        console.error('Error follow/unfollow:', err);
        res.status(500).json({ message: 'Error del servidor.' });
    }
};

// ── Get User Card (mini profile) ──
export const getUserCard = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.userId)
            .select('username fullName avatar status selectedFrameId selectedTagId country experience isOrganizer selectedGames connections.riot followers following teams')
            .populate('teams', 'name game logo');
        if (!targetUser) return res.status(404).json({ message: 'Usuario no encontrado.' });

        const myId = req.userId;
        const isFollowing = targetUser.followers.map(f => f.toString()).includes(myId);

        res.json({ ...targetUser.toObject(), isFollowing });
    } catch (err) {
        console.error('Error getUserCard:', err);
        res.status(500).json({ message: 'Error del servidor.' });
    }
};

// 4. Solicitar ser Organizador
export const applyOrganizer = async (req, res) => {
    const { fullName, idNumber, orgName,eventType, 
        website, experienceYears,maxSize, tools, description } = req.body;
    const file = req.file;
    const userId = req.userId; // Obtenido del middleware verifyToken

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        // Generamos las URLs para los botones (Ajusta el dominio según tu producción)
        const approveUrl = `http://localhost:4000/api/auth/verify-organizer/${userId}/approve`;
        const rejectUrl = `http://localhost:4000/api/auth/verify-organizer/${userId}/reject`;

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
                    
                    <div style="margin-top: 30px; text-align: center;">
                        <a href="${approveUrl}" style="background-color: #8EDB15; color: #000; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">APROBAR ORGANIZADOR</a>
                        
                        <a href="${rejectUrl}" style="background-color: #ff4444; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">RECHAZAR</a>
                    </div>
                    <p style="font-size: 12px; color: #666; margin-top: 20px; text-align: center;">Al aprobar, el usuario recibirá permisos de edición de torneos inmediatamente.</p>
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
    const { userId, action } = req.params;

    try {
        if (action === 'approve') {
            await User.findByIdAndUpdate(userId, { isOrganizer: true });
            return res.send(`
                <body style="background: #000; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
                    <div>
                        <h1 style="color: #8EDB15;">✔️ ¡Usuario Aprobado!</h1>
                        <p>El usuario ahora tiene rango de <b>Organizador</b> en Esportefy.</p>
                        <small>Ya puedes cerrar esta pestaña.</small>
                    </div>
                </body>
            `);
        } else {
            return res.send(`
                <body style="background: #000; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
                    <div>
                        <h1 style="color: #ff4444;">❌ Solicitud Rechazada</h1>
                        <p>No se han realizado cambios en la cuenta del usuario.</p>
                    </div>
                </body>
            `);
        }
    } catch (error) {
        res.status(500).send("Error procesando la acción.");
    }
};
