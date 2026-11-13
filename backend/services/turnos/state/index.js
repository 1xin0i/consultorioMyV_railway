/** @format */

import { ESTADOS } from "../../../constants/EstadosTurno.js";
import { TurnoState } from "./TurnoState.js";
import { ProgramadoState } from "./ProgramadoState.js";
import { InasistenteState } from "./InasistenteState.js";
import { CanceladoState } from "./CanceladoState.js";
import { AtendidoState } from "./AtendidoState.js";

const ESTADOS_CONCRETOS = {
  [ESTADOS.PROGRAMADO]: new ProgramadoState(),
  [ESTADOS.ATENDIDO]: new AtendidoState(),
  [ESTADOS.CANCELADO]: new CanceladoState(),
  [ESTADOS.INASISTENTE]: new InasistenteState(),
};

// Un id desconocido no habilita ninguna transición (igual que antes: 400).
const ESTADO_DESCONOCIDO = new TurnoState();

/** Devuelve el State correspondiente al id_estado actual del turno. */
export const getState = (id_estado) =>
  ESTADOS_CONCRETOS[id_estado] ?? ESTADO_DESCONOCIDO;

