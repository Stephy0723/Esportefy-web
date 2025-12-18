// Backend/src/controllers/auth.controller.js
import User from "../models/User.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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