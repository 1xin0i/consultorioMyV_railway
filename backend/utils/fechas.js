/** @format */

export const rangoDeAnio = (anio) => ({
  inicio: new Date(anio, 0, 1, 0, 0, 0, 0),
  fin: new Date(anio, 11, 31, 23, 59, 59, 999),
});

export const rangoDeAnioMes = (anio, mes) => ({
  inicio: new Date(anio, mes - 1, 1, 0, 0, 0, 0),
  fin: new Date(anio, mes, 0, 23, 59, 59, 999),
});

/**
 * Convierte "YYYY-MM" en el rango [primer instante, último instante] de ese mes (hora local).
 * Devuelve null si el formato no es válido.
 */
export const rangoDeMes = (mesStr) => {
  const partes = mesStr.split("-");
  if (partes.length !== 2) return null;

  const year = parseInt(partes[0], 10);
  const month = parseInt(partes[1], 10);
  if (isNaN(year) || isNaN(month)) return null;

  return rangoDeAnioMes(year, month);
};

/**
 * Resuelve el período de consulta (mensual, anual o rango explícito)
 * a partir de los query params de Caja.
 */
export const resolverPeriodo = (query = {}) => {
  let fechaDesde = query.fecha_desde || query.fechaDesde || query.fechaInicio;
  let fechaHasta = query.fecha_hasta || query.fechaHasta || query.fechaFin;
  let mes = query.mes ? parseInt(query.mes, 10) : null;
  let anio = query.anio ? parseInt(query.anio, 10) : null;

  const hoy = new Date();
  if (!anio) anio = hoy.getFullYear();

  const esAnual =
    query.periodo === "anio" ||
    query.periodo === "todos" ||
    query.mes === "todos" ||
    query.tipo_periodo === "anio";

  if (!fechaDesde || !fechaHasta) {
    if (esAnual) {
      ({ inicio: fechaDesde, fin: fechaHasta } = rangoDeAnio(anio));
    } else {
      if (!mes) mes = hoy.getMonth() + 1;
      ({ inicio: fechaDesde, fin: fechaHasta } = rangoDeAnioMes(anio, mes));
    }
  } else {
    if (fechaDesde && !(fechaDesde instanceof Date)) {
      const d = new Date(fechaDesde);
      if (!isNaN(d.getTime())) {
        d.setHours(0, 0, 0, 0);
        fechaDesde = d;
      }
    }
    if (fechaHasta && !(fechaHasta instanceof Date)) {
      const d = new Date(fechaHasta);
      if (!isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        fechaHasta = d;
      }
    }
  }

  return {
    mes: esAnual ? null : mes,
    anio,
    fechaDesde,
    fechaHasta,
    esAnual,
    esTodos: esAnual,
  };
};
