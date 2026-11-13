/** @format */

import { Search } from "lucide-react";

export function TablaHeader({
  busqueda,
  setBusqueda,
  placeholder = "Buscar...",
  children,
}) {
  return (
    <div className="p-3 sm:p-4 border-b border-teal-100 dark:border-slate-800 bg-gradient-to-r from-teal-50/40 via-white to-teal-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 sm:gap-3">
      <div className="relative w-full sm:max-w-xs md:max-w-sm">
        <Search
          size={17}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600/70 dark:text-emerald-400/70 pointer-events-none"
        />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9.5 pr-3.5 py-2 border border-teal-200/90 dark:border-slate-700 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-2xs"
        />
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {children}
        </div>
      )}
    </div>
  );
}

export default TablaHeader;

