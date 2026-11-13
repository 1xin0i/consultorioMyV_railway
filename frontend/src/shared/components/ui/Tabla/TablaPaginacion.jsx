/** @format */

import { ChevronLeft, ChevronRight } from "lucide-react";

export function TablaPaginacion({
  paginaActual,
  totalPaginas,
  totalRegistros,
  irAPagina,
}) {
  return (
    <div className="p-3 sm:px-5 sm:py-3 border-t border-teal-100 dark:border-slate-800 bg-teal-50/30 dark:bg-slate-900 flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
      <span className="truncate font-medium">
        Total:{" "}
        <strong className="font-extrabold text-teal-900 dark:text-emerald-300">
          {totalRegistros}
        </strong>{" "}
        <span className="hidden xs:inline">registros</span>
      </span>

      <div className="flex items-center gap-2 shrink-0">
        <span className="font-medium text-slate-600 dark:text-slate-400">
          Pág.{" "}
          <strong className="text-slate-900 dark:text-slate-100 font-bold">{paginaActual}</strong> /{" "}
          <strong className="text-slate-900 dark:text-slate-100 font-bold">
            {totalPaginas || 1}
          </strong>
        </span>

        <div className="flex gap-1">
          <button
            onClick={() => irAPagina(paginaActual - 1)}
            disabled={paginaActual <= 1}
            className="p-1.5 border border-teal-200/80 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-teal-800 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={() => irAPagina(paginaActual + 1)}
            disabled={paginaActual >= totalPaginas}
            className="p-1.5 border border-teal-200/80 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-teal-800 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            aria-label="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TablaPaginacion;

