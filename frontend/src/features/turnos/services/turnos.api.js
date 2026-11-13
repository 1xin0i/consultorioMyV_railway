/** @format */

import httpClient from "@/shared/services/httpClient";

export const turnosApi = {
  listar: (params = {}) => httpClient.get("/turnos", { params }),
  listarPorEndpoint: (endpoint, params = {}) =>
    httpClient.get(endpoint, { params }),
  listarAtendidos: () => httpClient.get("/turnos/atendidos"),
  obtenerPorId: (id) => httpClient.get(`/turnos/${id}`),
  obtenerPorPaciente: (idPaciente) =>
    httpClient.get(`/turnos/paciente/${idPaciente}`),
  crear: (payload) => httpClient.post("/turnos", payload),
  actualizar: (id, payload) => httpClient.put(`/turnos/${id}`, payload),
  atender: (id, payload) => httpClient.patch(`/turnos/${id}/atender`, payload),
  cancelar: (id, payload) =>
    httpClient.patch(`/turnos/${id}/cancelar`, payload),
  marcarInasistente: (id, payload) =>
    httpClient.patch(`/turnos/${id}/inasistente`, payload),
  reprogramar: (id, payload) =>
    httpClient.patch(`/turnos/${id}/reprogramado`, payload),
  eliminar: (id) => httpClient.patch(`/turnos/${id}/delete`),
  obtenerPracticasDeTurno: (idTurno) =>
    httpClient.get(`/practicas-turnos/${idTurno}`),
  obtenerPracticasConDetalle: (idTurno) =>
    httpClient.get(`/practicas-turnos/${idTurno}/turno`),
};

export default turnosApi;

