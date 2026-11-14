/** @format */

import httpClient from "@/shared/services/httpClient";

export const obrasSocialesApi = {
  listar: (params = {}) => httpClient.get("/obras-sociales", { params }),
  crear: (payload) => httpClient.post("/obras-sociales", payload),
  actualizar: (id, payload) => httpClient.put(`/obras-sociales/${id}`, payload),
  cambiarEstado: (id, activo) =>
    httpClient.put(`/obras-sociales/${id}`, { activo }),
  eliminarPermanente: (id) => httpClient.delete(`/obras-sociales/${id}`),
};

export default obrasSocialesApi;

