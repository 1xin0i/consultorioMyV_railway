/** @format */

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  mes,
  cambiarMes,
  anio,
  cambiarAnio,
  modoAnual,
  setModoAnual,
  mesAnterior,
  mesSiguiente,
}) {
  const [abierto, setAbierto] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const botonRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (abierto && botonRef.current) {
      const rect = botonRef.current.getBoundingClientRect();
      const popoverWidth = 280;

      const top = rect.bottom + window.scrollY + 8;
      let left = rect.left + window.scrollX - 40;

      if (left + popoverWidth > window.innerWidth - 16) {
        left = window.innerWidth - 16 - popoverWidth;
      }
      if (left < 16) left = 16;

      setCoords({ top, left });
    }
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;

    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        botonRef.current &&
        !botonRef.current.contains(e.target)
      ) {
        setAbierto(false);
      }
    };

    const handleScroll = (e) => {
      if (popoverRef.current && popoverRef.current.contains(e.target)) return;
      setAbierto(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [abierto]);

  const labelPeriodo = modoAnual
    ? `Año ${anio}`
    : `${NOMBRES_MESES_LARGOS[mes - 1]} ${anio}`;

  return (
    <div className="relative inline-flex items-center">
      {/* Navegador con Flechas y Botón Popover */}
      <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-1 shadow-2xs">
        <button
          type="button"
          onClick={() => {
            if (modoAnual) {
              cambiarAnio(Number(anio) - 1);
            } else {
              mesAnterior();
            }
          }}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Período anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          ref={botonRef}
          type="button"
          onClick={() => setAbierto((prev) => !prev)}
          className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <Calendar size={15} className="text-[#2eb086]" />
          <span>{labelPeriodo}</span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (modoAnual) {
              cambiarAnio(Number(anio) + 1);
            } else {
              mesSiguiente();
            }
          }}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Período siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Popover flotante del selector de meses y año */}
      {abierto &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "absolute",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className="z-[9999] w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Cabecera del año con flechas */}
            <div className="flex items-center justify-between pb-1">
              <button
                type="button"
                onClick={() => cambiarAnio(Number(anio) - 1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                {anio}
              </span>

              <button
                type="button"
                onClick={() => cambiarAnio(Number(anio) + 1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Botón Ver Balance Anual Consolidado */}
            <button
              type="button"
              onClick={() => {
                setModoAnual(true);
                setAbierto(false);
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                modoAnual
                  ? "bg-[#0d8266] text-white shadow-xs font-bold"
                  : "bg-teal-50 dark:bg-teal-950/60 text-[#0d8266] dark:text-teal-300 border border-teal-200/60 dark:border-teal-800 hover:bg-teal-100"
              }`}
            >
              <BarChart3 size={14} />
              <span>Ver Balance Anual Consolidado</span>
            </button>

            {/* Grilla de 12 Meses */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {NOMBRES_MESES_CORTOS.map((mesCorto, idx) => {
                const mesNum = idx + 1;
                const esMesSeleccionado = !modoAnual && mes === mesNum;
                return (
                  <button
                    key={mesCorto}
                    type="button"
                    onClick={() => {
                      cambiarMes(mesNum);
                      setModoAnual(false);
                      setAbierto(false);
                    }}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                      esMesSeleccionado
                        ? "bg-[#0d8266] text-white shadow-xs font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900"
                    }`}
                  >
                    {mesCorto}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default SelectorPeriodoCaja;

