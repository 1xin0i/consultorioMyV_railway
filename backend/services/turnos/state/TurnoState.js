/** @format */

import { AppError } from "../../../errors/AppError.js";

/**
 * Mensajes de transición inválida. Son EXACTAMENTE los que la API devolvía antes
 * del refactor (el cliente los muestra tal cual). Ver `// TODO compat` en reprogramar.
 */
export const MENSAJES_TRANSICION = Object.freeze({
  atender: "El turno debe estar programado para poder marcarlo como atendido.",
  cancelar: "El turno debe estar programado o inasistente para poder cancelarlo.",
  inasistir:
    "El turno debe estar programado para poder marcarlo como inasistente.",
  // TODO compat: el texto no menciona "programado", aunque también se permite.
  reprogramar:
    "El turno debe estar inasistente o cancelado para poder marcarlo como programado.",
});

/**
 * Patrón State: cada estado del turno decide qué transiciones permite.
 * Cada método devuelve el id del estado destino o lanza AppError(400).
 * La clase base rechaza todo; los estados concretos habilitan lo suyo.
 */
export class TurnoState {
  atender() {
    return this.rechazar("atender");
  }

  cancelar() {
    return this.rechazar("cancelar");
  }

  inasistir() {
    return this.rechazar("inasistir");
  }

  reprogramar() {
    return this.rechazar("reprogramar");
  }

  rechazar(accion) {
    throw new AppError(400, { error: MENSAJES_TRANSICION[accion] });
  }
}

