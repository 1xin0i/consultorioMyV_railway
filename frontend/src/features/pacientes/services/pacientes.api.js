/** @format */

import httpClient from "@/shared/services/httpClient";

export const pacientesApi = {
  listar: (params = {}) => httpClient.get("/pacientes", { params }),
  obtenerPorId: (id) => httpClient.get(`/pacientes/${id}`),
  crear: (payload) => httpClient.post("/pacientes", payload),
  actualizar: (id, payload) => httpClient.put(`/pacientes/${id}`, payload),
  cambiarEstado: (id) => httpClient.patch(`/pacientes/${id}/delete`),
  eliminarPermanente: (id) => httpClient.delete(`/pacientes/${id}`),
  listarObrasSocialesDePaciente: (idPaciente) =>
    httpClient.get(`/pacientes-por-obras-sociales/${idPaciente}`),
  crearRelacionObraSocial: (payload) =>
    httpClient.post("/pacientes-por-obras-sociales", payload),
  actualizarRelacionObraSocial: (idRelacion, payload) =>
    httpClient.put(`/pacientes-por-obras-sociales/${idRelacion}`, payload),
  eliminarRelacionObraSocial: (idRelacion) =>
    httpClient.delete(`/pacientes-por-obras-sociales/${idRelacion}`),
};

export default pacientesApi;

