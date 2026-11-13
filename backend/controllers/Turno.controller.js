/** @format */

import { responderError } from "../errors/AppError.js";
import * as turnoService from "../services/turnos/turno.service.js";
import * as turnoEstadoService from "../services/turnos/turnoEstado.service.js";

export const getAllTurnosAgenda = async (req, res) => {
  try {
    const data = await turnoService.obtenerAgenda();
    res.status(200).json({ status: "success", data });
  } catch (error) {
    responderError(res, error, "Error al obtener los turnos:", {
      error: "Error al obtener los turnos",
    });
  }
};

export const getAllTurnos = async (req, res) => {
  try {
    const { data, meta } = await turnoService.listarPaginado(req.query);
    res.status(200).json({ status: "success", data, meta });
  } catch (error) {
    responderError(res, error, "Error al obtener los turnos:", {
      error: "Error al obtener los turnos",
    });
  }
};

export const getAllTurnosAtendidos = async (req, res) => {
  try {
    const data = await turnoService.listarAtendidosSinCobro();
    res.status(200).json({ status: "success", data });
  } catch (error) {
    responderError(res, error, "Error al obtener los turnos atendidos sin cobro:", {
      error: "Error al obtener los turnos atendidos",
    });
  }
};

export const getTurnoById = async (req, res) => {
  try {
    const data = await turnoService.obtenerDetalle(req.turno);
    res.status(200).json({ status: "success", data });
  } catch (error) {
    responderError(res, error, "Error al obtener el turno:", {
      error: "Error al obtener el turno",
    });
  }
};

export const getTurnosByPacienteId = async (req, res) => {
  try {
    const data = await turnoService.listarPorPaciente(req.params.id_paciente);
    return res.status(200).json({ status: "success", data });
  } catch (error) {
    return responderError(
      res,
      error,
      "Error al obtener los turnos del paciente:",
      {
        status: "error",
        message: "Error al obtener los turnos del paciente",
      },
    );
  }
};

export const createTurno = async (req, res) => {
  try {
    const data = await turnoService.crear(req.body);
    res.status(201).json({ status: "success", data });
  } catch (error) {
    responderError(res, error, "Error al crear el turno:", {
      error: "Error interno del servidor al crear el turno.",
    });
  }
};

export const updateTurno = async (req, res) => {
  try {
    const data = await turnoService.actualizar(req.turno, req.body);
    res.status(200).json({ status: "success", data });
  } catch (error) {
    responderError(res, error, "Error al modificar el turno:", {
      error: "Error interno del servidor al modificar el turno.",
    });
  }
};

export const turnoAtendido = async (req, res) => {
  try {
    const data = await turnoEstadoService.atender(req.turno, req.body);
    res.status(200).json({ status: "success", data });
  } catch (error) {
    responderError(res, error, "Error al finalizar la atención:", {
      error: "Error interno al registrar la atención",
    });
  }
};

export const turnoCancelado = async (req, res) => {
  try {
    const data = await turnoEstadoService.cancelar(req.turno, req.body);
    res.status(200).json({ status: "success", data });
  } catch (error) {
    responderError(res, error, "Error al actualizar estado:", {
      error: "Error interno al actualizar el estado",
    });
  }
};

export const turnoInasistido = async (req, res) => {
  try {
    const data = await turnoEstadoService.marcarInasistente(req.turno, req.body);
    res.status(200).json({ status: "success", data });
  } catch (error) {
    responderError(res, error, "Error al actualizar estado:", {
      error: "Error interno al actualizar el estado",
    });
  }
};

export const turnoReprogramado = async (req, res) => {
  try {
    const data = await turnoEstadoService.reprogramar(req.turno, req.body);
    res.status(200).json({ status: "success", data });
  } catch (error) {
    responderError(res, error, "Error al actualizar estado:", {
      error: "Error interno al actualizar el estado",
    });
  }
};

export const deleteTurno = async (req, res) => {
  try {
    await turnoService.alternarActivo(req.turno);
    res.status(200).json({ message: "Turno eliminado correctamente" });
  } catch (error) {
    responderError(res, error, "Error al eliminar el turno:", {
      error: "Error al eliminar el turno",
    });
  }
};
