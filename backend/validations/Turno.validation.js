/** @format */

import { EstadoTurno } from "../models/index.model.js";
import {
  haySolapamientoHorarios as validarSolapaminetoHorarios,
  validarDisponibilidadAgenda,
} from "../services/turnos/agenda.service.js";

export { validarSolapaminetoHorarios, validarDisponibilidadAgenda };

export const validarEstadoProgramado = async () => {
  const [estadoProgramado] = await EstadoTurno.findOrCreate({
    where: { estado: "Programado" },
  });
  return estadoProgramado;
};

export const validarEstados = async (id_estado, estadoInicio, estadoFinal) => {
  const estadosPermitidos = Array.isArray(estadoInicio)
    ? estadoInicio
    : [estadoInicio];

  if (!estadosPermitidos.includes(id_estado)) {
    return false;
  }

  return estadoFinal;
};
