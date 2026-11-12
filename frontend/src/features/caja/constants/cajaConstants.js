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
