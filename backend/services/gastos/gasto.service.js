/** @format */

import { parsePagination, buildPaginationMeta } from "../../utils/pagination.js";
import * as gastoRepo from "../../repositories/gasto.repository.js";

export const listarPaginado = async (query) => {
  const { page, limit, offset, search, sortField, sortOrder } = parsePagination(
    query,
    {
      defaultLimit: 9,
      defaultSortField: "fecha_gasto",
      defaultSortOrder: "DESC",
      allowedSortFields: gastoRepo.camposOrdenables(),
    },
  );

  const where = gastoRepo.construirWhereListado({
    search,
    categoria: query.categoria || "",
  });

  const { count, rows } = await gastoRepo.findPaginado({
    where,
    limit,
    offset,
    order: [[sortField, sortOrder]],
  });

  return {
    data: rows,
    meta: buildPaginationMeta(count, page, limit),
  };
};

export const crear = async (body) => {
  const { id_categoria_gasto, monto, concepto, fecha_gasto, metodo_pago } = body;

  return gastoRepo.crear({
    id_categoria_gasto,
    monto,
    concepto,
    fecha_gasto: fecha_gasto || new Date(),
    metodo_pago: metodo_pago || "Efectivo",
  });
};

export const actualizar = async (gasto, body) => {
  const { id_categoria_gasto, monto, concepto, fecha_gasto, metodo_pago } = body;

  await gasto.update({
    id_categoria_gasto: id_categoria_gasto || gasto.id_categoria_gasto,
    monto: monto !== undefined ? monto : gasto.monto,
    concepto: concepto || gasto.concepto,
    fecha_gasto: fecha_gasto || gasto.fecha_gasto,
    metodo_pago: metodo_pago || gasto.metodo_pago,
  });

  return gasto;
};

export const alternarActivo = async (gasto) => {
  await gasto.update({
    activo: !gasto.activo,
  });
};

