/** @format */

import httpClient from "@/shared/services/httpClient";

export const configuracionApi = {
  obtenerConfiguracion: () => httpClient.get("/configuracion-agenda"),
  actualizarConfiguracion: (payload) =>
    httpClient.put("/configuracion-agenda", payload),
  obtenerRestricciones: () => httpClient.get("/restricciones-agenda"),
  crearRestriccion: (payload) =>
    httpClient.post("/restricciones-agenda", payload),
  eliminarRestriccion: (id) =>
    httpClient.delete(`/restricciones-agenda/${id}`),
};

export default configuracionApi;

