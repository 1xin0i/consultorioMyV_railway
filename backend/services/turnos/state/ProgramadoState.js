/** @format */

import { TurnoState } from "./TurnoState.js";
import { ESTADOS } from "../../../constants/EstadosTurno.js";

/** Programado: puede atenderse, cancelarse, marcarse inasistente o reprogramarse. */
export class ProgramadoState extends TurnoState {
  atender() {
    return ESTADOS.ATENDIDO;
  }

  cancelar() {
    return ESTADOS.CANCELADO;
  }

  inasistir() {
    return ESTADOS.INASISTENTE;
  }

  reprogramar() {
    return ESTADOS.PROGRAMADO;
  }
}

