/** @format */

import { Op } from "sequelize";
import {
  SolicitudCobro,
  Cobro,
  MetodoPago,
  Gasto,
  Paciente,
  CategoriaGasto,
  Turno,
  EstadoTurno,
  PracticaTurno,
  Practica,
} from "../models/index.model.js";
import {
  formatearCobroConDetalles,
  formatearSolicitudConSaldos,
} from "./Cobro.controller.js";

/**
 * Obtiene de forma unificada y paginada los cobros recibidos (criterio de lo percibido),
 * los gastos registrados y las solicitudes/turnos pendientes de cobro.
 */
export const getCajaConsolidada = async (req, res) => {
  try {
    // ─── PARÁMETROS DE FECHA / PERÍODO ───
    let fechaDesde = req.query.fecha_desde;
    let fechaHasta = req.query.fecha_hasta;
    let mes = req.query.mes ? parseInt(req.query.mes, 10) : null;
    let anio = req.query.anio ? parseInt(req.query.anio, 10) : null;

    const hoy = new Date();
    if (!anio) anio = hoy.getFullYear();

    const esAnual =
      req.query.periodo === "anio" ||
      req.query.periodo === "todos" ||
      req.query.mes === "todos" ||
      req.query.tipo_periodo === "anio";

    if (!fechaDesde || !fechaHasta) {
      if (esAnual) {
        fechaDesde = new Date(anio, 0, 1, 0, 0, 0, 0);
        fechaHasta = new Date(anio, 11, 31, 23, 59, 59, 999);
      } else {
        if (!mes) mes = hoy.getMonth() + 1;
        fechaDesde = new Date(anio, mes - 1, 1, 0, 0, 0, 0);
        fechaHasta = new Date(anio, mes, 0, 23, 59, 59, 999);
      }
    }

    // ─── PARÁMETROS DE PAGINACIÓN Y BÚSQUEDA PARA COBROS ───
    const pageCobro = parseInt(req.query.pageCobro, 10) || 1;
    const limitCobro = parseInt(req.query.limitCobro, 10) || 10;
    const offsetCobro = (pageCobro - 1) * limitCobro;
    const searchCobro = req.query.searchCobro || "";

    // ─── PARÁMETROS DE PAGINACIÓN Y BÚSQUEDA PARA GASTOS ───
    const pageGasto = parseInt(req.query.pageGasto, 10) || 1;
    const limitGasto = parseInt(req.query.limitGasto, 10) || 10;
    const offsetGasto = (pageGasto - 1) * limitGasto;
    const searchGasto = req.query.searchGasto || "";

    // ─── FILTROS (WHERE) PARA COBROS ───
    const whereCobro = {};
    if (fechaDesde && fechaHasta) {
      whereCobro.fecha_cobro = { [Op.between]: [fechaDesde, fechaHasta] };
    }
    if (searchCobro.trim() !== "") {
      whereCobro[Op.or] = [
        { observaciones: { [Op.like]: `%${searchCobro}%` } },
        { "$SolicitudCobro.observaciones$": { [Op.like]: `%${searchCobro}%` } },
        {
          "$SolicitudCobro.Paciente.nombre$": {
            [Op.like]: `%${searchCobro}%`,
          },
        },
        {
          "$SolicitudCobro.Paciente.apellido$": {
            [Op.like]: `%${searchCobro}%`,
          },
        },
        {
          "$SolicitudCobro.Paciente.dni$": {
            [Op.like]: `%${searchCobro}%`,
          },
        },
      ];
    }

    // ─── FILTROS (WHERE) PARA GASTOS ───
    const whereGasto = { activo: true };
    if (fechaDesde && fechaHasta) {
      whereGasto.fecha_gasto = { [Op.between]: [fechaDesde, fechaHasta] };
    }
    if (searchGasto.trim() !== "") {
      whereGasto[Op.or] = [
        { concepto: { [Op.like]: `%${searchGasto}%` } },
        { "$CategoriaGasto.nombre$": { [Op.like]: `%${searchGasto}%` } },
      ];
    }

    // ─── EJECUCIÓN EN PARALELO DE CONSULTAS ───
    const [
      resultadoCobros,
      resultadoGastos,
      todosCobrosPeriodo,
      totalEgresosSuma,
      turnosPendientes,
      solicitudesPendientesRaw,
    ] = await Promise.all([
      // 1. Cobros reales paginados para tabla / vista
      Cobro.findAndCountAll({
        where: whereCobro,
        limit: limitCobro,
        offset: offsetCobro,
        order: [
          ["fecha_cobro", "DESC"],
          ["id", "DESC"],
        ],
        subQuery: false,
        distinct: true,
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
                model: Paciente,
                attributes: [
                  "id_paciente",
                  "nombre",
                  "apellido",
                  "dni",
                  "telefono",
                ],
              },
              {
                model: Turno,
                attributes: [
                  "id_turno",
                  "fecha_hora_inicio",
                  "fecha_hora_fin",
                  "notas_consulta",
                ],
                include: [
                  {
                    model: PracticaTurno,
                    include: [
                      {
                        model: Practica,
                        attributes: ["nombre_referencia", "nombre_nomenclador"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),

      // 2. Gastos paginados para tabla / vista
      Gasto.findAndCountAll({
        where: whereGasto,
        limit: limitGasto,
        offset: offsetGasto,
        order: [["fecha_gasto", "DESC"]],
        subQuery: false,
        include: [
          {
            model: CategoriaGasto,
            as: "CategoriaGasto",
            attributes: ["nombre"],
          },
        ],
      }),

      // 3. Todos los cobros del período completo para cálculo fiel de KPI Cobros Registrados
      Cobro.findAll({
        where:
          fechaDesde && fechaHasta
            ? { fecha_cobro: { [Op.between]: [fechaDesde, fechaHasta] } }
            : {},
        attributes: ["id", "monto"],
      }),

      // 4. Suma de gastos del período completo
      Gasto.sum("monto", { where: whereGasto }),

      // 5. Turnos atendidos sin solicitud de cobro generada aún
      (async () => {
        const solicitudesExistentes = await SolicitudCobro.findAll({
          where: { turno_id: { [Op.ne]: null } },
          attributes: ["turno_id"],
        });
        const turnosConSolicitudIds = solicitudesExistentes
          .map((s) => s.turno_id)
          .filter(Boolean);

        return Turno.findAll({
          where: {
            activo: true,
            id_estado: 2, // Atendido
            id_turno: {
              [Op.notIn]:
                turnosConSolicitudIds.length > 0
                  ? turnosConSolicitudIds
                  : [-1],
            },
          },
          include: [
            {
              model: Paciente,
              attributes: ["nombre", "apellido", "dni", "telefono"],
            },
            {
              model: EstadoTurno,
              attributes: ["estado"],
            },
            {
              model: PracticaTurno,
              include: [
                {
                  model: Practica,
                  attributes: ["nombre_referencia", "nombre_nomenclador"],
                },
              ],
            },
          ],
          order: [["fecha_hora_inicio", "DESC"]],
        });
      })(),

      // 6. Solicitudes de cobro con saldo pendiente ('pendiente' o 'parcial')
      SolicitudCobro.findAll({
        where: {
          estado: { [Op.in]: ["pendiente", "parcial"] },
        },
        include: [
          {
            model: Paciente,
            attributes: [
              "id_paciente",
              "nombre",
              "apellido",
              "dni",
              "telefono",
            ],
          },
          {
            model: Turno,
            attributes: [
              "id_turno",
              "fecha_hora_inicio",
              "fecha_hora_fin",
              "notas_consulta",
            ],
            include: [
              {
                model: PracticaTurno,
                include: [
                  {
                    model: Practica,
                    attributes: ["nombre_referencia", "nombre_nomenclador"],
                  },
                ],
              },
            ],
          },
          {
            model: Cobro,
            as: "Cobros",
            include: [{ model: MetodoPago, as: "MetodoPago" }],
          },
        ],
        order: [["created_at", "DESC"]],
      }),
    ]);

    // ─── CÁLCULOS DE TOTALES ───
    const totalIngresos = todosCobrosPeriodo.reduce(
      (acc, c) => acc + (Number(c.monto) || 0),
      0,
    );

    const totalEgresos = Number(totalEgresosSuma) || 0;
    const balanceNeto = totalIngresos - totalEgresos;

    const solicitudesPendientes = solicitudesPendientesRaw
      .map(formatearSolicitudConSaldos)
      .filter((s) => s.saldo_pendiente > 0.009);

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

    const totalPagesCobro = Math.ceil(resultadoCobros.count / limitCobro);
    const totalPagesGasto = Math.ceil(resultadoGastos.count / limitGasto);

    // ─── RESPUESTA CONSOLIDADA ───
    res.status(200).json({
      status: "success",
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
        periodo: {
          mes: esAnual ? null : mes,
          anio,
          fechaDesde,
          fechaHasta,
          esAnual,
          esTodos: esAnual,
        },
        cobros: {
          total: resultadoCobros.count,
          page: pageCobro,
          limit: limitCobro,
          totalPages: totalPagesCobro,
          hasNextPage: pageCobro < totalPagesCobro,
          hasPrevPage: pageCobro > 1,
        },
        gastos: {
          total: resultadoGastos.count,
          page: pageGasto,
          limit: limitGasto,
          totalPages: totalPagesGasto,
          hasNextPage: pageGasto < totalPagesGasto,
          hasPrevPage: pageGasto > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener los datos consolidados de caja:", error);
    res
      .status(500)
      .json({ error: "Error interno al obtener los datos de la caja" });
  }
};
