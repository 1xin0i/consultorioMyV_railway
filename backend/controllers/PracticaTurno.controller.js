/** @format */

import {
  PracticaTurno,
  Turno,
  Practica,
  ObraSocial,
} from "../models/index.model.js";

// Obtener todas las prácticas de turno
export const getAllPracticaTurno = async (req, res) => {
  try {
    const practicaTurnos = await PracticaTurno.findAll({
      include: [
        {
          model: Practica,
          attributes: [
            "id_practica",
            "codigo_nomenclador",
            "nombre_nomenclador",
            "nombre_referencia",
            "precio_referencia",
          ],
        },
        {
          model: ObraSocial,
          attributes: ["id_obra_social", "nombre"],
        },
      ],
    });

    res.status(200).json({
      status: "success",
      data: practicaTurnos,
    });
  } catch (error) {
    console.error("Error al obtener las prácticas de turno:", error);
    res.status(500).json({ error: "Error al obtener las prácticas de turno" });
  }
};

// Obtener una práctica de turno por su ID
export const getPracticaTurnoById = async (req, res) => {
  try {
    const practicaTurno = req.practicaTurno;

    res.status(200).json({
      status: "success",
      data: practicaTurno,
    });
  } catch (error) {
    console.error("Error al obtener la práctica de turno:", error);
    res.status(500).json({ error: "Error al obtener la práctica de turno" });
  }
};

export const getPracticasByTurnoId = async (req, res) => {
  try {
    const { id_turno } = req.params;

    const practicasTurno = await PracticaTurno.findAll({
      where: { id_turno: id_turno },
      include: [
        {
          model: Practica,
          attributes: [
            "id_practica",
            "codigo_nomenclador",
            "nombre_nomenclador",
            "nombre_referencia",
            "precio_referencia",
          ],
        },
        {
          model: ObraSocial,
          attributes: ["id_obra_social", "nombre"],
        },
      ],
    });

    res.status(200).json({
      status: "success",
      data: practicasTurno,
    });
  } catch (error) {
    console.error("Error al obtener la práctica del turno:", error);
    res.status(500).json({ error: "Error al obtener la práctica del turno" });
  }
};

// Crear una nueva práctica de turno
export const createPracticaTurno = async (req, res) => {
  try {
    const { id_obra_social } = req.body;
    const { id_turno } = req.turno;
    const { id_practica } = req.practica;

    if (id_obra_social) {
      const obraSocial = await ObraSocial.findByPk(id_obra_social);

      if (!obraSocial) {
        return res.status(400).json({
          status: "error",
          message: "La obra social seleccionada no existe.",
        });
      }
    }

    // Validar que no se asigne la misma práctica más de una vez al mismo turno
    const practicaExistente = await PracticaTurno.findOne({
      where: { id_turno, id_practica },
    });

    if (practicaExistente) {
      return res.status(409).json({
        status: "error",
        message: "Esta práctica ya está asignada al turno.",
      });
    }

    const newPracticaTurno = await PracticaTurno.create({
      id_turno,
      id_practica,
      id_obra_social: id_obra_social || null,
    });

    res.status(201).json({
      status: "success",
      data: newPracticaTurno,
    });
  } catch (error) {
    console.error("Error al crear la práctica de turno:", error);
    res.status(500).json({ error: "Error al crear la práctica de turno" });
  }
};

// Actualizar una práctica de turno existente
export const updatePracticaTurno = async (req, res) => {
  try {
    const { id_turno, id_practica, id_obra_social } = req.body;

    const practicaTurno = req.practicaTurno;

    if (id_turno) {
      const turno = await Turno.findByPk(id_turno);
      if (!turno) {
        return res.status(400).json({
          status: "error",
          message: "El turno seleccionado no existen.",
        });
      }
    }
    if (id_practica) {
      const practica = await Practica.findByPk(id_practica);
      if (!practica) {
        return res.status(400).json({
          status: "error",
          message: "La practica seleccionada no existen.",
        });
      }
    }
    if (id_obra_social) {
      const obraSocial = await ObraSocial.findByPk(id_obra_social);
      if (!obraSocial) {
        return res.status(400).json({
          status: "error",
          message: "La obra social seleccionada no existen.",
        });
      }
    }

    await practicaTurno.update({
      id_turno: id_turno || practicaTurno.id_turno,
      id_practica: id_practica || practicaTurno.id_practica,
      id_obra_social: id_obra_social || practicaTurno.id_obra_social,
    });

    res.status(200).json({
      status: "success",
      data: practicaTurno,
    });
  } catch (error) {
    console.error("Error al actualizar la práctica de turno:", error);
    res.status(500).json({ error: "Error al actualizar la práctica de turno" });
  }
};

// Eliminar una práctica de turno existente
export const deletePracticaTurno = async (req, res) => {
  try {
    const practicaTurno = req.practicaTurno;

    await practicaTurno.destroy();

    res
      .status(200)
      .json({ message: "Práctica de turno eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la práctica de turno:", error);
    res.status(500).json({ error: "Error al eliminar la práctica de turno" });
  }
};
