/** @format */

export const CONFIG_STORAGE_KEY = "consultorio_config_horarios_v1";
export const RESTRICCIONES_STORAGE_KEY = "consultorio_restricciones_agenda_v1";

export const CONFIG_DEFAULT = {
  horaInicio: "08:00",
  horaFin: "18:00",
  intervaloMinutos: 30,
  diasLaborales: [1, 2, 3, 4, 5], // Lunes a Viernes por defecto (0 = Dom, 6 = Sáb)
  umbralBaja: 50,
  umbralMedia: 80,
};

export const formatearFechaStr = (fecha) => {
  if (!fecha) return "";
  if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return fecha;
  }
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * Normaliza un registro de restricción proveniente de MySQL o de localStorage
 * para que toda la UI opere con propiedades uniformes en camelCase.
 */
export const normalizarRestriccion = (item) => {
  if (!item) return null;
  const id = item.id_restriccion ?? item.id ?? `${Date.now()}-${Math.random()}`;
  const fechaInicio = String(
    item.fecha_inicio ?? item.fechaInicio ?? item.fecha ?? "",
  ).slice(0, 10);
  const fechaFin = String(
    item.fecha_fin ?? item.fechaFin ?? fechaInicio,
  ).slice(0, 10);
  const todoElDia = Boolean(item.todo_el_dia ?? item.todoElDia ?? false);
  const horaInicioRaw = item.hora_inicio ?? item.horaInicio ?? null;
  const horaFinRaw = item.hora_fin ?? item.horaFin ?? null;

  return {
    id,
    id_restriccion: item.id_restriccion ?? item.id ?? null,
    fechaInicio,
    fechaFin: fechaFin || fechaInicio,
    todoElDia,
    horaInicio:
      !todoElDia && horaInicioRaw ? String(horaInicioRaw).slice(0, 5) : null,
    horaFin: !todoElDia && horaFinRaw ? String(horaFinRaw).slice(0, 5) : null,
    motivo: item.motivo || "Horario bloqueado",
  };
};

export const cargarConfigLocal = () => {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return CONFIG_DEFAULT;
    const parsed = JSON.parse(raw);
    return {
      ...CONFIG_DEFAULT,
      ...parsed,
      diasLaborales: Array.isArray(parsed.diasLaborales)
        ? parsed.diasLaborales.map(Number)
        : CONFIG_DEFAULT.diasLaborales,
      umbralBaja: Number(parsed.umbralBaja ?? CONFIG_DEFAULT.umbralBaja),
      umbralMedia: Number(parsed.umbralMedia ?? CONFIG_DEFAULT.umbralMedia),
      intervaloMinutos: Number(
        parsed.intervaloMinutos ?? CONFIG_DEFAULT.intervaloMinutos,
      ),
    };
  } catch {
    return CONFIG_DEFAULT;
  }
};

export const cargarRestriccionesLocal = () => {
  try {
    const raw = localStorage.getItem(RESTRICCIONES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map(normalizarRestriccion).filter(Boolean)
      : [];
  } catch {
    return [];
  }
};

