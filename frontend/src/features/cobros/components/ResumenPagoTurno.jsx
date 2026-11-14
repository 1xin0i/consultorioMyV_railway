/** @format */

import { formatDateTime } from "@/shared/utils";
import {
  User,
  Calendar,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Receipt,
} from "lucide-react";

const LABEL_CLASS =
  "block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1";

export function ResumenPagoTurno({
  turnoElegido,
  nombrePaciente,
  practicasDelTurno,
  resumenFinanciero,
  cobrosPrevios,
  montoAbonar,
  setMontoAbonar,
  cargandoDetalle,
}) {
  return (
    <>
      {/* Ficha contextual del Turno y Prácticas */}
      <div className="bg-gradient-to-br from-teal-50/90 via-emerald-50/40 to-teal-50/60 border border-teal-200/80 rounded-2xl p-4 flex flex-col gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0d8266] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              <User size={17} />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                {nombrePaciente || "Paciente"}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-teal-800/80 font-medium">
                <Calendar size={12} />
                <span>{formatDateTime(turnoElegido.fecha_hora_inicio)}</span>
                <span className="font-mono font-bold text-teal-900">
                  · Turno #{turnoElegido.id_turno}
                </span>
              </div>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              resumenFinanciero.saldoPendienteActual <= 0
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : resumenFinanciero.montoAbonadoPrevio > 0
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-rose-100 text-rose-800 border-rose-200"
            }`}
          >
            {resumenFinanciero.saldoPendienteActual <= 0
              ? "Saldado"
              : resumenFinanciero.montoAbonadoPrevio > 0
                ? "Pago Parcial"
                : "Pendiente de Cobro"}
          </span>
        </div>

        {practicasDelTurno.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-teal-200/60">
            {practicasDelTurno.map((pt, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] font-bold bg-white text-[#0d8266] border border-teal-200 px-2.5 py-0.5 rounded-lg shadow-2xs"
              >
                <Stethoscope size={11} />
                <span>
                  {pt.Practica?.nombre_referencia ||
                    pt.Practica?.nombre_nomenclador ||
                    "Práctica"}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Tarjetas de Resumen Financiero */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-white/90 border border-teal-100 rounded-xl p-2.5">
            <span className="block text-[10px] font-bold text-slate-500 uppercase">
              Total Turno
            </span>
            <span className="text-sm font-black text-slate-900">
              $ {resumenFinanciero.montoTotal.toLocaleString("es-AR")}
            </span>
          </div>

          <div className="bg-white/90 border border-emerald-200/80 rounded-xl p-2.5">
            <span className="block text-[10px] font-bold text-emerald-700 uppercase">
              Ya Abonado
            </span>
            <span className="text-sm font-black text-emerald-700">
              $ {resumenFinanciero.montoAbonadoPrevio.toLocaleString("es-AR")}
            </span>
          </div>

          <div className="bg-amber-50/90 border border-amber-300/80 rounded-xl p-2.5">
            <span className="block text-[10px] font-bold text-amber-800 uppercase">
              Saldo Pendiente
            </span>
            <span className="text-sm font-black text-amber-900">
              $ {resumenFinanciero.saldoPendienteActual.toLocaleString("es-AR")}
            </span>
          </div>
        </div>

        {/* Historial de entregas previas si existen */}
        {cobrosPrevios.length > 0 && (
          <div className="bg-white/80 rounded-xl p-2.5 border border-teal-100 text-xs">
            <span className="font-bold text-teal-950 block mb-1">
              Entregas registradas anteriormente ({cobrosPrevios.length}):
            </span>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {cobrosPrevios.map((c) => (
                <div
                  key={c.id_cobro}
                  className="flex items-center justify-between text-[11px] text-slate-600"
                >
                  <span>
                    {formatDateTime(c.fecha_cobro)} ·{" "}
                    <strong className="text-slate-800">{c.medio_pago}</strong>
                  </span>
                  <span className="font-bold text-emerald-700">
                    + $ {Number(c.monto_pagado).toLocaleString("es-AR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Monto a cobrar + Simulación en oración debajo */}
      <div>
        <label className={LABEL_CLASS}>Monto a cobrar ($) *</label>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-[#0d8266] font-extrabold text-base">
            $
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={resumenFinanciero.saldoPendienteActual || undefined}
            required
            disabled={cargandoDetalle}
            value={montoAbonar}
            onChange={(e) => setMontoAbonar(e.target.value)}
            placeholder="0.00"
            className="w-full pl-8 pr-3 py-2.5 border border-teal-300 bg-teal-50/40 rounded-xl text-base font-black text-teal-950 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-2xs"
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
          {resumenFinanciero.saldoRestanteLuegoDePago === 0 ? (
            <span className="text-emerald-700 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
              <Sparkles size={14} className="text-emerald-600 shrink-0" />
              Saldo luego de este pago: $0 (queda saldado).
            </span>
          ) : (
            <span className="text-amber-800 dark:text-amber-300 font-semibold inline-flex items-center gap-1">
              <AlertCircle size={14} className="text-amber-600 shrink-0" />
              Saldo luego de este pago: ${resumenFinanciero.saldoRestanteLuegoDePago.toLocaleString("es-AR")} pendiente.
            </span>
          )}
        </p>
      </div>
    </>
  );
}

