/** @format */

import { Search, X } from "lucide-react";

export default function TablaHeader({
  inicioRegistro,
  finRegistro,
  total,
  search,
  setSearch,
  placeholder = "Buscar...",
  children,
}) {
  return (
    <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
      <div className="text-sm font-medium text-gray-500">
        Mostrando {inicioRegistro}-{finRegistro} de {total} registros
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {children}
        <div className="relative flex-1 sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              title="Borrar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
