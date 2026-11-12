/** @format */

import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { Cobro, Paciente, Turno, Cuota } from "../models/index.model.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

/** Suma meses a una fecha sin desbordar (31/01 + 1 mes = 28/02, no 03/03). */
const sumarMeses = (fecha, meses) => {
  const d = new Date(fecha);
  const dia = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + meses);
  const ultimoDia = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(dia, ultimoDia));
  return d;
};

// Obtener un cobro por turno ID
export const getCobroByTurnoId = async (req, res) => {
  try {
    const { turnoId } = req.params;
    const cobro = await Cobro.findOne({
      where: { id_turno: turnoId, activo: true },
      include: [
        {
          model: Turno,
          attributes: ["fecha_hora_inicio", "fecha_hora_fin", "precio_final"],
        },
        {
          model: Paciente,
          attributes: ["nombre", "apellido", "dni", "telefono"],
        },
        {
          model: Cuota,
          where: { activo: true },
          required: false,
        },
      ],
      order: [[Cuota, "nro_cuota", "ASC"]],
    });

    if (!cobro) {
      return res.status(404).json({
        status: "error",
        message: "No se encontraron cobros para el turno especificado",
      });
    }

    res.status(200).json({
      status: "success",
      data: cobro,
    });
  } catch (error) {
    console.error("Error al obtener cobros por turno:", error);
    res.status(500).json({ error: "Error al obtener cobros por turno" });
  }
};

// Obtener todos los cobros con paginación
export const getAllCobros = async (req, res) => {
  try {
    const { page, limit, offset, search, sortField, sortOrder } = parsePagination(req.query, {
      defaultLimit: 9,
      defaultSortField: "fecha_emision",
      defaultSortOrder: "ASC",
      allowedSortFields: Object.keys(Cobro.rawAttributes),
    });
    const where = {
      activo: true,
    };

    // Filtrar por año (por defecto el año actual en lugar de histórico infinito)
    let anio = req.query.anio ? parseInt(req.query.anio, 10) : null;
    if (!anio && req.query.periodo !== "historico") {
      anio = new Date().getFullYear();
    }
    if (anio) {
      where.fecha_emision = {
        [Op.between]: [
          new Date(anio, 0, 1, 0, 0, 0, 0),
          new Date(anio, 11, 31, 23, 59, 59, 999),
        ],
      };
    }

    // Busqueda por nombre apellido dni telefono
    if (search !== "") {
      where[Op.or] = [
        { "$Paciente.nombre$": { [Op.like]: `%${search}%` } },
        { "$Paciente.apellido$": { [Op.like]: `%${search}%` } },
        { "$Paciente.dni$": { [Op.like]: `%${search}%` } },
        { "$Paciente.telefono$": { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: cobros } = await Cobro.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, sortOrder]],
      include: [
        {
          model: Turno,
          attributes: ["fecha_hora_inicio", "fecha_hora_fin"],
        },
        {
          model: Paciente,
          attributes: ["nombre", "apellido", "dni", "telefono"],
        },
        {
          model: Cuota,
          attributes: ["id_cuota", "monto_cuota", "monto_cobrado", "estado", "fecha_cobro"],
        },
      ],
    });


    res.status(200).json({
      status: "success",
      data: cobros,
      meta: buildPaginationMeta(count, page, limit),
    });
  } catch (error) {
    console.error("Error al obtener el cobro del turno:", error);
    res.status(500).json({ error: "Error al obtener el cobro del turno" });
  }
};

// Obtener una cobro por su ID
export const getCobroById = async (req, res) => {
  try {
    const cobro = req.cobro;

    res.status(200).json({
      status: "success",
      data: cobro,
    });
  } catch (error) {
    console.error("Error al obtener el cobro:", error);
    res.status(500).json({ error: "Error al obtener el cobro" });
  }
};

// Crear una nueva cobro
export const createCobro = async (req, res) => {
  try {
    const { monto_a_cobrar, cant_cuotas } = req.body;

    const id_turno = req.turno.id_turno;
    const id_paciente = req.paciente.id_paciente;

    const turnoExiste = await Cobro.findOne({ where: { id_turno: id_turno } });
    if (turnoExiste) {
      return res.status(409).json({
        status: "error",
        message: "Este turno ya tiene un cobro",
      });
    }

    const newCobro = await Cobro.create({
      id_turno: id_turno,
      id_paciente: id_paciente,
      monto_a_cobrar: monto_a_cobrar,
      cant_cuotas: cant_cuotas,
    });

    res.status(201).json({
      status: "success",
      data: newCobro,
    });
  } catch (error) {
    console.error("Error al crear el cobro:", error);
    res.status(500).json({ error: "Error al crear el cobro" });
  }
};

// Actualizar una cobro existente
export const updateCobro = async (req, res) => {
  try {
    const { id_turno, id_paciente, monto_a_cobrar, cant_cuotas } = req.body;

    const cobro = req.cobro;

    if (id_turno) {
      const turno = await Turno.findByPk(id_turno);

      if (!turno) {
        return res.status(400).json({
          status: "error",
          message: "El turno seleccionado no existe.",
        });
      }
    }

    if (id_paciente) {
      const paciente = await Paciente.findByPk(id_paciente);

      if (!paciente) {
        return res.status(400).json({
          status: "error",
          message: "El paciente seleccionado no existe.",
        });
      }
    }

    await cobro.update({
      id_turno: id_turno ?? cobro.id_turno,
      id_paciente: id_paciente ?? cobro.id_paciente,
      monto_a_cobrar: monto_a_cobrar ?? cobro.monto_a_cobrar,
      cant_cuotas: cant_cuotas ?? cobro.cant_cuotas,
    });

    res.status(200).json({
      status: "success",
      data: cobro,
    });
  } catch (error) {
    console.error("Error al actualizar el cobro:", error);
    res.status(500).json({ error: "Error al actualizar el cobro" });
  }
};

// ==========================================
// 1. COBRO INMEDIATO (Pago Total en 1 cuota)
// ==========================================
export const createCobroInmediato = async (req, res) => {
  try {
    const { monto_a_cobrar, metodo_pago } = req.body;
    const id_turno = req.turno.id_turno;
    const id_paciente = req.paciente.id_paciente;

    const turnoExiste = await Cobro.findOne({ where: { id_turno, activo: true } });
    if (turnoExiste) {
      return res.status(409).json({
        status: "error",
        message: "Este turno ya tiene un cobro registrado.",
      });
    }

    const newCobro = await sequelize.transaction(async (t) => {
      // Creamos el cobro con 1 sola cuota
      const cobro = await Cobro.create(
        { id_turno, id_paciente, monto_a_cobrar: Number(monto_a_cobrar), cant_cuotas: 1 },
        { transaction: t },
      );

      // Creamos y asentamos automáticamente la cuota como pagada en el acto
      await Cuota.create(
        {
          id_cobro: cobro.id_cobro,
          nro_cuota: 1,
          monto_cuota: Number(monto_a_cobrar),
          monto_cobrado: Number(monto_a_cobrar),
          fecha_vencimiento: new Date().toISOString().split("T")[0],
          fecha_cobro: new Date(),
          metodo_pago: metodo_pago || "Efectivo",
          estado: "Pagada",
        },
        { transaction: t },
      );

      return cobro;
    });

    return res.status(201).json({
      status: "success",
      data: newCobro,
      message: "Cobro inmediato registrado correctamente.",
    });
  } catch (error) {
    console.error("Error al crear cobro inmediato:", error);
    return res.status(500).json({ error: "Error al procesar el cobro inmediato." });
  }
};

// ==========================================
// 2. PLAN DE CUOTAS FIJAS (Distribución automática)
// ==========================================
export const createCobroCuotas = async (req, res) => {
  try {
    const { monto_a_cobrar, cant_cuotas } = req.body;
    const id_turno = req.turno.id_turno;
    const id_paciente = req.paciente.id_paciente;

    const turnoExiste = await Cobro.findOne({ where: { id_turno, activo: true } });
    if (turnoExiste) {
      return res.status(409).json({
        status: "error",
        message: "Este turno ya tiene un cobro registrado.",
      });
    }

    const total = Number(monto_a_cobrar);
    const cantidadCuotas = Number(cant_cuotas) || 1;

    // Reparto en centavos: la última cuota absorbe el resto para que la suma sea exacta
    const centavosTotal = Math.round(total * 100);
    const centavosBase = Math.floor(centavosTotal / cantidadCuotas);
    const centavosResto = centavosTotal - centavosBase * cantidadCuotas;
    const hoyStr = new Date().toISOString().split("T")[0];

    const newCobro = await sequelize.transaction(async (t) => {
      const cobro = await Cobro.create(
        { id_turno, id_paciente, monto_a_cobrar: total, cant_cuotas: cantidadCuotas },
        { transaction: t },
      );

      // Generamos las n cuotas pendientes sin vencimiento
      const cuotas = Array.from({ length: cantidadCuotas }, (_, i) => ({
        id_cobro: cobro.id_cobro,
        nro_cuota: i + 1,
        monto_cuota: (centavosBase + (i === cantidadCuotas - 1 ? centavosResto : 0)) / 100,
        monto_cobrado: 0,
        fecha_vencimiento: hoyStr,
        estado: "Pendiente",
      }));
      await Cuota.bulkCreate(cuotas, { transaction: t });

      return cobro;
    });

    return res.status(201).json({
      status: "success",
      data: newCobro,
      message: "Plan de cuotas fijas creado correctamente.",
    });
  } catch (error) {
    console.error("Error al crear plan de cuotas:", error);
    return res.status(500).json({ error: "Error al procesar el plan de cuotas." });
  }
};

// ==========================================
// 3. ACUERDO INFORMAL / LIBRE (Con o sin entrega inicial)
// ==========================================
export const createCobroInformal = async (req, res) => {
  try {
    const { monto_a_cobrar, entrega_inicial, metodo_pago } = req.body;
    const id_turno = req.turno.id_turno;
    const id_paciente = req.paciente.id_paciente;

    const turnoExiste = await Cobro.findOne({ where: { id_turno, activo: true } });
    if (turnoExiste) {
      return res.status(409).json({
        status: "error",
        message: "Este turno ya tiene un cobro registrado.",
      });
    }

    const total = Number(monto_a_cobrar);
    const entrega = Number(entrega_inicial) || 0;

    const newCobro = await sequelize.transaction(async (t) => {
      const cobro = await Cobro.create(
        { id_turno, id_paciente, monto_a_cobrar: total, cant_cuotas: 1 }, // Se maneja como libre a cuenta
        { transaction: t },
      );

      // Si hay una entrega inicial, la registramos como un pago parcial o total inicial
      if (entrega > 0) {
        await Cuota.create(
          {
            id_cobro: cobro.id_cobro,
            nro_cuota: 1,
            monto_cuota: total,
            monto_cobrado: Math.min(entrega, total),
            fecha_vencimiento: new Date().toISOString().split("T")[0],
            fecha_cobro: new Date(),
            metodo_pago: metodo_pago || "Efectivo",
            estado: entrega >= total ? "Pagada" : "Parcialmente pagada",
          },
          { transaction: t },
        );
      } else {
        // Acuerdo informal sin entrega inicial: queda registrada 1 cuota pendiente con monto_cobrado = 0
        await Cuota.create(
          {
            id_cobro: cobro.id_cobro,
            nro_cuota: 1,
            monto_cuota: total,
            monto_cobrado: 0,
            fecha_vencimiento: new Date().toISOString().split("T")[0],
            fecha_cobro: null,
            metodo_pago: metodo_pago || "Efectivo",
            estado: "Pendiente",
          },
          { transaction: t },
        );
      }

      return cobro;
    });

    return res.status(201).json({
      status: "success",
      data: newCobro,
      message: "Acuerdo informal registrado correctamente.",
    });
  } catch (error) {
    console.error("Error al registrar acuerdo informal:", error);
    return res.status(500).json({ error: "Error al registrar el acuerdo informal." });
  }
};

// ==========================================
// 4. REGISTRAR PAGO UNIFICADO (Total o Parcial)
// ==========================================
export const registrarPagoTurno = async (req, res) => {
  try {
    const { id_turno, id_cuota, monto_a_cobrar, metodo_pago } = req.body;
    const montoPago = Number(monto_a_cobrar);

    if (!montoPago || montoPago <= 0) {
      return res.status(400).json({
        status: "error",
        message: "El monto a cobrar debe ser mayor a 0.",
      });
    }

    const METODOS_VALIDOS = ["Efectivo", "Transferencia", "Tarjeta", "Otro"];
    const metodo = METODOS_VALIDOS.includes(metodo_pago) ? metodo_pago : "Efectivo";
    const hoyStr = new Date().toISOString().split("T")[0];
    const ahora = new Date();

    const resultado = await sequelize.transaction(async (t) => {
      let cobro = null;

      // 1. Localizar el Cobro objetivo
      if (id_cuota) {
        const cuotaBase = await Cuota.findByPk(id_cuota, {
          include: [{ model: Cobro }],
          transaction: t,
        });
        if (cuotaBase && cuotaBase.Cobro) {
          cobro = cuotaBase.Cobro;
        }
      }

      if (!cobro && id_turno) {
        cobro = await Cobro.findOne({
          where: { id_turno, activo: true },
          transaction: t,
        });
      }

      // 2. Si aún no existe Cobro previo para el turno, crearlo con su primera cuota
      if (!cobro) {
        if (!id_turno) {
          const err = new Error("Se requiere id_turno o id_cuota válido para procesar el cobro.");
          err.statusCode = 400;
          throw err;
        }

        const turno = await Turno.findByPk(id_turno, { transaction: t });
        if (!turno) {
          const err = new Error("El turno especificado no existe.");
          err.statusCode = 404;
          throw err;
        }

        const totalTratamiento = Number(turno.precio_final) || montoPago;
        const cobradoAhora = Math.min(totalTratamiento, montoPago);
        const estaPagada = cobradoAhora >= totalTratamiento;
        const saldoRestante = Math.max(0, totalTratamiento - cobradoAhora);

        cobro = await Cobro.create(
          {
            id_turno,
            id_paciente: turno.id_paciente,
            monto_a_cobrar: totalTratamiento,
            cant_cuotas: 1,
          },
          { transaction: t }
        );

        await Cuota.create(
          {
            id_cobro: cobro.id_cobro,
            nro_cuota: 1,
            monto_cuota: totalTratamiento,
            monto_cobrado: cobradoAhora,
            fecha_vencimiento: hoyStr,
            fecha_cobro: ahora,
            metodo_pago: metodo,
            estado: estaPagada ? "Pagada" : "Parcialmente pagada",
          },
          { transaction: t }
        );

        return {
          id_cobro: cobro.id_cobro,
          id_turno,
          saldoRestante,
          pagadoCompleto: estaPagada,
        };
      }

      // 3. Si ya existe un Cobro previo: obtener todas sus cuotas activas ordenadas
      let cuotas = await Cuota.findAll({
        where: { id_cobro: cobro.id_cobro, activo: true },
        order: [
          ["nro_cuota", "ASC"],
          ["id_cuota", "ASC"],
        ],
        transaction: t,
      });

      // Si no tuviera cuotas, crear la cuota 1 correspondiente al total
      if (!cuotas || cuotas.length === 0) {
        const totalTratamiento = Number(cobro.monto_a_cobrar) || montoPago;
        const nuevaQ = await Cuota.create(
          {
            id_cobro: cobro.id_cobro,
            nro_cuota: 1,
            monto_cuota: totalTratamiento,
            monto_cobrado: 0,
            fecha_vencimiento: hoyStr,
            metodo_pago: metodo,
            estado: "Pendiente",
          },
          { transaction: t }
        );
        cuotas = [nuevaQ];
      }

      // Ordenar las cuotas a pagar: si se pasó id_cuota, priorizarla; luego las siguientes pendientes
      let cuotasPendientes = cuotas.filter((q) => q.estado !== "Pagada");
      if (id_cuota) {
        const idxTarget = cuotasPendientes.findIndex((q) => Number(q.id_cuota) === Number(id_cuota));
        if (idxTarget > 0) {
          const target = cuotasPendientes.splice(idxTarget, 1)[0];
          cuotasPendientes.unshift(target);
        }
      }

      // Si todas ya estaban pagadas y el cobro permite registrar pago adicional, crear nueva cuota
      if (cuotasPendientes.length === 0) {
        const nuevaCuota = await Cuota.create(
          {
            id_cobro: cobro.id_cobro,
            nro_cuota: cuotas.length + 1,
            monto_cuota: montoPago,
            monto_cobrado: montoPago,
            fecha_vencimiento: hoyStr,
            fecha_cobro: ahora,
            metodo_pago: metodo,
            estado: "Pagada",
          },
          { transaction: t }
        );
        cuotas.push(nuevaCuota);
      } else {
        // Distribuir el montoPago en cascada entre las cuotas pendientes
        let remanente = montoPago;
        for (const q of cuotasPendientes) {
          if (remanente <= 0) break;
          const montoQ = Number(q.monto_cuota) || 0;
          const yaCobradoQ = Number(q.monto_cobrado) || 0;
          const saldoQ = Math.max(0, montoQ - yaCobradoQ);

          if (saldoQ > 0) {
            const aporte = Math.min(saldoQ, remanente);
            const nuevoCobrado = yaCobradoQ + aporte;
            const estaPagada = nuevoCobrado >= montoQ - 0.009;

            await q.update(
              {
                monto_cobrado: nuevoCobrado,
                fecha_cobro: ahora,
                metodo_pago: metodo,
                estado: estaPagada ? "Pagada" : "Parcialmente pagada",
              },
              { transaction: t }
            );

            // Reflejar el cambio en la lista local para el balance final
            q.monto_cobrado = nuevoCobrado;
            q.estado = estaPagada ? "Pagada" : "Parcialmente pagada";
            remanente -= aporte;
          }
        }
      }

      // 4. Calcular saldo pendiente total real del Cobro
      const totalTratamiento = Number(cobro.monto_a_cobrar) || 0;
      const totalCobradoEnCuotas = cuotas.reduce(
        (acc, q) => acc + (Number(q.monto_cobrado) || 0),
        0
      );
      const saldoRestante = Math.max(0, totalTratamiento - totalCobradoEnCuotas);
      const pagadoCompleto = saldoRestante <= 0.01;

      return {
        id_cobro: cobro.id_cobro,
        id_turno: cobro.id_turno,
        saldoRestante,
        pagadoCompleto,
      };
    });

    return res.status(200).json({
      status: "success",
      message: resultado.pagadoCompleto
        ? "Turno pagado completamente."
        : "Pago parcial registrado. Saldo pendiente actualizado.",
      data: {
        id_turno: resultado.id_turno,
        id_cobro: resultado.id_cobro,
        monto_cobrado: montoPago,
        saldo_pendiente: resultado.saldoRestante,
        pagado_completo: resultado.pagadoCompleto,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ status: "error", message: error.message });
    }
    console.error("Error al registrar pago de turno:", error);
    return res.status(500).json({
      status: "error",
      message: "Error al registrar el pago.",
    });
  }
};

// Eliminar una cobro existente
export const deleteCobro = async (req, res) => {
  try {
    const cobro = req.cobro;

    await cobro.update({
      activo: false,
    });

    res.status(200).json({ status: "success", message: "Cobro eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el cobro:", error);
    res.status(500).json({ error: "Error al eliminar el cobro" });
  }
};
