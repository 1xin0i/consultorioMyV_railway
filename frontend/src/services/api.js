/** @format */

import axios from "axios";

// En desarrollo, Vite redirige "/api" al backend (ver vite.config.js).
// Para producción u otro host, se puede configurar VITE_API_URL en .env.
const API_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// ─── INTERCEPTOR DE PETICIÓN (INYECTAR ACCESS TOKEN) ────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── CONTROL DE COLA DE REFRESCO CONMUTATIVO ─────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Limpia el estado de autenticación local y redirige al login si no estamos en él.
 */
export const limpiarSesion = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("usuario");

  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

// ─── INTERCEPTOR DE RESPUESTA (REFRESCO SILENCIOSO DE TOKEN EN 401) ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) return Promise.reject(error);

    const esRutaAuth =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh-token") ||
      originalRequest.url?.includes("/auth/refreshToken") ||
      originalRequest.url?.includes("/usuarios/login");

    if (error.response?.status === 401 && !originalRequest._retry && !esRutaAuth) {
      if (isRefreshing) {
        // Encolar peticiones concurrentes mientras se completa el refresco activo
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((nuevoToken) => {
            originalRequest.headers.Authorization = `Bearer ${nuevoToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefreshToken =
        localStorage.getItem("refreshToken") || localStorage.getItem("token");

      if (!storedRefreshToken) {
        isRefreshing = false;
        limpiarSesion();
        return Promise.reject(error);
      }

      try {
        // Renovar token mediante petición directa
        const { data } = await axios.post(
          `${API_URL}/auth/refresh-token`,
          { refreshToken: storedRefreshToken },
          {
            headers: {
              Authorization: `Bearer ${storedRefreshToken}`,
            },
          }
        );

        const nuevoToken = data.token;
        const nuevoRefreshToken = data.refreshToken || storedRefreshToken;

        localStorage.setItem("token", nuevoToken);
        if (nuevoRefreshToken) {
          localStorage.setItem("refreshToken", nuevoRefreshToken);
        }

        processQueue(null, nuevoToken);

        originalRequest.headers.Authorization = `Bearer ${nuevoToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        limpiarSesion();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
