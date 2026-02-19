// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { withCsrfHeaders } from '../utils/csrf';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const clearClientSession = () => {
        localStorage.removeItem('esportefyUser');
        localStorage.removeItem('user');
        sessionStorage.removeItem('esportefyUser');
        sessionStorage.removeItem('user');
        setUser(null);
    };

    const persistUser = (freshUserData) => {
        const prefersSession = Boolean(
            sessionStorage.getItem('esportefyUser') && !localStorage.getItem('esportefyUser')
        );

        if (prefersSession) {
            sessionStorage.setItem('esportefyUser', JSON.stringify(freshUserData));
            localStorage.removeItem('esportefyUser');
            return;
        }

        localStorage.setItem('esportefyUser', JSON.stringify(freshUserData));
        sessionStorage.removeItem('esportefyUser');
    };

    useEffect(() => {
        const checkAuth = async () => {
            const storedUser = localStorage.getItem('esportefyUser') || sessionStorage.getItem('esportefyUser');

            // 1. Carga inicial rápida desde LocalStorage para no mostrar la App vacía
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    localStorage.removeItem('esportefyUser');
                    sessionStorage.removeItem('esportefyUser');
                }
            }

            // 2. Siempre valida contra backend para confirmar que la cookie sigue vigente
            try {
                const response = await fetch('http://localhost:4000/api/auth/profile', {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const freshUserData = await response.json();
                    setUser(freshUserData);
                    persistUser(freshUserData);
                } else if (response.status === 401 || response.status === 403) {
                    clearClientSession();
                }
            } catch (error) {
                console.error("Error al sincronizar con la base de datos:", error);
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

    const logout = () => {
        fetch('http://localhost:4000/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
            headers: withCsrfHeaders()
        }).catch(() => {});

        clearClientSession();
        window.dispatchEvent(new Event('user-update'));
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
