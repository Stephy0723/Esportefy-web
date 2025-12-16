import User from "../models/User.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
    const {email, password} = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        email,
        password: hashedPassword
    });

    res.status(201).json(user);

}

export const login = async (req, res) => {
    const {email, password} = req.body;

    const user = await User.findOne({email});
    if(!user) return res.status(404).json({messege: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) return res.status(401).json({messege: 'Credenciales invalidas' });

    const token = jwt.sign({ id: user._id}, process.env.JWT_SECRET);

    res.json({ token });
};