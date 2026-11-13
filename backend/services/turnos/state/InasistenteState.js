/** @format */

import { TurnoState } from "./TurnoState.js";
import { ESTADOS } from "../../../constants/EstadosTurno.js";

/** Inasistente: puede cancelarse o reprogramarse. */
export class InasistenteState extends TurnoState {
  cancelar() {
    return ESTADOS.CANCELADO;
  }

  reprogramar() {
    return ESTADOS.PROGRAMADO;
  }
}

