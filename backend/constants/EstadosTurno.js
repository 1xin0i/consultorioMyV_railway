/** @format */

export const ESTADOS = Object.freeze({
  PROGRAMADO: 1,
  ATENDIDO: 2,
  CANCELADO: 3,
  INASISTENTE: 4,
});

/**
 * Alias aceptados por el query param `estadoFiltrado` de GET /api/turnos
 * (singular, plural y sinónimos) -> id de estado.
 */
export const ESTADO_POR_FILTRO = Object.freeze({
  programado: ESTADOS.PROGRAMADO,
  programados: ESTADOS.PROGRAMADO,
  atendido: ESTADOS.ATENDIDO,
  atendidos: ESTADOS.ATENDIDO,
  cancelado: ESTADOS.CANCELADO,
  cancelados: ESTADOS.CANCELADO,
  inasistido: ESTADOS.INASISTENTE,
  inasistidos: ESTADOS.INASISTENTE,
  inasistente: ESTADOS.INASISTENTE,
  inasistentes: ESTADOS.INASISTENTE,
});
