/** @format */

import { createContext, useContext, useEffect, useState, useMemo } from "react";

const THEME_STORAGE_KEY = "myv_theme";

const ThemeContext = createContext({
  theme: "light",
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const guardado = localStorage.getItem(THEME_STORAGE_KEY);
      if (guardado === "dark" || guardado === "light") {
        return guardado;
      }
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        return "dark";
      }
    } catch {
      // Ignorar fallos de acceso a localStorage o matchMedia
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Error silencioso en caso de storage deshabilitado
    }

    // Actualizar color de la barra del navegador (PWA / móvil)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        theme === "dark" ? "#162a35" : "#2eb086",
      );
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (nuevoTema) => {
    if (nuevoTema === "dark" || nuevoTema === "light") {
      setThemeState(nuevoTema);
    }
  };

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme,
      setTheme,
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe utilizarse dentro de un ThemeProvider");
  }
  return context;
};

export default ThemeContext;
