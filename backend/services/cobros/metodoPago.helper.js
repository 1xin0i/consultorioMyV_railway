/** @format */

export const MAPA_METODO_A_ID = Object.freeze({
  efectivo: 1,
  transferencia: 2,
  tarjeta: 3,
  otro: 4,
});

export const MAPA_ID_A_METODO = Object.freeze({
  1: "Efectivo",
  2: "Transferencia",
  3: "Tarjeta",
  4: "Otro",
});

export const resolverMetodoPagoId = (metodoPagoId, metodoPagoNombre) => {
  if (metodoPagoId && !isNaN(Number(metodoPagoId))) {
    return Number(metodoPagoId);
  }
  if (metodoPagoNombre && typeof metodoPagoNombre === "string") {
    const key = metodoPagoNombre.trim().toLowerCase();
    if (key.includes("transfer")) return 2;
    if (
      key.includes("tarjeta") ||
      key.includes("debito") ||
      key.includes("crédito") ||
      key.includes("credito")
    ) {
      return 3;
    }
    if (key.includes("otro")) return 4;
    return MAPA_METODO_A_ID[key] || 1;
  }
  return 1;
};

