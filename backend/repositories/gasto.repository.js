/** @format */

import { Op } from "sequelize";
import { Gasto, CategoriaGasto } from "../models/index.model.js";

export const camposOrdenables = () => Object.keys(Gasto.rawAttributes);

export const construirWhereListado = ({ search = "", categoria = "" } = {}) => {
  const where = { activo: true };

  if (search !== "") {
    where.concepto = { [Op.like]: `%${search}%` };
  }

  if (categoria) {
    where.id_categoria_gasto = categoria;
  }

  return where;
};

export const construirWhereCaja = ({
  fechaDesde,
  fechaHasta,
  search = "",
} = {}) => {
  const where = { activo: true };

  if (fechaDesde && fechaHasta) {
    where.fecha_gasto = { [Op.between]: [fechaDesde, fechaHasta] };
  }

  if (search !== "") {
    where[Op.or] = [
      { concepto: { [Op.like]: `%${search}%` } },
      { "$CategoriaGasto.nombre$": { [Op.like]: `%${search}%` } },
    ];
  }

  return where;
};

export const findPaginado = ({
  where,
  limit,
  offset,
  order,
  atributosCategoria = ["id_categoria_gasto", "nombre"],
  subQuery,
}) =>
  Gasto.findAndCountAll({
    where,
    limit,
    offset,
    order,
    ...(subQuery !== undefined && { subQuery }),
    include: [
      {
        model: CategoriaGasto,
        as: "CategoriaGasto",
        attributes: atributosCategoria,
      },
    ],
  });

export const sumarMonto = (where) => Gasto.sum("monto", { where });

export const crear = (datos) => Gasto.create(datos);

