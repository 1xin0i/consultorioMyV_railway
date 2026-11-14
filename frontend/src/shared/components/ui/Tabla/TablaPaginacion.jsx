/** @format */

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Genera el rango de números y elipses para la paginación con truncado inteligente.
 * Devuelve un máximo de 7 elementos en escritorio.
 */
export function getPaginationRange(currentPage, totalPages) {
  if (totalPages <= 1) return [];

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

export function TablaPaginacion({
  paginaActual,
  currentPage,
  pagina,
  totalPaginas,
  totalPages,
  totalRegistros,
  totalItems,
  irAPagina,
  onPageChange,
  className = "",
}) {
  const actual = Number(paginaActual ?? currentPage ?? pagina ?? 1);
  const total = Number(totalPaginas ?? totalPages ?? 1);
  const totalReg = totalRegistros ?? totalItems;
  const onCambiar = irAPagina ?? onPageChange;

  // Si totalPages <= 1: no renderizar la barra de paginación
  if (total <= 1) {
    return null;
  }

  const curPage = Math.max(1, Math.min(actual, total));
  const range = getPaginationRange(curPage, total);

  return (
    <div
      className={`p-3 sm:pl-7 sm:pr-7 lg:pl-8 lg:pr-8 sm:py-3.5 border-t border-gray-200/90 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 ${className}`}
    >
      {/* Resumen del total de registros */}
      {totalReg !== undefined && totalReg !== null ? (
        <span className="truncate font-medium">
          Total:{" "}
          <strong className="font-extrabold text-slate-900 dark:text-slate-100">
            {totalReg}
          </strong>{" "}
          <span className="hidden xs:inline">registros</span>
        </span>
      ) : (
        <span />
      )}

      {/* Controles de paginación numerada */}
      <nav
        role="navigation"
        aria-label="Paginación"
        className="flex items-center gap-1 sm:gap-1.5 ml-auto sm:ml-0"
      >
        {/* Botón Anterior */}
        <button
          type="button"
          onClick={() => onCambiar?.(curPage - 1)}
          disabled={curPage <= 1}
          className="inline-flex items-center gap-1 px-2.5 sm:px-3 h-8 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/60 font-semibold text-xs transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800 cursor-pointer"
          aria-label="Página anterior"
        >
          <ChevronLeft size={15} />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Números de página y truncado */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {range.map((item, idx) => {
            if (item === "...") {
              return (
                <span
                  key={`dots-${idx}`}
                  className="min-w-[24px] sm:min-w-[28px] h-8 inline-flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-xs select-none"
                >
                  ...
                </span>
              );
            }

            const esActual = item === curPage;
            const esIntermedio = item !== 1 && item !== total && !esActual;

            return (
              <button
                key={`page-${item}`}
                type="button"
                onClick={() => onCambiar?.(item)}
                aria-current={esActual ? "page" : undefined}
                aria-label={`Página ${item}`}
                className={`min-w-[32px] h-8 px-2 sm:px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer items-center justify-center select-none ${
                  esIntermedio ? "hidden sm:inline-flex" : "inline-flex"
                } ${
                  esActual
                    ? "bg-[#0d8266] text-white shadow-xs border border-[#0d8266] dark:bg-[#0d8266] dark:text-white"
                    : "text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/60 shadow-2xs"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Botón Siguiente */}
        <button
          type="button"
          onClick={() => onCambiar?.(curPage + 1)}
          disabled={curPage >= total}
          className="inline-flex items-center gap-1 px-2.5 sm:px-3 h-8 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/60 font-semibold text-xs transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800 cursor-pointer"
          aria-label="Página siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight size={15} />
        </button>
      </nav>
    </div>
  );
}

export default TablaPaginacion;
