/** @format */

import httpClient from "@/shared/services/httpClient";

export const cajaApi = {
  listar: (params = {}) => httpClient.get("/caja", { params }),
};

export default cajaApi;

