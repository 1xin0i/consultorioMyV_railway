/** @format */

import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BarChart3,
} from "lucide-react";

const NOMBRES_MESES_CORTOS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const NOMBRES_MESES_LARGOS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function SelectorPeriodoCaja({
  filtros = {},
  actualizarFiltros,
  actualizarFiltro,
  mes: propsMes,
  cambiarMes,
  anio: propsAnio,
  cambiarAnio,
  modoAnual: propsModoAnual,
  setModoAnual,
  mesAnterior,
  mesSiguiente,
}) {
  const [abierto, setAbierto] = useState(false);
  const containerRef = useRef(null);

  const hoy = new Date();
  const mesProp = filtros?.mes ?? propsMes;
  const anioProp = filtros?.anio ?? propsAnio;
  const modoAnualProp = filtros?.modoAnual ?? propsModoAnual;

  const mesActual =
    mesProp !== undefined && mesProp !== null && !isNaN(Number(mesProp))
      ? Number(mesProp)
      : hoy.getMonth() + 1;
  const anioActual =
    anioProp !== undefined && anioProp !== null && !isNaN(Number(anioProp))
      ? Number(anioProp)
      : hoy.getFullYear();
  const modoAnual = Boolean(modoAnualProp);

  const [anioVista, setAnioVista] = useState(anioActual);

  useEffect(() => {
    setAnioVista(anioActual);
  }, [anioActual]);

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!abierto) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setAbierto(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, {
      passive: true,
    });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [abierto]);

  const aplicarPeriodo = (nuevoMes, nuevoAnio, nuevoModoAnual) => {
    const ultimoDia = new Date(nuevoAnio, nuevoMes, 0).getDate();
    const mesStr = String(nuevoMes).padStart(2, "0");
    const uDiaStr = String(ultimoDia).padStart(2, "0");

    const payload = nuevoModoAnual
      ? {
          modoAnual: true,
          periodo: "anio",
          mes: null,
          anio: nuevoAnio,
          fechaInicio: `${nuevoAnio}-01-01`,
          fechaFin: `${nuevoAnio}-12-31`,
        }
      : {
          modoAnual: false,
          periodo: "mes",
          mes: nuevoMes,
          anio: nuevoAnio,
          fechaInicio: `${nuevoAnio}-${mesStr}-01`,
          fechaFin: `${nuevoAnio}-${mesStr}-${uDiaStr}`,
        };

    if (actualizarFiltros) {
      actualizarFiltros(payload);
    } else if (actualizarFiltro) {
      Object.entries(payload).forEach(([k, v]) => actualizarFiltro(k, v));
    }

    if (cambiarMes && !nuevoModoAnual) cambiarMes(nuevoMes);
    if (cambiarAnio) cambiarAnio(nuevoAnio);
    if (setModoAnual) setModoAnual(nuevoModoAnual);
  };

  const navegarAnterior = () => {
    if (mesAnterior && !actualizarFiltros) {
      mesAnterior();
      return;
    }
    if (modoAnual) {
      aplicarPeriodo(mesActual, anioActual - 1, true);
    } else {
      if (mesActual === 1) {
        aplicarPeriodo(12, anioActual - 1, false);
      } else {
        aplicarPeriodo(mesActual - 1, anioActual, false);
      }
    }
  };

  const navegarSiguiente = () => {
    if (mesSiguiente && !actualizarFiltros) {
      mesSiguiente();
      return;
    }
    if (modoAnual) {
      aplicarPeriodo(mesActual, anioActual + 1, true);
    } else {
      if (mesActual === 12) {
        aplicarPeriodo(1, anioActual + 1, false);
      } else {
        aplicarPeriodo(mesActual + 1, anioActual, false);
      }
    }
  };

  const nombreMes =
    mesActual >= 1 && mesActual <= 12
      ? NOMBRES_MESES_LARGOS[mesActual - 1]
      : "Mes";

  const labelPeriodo = modoAnual ? `Año ${anioActual}` : `${nombreMes} ${anioActual}`;

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      {/* Navegador con Flechas y Botón Popover */}
      <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-0.5 shadow-2xs">
        <button
          type="button"
          onClick={navegarAnterior}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Período anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          type="button"
          onClick={() => {
            setAnioVista(anioActual);
            setAbierto((prev) => !prev);
          }}
          className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <Calendar size={15} className="text-[#0d8266]" />
          <span>{labelPeriodo}</span>
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${
              abierto ? "rotate-180" : ""
            }`}
          />
        </button>

        <button
          type="button"
          onClick={navegarSiguiente}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Período siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Popover flotante del selector de meses y año posicionado justo debajo del selector */}
      {abierto && (
        <div className="absolute top-full right-0 mt-2 z-50 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
          {/* Cabecera del año con flechas */}
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => setAnioVista((prev) => prev - 1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Año anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              {anioVista}
            </span>

            <button
              type="button"
              onClick={() => setAnioVista((prev) => prev + 1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Año siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Botón Ver Cobros y Gastos del Año */}
          <button
            type="button"
            onClick={() => {
              aplicarPeriodo(mesActual, anioVista, true);
              setAbierto(false);
            }}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              modoAnual && anioActual === anioVista
                ? "bg-[#0d8266] text-white shadow-xs font-bold"
                : "bg-teal-50 dark:bg-teal-950/60 text-[#0d8266] dark:text-teal-300 border border-teal-200/60 dark:border-teal-800 hover:bg-teal-100"
            }`}
          >
            <BarChart3 size={14} />
            <span>Ver Cobros y Gastos del Año ({anioVista})</span>
          </button>

          {/* Grilla de 12 Meses */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {NOMBRES_MESES_CORTOS.map((mesCorto, idx) => {
              const mesNum = idx + 1;
              const esMesSeleccionado =
                !modoAnual && mesActual === mesNum && anioActual === anioVista;
              const esMesActualHoy =
                hoy.getMonth() + 1 === mesNum && hoy.getFullYear() === anioVista;

              return (
                <button
                  key={mesCorto}
                  type="button"
                  onClick={() => {
                    aplicarPeriodo(mesNum, anioVista, false);
                    setAbierto(false);
                  }}
                  className={`py-2 rounded-xl text-xs transition-all cursor-pointer text-center ${
                    esMesSeleccionado
                      ? "bg-[#0d8266] text-white shadow-xs font-bold"
                      : esMesActualHoy
                        ? "bg-slate-200/90 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 font-bold border border-slate-300 dark:border-slate-600 hover:bg-slate-300/80 dark:hover:bg-slate-600"
                        : "text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900"
                  }`}
                >
                  {mesCorto}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SelectorPeriodoCaja;
