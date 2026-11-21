/** @format */

import { obtenerFeriados } from "../services/feriados/feriado.service.js";

export const getFeriados = async (req, res) => {
  const anio = Number(req.params.anio);
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    return res.status(400).json({ error: "El año no es válido." });
  }
  try {
    const feriados = await obtenerFeriados(anio);
    res.status(200).json({ status: "success", data: feriados });
  } catch (error) {
    console.error("Error al obtener los feriados:", error);
    res.status(500).json({ error: "Error al obtener los feriados" });
  }
};
