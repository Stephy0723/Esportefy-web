import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios';
import './index.css'
import App from './App.jsx'
import './index.scss'
import { getCsrfToken, CSRF_HEADER_NAME } from './utils/csrf';
import { clearAuthSession, getAuthToken, isPublicAuthEndpoint } from './utils/authSession';

import { ThemeProvider } from './context/ThemeContext'
// 1. IMPORTA EL PROVEEDOR DE AUTENTICACIÓN
import { AuthProvider } from './context/AuthContext' 

axios.defaults.withCredentials = true;

let authRedirectInProgress = false;

const shouldHandleAuthFailure = (error) => {
  const status = Number(error?.response?.status || 0);
  const requestUrl = String(error?.config?.url || '');
  const message = String(error?.response?.data?.message || '').toLowerCase();

  if (isPublicAuthEndpoint(requestUrl)) return false;
  if (status === 401) return true;
  if (status !== 403) return false;

  if (message.includes('no tienes permisos') || message.includes('permiso')) {
    return false;
  }

  return (
    message.includes('token')
    || message.includes('sesion')
    || message.includes('sesión')
    || message.includes('acceso denegado')
    || message.includes('csrf')
  );
};

axios.interceptors.request.use((config) => {
  const method = String(config.method || 'get').toLowerCase();
  const isMutating = ['post', 'put', 'patch', 'delete'].includes(method);
  const token = getAuthToken();

  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization && !config.headers.authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  if (isMutating) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers = config.headers || {};
      config.headers[CSRF_HEADER_NAME] = csrfToken;
    }
  }
  config.withCredentials = true;
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (shouldHandleAuthFailure(error)) {
      clearAuthSession();
      window.dispatchEvent(new Event('user-update'));

      if (!authRedirectInProgress) {
        authRedirectInProgress = true;
        const currentPath = window.location.pathname || '/';
        const isAlreadyPublic = (
          currentPath === '/'
          || currentPath === '/login'
          || currentPath === '/register'
          || currentPath === '/reset-password'
          || currentPath.startsWith('/legal/')
        );

        if (!isAlreadyPublic) {
          const redirectTarget = encodeURIComponent(`${currentPath}${window.location.search || ''}`);
          window.location.assign(`/login?next=${redirectTarget}`);
        } else {
          authRedirectInProgress = false;
        }
      }
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. ENVUELVE CON AMBOS PROVEEDORES */}
    <AuthProvider> 
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
)
