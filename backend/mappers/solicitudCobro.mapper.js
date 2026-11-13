/** @format */

import { MAPA_ID_A_METODO } from "../constants/MetodosPago.js";

export const formatearSolicitudConSaldos = (solicitudInstance) => {
  const plain = solicitudInstance.get
    ? solicitudInstance.get({ plain: true })
    : solicitudInstance;
  const cobros = (plain.Cobros || []).map((c) => {
    const metodoNombre =
      c.MetodoPago?.nombre || MAPA_ID_A_METODO[c.metodo_pago_id] || "Efectivo";
    return {
      ...c,
      id_cobro: c.id,
      monto: Number(c.monto) || 0,
      monto_cobrado: Number(c.monto) || 0,
      metodo_pago: metodoNombre,
    };
  });

  const montoTotal = Number(plain.monto_total) || 0;
  const yaCobrado = cobros.reduce((acc, c) => acc + (Number(c.monto) || 0), 0);
  const saldoPendiente = Math.max(0, montoTotal - yaCobrado);

  return {
    ...plain,
    id: plain.id,
    id_solicitud_cobro: plain.id,
    id_cobro: plain.id,
    id_turno: plain.turno_id,
    id_paciente: plain.paciente_id,
    monto_total: montoTotal,
    monto_a_cobrar: montoTotal,
    ya_cobrado: yaCobrado,
    saldo_pendiente: saldoPendiente,
    Cobros: cobros,
  };
};
