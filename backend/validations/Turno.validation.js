/** @format */

import { Op } from "sequelize";
import { Turno, EstadoTurno } from "../models/index.model.js";

export const validarEstadoProgramado = async () => {
  const [estadoProgramado] = await EstadoTurno.findOrCreate({
    where: { estado: "Programado" },
  });

  return estadoProgramado;
};

/**
 * @deprecated Reemplazado por el patrón State en domain/turno/estado.
 * Se preserva por compatibilidad retroactiva.
 */
export const validarEstados = async (id_estado, estadoInicio, estadoFinal) => {
  const estadosPermitidos = Array.isArray(estadoInicio) ? estadoInicio : [estadoInicio];

  if (!estadosPermitidos.includes(id_estado)) {
    return false;
  }

  return estadoFinal;
};

export const validarSolapaminetoHorarios = async (fechaInicio, fechaFin, turnoIdExcluir = null) => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  const [estadoProgramado] = await EstadoTurno.findOrCreate({
    where: { estado: "Programado" },
  });

  // Obtenemos los turnos en conflicto
  const turnoExistente = await Turno.findOne({
    where: {
      id_estado: { [Op.eq]: estadoProgramado.id_estado },
      activo: true,
      // Condición de solapamiento
      fecha_hora_inicio: { [Op.lt]: fin },
      fecha_hora_fin: { [Op.gt]: inicio },
      // Si estamos editando un turno existente, lo excluimos de la búsqueda
      ...(turnoIdExcluir && { id_turno: { [Op.ne]: turnoIdExcluir } }),
    },
  });

  return !!turnoExistente;
};
