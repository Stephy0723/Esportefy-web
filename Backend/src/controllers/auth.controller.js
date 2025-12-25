import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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
export const getProfile = async (req, res) => {
    try {
        // 1. Buscamos al usuario usando el ID del middleware de auth
        const user = await User.findById(req.userId)
            // 2. IMPORTANTE: Reemplaza los IDs de equipos por los datos reales del modelo Team
            .populate({
                path: 'teams',
                select: 'name logo game description' // Solo traemos lo necesario para el perfil
            })
            // 3. Excluimos datos sensibles
            .select('-password -confirmPassword');
        
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // 4. Enviamos el objeto completo (ahora user.teams tendrá objetos, no solo IDs)
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
        res.status(500).json({ message: "Error al actualizar el perfil" });
    }
};

// 5. Solicitar ser Organizador
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

// 6. Verificar solicitud de Organizador
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
