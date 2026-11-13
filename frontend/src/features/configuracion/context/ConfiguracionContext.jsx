/** @format */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { AuthContext } from "@/features/auth";
import configuracionApi from "../services/configuracion.api";
import {
  CONFIG_DEFAULT,
  CONFIG_STORAGE_KEY,
  RESTRICCIONES_STORAGE_KEY,
  formatearFechaStr,
  normalizarRestriccion,
  cargarConfigLocal,
  cargarRestriccionesLocal,
} from "../utils/normalizarRestriccion";
import {
  esDiaLaboralFecha,
  esDiaBloqueadoFecha,
  obtenerRestriccionDiaFecha,
  esSlotBloqueadoFecha,
  obtenerRestriccionSlotFecha,
  obtenerRestriccionesDeFechaList,
  validarTurnoHorarioConfig,
  calcularMetricasJornada,
} from "../utils/disponibilidad";

const ConfiguracionContext = createContext();

export const useConfiguracion = () => {
  const context = useContext(ConfiguracionContext);
  if (!context) {
    throw new Error(
      "useConfiguracion debe usarse dentro de un ConfiguracionProvider",
    );
  }
  return context;
};

export function ConfiguracionProvider({ children }) {
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [configuracion, setConfiguracion] = useState(cargarConfigLocal);
  const [restricciones, setRestricciones] = useState(cargarRestriccionesLocal);
  const [cargandoConfiguracion, setCargandoConfiguracion] = useState(false);

  const sincronizarDesdeServidor = useCallback(async () => {
    const tokenActivo = token || localStorage.getItem("token");
    if (!tokenActivo) return;

    setCargandoConfiguracion(true);
    try {
      const [resConfig, resRestr] = await Promise.all([
        configuracionApi.obtenerConfiguracion(),
        configuracionApi.obtenerRestricciones(),
      ]);

      const cfgServer = resConfig.data?.data;
      if (cfgServer) {
        const normalizada = {
          horaInicio: String(
            cfgServer.hora_inicio ||
              cfgServer.horaInicio ||
              CONFIG_DEFAULT.horaInicio,
          ).slice(0, 5),
          horaFin: String(
            cfgServer.hora_fin || cfgServer.horaFin || CONFIG_DEFAULT.horaFin,
          ).slice(0, 5),
          intervaloMinutos: Number(
            cfgServer.intervalo_minutos ??
              cfgServer.intervaloMinutos ??
              CONFIG_DEFAULT.intervaloMinutos,
          ),
          diasLaborales: Array.isArray(
            cfgServer.dias_laborales ?? cfgServer.diasLaborales,
          )
            ? (cfgServer.dias_laborales ?? cfgServer.diasLaborales).map(Number)
            : CONFIG_DEFAULT.diasLaborales,
          umbralBaja: Number(
            cfgServer.umbral_baja ??
              cfgServer.umbralBaja ??
              CONFIG_DEFAULT.umbralBaja,
          ),
          umbralMedia: Number(
            cfgServer.umbral_media ??
              cfgServer.umbralMedia ??
              CONFIG_DEFAULT.umbralMedia,
          ),
        };
        setConfiguracion(normalizada);
        try {
          localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(normalizada));
        } catch {
          // ignorar
        }
      }

      const restrServer = resRestr.data?.data;
      if (Array.isArray(restrServer)) {
        const listaNormalizada = restrServer
          .map(normalizarRestriccion)
          .filter(Boolean);
        setRestricciones(listaNormalizada);
        try {
          localStorage.setItem(
            RESTRICCIONES_STORAGE_KEY,
            JSON.stringify(listaNormalizada),
          );
        } catch {
          // ignorar
        }
      }
    } catch (error) {
      console.warn(
        "Usando configuración local de respaldo (sin conexión con el servidor):",
        error?.message,
      );
    } finally {
      setCargandoConfiguracion(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      sincronizarDesdeServidor();
    }
  }, [token, sincronizarDesdeServidor]);

  const guardarConfiguracion = useCallback(
    async (nuevaConfig) => {
      const normalizada = {
        ...configuracion,
        ...nuevaConfig,
        diasLaborales: Array.isArray(nuevaConfig.diasLaborales)
          ? nuevaConfig.diasLaborales.map(Number)
          : configuracion.diasLaborales,
        umbralBaja: Number(nuevaConfig.umbralBaja ?? configuracion.umbralBaja),
        umbralMedia: Number(
          nuevaConfig.umbralMedia ?? configuracion.umbralMedia,
        ),
        intervaloMinutos: Number(
          nuevaConfig.intervaloMinutos ?? configuracion.intervaloMinutos,
        ),
      };

      setConfiguracion(normalizada);
      try {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(normalizada));
      } catch {
        // ignorar
      }

      const res = await configuracionApi.actualizarConfiguracion({
        horaInicio: normalizada.horaInicio,
        horaFin: normalizada.horaFin,
        intervaloMinutos: normalizada.intervaloMinutos,
        diasLaborales: normalizada.diasLaborales,
        umbralBaja: normalizada.umbralBaja,
        umbralMedia: normalizada.umbralMedia,
      });

      const cfgServer = res.data?.data;
      if (cfgServer) {
        const confirmada = {
          horaInicio: String(
            cfgServer.hora_inicio ||
              cfgServer.horaInicio ||
              normalizada.horaInicio,
          ).slice(0, 5),
          horaFin: String(
            cfgServer.hora_fin || cfgServer.horaFin || normalizada.horaFin,
          ).slice(0, 5),
          intervaloMinutos: Number(
            cfgServer.intervalo_minutos ??
              cfgServer.intervaloMinutos ??
              normalizada.intervaloMinutos,
          ),
          diasLaborales: Array.isArray(
            cfgServer.dias_laborales ?? cfgServer.diasLaborales,
          )
            ? (cfgServer.dias_laborales ?? cfgServer.diasLaborales).map(Number)
            : normalizada.diasLaborales,
          umbralBaja: Number(
            cfgServer.umbral_baja ??
              cfgServer.umbralBaja ??
              normalizada.umbralBaja,
          ),
          umbralMedia: Number(
            cfgServer.umbral_media ??
              cfgServer.umbralMedia ??
              normalizada.umbralMedia,
          ),
        };
        setConfiguracion(confirmada);
        try {
          localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(confirmada));
        } catch {
          // ignorar
        }
        return confirmada;
      }

      return normalizada;
    },
    [configuracion],
  );

  const restablecerPorDefecto = useCallback(async () => {
    return guardarConfiguracion(CONFIG_DEFAULT);
  }, [guardarConfiguracion]);

  const agregarRestriccion = useCallback(async (nueva) => {
    const payload = {
      fechaInicio: nueva.fechaInicio || nueva.fecha,
      fechaFin: nueva.fechaFin || nueva.fechaInicio || nueva.fecha,
      todoElDia: Boolean(nueva.todoElDia),
      horaInicio: nueva.todoElDia ? null : nueva.horaInicio,
      horaFin: nueva.todoElDia ? null : nueva.horaFin,
      motivo: nueva.motivo || "Horario bloqueado",
    };

    try {
      const res = await configuracionApi.crearRestriccion(payload);
      const creada = normalizarRestriccion(res.data?.data || res.data);
      if (creada) {
        setRestricciones((prev) => {
          const siguiente = [...prev, creada];
          try {
            localStorage.setItem(
              RESTRICCIONES_STORAGE_KEY,
              JSON.stringify(siguiente),
            );
          } catch {
            // ignorar
          }
          return siguiente;
        });
      }
      return creada;
    } catch (error) {
      const localFallback = normalizarRestriccion({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...payload,
      });
      setRestricciones((prev) => {
        const siguiente = [...prev, localFallback];
        try {
          localStorage.setItem(
            RESTRICCIONES_STORAGE_KEY,
            JSON.stringify(siguiente),
          );
        } catch {
          // ignorar
        }
        return siguiente;
      });
      throw error;
    }
  }, []);

  const eliminarRestriccion = useCallback(async (id) => {
    setRestricciones((prev) => {
      const siguiente = prev.filter(
        (r) => String(r.id) !== String(id) && String(r.id_restriccion) !== String(id),
      );
      try {
        localStorage.setItem(
          RESTRICCIONES_STORAGE_KEY,
          JSON.stringify(siguiente),
        );
      } catch {
        // ignorar
      }
      return siguiente;
    });

    if (id && !isNaN(Number(id))) {
      await configuracionApi.eliminarRestriccion(id);
    }
  }, []);

  const esDiaLaboral = useCallback(
    (fecha) => esDiaLaboralFecha(fecha, configuracion.diasLaborales),
    [configuracion.diasLaborales],
  );

  const esDiaBloqueado = useCallback(
    (fecha) => esDiaBloqueadoFecha(fecha, restricciones),
    [restricciones],
  );

  const obtenerRestriccionDia = useCallback(
    (fecha) => obtenerRestriccionDiaFecha(fecha, restricciones),
    [restricciones],
  );

  const esSlotBloqueado = useCallback(
    (fecha, horaStr) => esSlotBloqueadoFecha(fecha, horaStr, restricciones),
    [restricciones],
  );

  const obtenerRestriccionSlot = useCallback(
    (fecha, horaStr) =>
      obtenerRestriccionSlotFecha(fecha, horaStr, restricciones),
    [restricciones],
  );

  const obtenerRestriccionesDeFecha = useCallback(
    (fecha) => obtenerRestriccionesDeFechaList(fecha, restricciones),
    [restricciones],
  );

  const validarTurnoHorario = useCallback(
    (fechaHoraInicioStr, duracionMinutos = 30) =>
      validarTurnoHorarioConfig(
        fechaHoraInicioStr,
        duracionMinutos,
        configuracion,
        restricciones,
      ),
    [configuracion, restricciones],
  );

  const metricasJornada = useMemo(
    () => calcularMetricasJornada(configuracion),
    [configuracion],
  );

  const value = useMemo(
    () => ({
      configuracion,
      guardarConfiguracion,
      restablecerPorDefecto,
      esDiaLaboral,
      validarTurnoHorario,
      restricciones,
      agregarRestriccion,
      eliminarRestriccion,
      esDiaBloqueado,
      obtenerRestriccionDia,
      esSlotBloqueado,
      obtenerRestriccionSlot,
      obtenerRestriccionesDeFecha,
      sincronizarDesdeServidor,
      cargandoConfiguracion,
      formatearFechaStr,
      ...metricasJornada,
    }),
    [
      configuracion,
      guardarConfiguracion,
      restablecerPorDefecto,
      esDiaLaboral,
      validarTurnoHorario,
      restricciones,
      agregarRestriccion,
      eliminarRestriccion,
      esDiaBloqueado,
      obtenerRestriccionDia,
      esSlotBloqueado,
      obtenerRestriccionSlot,
      obtenerRestriccionesDeFecha,
      sincronizarDesdeServidor,
      cargandoConfiguracion,
      metricasJornada,
    ],
  );

  return (
    <ConfiguracionContext.Provider value={value}>
      {children}
    </ConfiguracionContext.Provider>
  );
}

