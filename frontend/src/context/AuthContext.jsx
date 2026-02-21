// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const storedUser = localStorage.getItem('esportefyUser');

            // 1. Carga inicial rápida desde LocalStorage para no mostrar la App vacía
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    localStorage.removeItem('esportefyUser');
                }
            }

            // 2. Sincronizar con la BD usando cookies (HttpOnly auth_token)
            try {
                const response = await axios.get(`${API_URL}/api/auth/profile`);
                const freshUserData = response.data;
                setUser(freshUserData);
                localStorage.setItem('esportefyUser', JSON.stringify(freshUserData));
            } catch (error) {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    // Cookie expirada o no existe — limpiar sesión sin redirect loop
                    localStorage.removeItem('esportefyUser');
                    setUser(null);
                } else {
                    // Error de red — mantener datos cacheados si existen
                    console.error("Error al sincronizar con la base de datos:", error.message);
                }
            }

            setLoading(false);
        };

        checkAuth();

        const handleUserUpdate = () => {
            checkAuth();
        };

        window.addEventListener('user-update', handleUserUpdate);

        return () => {
            window.removeEventListener('user-update', handleUserUpdate);
        };
    }, []);

    const login = (userData) => {
        localStorage.setItem('esportefyUser', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = async () => {
        try {
            await axios.post(`${API_URL}/api/auth/logout`);
        } catch (_) { /* ignore */ }
        localStorage.removeItem('esportefyUser');
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/'; 
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        // Retornamos un objeto vacío por defecto para evitar errores de desestructuración
        return { user: null, loading: true };
    }
    return context;
};
