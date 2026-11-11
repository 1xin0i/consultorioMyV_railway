/** @format */
import React from "react";
import { ChevronDown } from "lucide-react";

export default function TablaPaginacion({
  page,
  setPage,
  totalPages = 1,
  total = 0,
  inicioRegistro,
  finRegistro,
  limit,
  setLimit,
}) {
  const paginasTotales = Math.max(1, totalPages || 1);
  const paginaActual = Math.min(Math.max(1, page || 1), paginasTotales);

  // Calcular registro inicial y final si no vienen por props
  const lim = limit || 9;
  const inicio =
    inicioRegistro !== undefined
      ? inicioRegistro
      : total === 0
      ? 0
      : (paginaActual - 1) * lim + 1;
  const fin =
    finRegistro !== undefined
      ? finRegistro
      : total === 0
      ? 0
      : Math.min(paginaActual * lim, total);

  // Generador de números de página según el requerimiento:
  // Si estás en 1 o 2: 1, 2, 3, ..., final
  // Si estás en 3: 2, 3, 4, ..., final
  // Si estás más adelante: 1, ..., p-1, p, p+1, ..., final
  const calcularPaginas = () => {
    if (paginasTotales <= 5) {
      return Array.from({ length: paginasTotales }, (_, i) => i + 1);
    }

    let start = paginaActual - 1;
    let end = paginaActual + 1;

    if (paginaActual <= 2) {
      start = 1;
      end = 3;
    } else if (paginaActual >= paginasTotales - 1) {
      start = paginasTotales - 2;
      end = paginasTotales;
    }

    const paginas = [];

    if (start > 1) {
      if (start > 2) {
        paginas.push(1);
        paginas.push("...");
      }
    }

    for (let i = start; i <= end; i++) {
      paginas.push(i);
    }

    if (end < paginasTotales) {
      if (end < paginasTotales - 1) {
        paginas.push("...");
      }
      paginas.push(paginasTotales);
    }

    return paginas;
  };

  const paginas = calcularPaginas();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      {/* LADO IZQUIERDO: Conteo y selector de filas por página */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500 dark:text-slate-400 font-medium">
        <span>
          Mostrando{" "}
          <strong className="text-slate-800 dark:text-slate-200 font-semibold">
            {total === 0 ? "0" : `${inicio}-${fin}`}
          </strong>{" "}
          de{" "}
          <strong className="text-slate-800 dark:text-slate-200 font-semibold">
            {total}
          </strong>{" "}
          registros
        </span>

        {setLimit && limit && (
          <div className="flex items-center gap-1.5 pl-2 sm:pl-3 border-l border-gray-200 dark:border-slate-700">
            <span>Filas por página:</span>
            <div className="relative inline-flex items-center">
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="appearance-none bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg pl-2 pr-6 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2eb086] cursor-pointer"
              >
                <option value={9}>9</option>
                <option value={18}>18</option>
                <option value={27}>27</option>
                <option value={45}>45</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-1.5 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* LADO DERECHO: Paginador con botones numéricos */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          disabled={paginaActual <= 1}
          onClick={() => setPage(paginaActual - 1)}
          className="px-2.5 sm:px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
        >
          Anterior
        </button>

        <div className="flex items-center gap-1">
          {paginas.map((item, idx) => {
            if (item === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 py-1 text-xs text-gray-400 dark:text-slate-500 font-semibold select-none"
                >
                  ...
                </span>
              );
            }

            const esActivo = item === paginaActual;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setPage(item)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                  esActivo
                    ? "bg-[#2eb086] text-white shadow-xs border border-[#2eb086]"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300"
                }`}
                aria-current={esActivo ? "page" : undefined}
              >
                {item}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={paginaActual >= paginasTotales}
          onClick={() => setPage(paginaActual + 1)}
          className="px-2.5 sm:px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
