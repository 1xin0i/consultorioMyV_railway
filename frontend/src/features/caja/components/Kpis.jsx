/** @format */

import { ArrowUpRight, ArrowDownRight, Scale, Clock } from "lucide-react";

export function Kpis({
  kpis,
  periodoLabel = "",
  totalCobrosCount = 0,
  totalGastosCount = 0,
  totalPorCobrarCount = 0,
}) {
  const totalIngresos = Number(kpis.totalIngresos) || 0;
  const totalEgresos = Number(kpis.totalEgresos) || 0;
  const balanceNeto = Number(kpis.balanceNeto) || 0;
  const totalPendiente = Number(kpis.totalPendienteCobro) || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* ─── CARD 1: INGRESOS DEL MES ─── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block truncate">
            INGRESOS DEL MES
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 tabular-nums truncate">
            +${totalIngresos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs font-semibold text-[#0d8266] dark:text-emerald-400 flex items-center gap-1 mt-1 truncate">
            <ArrowUpRight size={13} className="shrink-0" />
            <span>
              {totalCobrosCount}{" "}
              {totalCobrosCount === 1 ? "cobro percibido" : "cobros percibidos"}
            </span>
          </span>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#2eb086] border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center shrink-0 shadow-2xs">
          <ArrowUpRight size={20} />
        </div>
      </div>

      {/* ─── CARD 2: EGRESOS / GASTOS ─── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block truncate">
            EGRESOS / GASTOS
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 tabular-nums truncate">
            -${totalEgresos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1 truncate">
            <ArrowDownRight size={13} className="shrink-0" />
            <span>
              {totalGastosCount}{" "}
              {totalGastosCount === 1 ? "gasto registrado" : "gastos registrados"}
            </span>
          </span>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/60 flex items-center justify-center shrink-0 shadow-2xs">
          <ArrowDownRight size={20} />
        </div>
      </div>

      {/* ─── CARD 3: BALANCE NETO ─── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block truncate">
            BALANCE NETO
          </span>
          <span
            className={`text-xl sm:text-2xl font-black mt-1 tabular-nums truncate ${
              balanceNeto >= 0
                ? "text-[#0d8266] dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {balanceNeto >= 0 ? "+" : "-"}$
            {Math.abs(balanceNeto).toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1 truncate">
            Ingresos menos egresos
          </span>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-[#2eb086] border border-teal-100 dark:border-teal-800/60 flex items-center justify-center shrink-0 shadow-2xs">
          <Scale size={20} />
        </div>
      </div>

      {/* ─── CARD 4: POR COBRAR ─── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block truncate">
              POR COBRAR
            </span>
            {totalPorCobrarCount > 0 && (
              <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded-md">
                {totalPorCobrarCount}
              </span>
            )}
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 tabular-nums truncate">
            ${totalPendiente.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs font-semibold text-amber-700/90 dark:text-amber-400/90 mt-1 truncate">
            Tratamientos y saldos
          </span>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/60 flex items-center justify-center shrink-0 shadow-2xs">
          <Clock size={20} />
        </div>
      </div>
    </div>
  );
}

export default Kpis;
