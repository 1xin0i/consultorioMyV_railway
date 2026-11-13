/** @format */

import { TurnoState } from "./TurnoState.js";
import { ESTADOS } from "../../../constants/EstadosTurno.js";

/** Cancelado: solo puede reprogramarse. */
export class CanceladoState extends TurnoState {
  reprogramar() {
    return ESTADOS.PROGRAMADO;
  }
}

