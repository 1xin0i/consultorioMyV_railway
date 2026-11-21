/** @format */

import { formatearFechaStr } from "./normalizarRestriccion";

export const esDiaLaboralFecha = (fecha, diasLaborales = []) => {
  if (!fecha) return true;
  const d =
    fecha instanceof Date
      ? fecha
      : typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha)
        ? new Date(`${fecha}T00:00:00`)
        : new Date(fecha);
  if (isNaN(d.getTime())) return true;
  return diasLaborales.includes(d.getDay());
};

export const esDiaBloqueadoFecha = (fecha, restricciones = []) => {
  const fStr = formatearFechaStr(fecha);
  if (!fStr) return false;
  return restricciones.some(
    (r) => r.todoElDia && fStr >= r.fechaInicio && fStr <= r.fechaFin,
  );
};

export const obtenerRestriccionDiaFecha = (fecha, restricciones = []) => {
  const fStr = formatearFechaStr(fecha);
  if (!fStr) return null;
  return (
    restricciones.find(
      (r) => r.todoElDia && fStr >= r.fechaInicio && fStr <= r.fechaFin,
    ) || null
  );
};

export const esSlotBloqueadoFecha = (fecha, horaStr, restricciones = []) => {
  const fStr = formatearFechaStr(fecha);
  if (!fStr) return false;

  return restricciones.some((r) => {
    const enRangoFecha = fStr >= r.fechaInicio && fStr <= r.fechaFin;
    if (!enRangoFecha) return false;
    if (r.todoElDia) return true;
    return horaStr >= r.horaInicio && horaStr < r.horaFin;
  });
};

export const obtenerRestriccionSlotFecha = (
  fecha,
  horaStr,
  restricciones = [],
) => {
  const fStr = formatearFechaStr(fecha);
  if (!fStr) return null;

  return (
    restricciones.find((r) => {
      const enRangoFecha = fStr >= r.fechaInicio && fStr <= r.fechaFin;
      if (!enRangoFecha) return false;
      if (r.todoElDia) return true;
      return horaStr >= r.horaInicio && horaStr < r.horaFin;
    }) || null
  );
};

export const obtenerRestriccionesDeFechaList = (fecha, restricciones = []) => {
  const fStr = formatearFechaStr(fecha);
  if (!fStr) return [];
  return restricciones.filter(
    (r) => fStr >= r.fechaInicio && fStr <= r.fechaFin,
  );
};

/**
 * Valida si una fecha/hora de inicio y duración caen dentro de un día laboral,
 * dentro del horario de apertura/cierre del consultorio y sin chocar con bloqueos activos.
 */
export const validarTurnoHorarioConfig = (
  fechaHoraInicioStr,
  duracionMinutos = 30,
  configuracion,
  restricciones = [],
) => {
  if (!fechaHoraInicioStr) return { valido: true, mensaje: "" };
  const inicio = new Date(fechaHoraInicioStr);
  if (isNaN(inicio.getTime())) return { valido: true, mensaje: "" };

  const duracion = Number(duracionMinutos) || 30;
  const fin = new Date(inicio.getTime() + duracion * 60000);

  if (!configuracion.diasLaborales.includes(inicio.getDay())) {
    const nombresDias = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    return {
      valido: false,
      motivo: `Día no laboral (${nombresDias[inicio.getDay()]})`,
      mensaje: `El día seleccionado (${nombresDias[inicio.getDay()]}) está configurado como día no laboral.`,
    };
  }

  const fStr = formatearFechaStr(inicio);
  const restrDia = restricciones.find(
    (r) => r.todoElDia && fStr >= r.fechaInicio && fStr <= r.fechaFin,
  );
  if (restrDia) {
    return {
      valido: false,
      motivo: restrDia.motivo || "Día sin atención",
      mensaje: `El día seleccionado está marcado sin atención (${restrDia.motivo}).`,
    };
  }

  const [hIniConf, mIniConf] = (configuracion.horaInicio || "08:00")
    .split(":")
    .map(Number);
  const [hFinConf, mFinConf] = (configuracion.horaFin || "18:00")
    .split(":")
    .map(Number);

  const minApertura = hIniConf * 60 + (mIniConf || 0);
  const minCierre = hFinConf * 60 + (mFinConf || 0);

  const minTurnoIni = inicio.getHours() * 60 + inicio.getMinutes();
  const minTurnoFin = minTurnoIni + duracion;

  if (minTurnoIni < minApertura || minTurnoFin > minCierre) {
    return {
      valido: false,
      motivo: `Fuera de horario de atención (${configuracion.horaInicio} a ${configuracion.horaFin} hs)`,
      mensaje: `El horario del turno debe estar dentro de la jornada laboral (${configuracion.horaInicio} a ${configuracion.horaFin} hs).`,
    };
  }

  const horaTurnoIniStr = `${String(inicio.getHours()).padStart(2, "0")}:${String(inicio.getMinutes()).padStart(2, "0")}`;
  const horaTurnoFinStr = `${String(fin.getHours()).padStart(2, "0")}:${String(fin.getMinutes()).padStart(2, "0")}`;

  const restrFranja = restricciones.find((r) => {
    if (r.todoElDia) return false;
    if (fStr < r.fechaInicio || fStr > r.fechaFin) return false;
    return horaTurnoIniStr < r.horaFin && horaTurnoFinStr > r.horaInicio;
  });

  if (restrFranja) {
    return {
      valido: false,
      motivo: `${restrFranja.motivo} (${restrFranja.horaInicio} a ${restrFranja.horaFin} hs)`,
      mensaje: `El horario coincide con una franja sin atención: "${restrFranja.motivo}" (${restrFranja.horaInicio} a ${restrFranja.horaFin} hs).`,
    };
  }

  return { valido: true, mensaje: "" };
};

export const calcularMetricasJornada = (configuracion) => {
  const [hIni, mIni] = (configuracion.horaInicio || "08:00")
    .split(":")
    .map(Number);
  const [hFin, mFin] = (configuracion.horaFin || "18:00")
    .split(":")
    .map(Number);

  const minTotales = Math.max(
    60,
    hFin * 60 + (mFin || 0) - (hIni * 60 + (mIni || 0)),
  );
  const horasJornada = Math.max(1, Math.round((minTotales / 60) * 10) / 10);
  const intervalo = Number(configuracion.intervaloMinutos) || 30;
  const modulosTotales = Math.max(1, Math.floor(minTotales / intervalo));

  const corteBajaModulos = Math.max(
    1,
    Math.floor((modulosTotales * configuracion.umbralBaja) / 100),
  );
  const corteMediaModulos = Math.max(
    corteBajaModulos + 1,
    Math.floor((modulosTotales * configuracion.umbralMedia) / 100),
  );

  return {
    horaInicioNum: isNaN(hIni) ? 8 : hIni,
    horaFinNum: isNaN(hFin) ? 18 : hFin,
    minutosJornada: minTotales,
    horasJornada,
    modulosTotales,
    corteBajaModulos,
    corteMediaModulos,
  };
};


const aMinutos = (horaStr, fallback = 0) => {
  if (!horaStr) return fallback;
  const [h, m] = String(horaStr).split(":").map(Number);
  return isNaN(h) ? fallback : h * 60 + (m || 0);
};

/**
 * Minutos de la jornada de un día que quedan sin atención por franjas horarias
 * (por ejemplo, de 9:00 a 13:00). Las franjas que se superponen se cuentan una sola vez.
 */
export const minutosSinAtencionFranjas = (
  fecha,
  restricciones = [],
  configuracion = {},
) => {
  const fStr = formatearFechaStr(fecha);
  if (!fStr) return 0;
  const apertura = aMinutos(configuracion.horaInicio, 8 * 60);
  const cierre = aMinutos(configuracion.horaFin, 18 * 60);

  const tramos = restricciones
    .filter((r) => !r.todoElDia && fStr >= r.fechaInicio && fStr <= r.fechaFin)
    .map((r) => [
      Math.max(apertura, aMinutos(r.horaInicio, apertura)),
      Math.min(cierre, aMinutos(r.horaFin, cierre)),
    ])
    .filter(([a, b]) => b > a)
    .sort((x, y) => x[0] - y[0]);

  let total = 0;
  let finActual = -1;
  for (const [a, b] of tramos) {
    if (a >= finActual) {
      total += b - a;
      finActual = b;
    } else if (b > finActual) {
      total += b - finActual;
      finActual = b;
    }
  }
  return total;
};

/**
 * Indica si un turno quedó en un horario sin atención: día no laboral,
 * día completo sin atención (incluye feriados) o franja horaria sin atención.
 */
export const turnoEnHorarioSinAtencionFecha = (
  turno,
  restricciones = [],
  diasLaborales = [],
) => {
  if (!turno?.fecha_hora_inicio) return false;
  const inicio = new Date(turno.fecha_hora_inicio);
  if (isNaN(inicio.getTime())) return false;
  const fin = turno.fecha_hora_fin
    ? new Date(turno.fecha_hora_fin)
    : new Date(inicio.getTime() + (Number(turno.duracion_minutos) || 30) * 60000);

  if (diasLaborales.length > 0 && !diasLaborales.includes(inicio.getDay())) {
    return true;
  }

  const fStr = formatearFechaStr(inicio);
  const hIni = inicio.getHours() * 60 + inicio.getMinutes();
  const hFin = hIni + Math.max(1, Math.round((fin - inicio) / 60000));

  return restricciones.some((r) => {
    if (fStr < r.fechaInicio || fStr > r.fechaFin) return false;
    if (r.todoElDia) return true;
    return hIni < aMinutos(r.horaFin) && hFin > aMinutos(r.horaInicio);
  });
};

