import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // 1. AQUÍ ESTÁ LA SOLUCIÓN:
  // En lugar de poner "useState(true)", usamos una función para leer la memoria
  // ANTES de que la página decida qué color pintar.
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Preguntamos al navegador: "¿Hay un tema guardado?"
    const savedTheme = localStorage.getItem('esportefyTheme');
    
    // Si existe (es "true" o "false"), lo usamos.
    if (savedTheme !== null) {
      return JSON.parse(savedTheme);
    }
    
    // Si es la primera vez que entra, por defecto ponemos Oscuro (true)
    return true; 
  });

  // 2. Este efecto aplica la clase CSS y guarda la elección cada vez que cambias
  useEffect(() => {
    const body = document.body;
    
    if (isDarkMode) {
      body.classList.add('dark'); // Activa las variables oscuras de tu App.css
    } else {
      body.classList.remove('dark'); // Activa las variables claras (:root) de tu App.css
    }

    // Guardamos en la "caja fuerte" del navegador
    localStorage.setItem('esportefyTheme', JSON.stringify(isDarkMode));
    
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};