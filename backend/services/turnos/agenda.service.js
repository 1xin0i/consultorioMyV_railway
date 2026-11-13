/** @format */

import { Op } from "sequelize";
import {
  Turno,
  EstadoTurno,
  ConfiguracionAgenda,
  RestriccionAgenda,
} from "../../models/index.model.js";
import { AppError } from "../../errors/AppError.js";

const NOMBRES_DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const parseMinutos = (horaStr, fallbackMinutos) => {
  if (!horaStr || typeof horaStr !== "string") return fallbackMinutos;
  const parts = horaStr.trim().split(":").map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) {
    return fallbackMinutos;
  }
  return parts[0] * 60 + parts[1];
};

export const haySolapamientoHorarios = async (
  fechaInicio,
  fechaFin,
  turnoIdExcluir = null,
) => {
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

export const validarDisponibilidadAgenda = async (fechaInicio, fechaFin) => {
  const inicio = new Date(fechaInicio);
  const fin = fechaFin
    ? new Date(fechaFin)
    : new Date(inicio.getTime() + 30 * 60000);

  // 1. Obtener configuración de agenda (fila única id = 1)
  const [config] = await ConfiguracionAgenda.findOrCreate({
    where: { id: 1 },
    defaults: {
      id: 1,
      hora_inicio: "08:00:00",
      hora_fin: "20:00:00",
      duracion_modulo_minutos: 30,
      dias_laborales: [1, 2, 3, 4, 5, 6],
    },
  });

  let diasLaborales = config.dias_laborales;
  if (typeof diasLaborales === "string") {
    try {
      diasLaborales = JSON.parse(diasLaborales);
    } catch {
      diasLaborales = [1, 2, 3, 4, 5, 6];
    }
  }
  if (!Array.isArray(diasLaborales)) {
    diasLaborales = [1, 2, 3, 4, 5, 6];
  }

  const diaSemana = inicio.getDay();
  if (!diasLaborales.map(Number).includes(diaSemana)) {
    return {
      disponible: false,
      motivo: `El consultorio no atiende los días ${NOMBRES_DIAS[diaSemana]}.`,
    };
  }

  const minApertura = parseMinutos(config.hora_inicio, 8 * 60);
  const minCierre = parseMinutos(config.hora_fin, 20 * 60);
  const minInicioTurno = inicio.getHours() * 60 + inicio.getMinutes();
  const minFinTurno = fin.getHours() * 60 + fin.getMinutes();

  if (
    minInicioTurno < minApertura ||
    minInicioTurno >= minCierre ||
    (fin.getDate() === inicio.getDate() && minFinTurno > minCierre)
  ) {
    const hAp = (config.hora_inicio || "08:00").slice(0, 5);
    const hCi = (config.hora_fin || "20:00").slice(0, 5);
    return {
      disponible: false,
      motivo: `El horario seleccionado está fuera de la jornada de atención (${hAp} a ${hCi} hs).`,
    };
  }

  // 2. Verificar restricciones / bloqueos puntuales en restricciones_agenda
  const y = inicio.getFullYear();
  const m = String(inicio.getMonth() + 1).padStart(2, "0");
  const d = String(inicio.getDate()).padStart(2, "0");
  const fechaStr = `${y}-${m}-${d}`;

  const restriccionesDelDia = await RestriccionAgenda.findAll({
    where: {
      fecha_inicio: { [Op.lte]: fechaStr },
      fecha_fin: { [Op.gte]: fechaStr },
    },
  });

  for (const r of restriccionesDelDia) {
    if (r.todo_el_dia) {
      return {
        disponible: false,
        motivo: `El día se encuentra bloqueado (${r.motivo || "No disponible"}).`,
      };
    }

    if (r.hora_inicio && r.hora_fin) {
      const minBloqueoIni = parseMinutos(r.hora_inicio, 0);
      const minBloqueoFin = parseMinutos(r.hora_fin, 0);
      if (minInicioTurno < minBloqueoFin && minFinTurno > minBloqueoIni) {
        return {
          disponible: false,
          motivo: `El horario seleccionado está bloqueado (${r.motivo || "No disponible"}: ${r.hora_inicio.slice(0, 5)} a ${r.hora_fin.slice(0, 5)} hs).`,
        };
      }
    }
  }

  return { disponible: true };
};

/**
 * Regla común de alta y reprogramación:
 *  1. Nunca puede haber otro turno PROGRAMADO en el mismo horario (no se saltea).
 *  2. Días laborales / bloqueos de agenda, salvo que el usuario marque la excepción.
 * Lanza AppError(409) con el body histórico de la API.
 */
export const asegurarAgendaDisponible = async ({
  fechaInicio,
  fechaFin,
  turnoIdExcluir = null,
  ignorarRestricciones = false,
}) => {
  if (await haySolapamientoHorarios(fechaInicio, fechaFin, turnoIdExcluir)) {
    throw new AppError(409, {
      error: "El horario seleccionado se superpone con un turno ya programado.",
    });
  }

  if (!ignorarRestricciones) {
    const disponibilidad = await validarDisponibilidadAgenda(fechaInicio, fechaFin);
    if (!disponibilidad.disponible) {
      throw new AppError(409, {
        error: disponibilidad.motivo,
        codigo: "RESTRICCION_AGENDA",
      });
    }
  }
};
