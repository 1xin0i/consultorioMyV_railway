/** @format */

import { EPSILON_SALDO } from "../../constants/EstadosSolicitud.js";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination.js";
import { resolverPeriodo } from "../../utils/fechas.js";
import { formatearCobroConDetalles } from "../../mappers/cobro.mapper.js";
import { formatearSolicitudConSaldos } from "../../mappers/solicitudCobro.mapper.js";
import * as cobroRepo from "../../repositories/cobro.repository.js";
import * as solicitudRepo from "../../repositories/solicitudCobro.repository.js";
import * as gastoRepo from "../../repositories/gasto.repository.js";
import * as turnoRepo from "../../repositories/turno.repository.js";

/**
 * Obtiene de forma unificada y paginada los cobros recibidos (criterio de lo percibido),
 * los gastos registrados y las solicitudes/turnos pendientes de cobro.
 */
export const obtenerCajaConsolidada = async (query = {}) => {
  const periodo = resolverPeriodo(query);
  const { fechaDesde, fechaHasta } = periodo;

  const paginacionCobro = parsePagination(
    {
      page: query.pageCobro,
      limit: query.limitCobro,
      search: query.searchCobro,
    },
    { defaultLimit: 10 },
  );

  const paginacionGasto = parsePagination(
    {
      page: query.pageGasto,
      limit: query.limitGasto,
      search: query.searchGasto,
    },
    { defaultLimit: 10 },
  );

  const whereCobro = cobroRepo.construirWhere({
    fechaDesde,
    fechaHasta,
    search: paginacionCobro.search,
  });

  const whereGasto = gastoRepo.construirWhereCaja({
    fechaDesde,
    fechaHasta,
    search: paginacionGasto.search,
  });

  const [
    resultadoCobros,
    resultadoGastos,
    todosCobrosPeriodo,
    totalEgresosSuma,
    turnosPendientes,
    solicitudesPendientesRaw,
  ] = await Promise.all([
    cobroRepo.findPaginado({
      where: whereCobro,
      limit: paginacionCobro.limit,
      offset: paginacionCobro.offset,
      order: [
        ["fecha_cobro", "DESC"],
        ["id", "DESC"],
      ],
      conPracticas: true,
      distinct: true,
    }),

    gastoRepo.findPaginado({
      where: whereGasto,
      limit: paginacionGasto.limit,
      offset: paginacionGasto.offset,
      order: [["fecha_gasto", "DESC"]],
      atributosCategoria: ["id_categoria_gasto", "nombre"],
      subQuery: false,
    }),

    cobroRepo.findMontosPorPeriodo({ fechaDesde, fechaHasta }),

    gastoRepo.sumarMonto(whereGasto),

    turnoRepo.findAtendidosSinSolicitud({
      include: [
        turnoRepo.incluirPaciente(),
        turnoRepo.incluirEstado(),
        turnoRepo.incluirPracticasNombre(),
      ],
      order: [["fecha_hora_inicio", "DESC"]],
    }),

    solicitudRepo.findPendientesConDetalle(),
  ]);

  const totalIngresos = todosCobrosPeriodo.reduce(
    (acc, c) => acc + (Number(c.monto) || 0),
    0,
  );
  const totalEgresos = Number(totalEgresosSuma) || 0;
  const balanceNeto = totalIngresos - totalEgresos;

  const solicitudesPendientes = solicitudesPendientesRaw
    .map(formatearSolicitudConSaldos)
    .filter((s) => s.saldo_pendiente > EPSILON_SALDO);

  const totalTurnosPendientes = turnosPendientes.reduce(
    (acc, t) => acc + (Number(t.precio_final) || 0),
    0,
  );

  const totalSolicitudesPendientes = solicitudesPendientes.reduce(
    (acc, s) => acc + (Number(s.saldo_pendiente) || 0),
    0,
  );

  const totalPendienteCobro =
    totalTurnosPendientes + totalSolicitudesPendientes;

  return {
    data: {
      cobros: resultadoCobros.rows.map(formatearCobroConDetalles),
      gastos: resultadoGastos.rows,
      turnosPendientes,
      solicitudesPendientes,
      cuotasPendientes: solicitudesPendientes, // alias de compatibilidad
      totales: {
        totalIngresos,
        totalEgresos,
        balanceNeto,
        totalPendienteCobro,
        totalTurnosPendientes,
        totalSolicitudesPendientes,
        totalCuotasPendientes: totalSolicitudesPendientes,
      },
    },
    meta: {
      periodo,
      cobros: buildPaginationMeta(
        resultadoCobros.count,
        paginacionCobro.page,
        paginacionCobro.limit,
      ),
      gastos: buildPaginationMeta(
        resultadoGastos.count,
        paginacionGasto.page,
        paginacionGasto.limit,
      ),
    },
  };
};

