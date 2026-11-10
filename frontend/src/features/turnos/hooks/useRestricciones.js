/** @format */

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { validarBloqueoConTurnos } from "../utils/validacionesTurno";

const RESTRICCIONES_STORAGE_KEY = "myv_restricciones_agenda";

/**
 * Normaliza y extrae fechaKey ("YYYY-MM-DD") y horaHHMM ("HH:mm")
 * de cualquier representación (string local "YYYY-MM-DDTHH:mm", ISO o Date).
 */
export const extraerFechaYHora = (fechaInput) => {
  if (!fechaInput) return { fechaKey: "", horaHHMM: "" };

  if (typeof fechaInput === "string") {
    const str = fechaInput.trim();
    // Caso: string de solo fecha "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return { fechaKey: str, horaHHMM: "" };
    }
    // Caso: string local "YYYY-MM-DDTHH:mm" o "YYYY-MM-DD HH:mm" sin sufijo Z
    if (/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}/.test(str) && !str.endsWith("Z")) {
      const fechaKey = str.slice(0, 10);
      const horaHHMM = str.slice(11, 16);
      return { fechaKey, horaHHMM };
    }
  }

  const d = new Date(fechaInput);
  if (isNaN(d.getTime())) return { fechaKey: "", horaHHMM: "" };

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const fechaKey = `${y}-${m}-${day}`;

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const horaHHMM = `${hh}:${mm}`;

  return { fechaKey, horaHHMM };
};

/**
 * Deduplica un listado de restricciones por clave única (fechas, tipo, horas, motivo).
 */
const deduplicarRestricciones = (lista) => {
  if (!Array.isArray(lista)) return [];
  const mapa = new Map();
  lista.forEach((r) => {
    if (!r || !r.fechaInicio) return;
    const fFin = r.fechaFin || r.fechaInicio;
    const clave = `${r.fechaInicio}_${fFin}_${Boolean(r.todoElDia)}_${r.horaInicio || ""}_${r.horaFin || ""}_${(r.motivo || "").trim().toLowerCase()}`;
    if (!mapa.has(clave)) {
      mapa.set(clave, r);
    }
  });
  return Array.from(mapa.values());
};

/**
 * Hook para gestionar las restricciones / bloqueos de agenda
 * (ausencias, vacaciones, franjas horarias no disponibles).
 */
export const useRestricciones = () => {
  const [restricciones, setRestricciones] = useState(() => {
    try {
      const stored = localStorage.getItem(RESTRICCIONES_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return deduplicarRestricciones(parsed);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        RESTRICCIONES_STORAGE_KEY,
        JSON.stringify(restricciones),
      );
    } catch (err) {
      console.warn("No se pudo guardar restricciones en localStorage:", err);
    }
  }, [restricciones]);

  // Formato "YYYY-MM-DD" en zona horaria local
  const formatearFechaStr = (f) => {
    if (!f) return "";
    return extraerFechaYHora(f).fechaKey;
  };

  /**
   * Guarda una nueva restricción verificando estrictamente que no exista duplicación o solapamiento.
   */
  const agregarRestriccion = useCallback(
    (nueva, turnosList = []) => {
      if (Array.isArray(turnosList) && turnosList.length > 0) {
        const conflictoConTurnos = validarBloqueoConTurnos(nueva, turnosList);
        if (conflictoConTurnos) {
          toast.error(conflictoConTurnos.mensaje, { icon: "⚠️", duration: 5000 });
          return null;
        }
      }
      const fIniStr = nueva.fechaInicio;
      const fFinStr = nueva.fechaFin || fIniStr;

      // Control estricto de duplicados
      const existeConflicto = restricciones.some((r) => {
        // Si una de las dos es día completo y se solapan las fechas:
        if (nueva.todoElDia || r.todoElDia) {
          return r.fechaInicio <= fFinStr && r.fechaFin >= fIniStr;
        }
        // Si ambas son franjas horarias en fechas que se solapan:
        if (r.fechaInicio <= fFinStr && r.fechaFin >= fIniStr) {
          if (nueva.horaInicio && nueva.horaFin && r.horaInicio && r.horaFin) {
            return nueva.horaInicio < r.horaFin && nueva.horaFin > r.horaInicio;
          }
          return true;
        }
        return false;
      });

      if (existeConflicto) {
        toast.error("Ya existe un bloqueo activo para la fecha u horario seleccionado.", { icon: "🔒" });
        return null;
      }

      const item = {
        id: `rest_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        motivo: nueva.motivo?.trim() || "Bloqueado",
        todoElDia: Boolean(nueva.todoElDia),
        fechaInicio: nueva.fechaInicio,
        fechaFin: nueva.fechaFin || nueva.fechaInicio,
        horaInicio: nueva.todoElDia ? null : nueva.horaInicio || "08:00",
        horaFin: nueva.todoElDia ? null : nueva.horaFin || "10:00",
        creadoEl: new Date().toISOString(),
      };

      setRestricciones((prev) => [...prev, item]);
      return item;
    },
    [restricciones]
  );

  const eliminarRestriccion = useCallback((id) => {
    setRestricciones((prev) => prev.filter((r) => r.id !== id));
  }, []);

  /**
   * Verifica si un día completo está bloqueado (ignora franjas horarias)
   */
  const esDiaBloqueado = useCallback(
    (fecha) => {
      const { fechaKey } = extraerFechaYHora(fecha);
      if (!fechaKey) return false;
      return restricciones.some((r) => {
        const esCompleto = r.todoElDia || r.tipo === "dia_completo";
        if (!esCompleto) return false;
        return fechaKey >= r.fechaInicio && fechaKey <= r.fechaFin;
      });
    },
    [restricciones],
  );

  /**
   * Retorna la restricción de día completo si existe
   */
  const obtenerRestriccionDia = useCallback(
    (fecha) => {
      const { fechaKey } = extraerFechaYHora(fecha);
      if (!fechaKey) return null;
      return (
        restricciones.find((r) => {
          const esCompleto = r.todoElDia || r.tipo === "dia_completo";
          if (!esCompleto) return false;
          return fechaKey >= r.fechaInicio && fechaKey <= r.fechaFin;
        }) || null
      );
    },
    [restricciones],
  );

  /**
   * Verifica si un slot horario específico de un día está bloqueado
   */
  const esSlotBloqueado = useCallback(
    (fecha, horaStr) => {
      const { fechaKey } = extraerFechaYHora(fecha);
      const horaNorm = horaStr ? horaStr.padStart(5, "0") : "";

      return restricciones.some((r) => {
        if (fechaKey < r.fechaInicio || fechaKey > r.fechaFin) return false;
        if (r.todoElDia || !r.horaInicio) return true;
        if (r.horaInicio && r.horaFin && horaNorm) {
          const iniNorm = r.horaInicio.padStart(5, "0");
          const finNorm = r.horaFin.padStart(5, "0");
          return horaNorm >= iniNorm && horaNorm < finNorm;
        }
        return false;
      });
    },
    [restricciones],
  );

  /**
   * Retorna la restricción que afecta a un slot horario específico
   */
  const obtenerRestriccionSlot = useCallback(
    (fecha, horaStr) => {
      const { fechaKey } = extraerFechaYHora(fecha);
      const horaNorm = horaStr ? horaStr.padStart(5, "0") : "";

      return (
        restricciones.find((r) => {
          if (fechaKey < r.fechaInicio || fechaKey > r.fechaFin) return false;
          if (r.todoElDia || !r.horaInicio) return true;
          if (r.horaInicio && r.horaFin && horaNorm) {
            const iniNorm = r.horaInicio.padStart(5, "0");
            const finNorm = r.horaFin.padStart(5, "0");
            return horaNorm >= iniNorm && horaNorm < finNorm;
          }
          return false;
        }) || null
      );
    },
    [restricciones],
  );

  /**
   * Retorna todas las restricciones activas en una fecha determinada (día completo o parciales)
   */
  const obtenerRestriccionesDeFecha = useCallback(
    (fecha) => {
      const { fechaKey } = extraerFechaYHora(fecha);
      return restricciones.filter(
        (r) => fechaKey >= r.fechaInicio && fechaKey <= r.fechaFin,
      );
    },
    [restricciones],
  );

  /**
   * Retorna todas las restricciones activas que se solapan con un rango de fechas [inicio, fin]
   */
  const obtenerRestriccionesDeRango = useCallback(
    (inicio, fin) => {
      const iniStr = formatearFechaStr(inicio);
      const finStr = formatearFechaStr(fin || inicio);
      return restricciones.filter(
        (r) => r.fechaInicio <= finStr && r.fechaFin >= iniStr,
      );
    },
    [restricciones],
  );

  return {
    restricciones,
    agregarRestriccion,
    eliminarRestriccion,
    esDiaBloqueado,
    obtenerRestriccionDia,
    esSlotBloqueado,
    obtenerRestriccionSlot,
    obtenerRestriccionesDeFecha,
    obtenerRestriccionesDeRango,
    verificarSolapamiento: (fechaInicio, duracion) =>
      verificarSolapamientoConRestricciones(fechaInicio, duracion),
  };
};

/**
 * Verifica si una fecha y horario propuestos colisionan con alguna restricción guardada.
 * Retorna null si no hay conflicto, o un objeto con detalles del bloqueo.
 */
export const verificarSolapamientoConRestricciones = (
  fechaInicioInput,
  duracionMinutos = 30,
) => {
  try {
    const raw = localStorage.getItem(RESTRICCIONES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const restricciones = deduplicarRestricciones(parsed);
    if (!Array.isArray(restricciones) || restricciones.length === 0) return null;

    const { fechaKey, horaHHMM } = extraerFechaYHora(fechaInicioInput);
    if (!fechaKey) return null;

    // Calcular hora de fin del turno en formato "HH:mm" si hay hora de inicio
    let horaFinTurno = "";
    if (horaHHMM) {
      const [h, m] = horaHHMM.split(":").map(Number);
      const dur = Number(duracionMinutos) || 30;
      const totalMinFin = h * 60 + m + dur;
      const finH = String(Math.floor(totalMinFin / 60)).padStart(2, "0");
      const finM = String(totalMinFin % 60).padStart(2, "0");
      horaFinTurno = `${finH}:${finM}`;
    }

    const horaTurnoNorm = horaHHMM ? horaHHMM.padStart(5, "0") : "";
    const horaFinTurnoNorm = horaFinTurno ? horaFinTurno.padStart(5, "0") : "";

    for (const r of restricciones) {
      if (fechaKey >= r.fechaInicio && fechaKey <= r.fechaFin) {
        // 1. Si es bloqueo de Día Completo: bloquea cualquier turno en esa fecha
        if (r.todoElDia || !r.horaInicio || r.tipo === "dia_completo") {
          return {
            bloqueado: true,
            motivo: r.motivo,
            tipo: "dia_completo",
            mensaje: `El día ${fechaKey} se encuentra bloqueado por "${r.motivo}".`,
          };
        }

        // 2. Si es Franja Horaria: solo evalúa si se proporcionó una hora específica
        if (r.horaInicio && r.horaFin && horaTurnoNorm) {
          const inicioNorm = r.horaInicio.padStart(5, "0");
          const finNorm = r.horaFin.padStart(5, "0");

          // Solapa si el turno comienza antes del fin del bloqueo y finaliza después del inicio del bloqueo
          const solapa = horaFinTurnoNorm
            ? horaTurnoNorm < finNorm && horaFinTurnoNorm > inicioNorm
            : horaTurnoNorm >= inicioNorm && horaTurnoNorm < finNorm;

          if (solapa) {
            return {
              bloqueado: true,
              motivo: r.motivo,
              tipo: "franja_horaria",
              mensaje: `El horario seleccionado coincide con un bloqueo (${r.motivo}: ${r.horaInicio} a ${r.horaFin} hs).`,
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn("Error al verificar restricciones:", err);
  }
  return null;
};

export default useRestricciones;
