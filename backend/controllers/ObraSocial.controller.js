/** @format */

import { ObraSocial } from "../models/index.model.js";
import { Op } from "sequelize";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

// Obtener todas las obras sociales
export const getAllObrasSociales = async (req, res) => {
  try {
    const { page, limit, offset, search, sortField, sortOrder } = parsePagination(req.query, {
      defaultLimit: 9,
      defaultSortField: "nombre",
      defaultSortOrder: "ASC",
      allowedSortFields: Object.keys(ObraSocial.rawAttributes),
    });
    const where = {};

    // Busqueda por nombre apellido dni telefono
    if (search !== "") {
      where[Op.or] = [{ nombre: { [Op.like]: `%${search}%` } }];
    }

    const { count, rows: obrasSociales } = await ObraSocial.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, sortOrder]],
    });


    res.status(200).json({
      status: "success",
      data: obrasSociales,
      meta: buildPaginationMeta(count, page, limit),
    });
  } catch (error) {
    console.error("Error al obtener las obras sociales:", error);
    res.status(500).json({ error: "Error al obtener las obras sociales" });
  }
};

// Obtener una obra social por su ID
export const getObraSocialById = async (req, res) => {
  try {
    const obraSocial = req.obraSocial;

    res.status(200).json({
      status: "success",
      data: obraSocial,
    });
  } catch (error) {
    console.error("Error al obtener la obra social:", error);
    res.status(500).json({ error: "Error al obtener la obra social" });
  }
};

// Crear una nueva obra social
export const createObraSocial = async (req, res) => {
  try {
    const { nombre } = req.body;

    const newObraSocial = await ObraSocial.create({ nombre });

    res.status(201).json({
      status: "success",
      data: newObraSocial,
    });
  } catch (error) {
    console.error("Error al crear la obra social:", error);
    res.status(500).json({ error: "Error al crear la obra social" });
  }
};

// Actualizar una obra social existente
export const updateObraSocial = async (req, res) => {
  try {
    const { nombre } = req.body;

    const obraSocial = req.obraSocial;

    await obraSocial.update({
      nombre: nombre || obraSocial.nombre,
    });

    res.status(200).json({
      status: "success",
      data: obraSocial,
    });
  } catch (error) {
    console.error("Error al actualizar la obra social:", error);
    res.status(500).json({ error: "Error al actualizar la obra social" });
  }
};

// Eliminar una obra social existente
export const toggleObraSocial = async (req, res) => {
  try {
    const obraSocial = req.obraSocial;

    await obraSocial.update({
      activo: !obraSocial.activo,
    });

    res.status(200).json({ message: "Obra social eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la obra social:", error);
    res.status(500).json({ error: "Error al eliminar la obra social" });
  }
};

// Eliminar una obra social existente
export const deleteObraSocial = async (req, res) => {
  try {
    const obraSocial = req.obraSocial;

    await obraSocial.destroy();

    res.status(200).json({ message: "Obra social eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la obra social:", error);
    res.status(500).json({ error: "Error al eliminar la obra social" });
  }
};
