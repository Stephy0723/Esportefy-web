// ============================================
// COMPONENTE DE RUTA PROTEGIDA
// ============================================
// Verifica que exista un token de autenticación antes
// de renderizar las rutas privadas. Si no hay token,
// redirige al login.

import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
