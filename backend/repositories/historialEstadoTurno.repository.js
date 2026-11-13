/** @format */

import { HistorialEstadoTurno } from "../models/index.model.js";

/** Registra un cambio de estado de un turno (siempre dentro de una transacción). */
export const registrar = (id_turno, id_estado, descripcion, transaction) =>
  HistorialEstadoTurno.create(
    {
      id_turno,
      id_estado,
      fecha_hora_cambio: new Date(),
      descripcion,
    },
    { transaction },
  );

