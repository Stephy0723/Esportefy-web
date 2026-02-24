import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Los 4 temas disponibles
export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  AMOLED: 'amoled',
  GRAY: 'gray',
};

const VALID_THEMES = Object.values(THEMES);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('esportefyTheme');

    // Migrar el valor viejo (true/false) al nuevo sistema
    if (saved === 'true') return THEMES.DARK;
    if (saved === 'false') return THEMES.LIGHT;

    // Si ya es un string válido, úsalo
    if (VALID_THEMES.includes(saved)) return saved;

    // Primera visita → oscuro por defecto
    return THEMES.DARK;
  });

  // Aplicar clase al body y guardar en localStorage
  useEffect(() => {
    const body = document.body;

    // Limpiar todas las clases de tema
    VALID_THEMES.forEach((t) => body.classList.remove(`theme-${t}`));

    // Clase legacy "dark" para compatibilidad con componentes que la usan
    body.classList.remove('dark');
    if (theme === THEMES.DARK || theme === THEMES.AMOLED) {
      body.classList.add('dark');
    }

    // Clase específica del tema activo
    body.classList.add(`theme-${theme}`);

    localStorage.setItem('esportefyTheme', theme);
  }, [theme]);

  const setTheme = (newTheme) => {
    if (VALID_THEMES.includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  // Compatibilidad con código existente que usa isDarkMode / toggleTheme
  const isDarkMode = theme === THEMES.DARK || theme === THEMES.AMOLED;
  const toggleTheme = () => {
    setThemeState((prev) => (prev === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDarkMode, toggleTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};