/** @format */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";
import { GENERAR_HORAS } from "../features/turnos/utils/agendaStyles";

const CONFIG_STORAGE_KEY = "myv_configuracion_agenda";
const RESTRICCIONES_STORAGE_KEY = "myv_restricciones_agenda";

const CONFIG_DEFAULT = {
  horaInicio: "08:00",
  horaFin: "20:00",
  duracionModuloMinutos: 30,
  diasLaborales: [1, 2, 3, 4, 5, 6], // 1=Lunes ... 6=Sábado (0=Domingo)
  ocupacionBajaMax: 50,
  ocupacionMediaMax: 80,
};

// Formato "YYYY-MM-DD" en zona horaria local
const formatearFechaStr = (f) => {
  if (!f) return "";
  if (typeof f === "string" && /^\d{4}-\d{2}-\d{2}$/.test(f)) return f;
  if (typeof f === "string" && !f.includes("T") && !f.includes(" ")) {
    const parts = f.split("-");
    if (parts.length === 3) return f;
  }
  const d = f instanceof Date ? f : new Date(f);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const normalizarRestriccion = (r) => {
  const todoElDia = Boolean(r.todoElDia ?? r.todo_el_dia);
  const fIni = r.fechaInicio || r.fecha_inicio;
  const fFin = r.fechaFin || r.fecha_fin || fIni;
  const hIni = todoElDia
    ? null
    : (r.horaInicio || r.hora_inicio || "08:00").slice(0, 5);
  const hFin = todoElDia
    ? null
    : (r.horaFin || r.hora_fin || "10:00").slice(0, 5);

  return {
    id: r.id,
    motivo: r.motivo?.trim() || "Bloqueado",
    todoElDia,
    todo_el_dia: todoElDia,
    fechaInicio: fIni,
    fecha_inicio: fIni,
    fechaFin: fFin,
    fecha_fin: fFin,
    horaInicio: hIni,
    hora_inicio: hIni,
    horaFin: hFin,
    hora_fin: hFin,
  };
};

const DEFAULT_CONTEXT_VALUE = {
  config: CONFIG_DEFAULT,
  configuracion: CONFIG_DEFAULT,
  actualizarConfiguracion: async () => {},
  restaurarPorDefecto: async () => {},
  restricciones: [],
  agregarRestriccion: async () => {},
  eliminarRestriccion: async () => {},
  esDiaBloqueado: () => false,
  obtenerRestriccionDia: () => null,
  esSlotBloqueado: () => false,
  obtenerRestriccionSlot: () => null,
  obtenerRestriccionesDeFecha: () => [],
  horaInicioNum: 8,
  horaFinNum: 20,
  duracionModuloMinutos: 30,
  diasLaborales: [1, 2, 3, 4, 5, 6],
  ocupacionBajaMax: 50,
  ocupacionMediaMax: 80,
  corteBajaModulos: 12,
  corteMediaModulos: 19,
  slotsHoras: GENERAR_HORAS(8, 20, 30),
  totalModulosDia: 24,
  esDiaLaboral: (fecha) => {
    if (!fecha) return false;
    let diaSemana;
    if (fecha instanceof Date) {
      diaSemana = fecha.getDay();
    } else if (typeof fecha === "string") {
      if (fecha.includes("T") || fecha.includes(" ")) {
        diaSemana = new Date(fecha).getDay();
      } else {
        const parts = fecha.split("-");
        if (parts.length === 3) {
          diaSemana = new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2]),
          ).getDay();
        } else {
          diaSemana = new Date(fecha).getDay();
        }
      }
    } else {
      diaSemana = new Date(fecha).getDay();
    }
    return [1, 2, 3, 4, 5, 6].includes(diaSemana);
  },
  validarTurnoHorario: () => ({ valido: true }),
};

const ConfiguracionContext = createContext(DEFAULT_CONTEXT_VALUE);

export function ConfiguracionProvider({ children }) {
  const auth = useAuth();
  const token = auth?.token || localStorage.getItem("token");

  const [config, setConfig] = useState(() => {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        return { ...CONFIG_DEFAULT, ...JSON.parse(stored) };
      }
    } catch {
      // Usar valor por defecto en caso de error
    }
    return CONFIG_DEFAULT;
  });

  const [restricciones, setRestricciones] = useState(() => {
    try {
      const stored = localStorage.getItem(RESTRICCIONES_STORAGE_KEY);
      return stored ? JSON.parse(stored).map(normalizarRestriccion) : [];
    } catch {
      return [];
    }
  });

  // Sincronizar caché local ante cambios
  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(
        RESTRICCIONES_STORAGE_KEY,
        JSON.stringify(restricciones),
      );
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [restricciones]);

  // Cargar configuración y restricciones desde MySQL al iniciar sesión / montar
  useEffect(() => {
    if (!token) return;

    let cancelado = false;

    const cargarDatosAgenda = async () => {
      try {
        const [resConfig, resRestr] = await Promise.all([
          api.get("/configuracion-agenda").catch(() => null),
          api.get("/restricciones-agenda").catch(() => null),
        ]);

        if (cancelado) return;

        if (resConfig?.data?.data) {
          const d = resConfig.data.data;
          setConfig({
            horaInicio: (d.horaInicio || d.hora_inicio || "08:00").slice(0, 5),
            horaFin: (d.horaFin || d.hora_fin || "20:00").slice(0, 5),
            duracionModuloMinutos:
              Number(d.duracionModuloMinutos ?? d.duracion_modulo_minutos) ||
              30,
            diasLaborales: Array.isArray(d.diasLaborales || d.dias_laborales)
              ? (d.diasLaborales || d.dias_laborales).map(Number)
              : [1, 2, 3, 4, 5, 6],
            ocupacionBajaMax:
              Number(d.ocupacionBajaMax ?? d.ocupacion_baja_max) || 50,
            ocupacionMediaMax:
              Number(d.ocupacionMediaMax ?? d.ocupacion_media_max) || 80,
          });
        }

        if (resRestr?.data?.data && Array.isArray(resRestr.data.data)) {
          const listaRemota = resRestr.data.data.map(normalizarRestriccion);

          // Si la BD está vacía pero había restricciones locales previas sin migrar, las subimos
          if (listaRemota.length === 0) {
            let localesPrevias = [];
            try {
              const raw = localStorage.getItem(RESTRICCIONES_STORAGE_KEY);
              if (raw) {
                localesPrevias = JSON.parse(raw).filter(
                  (r) => typeof r.id === "string" && r.id.startsWith("rest_"),
                );
              }
            } catch {
              localesPrevias = [];
            }

            if (localesPrevias.length > 0) {
              const migradas = [];
              for (const loc of localesPrevias) {
                try {
                  const rPost = await api.post("/restricciones-agenda", {
                    motivo: loc.motivo,
                    todo_el_dia: Boolean(loc.todoElDia ?? loc.todo_el_dia),
                    fecha_inicio: loc.fechaInicio || loc.fecha_inicio,
                    fecha_fin:
                      loc.fechaFin ||
                      loc.fecha_fin ||
                      loc.fechaInicio ||
                      loc.fecha_inicio,
                    hora_inicio: loc.horaInicio || loc.hora_inicio || null,
                    hora_fin: loc.horaFin || loc.hora_fin || null,
                  });
                  if (rPost?.data?.data) {
                    migradas.push(normalizarRestriccion(rPost.data.data));
                  }
                } catch {
                  // Continuar si alguna falla
                }
              }
              if (!cancelado && migradas.length > 0) {
                setRestricciones(migradas);
                return;
              }
            }
          }

          setRestricciones(listaRemota);
        }
      } catch (err) {
        console.warn("Error al sincronizar configuración de agenda:", err);
      }
    };

    cargarDatosAgenda();

    return () => {
      cancelado = true;
    };
  }, [token]);

  const actualizarConfiguracion = useCallback(async (nuevaConfig) => {
    setConfig((prev) => {
      const merged = { ...prev, ...nuevaConfig };
      api
        .put("/configuracion-agenda", {
          hora_inicio: merged.horaInicio,
          hora_fin: merged.horaFin,
          duracion_modulo_minutos: Number(merged.duracionModuloMinutos) || 30,
          dias_laborales: merged.diasLaborales,
          ocupacion_baja_max: Number(merged.ocupacionBajaMax) || 50,
          ocupacion_media_max: Number(merged.ocupacionMediaMax) || 80,
        })
        .then((res) => {
          if (res?.data?.data) {
            const d = res.data.data;
            setConfig({
              horaInicio: (d.horaInicio || d.hora_inicio || "08:00").slice(
                0,
                5,
              ),
              horaFin: (d.horaFin || d.hora_fin || "20:00").slice(0, 5),
              duracionModuloMinutos:
                Number(d.duracionModuloMinutos ?? d.duracion_modulo_minutos) ||
                30,
              diasLaborales: Array.isArray(d.diasLaborales || d.dias_laborales)
                ? (d.diasLaborales || d.dias_laborales).map(Number)
                : [1, 2, 3, 4, 5, 6],
              ocupacionBajaMax:
                Number(d.ocupacionBajaMax ?? d.ocupacion_baja_max) || 50,
              ocupacionMediaMax:
                Number(d.ocupacionMediaMax ?? d.ocupacion_media_max) || 80,
            });
          }
        })
        .catch((err) => {
          console.error(
            "No se pudo guardar la configuración en el servidor:",
            err,
          );
        });
      return merged;
    });
  }, []);

  const restaurarPorDefecto = useCallback(async () => {
    await actualizarConfiguracion(CONFIG_DEFAULT);
  }, [actualizarConfiguracion]);

  const agregarRestriccion = useCallback(async (nueva) => {
    const payload = {
      motivo: nueva.motivo?.trim() || "Bloqueado",
      todo_el_dia: Boolean(nueva.todoElDia ?? nueva.todo_el_dia),
      fecha_inicio: nueva.fechaInicio || nueva.fecha_inicio,
      fecha_fin:
        nueva.fechaFin ||
        nueva.fecha_fin ||
        nueva.fechaInicio ||
        nueva.fecha_inicio,
      hora_inicio: Boolean(nueva.todoElDia ?? nueva.todo_el_dia)
        ? null
        : nueva.horaInicio || nueva.hora_inicio || "08:00",
      hora_fin: Boolean(nueva.todoElDia ?? nueva.todo_el_dia)
        ? null
        : nueva.horaFin || nueva.hora_fin || "10:00",
    };

    try {
      const res = await api.post("/restricciones-agenda", payload);
      if (res?.data?.data) {
        const item = normalizarRestriccion(res.data.data);
        setRestricciones((prev) => [...prev, item]);
        return item;
      }
    } catch (err) {
      console.error("Error al guardar restricción en el servidor:", err);
      // Fallback local en caso de desconexión temporal
      const itemFallback = normalizarRestriccion({
        ...payload,
        id: `rest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      });
      setRestricciones((prev) => [...prev, itemFallback]);
      return itemFallback;
    }
  }, []);

  const eliminarRestriccion = useCallback(async (id) => {
    setRestricciones((prev) => prev.filter((r) => String(r.id) !== String(id)));
    if (id && !String(id).startsWith("rest_")) {
      try {
        await api.delete(`/restricciones-agenda/${id}`);
      } catch (err) {
        console.error("Error al eliminar restricción del servidor:", err);
      }
    }
  }, []);

  // Helpers derivados de cálculo
  const horaInicioNum = parseInt(config.horaInicio?.split(":")[0], 10) || 8;
  const horaFinNum = parseInt(config.horaFin?.split(":")[0], 10) || 20;
  const duracionModuloMinutos = Number(config.duracionModuloMinutos) || 30;
  const diasLaborales = Array.isArray(config.diasLaborales)
    ? config.diasLaborales
    : [1, 2, 3, 4, 5, 6];

  // Grilla dinámica de slots generada según hora de inicio y fin configurada
  const slotsHoras = useMemo(() => {
    return GENERAR_HORAS(horaInicioNum, horaFinNum, duracionModuloMinutos);
  }, [horaInicioNum, horaFinNum, duracionModuloMinutos]);

  const totalMinutosJornada = Math.max(60, (horaFinNum - horaInicioNum) * 60);
  const totalModulosDia = Math.floor(
    totalMinutosJornada / duracionModuloMinutos,
  );
  const ocupacionBajaMax = Number(config.ocupacionBajaMax) || 50;
  const ocupacionMediaMax = Number(config.ocupacionMediaMax) || 80;
  const corteBajaModulos = Math.max(
    1,
    Math.round(totalModulosDia * (ocupacionBajaMax / 100)),
  );
  const corteMediaModulos = Math.min(
    Math.max(corteBajaModulos + 1, totalModulosDia - 1),
    Math.max(
      corteBajaModulos + 1,
      Math.round(totalModulosDia * (ocupacionMediaMax / 100)),
    ),
  );

  // Verifica si un día específico es laboral según la configuración
  const esDiaLaboral = useCallback(
    (fecha) => {
      if (!fecha) return false;
      let diaSemana;
      if (fecha instanceof Date) {
        diaSemana = fecha.getDay();
      } else if (typeof fecha === "string") {
        if (fecha.includes("T") || fecha.includes(" ")) {
          diaSemana = new Date(fecha).getDay();
        } else {
          // Parse YYYY-MM-DD sin riesgo de desfasaje de zona horaria UTC
          const parts = fecha.split("-");
          if (parts.length === 3) {
            diaSemana = new Date(
              Number(parts[0]),
              Number(parts[1]) - 1,
              Number(parts[2]),
            ).getDay();
          } else {
            diaSemana = new Date(fecha).getDay();
          }
        }
      } else {
        diaSemana = new Date(fecha).getDay();
      }
      return diasLaborales.includes(diaSemana);
    },
    [diasLaborales],
  );

  /**
   * Verifica si un día completo está bloqueado por restricción
   */
  const esDiaBloqueado = useCallback(
    (fecha) => {
      const fechaStr = formatearFechaStr(fecha);
      if (!fechaStr) return false;
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
      if (!fechaStr) return null;
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
      if (!fechaStr) return false;

      return restricciones.some((r) => {
        if (fechaStr < r.fechaInicio || fechaStr > r.fechaFin) return false;
        if (r.todoElDia) return true;
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
      if (!fechaStr) return null;

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
      if (!fechaStr) return [];
      return restricciones.filter(
        (r) => fechaStr >= r.fechaInicio && fechaStr <= r.fechaFin,
      );
    },
    [restricciones],
  );

  // Valida si un horario está dentro de la franja, día laboral y sin bloqueos
  const validarTurnoHorario = useCallback(
    (fechaHoraInicio, duracionMin = 30) => {
      if (!fechaHoraInicio) return { valido: false, mensaje: "Fecha inválida" };
      const d = new Date(fechaHoraInicio);
      if (isNaN(d.getTime())) {
        return { valido: false, mensaje: "Fecha inválida" };
      }

      const diaSemana = d.getDay();
      const nombresDias = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
      ];

      // 1. Verificar bloqueo de día completo
      const restrDia = obtenerRestriccionDia(d);
      if (restrDia) {
        return {
          valido: false,
          tipo: "bloqueo_dia",
          motivo: restrDia.motivo,
          mensaje: `Este horario está bloqueado ("${restrDia.motivo}").`,
        };
      }

      // 2. Verificar día no laboral
      if (!diasLaborales.includes(diaSemana)) {
        return {
          valido: false,
          tipo: "dia_no_laboral",
          motivo: `Día no laboral (${nombresDias[diaSemana]})`,
          mensaje: `El consultorio no atiende los días ${nombresDias[diaSemana]}.`,
        };
      }

      const hora = d.getHours();
      const minutos = d.getMinutes();
      const tiempoMinutos = hora * 60 + minutos;
      const tiempoFinMinutos = tiempoMinutos + (Number(duracionMin) || 30);

      // 3. Verificar bloqueo de franja horaria parcial
      const restriccionesDelDia = obtenerRestriccionesDeFecha(d);
      for (const r of restriccionesDelDia) {
        if (!r.todoElDia && r.horaInicio && r.horaFin) {
          const [rhIni, rmIni] = r.horaInicio.split(":").map(Number);
          const [rhFin, rmFin] = r.horaFin.split(":").map(Number);
          const minBloqueoIni = rhIni * 60 + (rmIni || 0);
          const minBloqueoFin = rhFin * 60 + (rmFin || 0);

          if (tiempoMinutos < minBloqueoFin && tiempoFinMinutos > minBloqueoIni) {
            return {
              valido: false,
              tipo: "bloqueo_franja",
              motivo: `${r.motivo} (${r.horaInicio} a ${r.horaFin} hs)`,
              mensaje: `Este horario está bloqueado ("${r.motivo}").`,
            };
          }
        }
      }

      // 4. Verificar horario de apertura y cierre
      const [hIni, mIni] = (config.horaInicio || "08:00").split(":").map(Number);
      const [hFin, mFin] = (config.horaFin || "20:00").split(":").map(Number);
      const minApertura = (hIni || 8) * 60 + (mIni || 0);
      const minCierre = (hFin || 20) * 60 + (mFin || 0);

      if (
        tiempoMinutos < minApertura ||
        tiempoMinutos >= minCierre ||
        tiempoFinMinutos > minCierre
      ) {
        const horaFmt = `${hora.toString().padStart(2, "0")}:${minutos.toString().padStart(2, "0")}`;
        return {
          valido: false,
          tipo: "fuera_horario",
          motivo: `Fuera de horario (${config.horaInicio} a ${config.horaFin} hs)`,
          mensaje: `El horario (${horaFmt} hs) está fuera de la jornada de atención (${config.horaInicio} a ${config.horaFin} hs).`,
        };
      }

      return { valido: true };
    },
    [
      diasLaborales,
      config.horaInicio,
      config.horaFin,
      obtenerRestriccionDia,
      obtenerRestriccionesDeFecha,
    ],
  );

  const value = {
    config,
    configuracion: config, // alias de compatibilidad
    actualizarConfiguracion,
    restaurarPorDefecto,
    restricciones,
    agregarRestriccion,
    eliminarRestriccion,
    esDiaBloqueado,
    obtenerRestriccionDia,
    esSlotBloqueado,
    obtenerRestriccionSlot,
    obtenerRestriccionesDeFecha,
    horaInicioNum,
    horaFinNum,
    duracionModuloMinutos,
    diasLaborales,
    ocupacionBajaMax,
    ocupacionMediaMax,
    corteBajaModulos,
    corteMediaModulos,
    slotsHoras,
    totalModulosDia,
    esDiaLaboral,
    validarTurnoHorario,
  };

  return (
    <ConfiguracionContext.Provider value={value}>
      {children}
    </ConfiguracionContext.Provider>
  );
}

export function useConfiguracion() {
  const context = useContext(ConfiguracionContext);
  return context || DEFAULT_CONTEXT_VALUE;
}

export default ConfiguracionContext;
