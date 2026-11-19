/** @format */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { limpiarSesion } from "@/shared/services/httpClient";
import authApi from "../services/auth.api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const guardado = localStorage.getItem("usuario");
      if (!guardado) return null;
      const parsed = JSON.parse(guardado);
      return parsed.usuario || parsed;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [cargando, setCargando] = useState(
    Boolean(localStorage.getItem("token")),
  );

  // Verificar sesión activa al montar la app
  useEffect(() => {
    const tokenActual = localStorage.getItem("token");
    if (!tokenActual) {
      setCargando(false);
      return;
    }

    authApi
      .getMe()
      .then((res) => {
        const payload = res.data?.data || res.data;
        const usuarioData = payload.usuario || payload;
        setUsuario(usuarioData);
        localStorage.setItem("usuario", JSON.stringify(usuarioData));
      })
      .catch(() => {
        limpiarSesion();
        setToken(null);
        setUsuario(null);
      })
      .finally(() => {
        setCargando(false);
      });
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    const payload = res.data?.data || res.data;

    localStorage.setItem("token", payload.token);
    if (payload.refreshToken) {
      localStorage.setItem("refreshToken", payload.refreshToken);
    }
    const usuarioData = payload.usuario || payload;
    localStorage.setItem("usuario", JSON.stringify(usuarioData));

    // Inicializar estado de PIN desbloqueado y timestamp de actividad
    sessionStorage.setItem("pin_unlocked", "true");
    localStorage.setItem("pin_last_activity", String(Date.now()));
    localStorage.removeItem("pin_bloqueado_hasta");
    localStorage.removeItem("pin_intentos_fallidos");

    setToken(payload.token);
    setUsuario(usuarioData);
    return usuarioData;
  }, []);

  const cambiarPassword = useCallback(
    async (passwordActual, passwordNueva, confirmarPassword) => {
      const res = await authApi.cambiarPassword({
        passwordActual,
        passwordNueva,
        confirmarPassword,
      });
      return res.data;
    },
    [],
  );

  const logout = useCallback(() => {
    limpiarSesion();
    sessionStorage.removeItem("pin_unlocked");
    localStorage.removeItem("pin_last_activity");
    localStorage.removeItem("pin_bloqueado_hasta");
    localStorage.removeItem("pin_intentos_fallidos");
    setToken(null);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        estaAutenticado: Boolean(token && usuario),
        cargando,
        login,
        logout,
        cambiarPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe utilizarse dentro de un AuthProvider");
  }
  return ctx;
}

export default AuthContext;
