/** @format */

import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
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
          <div className="inline-flex rounded-xl border border-gray-200 dark:border-slate-700 bg-[#f2f5f6] dark:bg-slate-800 p-0.5 shadow-2xs flex-1 sm:flex-initial">
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
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  vista === item.id
                    ? "bg-white text-black border-2 border-black font-bold shadow-xs"
                    : "text-gray-600 font-semibold dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AgendaFabMobile() {
  return null;
}
