/** @format */

import { Op } from "sequelize";
import { Practica } from "../models/Practica.model.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

// Obtener todas las prácticas
export const getAllPracticas = async (req, res) => {
  try {
    const { page, limit, offset, search, sortField, sortOrder } = parsePagination(req.query, {
      defaultLimit: 9,
      defaultSortField: "codigo_nomenclador",
      defaultSortOrder: "ASC",
      allowedSortFields: Object.keys(Practica.rawAttributes),
    });
    const where = {};

    // Busqueda por nombre apellido dni telefono
    if (search !== "") {
      where[Op.or] = [
        { codigo_nomenclador: { [Op.like]: `%${search}%` } },
        { nombre_nomenclador: { [Op.like]: `%${search}%` } },
        { nombre_referencia: { [Op.like]: `%${search}%` } },
        { especialidad: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: practicas } = await Practica.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, sortOrder]],
    });


    res.status(200).json({
      status: "success",
      data: practicas,
      meta: buildPaginationMeta(count, page, limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener una práctica por su ID
export const getPracticaById = async (req, res) => {
  try {
    const practica = req.practica;

    res.status(200).json({
      status: "success",
      data: practica,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear una nueva practica
export const createPractica = async (req, res) => {
  try {
    const { codigo_nomenclador, nombre_nomenclador, nombre_referencia, especialidad, precio_referencia } =
      req.body;

    const newPractica = await Practica.create({
      codigo_nomenclador,
      nombre_nomenclador,
      nombre_referencia,
      especialidad,
      precio_referencia,
    });

    res.status(201).json({
      status: "success",
      data: newPractica,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar una práctica existente
export const updatePractica = async (req, res) => {
  try {
    const { codigo_nomenclador, nombre_nomenclador, nombre_referencia, especialidad, precio_referencia } =
      req.body;

    const practica = req.practica;

    await practica.update({
      codigo_nomenclador: codigo_nomenclador ?? practica.codigo_nomenclador,
      nombre_nomenclador: nombre_nomenclador ?? practica.nombre_nomenclador,
      nombre_referencia: nombre_referencia ?? practica.nombre_referencia,
      especialidad: especialidad ?? practica.especialidad,
      precio_referencia: precio_referencia ?? practica.precio_referencia,
    });

    res.status(200).json({
      status: "success",
      data: practica,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Desactiva o activa una práctica existente
export const togglePractica = async (req, res) => {
  try {
    const practica = req.practica;

    await practica.update({
      activo: !practica.activo,
    });

    res.json({ message: "Estado de la práctica actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar una práctica existente
export const deletePractica = async (req, res) => {
  try {
    const practica = req.practica;

    await practica.destroy();

    res.json({ message: "Practica eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
