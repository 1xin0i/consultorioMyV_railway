/** @format */

import sequelize from "../../config/database.js";
import * as historialRepo from "../../repositories/historialEstadoTurno.repository.js";
import { getState } from "./state/index.js";
import { asegurarAgendaDisponible } from "./agenda.service.js";
import {
  normalizarPracticasAtencion,
  reemplazarPracticasAtendidas,
} from "./practicasTurno.helper.js";

/**
 * Aplica una transición ya validada por el State: actualiza el turno y deja
 * el rastro en HistorialEstadoTurno dentro de una única transacción.
 */
const aplicarTransicion = ({ turno, destino, cambios, descripcion, extra }) =>
  sequelize.transaction(async (t) => {
    await turno.update({ ...cambios, id_estado: destino }, { transaction: t });
    await historialRepo.registrar(turno.id_turno, destino, descripcion, t);
    if (extra) await extra(t);
    return turno;
  });

/** Programado → Atendido (registra las prácticas realmente hechas). */
export const atender = (turno, body) => {
  const { notas_consulta, practicas_realizadas, obras_sociales, practicas, precio_final } = body;

  const destino = getState(turno.id_estado).atender();

  return aplicarTransicion({
    turno,
    destino,
    cambios: {
      notas_consulta: notas_consulta || null,
      precio_final: precio_final || turno.precio_final,
    },
    descripcion: "Turno atendido",
    extra: (t) =>
      reemplazarPracticasAtendidas(
        turno.id_turno,
        normalizarPracticasAtencion({ practicas, practicas_realizadas, obras_sociales }),
        t,
      ),
  });
};

/** Programado | Inasistente → Cancelado. */
export const cancelar = (turno, body) => {
  const destino = getState(turno.id_estado).cancelar();

  return aplicarTransicion({
    turno,
    destino,
    cambios: { notas_consulta: body.notas_consulta },
    descripcion: "Turno cancelado",
  });
};

/** Programado → Inasistente. */
export const marcarInasistente = (turno, body) => {
  const destino = getState(turno.id_estado).inasistir();

  return aplicarTransicion({
    turno,
    destino,
    cambios: { notas_consulta: body.notas_consulta },
    descripcion: "Turno marcado como Inasistido",
  });
};

/** Programado | Inasistente | Cancelado → Programado (nuevo horario). */
export const reprogramar = async (turno, body) => {
  const { fecha_hora_inicio, fecha_hora_fin, ignorar_restricciones, ignorarRestricciones } = body;

  const destino = getState(turno.id_estado).reprogramar();

  await asegurarAgendaDisponible({
    fechaInicio: fecha_hora_inicio,
    fechaFin: fecha_hora_fin,
    turnoIdExcluir: turno.id_turno,
    ignorarRestricciones: Boolean(ignorarRestricciones || ignorar_restricciones),
  });

  return aplicarTransicion({
    turno,
    destino,
    cambios: { fecha_hora_inicio, fecha_hora_fin },
    descripcion: "Turno reprogramado",
  });
};

