/** @format */

import { Op } from "sequelize";
import {
  Cobro,
  Gasto,
  Cuota,
  Paciente,
  CategoriaGasto,
  Turno,
  EstadoTurno,
} from "../models/index.model.js";

/**
 * Obtiene de forma unificada y paginada los cobros y los gastos para la gestión de caja,
 * con filtrado por período (mes y año) y pendientes adeudados hasta hoy.
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

    // Si se solicita ver el año completo (en vez de un solo mes o histórico infinito)
    const esAnual =
      req.query.periodo === "anio" ||
      req.query.periodo === "todos" ||
      req.query.mes === "todos" ||
      req.query.tipo_periodo === "anio";

    if (!fechaDesde || !fechaHasta) {
      if (esAnual) {
        // Todo el año seleccionado (del 1 de enero al 31 de diciembre)
        fechaDesde = new Date(anio, 0, 1, 0, 0, 0, 0);
        fechaHasta = new Date(anio, 11, 31, 23, 59, 59, 999);
      } else {
        // Mes seleccionado dentro del año
        if (!mes) mes = hoy.getMonth() + 1; // 1-12
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
    let whereCobro = { activo: true };
    if (fechaDesde && fechaHasta) {
      whereCobro.fecha_emision = { [Op.between]: [fechaDesde, fechaHasta] };
    }
    if (searchCobro.trim() !== "") {
      whereCobro[Op.or] = [
        { "$Paciente.nombre$": { [Op.like]: `%${searchCobro}%` } },
        { "$Paciente.apellido$": { [Op.like]: `%${searchCobro}%` } },
        { "$Paciente.dni$": { [Op.like]: `%${searchCobro}%` } },
      ];
    }

    // ─── FILTROS (WHERE) PARA GASTOS ───
    let whereGasto = { activo: true };
    if (fechaDesde && fechaHasta) {
      whereGasto.fecha_gasto = { [Op.between]: [fechaDesde, fechaHasta] };
    }
    if (searchGasto.trim() !== "") {
      whereGasto[Op.or] = [
        { concepto: { [Op.like]: `%${searchGasto}%` } },
        { comprobante: { [Op.like]: `%${searchGasto}%` } },
        { "$CategoriaGasto.nombre$": { [Op.like]: `%${searchGasto}%` } },
      ];
    }

    // ─── FECHA TOPE PARA "PENDIENTE HASTA HOY" ───
    // Hasta hoy (DATEONLY: YYYY-MM-DD en fecha local)
    const hoyDate = new Date();
    const hoyStr = `${hoyDate.getFullYear()}-${String(hoyDate.getMonth() + 1).padStart(2, "0")}-${String(hoyDate.getDate()).padStart(2, "0")}`;

    // ─── EJECUCIÓN EN PARALELO DE CONSULTAS ───
    const [
      resultadoCobros,
      resultadoGastos,
      todosCobrosPeriodo,
      totalEgresosSuma,
      turnosPendientes,
      cuotasPendientes,
    ] = await Promise.all([
      // 1. Cobros paginados para tabla / vista
      Cobro.findAndCountAll({
        where: whereCobro,
        limit: limitCobro,
        offset: offsetCobro,
        order: [["fecha_emision", "DESC"]],
        include: [
          {
            model: Paciente,
            attributes: ["nombre", "apellido", "dni", "telefono"],
          },
          {
            model: Cuota,
            attributes: [
              "id_cuota",
              "monto_cobrado",
              "monto_cuota",
              "estado",
              "metodo_pago",
              "fecha_vencimiento",
              "fecha_cobro",
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
        include: [
          {
            model: CategoriaGasto,
            as: "CategoriaGasto",
            attributes: ["nombre"],
          },
        ],
      }),

      // 3. Todos los cobros del período completo para cálculo fiel de KPI Ingresos
      Cobro.findAll({
        where: whereCobro,
        attributes: ["id_cobro"],
        include: [
          {
            model: Cuota,
            attributes: ["monto_cobrado"],
          },
        ],
      }),

      // 4. Suma de egresos del período completo
      Gasto.sum("monto", { where: whereGasto }),

      // 5. Turnos atendidos pendientes de cobro (sin cobro asociado) - NO depende del filtro de período
      (async () => {
        const cobrosExistentes = await Cobro.findAll({
          where: { activo: true },
          attributes: ["id_turno"],
        });
        const turnosConCobroIds = cobrosExistentes
          .map((c) => c.id_turno)
          .filter(Boolean);

        return Turno.findAll({
          where: {
            activo: true,
            id_estado: 2, // Atendido
            id_turno: {
              [Op.notIn]:
                turnosConCobroIds.length > 0 ? turnosConCobroIds : [-1],
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
          ],
          order: [["fecha_hora_inicio", "DESC"]],
        });
      })(),

      // 6. Cuotas pendientes adeudadas HASTA HOY (fecha_vencimiento <= hoy y estado != 'Pagada') - NO depende del filtro de período
      Cuota.findAll({
        where: {
          activo: true,
          estado: { [Op.in]: ["Pendiente", "Parcialmente pagada"] },
          fecha_vencimiento: { [Op.lte]: hoyStr },
        },
        include: [
          {
            model: Cobro,
            where: { activo: true },
            attributes: ["id_cobro", "id_turno", "id_paciente", "monto_a_cobrar"],
            include: [
              {
                model: Paciente,
                attributes: ["nombre", "apellido", "dni", "telefono"],
              },
            ],
          },
        ],
        order: [["fecha_vencimiento", "ASC"]],
      }),
    ]);

    // ─── CÁLCULOS DE TOTALES ───
    let totalIngresos = 0;
    todosCobrosPeriodo.forEach((c) => {
      const pagado = (c.Cuotas || []).reduce(
        (acc, q) => acc + (Number(q.monto_cobrado) || 0),
        0,
      );
      totalIngresos += pagado;
    });

    const totalEgresos = Number(totalEgresosSuma) || 0;
    const balanceNeto = totalIngresos - totalEgresos;

    const totalTurnosPendientes = turnosPendientes.reduce(
      (acc, t) => acc + (Number(t.precio_final) || 0),
      0,
    );

    const totalCuotasPendientes = cuotasPendientes.reduce((acc, q) => {
      const cuotaTotal = Number(q.monto_cuota) || 0;
      const cuotaCobrada = Number(q.monto_cobrado) || 0;
      return acc + Math.max(0, cuotaTotal - cuotaCobrada);
    }, 0);

    const totalPendienteCobro = totalTurnosPendientes + totalCuotasPendientes;

    const totalPagesCobro = Math.ceil(resultadoCobros.count / limitCobro);
    const totalPagesGasto = Math.ceil(resultadoGastos.count / limitGasto);

    // ─── RESPUESTA CONSOLIDADA ───
    res.status(200).json({
      status: "success",
      data: {
        cobros: resultadoCobros.rows,
        gastos: resultadoGastos.rows,
        turnosPendientes,
        cuotasPendientes,
        totales: {
          totalIngresos,
          totalEgresos,
          balanceNeto,
          totalPendienteCobro,
          totalTurnosPendientes,
          totalCuotasPendientes,
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
