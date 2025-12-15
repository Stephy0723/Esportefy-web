import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './index.scss'

// 1. IMPORTAMOS EL PROVEEDOR DEL TEMA
// (Asegúrate de que la ruta sea correcta según donde creaste el archivo)
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. ENVOLVEMOS LA APP CON EL PROVEEDOR */}
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)