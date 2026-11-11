/** @format */

import { ObraSocial, PacienteObraSocial } from "../models/index.model.js";
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

    const estadoFiltrado = req.query.estadoFiltrado;
    if (estadoFiltrado === "inactivas" || estadoFiltrado === "false" || estadoFiltrado === "0") {
      where.activo = false;
    } else if (estadoFiltrado === "activas" || estadoFiltrado === "true" || estadoFiltrado === "1") {
      where.activo = true;
    }

    // Busqueda por nombre o código de prestador
    if (search !== "") {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { codigo_prestador: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: obrasSociales } = await ObraSocial.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, sortOrder]],
      include: [
        {
          model: PacienteObraSocial,
          attributes: ["id_paciente"],
          required: false,
        },
      ],
      distinct: true,
    });

    const data = obrasSociales.map((os) => {
      const plain = os.get({ plain: true });
      return {
        ...plain,
        pacientes_count: plain.PacienteObraSocials?.length || 0,
      };
    });

    res.status(200).json({
      status: "success",
      data,
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
    const { nombre, codigo_prestador } = req.body;

    const newObraSocial = await ObraSocial.create({
      nombre,
      codigo_prestador: codigo_prestador || null,
    });

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
    const { nombre, codigo_prestador, activo } = req.body;
    const obraSocial = req.obraSocial;

    const datosActualizar = {};
    if (nombre !== undefined) datosActualizar.nombre = nombre;
    if (codigo_prestador !== undefined)
      datosActualizar.codigo_prestador = codigo_prestador;
    if (activo !== undefined) datosActualizar.activo = activo;

    await obraSocial.update(datosActualizar);

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

    res.status(200).json({
      status: "success",
      data: obraSocial,
      message: "Estado de obra social modificado correctamente",
    });
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
