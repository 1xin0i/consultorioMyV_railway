/** @format */

import httpClient from "@/shared/services/httpClient";

export const practicasApi = {
  listar: (params = {}) => httpClient.get("/practicas", { params }),
  crear: (payload) => httpClient.post("/practicas", payload),
  actualizar: (id, payload) => httpClient.put(`/practicas/${id}`, payload),
  cambiarEstado: (id) => httpClient.patch(`/practicas/${id}/delete`),
};

export default practicasApi;

