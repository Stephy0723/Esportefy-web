import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios';
import './index.css'
import App from './App.jsx'
import './index.scss'
import { getCsrfToken, CSRF_HEADER_NAME } from './utils/csrf';

import { ThemeProvider } from './context/ThemeContext'
// 1. IMPORTA EL PROVEEDOR DE AUTENTICACIÓN
import { AuthProvider } from './context/AuthContext' 

axios.defaults.withCredentials = true;

axios.interceptors.request.use((config) => {
  // Auth is handled via HttpOnly cookies — remove Bearer headers
  // that would trigger CORS preflight failures
  if (config.headers) {
    delete config.headers['Authorization'];
    delete config.headers['authorization'];
  }

  const method = String(config.method || 'get').toLowerCase();
  const isMutating = ['post', 'put', 'patch', 'delete'].includes(method);
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
