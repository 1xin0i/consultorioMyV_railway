/** @format */

import { Op } from "sequelize";
import { Cobro, Gasto, Cuota, Paciente, CategoriaGasto } from "../models/index.model.js";

export const getCajaConsolidada = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const ahora = new Date();
    const inicioMesDefault = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
    const finMesDefault = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);

    const desde = fecha_inicio ? new Date(`${fecha_inicio}T00:00:00.000`) : inicioMesDefault;
    const hasta = fecha_fin ? new Date(`${fecha_fin}T23:59:59.999`) : finMesDefault;

    const rangoFechas = {
      [Op.between]: [desde, hasta],
    };

    // Parámetros de paginación
    const pageCobro = parseInt(req.query.pageCobro, 10) || 1;
    const limitCobro = parseInt(req.query.limitCobro, 10) || 10;
    const offsetCobro = (pageCobro - 1) * limitCobro;
    const searchCobro = (req.query.searchCobro || "").trim();

    const pageGasto = parseInt(req.query.pageGasto, 10) || 1;
    const limitGasto = parseInt(req.query.limitGasto, 10) || 10;
    const offsetGasto = (pageGasto - 1) * limitGasto;
    const searchGasto = (req.query.searchGasto || "").trim();

    // Filtros de fecha: verifica si en tu modelo es fecha_emision o fecha_cobro
    // Usamos el campo correspondiente de tu modelo Cobro:
    const campoFechaCobro = Cobro.rawAttributes.fecha_emision
      ? "fecha_emision"
      : Cobro.rawAttributes.fecha_cobro
      ? "fecha_cobro"
      : "createdAt";

    const whereCobro = {
      [campoFechaCobro]: rangoFechas,
    };
    if (Cobro.rawAttributes.activo) whereCobro.activo = true;

    if (searchCobro !== "") {
      whereCobro[Op.or] = [
        { "$Paciente.nombre$": { [Op.like]: `%${searchCobro}%` } },
        { "$Paciente.apellido$": { [Op.like]: `%${searchCobro}%` } },
        { "$Paciente.dni$": { [Op.like]: `%${searchCobro}%` } },
      ];
    }

    const whereGasto = {
      fecha_gasto: rangoFechas,
    };
    if (Gasto.rawAttributes.activo) whereGasto.activo = true;

    if (searchGasto !== "") {
      whereGasto[Op.or] = [
        { concepto: { [Op.like]: `%${searchGasto}%` } },
        { comprobante: { [Op.like]: `%${searchGasto}%` } },
        { "$CategoriaGasto.nombre$": { [Op.like]: `%${searchGasto}%` } },
      ];
    }

    // Consultas
    const [resultadoCobros, resultadoGastos, todosLosCobrosPeriodo, todosLosGastosPeriodo] = await Promise.all([
      Cobro.findAndCountAll({
        where: whereCobro,
        limit: limitCobro,
        offset: offsetCobro,
        order: [[campoFechaCobro, "DESC"]],
        include: [
          {
            model: Paciente,
            attributes: ["nombre", "apellido", "dni", "telefono"],
          },
          {
            model: Cuota,
            attributes: ["id_cuota", "monto_cobrado", "monto_cuota", "estado", "metodo_pago"],
          },
        ],
      }),

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

      // Traer todos los cobros del período para calcular la suma exacta de cuotas cobradas
      Cobro.findAll({
        where: whereCobro,
        include: [
          {
            model: Cuota,
            attributes: ["monto_cobrado"],
          },
        ],
      }),

      // Traer gastos del período para sumar monto
      Gasto.findAll({
        where: whereGasto,
        attributes: ["monto"],
      }),
    ]);

    // Calcular ingresos sumando monto_cobrado de cada cuota
    const ingresosTotales = todosLosCobrosPeriodo.reduce((acc, c) => {
      const cuotas = c.Cuotas || c.Cuota || [];
      const sumCuotas = cuotas.reduce((qAcc, q) => qAcc + (Number(q.monto_cobrado) || 0), 0);
      return acc + (sumCuotas > 0 ? sumCuotas : (Number(c.monto_total) || 0));
    }, 0);

    const egresosTotales = todosLosGastosPeriodo.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
    const balancePeriodo = ingresosTotales - egresosTotales;

    const totalPagesCobro = Math.ceil(resultadoCobros.count / limitCobro);
    const totalPagesGasto = Math.ceil(resultadoGastos.count / limitGasto);

    res.status(200).json({
      status: "success",
      periodo: { desde, hasta },
      resumen: {
        ingresosTotales,
        egresosTotales,
        balancePeriodo,
      },
      data: {
        cobros: resultadoCobros.rows,
        gastos: resultadoGastos.rows,
      },
      meta: {
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
    res.status(500).json({ error: "Error interno al obtener los datos de la caja" });
  }
};