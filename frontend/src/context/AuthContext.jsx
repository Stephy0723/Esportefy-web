// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Creamos el contexto (la "nube" de datos)
const AuthContext = createContext();

// 2. Creamos el Proveedor (el componente que envuelve la app)
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Al cargar la página, verificamos si ya hay un usuario guardado
        const storedUser = localStorage.getItem('esportefyUser');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Error al leer datos del usuario", error);
                localStorage.removeItem('esportefyUser'); // Limpiamos si está corrupto
            }
        }
        setLoading(false);
    }, []);

    // Función para Iniciar Sesión (Guarda los datos de MongoDB)
    const login = (userData, token) => {
        localStorage.setItem('esportefyUser', JSON.stringify(userData));
        localStorage.setItem('token', token);
        setUser(userData);
    };

    // Función para Cerrar Sesión
    const logout = () => {
        localStorage.removeItem('esportefyUser');
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/'; // Redirige al home
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. Hook personalizado para usar esto fácil en cualquier lado
export const useAuth = () => useContext(AuthContext);