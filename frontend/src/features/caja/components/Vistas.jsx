/** @format */

import { useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  CreditCard,
  Package,
  Wrench,
  Receipt,
  Check,
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

/* ─── VISTA 2: DETALLE DE INGRESOS (CARDS METODOS + TABLA) ─────────────────── */
export function VistaDetalleIngresos({ cobros = [], ingresosPorMetodo = [] }) {
  // Desglose de totales por método
  const totalesMetodos = useMemo(() => {
    let efectivo = { total: 0, count: 0 };
    let transferencias = { total: 0, count: 0 };
    let tarjetas = { total: 0, count: 0 };

    cobros.forEach((c) => {
      const modalidad = (c.modalidad || "").toLowerCase();
      const cuotas = c.Cuotas || c.Cuota || [];
      const montoTotalCobro = cuotas.reduce(
        (acc, q) => acc + (Number(q.monto_cobrado) || 0),
        0
      ) || Number(c.monto_a_cobrar) || 0;

      if (modalidad.includes("transfer")) {
        transferencias.total += montoTotalCobro;
        transferencias.count += 1;
      } else if (
        modalidad.includes("tarjeta") ||
        modalidad.includes("posnet") ||
        modalidad.includes("debito") ||
        modalidad.includes("credito")
      ) {
        tarjetas.total += montoTotalCobro;
        tarjetas.count += 1;
      } else {
        efectivo.total += montoTotalCobro;
        efectivo.count += 1;
      }
    });

    const sumaTotal =
      efectivo.total + transferencias.total + tarjetas.total || 1;
    const efectivoPct = Math.round((efectivo.total / sumaTotal) * 100);

    return {
      efectivo: { ...efectivo, pct: efectivoPct },
      transferencias,
      tarjetas,
    };
  }, [cobros]);

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen de 3 Tarjetas de Métodos de Pago */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Efectivo */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              EFECTIVO ({totalesMetodos.efectivo.pct}%)
            </span>
            <span className="text-lg font-black text-[#0d8266] dark:text-emerald-400 mt-1 tabular-nums">
              +$
              {totalesMetodos.efectivo.total.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {totalesMetodos.efectivo.count} cobros registrados
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#2eb086] border border-emerald-100">
            <Banknote size={18} />
          </div>
        </div>

        {/* Transferencias */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              TRANSFERENCIAS
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              +$
              {totalesMetodos.transferencias.total.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {totalesMetodos.transferencias.count} operaciones
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
            <Building2 size={18} />
          </div>
        </div>

        {/* Tarjetas / POSNET */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              TARJETAS / POSNET
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              +$
              {totalesMetodos.tarjetas.total.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {totalesMetodos.tarjetas.count} operaciones
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
            <CreditCard size={18} />
          </div>
        </div>
      </div>

      {/* Tabla de Cobros */}
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
                  Sin ingresos registrados en este período.
                </td>
              </tr>
            ) : (
              cobros.map((c) => {
                const pacienteNombre = c.Paciente
                  ? `${c.Paciente.nombre} ${c.Paciente.apellido}`
                  : "Paciente";
                const cuotas = c.Cuotas || c.Cuota || [];
                const cobradoTotal =
                  cuotas.reduce(
                    (acc, q) => acc + (Number(q.monto_cobrado) || 0),
                    0
                  ) || Number(c.monto_a_cobrar) || 0;
                const fechaObj = new Date(c.fecha_emision || c.createdAt);
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
                    key={c.id_cobro}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {pacienteNombre}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                      {c.concepto || "Consulta Odontológica"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {fechaStr}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-[#0d8266] border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {c.modalidad || "Efectivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      #{c.id_cobro}
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
  </div>
);
}

/* ─── VISTA 3: DETALLE DE EGRESOS (CARDS CATEGORIAS + TABLA) ────────────────── */
export function VistaLibroMayor({ gastos = [], egresosPorCategoria = [] }) {
  // Destacar las 3 principales categorías para las tarjetas superiores
  const resumenCategorias = useMemo(() => {
    let insumos = { total: 0, count: 0 };
    let laboratorio = { total: 0, count: 0 };
    let servicios = { total: 0, count: 0 };

    gastos.forEach((g) => {
      const cat = (g.CategoriaGasto?.nombre || g.categoria || "").toLowerCase();
      const monto = Number(g.monto) || 0;

      if (cat.includes("insumo") || cat.includes("material")) {
        insumos.total += monto;
        insumos.count += 1;
      } else if (cat.includes("lab") || cat.includes("prot")) {
        laboratorio.total += monto;
        laboratorio.count += 1;
      } else {
        servicios.total += monto;
        servicios.count += 1;
      }
    });

    return { insumos, laboratorio, servicios };
  }, [gastos]);

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen de Categorías Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Insumos */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              INSUMOS Y MATERIALES
            </span>
            <span className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
              -${resumenCategorias.insumos.total.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {resumenCategorias.insumos.count} compras registradas
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-100">
            <Package size={18} />
          </div>
        </div>

        {/* Laboratorio */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              LABORATORIO PROTÉSICO
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              -${resumenCategorias.laboratorio.total.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {resumenCategorias.laboratorio.count > 0
                ? `${resumenCategorias.laboratorio.count} órdenes este mes`
                : "Sin órdenes este mes"}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
            <Wrench size={18} />
          </div>
        </div>

        {/* Servicios */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              SERVICIOS DEL CONSULTORIO
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              -${resumenCategorias.servicios.total.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Luz, alquiler, internet
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
            <Receipt size={18} />
          </div>
        </div>
      </div>

      {/* Tabla de Egresos */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                <th className="px-4 py-3.5">PROVEEDOR / DESTINATARIO</th>
                <th className="px-4 py-3.5">CATEGORÍA</th>
                <th className="px-4 py-3.5">FECHA</th>
                <th className="px-4 py-3.5">DETALLE</th>
                <th className="px-4 py-3.5">FACTURA</th>
                <th className="px-4 py-3.5 text-right">IMPORTE PAGADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {gastos.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400 italic">
                  Sin egresos registrados en este período.
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
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {g.comprobante || `FC #${g.id_gasto}`}
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
  </div>
);
}

/* ─── VISTA 4: POR COBRAR (TABLA CON ACCIÓN COBRAR) ────────────────────────── */
export function VistaPendientes({
  turnosPendientes = [],
  cuotasPendientes = [],
  onCobrarItem,
}) {
  const itemsPorCobrar = useMemo(() => {
    const mapa = new Map();

    // 1. Turnos atendidos pendientes de cobro
    (turnosPendientes || []).forEach((t) => {
      const total = Number(t.precio_final) || 0;
      if (total <= 0) return;
      const key = `turno-${t.id_turno}`;
      mapa.set(key, {
        id: key,
        id_turno: t.id_turno,
        id_cuota: null,
        id_cobro: null,
        paciente: t.Paciente,
        fecha: t.fecha_hora_inicio,
        concepto:
          t.PracticaTurnos?.[0]?.Practica?.nombre_referencia ||
          t.notas_consulta ||
          "Consulta Odontológica",
        subtitulo: "Cobro inicial",
        monto_total: total,
        ya_cobrado: 0,
        saldo_pendiente: total,
        tipo: "turno",
        raw: t,
      });
    });

    // 2. Cuotas con saldo adeudado
    (cuotasPendientes || []).forEach((q) => {
      const cobro = q.Cobro;
      const montoCuota = Number(q.monto_cuota) || 0;
      const cobradoCuota = Number(q.monto_cobrado) || 0;
      const saldoCuota = Math.max(0, montoCuota - cobradoCuota);
      if (saldoCuota <= 0) return;

      const key = cobro?.id_turno
        ? `turno-${cobro.id_turno}`
        : `cobro-${q.id_cobro || q.id_cuota}`;

      if (mapa.has(key)) {
        const item = mapa.get(key);
        item.saldo_pendiente += saldoCuota;
        item.ya_cobrado += cobradoCuota;
        if (!item.id_cuota) item.id_cuota = q.id_cuota;
        if (item.tipo === "cuota" && cobro?.cant_cuotas && cobro.cant_cuotas > 1) {
          item.subtitulo = "Saldo en cuotas pendiente";
        }
      } else {
        const totalCobro = Number(cobro?.monto_a_cobrar) || montoCuota;
        mapa.set(key, {
          id: key,
          id_turno: cobro?.id_turno || null,
          id_cuota: q.id_cuota,
          id_cobro: cobro?.id_cobro || null,
          paciente: cobro?.Paciente || q.Paciente,
          fecha: q.fecha_vencimiento || cobro?.fecha_emision || q.createdAt,
          concepto:
            cobro?.concepto ||
            `Tratamiento Planificado`,
          subtitulo: `Cuota ${q.nro_cuota}${
            cobro?.cant_cuotas && cobro.cant_cuotas > 1 ? ` de ${cobro.cant_cuotas}` : ""
          }`,
          monto_total: totalCobro,
          ya_cobrado: cobradoCuota,
          saldo_pendiente: saldoCuota,
          tipo: "cuota",
          raw: q,
        });
      }
    });

    // Consistencia contable final para items agrupados
    mapa.forEach((item) => {
      if (item.monto_total > 0 && item.monto_total >= item.saldo_pendiente) {
        item.ya_cobrado = Math.max(0, item.monto_total - item.saldo_pendiente);
      }
    });

    return Array.from(mapa.values()).sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );
  }, [turnosPendientes, cuotasPendientes]);

  if (itemsPorCobrar.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-8 text-center shadow-sm">
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          No hay tratamientos ni cuotas con saldos pendientes de cobro.
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
              <th className="px-4 py-3">PACIENTE</th>
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
                  {/* PACIENTE CON AVATAR */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full ${col.bg} ${col.text} border ${col.border} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                      >
                        {ini}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                          {nombre}
                        </span>
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

                  {/* ACCIÓN COBRAR */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onCobrarItem && onCobrarItem(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d8266] hover:bg-[#0b6f57] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer active:scale-95"
                    >
                      <Check size={14} />
                      <span>Cobrar</span>
                    </button>
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
