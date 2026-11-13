/** @format */

import { MAPA_ID_A_METODO } from "../constants/MetodosPago.js";

export const formatearCobroConDetalles = (cobroInstance) => {
  const plain = cobroInstance.get
    ? cobroInstance.get({ plain: true })
    : cobroInstance;
  const solicitud = plain.SolicitudCobro || null;
  const paciente = solicitud?.Paciente || plain.Paciente || null;
  const turno = solicitud?.Turno || plain.Turno || null;
  const metodoNombre =
    plain.MetodoPago?.nombre ||
    MAPA_ID_A_METODO[plain.metodo_pago_id] ||
    plain.metodo_pago ||
    "Efectivo";

  const practicaNombre =
    turno?.PracticaTurnos?.[0]?.Practica?.nombre_referencia ||
    turno?.PracticaTurnos?.[0]?.Practica?.nombre_nomenclador ||
    null;

  const conceptoCalculado =
    plain.observaciones ||
    solicitud?.observaciones ||
    practicaNombre ||
    "Cobro de Atención";

  return {
    ...plain,
    id: plain.id,
    id_cobro: plain.id,
    solicitud_cobro_id: plain.solicitud_cobro_id,
    id_turno: solicitud?.turno_id || null,
    turno_id: solicitud?.turno_id || null,
    id_paciente: solicitud?.paciente_id || null,
    paciente_id: solicitud?.paciente_id || null,
    monto: Number(plain.monto) || 0,
    monto_cobrado: Number(plain.monto) || 0,
    monto_a_cobrar: Number(solicitud?.monto_total ?? plain.monto) || 0,
    metodo_pago_id: plain.metodo_pago_id,
    metodo_pago: metodoNombre,
    modalidad: metodoNombre,
    fecha_cobro: plain.fecha_cobro,
    fecha_emision: plain.fecha_cobro || plain.created_at,
    observaciones: plain.observaciones || null,
    concepto: conceptoCalculado,
    Paciente: paciente,
    Turno: turno,
    SolicitudCobro: solicitud,
  };
};
