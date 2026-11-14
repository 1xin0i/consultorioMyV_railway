/** @format */

import { useMemo } from "react";
import { formatDateInput } from "@/shared/utils";

export function useMovimientosCaja(
  datosCrudos,
  vistaActiva,
  propsPaginacion,
  filtros = {},
) {
  const {
    paginaActual,
    setPaginaActual,
    limitInicial,
    busquedaDebounced,
    ordenarPor,
    direccion,
  } = propsPaginacion;

  const { movimientosUnificados, totalIngresos, totalEgresos, balanceNeto } =
    useMemo(() => {
      const cobrosRaw = datosCrudos?.cobros || [];
      const gastosRaw = datosCrudos?.gastos || [];

      const cobrosMapeados = cobrosRaw.map((c) => {
        const pacienteObj = c.Turno?.Paciente || c.Paciente;
        const nombrePaciente = pacienteObj
          ? `${pacienteObj.nombre} ${pacienteObj.apellido}`
          : null;

        const esInformal =
          !c.id_turno &&
          typeof c.observaciones === "string" &&
          c.observaciones.startsWith("[Ingreso Informal]");

        let conceptoTexto = c.id_turno
          ? `Cobro Turno #${c.id_turno}${nombrePaciente ? ` - ${nombrePaciente}` : ""}`
          : "Ingreso Particular";

        let obsLimpia = c.observaciones || "";

        if (esInformal) {
          const sinPrefijo = c.observaciones
            .replace("[Ingreso Informal]", "")
            .trim();
          const partes = sinPrefijo.split(" - ");
          conceptoTexto = partes[0] || "Ingreso Informal";
          obsLimpia = partes.slice(1).join(" - ");
        }

        return {
          ...c,
          uid: `cobro-${c.id_cobro}`,
          id_movimiento: c.id_cobro,
          tipo: "ingreso",
          fecha: c.fecha_cobro || c.createdAt,
          concepto: conceptoTexto,
          categoria_o_medio: c.medio_pago || "Efectivo",
          monto: parseFloat(c.monto_pagado || 0),
          detalle_extra: obsLimpia,
          pacienteNombre: nombrePaciente || "",
        };
      });

      const gastosMapeados = gastosRaw.map((g) => {
        const catId =
          g.id_categoria_gasto ||
          g.id_categoria ||
          g.CategoriaGasto?.id_categoria_gasto ||
          g.CategoriaGasto?.id_categoria;
        const textoConcepto =
          g.concepto || g.detalle || g.CategoriaGasto?.nombre || "Gasto General";

        return {
          ...g,
          uid: `gasto-${g.id_gasto}`,
          id_movimiento: g.id_gasto,
          id_categoria_gasto: catId,
          id_categoria: catId,
          tipo: "egreso",
          fecha: g.fecha_gasto || g.createdAt,
          concepto: textoConcepto,
          detalle: g.detalle || g.concepto || "",
          categoria_o_medio: g.CategoriaGasto?.nombre || "Sin categoría",
          monto: parseFloat(g.monto || 0),
          detalle_extra: "",
          pacienteNombre: "",
        };
      });

      const tIngresos = cobrosMapeados.reduce((acc, item) => acc + item.monto, 0);
      const tEgresos = gastosMapeados.reduce((acc, item) => acc + item.monto, 0);

      let listaSegunVista;
      if (vistaActiva === "ingresos") {
        listaSegunVista = cobrosMapeados;
      } else if (vistaActiva === "gastos") {
        listaSegunVista = gastosMapeados;
      } else {
        listaSegunVista = [...cobrosMapeados, ...gastosMapeados];
      }

      if (filtros.medio_pago) {
        listaSegunVista = listaSegunVista.filter(
          (m) =>
            m.tipo === "ingreso" && m.categoria_o_medio === filtros.medio_pago,
        );
      }

      if (busquedaDebounced?.trim()) {
        const q = busquedaDebounced.toLowerCase().trim();
        listaSegunVista = listaSegunVista.filter(
          (m) =>
            m.concepto?.toLowerCase().includes(q) ||
            m.categoria_o_medio?.toLowerCase().includes(q) ||
            m.detalle_extra?.toLowerCase().includes(q) ||
            m.pacienteNombre?.toLowerCase().includes(q) ||
            String(m.id_movimiento).includes(q),
        );
      }

      listaSegunVista.sort((a, b) => {
        let valA = a[ordenarPor];
        let valB = b[ordenarPor];

        if (ordenarPor === "fecha" || ordenarPor === "fecha_gasto") {
          valA = new Date(a.fecha || 0).getTime();
          valB = new Date(b.fecha || 0).getTime();
        } else if (ordenarPor === "monto") {
          valA = Number(a.monto || 0);
          valB = Number(b.monto || 0);
        } else if (typeof valA === "string") {
          valA = valA.toLowerCase();
          valB = (valB || "").toLowerCase();
        }

        if (valA < valB) return direccion === "ASC" ? -1 : 1;
        if (valA > valB) return direccion === "ASC" ? 1 : -1;
        return 0;
      });

      return {
        movimientosUnificados: listaSegunVista,
        totalIngresos: tIngresos,
        totalEgresos: tEgresos,
        balanceNeto: tIngresos - tEgresos,
      };
    }, [
      datosCrudos,
      vistaActiva,
      busquedaDebounced,
      ordenarPor,
      direccion,
      filtros.medio_pago,
    ]);

  const totalRegistros = movimientosUnificados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / limitInicial));

  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const datosPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * limitInicial;
    return movimientosUnificados.slice(inicio, inicio + limitInicial);
  }, [movimientosUnificados, paginaSegura, limitInicial]);

  const irAPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const formatearCobroParaEditar = (mov) => {
    const esInformal =
      !mov.id_turno &&
      typeof mov.observaciones === "string" &&
      mov.observaciones.startsWith("[Ingreso Informal]");

    let conceptoInf = "";
    let obsInf = mov.observaciones || "";

    if (esInformal) {
      const sinPrefijo = mov.observaciones
        .replace("[Ingreso Informal]", "")
        .trim();
      const partes = sinPrefijo.split(" - ");
      conceptoInf = partes[0] || "";
      obsInf = partes.slice(1).join(" - ");
    }

    return {
      id_cobro: mov.id_cobro || mov.id_movimiento,
      id_turno: mov.id_turno || "",
      tipo_ingreso: esInformal ? "informal" : "turno",
      concepto_informal: conceptoInf,
      monto_pagado: mov.monto || mov.monto_pagado || "",
      medio_pago: mov.medio_pago || mov.categoria_o_medio || "Efectivo",
      fecha_cobro: formatDateInput(mov.fecha_cobro || mov.fecha),
      observaciones: obsInf,
    };
  };

  return {
    datosPaginados,
    movimientosCompletos: movimientosUnificados,
    totalRegistros,
    totalPaginas,
    irAPagina,
    totalIngresos,
    totalEgresos,
    balanceNeto,
    formatearCobroParaEditar,
  };
}
