/** @format */

import { useState, useEffect, useCallback } from "react";

const RESTRICCIONES_STORAGE_KEY = "myv_restricciones_agenda";

/**
 * Hook para gestionar las restricciones / bloqueos de agenda
 * (ausencias, vacaciones, franjas horarias no disponibles).
 */
export const useRestricciones = () => {
  const [restricciones, setRestricciones] = useState(() => {
    try {
      const stored = localStorage.getItem(RESTRICCIONES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
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

  const agregarRestriccion = useCallback((nueva) => {
    const item = {
      id: `rest_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      motivo: nueva.motivo?.trim() || "Bloqueado",
      todoElDia: Boolean(nueva.todoElDia),
      fechaInicio: nueva.fechaInicio, // "YYYY-MM-DD"
      fechaFin: nueva.fechaFin || nueva.fechaInicio,
      horaInicio: nueva.todoElDia ? null : nueva.horaInicio || "08:00",
      horaFin: nueva.todoElDia ? null : nueva.horaFin || "10:00",
      creadoEl: new Date().toISOString(),
    };

    setRestricciones((prev) => [...prev, item]);
    return item;
  }, []);

  const eliminarRestriccion = useCallback((id) => {
    setRestricciones((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Formato "YYYY-MM-DD" en zona horaria local
  const formatearFechaStr = (f) => {
    if (!f) return "";
    const d = new Date(f);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  /**
   * Verifica si un día completo está bloqueado (o cae dentro de un período de vacaciones)
   */
  const esDiaBloqueado = useCallback(
    (fecha) => {
      const fechaStr = formatearFechaStr(fecha);
      return restricciones.some((r) => {
        if (!r.todoElDia) return false;
        return fechaStr >= r.fechaInicio && fechaStr <= r.fechaFin;
      });
    },
    [restricciones],
  );

  /**
   * Retorna la restricción de día completo si existe
   */
  const obtenerRestriccionDia = useCallback(
    (fecha) => {
      const fechaStr = formatearFechaStr(fecha);
      return (
        restricciones.find((r) => {
          if (!r.todoElDia) return false;
          return fechaStr >= r.fechaInicio && fechaStr <= r.fechaFin;
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
      const fechaStr = formatearFechaStr(fecha);

      return restricciones.some((r) => {
        // Coincide el rango de fechas
        if (fechaStr < r.fechaInicio || fechaStr > r.fechaFin) return false;

        // Si es todo el día, cualquier slot está bloqueado
        if (r.todoElDia) return true;

        // Si es horario parcial:
        if (r.horaInicio && r.horaFin) {
          return horaStr >= r.horaInicio && horaStr < r.horaFin;
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
      const fechaStr = formatearFechaStr(fecha);

      return (
        restricciones.find((r) => {
          if (fechaStr < r.fechaInicio || fechaStr > r.fechaFin) return false;
          if (r.todoElDia) return true;
          if (r.horaInicio && r.horaFin) {
            return horaStr >= r.horaInicio && horaStr < r.horaFin;
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
      const fechaStr = formatearFechaStr(fecha);
      return restricciones.filter(
        (r) => fechaStr >= r.fechaInicio && fechaStr <= r.fechaFin,
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
  };
};

export default useRestricciones;
