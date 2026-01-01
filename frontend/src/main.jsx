import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './index.scss'

import { ThemeProvider } from './context/ThemeContext'
// 1. IMPORTA EL PROVEEDOR DE AUTENTICACIÓN
import { AuthProvider } from './context/AuthContext' 

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