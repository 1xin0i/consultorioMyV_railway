/** @format */

import { useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CreditCard,
  Receipt,
  Check,
  Eye,
} from "lucide-react";
import {
  formatFechaTabla,
  obtenerColorAvatar,
  obtenerIniciales,
} from "../../../utils";

/* ─── VISTA 1: TODOS LOS MOVIMIENTOS (TABLA UNIFICADA) ─────────────────────── */
export function VistaCronologica({ movimientosUnificados = [] }) {
  if (movimientosUnificados.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          No hay movimientos registrados en este período.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              <th className="px-4 py-3.5 text-center">TIPO</th>
              <th className="px-4 py-3.5">CONCEPTO / PACIENTE</th>
              <th className="px-4 py-3.5">FECHA Y HORA</th>
              <th className="px-4 py-3.5">MÉTODO DE PAGO</th>
              <th className="px-4 py-3.5">COMPROBANTE</th>
              <th className="px-4 py-3.5 text-right">IMPORTE</th>
            </tr>
          </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {movimientosUnificados.map((m) => {
            const esIngreso = m.tipo === "ingreso";
            const fechaObj = new Date(m.fecha);
            const fechaStr = !isNaN(fechaObj.getTime())
              ? `${String(fechaObj.getDate()).padStart(2, "0")}/${String(
                  fechaObj.getMonth() + 1
                ).padStart(2, "0")}/${fechaObj.getFullYear()}`
              : "—";
            const horaStr = !isNaN(fechaObj.getTime())
              ? `${String(fechaObj.getHours()).padStart(2, "0")}:${String(
                  fechaObj.getMinutes()
                ).padStart(2, "0")} hs`
              : "";

            return (
              <tr
                key={m.id}
                className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* TIPO CON CUADRO REDONDEADO Y FLECHA */}
                <td className="px-4 py-3.5 text-center whitespace-nowrap">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-xl ${
                      esIngreso
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400"
                    }`}
                  >
                    {esIngreso ? (
                      <ArrowDownLeft size={16} />
                    ) : (
                      <ArrowUpRight size={16} />
                    )}
                  </span>
                </td>

                {/* CONCEPTO / PACIENTE */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm tracking-tight">
                        {m.concepto}
                      </span>
                      {!esIngreso && m.categoria && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60">
                          {m.categoria}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
                      {m.subtitulo || m.categoria || "Operación de consultorio"}
                    </span>
                  </div>
                </td>

                {/* FECHA Y HORA */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="flex flex-col text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <span>{fechaStr}</span>
                    <span className="text-xs font-normal text-slate-400">
                      {horaStr}
                    </span>
                  </div>
                </td>

                {/* MÉTODO DE PAGO */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700">
                    <CreditCard size={13} className="text-slate-400" />
                    <span>{m.metodo_pago || "Efectivo"}</span>
                  </span>
                </td>

                {/* COMPROBANTE */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                    {m.comprobante || "Recibo #"}
                  </span>
                </td>

                {/* IMPORTE */}
                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                  <span
                    className={`text-sm font-black tabular-nums ${
                      esIngreso
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {esIngreso ? "+" : "-"}$
                    {Number(m.monto || 0).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}

/* ─── VISTA 2: DETALLE DE INGRESOS (TABLA) ─────────────────────────────────── */
export function VistaDetalleIngresos({ cobros = [] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                <th className="px-4 py-3.5">PACIENTE</th>
                <th className="px-4 py-3.5">CONCEPTO / PRÁCTICA</th>
                <th className="px-4 py-3.5">FECHA</th>
                <th className="px-4 py-3.5">MÉTODO</th>
                <th className="px-4 py-3.5">RECIBO</th>
                <th className="px-4 py-3.5 text-right">IMPORTE COBRADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {cobros.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400 italic">
                  Sin cobros registrados en este período.
                </td>
              </tr>
            ) : (
              cobros.map((c) => {
                const idCobro = c.id || c.id_cobro;
                const pacienteNombre = c.Paciente
                  ? `${c.Paciente.nombre} ${c.Paciente.apellido}`
                  : "Paciente";
                const cobradoTotal =
                  Number(c.monto ?? c.monto_cobrado ?? c.monto_a_cobrar) || 0;
                const fechaObj = new Date(
                  c.fecha_cobro || c.fecha_emision || c.created_at || c.createdAt
                );
                const fechaStr = !isNaN(fechaObj.getTime())
                  ? `${String(fechaObj.getDate()).padStart(2, "0")}/${String(
                      fechaObj.getMonth() + 1
                    ).padStart(2, "0")}/${fechaObj.getFullYear()} ${String(
                      fechaObj.getHours()
                    ).padStart(2, "0")}:${String(fechaObj.getMinutes()).padStart(
                      2,
                      "0"
                    )}`
                  : "—";

                return (
                  <tr
                    key={idCobro}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {pacienteNombre}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                      {c.observaciones || c.concepto || "Consulta Odontológica"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {fechaStr}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-[#0d8266] border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {c.metodo_pago || c.modalidad || "Efectivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      #{idCobro}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-[#0d8266] dark:text-emerald-400 tabular-nums whitespace-nowrap">
                      +$
                      {cobradoTotal.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── VISTA 3: DETALLE DE EGRESOS (TABLA) ──────────────────────────────────── */
export function VistaLibroMayor({ gastos = [] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                <th className="px-4 py-3.5">PROVEEDOR / DESTINATARIO</th>
                <th className="px-4 py-3.5">CATEGORÍA</th>
                <th className="px-4 py-3.5">FECHA</th>
                <th className="px-4 py-3.5">DETALLE</th>
                <th className="px-4 py-3.5 text-right">IMPORTE PAGADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {gastos.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400 italic">
                  Sin gastos registrados en este período.
                </td>
              </tr>
            ) : (
              gastos.map((g) => {
                const fechaObj = new Date(g.fecha_gasto || g.createdAt);
                const fechaStr = !isNaN(fechaObj.getTime())
                  ? `${String(fechaObj.getDate()).padStart(2, "0")}/${String(
                      fechaObj.getMonth() + 1
                    ).padStart(2, "0")}/${fechaObj.getFullYear()} ${String(
                      fechaObj.getHours()
                    ).padStart(2, "0")}:${String(fechaObj.getMinutes()).padStart(
                      2,
                      "0"
                    )}`
                  : "—";
                const categoriaNombre =
                  g.CategoriaGasto?.nombre || g.categoria || "Gasto General";

                return (
                  <tr
                    key={g.id_gasto}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {g.destinatario || g.proveedor || g.concepto}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {g.rubro || "Proveedor Dental"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300">
                        {categoriaNombre}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                      {fechaStr}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {g.detalle || g.concepto || "Sin detalle adicional"}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap">
                      -$
                      {Number(g.monto || 0).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── VISTA 4: POR COBRAR (TABLA CON ACCIÓN COBRAR) ────────────────────────── */
export function VistaPendientes({
  turnosPendientes = [],
  cuotasPendientes = [],
  onCobrarItem,
  onVerTurno,
}) {
  const itemsPorCobrar = useMemo(() => {
    const mapa = new Map();

    // 1. Turnos atendidos pendientes de cobro (sin solicitud aún)
    (turnosPendientes || []).forEach((t) => {
      const total = Number(t.precio_final) || 0;
      if (total <= 0) return;
      const key = `turno-${t.id_turno}`;
      mapa.set(key, {
        id: key,
        id_turno: t.id_turno,
        solicitud_cobro_id: null,
        paciente: t.Paciente,
        fecha: t.fecha_hora_inicio,
        concepto:
          t.PracticaTurnos?.[0]?.Practica?.nombre_referencia ||
          t.notas_consulta ||
          "Consulta Odontológica",
        subtitulo: "Cobro pendiente",
        monto_total: total,
        ya_cobrado: 0,
        saldo_pendiente: total,
        tipo: "turno",
        raw: t,
      });
    });

    // 2. Solicitudes de cobro con saldo pendiente ('pendiente' o 'parcial')
    (cuotasPendientes || []).forEach((s) => {
      const idSolicitud = s.id || s.id_solicitud_cobro || s.solicitud_cobro_id;
      const idTurno = s.id_turno ?? s.turno_id ?? null;
      const montoTotal = Number(s.monto_total ?? s.monto_a_cobrar ?? 0);
      const yaCobrado =
        s.ya_cobrado !== undefined
          ? Number(s.ya_cobrado) || 0
          : (s.Cobros || []).reduce(
              (acc, c) => acc + (Number(c.monto) || 0),
              0
            );
      const saldoPendiente =
        s.saldo_pendiente !== undefined
          ? Math.max(0, Number(s.saldo_pendiente) || 0)
          : Math.max(0, montoTotal - yaCobrado);

      if (saldoPendiente <= 0) return;

      const key = idTurno
        ? `turno-${idTurno}`
        : `solicitud-${idSolicitud}`;

      mapa.set(key, {
        id: key,
        id_turno: idTurno,
        solicitud_cobro_id: idSolicitud,
        id_solicitud_cobro: idSolicitud,
        paciente: s.Paciente || s.Turno?.Paciente,
        fecha: s.Turno?.fecha_hora_inicio || s.created_at || s.createdAt,
        concepto:
          s.observaciones ||
          s.concepto ||
          s.Turno?.PracticaTurnos?.[0]?.Practica?.nombre_referencia ||
          "Tratamiento Planificado",
        subtitulo:
          yaCobrado > 0 ? "Saldo parcial pendiente" : "Solicitud pendiente",
        monto_total: montoTotal,
        ya_cobrado: yaCobrado,
        saldo_pendiente: saldoPendiente,
        tipo: "solicitud",
        raw: s,
      });
    });

    return Array.from(mapa.values()).sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );
  }, [turnosPendientes, cuotasPendientes]);

  if (itemsPorCobrar.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-8 text-center shadow-sm">
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          No hay turnos ni tratamientos con saldos pendientes de cobro.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              <th className="px-4 py-3">TURNO / PACIENTE</th>
              <th className="px-4 py-3">TRATAMIENTO / CONCEPTO</th>
              <th className="px-4 py-3">FECHA PLANIFICADA</th>
              <th className="px-4 py-3">AVANCE DE PAGO</th>
              <th className="px-4 py-3">SALDO DEUDOR</th>
              <th className="px-4 py-3 text-right">ACCIÓN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {itemsPorCobrar.map((item) => {
              const p = item.paciente;
              const nombre = p ? `${p.nombre} ${p.apellido}` : "Paciente";
              const col = obtenerColorAvatar(nombre);
              const ini = obtenerIniciales(p?.nombre, p?.apellido);

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* PACIENTE CON AVATAR Y BADGE DE TURNO */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full ${col.bg} ${col.text} border ${col.border} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                      >
                        {ini}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                            {nombre}
                          </span>
                          {item.id_turno && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                              Turno #{item.id_turno}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          DNI {p?.dni || "S/D"} · Tel: {p?.telefono || "S/D"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* TRATAMIENTO / CONCEPTO */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {item.concepto}
                      </span>
                      {item.subtitulo && (
                        <span className="text-[11px] text-slate-400">
                          {item.subtitulo}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* FECHA */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium">
                    {formatFechaTabla(item.fecha)}
                  </td>

                  {/* AVANCE DE PAGO */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#e8f7f1] dark:bg-emerald-950/50 text-[#1b7f5b] dark:text-emerald-300 border border-[#2eb086]/30">
                      Abonó $
                      {item.ya_cobrado.toLocaleString("es-AR", {
                        maximumFractionDigits: 0,
                      })}{" "}
                      de $
                      {item.monto_total.toLocaleString("es-AR", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </td>

                  {/* SALDO DEUDOR */}
                  <td className="px-4 py-3.5 whitespace-nowrap font-black text-slate-900 dark:text-slate-100 tabular-nums">
                    $
                    {item.saldo_pendiente.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  {/* ACCIÓN VER TURNO / COBRAR */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      {item.id_turno && onVerTurno && (
                        <button
                          type="button"
                          onClick={() => onVerTurno(item.raw || item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-2xs transition-colors cursor-pointer active:scale-95"
                          title="Ver detalle del turno"
                        >
                          <Eye size={14} className="text-slate-500 shrink-0" />
                          <span className="hidden sm:inline">Ver Turno</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onCobrarItem && onCobrarItem(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d8266] hover:bg-[#0b6f57] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer active:scale-95"
                      >
                        <Banknote size={14} />
                        <span>Cobrar</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
