/** @format */

import { Op } from "sequelize";
import sequelize from "../config/database.js";
import {
  SolicitudCobro,
  Cobro,
  MetodoPago,
  Paciente,
  Turno,
  PracticaTurno,
  Practica,
} from "../models/index.model.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

import { MAPA_METODO_A_ID } from "../constants/MetodosPago.js";
import { formatearCobroConDetalles } from "../mappers/cobro.mapper.js";
import { formatearSolicitudConSaldos } from "../mappers/solicitudCobro.mapper.js";

// Re-exportados por compatibilidad (Caja.controller los importa desde aquí).
export { formatearCobroConDetalles, formatearSolicitudConSaldos };

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


/**
 * Recalcula y actualiza automáticamente el estado ('pendiente', 'parcial', 'saldado')
 * de una SolicitudCobro según la suma real de sus cobros.
 */
export const actualizarEstadoSolicitud = async (
  solicitudId,
  transaction = null,
) => {
  const solicitud = await SolicitudCobro.findByPk(solicitudId, {
    include: [{ model: Cobro, as: "Cobros" }],
    transaction,
  });
  if (!solicitud) return null;

  const montoTotal = Number(solicitud.monto_total) || 0;
  const totalPagado = (solicitud.Cobros || []).reduce(
    (acc, c) => acc + (Number(c.monto) || 0),
    0,
  );

  let nuevoEstado = "pendiente";
  if (totalPagado >= montoTotal - 0.009 && montoTotal > 0) {
    nuevoEstado = "saldado";
  } else if (totalPagado > 0) {
    nuevoEstado = "parcial";
  }

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

// Obtener la SolicitudCobro y sus Cobros por turno ID
export const getCobroByTurnoId = async (req, res) => {
  try {
    const { turnoId } = req.params;
    const solicitud = await SolicitudCobro.findOne({
      where: { turno_id: turnoId },
      include: [
        {
          model: Turno,
          attributes: [
            "id_turno",
            "fecha_hora_inicio",
            "fecha_hora_fin",
            "precio_final",
            "notas_consulta",
          ],
        },
        {
          model: Paciente,
          attributes: ["id_paciente", "nombre", "apellido", "dni", "telefono"],
        },
        {
          model: Cobro,
          as: "Cobros",
          include: [{ model: MetodoPago, as: "MetodoPago" }],
        },
      ],
      order: [[{ model: Cobro, as: "Cobros" }, "fecha_cobro", "ASC"]],
    });

    if (!solicitud) {
      return res.status(404).json({
        status: "error",
        message: "No se encontraron solicitudes de cobro para el turno especificado",
      });
    }

    return res.status(200).json({
      status: "success",
      data: formatearSolicitudConSaldos(solicitud),
    });
  } catch (error) {
    console.error("Error al obtener cobros por turno:", error);
    return res.status(500).json({ error: "Error al obtener cobros por turno" });
  }
};

// Obtener todos los cobros reales recibidos con paginación
export const getAllCobros = async (req, res) => {
  try {
    const { page, limit, offset, search, sortField, sortOrder } =
      parsePagination(req.query, {
        defaultLimit: 9,
        defaultSortField: "fecha_cobro",
        defaultSortOrder: "DESC",
        allowedSortFields: ["id", "monto", "fecha_cobro", "created_at"],
      });

    const where = {};

    let anio = req.query.anio ? parseInt(req.query.anio, 10) : null;
    if (!anio && req.query.periodo !== "historico") {
      anio = new Date().getFullYear();
    }
    if (anio) {
      where.fecha_cobro = {
        [Op.between]: [
          new Date(anio, 0, 1, 0, 0, 0, 0),
          new Date(anio, 11, 31, 23, 59, 59, 999),
        ],
      };
    }

    if (search !== "") {
      where[Op.or] = [
        { observaciones: { [Op.like]: `%${search}%` } },
        { "$SolicitudCobro.observaciones$": { [Op.like]: `%${search}%` } },
        { "$SolicitudCobro.Paciente.nombre$": { [Op.like]: `%${search}%` } },
        { "$SolicitudCobro.Paciente.apellido$": { [Op.like]: `%${search}%` } },
        { "$SolicitudCobro.Paciente.dni$": { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: cobros } = await Cobro.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, sortOrder]],
      subQuery: false,
      include: [
        {
          model: MetodoPago,
          as: "MetodoPago",
          attributes: ["id", "nombre"],
        },
        {
          model: SolicitudCobro,
          as: "SolicitudCobro",
          required: true,
          include: [
            {
              model: Turno,
              attributes: ["id_turno", "fecha_hora_inicio", "fecha_hora_fin"],
            },
            {
              model: Paciente,
              attributes: ["id_paciente", "nombre", "apellido", "dni", "telefono"],
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      status: "success",
      data: cobros.map(formatearCobroConDetalles),
      meta: buildPaginationMeta(count, page, limit),
    });
  } catch (error) {
    console.error("Error al obtener los cobros:", error);
    return res.status(500).json({ error: "Error al obtener los cobros" });
  }
};

// Obtener un cobro por su ID
export const getCobroById = async (req, res) => {
  try {
    const cobro = await Cobro.findByPk(req.params.id, {
      include: [
        { model: MetodoPago, as: "MetodoPago" },
        {
          model: SolicitudCobro,
          as: "SolicitudCobro",
          include: [{ model: Paciente }, { model: Turno }],
        },
      ],
    });

    if (!cobro) {
      return res
        .status(404)
        .json({ status: "error", message: "El cobro no existe." });
    }

    return res.status(200).json({
      status: "success",
      data: formatearCobroConDetalles(cobro),
    });
  } catch (error) {
    console.error("Error al obtener el cobro:", error);
    return res.status(500).json({ error: "Error al obtener el cobro" });
  }
};

// Crear una solicitud de cobro (con cobro opcional)
export const createCobro = async (req, res) => {
  try {
    const {
      id_turno,
      turno_id,
      id_paciente,
      paciente_id,
      monto_a_cobrar,
      monto_total,
      observaciones,
    } = req.body;

    const turnoIdFinal = turno_id ?? id_turno ?? req.turno?.id_turno ?? null;
    const pacienteIdFinal =
      paciente_id ?? id_paciente ?? req.paciente?.id_paciente;
    const montoTotalFinal = Number(monto_total ?? monto_a_cobrar) || 0;

    if (turnoIdFinal) {
      const solicitudExistente = await SolicitudCobro.findOne({
        where: { turno_id: turnoIdFinal },
      });
      if (solicitudExistente) {
        return res.status(409).json({
          status: "error",
          message: "Este turno ya tiene una solicitud de cobro registrada.",
        });
      }
    }

    const nuevaSolicitud = await SolicitudCobro.create({
      turno_id: turnoIdFinal,
      paciente_id: pacienteIdFinal,
      monto_total: montoTotalFinal,
      estado: "pendiente",
      observaciones: observaciones || null,
    });

    return res.status(201).json({
      status: "success",
      data: formatearSolicitudConSaldos(nuevaSolicitud),
    });
  } catch (error) {
    console.error("Error al crear la solicitud de cobro:", error);
    return res
      .status(500)
      .json({ error: "Error al crear la solicitud de cobro" });
  }
};

// Actualizar un cobro existente
export const updateCobro = async (req, res) => {
  try {
    const {
      monto,
      monto_a_cobrar,
      metodo_pago,
      metodo_pago_id,
      observaciones,
      fecha_cobro,
    } = req.body;

    const cobro = await Cobro.findByPk(req.params.id);
    if (!cobro) {
      return res
        .status(404)
        .json({ status: "error", message: "El cobro no existe." });
    }

    await sequelize.transaction(async (t) => {
      const nuevoMonto =
        monto !== undefined
          ? Number(monto)
          : monto_a_cobrar !== undefined
            ? Number(monto_a_cobrar)
            : cobro.monto;

      const nuevoMetodoId =
        metodo_pago_id || metodo_pago
          ? resolverMetodoPagoId(metodo_pago_id, metodo_pago)
          : cobro.metodo_pago_id;

      await cobro.update(
        {
          monto: nuevoMonto,
          metodo_pago_id: nuevoMetodoId,
          observaciones:
            observaciones !== undefined ? observaciones : cobro.observaciones,
          fecha_cobro: fecha_cobro || cobro.fecha_cobro,
        },
        { transaction: t },
      );

      await actualizarEstadoSolicitud(cobro.solicitud_cobro_id, t);
    });

    return res.status(200).json({
      status: "success",
      data: formatearCobroConDetalles(cobro),
    });
  } catch (error) {
    console.error("Error al actualizar el cobro:", error);
    return res.status(500).json({ error: "Error al actualizar el cobro" });
  }
};

// ==========================================
// 1. COBRO INMEDIATO (Pago Total en el acto)
// ==========================================
export const createCobroInmediato = async (req, res) => {
  try {
    const {
      monto_a_cobrar,
      monto_total,
      monto,
      metodo_pago,
      metodo_pago_id,
      observaciones,
    } = req.body;
    const turno_id =
      req.turno?.id_turno ?? req.body.turno_id ?? req.body.id_turno ?? null;
    const paciente_id =
      req.paciente?.id_paciente ??
      req.body.paciente_id ??
      req.body.id_paciente;

    if (turno_id) {
      const existe = await SolicitudCobro.findOne({ where: { turno_id } });
      if (existe) {
        return res.status(409).json({
          status: "error",
          message: "Este turno ya tiene una solicitud de cobro registrada.",
        });
      }
    }

    const importeTotal = Number(monto_total ?? monto_a_cobrar ?? monto) || 0;
    const metodoId = resolverMetodoPagoId(metodo_pago_id, metodo_pago);

    const resultado = await sequelize.transaction(async (t) => {
      const solicitud = await SolicitudCobro.create(
        {
          turno_id,
          paciente_id,
          monto_total: importeTotal,
          estado: "saldado",
          observaciones: observaciones || null,
        },
        { transaction: t },
      );

      const cobro = await Cobro.create(
        {
          solicitud_cobro_id: solicitud.id,
          monto: importeTotal,
          metodo_pago_id: metodoId,
          fecha_cobro: new Date(),
          observaciones: observaciones || "Pago total",
        },
        { transaction: t },
      );

      return { solicitud, cobro };
    });

    return res.status(201).json({
      status: "success",
      data: {
        ...formatearSolicitudConSaldos(resultado.solicitud),
        cobro: formatearCobroConDetalles(resultado.cobro),
      },
      message: "Cobro registrado correctamente.",
    });
  } catch (error) {
    console.error("Error al crear cobro inmediato:", error);
    return res
      .status(500)
      .json({ error: "Error al procesar el cobro inmediato." });
  }
};

// ==========================================
// 2. ACUERDO / SOLICITUD DE COBRO CON ENTREGA INICIAL OPCIONAL
// ==========================================
export const createCobroInformal = async (req, res) => {
  try {
    const {
      monto_a_cobrar,
      monto_total,
      entrega_inicial,
      metodo_pago,
      metodo_pago_id,
      observaciones,
    } = req.body;
    const turno_id =
      req.turno?.id_turno ?? req.body.turno_id ?? req.body.id_turno ?? null;
    const paciente_id =
      req.paciente?.id_paciente ??
      req.body.paciente_id ??
      req.body.id_paciente;

    if (turno_id) {
      const existe = await SolicitudCobro.findOne({ where: { turno_id } });
      if (existe) {
        return res.status(409).json({
          status: "error",
          message: "Este turno ya tiene una solicitud de cobro registrada.",
        });
      }
    }

    const total = Number(monto_total ?? monto_a_cobrar) || 0;
    const entrega = Math.min(total, Math.max(0, Number(entrega_inicial) || 0));
    const metodoId = resolverMetodoPagoId(metodo_pago_id, metodo_pago);

    let estadoInicial = "pendiente";
    if (entrega >= total - 0.009 && total > 0) {
      estadoInicial = "saldado";
    } else if (entrega > 0) {
      estadoInicial = "parcial";
    }

    const resultado = await sequelize.transaction(async (t) => {
      const solicitud = await SolicitudCobro.create(
        {
          turno_id,
          paciente_id,
          monto_total: total,
          estado: estadoInicial,
          observaciones: observaciones || null,
        },
        { transaction: t },
      );

      let cobroInicial = null;
      if (entrega > 0) {
        cobroInicial = await Cobro.create(
          {
            solicitud_cobro_id: solicitud.id,
            monto: entrega,
            metodo_pago_id: metodoId,
            fecha_cobro: new Date(),
            observaciones:
              observaciones ||
              (estadoInicial === "saldado" ? "Pago total" : "Entrega inicial"),
          },
          { transaction: t },
        );
      }

      return { solicitud, cobroInicial };
    });

    return res.status(201).json({
      status: "success",
      data: formatearSolicitudConSaldos(resultado.solicitud),
      message: "Solicitud de cobro registrada correctamente.",
    });
  } catch (error) {
    console.error("Error al registrar solicitud de cobro:", error);
    return res
      .status(500)
      .json({ error: "Error al registrar la solicitud de cobro." });
  }
};

// ==========================================
// 3. REGISTRAR PAGO UNIFICADO (Total o Parcial sobre una SolicitudCobro o Turno)
// ==========================================
export const registrarPagoTurno = async (req, res) => {
  try {
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
    } = req.body;

    const montoPago = Number(monto ?? monto_a_cobrar);

    if (!montoPago || montoPago <= 0) {
      return res.status(400).json({
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
        solicitud = await SolicitudCobro.findByPk(solicitudIdParam, {
          include: [{ model: Cobro, as: "Cobros" }],
          transaction: t,
        });
      }

      if (!solicitud && turnoIdParam) {
        solicitud = await SolicitudCobro.findOne({
          where: { turno_id: turnoIdParam },
          include: [{ model: Cobro, as: "Cobros" }],
          transaction: t,
        });
      }

      // Si aún no existe SolicitudCobro para el turno, la creamos automáticamente
      if (!solicitud) {
        if (!turnoIdParam) {
          const err = new Error(
            "Se requiere solicitud_cobro_id o turno_id válido para registrar el cobro.",
          );
          err.statusCode = 400;
          throw err;
        }

        const turno = await Turno.findByPk(turnoIdParam, { transaction: t });
        if (!turno) {
          const err = new Error("El turno especificado no existe.");
          err.statusCode = 404;
          throw err;
        }

        const totalTratamiento = Number(turno.precio_final) || montoPago;
        const cobradoAhora = Math.min(totalTratamiento, montoPago);
        const estaSaldado = cobradoAhora >= totalTratamiento - 0.009;
        const saldoRestante = Math.max(0, totalTratamiento - cobradoAhora);

        solicitud = await SolicitudCobro.create(
          {
            turno_id: turnoIdParam,
            paciente_id: turno.id_paciente,
            monto_total: totalTratamiento,
            estado: estaSaldado ? "saldado" : "parcial",
            observaciones: turno.notas_consulta || null,
          },
          { transaction: t },
        );

        const nuevoCobro = await Cobro.create(
          {
            solicitud_cobro_id: solicitud.id,
            monto: cobradoAhora,
            metodo_pago_id: metodoId,
            fecha_cobro: new Date(),
            observaciones:
              observaciones ||
              (estaSaldado ? "Pago total" : "Entrega inicial"),
          },
          { transaction: t },
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
      const yaCobrado = (solicitud.Cobros || []).reduce(
        (acc, c) => acc + (Number(c.monto) || 0),
        0,
      );
      const saldoActual = Math.max(0, totalTratamiento - yaCobrado);
      const cobradoAhora =
        saldoActual > 0 ? Math.min(saldoActual, montoPago) : montoPago;
      const nuevoTotalCobrado = yaCobrado + cobradoAhora;
      const saldoRestante = Math.max(0, totalTratamiento - nuevoTotalCobrado);
      const pagadoCompleto = saldoRestante <= 0.009;

      const nuevoCobro = await Cobro.create(
        {
          solicitud_cobro_id: solicitud.id,
          monto: cobradoAhora,
          metodo_pago_id: metodoId,
          fecha_cobro: new Date(),
          observaciones:
            observaciones ||
            (pagadoCompleto ? "Cancela saldo" : "Entrega parcial"),
        },
        { transaction: t },
      );

      await solicitud.update(
        {
          estado: pagadoCompleto
            ? "saldado"
            : nuevoTotalCobrado > 0
              ? "parcial"
              : "pendiente",
        },
        { transaction: t },
      );

      return {
        id_cobro: nuevoCobro.id,
        solicitud_cobro_id: solicitud.id,
        id_turno: solicitud.turno_id,
        saldoRestante,
        pagadoCompleto,
      };
    });

    return res.status(200).json({
      status: "success",
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
    });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ status: "error", message: error.message });
    }
    console.error("Error al registrar pago:", error);
    return res.status(500).json({
      status: "error",
      message: "Error al registrar el cobro.",
    });
  }
};

// Eliminar un cobro existente y recalcular el estado de su SolicitudCobro
export const deleteCobro = async (req, res) => {
  try {
    const cobro = await Cobro.findByPk(req.params.id);
    if (!cobro) {
      return res
        .status(404)
        .json({ status: "error", message: "El cobro no existe." });
    }

    const solicitudId = cobro.solicitud_cobro_id;

    await sequelize.transaction(async (t) => {
      await cobro.destroy({ transaction: t });
      if (solicitudId) {
        await actualizarEstadoSolicitud(solicitudId, t);
      }
    });

    return res
      .status(200)
      .json({ status: "success", message: "Cobro eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el cobro:", error);
    return res.status(500).json({ error: "Error al eliminar el cobro" });
  }
};
