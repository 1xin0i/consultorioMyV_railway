/** @format */

import httpClient from "@/shared/services/httpClient";

export const gastosApi = {
  listar: (params = {}) => httpClient.get("/gastos", { params }),
  crear: (payload) => httpClient.post("/gastos", payload),
  actualizar: (id, payload) => httpClient.put(`/gastos/${id}`, payload),
  eliminar: (id) => httpClient.patch(`/gastos/${id}/delete`),
  listarCategorias: (params = {}) =>
    httpClient.get("/categorias-gastos", { params }),
  crearCategoria: (payload) => httpClient.post("/categorias-gastos", payload),
};

export default gastosApi;

