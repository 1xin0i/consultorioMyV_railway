import {
  Plus,
  Minus,
  Tag,
  ChevronDown,
  ChevronUp,
  Banknote,
  CreditCard,
  CalendarClock,
} from "lucide-react";
import { formatFechaHoraTabla } from "../../../utils";

export function VistaCronologica({ movimientosUnificados }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="divide-y divide-slate-100">
        {movimientosUnificados.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-8">
            Sin movimientos registrados en este período.
          </p>
        ) : (
          movimientosUnificados.map((m) => {
            const esIngreso = m.tipo === "ingreso";
            return (
              <div
                key={m.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl text-xs font-semibold ${
                      esIngreso
                        ? "bg-emerald-50 text-[#1b7f5b] border border-emerald-100"
                        : "bg-rose-50 text-rose-600 border border-rose-100"
                    }`}
                  >
                    {esIngreso ? <Plus size={16} /> : <Minus size={16} />}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 text-sm block tracking-tight">
                      {m.concepto}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">
                      {formatFechaHoraTabla(m.fecha)} • {m.metodo_pago}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      esIngreso ? "text-emerald-700" : "text-rose-600"
                    }`}
                  >
                    {esIngreso ? "+" : "-"}$
                    {m.monto.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <span className="block text-[11px] font-mono text-slate-400">
                    {m.comprobante}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function VistaLibroMayor({
  egresosPorCategoria,
  categoriaAbierta,
  setCategoriaAbierta,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
      {egresosPorCategoria.length === 0 ? (
        <p className="text-xs text-slate-400 italic text-center py-8">
          Sin egresos registrados para agrupar por categoría en este período.
        </p>
      ) : (
        egresosPorCategoria.map((cat) => {
          const estaAbierta = categoriaAbierta === cat.nombre;
          return (
            <div key={cat.nombre} className="flex flex-col">
              {/* Cabecera de la categoría (Acordeon) */}
              <button
                type="button"
                onClick={() =>
                  setCategoriaAbierta(estaAbierta ? null : cat.nombre)
                }
                className="p-4 flex items-center justify-between hover:bg-slate-50/70 w-full text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 font-semibold text-xs">
                    <Tag size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 text-sm block tracking-tight">
                      {cat.nombre}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">
                      {cat.items.length} movimientos
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold tabular-nums text-rose-600">
                    -$
                    {cat.total.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  {estaAbierta ? (
                    <ChevronUp size={16} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>
              </button>

              {/* Detalle interno de los gastos de esa categoría */}
              {estaAbierta && (
                <div className="bg-gray-50/50 px-6 py-3 divide-y divide-gray-100">
                  {cat.items.map((g) => (
                    <div
                      key={g.id_gasto}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-gray-700 block">
                          {g.concepto}
                        </span>
                        <span className="text-gray-400">
                          {formatFechaHoraTabla(g.fecha_gasto)} • {g.metodo_pago}
                        </span>
                      </div>
                      <span className="font-bold text-rose-600">
                        -$
                        {Number(g.monto).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export function VistaPendientes({
  turnosPendientes = [],
  cuotasPendientes = [],
  abrirCobroParaTurno,
  abrirCobroParaCuota,
}) {
  const tienePendientes =
    turnosPendientes.length > 0 || cuotasPendientes.length > 0;

  if (!tienePendientes) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-8 text-center">
        <p className="text-xs text-gray-400 italic">
          ¡Genial! No hay atenciones ni cuotas pendientes de cobro al día de hoy.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* SECCIÓN 1: TURNOS ATENDIDOS SIN COBRO REGISTRADO */}
      {turnosPendientes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-amber-500" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Atenciones sin Cobrar ({turnosPendientes.length})
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">
              Turnos atendidos sin cobro emitido
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {turnosPendientes.map((t) => (
              <div
                key={t.id_turno}
                className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/50"
              >
                <div>
                  <span className="font-bold text-gray-800 text-sm block">
                    {t.Paciente
                      ? `${t.Paciente.apellido}, ${t.Paciente.nombre}`
                      : `Paciente #${t.id_paciente}`}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatFechaHoraTabla(t.fecha_hora_inicio)} •{" "}
                    {t.notas_consulta || "Atención realizada"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-amber-600 text-sm">
                    $
                    {Number(t.precio_final || 0).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => abrirCobroParaTurno(t)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2eb086] hover:bg-[#259370] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <Banknote size={14} />
                    <span>Cobrar Atención</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: CUOTAS VENCIDAS O CON VENCIMIENTO HASTA HOY */}
      {cuotasPendientes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-amber-600" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Cuotas Adeudadas Hasta Hoy ({cuotasPendientes.length})
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">
              Vencidas o con vencimiento en la fecha
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {cuotasPendientes.map((q) => {
              const paciente = q.Cobro?.Paciente;
              const nombrePaciente = paciente
                ? `${paciente.apellido}, ${paciente.nombre}`
                : "Paciente";
              const pendienteCuota = Math.max(
                0,
                (Number(q.monto_cuota) || 0) - (Number(q.monto_cobrado) || 0),
              );

              return (
                <div
                  key={q.id_cuota}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/50"
                >
                  <div>
                    <span className="font-bold text-gray-800 text-sm block">
                      {nombrePaciente}
                    </span>
                    <span className="text-xs text-gray-400">
                      Cuota #{q.nro_cuota} • Vencimiento:{" "}
                      {q.fecha_vencimiento || "Sin fecha"}
                      {q.estado === "Parcialmente pagada" && (
                        <span className="ml-1 text-amber-600 font-semibold">
                          (Pago parcial: ${Number(q.monto_cobrado).toLocaleString("es-AR")})
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-rose-600 text-sm">
                      $
                      {pendienteCuota.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    {abrirCobroParaCuota && (
                      <button
                        type="button"
                        onClick={() => abrirCobroParaCuota(q)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2eb086] hover:bg-[#259370] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <Banknote size={14} />
                        <span>Cobrar Cuota</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
