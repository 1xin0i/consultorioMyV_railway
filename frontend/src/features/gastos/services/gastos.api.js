/** @format */

import httpClient from "@/shared/services/httpClient";

export const categoriasGastosApi = {
  listar: (params = {}) => httpClient.get("/categorias-gastos", { params }),
  obtenerPorId: (id) => httpClient.get(`/categorias-gastos/${id}`),
  crear: (payload) => httpClient.post("/categorias-gastos", payload),
  actualizar: (id, payload) =>
    httpClient.put(`/categorias-gastos/${id}`, payload),
  cambiarEstado: (id) => httpClient.patch(`/categorias-gastos/${id}/delete`),
  eliminarPermanente: (id) => httpClient.delete(`/categorias-gastos/${id}`),
  eliminar: (id) => httpClient.delete(`/categorias-gastos/${id}`),
};

export const gastosApi = {
  listar: (params = {}) => httpClient.get("/gastos", { params }),
  crear: (payload) => httpClient.post("/gastos", payload),
  actualizar: (id, payload) => httpClient.put(`/gastos/${id}`, payload),
  eliminar: (id) => httpClient.patch(`/gastos/${id}/delete`),
  listarCategorias: (params = {}) =>
    categoriasGastosApi.listar(params),
  crearCategoria: (payload) => categoriasGastosApi.crear(payload),
  actualizarCategoria: (id, payload) =>
    categoriasGastosApi.actualizar(id, payload),
  cambiarEstadoCategoria: (id) => categoriasGastosApi.cambiarEstado(id),
  eliminarCategoria: (id) => categoriasGastosApi.eliminar(id),
};

export default gastosApi;

