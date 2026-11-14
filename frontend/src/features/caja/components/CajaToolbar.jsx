/** @format */

import { useState } from "react";
import { Plus, FilterX, TrendingUp, TrendingDown } from "lucide-react";
import { BarraFiltros } from "@/shared/components/layout/BarraFiltro";
import { SelectorPeriodoCaja } from "./SelectorPeriodoCaja";

export function CajaToolbar({
  busqueda,
  setBusqueda,
  vistaActiva,
  setVistaActiva,
  turnosConSaldoCount,
  filtros,
  actualizarFiltro,
  actualizarFiltros,
  limpiarFiltros,
  irAPagina,
}) {
  const tieneFiltrosActivos = Boolean(
    filtros.medio_pago || busqueda,
  );

  return (
    <BarraFiltros
      busqueda={busqueda}
      setBusqueda={setBusqueda}
      placeholder="Buscar concepto, paciente o categoría..."
      className="mb-3 sm:mb-4"
      extraRight={
        <div className="flex flex-wrap items-center gap-2">
          {(vistaActiva === "todos" || vistaActiva === "ingresos") && (
            <select
              value={filtros.medio_pago || ""}
              onChange={(e) => actualizarFiltro("medio_pago", e.target.value)}
              className="text-xs border border-gray-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-100 font-semibold bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 cursor-pointer shadow-2xs"
            >
              <option value="">Todos los medios</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta de Débito">Tarjeta de Débito</option>
              <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
              <option value="Mercado Pago">Mercado Pago</option>
            </select>
          )}

          <SelectorPeriodoCaja
            filtros={filtros}
            actualizarFiltros={actualizarFiltros}
            actualizarFiltro={actualizarFiltro}
          />

          {tieneFiltrosActivos && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-transparent hover:border-rose-200 transition-colors cursor-pointer shrink-0"
              title="Limpiar filtros adicionales"
            >
              <FilterX size={16} />
            </button>
          )}
        </div>
      }
    >
      <div className="flex items-center bg-gray-100/90 dark:bg-slate-800/90 border border-gray-200/90 dark:border-slate-700 p-1 rounded-2xl overflow-x-auto shadow-2xs">
        {[
          {
            id: "todos",
            label: "Todos",
            dot: null,
            activeClass:
              "bg-white text-slate-900 dark:bg-white dark:text-slate-900 shadow-xs",
          },
          {
            id: "ingresos",
            label: "Ingresos",
            dot: "bg-emerald-500",
            activeClass:
              "bg-[#e8f7f0] text-emerald-900 border border-emerald-300/80 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700 shadow-2xs",
          },
          {
            id: "gastos",
            label: "Egresos",
            dot: "bg-rose-500",
            activeClass:
              "bg-[#fff1f2] text-rose-900 border border-rose-300/80 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700 shadow-2xs",
          },
          {
            id: "pendientes",
            label: `Por Cobrar${turnosConSaldoCount > 0 ? ` (${turnosConSaldoCount})` : ""}`,
            dot: "bg-amber-500",
            activeClass:
              "bg-[#fffbeb] text-amber-900 border border-amber-300/80 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700 shadow-2xs",
          },
        ].map((tab) => {
          const activo = vistaActiva === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setVistaActiva(tab.id);
                irAPagina(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 select-none ${
                activo
                  ? tab.activeClass
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60"
              }`}
            >
              {tab.dot && (
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${tab.dot}`}
                />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </BarraFiltros>
  );
}

export function MenuFlotanteCajaMobile({ onNuevoIngreso, onNuevoGasto }) {
  const [fabAbierto, setFabAbierto] = useState(false);

  return (
    <div className="sm:hidden fixed bottom-20 right-4 z-20 flex flex-col items-end gap-2">
      {fabAbierto && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/30 -z-10"
            onClick={() => setFabAbierto(false)}
          />
          <button
            type="button"
            onClick={() => {
              setFabAbierto(false);
              onNuevoIngreso();
            }}
            className="flex items-center gap-2 bg-[#0d8266] text-white px-3.5 py-2 rounded-xl shadow-lg font-bold text-xs animate-in fade-in slide-in-from-bottom-2 duration-150 cursor-pointer active:scale-95"
          >
            <TrendingUp size={15} />
            <span>Registrar Ingreso</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFabAbierto(false);
              onNuevoGasto();
            }}
            className="flex items-center gap-2 bg-rose-600 text-white px-3.5 py-2 rounded-xl shadow-lg font-bold text-xs animate-in fade-in slide-in-from-bottom-2 duration-150 cursor-pointer active:scale-95"
          >
            <TrendingDown size={15} />
            <span>Registrar Egreso</span>
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => setFabAbierto((prev) => !prev)}
        aria-label="Acciones rápidas de caja"
        className={`w-11 h-11 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 cursor-pointer active:scale-95 ${
          fabAbierto
            ? "bg-slate-800 rotate-45"
            : "bg-[#0d8266] hover:bg-[#09664f]"
        }`}
      >
        <Plus size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
}

