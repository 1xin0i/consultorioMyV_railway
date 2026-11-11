/** @format */

import { Clock, CheckCircle2, XCircle, UserRoundX } from "lucide-react";

/**
 * Retorna los estilos visuales, badges e iconos según el estado del turno.
 */
export const OBTENER_ESTILOS_ESTADO = (estado) => {
  const nombreEstado = (estado || "").toLowerCase();

  if (nombreEstado.includes("programado")) {
    return {
      bg: "bg-amber-50/95 dark:bg-amber-950/80 hover:bg-amber-100/90 dark:hover:bg-amber-900/80",
      border: "border-amber-300 dark:border-amber-700/80",
      text: "text-amber-900 dark:text-amber-100",
      badge: "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300/60 dark:border-amber-700/60",
      indicator: "bg-amber-500",
      icon: Clock,
    };
  }
  if (nombreEstado.includes("atendido")) {
    return {
      bg: "bg-emerald-50/95 dark:bg-emerald-950/80 hover:bg-emerald-100/90 dark:hover:bg-emerald-900/80",
      border: "border-emerald-300 dark:border-emerald-700/80",
      text: "text-emerald-900 dark:text-emerald-100",
      badge: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300/60 dark:border-emerald-700/60",
      indicator: "bg-emerald-500",
      icon: CheckCircle2,
    };
  }
  if (nombreEstado.includes("cancelado")) {
    return {
      bg: "bg-rose-50/95 dark:bg-rose-950/80 hover:bg-rose-100/90 dark:hover:bg-rose-900/80",
      border: "border-rose-300 dark:border-rose-700/80",
      text: "text-rose-900 dark:text-rose-100",
      badge: "bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-300/60 dark:border-rose-700/60",
      indicator: "bg-rose-500",
      icon: XCircle,
    };
  }
  if (nombreEstado.includes("inasistente") || nombreEstado.includes("inasistido")) {
    return {
      bg: "bg-[#f0f6f9]/95 dark:bg-[#162d38] hover:bg-[#e4eff4] dark:hover:bg-[#1f3d4c]",
      border: "border-[#93BBCF] dark:border-[#3B7A94]",
      text: "text-[#2b5d73] dark:text-[#a5d2e6]",
      badge: "bg-[#dce9f0] dark:bg-[#1d3846] text-[#244f62] dark:text-[#bde0f0] border-[#93BBCF]/60 dark:border-[#3B7A94]/60",
      indicator: "bg-[#3B7A94]",
      icon: UserRoundX,
    };
  }

  return {
    bg: "bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700",
    border: "border-gray-200 dark:border-slate-700",
    text: "text-gray-800 dark:text-slate-200",
    badge: "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700",
    indicator: "bg-gray-400",
    icon: Clock,
  };
};

/**
 * Retorna los estilos visuales de ocupación diaria para la vista mensual.
 * Mantiene las celdas limpias y neutrales para no confundir con días seleccionados.
 */
export const OBTENER_ESTILOS_OCUPACION_MES = (porcentaje) => {
  if (porcentaje === 0) {
    return {
      dotColor: "bg-gray-300 dark:bg-slate-600",
      barColor: "bg-transparent",
      badgeColor: "text-gray-400 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700",
      etiqueta: "Sin turnos",
    };
  }
  if (porcentaje < 60) {
    return {
      dotColor: "bg-emerald-500",
      barColor: "bg-emerald-500",
      badgeColor: "text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-800/60",
      etiqueta: `${porcentaje}%`,
    };
  }
  if (porcentaje >= 60 && porcentaje < 85) {
    return {
      dotColor: "bg-amber-500",
      barColor: "bg-amber-500",
      badgeColor: "text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60",
      etiqueta: `${porcentaje}%`,
    };
  }
  return {
    dotColor: "bg-rose-500",
    barColor: "bg-rose-500",
    badgeColor: "text-rose-800 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60",
    etiqueta: `${porcentaje}%`,
  };
};

/* ─── CONSTANTES DE GRILLA Y SLOTS ─────────────────────────────── */
export const SLOT_HEIGHT_DIA = 64; // px por slot de 30 min en día (permite visualizar nombre, horario y estado sin recortes)
export const SLOT_HEIGHT_SEMANA = 44; // px por slot de 30 min en semana
export const HORA_INICIO_AGENDA = 8; // La agenda arranca a las 08:00 hs
export const HORA_FIN_AGENDA = 20; // Hora de cierre por defecto

/**
 * Genera la lista de slots de horarios dinámicamente según la configuración de la jornada.
 */
export const GENERAR_HORAS = (horaInicio = 8, horaFin = 20, intervaloMinutos = 30) => {
  const horas = [];
  const hInicio = Number(horaInicio) || 8;
  const hFin = Number(horaFin) || 20;
  
  for (let h = hInicio; h <= hFin; h++) {
    const horaStr = h.toString().padStart(2, "0");
    horas.push(`${horaStr}:00`);
    if (h < hFin && intervaloMinutos <= 30) {
      horas.push(`${horaStr}:30`);
    }
  }
  return horas;
};

export const SLOTS_HORAS = GENERAR_HORAS(HORA_INICIO_AGENDA, HORA_FIN_AGENDA);

/* ─── HELPERS DE FECHA Y HORAS ──────────────────────────────────── */
export const esMismoDia = (fecha1, fecha2) => {
  if (!fecha1 || !fecha2) return false;
  const d1 = new Date(fecha1);
  const d2 = new Date(fecha2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const formatHoraSimple = (fechaStr) => {
  if (!fechaStr) return "";
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return "";
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
};

/* ─── CÁLCULO DE POSICIONAMIENTO Y COLISIONES DE TURNOS ─────────── */
export const getTurnoPosicion = (turno, slotHeight, horaInicioAgenda = HORA_INICIO_AGENDA) => {
  const inicio = new Date(turno.fecha_hora_inicio);
  const fin = new Date(turno.fecha_hora_fin);

  const inicioMinutos =
    (inicio.getHours() - horaInicioAgenda) * 60 + inicio.getMinutes();

  let finMinutos =
    (fin.getHours() - horaInicioAgenda) * 60 + fin.getMinutes();

  if (isNaN(finMinutos) || finMinutos <= inicioMinutos) {
    finMinutos = inicioMinutos + (Number(turno.duracion_minutos) || 30);
  }

  const duracionMinutos = Math.max(15, finMinutos - inicioMinutos);
  const pxPorMinuto = slotHeight / 30;

  const top = Math.max(0, inicioMinutos * pxPorMinuto);
  // Restamos 3px para dejar separación visual con la siguiente línea divisoria
  const height = Math.max(slotHeight - 4, duracionMinutos * pxPorMinuto - 3);

  return { top, height, duracionMinutos };
};

export const procesarTurnosColocacion = (turnosDelDia, slotHeight, horaInicioAgenda = HORA_INICIO_AGENDA) => {
  if (!turnosDelDia || turnosDelDia.length === 0) return [];

  const turnosConPos = turnosDelDia.map((turno) => {
    const { top, height, duracionMinutos } = getTurnoPosicion(
      turno,
      slotHeight,
      horaInicioAgenda,
    );
    return {
      turno,
      top,
      height,
      bottom: top + height,
      duracionMinutos,
    };
  });

  // Ordenar por hora de inicio ascendente
  turnosConPos.sort((a, b) => a.top - b.top || b.height - a.height);

  return turnosConPos.map((item) => {
    // Detectar turnos que se solapan en tiempo
    const solapados = turnosConPos.filter(
      (otro) =>
        Math.max(item.top, otro.top) < Math.min(item.bottom, otro.bottom),
    );

    const totalCols = Math.max(1, solapados.length);
    const colIdx = solapados.findIndex(
      (s) => s.turno.id_turno === item.turno.id_turno,
    );
    const safeColIdx = colIdx >= 0 ? colIdx : 0;

    const widthPercent = 100 / totalCols;
    const leftPercent = safeColIdx * widthPercent;

    return {
      ...item,
      style: {
        top: `${item.top}px`,
        height: `${item.height}px`,
        width: `calc(${widthPercent}% - 6px)`,
        left: `calc(${leftPercent}% + 3px)`,
      },
    };
  });
};
