/** @format */

import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const httpClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Claves de almacenamiento de sesión
const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const USUARIO_KEY = "usuario";

export const limpiarSesion = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
};

// Cola de peticiones en espera mientras se renueva el token
let refrescandoToken = false;
let colaEspera = [];

const procesarCola = (error, nuevoToken = null) => {
  colaEspera.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(nuevoToken);
    }
  });
  colaEspera = [];
};

// Interceptor de petición: adjunta el JWT a cada request
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor de respuesta: intenta renovar con refreshToken ante un 401
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const esRutaAuthPublica =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh") ||
      originalRequest?.url?.includes("/auth/recuperar-password") ||
      originalRequest?.url?.includes("/auth/restablecer-password");

    if (
      error.response?.status === 401 &&
      !esRutaAuthPublica &&
      !originalRequest._retry
    ) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      // Si no hay refresh token disponible, cerrar sesión inmediatamente
      if (!refreshToken) {
        limpiarSesion();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // Si ya hay un refresh en curso, encolar la petición actual
      if (refrescandoToken) {
        return new Promise((resolve, reject) => {
          colaEspera.push({ resolve, reject });
        })
          .then((nuevoToken) => {
            originalRequest.headers.Authorization = `Bearer ${nuevoToken}`;
            return httpClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      refrescandoToken = true;

      try {
        const respuesta = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
        });

        const payload = respuesta.data?.data || respuesta.data;
        const nuevoToken = payload.token;
        const nuevoRefreshToken = payload.refreshToken;

        localStorage.setItem(ACCESS_TOKEN_KEY, nuevoToken);
        if (nuevoRefreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, nuevoRefreshToken);
        }
        if (payload.usuario) {
          localStorage.setItem(USUARIO_KEY, JSON.stringify(payload.usuario));
        }

        httpClient.defaults.headers.common.Authorization = `Bearer ${nuevoToken}`;
        procesarCola(null, nuevoToken);

        originalRequest.headers.Authorization = `Bearer ${nuevoToken}`;
        return httpClient(originalRequest);
      } catch (refreshError) {
        procesarCola(refreshError, null);
        limpiarSesion();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        refrescandoToken = false;
      }
    }

    return Promise.reject(error);
  },
);

export { httpClient };
export default httpClient;

