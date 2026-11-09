/** @format */

import { Op } from "sequelize";
import {
  Turno,
  EstadoTurno,
  Paciente,
  Cobro,
  Cuota,
} from "../models/index.model.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { TurnoService, TransicionEstadoInvalidaError } from "../utils/TurnoService.js";

export const getAllTurnosAgenda = async (req, res) => {
  try {
    const turnos = await Turno.findAll({
      where: { activo: true },
      include: [
        {
          model: Paciente,
          attributes: ["nombre", "apellido", "dni", "telefono"],
        },
        {
          model: EstadoTurno,
          attributes: ["estado"],
        },
      ],
    });

    res.status(200).json({
      status: "success",
      data: turnos,
    });
  } catch (error) {
    console.error("Error al obtener los turnos:", error);
    res.status(500).json({ error: "Error al obtener los turnos" });
  }
};

// Obtener todos los turnos con paginación y búsqueda
export const getAllTurnos = async (req, res) => {
  try {
    const { page, limit, offset, search, sortField, sortOrder } = parsePagination(req.query, {
      defaultLimit: 9,
      defaultSortField: "fecha_hora_inicio",
      defaultSortOrder: "ASC",
      allowedSortFields: Object.keys(Turno.rawAttributes),
    });
    const estadoFiltrado = req.query.estadoFiltrado;
    const where = { activo: true };
    if (estadoFiltrado) {
      where.id_estado = estadoFiltrado;
    }

    if (search !== "") {
      where[Op.or] = [
        { fecha_hora_inicio: { [Op.like]: `%${search}%` } },
        { fecha_hora_fin: { [Op.like]: `%${search}%` } },
        { "$Paciente.nombre$": { [Op.like]: `%${search}%` } },
        { "$Paciente.apellido$": { [Op.like]: `%${search}%` } },
        { "$Paciente.dni$": { [Op.like]: `%${search}%` } },
        { "$Paciente.telefono$": { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows: turnos } = await Turno.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, sortOrder]],
      include: [
        {
          model: Paciente,
          attributes: ["nombre", "apellido", "dni", "telefono"],
        },
        {
          model: EstadoTurno,
          attributes: ["estado"],
        },
      ],
    });

    res.status(200).json({
      status: "success",
      data: turnos,
      meta: buildPaginationMeta(count, page, limit),
    });
  } catch (error) {
    console.error("Error al obtener los turnos:", error);
    res.status(500).json({ error: "Error al obtener los turnos" });
  }
};

// Obtener todos los turnos en Atendido pendientes de cobro
export const getAllTurnosAtendidos = async (req, res) => {
  try {
    const idEstadoAtendido = await TurnoService.resolverIdEstado("Atendido");

    const cobrosExistentes = await Cobro.findAll({
      where: { activo: true },
      attributes: ["id_turno"],
    });

    const turnosConCobroIds = cobrosExistentes.map((cobro) => cobro.id_turno);

    const turnos = await Turno.findAll({
      where: {
        activo: true,
        id_estado: idEstadoAtendido,
        id_turno: {
          [Op.notIn]: turnosConCobroIds.length > 0 ? turnosConCobroIds : [-1],
        },
      },
      include: [
        {
          model: Paciente,
          attributes: ["nombre", "apellido", "dni", "telefono"],
        },
        {
          model: EstadoTurno,
          attributes: ["estado"],
        },
      ],
    });

    res.status(200).json({
      status: "success",
      data: turnos,
    });
  } catch (error) {
    console.error("Error al obtener los turnos atendidos sin cobro:", error);
    res.status(500).json({ error: "Error al obtener los turnos atendidos" });
  }
};

// Obtener un turno por su ID
export const getTurnoById = async (req, res) => {
  try {
    const turno = req.turno;

    res.status(200).json({
      status: "success",
      data: turno,
    });
  } catch (error) {
    console.error("Error al obtener el turno:", error);
    res.status(500).json({ error: "Error al obtener el turno" });
  }
};

export const getTurnosByPacienteId = async (req, res) => {
  try {
    const { id_paciente } = req.params;

    const turnos = await Turno.findAll({
      where: {
        id_paciente: id_paciente,
        activo: true,
      },
      order: [["fecha_hora_inicio", "DESC"]],
      include: [
        {
          model: EstadoTurno,
          attributes: ["id_estado", "estado"],
        },
        {
          model: Cobro,
          attributes: ["id_cobro", "monto_a_cobrar", "cant_cuotas", "fecha_emision"],
          include: [
            {
              model: Cuota,
              attributes: ["id_cuota", "monto_cobrado", "monto_cuota", "estado", "metodo_pago"],
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      status: "success",
      data: turnos,
    });
  } catch (error) {
    console.error("Error al obtener los turnos del paciente:", error);
    return res.status(500).json({
      status: "error",
      message: "Error al obtener los turnos del paciente",
    });
  }
};

// Crear un nuevo turno (inicia en PROGRAMADO con registro de historial)
export const createTurno = async (req, res) => {
  try {
    const nuevoTurno = await TurnoService.crearTurno(req.body);

    res.status(201).json({
      status: "success",
      data: nuevoTurno,
    });
  } catch (error) {
    if (error.statusCode === 409 || error.codigo === "HORARIO_SOLAPADO") {
      return res.status(409).json({ error: error.message });
    }
    if (error instanceof TransicionEstadoInvalidaError || error.statusCode === 400) {
      return res.status(400).json({ error: error.message, codigo: error.codigo });
    }
    console.error("Error al crear el turno:", error);
    res.status(500).json({ error: "Error interno del servidor al crear el turno." });
  }
};

// Actualizar datos de un turno (sin alterar estado)
export const updateTurno = async (req, res) => {
  try {
    const turno = req.turno;
    const { id_paciente, precio_final, notas_consulta } = req.body;

    if (id_paciente) {
      const paciente = await Paciente.findByPk(id_paciente);
      if (!paciente) {
        return res.status(400).json({
          status: "error",
          message: "El paciente seleccionado no existen.",
        });
      }
    }

    await turno.update({
      id_paciente: id_paciente || turno.id_paciente,
      precio_final: precio_final ?? turno.precio_final,
      notas_consulta: notas_consulta || null,
    });

    res.status(200).json({
      status: "success",
      data: turno,
    });
  } catch (error) {
    console.error("Error al modificar el turno:", error);
    res.status(500).json({ error: "Error interno del servidor al modificar el turno." });
  }
};

// Finalizar atención del turno (Transición a ATENDIDO vía Patrón State)
export const turnoAtendido = async (req, res) => {
  try {
    const idTurno = req.params.id || req.turno?.id_turno;
    const turnoActualizado = await TurnoService.atenderTurno(idTurno, req.body);

    res.status(200).json({
      status: "success",
      data: turnoActualizado,
    });
  } catch (error) {
    if (error instanceof TransicionEstadoInvalidaError) {
      return res.status(400).json({ error: error.message, codigo: error.codigo });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("Error al finalizar la atención:", error);
    res.status(500).json({ error: "Error interno al registrar la atención" });
  }
};

// Cancelar turno (Transición a CANCELADO vía Patrón State)
export const turnoCancelado = async (req, res) => {
  try {
    const idTurno = req.params.id || req.turno?.id_turno;
    const turnoActualizado = await TurnoService.cancelarTurno(idTurno, req.body);

    res.status(200).json({
      status: "success",
      data: turnoActualizado,
    });
  } catch (error) {
    if (error instanceof TransicionEstadoInvalidaError) {
      return res.status(400).json({ error: error.message, codigo: error.codigo });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("Error al cancelar el turno:", error);
    res.status(500).json({ error: "Error interno al actualizar el estado" });
  }
};

// Marcar como inasistente (Transición a INASISTENTE vía Patrón State)
export const turnoInasistido = async (req, res) => {
  try {
    const idTurno = req.params.id || req.turno?.id_turno;
    const turnoActualizado = await TurnoService.marcarInasistente(idTurno, req.body);

    res.status(200).json({
      status: "success",
      data: turnoActualizado,
    });
  } catch (error) {
    if (error instanceof TransicionEstadoInvalidaError) {
      return res.status(400).json({ error: error.message, codigo: error.codigo });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("Error al marcar como inasistente:", error);
    res.status(500).json({ error: "Error interno al actualizar el estado" });
  }
};

// Reprogramar turno (Transición a PROGRAMADO vía Patrón State)
export const turnoReprogramado = async (req, res) => {
  try {
    const idTurno = req.params.id || req.turno?.id_turno;
    const turnoActualizado = await TurnoService.reprogramarTurno(idTurno, req.body);

    res.status(200).json({
      status: "success",
      data: turnoActualizado,
    });
  } catch (error) {
    if (error.statusCode === 409 || error.codigo === "HORARIO_SOLAPADO") {
      return res.status(409).json({ error: error.message });
    }
    if (error instanceof TransicionEstadoInvalidaError) {
      return res.status(400).json({ error: error.message, codigo: error.codigo });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("Error al reprogramar el turno:", error);
    res.status(500).json({ error: "Error interno al actualizar el estado" });
  }
};

// Eliminar (soft-delete) un turno
export const deleteTurno = async (req, res) => {
  try {
    const turno = req.turno;
    await turno.update({ activo: !turno.activo });

    res.status(200).json({ message: "Turno eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el turno:", error);
    res.status(500).json({ error: "Error al eliminar el turno" });
  }
};
