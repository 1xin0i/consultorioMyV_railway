/** @format */

import httpClient from "@/shared/services/httpClient";

export const cobrosApi = {
  obtenerCobrosDeTurno: (idTurno) =>
    httpClient.get(`/cobros/${idTurno}/cobros`),
  registrarPago: (payload) =>
    httpClient.post("/cobros/registrar-pago", payload),
  crearCobroInformal: (payload) =>
    httpClient.post("/cobros/informal", payload),
  crearCobroInmediato: (payload) =>
    httpClient.post("/cobros/inmediato", payload),
  actualizar: (id, payload) => httpClient.put(`/cobros/${id}`, payload),
  eliminar: (id) => httpClient.patch(`/cobros/${id}/delete`),
};

export default cobrosApi;

