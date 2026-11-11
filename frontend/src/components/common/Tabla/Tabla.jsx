/** @format */
import { SearchX, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import React from "react";

export default function Tabla({
  columnas,
  cargando,
  search = "", // Término de búsqueda opcional
  cantFilasSkeleton = 5, // Cantidad de filas fantasmas a mostrar durante la carga
  sinDatosText = "No hay registros disponibles.",
  vistaMovil, // Si se provee: en móvil (< md) se muestran tarjetas y la tabla solo desde md
  order,
  setOrder,
  children,
}) {
  // Verificamos si los children contienen filas con datos
  const tieneDatos = React.Children.count(children) > 0;
  const estaBuscando = search.trim().length > 0;

  return (
    <>
      {vistaMovil && <div className="md:hidden">{vistaMovil}</div>}
      <div
        className={`bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex-1 ${vistaMovil ? "hidden md:block" : ""}`}
      >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* ENCABEZADO DE LA TABLA: Fondo limpio y sutil con soporte de ordenamiento */}
          <thead className="bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
            <tr className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              {columnas.map((col, index) => {
                const esOrdenable = Boolean(col.sortField && setOrder);
                const estaOrdenadoPorEste = order?.column === col.sortField;

                return (
                  <th
                    key={index}
                    onClick={() => {
                      if (!esOrdenable) return;
                      const nextDir =
                        estaOrdenadoPorEste && order?.direction === "ASC"
                          ? "DESC"
                          : "ASC";
                      setOrder({ column: col.sortField, direction: nextDir });
                    }}
                    className={`px-6 py-3.5 ${
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                        ? "text-right"
                        : "text-left"
                    } ${
                      esOrdenable
                        ? "cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-100 hover:bg-gray-100/70 dark:hover:bg-slate-800/80 transition-colors group"
                        : ""
                    } ${col.className || ""}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === "center"
                          ? "justify-center"
                          : col.align === "right"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <span>{col.label}</span>
                      {esOrdenable && (
                        <span className="inline-flex shrink-0">
                          {estaOrdenadoPorEste ? (
                            order.direction === "ASC" ? (
                              <ArrowUp
                                size={13}
                                className="text-[#2eb086] stroke-[2.5]"
                              />
                            ) : (
                              <ArrowDown
                                size={13}
                                className="text-[#2eb086] stroke-[2.5]"
                              />
                            )
                          ) : (
                            <ArrowUpDown
                              size={12}
                              className="text-gray-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* CUERPO DE LA TABLA */}
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
            {cargando ? (
              /* ESTADO 1: SKELETON (Cargando / Buscando) */
              Array.from({ length: cantFilasSkeleton }).map((_, filaIdx) => (
                <tr key={filaIdx} className="animate-pulse">
                  {columnas.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4">
                      {/* Simulación de bloques de texto/elementos */}
                      <div className="flex items-center gap-3">
                        {/* Simula un avatar si es la primera columna */}
                        {colIdx === 0 && (
                          <div className="hidden md:block w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-700 shrink-0" />
                        )}
                        <div
                          className={`h-4 bg-gray-200 dark:bg-slate-700 rounded-md ${
                            colIdx === 0 ? "w-36" : colIdx === columnas.length - 1 ? "w-16 mx-auto" : "w-24"
                          }`}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            ) : tieneDatos ? (
              /* ESTADO 2: DATOS REALES */
              children
            ) : (
              /* ESTADO 3: SIN RESULTADOS */
              <tr>
                <td colSpan={columnas.length} className="py-12 text-center font-medium">
                  <div className="flex flex-col items-center justify-center gap-2">
                    {estaBuscando ? (
                      <>
                        <SearchX size={32} className="text-gray-300 dark:text-slate-600" />
                        <p className="text-gray-600 dark:text-slate-300 font-semibold">
                          No se encontraron resultados para <span className="text-gray-800 dark:text-slate-100">"{search}"</span>
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                          Intenta con otros términos de búsqueda o verifica que esté bien escrito.
                        </p>
                      </>
                    ) : (
                      <span className="text-gray-400 dark:text-slate-500">{sinDatosText}</span>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </>
  );
}
