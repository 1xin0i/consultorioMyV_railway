/** @format */

import { Search, X } from "lucide-react";

export function BarraFiltros({
  busqueda,
  onBusquedaChange,
  setBusqueda,
  placeholderBusqueda = "Buscar...",
  placeholder,
  children, // Tabs de estado o filtros principales a la izquierda
  extraRight, // Selectores extra a la derecha (ej: "Todos los meses", selects, etc.)
  className = "",
}) {
  const handleBusqueda = onBusquedaChange || setBusqueda;
  const placeholderFinal = placeholder || placeholderBusqueda;

  return (
    <div
      className={`w-full bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 p-2.5 sm:p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 mb-4 ${className}`}
    >
      {/* Izquierda: Filtros personalizados de cada página */}
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        {children}
      </div>

      {/* Derecha: Selectores opcionales + Buscador unificado */}
      <div className="flex flex-wrap items-center gap-2 ml-auto w-full sm:w-auto justify-end">
        {extraRight}

        {handleBusqueda && (
          <div className="relative flex items-center flex-1 sm:w-64 md:w-72">
            <Search
              size={15}
              className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none"
            />
            <input
              type="text"
              value={busqueda || ""}
              onChange={(e) => handleBusqueda(e.target.value)}
              placeholder={placeholderFinal}
              className="w-full pl-9 pr-8 py-2 bg-gray-100/90 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-slate-300/80 dark:focus:ring-slate-600 focus:border-slate-400 transition-all shadow-2xs"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => handleBusqueda("")}
                className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                title="Borrar búsqueda"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const BarraFiltro = BarraFiltros;
export default BarraFiltros;
