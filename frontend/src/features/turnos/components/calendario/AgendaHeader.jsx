/** @format */

import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  SlidersHorizontal,
  Plus,
  CalendarPlus,
  Lock,
} from "lucide-react";

export function AgendaHeader({
  vista,
  setVista,
  tituloPeriodo,
  irAnterior,
  irHoy,
  irSiguiente,
  onNuevoTurno,
  resetSeleccion,
}) {
  return (
    <div className="p-2.5 sm:p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900 flex flex-col gap-2 sm:gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="inline-flex rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={irAnterior}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Anterior"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={irHoy}
              className="px-2 sm:px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={irSiguiente}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Siguiente"
            >
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-gray-800 dark:text-slate-100 font-bold text-xs sm:text-base capitalize">
            <CalendarIcon
              size={16}
              className="text-[#2eb086] hidden sm:inline shrink-0"
            />
            <span className="truncate max-w-[170px] xs:max-w-[230px] sm:max-w-none">
              {tituloPeriodo}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="inline-flex rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs flex-1 sm:flex-initial">
            {[
              { id: "dia", label: "Día" },
              { id: "semana", label: "Semana" },
              { id: "mes", label: "Mes" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setVista(item.id);
                  resetSeleccion?.();
                }}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  vista === item.id
                    ? "bg-[#2eb086] text-white shadow-xs"
                    : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <Link
            to="/configuracion/horarios"
            title="Configurar horarios y disponibilidad"
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold transition-colors shadow-2xs shrink-0"
          >
            <SlidersHorizontal size={15} className="text-[#2eb086]" />
            <span className="hidden lg:inline">Horarios</span>
          </Link>

          {onNuevoTurno && (
            <button
              type="button"
              onClick={onNuevoTurno}
              className="hidden sm:inline-flex bg-[#2eb086] hover:bg-[#259370] text-white px-3.5 py-2 rounded-xl items-center justify-center gap-1.5 transition-all shadow-sm font-semibold text-xs sm:text-sm cursor-pointer shrink-0 active:scale-95"
            >
              <Plus size={16} />
              <span>Nuevo Turno</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AgendaFabMobile({
  fechaActual,
  onNuevoTurno,
  abrirModalRestriccion,
}) {
  const [fabMenuAbierto, setFabMenuAbierto] = useState(false);

  if (!onNuevoTurno || typeof document === "undefined") return null;

  return createPortal(
    <>
      {fabMenuAbierto && (
        <div
          className="sm:hidden fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[1px] animate-in fade-in duration-150"
          onClick={() => setFabMenuAbierto(false)}
        />
      )}

      <div className="sm:hidden fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2.5">
        {fabMenuAbierto && (
          <div className="flex flex-col items-end gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              type="button"
              onClick={() => {
                setFabMenuAbierto(false);
                abrirModalRestriccion({
                  inicio: fechaActual,
                  fin: fechaActual,
                });
              }}
              className="flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 rounded-2xl bg-slate-800 text-white shadow-lg border border-slate-700 active:scale-95 transition-transform cursor-pointer"
            >
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Lock size={15} />
              </div>
              <span className="text-xs font-bold whitespace-nowrap">
                Bloquear Horario / Día
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFabMenuAbierto(false);
                onNuevoTurno();
              }}
              className="flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 rounded-2xl bg-[#0d8266] text-white shadow-lg border border-teal-500/30 active:scale-95 transition-transform cursor-pointer"
            >
              <div className="w-7 h-7 rounded-xl bg-white/20 text-white flex items-center justify-center">
                <CalendarPlus size={15} />
              </div>
              <span className="text-xs font-bold whitespace-nowrap">
                Agendar Turno
              </span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setFabMenuAbierto((prev) => !prev)}
          aria-label="Acciones rápidas de agenda"
          className={`w-14 h-14 rounded-2xl text-white shadow-xl flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
            fabMenuAbierto
              ? "bg-slate-800 rotate-45 shadow-slate-900/40"
              : "bg-[#2eb086] hover:bg-[#259370] shadow-[#2eb086]/35"
          }`}
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>
    </>,
    document.body,
  );
}

