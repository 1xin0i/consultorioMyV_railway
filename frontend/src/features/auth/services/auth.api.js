/** @format */

import httpClient from "@/shared/services/httpClient";

export const authApi = {
  getMe: () => httpClient.get("/auth/me"),
  login: (credenciales) => httpClient.post("/auth/login", credenciales),
  cambiarPassword: (datos) => httpClient.put("/auth/cambiar-password", datos),
  recuperarPassword: (datos) =>
    httpClient.post("/auth/recuperar-password", datos),
  restablecerPassword: (datos) =>
    httpClient.post("/auth/restablecer-password", datos),
  validarPin: (pin) => httpClient.post("/auth/validar-pin", { pin }),
  verificarPassword: (datos) =>
    httpClient.post("/auth/verificar-password", datos),
  recuperarPin: (datos) => httpClient.post("/auth/recuperar-pin", datos),
  cambiarPin: (datos) => httpClient.post("/auth/cambiar-pin", datos),
};

export default authApi;

