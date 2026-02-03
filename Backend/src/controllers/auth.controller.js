// Backend/src/controllers/auth.controller.js

import User from "../models/User.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import nodemailer from "nodemailer";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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
};

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
        const user = await User.findById(req.userId).populate('teams', 'name avatar'); // Poblar solo nombre y avatar de los equipos
        
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
        // Solo permitimos actualizar campos seguros del perfil
        const allowedFields = [
            'avatar', 'bio', 'fullName', 'phone', 'gender', 'country', 'birthDate',
            'selectedGames', 'platforms', 'experience', 'goals',
            'username', 'email', 'status', 'selectedFrameId', 'selectedBgId'
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
        ).select('-password');

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
