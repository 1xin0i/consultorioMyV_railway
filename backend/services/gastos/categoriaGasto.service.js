/** @format */

import { Op } from "sequelize";
import { CategoriaGasto } from "../../models/index.model.js";
import { AppError } from "../../errors/AppError.js";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination.js";

export const listarPaginado = async (query) => {
  const { page, limit, offset, search, sortField, sortOrder } = parsePagination(
    query,
    {
      defaultLimit: 10,
      defaultSortField: "nombre",
      defaultSortOrder: "ASC",
      allowedSortFields: Object.keys(CategoriaGasto.rawAttributes),
    },
  );

  const where = {};

  if (query.activo !== undefined && query.activo !== "" && query.activo !== "all") {
    where.activo = String(query.activo) === "true" || query.activo === "1" || query.activo === true;
  } else if (query.activo === undefined) {
    where.activo = true;
  }

  if (search !== "") {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${search}%` } },
      { descripcion: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await CategoriaGasto.findAndCountAll({
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
  const { nombre, descripcion } = body;

  try {
    return await CategoriaGasto.create({
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : null,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new AppError(400, {
        status: "error",
        message: "Ya existe una categoría de gasto con ese nombre.",
      });
    }
    throw error;
  }
};

export const actualizar = async (categoria, body) => {
  const { nombre, descripcion } = body;

  try {
    await categoria.update({
      nombre: nombre ? nombre.trim() : categoria.nombre,
      descripcion:
        descripcion !== undefined ? descripcion?.trim() : categoria.descripcion,
    });
    return categoria;
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new AppError(400, {
        status: "error",
        message: "Ya existe otra categoría de gasto con ese nombre.",
      });
    }
    throw error;
  }
};

export const alternarActivo = async (categoria) => {
  await categoria.update({
    activo: !categoria.activo,
  });
};

export const eliminarPermanente = async (categoria) => {
  await categoria.destroy();
};

