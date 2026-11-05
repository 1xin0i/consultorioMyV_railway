/** @format */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api, { limpiarSesion } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const stored = localStorage.getItem("usuario");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  const [cargando, setCargando] = useState(true);

  // Estados de modales globales de usuario
  const [modalLogoutAbierto, setModalLogoutAbierto] = useState(false);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);

  // ─── VERIFICACIÓN INICIAL DE SESIÓN AL CARGAR LA APP ────────────────
  useEffect(() => {
    const verificarSesion = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setCargando(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        if (data?.usuario) {
          setUsuario(data.usuario);
          localStorage.setItem("usuario", JSON.stringify(data.usuario));
        }
      } catch (err) {
        console.warn("Sesión caducada o no válida:", err?.message);
        setUsuario(null);
        setToken(null);
      } finally {
        setCargando(false);
      }
    };

    verificarSesion();
  }, []);

  // ─── INICIAR SESIÓN (LLAMADA DIRECTA CON API.POST) ───────────────────
  const login = useCallback(async (identificador, password) => {
    const { data } = await api.post("/auth/login", {
      identificador,
      usuario: identificador,
      nombre_usuario: identificador,
      password,
      contraseña: password,
    });

    if (data.token) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
    }
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }
    if (data.usuario) {
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      setUsuario(data.usuario);
    }

    return data;
  }, []);

  // ─── CERRAR SESIÓN ────────────────────────────────────────────────
  const logout = useCallback(() => {
    setUsuario(null);
    setToken(null);
    setModalLogoutAbierto(false);
    limpiarSesion();
  }, []);

  const solicitarLogout = useCallback(() => {
    setModalLogoutAbierto(true);
  }, []);

  const cancelarLogout = useCallback(() => {
    setModalLogoutAbierto(false);
  }, []);

  // ─── CAMBIAR CONTRASEÑA ───────────────────────────────────────────
  const abrirModalPassword = useCallback(() => {
    setModalPasswordAbierto(true);
  }, []);

  const cerrarModalPassword = useCallback(() => {
    setModalPasswordAbierto(false);
  }, []);

  const cambiarPassword = useCallback(async (passwordActual, nuevaPassword) => {
    const { data } = await api.put("/auth/cambiar-password", {
      password_actual: passwordActual,
      nueva_password: nuevaPassword,
    });
    return data;
  }, []);

  const value = {
    usuario,
    token,
    cargando,
    isAuthenticated: Boolean(token && usuario),
    login,
    logout,

    // Modal de confirmación de Logout
    modalLogoutAbierto,
    solicitarLogout,
    cancelarLogout,

    // Modal de Cambio de Contraseña
    modalPasswordAbierto,
    abrirModalPassword,
    cerrarModalPassword,
    cambiarPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }
  return context;
}

export default AuthContext;
