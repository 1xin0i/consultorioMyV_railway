/** @format */

import { responderError } from "../errors/AppError.js";
import * as categoriaGastoService from "../services/gastos/categoriaGasto.service.js";

export const getAllCategoriasGastos = async (req, res) => {
  try {
    const { data, meta } = await categoriaGastoService.listarPaginado(
      req.query,
    );
    res.status(200).json({ status: "success", data, meta });
  } catch (error) {
    responderError(res, error, "Error al obtener las categorías de gastos:", {
      status: "error",
      message: "Error al obtener las categorías de gastos",
      error: error.message,
    });
  }
};

export const getCategoriaGastoById = async (req, res) => {
  try {
    res.status(200).json({ status: "success", data: req.categoriaGasto });
  } catch (error) {
    responderError(res, error, "Error al obtener la categoría de gasto:", {
      error: "Error al obtener la categoría de gasto",
    });
  }
};

export const createCategoriaGasto = async (req, res) => {
  try {
    const data = await categoriaGastoService.crear(req.body);
    res.status(201).json({ status: "success", data });
  } catch (error) {
    responderError(res, error, "Error al crear la categoría de gasto:", {
      error: "Error al crear la categoría de gasto",
    });
  }
};

export const updateCategoriaGasto = async (req, res) => {
  try {
    const data = await categoriaGastoService.actualizar(
      req.categoriaGasto,
      req.body,
    );
    res.status(200).json({ status: "success", data });
  } catch (error) {
    responderError(res, error, "Error al actualizar la categoría de gasto:", {
      error: "Error al actualizar la categoría de gasto",
    });
  }
};

export const deleteCategoriaGasto = async (req, res) => {
  try {
    await categoriaGastoService.alternarActivo(req.categoriaGasto);
    res
      .status(200)
      .json({ message: "Estado de la categoría actualizado correctamente" });
  } catch (error) {
    responderError(
      res,
      error,
      "Error al cambiar estado de la categoría de gasto:",
      {
        error: "Error al actualizar el estado de la categoría",
      },
    );
  }
};
