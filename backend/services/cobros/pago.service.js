/** @format */

import sequelize from "../../config/database.js";
import { Turno } from "../../models/index.model.js";
import { AppError } from "../../errors/AppError.js";
import { ESTADOS_SOLICITUD } from "../../constants/EstadosSolicitud.js";
import { formatearCobroConDetalles } from "../../mappers/cobro.mapper.js";
import { formatearSolicitudConSaldos } from "../../mappers/solicitudCobro.mapper.js";
import * as cobroRepo from "../../repositories/cobro.repository.js";
import * as solicitudRepo from "../../repositories/solicitudCobro.repository.js";
import { resolverMetodoPagoId } from "./metodoPago.helper.js";
import {
  assertSinSolicitud,
  calcularEstadoSolicitud,
  sumarCobros,
} from "./solicitudCobro.service.js";

/**
 * 1. Cobro inmediato (pago total en el acto).
 */
export const registrarCobroInmediato = async (
  body,
  { turno, paciente } = {},
) => {
  const {
    monto_a_cobrar,
    monto_total,
    monto,
    metodo_pago,
    metodo_pago_id,
    observaciones,
  } = body;
  const turno_id =
    turno?.id_turno ?? body.turno_id ?? body.id_turno ?? null;
  const paciente_id =
    paciente?.id_paciente ?? body.paciente_id ?? body.id_paciente;

  await assertSinSolicitud(turno_id);

  const importeTotal = Number(monto_total ?? monto_a_cobrar ?? monto) || 0;
  const metodoId = resolverMetodoPagoId(metodo_pago_id, metodo_pago);

  const resultado = await sequelize.transaction(async (t) => {
    const solicitud = await solicitudRepo.crear(
      {
        turno_id,
        paciente_id,
        monto_total: importeTotal,
        estado: ESTADOS_SOLICITUD.SALDADO,
        observaciones: observaciones || null,
      },
      t,
    );

    const cobro = await cobroRepo.crear(
      {
        solicitud_cobro_id: solicitud.id,
        monto: importeTotal,
        metodo_pago_id: metodoId,
        fecha_cobro: new Date(),
        observaciones: observaciones || "Pago total",
      },
      t,
    );

    return { solicitud, cobro };
  });

  return {
    ...formatearSolicitudConSaldos(resultado.solicitud),
    cobro: formatearCobroConDetalles(resultado.cobro),
  };
};

/**
 * 2. Acuerdo / solicitud de cobro con entrega inicial opcional.
 */
export const registrarCobroInformal = async (
  body,
  { turno, paciente } = {},
) => {
  const {
    monto_a_cobrar,
    monto_total,
    entrega_inicial,
    metodo_pago,
    metodo_pago_id,
    observaciones,
  } = body;
  const turno_id =
    turno?.id_turno ?? body.turno_id ?? body.id_turno ?? null;
  const paciente_id =
    paciente?.id_paciente ?? body.paciente_id ?? body.id_paciente;

  await assertSinSolicitud(turno_id);

  const total = Number(monto_total ?? monto_a_cobrar) || 0;
  const entrega = Math.min(total, Math.max(0, Number(entrega_inicial) || 0));
  const metodoId = resolverMetodoPagoId(metodo_pago_id, metodo_pago);
  const estadoInicial = calcularEstadoSolicitud(total, entrega);

  const resultado = await sequelize.transaction(async (t) => {
    const solicitud = await solicitudRepo.crear(
      {
        turno_id,
        paciente_id,
        monto_total: total,
        estado: estadoInicial,
        observaciones: observaciones || null,
      },
      t,
    );

    let cobroInicial = null;
    if (entrega > 0) {
      cobroInicial = await cobroRepo.crear(
        {
          solicitud_cobro_id: solicitud.id,
          monto: entrega,
          metodo_pago_id: metodoId,
          fecha_cobro: new Date(),
          observaciones:
            observaciones ||
            (estadoInicial === ESTADOS_SOLICITUD.SALDADO
              ? "Pago total"
              : "Entrega inicial"),
        },
        t,
      );
    }

    return { solicitud, cobroInicial };
  });

  return formatearSolicitudConSaldos(resultado.solicitud);
};

/**
 * 3. Registrar pago unificado (total o parcial sobre una SolicitudCobro o Turno).
 */
export const registrarPagoTurno = async (body) => {
  const {
    solicitud_cobro_id,
    id_solicitud_cobro,
    id_turno,
    turno_id,
    monto,
    monto_a_cobrar,
    metodo_pago,
    metodo_pago_id,
    observaciones,
  } = body;

  const montoPago = Number(
    monto ?? monto_a_cobrar ?? body.monto_abonado ?? body.monto_pagado,
  );

  if (!montoPago || montoPago <= 0) {
    throw new AppError(400, {
      status: "error",
      message: "El monto a cobrar debe ser mayor a 0.",
    });
  }

  const metodoId = resolverMetodoPagoId(metodo_pago_id, metodo_pago);
  const solicitudIdParam = solicitud_cobro_id ?? id_solicitud_cobro ?? null;
  const turnoIdParam = turno_id ?? id_turno ?? null;

  const resultado = await sequelize.transaction(async (t) => {
    let solicitud = null;

    if (solicitudIdParam) {
      solicitud = await solicitudRepo.findByIdConCobros(solicitudIdParam, t);
    }

    if (!solicitud && turnoIdParam) {
      solicitud = await solicitudRepo.findByTurnoIdConCobros(turnoIdParam, t);
    }

    // Si aún no existe SolicitudCobro para el turno, la creamos automáticamente
    if (!solicitud) {
      if (!turnoIdParam) {
        throw new AppError(400, {
          status: "error",
          message:
            "Se requiere solicitud_cobro_id o turno_id válido para registrar el cobro.",
        });
      }

      const turno = await Turno.findByPk(turnoIdParam, { transaction: t });
      if (!turno) {
        throw new AppError(404, {
          status: "error",
          message: "El turno especificado no existe.",
        });
      }

      const totalTratamiento = Number(turno.precio_final) || montoPago;
      const cobradoAhora = Math.min(totalTratamiento, montoPago);
      const estado = calcularEstadoSolicitud(totalTratamiento, cobradoAhora);
      const estaSaldado = estado === ESTADOS_SOLICITUD.SALDADO;
      const saldoRestante = Math.max(0, totalTratamiento - cobradoAhora);

      solicitud = await solicitudRepo.crear(
        {
          turno_id: turnoIdParam,
          paciente_id: turno.id_paciente,
          monto_total: totalTratamiento,
          estado,
          observaciones: turno.notas_consulta || null,
        },
        t,
      );

      const nuevoCobro = await cobroRepo.crear(
        {
          solicitud_cobro_id: solicitud.id,
          monto: cobradoAhora,
          metodo_pago_id: metodoId,
          fecha_cobro: new Date(),
          observaciones:
            observaciones || (estaSaldado ? "Pago total" : "Entrega inicial"),
        },
        t,
      );

      return {
        id_cobro: nuevoCobro.id,
        solicitud_cobro_id: solicitud.id,
        id_turno: turnoIdParam,
        saldoRestante,
        pagadoCompleto: estaSaldado,
      };
    }

    // Si ya existe la SolicitudCobro, calcular saldo disponible y registrar el nuevo Cobro
    const totalTratamiento = Number(solicitud.monto_total) || 0;
    const yaCobrado = sumarCobros(solicitud.Cobros);
    const saldoActual = Math.max(0, totalTratamiento - yaCobrado);
    const cobradoAhora =
      saldoActual > 0 ? Math.min(saldoActual, montoPago) : montoPago;
    const nuevoTotalCobrado = yaCobrado + cobradoAhora;
    const saldoRestante = Math.max(0, totalTratamiento - nuevoTotalCobrado);
    const nuevoEstado = calcularEstadoSolicitud(
      totalTratamiento,
      nuevoTotalCobrado,
    );
    const pagadoCompleto = nuevoEstado === ESTADOS_SOLICITUD.SALDADO;

    const nuevoCobro = await cobroRepo.crear(
      {
        solicitud_cobro_id: solicitud.id,
        monto: cobradoAhora,
        metodo_pago_id: metodoId,
        fecha_cobro: new Date(),
        observaciones:
          observaciones ||
          (pagadoCompleto ? "Cancela saldo" : "Entrega parcial"),
      },
      t,
    );

    await solicitud.update({ estado: nuevoEstado }, { transaction: t });

    return {
      id_cobro: nuevoCobro.id,
      solicitud_cobro_id: solicitud.id,
      id_turno: solicitud.turno_id,
      saldoRestante,
      pagadoCompleto,
    };
  });

  return {
    message: resultado.pagadoCompleto
      ? "Cargo saldado completamente."
      : "Cobro parcial registrado. Saldo pendiente actualizado.",
    data: {
      id_turno: resultado.id_turno,
      id_cobro: resultado.id_cobro,
      solicitud_cobro_id: resultado.solicitud_cobro_id,
      monto_cobrado: montoPago,
      saldo_pendiente: resultado.saldoRestante,
      pagado_completo: resultado.pagadoCompleto,
    },
  };
};

