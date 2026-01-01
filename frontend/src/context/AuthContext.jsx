// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('esportefyUser');

            // 1. Carga inicial rápida desde LocalStorage para no mostrar la App vacía
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    localStorage.removeItem('esportefyUser');
                }
            }

            // 2. Si hay un token, vamos a la Base de Datos por los datos reales (isOrganizer, etc)
            if (token) {
                try {
                    // AJUSTA ESTA URL A TU ENDPOINT DE PERFIL REAL
                    const response = await fetch('http://localhost:4000/api/auth/profile', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const freshUserData = await response.json();
                        // Actualizamos tanto el estado como el LocalStorage con los datos de la DB
                        setUser(freshUserData);
                        localStorage.setItem('esportefyUser', JSON.stringify(freshUserData));
                    } else if (response.status === 401) {
                        // Si el token expiró, cerramos sesión
                        logout();
                    }
                } catch (error) {
                    console.error("Error al sincronizar con la base de datos:", error);
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('esportefyUser', JSON.stringify(userData));
        localStorage.setItem('token', token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('esportefyUser');
        localStorage.removeItem('token');
        setUser(null);
        // Usar navegación de React Router es mejor, pero esto funciona como reset total
        window.location.href = '/'; 
    };

    return (
        // Se añade una validación para no retornar undefined si se usa fuera del Provider
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