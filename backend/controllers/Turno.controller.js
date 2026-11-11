/** @format */

import sequelize from "../config/database.js";
import { Op } from "sequelize";
import {
  Turno,
  HistorialEstadoTurno,
  Practica,
  PracticaTurno,
  PracticaTurnoDiente,
  EstadoTurno,
  Paciente,
  ObraSocial,
  Cobro,
  Cuota,
} from "../models/index.model.js";
import {
  validarEstadoProgramado,
  validarEstados,
  validarSolapaminetoHorarios,
} from "../validations/Turno.validation.js";
import { ESTADOS } from "../constants/EstadosTurno.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

export const getAllTurnosAgenda = async (req, res) => {
  try {
    const turnos = await Turno.findAll({
      where: { activo: true },
      include: [
        {
          model: Paciente,
          attributes: ["nombre", "apellido", "dni", "telefono"], // Atributos que quieres traer del paciente
        },
        {
          model: EstadoTurno,
          attributes: ["estado"], // Atributos que quieres traer del estado
        },
        {
          model: PracticaTurno,
          include: [
            {
              model: Practica,
              attributes: [
                "id_practica",
                "codigo_nomenclador",
                "nombre_nomenclador",
                "nombre_referencia",
                "precio_referencia",
              ],
            },
            {
              model: ObraSocial,
              attributes: ["id_obra_social", "nombre"],
            },
            {
              model: PracticaTurnoDiente,
              as: "dientes",
              attributes: ["id", "numero_fdi", "cara"],
            },
          ],
        },
      ],
    });

    res.status(200).json({
      status: "success",
      data: turnos,
    });
  } catch (error) {
    console.error("Error al obtener los turnos:", error);
    res.status(500).json({ error: "Error al obtener los turnos" });
  }
};

// Obtener todos los turnos
export const getAllTurnos = async (req, res) => {
  try {
    // paginacion
    const { page, limit, offset, search, sortField, sortOrder } =
      parsePagination(req.query, {
        defaultLimit: 9,
        defaultSortField: "fecha_hora_inicio",
        defaultSortOrder: "DESC",
        allowedSortFields: [
          ...Object.keys(Turno.rawAttributes),
          "paciente",
          "estado",
          "fecha",
          "honorarios",
        ],
      });

    const estadoFiltrado = req.query.estadoFiltrado;
    const where = { activo: true };

    if (estadoFiltrado && estadoFiltrado !== "todos" && estadoFiltrado !== "all") {
      const mapaEstados = {
        programado: 1,
        programados: 1,
        atendido: 2,
        atendidos: 2,
        cancelado: 3,
        cancelados: 3,
        inasistido: 4,
        inasistidos: 4,
        inasistente: 4,
        inasistentes: 4,
      };
      const idEst = Number(estadoFiltrado) || mapaEstados[String(estadoFiltrado).toLowerCase()];
      if (idEst) {
        where.id_estado = idEst;
      }
    }

    if (req.query.mes) {
      // mes esperado como "YYYY-MM" (e.g. "2026-10")
      const partes = req.query.mes.split("-");
      if (partes.length === 2) {
        const year = parseInt(partes[0], 10);
        const month = parseInt(partes[1], 10);
        if (!isNaN(year) && !isNaN(month)) {
          const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
          const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
          where.fecha_hora_inicio = {
            [Op.between]: [startOfMonth, endOfMonth],
          };
        }
      }
    }

    // Busqueda por nombre apellido dni telefono
    if (search !== "") {
      where[Op.or] = [
        { fecha_hora_inicio: { [Op.like]: `%${search}%` } },
        { fecha_hora_fin: { [Op.like]: `%${search}%` } },
        { "$Paciente.nombre$": { [Op.like]: `%${search}%` } },
        { "$Paciente.apellido$": { [Op.like]: `%${search}%` } },
        { "$Paciente.dni$": { [Op.like]: `%${search}%` } },
        { "$Paciente.telefono$": { [Op.like]: `%${search}%` } },
        sequelize.where(
          sequelize.fn("concat", sequelize.col("Paciente.nombre"), " ", sequelize.col("Paciente.apellido")),
          { [Op.like]: `%${search}%` }
        ),
      ];
    }

    let orderClause = [[sortField, sortOrder]];
    if (sortField === "paciente") {
      orderClause = [
        [{ model: Paciente }, "apellido", sortOrder],
        [{ model: Paciente }, "nombre", sortOrder],
      ];
    } else if (sortField === "estado") {
      orderClause = [[{ model: EstadoTurno }, "estado", sortOrder]];
    } else if (sortField === "fecha" || sortField === "fecha_hora_inicio") {
      orderClause = [["fecha_hora_inicio", sortOrder]];
    } else if (sortField === "honorarios" || sortField === "precio_final") {
      orderClause = [["precio_final", sortOrder]];
    }

    const { count, rows: turnos } = await Turno.findAndCountAll({
      where,
      limit,
      offset,
      order: orderClause,
      distinct: true,
      include: [
        {
          model: Paciente,
          attributes: ["nombre", "apellido", "dni", "telefono"], // Atributos que quieres traer del paciente
        },
        {
          model: EstadoTurno,
          attributes: ["estado"], // Atributos que quieres traer del estado
        },
        {
          model: PracticaTurno,
          include: [
            {
              model: Practica,
              attributes: [
                "id_practica",
                "codigo_nomenclador",
                "nombre_nomenclador",
                "nombre_referencia",
                "precio_referencia",
              ],
            },
            {
              model: ObraSocial,
              attributes: ["id_obra_social", "nombre"],
            },
            {
              model: PracticaTurnoDiente,
              as: "dientes",
              attributes: ["id", "numero_fdi", "cara"],
            },
          ],
        },
        {
          model: Cobro,
          required: false,
          attributes: ["id_cobro", "monto_a_cobrar", "cant_cuotas"],
          include: [
            {
              model: Cuota,
              attributes: ["id_cuota", "monto_cobrado", "monto_cuota", "estado"],
            },
          ],
        },
      ],
    });

    res.status(200).json({
      status: "success",
      data: turnos,
      meta: buildPaginationMeta(count, page, limit),
    });
  } catch (error) {
    console.error("Error al obtener los turnos:", error);
    res.status(500).json({ error: "Error al obtener los turnos" });
  }
};

// Obtener todos los turnos en Atendido
export const getAllTurnosAtendidos = async (req, res) => {
  try {
    const cobrosExistentes = await Cobro.findAll({
      where: { activo: true },
      attributes: ["id_turno"],
    });

    const turnosConCobroIds = cobrosExistentes.map((cobro) => cobro.id_turno);

    // 2. Traemos los turnos atendidos excluyendo los que ya están en la lista de cobrados
    const turnos = await Turno.findAll({
      where: {
        activo: true,
        id_estado: 2, // Atendido
        id_turno: {
          [Op.notIn]: turnosConCobroIds.length > 0 ? turnosConCobroIds : [-1], // Evita error si el array está vacío
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
    });

    res.status(200).json({
      status: "success",
      data: turnos,
    });
  } catch (error) {
    console.error("Error al obtener los turnos atendidos sin cobro:", error);
    res.status(500).json({ error: "Error al obtener los turnos atendidos" });
  }
};

// Obtener un turno por su ID
export const getTurnoById = async (req, res) => {
  try {
    const turnoCompleto = await Turno.findByPk(req.turno.id_turno, {
      include: [
        {
          model: Paciente,
          attributes: [
            "nombre",
            "apellido",
            "dni",
            "telefono",
            "fecha_nacimiento",
            "domicilio",
          ],
        },
        {
          model: EstadoTurno,
          attributes: ["id_estado", "estado"],
        },
        {
          model: PracticaTurno,
          include: [
            {
              model: Practica,
              attributes: [
                "id_practica",
                "codigo_nomenclador",
                "nombre_nomenclador",
                "nombre_referencia",
                "precio_referencia",
              ],
            },
            {
              model: ObraSocial,
              attributes: ["id_obra_social", "nombre"],
            },
            {
              model: PracticaTurnoDiente,
              as: "dientes",
              attributes: ["id", "numero_fdi", "cara"],
            },
          ],
        },
      ],
    });

    res.status(200).json({
      status: "success",
      data: turnoCompleto || req.turno,
    });
  } catch (error) {
    console.error("Error al obtener el turno:", error);
    res.status(500).json({ error: "Error al obtener el turno" });
  }
};

export const getTurnosByPacienteId = async (req, res) => {
  try {
    const { id_paciente } = req.params;

    const turnos = await Turno.findAll({
      where: {
        id_paciente: id_paciente,
        activo: true,
      },
      order: [["fecha_hora_inicio", "DESC"]], // Del más reciente al más antiguo
      include: [
        {
          model: EstadoTurno,
          attributes: ["id_estado", "estado"],
        },
        {
          model: PracticaTurno,
          include: [
            {
              model: Practica,
              attributes: [
                "id_practica",
                "codigo_nomenclador",
                "nombre_nomenclador",
                "nombre_referencia",
              ],
            },
            {
              model: ObraSocial,
              attributes: ["id_obra_social", "nombre"],
            },
            {
              model: PracticaTurnoDiente,
              as: "dientes",
              attributes: ["id", "numero_fdi", "cara"],
            },
          ],
        },
        {
          model: Cobro,
          attributes: [
            "id_cobro",
            "monto_a_cobrar",
            "cant_cuotas",
            "fecha_emision",
          ],
          include: [
            {
              model: Cuota,
              attributes: [
                "id_cuota",
                "monto_cobrado",
                "monto_cuota",
                "estado",
                "metodo_pago",
              ],
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      status: "success",
      data: turnos,
    });
  } catch (error) {
    console.error("Error al obtener los turnos del paciente:", error);
    return res.status(500).json({
      status: "error",
      message: "Error al obtener los turnos del paciente",
    });
  }
};

// Crear un nuevo turno (T-123)
export const createTurno = async (req, res) => {
  try {
    const {
      id_paciente,
      fecha_hora_inicio,
      fecha_hora_fin,
      precio_final,
      notas_consulta,
      practicas,
    } = req.body;

    // DEV: SUPONEMOS QUE ESTA CREADO EL ESTADO
    const id_estado = ESTADOS.PROGRAMADO;

    const haySolapamiento = await validarSolapaminetoHorarios(
      fecha_hora_inicio,
      fecha_hora_fin,
      null,
    );

    if (haySolapamiento) {
      return res.status(409).json({
        error:
          "El horario seleccionado se superpone con un turno ya programado.",
      });
    }

    const result = await sequelize.transaction(async (t) => {
      const nuevoTurno = await Turno.create(
        {
          id_paciente,
          id_estado: id_estado,
          fecha_hora_inicio,
          fecha_hora_fin,
          precio_final: precio_final || 0,
          notas_consulta: notas_consulta || null,
        },
        { transaction: t },
      );

      await HistorialEstadoTurno.create(
        {
          id_turno: nuevoTurno.id_turno,
          id_estado: id_estado,
          fecha_hora_cambio: new Date(),
          descripcion: "Turno programado",
        },
        { transaction: t },
      );

      // Guardar las prácticas tentativas/programadas (si fueron seleccionadas)
      if (practicas && Array.isArray(practicas) && practicas.length > 0) {
        const idsUnicos = [
          ...new Set(
            practicas.map((p) =>
              typeof p === "object" ? Number(p.id_practica) : Number(p),
            ),
          ),
        ].filter(Boolean);

        if (idsUnicos.length > 0) {
          const practicasEncontradas = await Practica.findAll({
            where: { id_practica: { [Op.in]: idsUnicos } },
            transaction: t,
          });

          if (practicasEncontradas.length !== idsUnicos.length) {
            const err = new Error(
              "Una o más prácticas especificadas no existen",
            );
            err.statusCode = 400;
            throw err;
          }

          const registrosPracticas = idsUnicos.map((id_practica) => ({
            id_turno: nuevoTurno.id_turno,
            id_practica,
            id_obra_social: null,
          }));

          await PracticaTurno.bulkCreate(registrosPracticas, {
            transaction: t,
          });
        }
      }

      return nuevoTurno;
    });

    res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("Error al crear el turno:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al crear el turno." });
  }
};

export const updateTurno = async (req, res) => {
  try {
    const turno = req.turno;

    const { id_paciente, precio_final, notas_consulta, practicas } = req.body;

    if (id_paciente) {
      const paciente = await Paciente.findByPk(id_paciente);
      if (!paciente) {
        return res.status(400).json({
          status: "error",
          message: "El paciente seleccionado no existen.",
        });
      }
    }

    await sequelize.transaction(async (t) => {
      await turno.update(
        {
          id_paciente: turno.id_paciente, // El paciente no se modifica una vez programado el turno
          precio_final: precio_final ?? turno.precio_final,
          notas_consulta: notas_consulta || null,
        },
        { transaction: t },
      );

      // Si el turno aún está programado y se pasan prácticas, sincronizarlas
      if (turno.id_estado === ESTADOS.PROGRAMADO && Array.isArray(practicas)) {
        await PracticaTurno.destroy({
          where: { id_turno: turno.id_turno },
          transaction: t,
        });

        const idsUnicos = [
          ...new Set(
            practicas.map((p) =>
              typeof p === "object" ? Number(p.id_practica) : Number(p),
            ),
          ),
        ].filter(Boolean);

        if (idsUnicos.length > 0) {
          const practicasEncontradas = await Practica.findAll({
            where: { id_practica: { [Op.in]: idsUnicos } },
            transaction: t,
          });

          if (practicasEncontradas.length === idsUnicos.length) {
            const registros = idsUnicos.map((id_practica) => ({
              id_turno: turno.id_turno,
              id_practica,
              id_obra_social: null,
            }));
            await PracticaTurno.bulkCreate(registros, { transaction: t });
          }
        }
      }
    });

    res.status(200).json({
      status: "success",
      data: turno,
    });
  } catch (error) {
    console.error("Error al modificar el turno:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al modificar el turno." });
  }
};

// Finalizar atención del turno y registrar prácticas con dientes (T-1314)
export const turnoAtendido = async (req, res) => {
  try {
    const {
      notas_consulta,
      practicas_realizadas,
      obras_sociales,
      dientes_por_practica,
      practicas,
      precio_final,
    } = req.body;

    const turno = req.turno;

    const estado = await validarEstados(
      turno.id_estado,
      ESTADOS.PROGRAMADO,
      ESTADOS.ATENDIDO,
    );

    if (!estado) {
      return res.status(400).json({
        error:
          "El turno debe estar programado para poder marcarlo como atendido.",
      });
    }

    const result = await sequelize.transaction(async (t) => {
      await turno.update(
        {
          id_estado: estado,
          notas_consulta: notas_consulta || null,
          precio_final: precio_final || turno.precio_final,
        },
        { transaction: t },
      );

      // Guardar historial
      await HistorialEstadoTurno.create(
        {
          id_turno: turno.id_turno,
          id_estado: estado,
          fecha_hora_cambio: new Date(),
          descripcion: "Turno atendido",
        },
        { transaction: t },
      );

      // Normalizar estructura de prácticas
      let listaPracticasAInsertar = [];

      if (practicas && Array.isArray(practicas) && practicas.length > 0) {
        listaPracticasAInsertar = practicas
          .filter((p) => p && (p.id_practica || typeof p === "number"))
          .map((p) => {
            if (typeof p === "number") {
              return { id_practica: p, id_obra_social: null, dientes: [] };
            }
            return {
              id_practica: Number(p.id_practica),
              id_obra_social: p.id_obra_social
                ? Number(p.id_obra_social)
                : null,
              dientes: Array.isArray(p.dientes) ? p.dientes : [],
            };
          });
      } else if (
        practicas_realizadas &&
        Array.isArray(practicas_realizadas) &&
        practicas_realizadas.length > 0
      ) {
        listaPracticasAInsertar = practicas_realizadas.map(
          (id_practica, idx) => ({
            id_practica: Number(id_practica),
            id_obra_social: obras_sociales?.[idx]
              ? Number(obras_sociales[idx])
              : null,
            dientes: Array.isArray(dientes_por_practica?.[idx])
              ? dientes_por_practica[idx]
              : [],
          }),
        );
      }

      // Eliminar prácticas previas del turno (por ejemplo, si se habían cargado al programar)
      await PracticaTurno.destroy({
        where: { id_turno: turno.id_turno },
        transaction: t,
      });

      if (listaPracticasAInsertar.length > 0) {
        const idsUnicos = [
          ...new Set(listaPracticasAInsertar.map((p) => p.id_practica)),
        ];
        const practicasEncontradas = await Practica.findAll({
          where: {
            id_practica: { [Op.in]: idsUnicos },
          },
          transaction: t,
        });

        if (practicasEncontradas.length !== idsUnicos.length) {
          const err = new Error("Una o más prácticas especificadas no existen");
          err.statusCode = 400;
          throw err;
        }

        for (const item of listaPracticasAInsertar) {
          const nuevaPt = await PracticaTurno.create(
            {
              id_turno: turno.id_turno,
              id_practica: item.id_practica,
              id_obra_social: item.id_obra_social || null,
            },
            { transaction: t },
          );

          if (item.dientes && item.dientes.length > 0) {
            const dientesRecords = item.dientes
              .map((d) => ({
                id_practica_turno: nuevaPt.id_practica_turno,
                numero_fdi:
                  typeof d === "object" ? Number(d.numero_fdi) : Number(d),
                cara: typeof d === "object" ? d.cara || null : null,
              }))
              .filter((d) => !isNaN(d.numero_fdi) && d.numero_fdi > 0);

            if (dientesRecords.length > 0) {
              await PracticaTurnoDiente.bulkCreate(dientesRecords, {
                transaction: t,
              });
            }
          }
        }
      }

      return turno;
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("Error al finalizar la atención:", error);
    res.status(500).json({ error: "Error interno al registrar la atención" });
  }
};

// Cambiar estado del turno
export const turnoCancelado = async (req, res) => {
  try {
    const turno = req.turno;
    const { notas_consulta } = req.body;

    const estado = await validarEstados(
      turno.id_estado,
      [ESTADOS.PROGRAMADO, ESTADOS.INASISTENTE],
      ESTADOS.CANCELADO,
    );

    if (!estado) {
      return res.status(400).json({
        error:
          "El turno debe estar programado o inasistente para poder cancelarlo.",
      });
    }

    const result = await sequelize.transaction(async (t) => {
      await turno.update(
        {
          id_estado: estado,
          notas_consulta: notas_consulta,
        },
        { transaction: t },
      );

      // Guardar historial
      await HistorialEstadoTurno.create(
        {
          id_turno: turno.id_turno,
          id_estado: estado,
          fecha_hora_cambio: new Date(),
          descripcion: "Turno cancelado",
        },
        { transaction: t },
      );

      // Guardar las prácticas en la tabla intermedia

      return turno;
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ error: "Error interno al actualizar el estado" });
  }
};

export const turnoInasistido = async (req, res) => {
  try {
    const turno = req.turno;
    const { notas_consulta } = req.body;

    const estado = await validarEstados(
      turno.id_estado,
      ESTADOS.PROGRAMADO,
      ESTADOS.INASISTENTE,
    );

    if (!estado) {
      return res.status(400).json({
        error:
          "El turno debe estar programado para poder marcarlo como inasistente.",
      });
    }

    const result = await sequelize.transaction(async (t) => {
      await turno.update(
        {
          id_estado: estado,
          notas_consulta: notas_consulta,
        },
        { transaction: t },
      );

      // Guardar historial
      await HistorialEstadoTurno.create(
        {
          id_turno: turno.id_turno,
          id_estado: estado,
          fecha_hora_cambio: new Date(),
          descripcion: "Turno marcado como Inasistido",
        },
        { transaction: t },
      );

      // Guardar las prácticas en la tabla intermedia

      return turno;
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ error: "Error interno al actualizar el estado" });
  }
};

export const turnoReprogramado = async (req, res) => {
  try {
    const turno = req.turno;
    const { fecha_hora_inicio, fecha_hora_fin } = req.body;

    const estado = await validarEstados(
      turno.id_estado,
      [ESTADOS.PROGRAMADO, ESTADOS.INASISTENTE, ESTADOS.CANCELADO],
      ESTADOS.PROGRAMADO,
    );

    if (!estado) {
      return res.status(400).json({
        error:
          "El turno debe estar inasistente o cancelado para poder marcarlo como programado.",
      });
    }

    const haySolapamiento = await validarSolapaminetoHorarios(
      fecha_hora_inicio,
      fecha_hora_fin,
      turno.id_turno,
    );

    if (haySolapamiento) {
      return res.status(409).json({
        error:
          "El horario seleccionado se superpone con un turno ya programado.",
      });
    }

    const result = await sequelize.transaction(async (t) => {
      await turno.update(
        {
          fecha_hora_inicio: fecha_hora_inicio,
          fecha_hora_fin: fecha_hora_fin,
          id_estado: estado,
        },
        { transaction: t },
      );

      // Guardar historial
      await HistorialEstadoTurno.create(
        {
          id_turno: turno.id_turno,
          id_estado: estado,
          fecha_hora_cambio: new Date(),
          descripcion: "Turno reprogramado",
        },
        { transaction: t },
      );

      // Guardar las prácticas en la tabla intermedia

      return turno;
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ error: "Error interno al actualizar el estado" });
  }
};

// Eliminar un turno existente
export const deleteTurno = async (req, res) => {
  try {
    const turno = req.turno;
    await turno.update({ activo: !turno.activo });

    res.status(200).json({ message: "Turno eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el turno:", error);
    res.status(500).json({ error: "Error al eliminar el turno" });
  }
};
