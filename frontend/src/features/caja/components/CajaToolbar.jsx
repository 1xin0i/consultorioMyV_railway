/** @format */

import { useState } from "react";
import { Plus, X, TrendingUp, TrendingDown } from "lucide-react";
import TablaHeader from "@/shared/components/ui/Tabla/TablaHeader";

export function CajaToolbar({
  busqueda,
  setBusqueda,
  vistaActiva,
  setVistaActiva,
  turnosConSaldoCount,
  filtros,
  actualizarFiltro,
  limpiarFiltros,
  irAPagina,
}) {
  const tieneFiltrosActivos = Boolean(
    filtros.fechaInicio ||
      filtros.fechaFin ||
      filtros.medio_pago ||
      busqueda,
  );

  return (
    <TablaHeader
      busqueda={busqueda}
      setBusqueda={setBusqueda}
      placeholder="Buscar concepto, paciente o categoría..."
    >
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
        <div className="flex bg-teal-50/70 p-1 rounded-xl border border-teal-100 w-full sm:w-auto overflow-x-auto">
          {[
            { id: "todos", label: "Todos" },
            { id: "ingresos", label: "Ingresos" },
            { id: "gastos", label: "Gastos" },
            {
              id: "pendientes",
              label: `Por Cobrar${turnosConSaldoCount > 0 ? ` (${turnosConSaldoCount})` : ""}`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setVistaActiva(tab.id);
                irAPagina(1);
              }}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                vistaActiva === tab.id
                  ? "bg-[#0d8266] text-white shadow-2xs"
                  : "text-teal-800/70 hover:text-teal-950"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {(vistaActiva === "todos" || vistaActiva === "ingresos") && (
          <select
            value={filtros.medio_pago || ""}
            onChange={(e) => actualizarFiltro("medio_pago", e.target.value)}
            className="text-xs border border-teal-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer"
          >
            <option value="">Todos los medios</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta de Débito">Tarjeta de Débito</option>
            <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
            <option value="Mercado Pago">Mercado Pago</option>
          </select>
        )}

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <input
            type="date"
            value={filtros.fechaInicio || ""}
            onChange={(e) => actualizarFiltro("fechaInicio", e.target.value)}
            className="flex-1 sm:flex-initial text-xs border border-teal-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            title="Fecha desde"
          />
          <span className="text-teal-400 text-xs font-bold">-</span>
          <input
            type="date"
            value={filtros.fechaFin || ""}
            onChange={(e) => actualizarFiltro("fechaFin", e.target.value)}
            className="flex-1 sm:flex-initial text-xs border border-teal-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            title="Fecha hasta"
          />

          {tieneFiltrosActivos && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Limpiar filtros"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </TablaHeader>
  );
}

export function MenuFlotanteCajaMobile({ onNuevoIngreso, onNuevoGasto }) {
  const [fabAbierto, setFabAbierto] = useState(false);

  return (
    <div className="sm:hidden fixed bottom-20 right-4 z-30 flex flex-col items-end gap-2">
      {fabAbierto && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/20 -z-10"
            onClick={() => setFabAbierto(false)}
          />
          <button
            type="button"
            onClick={() => {
              setFabAbierto(false);
              onNuevoIngreso();
            }}
            className="flex items-center gap-2 bg-[#0d8266] text-white px-4 py-2.5 rounded-2xl shadow-lg font-bold text-xs animate-in fade-in slide-in-from-bottom-2 duration-150 cursor-pointer"
          >
            <TrendingUp size={16} />
            <span>Registrar Ingreso</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFabAbierto(false);
              onNuevoGasto();
            }}
            className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2.5 rounded-2xl shadow-lg font-bold text-xs animate-in fade-in slide-in-from-bottom-2 duration-150 cursor-pointer"
          >
            <TrendingDown size={16} />
            <span>Registrar Gasto</span>
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => setFabAbierto((prev) => !prev)}
        aria-label="Acciones rápidas de caja"
        className={`w-13 h-13 rounded-2xl shadow-xl flex items-center justify-center text-white transition-all duration-200 cursor-pointer ${
          fabAbierto
            ? "bg-slate-800 rotate-45"
            : "bg-[#0d8266] hover:bg-[#09664f]"
        }`}
      >
        <Plus size={24} />
      </button>
    </div>
  );
}

