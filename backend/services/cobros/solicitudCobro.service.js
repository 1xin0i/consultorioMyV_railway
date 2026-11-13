/** @format */

import { AppError } from "../../errors/AppError.js";
import {
  ESTADOS_SOLICITUD,
  EPSILON_SALDO,
} from "../../constants/EstadosSolicitud.js";
import { formatearSolicitudConSaldos } from "../../mappers/solicitudCobro.mapper.js";
import * as solicitudRepo from "../../repositories/solicitudCobro.repository.js";

export const sumarCobros = (cobros = []) =>
  cobros.reduce((acc, c) => acc + (Number(c.monto) || 0), 0);

/**
 * Calcula el estado ('pendiente', 'parcial', 'saldado') de una SolicitudCobro
 * a partir del monto total y la suma pagada, considerando la tolerancia de centavos.
 */
export const calcularEstadoSolicitud = (montoTotal, totalPagado) => {
  const total = Number(montoTotal) || 0;
  const pagado = Number(totalPagado) || 0;

  if (pagado >= total - EPSILON_SALDO && (total > 0 || pagado > 0)) {
    return ESTADOS_SOLICITUD.SALDADO;
  }
  if (pagado > 0) {
    return ESTADOS_SOLICITUD.PARCIAL;
  }
  return ESTADOS_SOLICITUD.PENDIENTE;
};

/**
 * Verifica que el turno indicado no tenga ya una solicitud de cobro asociada.
 */
export const assertSinSolicitud = async (turnoId, transaction = null) => {
  if (!turnoId) return;
  const existente = await solicitudRepo.findByTurnoId(turnoId, transaction);
  if (existente) {
    throw new AppError(409, {
      status: "error",
      message: "Este turno ya tiene una solicitud de cobro registrada.",
    });
  }
};

/**
 * Recalcula y actualiza automáticamente el estado ('pendiente', 'parcial', 'saldado')
 * de una SolicitudCobro según la suma real de sus cobros.
 */
export const actualizarEstadoSolicitud = async (
  solicitudId,
  transaction = null,
) => {
  const solicitud = await solicitudRepo.findByIdConCobros(
    solicitudId,
    transaction,
  );
  if (!solicitud) return null;

  const montoTotal = Number(solicitud.monto_total) || 0;
  const totalPagado = sumarCobros(solicitud.Cobros);
  const nuevoEstado = calcularEstadoSolicitud(montoTotal, totalPagado);

  if (solicitud.estado !== nuevoEstado) {
    await solicitud.update({ estado: nuevoEstado }, { transaction });
  }

  return {
    solicitud,
    montoTotal,
    totalPagado,
    saldoPendiente: Math.max(0, montoTotal - totalPagado),
    estado: nuevoEstado,
  };
};

export const obtenerPorTurno = async (turnoId) => {
  const solicitud = await solicitudRepo.findDetalleByTurnoId(turnoId);
  if (!solicitud) {
    throw new AppError(404, {
      status: "error",
      message:
        "No se encontraron solicitudes de cobro para el turno especificado",
    });
  }
  return formatearSolicitudConSaldos(solicitud);
};

export const crearSolicitud = async (body, { turno, paciente } = {}) => {
  const {
    id_turno,
    turno_id,
    id_paciente,
    paciente_id,
    monto_a_cobrar,
    monto_total,
    observaciones,
  } = body;

  const turnoIdFinal = turno_id ?? id_turno ?? turno?.id_turno ?? null;
  const pacienteIdFinal =
    paciente_id ?? id_paciente ?? paciente?.id_paciente;
  const montoTotalFinal = Number(monto_total ?? monto_a_cobrar) || 0;

  await assertSinSolicitud(turnoIdFinal);

  const nuevaSolicitud = await solicitudRepo.crear({
    turno_id: turnoIdFinal,
    paciente_id: pacienteIdFinal,
    monto_total: montoTotalFinal,
    estado: ESTADOS_SOLICITUD.PENDIENTE,
    observaciones: observaciones || null,
  });

  return formatearSolicitudConSaldos(nuevaSolicitud);
};

