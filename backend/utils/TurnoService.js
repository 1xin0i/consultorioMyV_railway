/** @format */

import sequelize from "../config/database.js";
import { Op } from "sequelize";
import {
  Turno as TurnoModel,
  EstadoTurno as EstadoTurnoModel,
  HistorialEstadoTurno as HistorialModel,
  Practica as PracticaModel,
  PracticaTurno as PracticaTurnoModel,
  Paciente as PacienteModel,
} from "../models/index.model.js";
import {
  Turno as TurnoDomain,
  EstadoTurnoFactory,
  TransicionEstadoInvalidaError,
} from "./TurnoState.js";
import { validarSolapaminetoHorarios } from "../validations/Turno.validation.js";

/**
 * Servicio para coordinar el ciclo de vida, persistencia y transacciones del Turno.
 *
 * Mantiene desacoplado al controlador de las reglas de transición y estados concretos,
 * delegando las operaciones a la entidad de dominio Turno y sus objetos de Estado.
 */
export class TurnoService {
  /**
   * Resuelve el id_estado de la base de datos a partir del nombre del estado.
   *
   * @param {string} nombreEstado
   * @param {import('sequelize').Transaction} [transaction]
   * @returns {Promise<number>}
   */
  static async resolverIdEstado(nombreEstado, transaction = null) {
    const estadoDb = await EstadoTurnoModel.findOne({
      where: { estado: nombreEstado },
      transaction,
    });

    if (estadoDb) {
      return estadoDb.id_estado;
    }

    const [nuevoEstado] = await EstadoTurnoModel.findOrCreate({
      where: { estado: nombreEstado },
      defaults: { estado: nombreEstado },
      transaction,
    });

    return nuevoEstado.id_estado;
  }

  /**
   * Reconstruye la entidad de dominio Turno a partir de un registro de Sequelize.
   * @param {TurnoModel} turnoDb
   * @returns {TurnoDomain}
   */
  static toDomain(turnoDb) {
    const valorEstado = turnoDb.EstadoTurno?.estado || turnoDb.id_estado;
    const estadoDomain = EstadoTurnoFactory.crearEstado(valorEstado);

    return new TurnoDomain({
      id_turno: turnoDb.id_turno,
      id_paciente: turnoDb.id_paciente,
      estado: estadoDomain,
      fecha_hora_inicio: turnoDb.fecha_hora_inicio,
      fecha_hora_fin: turnoDb.fecha_hora_fin,
      precio_final: turnoDb.precio_final,
      notas_consulta: turnoDb.notas_consulta,
      activo: turnoDb.activo,
    });
  }

  /**
   * Crea un nuevo turno con su estado inicial PROGRAMADO y genera el primer registro en el historial.
   * Se ejecuta de forma atómica dentro de una transacción Sequelize.
   */
  static async crearTurno(datosTurno) {
    let { id_paciente, fecha_hora_inicio, fecha_hora_fin, duracion_minutos, precio_final, notas_consulta } = datosTurno;

    if (!fecha_hora_fin && duracion_minutos && fecha_hora_inicio) {
      fecha_hora_fin = new Date(new Date(fecha_hora_inicio).getTime() + duracion_minutos * 60000);
    }

    // 1. Instanciar la entidad de dominio con su estado inicial por defecto (Programado)
    const turnoDomain = new TurnoDomain({
      id_paciente,
      fecha_hora_inicio,
      fecha_hora_fin,
      precio_final,
      notas_consulta,
    });

    // 2. Validar que no exista superposición de horarios
    const haySolapamiento = await validarSolapaminetoHorarios(fecha_hora_inicio, fecha_hora_fin, null);
    if (haySolapamiento) {
      const err = new Error("El horario seleccionado se superpone con un turno ya programado.");
      err.statusCode = 409;
      err.codigo = "HORARIO_SOLAPADO";
      throw err;
    }

    // 3. Ejecutar creación e historial dentro de una transacción
    return await sequelize.transaction(async (t) => {
      const idEstadoDb = await TurnoService.resolverIdEstado(turnoDomain.nombreEstado, t);

      const nuevoTurno = await TurnoModel.create(
        {
          id_paciente: turnoDomain.id_paciente,
          id_estado: idEstadoDb,
          fecha_hora_inicio: turnoDomain.fecha_hora_inicio,
          fecha_hora_fin: turnoDomain.fecha_hora_fin,
          precio_final: turnoDomain.precio_final,
          notas_consulta: turnoDomain.notas_consulta || null,
        },
        { transaction: t }
      );

      // Registrar estado inicial en historial
      await HistorialModel.create(
        {
          id_turno: nuevoTurno.id_turno,
          id_estado: idEstadoDb,
          fecha_hora_cambio: new Date(),
          descripcion: "Turno programado",
        },
        { transaction: t }
      );

      return nuevoTurno;
    });
  }

  /**
   * Transición a CANCELADO.
   * Utiliza SELECT FOR UPDATE para evitar condiciones de carrera concurrentes.
   */
  static async cancelarTurno(idTurno, { notas_consulta = null } = {}) {
    return await sequelize.transaction(async (t) => {
      const turnoDb = await TurnoModel.findByPk(idTurno, {
        include: [{ model: EstadoTurnoModel, attributes: ["id_estado", "estado"] }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!turnoDb) {
        const err = new Error("Turno no encontrado");
        err.statusCode = 404;
        throw err;
      }

      const turnoDomain = TurnoService.toDomain(turnoDb);
      const nuevoEstado = turnoDomain.cancelar();

      const idNuevoEstado = await TurnoService.resolverIdEstado(nuevoEstado.nombre, t);

      await turnoDb.update(
        {
          id_estado: idNuevoEstado,
          notas_consulta: notas_consulta !== undefined && notas_consulta !== null ? notas_consulta : turnoDb.notas_consulta,
        },
        { transaction: t }
      );

      await HistorialModel.create(
        {
          id_turno: turnoDb.id_turno,
          id_estado: idNuevoEstado,
          fecha_hora_cambio: new Date(),
          descripcion: "Turno cancelado",
        },
        { transaction: t }
      );

      return turnoDb;
    });
  }

  /**
   * Transición a INASISTENTE.
   * Utiliza SELECT FOR UPDATE para evitar condiciones de carrera concurrentes.
   */
  static async marcarInasistente(idTurno, { notas_consulta = null } = {}) {
    return await sequelize.transaction(async (t) => {
      const turnoDb = await TurnoModel.findByPk(idTurno, {
        include: [{ model: EstadoTurnoModel, attributes: ["id_estado", "estado"] }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!turnoDb) {
        const err = new Error("Turno no encontrado");
        err.statusCode = 404;
        throw err;
      }

      const turnoDomain = TurnoService.toDomain(turnoDb);
      const nuevoEstado = turnoDomain.marcarInasistente();

      const idNuevoEstado = await TurnoService.resolverIdEstado(nuevoEstado.nombre, t);

      await turnoDb.update(
        {
          id_estado: idNuevoEstado,
          notas_consulta: notas_consulta !== undefined && notas_consulta !== null ? notas_consulta : turnoDb.notas_consulta,
        },
        { transaction: t }
      );

      await HistorialModel.create(
        {
          id_turno: turnoDb.id_turno,
          id_estado: idNuevoEstado,
          fecha_hora_cambio: new Date(),
          descripcion: "Turno marcado como Inasistido",
        },
        { transaction: t }
      );

      return turnoDb;
    });
  }

  /**
   * Transición a ATENDIDO (estado terminal) y registro de prácticas realizadas.
   * Utiliza SELECT FOR UPDATE para evitar condiciones de carrera concurrentes.
   */
  static async atenderTurno(idTurno, datosAtencion = {}) {
    const { notas_consulta, practicas_realizadas, obras_sociales, precio_final } = datosAtencion;

    return await sequelize.transaction(async (t) => {
      const turnoDb = await TurnoModel.findByPk(idTurno, {
        include: [{ model: EstadoTurnoModel, attributes: ["id_estado", "estado"] }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!turnoDb) {
        const err = new Error("Turno no encontrado");
        err.statusCode = 404;
        throw err;
      }

      const turnoDomain = TurnoService.toDomain(turnoDb);
      const nuevoEstado = turnoDomain.atender();

      const idNuevoEstado = await TurnoService.resolverIdEstado(nuevoEstado.nombre, t);

      await turnoDb.update(
        {
          id_estado: idNuevoEstado,
          notas_consulta: notas_consulta || turnoDb.notas_consulta,
          precio_final: precio_final !== undefined && precio_final !== null ? precio_final : turnoDb.precio_final,
        },
        { transaction: t }
      );

      await HistorialModel.create(
        {
          id_turno: turnoDb.id_turno,
          id_estado: idNuevoEstado,
          fecha_hora_cambio: new Date(),
          descripcion: "Turno atendido",
        },
        { transaction: t }
      );

      if (practicas_realizadas && Array.isArray(practicas_realizadas) && practicas_realizadas.length > 0) {
        const idsUnicos = [...new Set(practicas_realizadas)];

        const practicasEncontradas = await PracticaModel.findAll({
          where: { id_practica: { [Op.in]: idsUnicos } },
          transaction: t,
        });

        if (practicasEncontradas.length !== idsUnicos.length) {
          const err = new Error("Una o más prácticas especificadas no existen");
          err.statusCode = 400;
          throw err;
        }

        const registrosPracticas = idsUnicos.map((id_practica) => ({
          id_turno: turnoDb.id_turno,
          id_practica,
          id_obra_social: obras_sociales?.[practicas_realizadas.indexOf(id_practica)] ?? null,
        }));

        await PracticaTurnoModel.bulkCreate(registrosPracticas, { transaction: t });
      }

      return turnoDb;
    });
  }

  /**
   * Transición a PROGRAMADO (reprogramación desde Cancelado o Inasistente).
   * Utiliza SELECT FOR UPDATE para evitar condiciones de carrera concurrentes.
   */
  static async reprogramarTurno(idTurno, { fecha_hora_inicio, fecha_hora_fin, duracion_minutos }) {
    if (!fecha_hora_fin && duracion_minutos && fecha_hora_inicio) {
      fecha_hora_fin = new Date(new Date(fecha_hora_inicio).getTime() + duracion_minutos * 60000);
    }

    if (!fecha_hora_inicio || !fecha_hora_fin) {
      const err = new Error("Las fechas de inicio y fin son obligatorias para reprogramar.");
      err.statusCode = 400;
      throw err;
    }

    const haySolapamiento = await validarSolapaminetoHorarios(fecha_hora_inicio, fecha_hora_fin, idTurno);
    if (haySolapamiento) {
      const err = new Error("El horario seleccionado se superpone con un turno ya programado.");
      err.statusCode = 409;
      err.codigo = "HORARIO_SOLAPADO";
      throw err;
    }

    return await sequelize.transaction(async (t) => {
      const turnoDb = await TurnoModel.findByPk(idTurno, {
        include: [{ model: EstadoTurnoModel, attributes: ["id_estado", "estado"] }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!turnoDb) {
        const err = new Error("Turno no encontrado");
        err.statusCode = 404;
        throw err;
      }

      const turnoDomain = TurnoService.toDomain(turnoDb);
      const nuevoEstado = turnoDomain.reprogramar();

      const idNuevoEstado = await TurnoService.resolverIdEstado(nuevoEstado.nombre, t);

      await turnoDb.update(
        {
          id_estado: idNuevoEstado,
          fecha_hora_inicio,
          fecha_hora_fin,
        },
        { transaction: t }
      );

      await HistorialModel.create(
        {
          id_turno: turnoDb.id_turno,
          id_estado: idNuevoEstado,
          fecha_hora_cambio: new Date(),
          descripcion: "Turno reprogramado",
        },
        { transaction: t }
      );

      return turnoDb;
    });
  }
}

export { TransicionEstadoInvalidaError, TurnoDomain as Turno, EstadoTurnoFactory };
export default TurnoService;
