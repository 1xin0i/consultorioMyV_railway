/** @format */

import { useMemo } from "react";
import {
  DollarSign,
  Calendar,
  ChevronDown,
  FilterX,
} from "lucide-react";
import { BarraFiltros } from "@/shared/components/layout/BarraFiltro";

const TABS_ESTADO_TURNOS = [
  {
    id: "",
    label: "Todos",
    dot: null,
    activeClass:
      "bg-white text-slate-900 dark:bg-white dark:text-slate-900 shadow-xs",
  },
  {
    id: "2",
    label: "Atendidos",
    dot: "bg-emerald-500",
    activeClass:
      "bg-[#e8f7f0] text-emerald-900 border border-emerald-300/80 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700 shadow-2xs",
  },
  {
    id: "1",
    label: "Programados",
    dot: "bg-amber-500",
    activeClass:
      "bg-[#fffbeb] text-amber-900 border border-amber-300/80 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700 shadow-2xs",
  },
  {
    id: "3",
    label: "Cancelados",
    dot: "bg-rose-500",
    activeClass:
      "bg-[#fff1f2] text-rose-900 border border-rose-300/80 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700 shadow-2xs",
  },
  {
    id: "4",
    label: "Inasistidos",
    dot: "bg-slate-400",
    activeClass:
      "bg-slate-200 text-slate-900 border border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 shadow-2xs",
  },
];

export function TurnosToolbar({
  busqueda,
  setBusqueda,
  filtros = {},
  actualizarFiltro,
  limpiarFiltros,
  soloSinPagar,
  setSoloSinPagar,
  irAPagina,
}) {
  const estadoActivo = filtros.estadoFiltrado ?? filtros.id_estado ?? "";

  const tieneFiltrosActivos = Boolean(
    estadoActivo !== "" ||
    filtros.mes ||
    filtros.fechaInicio ||
    filtros.fechaFin ||
    busqueda ||
    soloSinPagar,
  );

  const opcionesMeses = useMemo(() => {
    const lista = [];
    const fechaRef = new Date();
    // 2 meses hacia adelante y 10 meses hacia atrás
    for (let i = 2; i >= -10; i--) {
      const d = new Date(fechaRef.getFullYear(), fechaRef.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const valor = `${y}-${m}`;
      const nombreMes = d.toLocaleDateString("es-AR", { month: "long" });
      const label = `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${y}`;
      lista.push({ valor, label });
    }
    return lista;
  }, []);

  const handleSeleccionarEstado = (tabId) => {
    actualizarFiltro("estadoFiltrado", tabId);
    actualizarFiltro("id_estado", tabId);
    if (tabId !== "" && tabId !== "2") {
      setSoloSinPagar(false);
    }
    if (irAPagina) irAPagina(1);
  };

  const handleLimpiarTodo = () => {
    setSoloSinPagar(false);
    limpiarFiltros();
    if (irAPagina) irAPagina(1);
  };

  return (
    <BarraFiltros
      busqueda={busqueda}
      setBusqueda={setBusqueda}
      placeholder="Buscar paciente, DNI..."
      className="mb-0"
      extraRight={
        <>
          {/* Selector de Mes */}
          <div className="relative flex items-center min-w-[160px] sm:min-w-[175px]">
            <Calendar
              size={14}
              className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none"
            />
            <select
              value={filtros.mes || ""}
              onChange={(e) => {
                actualizarFiltro("mes", e.target.value);
                if (irAPagina) irAPagina(1);
              }}
              className="w-full appearance-none pl-8.5 pr-8 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 cursor-pointer shadow-2xs transition-colors"
            >
              <option value="">Todos los meses</option>
              {opcionesMeses.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Botón para limpiar filtros */}
          {tieneFiltrosActivos && (
            <button
              type="button"
              onClick={handleLimpiarTodo}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-transparent hover:border-rose-200 transition-colors cursor-pointer shrink-0"
              title="Limpiar todos los filtros"
            >
              <FilterX size={16} />
            </button>
          )}
        </>
      }
    >
      {/* Lado izquierdo: Tabs por Estado en contenedor gris suave */}
      <div className="flex items-center bg-gray-100/90 dark:bg-slate-800/90 border border-gray-200/90 dark:border-slate-700 p-1 rounded-2xl overflow-x-auto shadow-2xs">
        {TABS_ESTADO_TURNOS.map((tab) => {
          const activo = String(estadoActivo) === String(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSeleccionarEstado(tab.id)}
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

      {/* Toggle con Saldo Pendiente */}
      <button
        type="button"
        onClick={() => {
          const next = !soloSinPagar;
          setSoloSinPagar(next);
          if (next && estadoActivo !== "2") {
            handleSeleccionarEstado("2");
          }
          if (irAPagina) irAPagina(1);
        }}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shadow-2xs ${
          soloSinPagar
            ? "bg-amber-500 text-white border-amber-600 shadow-xs"
            : "bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border-gray-200 dark:border-slate-700 hover:bg-amber-50/60 dark:hover:bg-amber-950/40"
        }`}
        title="Filtrar turnos atendidos con saldo pendiente de cobro"
      >
        <DollarSign size={13} />
        <span>Con Saldo Pendiente</span>
      </button>
    </BarraFiltros>
  );
}

export default TurnosToolbar;
