/** @format */

import { responderError } from "../errors/AppError.js";
import * as cobroService from "../services/cobros/cobro.service.js";
import * as solicitudCobroService from "../services/cobros/solicitudCobro.service.js";
import * as pagoService from "../services/cobros/pago.service.js";

export const getCobroByTurnoId = async (req, res) => {
  try {
    const data = await solicitudCobroService.obtenerPorTurno(
      req.params.turnoId,
    );
    return res.status(200).json({ status: "success", data });
  } catch (error) {
    return responderError(res, error, "Error al obtener cobros por turno:", {
      error: "Error al obtener cobros por turno",
    });
  }
};

export const getAllCobros = async (req, res) => {
  try {
    const { data, meta } = await cobroService.listarPaginado(req.query);
    return res.status(200).json({ status: "success", data, meta });
  } catch (error) {
    return responderError(res, error, "Error al obtener los cobros:", {
      error: "Error al obtener los cobros",
    });
  }
};

export const getCobroById = async (req, res) => {
  try {
    const data = await cobroService.obtenerPorId(req.params.id);
    return res.status(200).json({ status: "success", data });
  } catch (error) {
    return responderError(res, error, "Error al obtener el cobro:", {
      error: "Error al obtener el cobro",
    });
  }
};

export const createCobro = async (req, res) => {
  try {
    const data = await solicitudCobroService.crearSolicitud(req.body, {
      turno: req.turno,
      paciente: req.paciente,
    });
    return res.status(201).json({ status: "success", data });
  } catch (error) {
    return responderError(res, error, "Error al crear la solicitud de cobro:", {
      error: "Error al crear la solicitud de cobro",
    });
  }
};

export const updateCobro = async (req, res) => {
  try {
    const data = await cobroService.actualizar(req.params.id, req.body);
    return res.status(200).json({ status: "success", data });
  } catch (error) {
    return responderError(res, error, "Error al actualizar el cobro:", {
      error: "Error al actualizar el cobro",
    });
  }
};

export const createCobroInmediato = async (req, res) => {
  try {
    const data = await pagoService.registrarCobroInmediato(req.body, {
      turno: req.turno,
      paciente: req.paciente,
    });
    return res.status(201).json({
      status: "success",
      data,
      message: "Cobro registrado correctamente.",
    });
  } catch (error) {
    return responderError(res, error, "Error al crear cobro inmediato:", {
      error: "Error al procesar el cobro inmediato.",
    });
  }
};

export const createCobroInformal = async (req, res) => {
  try {
    const data = await pagoService.registrarCobroInformal(req.body, {
      turno: req.turno,
      paciente: req.paciente,
    });
    return res.status(201).json({
      status: "success",
      data,
      message: "Solicitud de cobro registrada correctamente.",
    });
  } catch (error) {
    return responderError(
      res,
      error,
      "Error al registrar solicitud de cobro:",
      {
        error: "Error al registrar la solicitud de cobro.",
      },
    );
  }
};

export const registrarPagoTurno = async (req, res) => {
  try {
    const { message, data } = await pagoService.registrarPagoTurno(req.body);
    return res.status(200).json({ status: "success", message, data });
  } catch (error) {
    return responderError(res, error, "Error al registrar pago:", {
      status: "error",
      message: "Error al registrar el cobro.",
    });
  }
};

export const deleteCobro = async (req, res) => {
  try {
    await cobroService.eliminar(req.params.id);
    return res
      .status(200)
      .json({ status: "success", message: "Cobro eliminado correctamente" });
  } catch (error) {
    return responderError(res, error, "Error al eliminar el cobro:", {
      error: "Error al eliminar el cobro",
    });
  }
};
