// ============================================
// COMPONENTE DE RUTA PROTEGIDA
// ============================================
// Verifica que exista un token de autenticación antes
// de renderizar las rutas privadas. Si no hay token,
// redirige al login.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasClientSession } from '../../utils/authSession';

const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return null;
    }

    if (!user && !hasClientSession()) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
