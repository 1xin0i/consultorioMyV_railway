export const COLUMNAS_CAJA = [
  { etiqueta: "Fecha", campo: "fecha", ordenable: true },
  { etiqueta: "Tipo", campo: "tipo", ordenable: false },
  { etiqueta: "Concepto", campo: "concepto", ordenable: false },
  { etiqueta: "Medio / Cat.", campo: "categoria_o_medio", ordenable: false },
  { etiqueta: "Monto", campo: "monto", ordenable: true },
  { etiqueta: "Acciones", campo: null, ordenable: false, centrado: true },
];

export const COLUMNAS_GASTOS = [
  { etiqueta: "Categoría", campo: "id_categoria_gasto", ordenable: false },
  { etiqueta: "Concepto", campo: "concepto", ordenable: false },
  { etiqueta: "Fecha", campo: "fecha_gasto", ordenable: true },
  { etiqueta: "Monto", campo: "monto", ordenable: true },
  { etiqueta: "Acciones", campo: null, ordenable: false, centrado: true },
];

export const ESTADO_INICIAL_GASTO = {
  id_categoria_gasto: "",
  monto: "",
  concepto: "",
  fecha_gasto: new Date().toISOString().split("T")[0],
  metodo_pago: "Efectivo",
};

export const ESTADO_INICIAL_COBRO = {
  id_paciente: "",
  id_turno: "",
  monto_a_cobrar: "",
  modalidad: "inmediato",
  metodo_pago: "Efectivo",
  entrega_inicial: "",
  observaciones: "",
};
