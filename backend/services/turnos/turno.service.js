/** @format */

import sequelize from "../../config/database.js";
import { Paciente } from "../../models/index.model.js";
import { ESTADOS } from "../../constants/EstadosTurno.js";
import { AppError } from "../../errors/AppError.js";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination.js";
import { formatearTurnoConCobro } from "../../mappers/turno.mapper.js";
import * as turnoRepo from "../../repositories/turno.repository.js";
import * as historialRepo from "../../repositories/historialEstadoTurno.repository.js";
import { asegurarAgendaDisponible } from "./agenda.service.js";
import {
  registrarPracticasProgramadas,
  sincronizarPracticasProgramadas,
} from "./practicasTurno.helper.js";

/* ───────────── Consultas ───────────── */

export const obtenerAgenda = () => turnoRepo.findAgenda();

export const listarPaginado = async (query) => {
  const { page, limit, offset, search, sortField, sortOrder } = parsePagination(
    query,
    {
      defaultLimit: 9,
      defaultSortField: "fecha_hora_inicio",
      defaultSortOrder: "DESC",
      allowedSortFields: turnoRepo.camposOrdenables(),
    },
  );

  const { count, rows } = await turnoRepo.findPaginado({
    where: turnoRepo.construirWhereListado({
      estadoFiltrado: query.estadoFiltrado || query.id_estado,
      mes: query.mes,
      search,
    }),
    limit,
    offset,
    order: turnoRepo.construirOrdenListado(sortField, sortOrder),
  });

  return {
    data: rows.map(formatearTurnoConCobro),
    meta: buildPaginationMeta(count, page, limit),
  };
};

export const listarAtendidosSinCobro = () =>
  turnoRepo.findAtendidosSinSolicitud();

/** Detalle completo; si no se pudiera cargar, devuelve el turno ya encontrado por el middleware. */
export const obtenerDetalle = async (turno) =>
  (await turnoRepo.findDetalleById(turno.id_turno)) || turno;

export const listarPorPaciente = async (id_paciente) => {
  const turnos = await turnoRepo.findByPaciente(id_paciente);
  return turnos.map(formatearTurnoConCobro);
};

/* ───────────── Escritura ───────────── */

export const crear = async (body) => {
  const {
    id_paciente,
    fecha_hora_inicio,
    fecha_hora_fin,
    duracion_minutos,
    duracionMinutos,
    precio_final,
    notas_consulta,
    practicas,
    ignorar_restricciones,
    ignorarRestricciones,
  } = body;

  const duracion = Number(duracion_minutos ?? duracionMinutos) || 30;
  const fechaFin =
    fecha_hora_fin ||
    new Date(new Date(fecha_hora_inicio).getTime() + duracion * 60000);

  await asegurarAgendaDisponible({
    fechaInicio: fecha_hora_inicio,
    fechaFin,
    turnoIdExcluir: null,
    ignorarRestricciones: Boolean(ignorarRestricciones || ignorar_restricciones),
  });

  return sequelize.transaction(async (t) => {
    const nuevoTurno = await turnoRepo.crear(
      {
        id_paciente,
        id_estado: ESTADOS.PROGRAMADO,
        fecha_hora_inicio,
        fecha_hora_fin: fechaFin,
        precio_final: precio_final || 0,
        notas_consulta: notas_consulta || null,
      },
      t,
    );

    await historialRepo.registrar(
      nuevoTurno.id_turno,
      ESTADOS.PROGRAMADO,
      "Turno programado",
      t,
    );

    await registrarPracticasProgramadas(nuevoTurno.id_turno, practicas, t);

    return nuevoTurno;
  });
};

export const actualizar = async (turno, body) => {
  const { id_paciente, precio_final, notas_consulta, practicas } = body;

  if (id_paciente) {
    const paciente = await Paciente.findByPk(id_paciente);
    if (!paciente) {
      throw new AppError(400, {
        status: "error",
        message: "El paciente seleccionado no existen.",
      });
    }
  }

  await sequelize.transaction(async (t) => {
    await turno.update(
      {
        id_paciente: turno.id_paciente, // El paciente no se modifica una vez programado el turno
        precio_final: precio_final ?? turno.precio_final,
        notas_consulta: notas_consulta || null,
      },
      { transaction: t },
    );

    // Si el turno aún está programado y se pasan prácticas, sincronizarlas
    if (turno.id_estado === ESTADOS.PROGRAMADO && Array.isArray(practicas)) {
      await sincronizarPracticasProgramadas(turno.id_turno, practicas, t);
    }
  });

  return turno;
};

/** Baja lógica reversible: alterna `activo`. */
export const alternarActivo = async (turno) => {
  await turno.update({ activo: !turno.activo });
};

