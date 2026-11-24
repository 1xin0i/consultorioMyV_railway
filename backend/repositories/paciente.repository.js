/** @format */

import { Op, Sequelize } from "sequelize";
import {
  Paciente,
  PacienteObraSocial,
  ObraSocial,
} from "../models/index.model.js";

/**
 * Construye el objeto where para el listado y búsqueda de pacientes.
 * Califica explícitamente las columnas ($Paciente.nombre$, $Paciente.apellido$, $Paciente.dni$)
 * para evitar el error 'Column nombre in where clause is ambiguous' en MySQL
 * debido al include con ObraSocial (que también posee columna 'nombre').
 */
export const construirWherePaciente = ({ search = "", estadoFiltrado } = {}) => {
  const where = {};

  if (
    estadoFiltrado === "inactivos" ||
    estadoFiltrado === "false" ||
    estadoFiltrado === "0"
  ) {
    where.activo = false;
  } else if (
    estadoFiltrado === "activos" ||
    estadoFiltrado === "true" ||
    estadoFiltrado === "1"
  ) {
    where.activo = true;
  }

  if (search && search.trim() !== "") {
    const termino = `%${search.trim()}%`;
    where[Op.or] = [
      { "$Paciente.nombre$": { [Op.like]: termino } },
      { "$Paciente.apellido$": { [Op.like]: termino } },
      { "$Paciente.dni$": { [Op.like]: termino } },
      { "$Paciente.telefono$": { [Op.like]: termino } },
      Sequelize.where(
        Sequelize.fn(
          "concat",
          Sequelize.col("Paciente.nombre"),
          " ",
          Sequelize.col("Paciente.apellido"),
        ),
        { [Op.like]: termino },
      ),
    ];
  }

  return where;
};

export const incluirObrasSociales = () => ({
  model: PacienteObraSocial,
  attributes: [
    "id_paciente_obra_social",
    "id_paciente",
    "id_obra_social",
    "nro_afiliado",
  ],
  include: [
    {
      model: ObraSocial,
      attributes: ["id_obra_social", "nombre"],
    },
  ],
});

export default {
  construirWherePaciente,
  incluirObrasSociales,
};
