/** @format */

import { Op } from "sequelize";
import { Practica, PracticaTurno } from "../../models/index.model.js";
import { AppError } from "../../errors/AppError.js";

const ERROR_PRACTICAS_INEXISTENTES = () =>
  new AppError(400, { error: "Una o más prácticas especificadas no existen" });

/** Acepta ids sueltos o `{ id_practica }`, deduplica y descarta valores vacíos/NaN. */
export const extraerIdsUnicos = (practicas) => [
  ...new Set(
    practicas.map((p) =>
      typeof p === "object" ? Number(p.id_practica) : Number(p),
    ),
  ),
].filter(Boolean);

const contarExistentes = (ids, transaction) =>
  Practica.findAll({
    where: { id_practica: { [Op.in]: ids } },
    transaction,
  }).then((encontradas) => encontradas.length);

/**
 * Alta de turno: guarda las prácticas tentativas (sin obra social).
 * Lanza AppError(400) si alguna no existe.
 */
export const registrarPracticasProgramadas = async (id_turno, practicas, transaction) => {
  if (!practicas || !Array.isArray(practicas) || practicas.length === 0) return;

  const ids = extraerIdsUnicos(practicas);
  if (ids.length === 0) return;

  if ((await contarExistentes(ids, transaction)) !== ids.length) {
    throw ERROR_PRACTICAS_INEXISTENTES();
  }

  await PracticaTurno.bulkCreate(
    ids.map((id_practica) => ({ id_turno, id_practica, id_obra_social: null })),
    { transaction },
  );
};

/**
 * Edición de turno programado: reemplaza las prácticas.
 * Compat: borra siempre las anteriores y, si alguna práctica nueva no existe,
 * NO falla ni inserta nada (comportamiento histórico de PUT /api/turnos/:id).
 */
export const sincronizarPracticasProgramadas = async (id_turno, practicas, transaction) => {
  await PracticaTurno.destroy({ where: { id_turno }, transaction });

  const ids = extraerIdsUnicos(practicas);
  if (ids.length === 0) return;

  if ((await contarExistentes(ids, transaction)) === ids.length) {
    await PracticaTurno.bulkCreate(
      ids.map((id_practica) => ({ id_turno, id_practica, id_obra_social: null })),
      { transaction },
    );
  }
};

/**
 * Normaliza lo que informa el consultorio al atender. Soporta dos formatos:
 *   practicas: [{ id_practica, id_obra_social }]   (preferido)
 *   practicas_realizadas: [ids] + obras_sociales: [ids paralelos]   (legacy)
 */
export const normalizarPracticasAtencion = ({ practicas, practicas_realizadas, obras_sociales }) => {
  if (practicas && Array.isArray(practicas) && practicas.length > 0) {
    return practicas
      .filter((p) => p && (p.id_practica || typeof p === "number"))
      .map((p) => {
        if (typeof p === "number") {
          return { id_practica: p, id_obra_social: null };
        }
        return {
          id_practica: Number(p.id_practica),
          id_obra_social: p.id_obra_social ? Number(p.id_obra_social) : null,
        };
      });
  }

  if (
    practicas_realizadas &&
    Array.isArray(practicas_realizadas) &&
    practicas_realizadas.length > 0
  ) {
    return practicas_realizadas.map((id_practica, idx) => ({
      id_practica: Number(id_practica),
      id_obra_social: obras_sociales?.[idx] ? Number(obras_sociales[idx]) : null,
    }));
  }

  return [];
};

/**
 * Al atender: elimina las prácticas previas (cargadas al programar) y guarda las realizadas.
 * Lanza AppError(400) si alguna no existe.
 */
export const reemplazarPracticasAtendidas = async (id_turno, lista, transaction) => {
  await PracticaTurno.destroy({ where: { id_turno }, transaction });

  if (lista.length === 0) return;

  const ids = [...new Set(lista.map((p) => p.id_practica))];
  if ((await contarExistentes(ids, transaction)) !== ids.length) {
    throw ERROR_PRACTICAS_INEXISTENTES();
  }

  await PracticaTurno.bulkCreate(
    lista.map((item) => ({
      id_turno,
      id_practica: item.id_practica,
      id_obra_social: item.id_obra_social || null,
    })),
    { transaction },
  );
};

