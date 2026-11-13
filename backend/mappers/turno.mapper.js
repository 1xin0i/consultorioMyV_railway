/** @format */

import { formatearSolicitudConSaldos } from "./solicitudCobro.mapper.js";

/**
 * Convierte un Turno (con SolicitudCobro incluida) al formato de respuesta de la API.
 * `Cobro` es un alias histórico de `SolicitudCobro` que el frontend sigue usando.
 */
export const formatearTurnoConCobro = (turnoInstance) => {
  const plain = turnoInstance.get({ plain: true });
  const solicitud = plain.SolicitudCobro
    ? formatearSolicitudConSaldos(plain.SolicitudCobro)
    : null;
  return {
    ...plain,
    SolicitudCobro: solicitud,
    Cobro: solicitud,
  };
};

