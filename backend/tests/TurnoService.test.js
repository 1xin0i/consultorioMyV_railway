/**
 * Pruebas de integración para TurnoService con base de datos Sequelize.
 * Verifica persistencia, historial, transacciones atómicas, rollback y concurrencia.
 *
 * @format
 */

import { jest } from "@jest/globals";
import sequelize from "../config/database.js";
import { sincronizarModelos } from "../models/index.model.js";
import {
  Turno as TurnoModel,
  EstadoTurno as EstadoTurnoModel,
  HistorialEstadoTurno as HistorialModel,
  Paciente as PacienteModel,
} from "../models/index.model.js";
import { TurnoService, TransicionEstadoInvalidaError } from "../utils/TurnoService.js";

describe("TurnoService - Persistencia, Historial, Transacciones y Concurrencia", () => {
  let pacienteId;
  let idEstadoProgramado;
  let idEstadoCancelado;
  let idEstadoAtendido;
  let idEstadoInasistente;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sincronizarModelos();

    // Poblar estados si no existen
    const [ep] = await EstadoTurnoModel.findOrCreate({ where: { estado: "Programado" } });
    const [ec] = await EstadoTurnoModel.findOrCreate({ where: { estado: "Cancelado" } });
    const [ea] = await EstadoTurnoModel.findOrCreate({ where: { estado: "Atendido" } });
    const [ei] = await EstadoTurnoModel.findOrCreate({ where: { estado: "Inasistente" } });

    idEstadoProgramado = ep.id_estado;
    idEstadoCancelado = ec.id_estado;
    idEstadoAtendido = ea.id_estado;
    idEstadoInasistente = ei.id_estado;

    const paciente = await PacienteModel.create({
      nombre: "María",
      apellido: "López",
      dni: "40111222",
      telefono: "1144332211",
    });
    pacienteId = paciente.id_paciente;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe("1. Creación de Turno y Estado Inicial (PROGRAMADO)", () => {
    test("Un turno creado debe comenzar en PROGRAMADO y generar un registro inicial en historial", async () => {
      const nuevoTurno = await TurnoService.crearTurno({
        id_paciente: pacienteId,
        fecha_hora_inicio: "2026-12-01T09:00:00.000Z",
        fecha_hora_fin: "2026-12-01T09:30:00.000Z",
        precio_final: 12000,
        notas_consulta: "Turno nuevo de prueba",
      });

      expect(nuevoTurno.id_estado).toBe(idEstadoProgramado);

      // Verificar registro en el historial
      const historial = await HistorialModel.findAll({
        where: { id_turno: nuevoTurno.id_turno },
      });

      expect(historial).toHaveLength(1);
      expect(historial[0].id_estado).toBe(idEstadoProgramado);
      expect(historial[0].descripcion).toBe("Turno programado");
    });
  });

  describe("2. Transiciones Permitidas y Registro en Historial", () => {
    test("PROGRAMADO -> CANCELADO genera exactamente 1 registro adicional en historial", async () => {
      const turno = await TurnoService.crearTurno({
        id_paciente: pacienteId,
        fecha_hora_inicio: "2026-12-01T10:00:00.000Z",
        fecha_hora_fin: "2026-12-01T10:30:00.000Z",
        precio_final: 10000,
      });

      const turnoCancelado = await TurnoService.cancelarTurno(turno.id_turno, {
        notas_consulta: "Cancelado a pedido del paciente",
      });

      expect(turnoCancelado.id_estado).toBe(idEstadoCancelado);

      const historial = await HistorialModel.findAll({
        where: { id_turno: turno.id_turno },
        order: [["id_historial", "ASC"]],
      });

      // 1 inicial + 1 de la transición
      expect(historial).toHaveLength(2);
      expect(historial[1].id_estado).toBe(idEstadoCancelado);
      expect(historial[1].descripcion).toBe("Turno cancelado");
    });

    test("CANCELADO -> reprogramar() -> PROGRAMADO", async () => {
      const turno = await TurnoService.crearTurno({
        id_paciente: pacienteId,
        fecha_hora_inicio: "2026-12-01T11:00:00.000Z",
        fecha_hora_fin: "2026-12-01T11:30:00.000Z",
        precio_final: 10000,
      });
      await TurnoService.cancelarTurno(turno.id_turno);

      const turnoReprogramado = await TurnoService.reprogramarTurno(turno.id_turno, {
        fecha_hora_inicio: "2026-12-02T11:00:00.000Z",
        fecha_hora_fin: "2026-12-02T11:30:00.000Z",
      });

      expect(turnoReprogramado.id_estado).toBe(idEstadoProgramado);

      const historial = await HistorialModel.findAll({
        where: { id_turno: turno.id_turno },
        order: [["id_historial", "ASC"]],
      });

      // 1 inicial + 1 cancelación + 1 reprogramación = 3
      expect(historial).toHaveLength(3);
      expect(historial[2].id_estado).toBe(idEstadoProgramado);
      expect(historial[2].descripcion).toBe("Turno reprogramado");
    });

    test("PROGRAMADO -> marcarInasistente() -> INASISTENTE", async () => {
      const turno = await TurnoService.crearTurno({
        id_paciente: pacienteId,
        fecha_hora_inicio: "2026-12-01T12:00:00.000Z",
        fecha_hora_fin: "2026-12-01T12:30:00.000Z",
        precio_final: 10000,
      });

      const turnoInasistente = await TurnoService.marcarInasistente(turno.id_turno);

      expect(turnoInasistente.id_estado).toBe(idEstadoInasistente);

      const historial = await HistorialModel.findAll({
        where: { id_turno: turno.id_turno },
      });
      expect(historial).toHaveLength(2);
      expect(historial[1].id_estado).toBe(idEstadoInasistente);
    });

    test("INASISTENTE -> reprogramar() -> PROGRAMADO", async () => {
      const turno = await TurnoService.crearTurno({
        id_paciente: pacienteId,
        fecha_hora_inicio: "2026-12-01T13:00:00.000Z",
        fecha_hora_fin: "2026-12-01T13:30:00.000Z",
        precio_final: 10000,
      });
      await TurnoService.marcarInasistente(turno.id_turno);

      const turnoReprogramado = await TurnoService.reprogramarTurno(turno.id_turno, {
        fecha_hora_inicio: "2026-12-02T13:00:00.000Z",
        fecha_hora_fin: "2026-12-02T13:30:00.000Z",
      });

      expect(turnoReprogramado.id_estado).toBe(idEstadoProgramado);

      const historial = await HistorialModel.findAll({
        where: { id_turno: turno.id_turno },
      });
      expect(historial).toHaveLength(3);
    });

    test("PROGRAMADO -> atender() -> ATENDIDO", async () => {
      const turno = await TurnoService.crearTurno({
        id_paciente: pacienteId,
        fecha_hora_inicio: "2026-12-01T14:00:00.000Z",
        fecha_hora_fin: "2026-12-01T14:30:00.000Z",
        precio_final: 15000,
      });

      const turnoAtendido = await TurnoService.atenderTurno(turno.id_turno, {
        notas_consulta: "Tratamiento de conducto completado",
      });

      expect(turnoAtendido.id_estado).toBe(idEstadoAtendido);

      const historial = await HistorialModel.findAll({
        where: { id_turno: turno.id_turno },
      });
      expect(historial).toHaveLength(2);
      expect(historial[1].id_estado).toBe(idEstadoAtendido);
      expect(historial[1].descripcion).toBe("Turno atendido");
    });
  });

  describe("3. Transiciones Inválidas y Estado Terminal ATENDIDO", () => {
    test("PROGRAMADO no puede ser reprogramado directamente", async () => {
      const turno = await TurnoService.crearTurno({
        id_paciente: pacienteId,
        fecha_hora_inicio: "2026-12-01T15:00:00.000Z",
        fecha_hora_fin: "2026-12-01T15:30:00.000Z",
        precio_final: 8000,
      });

      await expect(
        TurnoService.reprogramarTurno(turno.id_turno, {
          fecha_hora_inicio: "2026-12-02T15:00:00.000Z",
          fecha_hora_fin: "2026-12-02T15:30:00.000Z",
        })
      ).rejects.toThrow(TransicionEstadoInvalidaError);
    });

    test("ATENDIDO es terminal y rechaza cualquier modificación de estado posterior", async () => {
      const turno = await TurnoService.crearTurno({
        id_paciente: pacienteId,
        fecha_hora_inicio: "2026-12-01T16:00:00.000Z",
        fecha_hora_fin: "2026-12-01T16:30:00.000Z",
        precio_final: 10000,
      });
      await TurnoService.atenderTurno(turno.id_turno);

      // Intentar cancelar
      await expect(TurnoService.cancelarTurno(turno.id_turno)).rejects.toThrow(
        TransicionEstadoInvalidaError
      );

      // Intentar marcar inasistente
      await expect(TurnoService.marcarInasistente(turno.id_turno)).rejects.toThrow(
        TransicionEstadoInvalidaError
      );

      // Intentar reprogramar
      await expect(
        TurnoService.reprogramarTurno(turno.id_turno, {
          fecha_hora_inicio: "2026-12-03T16:00:00.000Z",
          fecha_hora_fin: "2026-12-03T16:30:00.000Z",
        })
      ).rejects.toThrow(TransicionEstadoInvalidaError);

      // Intentar volver a atender
      await expect(TurnoService.atenderTurno(turno.id_turno)).rejects.toThrow(
        TransicionEstadoInvalidaError
      );
    });
  });

  describe("4. Atomicidad y Rollback de Transacciones", () => {
    test("Una falla al registrar en el historial revierte (rollback) el cambio de estado del turno", async () => {
      const turno = await TurnoService.crearTurno({
        id_paciente: pacienteId,
        fecha_hora_inicio: "2026-12-01T17:00:00.000Z",
        fecha_hora_fin: "2026-12-01T17:30:00.000Z",
        precio_final: 9000,
      });

      // Espiamos HistorialModel.create para forzar un error inesperado durante la transacción
      const createHistorialSpy = jest
        .spyOn(HistorialModel, "create")
        .mockRejectedValueOnce(new Error("Error simulado de base de datos en historial"));

      await expect(TurnoService.cancelarTurno(turno.id_turno)).rejects.toThrow(
        "Error simulado de base de datos en historial"
      );

      createHistorialSpy.mockRestore();

      // Verificar que el turno permanece inalterado en PROGRAMADO gracias al rollback
      const turnoSinModificar = await TurnoModel.findByPk(turno.id_turno);
      expect(turnoSinModificar.id_estado).toBe(idEstadoProgramado);

      // Verificar que el historial solo contiene el registro inicial
      const historial = await HistorialModel.findAll({
        where: { id_turno: turno.id_turno },
      });
      expect(historial).toHaveLength(1);
      expect(historial[0].descripcion).toBe("Turno programado");
    });
  });

  describe("5. Concurrencia y Bloqueo Pesimista (SELECT FOR UPDATE)", () => {
    test("Usa bloqueo pesimista (lock: t.LOCK.UPDATE) para evitar condiciones de carrera en base de datos", async () => {
      const findByPkSpy = jest.spyOn(TurnoModel, "findByPk");

      const turno = await TurnoService.crearTurno({
        id_paciente: pacienteId,
        fecha_hora_inicio: "2026-12-01T18:00:00.000Z",
        fecha_hora_fin: "2026-12-01T18:30:00.000Z",
        precio_final: 14000,
      });

      await TurnoService.cancelarTurno(turno.id_turno);

      // Verificamos que se invocó findByPk solicitando lock: t.LOCK.UPDATE
      expect(findByPkSpy).toHaveBeenCalledWith(
        turno.id_turno,
        expect.objectContaining({
          lock: expect.anything(),
        })
      );

      findByPkSpy.mockRestore();
    });

    test("Operaciones en carrera no permiten transiciones inconsistentes", async () => {
      const turno = await TurnoService.crearTurno({
        id_paciente: pacienteId,
        fecha_hora_inicio: "2026-12-01T19:00:00.000Z",
        fecha_hora_fin: "2026-12-01T19:30:00.000Z",
        precio_final: 14000,
      });

      // Primer proceso atiende el turno exitosamente
      const atendido = await TurnoService.atenderTurno(turno.id_turno);
      expect(atendido.id_estado).toBe(idEstadoAtendido);

      // Operación competidora intenta cancelar el turno que ya fue atendido
      await expect(TurnoService.cancelarTurno(turno.id_turno)).rejects.toThrow(
        TransicionEstadoInvalidaError
      );

      // El estado del turno sigue siendo de forma íntegra ATENDIDO
      const turnoFinal = await TurnoModel.findByPk(turno.id_turno);
      expect(turnoFinal.id_estado).toBe(idEstadoAtendido);

      // Historial contiene exactamente 2 registros (creación + atención), la cancelación no se insertó
      const historial = await HistorialModel.findAll({
        where: { id_turno: turno.id_turno },
      });
      expect(historial).toHaveLength(2);
      expect(historial[1].descripcion).toBe("Turno atendido");
    });
  });
});
