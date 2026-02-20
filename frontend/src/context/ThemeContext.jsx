import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();
const THEME_STORAGE_KEY = 'esportefyTheme';

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        return JSON.parse(savedTheme);
      }
    } catch (_) {
      // Si el valor almacenado está corrupto, cae al valor por defecto.
    }
    return true;
  });

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (isDarkMode) {
      html.classList.add('dark');
      body.classList.add('dark');
    } else {
      html.classList.remove('dark');
      body.classList.remove('dark');
    }

    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const setThemeMode = (mode) => {
    setIsDarkMode(Boolean(mode));
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
