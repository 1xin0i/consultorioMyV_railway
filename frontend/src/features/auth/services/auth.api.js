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
};

export default authApi;

