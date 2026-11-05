/** @format */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { GENERAR_HORAS } from "../features/turnos/utils/agendaStyles";

const CONFIG_STORAGE_KEY = "myv_configuracion_agenda";

const CONFIG_DEFAULT = {
  horaInicio: "08:00",
  horaFin: "20:00",
  duracionModuloMinutos: 30,
  diasLaborales: [1, 2, 3, 4, 5, 6], // 1=Lunes ... 6=Sábado (0=Domingo)
};

const DEFAULT_CONTEXT_VALUE = {
  config: CONFIG_DEFAULT,
  configuracion: CONFIG_DEFAULT,
  actualizarConfiguracion: () => {},
  restaurarPorDefecto: () => {},
  horaInicioNum: 8,
  horaFinNum: 20,
  duracionModuloMinutos: 30,
  diasLaborales: [1, 2, 3, 4, 5, 6],
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

  // Guardar en localStorage ante cualquier cambio
  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (err) {
      console.warn("No se pudo guardar la configuración de agenda:", err);
    }
  }, [config]);

  const actualizarConfiguracion = useCallback((nuevaConfig) => {
    setConfig((prev) => ({
      ...prev,
      ...nuevaConfig,
    }));
  }, []);

  const restaurarPorDefecto = useCallback(() => {
    setConfig(CONFIG_DEFAULT);
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

  // Valida si un horario está dentro de la franja y día laboral permitido
  const validarTurnoHorario = useCallback(
    (fechaHoraInicio) => {
      if (!fechaHoraInicio) return { valido: false, mensaje: "Fecha inválida" };
      const d = new Date(fechaHoraInicio);
      if (isNaN(d.getTime())) return { valido: false, mensaje: "Fecha inválida" };

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
      if (!diasLaborales.includes(diaSemana)) {
        return {
          valido: false,
          mensaje: `El consultorio no atiende los días ${nombresDias[diaSemana]}. Podés cambiar esto en Horarios de Atención.`,
        };
      }

      const hora = d.getHours();
      const minutos = d.getMinutes();
      const tiempoMinutos = hora * 60 + minutos;

      const [hIni, mIni] = (config.horaInicio || "08:00").split(":").map(Number);
      const [hFin, mFin] = (config.horaFin || "20:00").split(":").map(Number);
      const minApertura = (hIni || 8) * 60 + (mIni || 0);
      const minCierre = (hFin || 20) * 60 + (mFin || 0);

      if (tiempoMinutos < minApertura || tiempoMinutos >= minCierre) {
        return {
          valido: false,
          mensaje: `El horario (${hora.toString().padStart(2, "0")}:${minutos.toString().padStart(2, "0")} hs) está fuera de la jornada de atención (${config.horaInicio} a ${config.horaFin} hs).`,
        };
      }

      return { valido: true };
    },
    [diasLaborales, config.horaInicio, config.horaFin],
  );

  const value = {
    config,
    configuracion: config, // alias de compatibilidad
    actualizarConfiguracion,
    restaurarPorDefecto,
    horaInicioNum,
    horaFinNum,
    duracionModuloMinutos,
    diasLaborales,
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

