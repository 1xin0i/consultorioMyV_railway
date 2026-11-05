/** @format */

import { CategoriaGasto } from "../models/index.model.js";
import { Op } from "sequelize";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

// Obtener todas las categorías de gastos (con paginación y búsqueda)
export const getAllCategoriasGastos = async (req, res) => {
  try {
    const { page, limit, offset, search, sortField, sortOrder } = parsePagination(req.query, {
      defaultLimit: 10,
      defaultSortField: "nombre",
      defaultSortOrder: "ASC",
      allowedSortFields: Object.keys(CategoriaGasto.rawAttributes),
    });

    const where = {
      activo: true,
    };

    if (search !== "") {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { descripcion: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: categorias } = await CategoriaGasto.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, sortOrder]],
    });


    res.status(200).json({
      status: "success",
      data: categorias,
      meta: buildPaginationMeta(count, page, limit),
    });
  } catch (error) {
    console.error("Error al obtener las categorías de gastos:", error);
    res.status(500).json({
      status: "error",
      message: "Error al obtener las categorías de gastos",
      error: error.message,
    });
  }
};

// Obtener una categoría por su ID
export const getCategoriaGastoById = async (req, res) => {
  try {
    const categoria = req.categoriaGasto; // Inyectado por el middleware validarExistencia

    res.status(200).json({
      status: "success",
      data: categoria,
    });
  } catch (error) {
    console.error("Error al obtener la categoría de gasto:", error);
    res.status(500).json({ error: "Error al obtener la categoría de gasto" });
  }
};

// Crear una nueva categoría de gasto
export const createCategoriaGasto = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    const nuevaCategoria = await CategoriaGasto.create({
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : null,
    });

    res.status(201).json({
      status: "success",
      data: nuevaCategoria,
    });
  } catch (error) {
    console.error("Error al crear la categoría de gasto:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        status: "error",
        message: "Ya existe una categoría de gasto con ese nombre.",
      });
    }
    res.status(500).json({ error: "Error al crear la categoría de gasto" });
  }
};

// Actualizar una categoría de gasto existente
export const updateCategoriaGasto = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const categoria = req.categoriaGasto; // Inyectado por el middleware

    await categoria.update({
      nombre: nombre ? nombre.trim() : categoria.nombre,
      descripcion: descripcion !== undefined ? descripcion?.trim() : categoria.descripcion,
    });

    res.status(200).json({
      status: "success",
      data: categoria,
    });
  } catch (error) {
    console.error("Error al actualizar la categoría de gasto:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        status: "error",
        message: "Ya existe otra categoría de gasto con ese nombre.",
      });
    }
    res.status(500).json({ error: "Error al actualizar la categoría de gasto" });
  }
};

// Baja lógica de una categoría de gasto
export const deleteCategoriaGasto = async (req, res) => {
  try {
    const categoria = req.categoriaGasto;

    await categoria.update({
      activo: !categoria.activo,
    });

    res.status(200).json({ message: "Estado de la categoría actualizado correctamente" });
  } catch (error) {
    console.error("Error al cambiar estado de la categoría de gasto:", error);
    res.status(500).json({ error: "Error al actualizar el estado de la categoría" });
  }
};
