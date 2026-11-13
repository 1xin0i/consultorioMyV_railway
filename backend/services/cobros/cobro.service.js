/** @format */

import sequelize from "../../config/database.js";
import { AppError } from "../../errors/AppError.js";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination.js";
import { rangoDeAnio } from "../../utils/fechas.js";
import { formatearCobroConDetalles } from "../../mappers/cobro.mapper.js";
import * as cobroRepo from "../../repositories/cobro.repository.js";
import { resolverMetodoPagoId } from "./metodoPago.helper.js";
import { actualizarEstadoSolicitud } from "./solicitudCobro.service.js";

export const listarPaginado = async (query) => {
  const { page, limit, offset, search, sortField, sortOrder } = parsePagination(
    query,
    {
      defaultLimit: 9,
      defaultSortField: "fecha_cobro",
      defaultSortOrder: "DESC",
      allowedSortFields: ["id", "monto", "fecha_cobro", "created_at"],
    },
  );

  let anio = query.anio ? parseInt(query.anio, 10) : null;
  if (!anio && query.periodo !== "historico") {
    anio = new Date().getFullYear();
  }
  const rango = anio ? rangoDeAnio(anio) : null;

  const where = cobroRepo.construirWhere({
    fechaDesde: rango?.inicio,
    fechaHasta: rango?.fin,
    search,
  });

  const { count, rows } = await cobroRepo.findPaginado({
    where,
    limit,
    offset,
    order: [[sortField, sortOrder]],
  });

  return {
    data: rows.map(formatearCobroConDetalles),
    meta: buildPaginationMeta(count, page, limit),
  };
};

export const obtenerPorId = async (id) => {
  const cobro = await cobroRepo.findDetalleById(id);
  if (!cobro) {
    throw new AppError(404, {
      status: "error",
      message: "El cobro no existe.",
    });
  }
  return formatearCobroConDetalles(cobro);
};

export const actualizar = async (id, body) => {
  const {
    monto,
    monto_a_cobrar,
    metodo_pago,
    metodo_pago_id,
    observaciones,
    fecha_cobro,
  } = body;

  const cobro = await cobroRepo.findById(id);
  if (!cobro) {
    throw new AppError(404, {
      status: "error",
      message: "El cobro no existe.",
    });
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

  return formatearCobroConDetalles(cobro);
};

export const eliminar = async (id) => {
  const cobro = await cobroRepo.findById(id);
  if (!cobro) {
    throw new AppError(404, {
      status: "error",
      message: "El cobro no existe.",
    });
  }

  const solicitudId = cobro.solicitud_cobro_id;

  await sequelize.transaction(async (t) => {
    await cobro.destroy({ transaction: t });
    if (solicitudId) {
      await actualizarEstadoSolicitud(solicitudId, t);
    }
  });
};

