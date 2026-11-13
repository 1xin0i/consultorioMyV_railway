/** @format */

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export function Tabla({
  columnas,
  datos,
  cargando,
  renderFila,
  renderTarjeta,
  ordenarPor,
  direccion,
  manejarOrden,
  mensajeVacio = "No se encontraron registros.",
  compacto = false,
}) {
  const thPadding = compacto ? "px-3 py-2.5" : "px-5 py-3.5";

  return (
    <div className="w-full">
      {renderTarjeta && (
        <div className="md:hidden divide-y divide-teal-100/70 dark:divide-slate-800">
          {cargando ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-4 space-y-2.5 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between gap-2">
                  <div className="h-4 bg-teal-50 dark:bg-slate-800 rounded w-1/2 animate-pulse" />
                  <div className="h-5 bg-teal-50 dark:bg-slate-800 rounded-full w-16 animate-pulse" />
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3 animate-pulse" />
              </div>
            ))
          ) : datos.length === 0 ? (
            <div className="px-4 py-10 text-center text-slate-500 dark:text-slate-400 text-sm">
              {mensajeVacio}
            </div>
          ) : (
            datos.map((item, idx) => renderTarjeta(item, idx))
          )}
        </div>
      )}

      <div
        className={`${renderTarjeta ? "hidden md:block" : "block"} overflow-x-auto w-full`}
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-[#e6f5ef] to-[#f0faf6] dark:from-slate-800 dark:to-slate-800/90 border-b border-teal-200/80 dark:border-slate-700 text-teal-900 dark:text-emerald-300 text-[11px] uppercase tracking-wider font-extrabold select-none">
              {columnas.map((col, idx) => {
                const esActiva = ordenarPor === col.campo;

                return (
                  <th
                    key={idx}
                    onClick={() => col.ordenable && manejarOrden(col.campo)}
                    className={`${thPadding} transition-colors whitespace-nowrap ${
                      col.ordenable
                        ? "cursor-pointer hover:bg-teal-100/60 dark:hover:bg-slate-700/60 hover:text-teal-950 dark:hover:text-emerald-200"
                        : ""
                    } ${col.centrado ? "text-center" : ""} ${col.derecha ? "text-right" : ""}`}
                  >
                    <div
                      className={`flex items-center gap-1 ${
                        col.centrado
                          ? "justify-center"
                          : col.derecha
                            ? "justify-end"
                            : ""
                      }`}
                    >
                      <span>{col.etiqueta}</span>

                      {col.ordenable && (
                        <span className="inline-flex">
                          {!esActiva && (
                            <ArrowUpDown
                              size={13}
                              className="text-teal-600/50 dark:text-slate-500"
                            />
                          )}
                          {esActiva && direccion === "ASC" && (
                            <ArrowUp size={13} className="text-[#0d8266] dark:text-emerald-400" />
                          )}
                          {esActiva && direccion === "DESC" && (
                            <ArrowDown size={13} className="text-[#0d8266] dark:text-emerald-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-teal-100/60 dark:divide-slate-800 text-xs sm:text-sm bg-white dark:bg-slate-900">
            {cargando ? (
              Array.from({ length: 5 }).map((_, rowIdx) => (
                <tr key={rowIdx}>
                  {columnas.map((_, colIdx) => (
                    <td key={colIdx} className={thPadding}>
                      <div className="h-4 bg-teal-50/70 dark:bg-slate-800 rounded animate-pulse w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : datos.length === 0 ? (
              <tr>
                <td
                  colSpan={columnas.length}
                  className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-medium"
                >
                  {mensajeVacio}
                </td>
              </tr>
            ) : (
              datos.map((item, idx) => renderFila(item, idx))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Tabla;

