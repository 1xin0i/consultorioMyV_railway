/**
 * Implementación del Patrón State (GoF) para el ciclo de vida de Turno.
 *
 * Contiene:
 * 1. TransicionEstadoInvalidaError (Excepción de dominio controlada)
 * 2. EstadoTurno (Clase base abstracta)
 * 3. Estados concretos: EstadoProgramado, EstadoCancelado, EstadoInasistente, EstadoAtendido
 * 4. EstadoTurnoFactory (Fábrica GoF para reconstrucción de estados)
 * 5. Turno (Entidad de dominio Context)
 *
 * Mantiene total independencia de Sequelize, Express y la base de datos.
 *
 * @format
 */

// ==========================================================
// 1. EXCEPCIÓN DE DOMINIO CONTROLADA
// ==========================================================
export class TransicionEstadoInvalidaError extends Error {
  /**
   * @param {string} mensaje
   * @param {string} [estadoActual]
   * @param {string} [operacion]
   */
  constructor(mensaje, estadoActual = null, operacion = null) {
    super(mensaje);
    this.name = "TransicionEstadoInvalidaError";
    this.codigo = "TRANSICION_ESTADO_INVALIDA";
    this.statusCode = 400;
    this.estadoActual = estadoActual;
    this.operacion = operacion;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TransicionEstadoInvalidaError);
    }
  }
}

// ==========================================================
// 2. ABSTRACCIÓN BASE DE ESTADO (EstadoTurno)
// ==========================================================
export class EstadoTurno {
  /**
   * Nombre legible del estado ('Programado', 'Cancelado', 'Atendido', 'Inasistente')
   * @returns {string}
   */
  get nombre() {
    throw new Error("El método get nombre() debe ser implementado por las subclases.");
  }

  /**
   * Código en mayúsculas del estado ('PROGRAMADO', 'CANCELADO', 'ATENDIDO', 'INASISTENTE')
   * @returns {string}
   */
  get codigo() {
    throw new Error("El método get codigo() debe ser implementado por las subclases.");
  }

  /**
   * Indica si el estado es terminal (no permite transiciones posteriores)
   * @returns {boolean}
   */
  get esTerminal() {
    return false;
  }

  /**
   * Transición: Cancelar turno
   * @param {Turno} turno
   */
  cancelar(turno) {
    throw new TransicionEstadoInvalidaError(
      `No se puede cancelar el turno porque se encuentra en estado '${this.nombre}'.`,
      this.nombre,
      "cancelar"
    );
  }

  /**
   * Transición: Marcar como inasistente
   * @param {Turno} turno
   */
  marcarInasistente(turno) {
    throw new TransicionEstadoInvalidaError(
      `No se puede marcar como inasistente el turno porque se encuentra en estado '${this.nombre}'.`,
      this.nombre,
      "marcarInasistente"
    );
  }

  /**
   * Transición: Atender turno
   * @param {Turno} turno
   */
  atender(turno) {
    throw new TransicionEstadoInvalidaError(
      `No se puede atender el turno porque se encuentra en estado '${this.nombre}'.`,
      this.nombre,
      "atender"
    );
  }

  /**
   * Transición: Reprogramar turno
   * @param {Turno} turno
   */
  reprogramar(turno) {
    throw new TransicionEstadoInvalidaError(
      `No se puede reprogramar el turno porque se encuentra en estado '${this.nombre}'. Solo se permite reprogramar turnos Cancelados o Inasistentes.`,
      this.nombre,
      "reprogramar"
    );
  }
}

// ==========================================================
// 3. ESTADOS CONCRETOS (GoF Concrete States)
// ==========================================================

/**
 * Estado Inicial: PROGRAMADO
 * Transiciones permitidas:
 * - cancelar() -> CANCELADO
 * - marcarInasistente() -> INASISTENTE
 * - atender() -> ATENDIDO
 */
export class EstadoProgramado extends EstadoTurno {
  get nombre() {
    return "Programado";
  }

  get codigo() {
    return "PROGRAMADO";
  }

  cancelar(turno) {
    const nuevoEstado = new EstadoCancelado();
    turno.cambiarEstado(nuevoEstado);
    return nuevoEstado;
  }

  marcarInasistente(turno) {
    const nuevoEstado = new EstadoInasistente();
    turno.cambiarEstado(nuevoEstado);
    return nuevoEstado;
  }

  atender(turno) {
    const nuevoEstado = new EstadoAtendido();
    turno.cambiarEstado(nuevoEstado);
    return nuevoEstado;
  }

  reprogramar(turno) {
    throw new TransicionEstadoInvalidaError(
      "No se puede reprogramar un turno que se encuentra en estado 'Programado'. La operación 'reprogramar' solo está disponible para turnos Cancelados o Inasistentes.",
      this.nombre,
      "reprogramar"
    );
  }
}

/**
 * Estado: CANCELADO
 * Transiciones permitidas:
 * - reprogramar() -> PROGRAMADO
 */
export class EstadoCancelado extends EstadoTurno {
  get nombre() {
    return "Cancelado";
  }

  get codigo() {
    return "CANCELADO";
  }

  reprogramar(turno) {
    const nuevoEstado = new EstadoProgramado();
    turno.cambiarEstado(nuevoEstado);
    return nuevoEstado;
  }
}

/**
 * Estado: INASISTENTE
 * Transiciones permitidas:
 * - reprogramar() -> PROGRAMADO
 */
export class EstadoInasistente extends EstadoTurno {
  get nombre() {
    return "Inasistente";
  }

  get codigo() {
    return "INASISTENTE";
  }

  reprogramar(turno) {
    const nuevoEstado = new EstadoProgramado();
    turno.cambiarEstado(nuevoEstado);
    return nuevoEstado;
  }
}

/**
 * Estado Terminal: ATENDIDO
 * No admite ninguna transición posterior.
 */
export class EstadoAtendido extends EstadoTurno {
  get nombre() {
    return "Atendido";
  }

  get codigo() {
    return "ATENDIDO";
  }

  get esTerminal() {
    return true;
  }

  cancelar(turno) {
    throw new TransicionEstadoInvalidaError(
      "Un turno en estado 'Atendido' es un estado terminal y no puede ser cancelado.",
      this.nombre,
      "cancelar"
    );
  }

  marcarInasistente(turno) {
    throw new TransicionEstadoInvalidaError(
      "Un turno en estado 'Atendido' es un estado terminal y no puede ser marcado como inasistente.",
      this.nombre,
      "marcarInasistente"
    );
  }

  atender(turno) {
    throw new TransicionEstadoInvalidaError(
      "El turno ya fue atendido previamente (estado terminal).",
      this.nombre,
      "atender"
    );
  }

  reprogramar(turno) {
    throw new TransicionEstadoInvalidaError(
      "Un turno en estado 'Atendido' es un estado terminal y no puede ser reprogramado.",
      this.nombre,
      "reprogramar"
    );
  }
}

// ==========================================================
// 4. FÁBRICA DE ESTADOS (GoF Factory)
// ==========================================================
export class EstadoTurnoFactory {
  /**
   * Resuelve o reconstruye una instancia de EstadoTurno a partir de un valor persistido.
   * @param {string|number|object} valor
   * @returns {EstadoTurno}
   */
  static crearEstado(valor) {
    if (valor === undefined || valor === null) {
      throw new TransicionEstadoInvalidaError(
        "No se especificó un valor de estado para construir el objeto de estado.",
        null,
        "crearEstado"
      );
    }

    if (valor instanceof EstadoTurno) {
      return valor;
    }

    if (typeof valor === "object") {
      if (valor.estado) {
        return EstadoTurnoFactory.crearEstado(valor.estado);
      }
      if (valor.id_estado !== undefined) {
        return EstadoTurnoFactory.crearEstado(valor.id_estado);
      }
    }

    const valorStr = String(valor).trim().toLowerCase();

    // Mapeo por nombre
    if (valorStr === "programado") return new EstadoProgramado();
    if (valorStr === "cancelado") return new EstadoCancelado();
    if (valorStr === "atendido") return new EstadoAtendido();
    if (valorStr === "inasistente") return new EstadoInasistente();

    // Mapeo por ID estándar (1: Programado, 2: Cancelado, 3: Atendido, 4: Inasistente)
    if (valorStr === "1") return new EstadoProgramado();
    if (valorStr === "2") return new EstadoCancelado();
    if (valorStr === "3") return new EstadoAtendido();
    if (valorStr === "4") return new EstadoInasistente();

    throw new TransicionEstadoInvalidaError(
      `Estado de turno desconocido o no soportado: '${valor}'.`,
      valor,
      "crearEstado"
    );
  }

  /**
   * Retorna el estado inicial de todo turno nuevo según las reglas de negocio (PROGRAMADO).
   * @returns {EstadoProgramado}
   */
  static crearEstadoInicial() {
    return new EstadoProgramado();
  }
}

// ==========================================================
// 5. ENTIDAD DE DOMINIO CONTEXT (Turno)
// ==========================================================
export class Turno {
  /**
   * @param {Object} props
   * @param {number} [props.id_turno]
   * @param {number} props.id_paciente
   * @param {EstadoTurno|string|number} [props.estado]
   * @param {Date|string} props.fecha_hora_inicio
   * @param {Date|string} props.fecha_hora_fin
   * @param {number} [props.precio_final=0]
   * @param {string} [props.notas_consulta]
   * @param {boolean} [props.activo=true]
   */
  constructor({
    id_turno = null,
    id_paciente,
    estado = null,
    fecha_hora_inicio,
    fecha_hora_fin,
    precio_final = 0,
    notas_consulta = null,
    activo = true,
  }) {
    this.id_turno = id_turno;
    this.id_paciente = id_paciente;
    this.fecha_hora_inicio = fecha_hora_inicio;
    this.fecha_hora_fin = fecha_hora_fin;
    this.precio_final = precio_final;
    this.notas_consulta = notas_consulta;
    this.activo = activo;

    // Regla 1: Todo turno nuevo sin estado explícito se inicializa en PROGRAMADO
    this.estado = estado
      ? EstadoTurnoFactory.crearEstado(estado)
      : EstadoTurnoFactory.crearEstadoInicial();
  }

  cambiarEstado(nuevoEstado) {
    if (!(nuevoEstado instanceof EstadoTurno)) {
      throw new Error("El nuevo estado debe ser una instancia de EstadoTurno.");
    }
    this.estado = nuevoEstado;
  }

  cancelar() {
    return this.estado.cancelar(this);
  }

  marcarInasistente() {
    return this.estado.marcarInasistente(this);
  }

  atender() {
    return this.estado.atender(this);
  }

  reprogramar() {
    return this.estado.reprogramar(this);
  }

  get estadoActual() {
    return this.estado;
  }

  get nombreEstado() {
    return this.estado.nombre;
  }

  get codigoEstado() {
    return this.estado.codigo;
  }

  get esTerminal() {
    return this.estado.esTerminal;
  }
}

export default Turno;
