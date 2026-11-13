/** @format */

import { responderError } from "../errors/AppError.js";
import * as cajaService from "../services/caja/caja.service.js";

export const getCajaConsolidada = async (req, res) => {
  try {
    const { data, meta } = await cajaService.obtenerCajaConsolidada(req.query);
    res.status(200).json({ status: "success", data, meta });
  } catch (error) {
    responderError(
      res,
      error,
      "Error al obtener los datos consolidados de caja:",
      {
        error: "Error interno al obtener los datos de la caja",
      },
    );
  }
};
