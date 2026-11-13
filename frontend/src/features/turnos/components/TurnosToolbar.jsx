/** @format */

import { DollarSign, X } from "lucide-react";
import TablaHeader from "@/shared/components/ui/Tabla/TablaHeader";

const TABS_ESTADO_TURNOS = [
  { id: "", label: "Todos" },
  { id: "1", label: "Programados" },
  { id: "2", label: "Atendidos" },
  { id: "3", label: "Cancelados" },
  { id: "4", label: "Inasistidos" },
];

export function TurnosToolbar({
  busqueda,
  setBusqueda,
  filtros,
  actualizarFiltro,
  limpiarFiltros,
  soloSinPagar,
  setSoloSinPagar,
  irAPagina,
}) {
  const tieneFiltrosActivos = Boolean(
    filtros.id_estado ||
      filtros.fechaInicio ||
      filtros.fechaFin ||
      busqueda ||
      soloSinPagar,
  );

  return (
    <TablaHeader
      busqueda={busqueda}
      setBusqueda={setBusqueda}
      placeholder="Buscar por paciente, DNI o notas..."
    >
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
        <div className="flex bg-teal-50/70 dark:bg-slate-800 p-1 rounded-xl border border-teal-100 dark:border-slate-700 w-full sm:w-auto overflow-x-auto">
          {TABS_ESTADO_TURNOS.map((tab) => {
            const activo = (filtros?.id_estado ?? "") === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  actualizarFiltro("id_estado", tab.id);
                  if (tab.id !== "" && tab.id !== "2") {
                    setSoloSinPagar(false);
                  }
                }}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activo
                    ? "bg-[#0d8266] text-white shadow-2xs"
                    : "text-teal-800/70 dark:text-slate-300 hover:text-teal-950 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            const next = !soloSinPagar;
            setSoloSinPagar(next);
            if (next && filtros.id_estado !== "2") {
              actualizarFiltro("id_estado", "2");
            }
            irAPagina(1);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${
            soloSinPagar
              ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
              : "bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40"
          }`}
        >
          <DollarSign size={13} />
          <span>Con Saldo Pendiente</span>
        </button>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <input
            type="date"
            value={filtros.fechaInicio || ""}
            onChange={(e) => actualizarFiltro("fechaInicio", e.target.value)}
            className="flex-1 sm:flex-initial text-xs border border-teal-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-100 font-medium bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            title="Fecha desde"
          />
          <span className="text-teal-400 text-xs font-bold">-</span>
          <input
            type="date"
            value={filtros.fechaFin || ""}
            onChange={(e) => actualizarFiltro("fechaFin", e.target.value)}
            className="flex-1 sm:flex-initial text-xs border border-teal-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-100 font-medium bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            title="Fecha hasta"
          />

          {tieneFiltrosActivos && (
            <button
              type="button"
              onClick={() => {
                setSoloSinPagar(false);
                limpiarFiltros();
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
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

