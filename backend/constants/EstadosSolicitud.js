/** @format */

export const ESTADOS_SOLICITUD = Object.freeze({
  PENDIENTE: "pendiente",
  PARCIAL: "parcial",
  SALDADO: "saldado",
});

export const ESTADOS_SOLICITUD_CON_SALDO = Object.freeze([
  ESTADOS_SOLICITUD.PENDIENTE,
  ESTADOS_SOLICITUD.PARCIAL,
]);

/** Tolerancia de centavos para considerar un saldo cancelado. */
export const EPSILON_SALDO = 0.009;

