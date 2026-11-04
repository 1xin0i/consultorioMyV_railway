/** @format */
import { useMemo } from "react";

export function useMovimientosCaja(cobros = [], gastos = [], turnosPendientes = [], busqueda = "", resumenPeriodo = null) {
  // Suma de turnos pendientes
  const totalPendienteCobro = useMemo(() => {
    if (turnosPendientes && turnosPendientes.length > 0) {
      return turnosPendientes.reduce((acc, t) => {
        const saldo =
          t.saldo_pendiente !== undefined
            ? Number(t.saldo_pendiente)
            : (Number(t.total_deuda) || Number(t.precio_final) || 0);
        return acc + (saldo > 0 ? saldo : 0);
      }, 0);
    }
    return 0;
  }, [turnosPendientes]);

  // Si el backend envía el resumen calculado para el mes, lo usamos;
  // si no, sumamos las filas locales del mes
  const kpis = useMemo(() => {
    if (resumenPeriodo && (resumenPeriodo.ingresosTotales !== undefined || resumenPeriodo.egresosTotales !== undefined)) {
      return {
        totalIngresos: Number(resumenPeriodo.ingresosTotales) || 0,
        totalEgresos: Number(resumenPeriodo.egresosTotales) || 0,
        balanceNeto: Number(resumenPeriodo.balancePeriodo) || 0,
        totalPendienteCobro,
      };
    }

    // Fallback de cálculo local
    const totalIngresos = cobros.reduce((acc, c) => {
      const cuotas = c.Cuotas || c.Cuota || [];
      const sum = cuotas.reduce((qAcc, q) => qAcc + (Number(q.monto_cobrado) || 0), 0);
      return acc + (sum > 0 ? sum : (Number(c.monto_total) || 0));
    }, 0);

    const totalEgresos = gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);

    return {
      totalIngresos,
      totalEgresos,
      balanceNeto: totalIngresos - totalEgresos,
      totalPendienteCobro,
    };
  }, [resumenPeriodo, cobros, gastos, totalPendienteCobro]);

  const movimientosUnificados = useMemo(() => {
    const listaIngresos = cobros.map((c) => {
      const cuotas = c.Cuotas || c.Cuota || [];
      const totalPagado = cuotas.reduce((acc, q) => acc + (Number(q.monto_cobrado) || 0), 0);
      const metodos = [...new Set(cuotas.filter((q) => Number(q.monto_cobrado) > 0).map((q) => q.metodo_pago).filter(Boolean))];
      const metodoStr = metodos.length > 0 ? metodos.join(", ") : "Efectivo";

      return {
        id: `ingreso-${c.id_cobro}`,
        tipo: "ingreso",
        concepto: `Cobro a ${c.Paciente ? `${c.Paciente.apellido}, ${c.Paciente.nombre}` : "Paciente"}`,
        categoria: c.cant_cuotas > 1 ? `Plan ${c.cant_cuotas} Cuotas` : "Cobro de Atención",
        monto: totalPagado > 0 ? totalPagado : (Number(c.monto_total) || 0),
        fecha: c.fecha_emision || c.fecha_cobro || c.createdAt,
        metodo_pago: metodoStr,
        comprobante: `Cobro #${c.id_cobro}`,
        cobroOriginal: c,
      };
    });

    const listaEgresos = gastos.map((g) => ({
      id: `egreso-${g.id_gasto}`,
      tipo: "egreso",
      concepto: g.concepto,
      categoria: g.CategoriaGasto?.nombre || "Gasto General",
      monto: Number(g.monto) || 0,
      fecha: g.fecha_gasto,
      metodo_pago: g.metodo_pago,
      comprobante: g.comprobante || `Gasto #${g.id_gasto}`,
    }));

    const unificados = [...listaIngresos, ...listaEgresos].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha),
    );

    if (!busqueda || busqueda.trim() === "") return unificados;

    const query = busqueda.toLowerCase();
    return unificados.filter(
      (m) =>
        m.concepto.toLowerCase().includes(query) ||
        m.categoria.toLowerCase().includes(query) ||
        m.comprobante.toLowerCase().includes(query),
    );
  }, [cobros, gastos, busqueda]);

  return {
    kpis,
    movimientosUnificados,
  };
}