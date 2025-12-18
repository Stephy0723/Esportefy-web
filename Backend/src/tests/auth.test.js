// Backend/tests/auth.test.js
import request from 'supertest';
import express from 'express';
import { register } from '../controllers/auth.controller.js';
import User from '../models/User.js';
import bcrypt from 'bcrypt';

// Mock de la base de datos para no ensuciarla
jest.mock('../models/User.js');
jest.mock('bcrypt');

const app = express();
app.use(express.json());
app.post('/api/register', register);

describe('Pruebas de Autenticación', () => {
    
    test('Debería registrar un usuario correctamente', async () => {
        // Datos completos que espera tu modelo
        const mockUserData = {
            fullName: "Test User",
            phone: 12345678,
            country: "Argentina",
            birthDate: "1995-01-01",
            selectedGames: ["League of Legends"],
            experience: ["Casual"],
            plataforms: ["PC"],
            lokingfor: ["Team"],
            userName: "testuser",
            email: "test@example.com",
            password: "password123",
            confirmPassword: "password123", // Requerido por tu lógica de controlador
            checkTerms: true,
            discord: "user#1234",
            city: "Buenos Aires",
            goals: ["Fun"],
            checkNews: true
        };

        // 1. Simular que el usuario NO existe aún
        User.findOne.mockResolvedValue(null);
        
        // 2. Simular el hash de bcrypt
        bcrypt.hash.mockResolvedValue('hashed_password');
        
        // 3. Simular que User.create devuelve el objeto exitoso (sin password)
        const { password, confirmPassword, ...userWithoutPassword } = mockUserData;
        User.create.mockResolvedValue({
            ...userWithoutPassword,
            _id: 'mock_id_123',
            toObject: jest.fn().mockReturnValue(userWithoutPassword) // Importante para el controlador
        });

        const response = await request(app)
            .post('/api/register')
            .send(mockUserData);

        // Verificaciones
        if (response.status !== 201) {
            console.log("Error Body:", response.body); // Esto te ayudará a ver qué falló si vuelve a fallar
        }

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('email', 'test@example.com');
        expect(response.body).not.toHaveProperty('password');
    });

    test('Debería fallar si las contraseñas no coinciden', async () => {
        const response = await request(app)
            .post('/api/register')
            .send({
                email: 'test@mail.com',
                password: '123',
                confirmPassword: '456'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Las contraseñas no coinciden');
    });
});