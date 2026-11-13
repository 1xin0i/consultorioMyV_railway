/** @format */

import toast from "react-hot-toast";
import { formatDate } from "@/shared/utils";

export function exportarCajaCsv({
  movimientosCompletos = [],
  totalIngresos = 0,
  totalEgresos = 0,
  balanceNeto = 0,
  filtros = {},
}) {
  if (!movimientosCompletos || movimientosCompletos.length === 0) {
    toast.error("No hay movimientos en pantalla para exportar.");
    return;
  }

  const encabezados = [
    "ID",
    "Fecha",
    "Tipo",
    "Concepto",
    "Paciente",
    "Categoría / Medio de Pago",
    "Monto ($)",
    "Observaciones",
  ];

  const escaparCSV = (valor) => {
    const texto = String(valor ?? "").replace(/"/g, '""');
    return `"${texto}"`;
  };

  const filas = movimientosCompletos.map((m) => [
    m.id_movimiento,
    formatDate(m.fecha),
    m.tipo === "ingreso" ? "Ingreso" : "Egreso",
    m.concepto || "",
    m.pacienteNombre || "-",
    m.categoria_o_medio || "",
    m.tipo === "ingreso" ? m.monto : -m.monto,
    m.detalle_extra || "",
  ]);

  filas.push([]);
  filas.push(["", "", "", "", "", "TOTAL INGRESOS", totalIngresos, ""]);
  filas.push(["", "", "", "", "", "TOTAL GASTOS", -totalEgresos, ""]);
  filas.push(["", "", "", "", "", "BALANCE NETO", balanceNeto, ""]);

  const contenidoCSV =
    "\uFEFF" +
    [encabezados, ...filas]
      .map((fila) => fila.map(escaparCSV).join(";"))
      .join("\r\n");

  const blob = new Blob([contenidoCSV], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const etiquetaFecha =
    filtros.fechaInicio && filtros.fechaFin
      ? `${filtros.fechaInicio}_a_${filtros.fechaFin}`
      : new Date().toISOString().slice(0, 10);

  link.href = url;
  link.setAttribute("download", `reporte_caja_${etiquetaFecha}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.success("Reporte de caja descargado correctamente");
}

