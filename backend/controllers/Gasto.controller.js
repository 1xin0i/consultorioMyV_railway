/** @format */

import { responderError } from "../errors/AppError.js";
import * as gastoService from "../services/gastos/gasto.service.js";

export const getAllGastos = async (req, res) => {
  try {
    const { data, meta } = await gastoService.listarPaginado(req.query);
    res.status(200).json({ status: "success", data, meta });
  } catch (error) {
    responderError(res, error, "Error al obtener los gastos:", {
      status: "error",
      message: "Error al obtener los gastos",
      error: error.message,
    });
  }
};

export const getGastoById = async (req, res) => {
  try {
    res.status(200).json({ status: "success", data: req.gasto });
  } catch (error) {
    responderError(res, error, "Error al obtener el gasto:", {
      error: "Error al obtener el gasto",
    });
  }
};

export const createGasto = async (req, res) => {
  try {
    const data = await gastoService.crear(req.body);
    res.status(201).json({ status: "success", data });
  } catch (error) {
    responderError(res, error, "Error al crear el gasto:", {
      error: "Error al crear el gasto",
    });
  }
};

export const updateGasto = async (req, res) => {
  try {
    const data = await gastoService.actualizar(req.gasto, req.body);
    res.status(200).json({ status: "success", data });
  } catch (error) {
    responderError(res, error, "Error al actualizar el gasto:", {
      error: "Error al actualizar el gasto",
    });
  }
};

export const deleteGasto = async (req, res) => {
  try {
    await gastoService.alternarActivo(req.gasto);
    res.status(200).json({ message: "Gasto actualizado correctamente" });
  } catch (error) {
    responderError(res, error, "Error al eliminar el gasto:", {
      error: "Error al eliminar el gasto",
    });
  }
};
