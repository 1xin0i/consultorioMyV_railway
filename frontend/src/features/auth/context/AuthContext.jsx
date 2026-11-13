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
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [cargando, setCargando] = useState(Boolean(localStorage.getItem("token")));

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
        const datosUsuario = res.data?.data || res.data;
        setUsuario(datosUsuario);
        localStorage.setItem("usuario", JSON.stringify(datosUsuario));
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
    localStorage.setItem("usuario", JSON.stringify(payload.usuario));

    setToken(payload.token);
    setUsuario(payload.usuario);
    return payload.usuario;
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

