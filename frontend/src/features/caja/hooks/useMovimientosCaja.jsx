/** @format */
import { useMemo } from "react";

export function useMovimientosCaja(
  cobros,
  gastos,
  turnosPendientes = [],
  busqueda = "",
  cuotasPendientes = [],
  totalesBackend = null,
) {
  // ─── CÁLCULOS FINANCIEROS KPI ───
  const kpis = useMemo(() => {
    if (totalesBackend) {
      return {
        totalIngresos: Number(totalesBackend.totalIngresos) || 0,
        totalEgresos: Number(totalesBackend.totalEgresos) || 0,
        balanceNeto: Number(totalesBackend.balanceNeto) || 0,
        totalPendienteCobro: Number(totalesBackend.totalPendienteCobro) || 0,
        totalTurnosPendientes: Number(totalesBackend.totalTurnosPendientes) || 0,
        totalCuotasPendientes: Number(totalesBackend.totalCuotasPendientes) || 0,
      };
    }

    // Fallback de cálculo local
    let totalIngresos = 0;
    cobros.forEach((c) => {
      const pagado = (c.Cuotas || c.Cuota || []).reduce(
        (acc, q) => acc + (Number(q.monto_cobrado) || 0),
        0,
      );
      totalIngresos += pagado;
    });

    const totalEgresos = gastos.reduce(
      (acc, g) => acc + (Number(g.monto) || 0),
      0,
    );
    const totalTurnos = turnosPendientes.reduce(
      (acc, t) => acc + (Number(t.precio_final) || 0),
      0,
    );
    const totalCuotas = cuotasPendientes.reduce(
      (acc, q) =>
        acc +
        Math.max(
          0,
          (Number(q.monto_cuota) || 0) - (Number(q.monto_cobrado) || 0),
        ),
      0,
    );

    return {
      totalIngresos,
      totalEgresos,
      balanceNeto: totalIngresos - totalEgresos,
      totalPendienteCobro: totalTurnos + totalCuotas,
      totalTurnosPendientes: totalTurnos,
      totalCuotasPendientes: totalCuotas,
    };
  }, [gastos, cobros, turnosPendientes, cuotasPendientes, totalesBackend]);

  // ─── UNIFICACIÓN Y FILTRADO DE MOVIMIENTOS ───
  const movimientosUnificados = useMemo(() => {
    const listaIngresos = cobros
      .map((c) => {
        const cuotas = c.Cuotas || c.Cuota || [];
        const montoCobrado = cuotas.reduce(
          (acc, q) => acc + (Number(q.monto_cobrado) || 0),
          0,
        ) || Number(c.monto_a_cobrar) || 0;

        const pacienteNombre = c.Paciente
          ? `${c.Paciente.nombre} ${c.Paciente.apellido}`
          : "Paciente";

        const conceptoDetalle =
          c.concepto ||
          (c.Turno?.PracticaTurnos?.[0]?.Practica?.nombre_referencia ||
            "Limpieza dental");

        const dniTexto = c.Paciente?.dni
          ? `DNI ${c.Paciente.dni.toLocaleString ? c.Paciente.dni.toLocaleString("es-AR") : c.Paciente.dni}`
          : null;

        const subtitulo = dniTexto
          ? `${dniTexto} · ${conceptoDetalle}`
          : conceptoDetalle;

        return {
          id: `ingreso-${c.id_cobro}`,
          id_cobro: c.id_cobro,
          tipo: "ingreso",
          concepto: `Cobro a ${pacienteNombre}`,
          subtitulo,
          categoria: "Cobro de Atención",
          monto: montoCobrado,
          fecha: c.fecha_emision || c.createdAt,
          metodo_pago: c.modalidad || "Efectivo",
          comprobante: `Recibo #${c.id_cobro}`,
        };
      })
      .filter((m) => m.monto > 0);

    const listaEgresos = gastos.map((g) => {
      const proveedor = g.destinatario || g.proveedor || "Proveedor Dental";
      const detalle = g.detalle || g.concepto || "Resinas y anestesia";
      const subtitulo = `${proveedor} · ${detalle}`;

      return {
        id: `egreso-${g.id_gasto}`,
        id_gasto: g.id_gasto,
        tipo: "egreso",
        concepto: g.concepto || "Compra de insumos odontológicos",
        subtitulo,
        categoria: g.CategoriaGasto?.nombre || "Insumos",
        monto: Number(g.monto) || 0,
        fecha: g.fecha_gasto || g.createdAt,
        metodo_pago: g.metodo_pago || "Efectivo",
        comprobante: g.comprobante || `Factura #${g.id_gasto}`,
      };
    });

    const unificados = [...listaIngresos, ...listaEgresos].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha),
    );

    if (!busqueda || busqueda.trim() === "") return unificados;

    const query = busqueda.toLowerCase();
    return unificados.filter(
      (m) =>
        m.concepto.toLowerCase().includes(query) ||
        (m.subtitulo && m.subtitulo.toLowerCase().includes(query)) ||
        m.categoria.toLowerCase().includes(query) ||
        m.comprobante.toLowerCase().includes(query),
    );
  }, [cobros, gastos, busqueda]);

  return { kpis, movimientosUnificados };
}
