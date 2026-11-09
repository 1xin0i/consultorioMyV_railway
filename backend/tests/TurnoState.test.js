/**
 * Pruebas unitarias del Patrón State (GoF) para la entidad Turno.
 * Verifica la lógica pura de dominio sin dependencias directas de base de datos.
 *
 * @format
 */

import {
  Turno,
  EstadoTurno,
  EstadoProgramado,
  EstadoCancelado,
  EstadoInasistente,
  EstadoAtendido,
  EstadoTurnoFactory,
  TransicionEstadoInvalidaError,
} from "../utils/TurnoState.js";

describe("Patrón State - Dominio Turno (GoF)", () => {
  describe("1. Estado Inicial de Turno", () => {
    test("Un turno nuevo siempre debe iniciar en estado PROGRAMADO por defecto", () => {
      const turno = new Turno({
        id_turno: 1,
        id_paciente: 10,
        fecha_hora_inicio: new Date("2026-11-10T10:00:00Z"),
        fecha_hora_fin: new Date("2026-11-10T10:30:00Z"),
        precio_final: 5000,
      });

      expect(turno.estado).toBeInstanceOf(EstadoProgramado);
      expect(turno.nombreEstado).toBe("Programado");
      expect(turno.esTerminal).toBe(false);
    });
  });

  describe("2. Transiciones Permitidas", () => {
    test("PROGRAMADO -> cancelar() -> CANCELADO", () => {
      const turno = new Turno({ estado: new EstadoProgramado() });

      const nuevoEstado = turno.cancelar();

      expect(nuevoEstado).toBeInstanceOf(EstadoCancelado);
      expect(turno.estado).toBeInstanceOf(EstadoCancelado);
      expect(turno.nombreEstado).toBe("Cancelado");
    });

    test("PROGRAMADO -> marcarInasistente() -> INASISTENTE", () => {
      const turno = new Turno({ estado: new EstadoProgramado() });

      const nuevoEstado = turno.marcarInasistente();

      expect(nuevoEstado).toBeInstanceOf(EstadoInasistente);
      expect(turno.estado).toBeInstanceOf(EstadoInasistente);
      expect(turno.nombreEstado).toBe("Inasistente");
    });

    test("PROGRAMADO -> atender() -> ATENDIDO", () => {
      const turno = new Turno({ estado: new EstadoProgramado() });

      const nuevoEstado = turno.atender();

      expect(nuevoEstado).toBeInstanceOf(EstadoAtendido);
      expect(turno.estado).toBeInstanceOf(EstadoAtendido);
      expect(turno.nombreEstado).toBe("Atendido");
    });

    test("CANCELADO -> reprogramar() -> PROGRAMADO", () => {
      const turno = new Turno({ estado: new EstadoCancelado() });

      const nuevoEstado = turno.reprogramar();

      expect(nuevoEstado).toBeInstanceOf(EstadoProgramado);
      expect(turno.estado).toBeInstanceOf(EstadoProgramado);
      expect(turno.nombreEstado).toBe("Programado");
    });

    test("INASISTENTE -> reprogramar() -> PROGRAMADO", () => {
      const turno = new Turno({ estado: new EstadoInasistente() });

      const nuevoEstado = turno.reprogramar();

      expect(nuevoEstado).toBeInstanceOf(EstadoProgramado);
      expect(turno.estado).toBeInstanceOf(EstadoProgramado);
      expect(turno.nombreEstado).toBe("Programado");
    });
  });

  describe("3. Transiciones Inválidas y Errores Controlados", () => {
    test("PROGRAMADO no permite reprogramar()", () => {
      const turno = new Turno({ estado: new EstadoProgramado() });

      expect(() => turno.reprogramar()).toThrow(TransicionEstadoInvalidaError);
      expect(() => turno.reprogramar()).toThrow(
        /No se puede reprogramar un turno que se encuentra en estado 'Programado'/
      );
    });

    test("CANCELADO no permite cancelar(), marcarInasistente() ni atender()", () => {
      const turno = new Turno({ estado: new EstadoCancelado() });

      expect(() => turno.cancelar()).toThrow(TransicionEstadoInvalidaError);
      expect(() => turno.marcarInasistente()).toThrow(TransicionEstadoInvalidaError);
      expect(() => turno.atender()).toThrow(TransicionEstadoInvalidaError);
    });

    test("INASISTENTE no permite cancelar(), marcarInasistente() ni atender()", () => {
      const turno = new Turno({ estado: new EstadoInasistente() });

      expect(() => turno.cancelar()).toThrow(TransicionEstadoInvalidaError);
      expect(() => turno.marcarInasistente()).toThrow(TransicionEstadoInvalidaError);
      expect(() => turno.atender()).toThrow(TransicionEstadoInvalidaError);
    });
  });

  describe("4. Estado Terminal ATENDIDO", () => {
    test("ATENDIDO es terminal y no permite ninguna transición posterior", () => {
      const turno = new Turno({ estado: new EstadoAtendido() });

      expect(turno.esTerminal).toBe(true);

      // Ninguna transición debe permitirse
      expect(() => turno.cancelar()).toThrow(TransicionEstadoInvalidaError);
      expect(() => turno.cancelar()).toThrow(
        /estado terminal/
      );

      expect(() => turno.marcarInasistente()).toThrow(TransicionEstadoInvalidaError);
      expect(() => turno.marcarInasistente()).toThrow(
        /estado terminal/
      );

      expect(() => turno.atender()).toThrow(TransicionEstadoInvalidaError);
      expect(() => turno.atender()).toThrow(
        /estado terminal/
      );

      expect(() => turno.reprogramar()).toThrow(TransicionEstadoInvalidaError);
      expect(() => turno.reprogramar()).toThrow(
        /estado terminal/
      );
    });
  });

  describe("5. EstadoTurnoFactory", () => {
    test("Crea instancias de Estado a partir de string", () => {
      expect(EstadoTurnoFactory.crearEstado("Programado")).toBeInstanceOf(EstadoProgramado);
      expect(EstadoTurnoFactory.crearEstado("CANCELADO")).toBeInstanceOf(EstadoCancelado);
      expect(EstadoTurnoFactory.crearEstado("inasistente")).toBeInstanceOf(EstadoInasistente);
      expect(EstadoTurnoFactory.crearEstado("Atendido")).toBeInstanceOf(EstadoAtendido);
    });

    test("Crea instancias de Estado a partir de ID numérico", () => {
      expect(EstadoTurnoFactory.crearEstado(1)).toBeInstanceOf(EstadoProgramado);
      expect(EstadoTurnoFactory.crearEstado(2)).toBeInstanceOf(EstadoCancelado);
      expect(EstadoTurnoFactory.crearEstado(3)).toBeInstanceOf(EstadoAtendido);
      expect(EstadoTurnoFactory.crearEstado(4)).toBeInstanceOf(EstadoInasistente);
    });

    test("Crea instancias de Estado a partir de objeto Sequelize o similar", () => {
      const mockModel = { estado: "Atendido" };
      expect(EstadoTurnoFactory.crearEstado(mockModel)).toBeInstanceOf(EstadoAtendido);
    });

    test("Lanza TransicionEstadoInvalidaError ante estado no reconocido", () => {
      expect(() => EstadoTurnoFactory.crearEstado("DESCONOCIDO")).toThrow(
        TransicionEstadoInvalidaError
      );
      expect(() => EstadoTurnoFactory.crearEstado(999)).toThrow(
        TransicionEstadoInvalidaError
      );
    });
  });
});
