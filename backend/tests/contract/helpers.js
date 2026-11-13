/** @format */

// IMPORTANTE: este import debe ir PRIMERO en cada test de contrato.
// Fija el entorno antes de que se cargue config/database.js.
process.env.NODE_ENV = "test";
process.env.TZ = "America/Argentina/Buenos_Aires";

import { jest } from "@jest/globals";
import request from "supertest";
import app from "../../index.js";
import sequelize from "../../config/database.js";
import {
  sincronizarModelos,
  EstadoTurno,
  Paciente,
  Practica,
} from "../../models/index.model.js";

export { request, app, sequelize };

// Reloj congelado: lunes 2030-01-07 09:00 (-03:00). Hace deterministas
// created_at, fecha_cobro, fecha_hora_cambio y los períodos de Caja.
export const NOW_ISO = "2030-01-07T09:00:00-03:00";

export const congelarReloj = () => {
  jest.useFakeTimers({
    now: new Date(NOW_ISO),
    doNotFake: [
      "hrtime",
      "nextTick",
      "performance",
      "queueMicrotask",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "requestIdleCallback",
      "cancelIdleCallback",
      "setImmediate",
      "clearImmediate",
      "setInterval",
      "clearInterval",
      "setTimeout",
      "clearTimeout",
    ],
  });
};

export const descongelarReloj = () => jest.useRealTimers();

/** Base en memoria + estados con ids fijos 1..4 + pacientes + prácticas. */
export const prepararBase = async () => {
  await sequelize.authenticate();
  await sincronizarModelos();

  const estados = ["Programado", "Atendido", "Cancelado", "Inasistente"];
  for (let i = 0; i < estados.length; i++) {
    await EstadoTurno.findOrCreate({
      where: { id_estado: i + 1 },
      defaults: { id_estado: i + 1, estado: estados[i] },
    });
  }

  await Paciente.create({
    nombre: "Carlos",
    apellido: "Gomez",
    dni: "35123456",
    telefono: "3515556666",
  });
  await Paciente.create({
    nombre: "Ana",
    apellido: "Perez",
    dni: "30111222",
    telefono: "3514445555",
  });

  await Practica.create({
    codigo_nomenclador: "01.01",
    nombre_nomenclador: "Consulta",
    nombre_referencia: "Consulta general",
    especialidad: "General",
    precio_referencia: 1000,
  });
  await Practica.create({
    codigo_nomenclador: "02.02",
    nombre_nomenclador: "Limpieza",
    nombre_referencia: "Limpieza dental",
    especialidad: "General",
    precio_referencia: 2000,
  });
};

/** Compara status + body contra el snapshot guardado. */
export const snap = (label, res) =>
  expect({ status: res.status, body: res.body }).toMatchSnapshot(label);

/** Vuelca filas crudas de un modelo (estado final de la BD) al snapshot. */
export const snapDb = async (label, Model, opciones = {}) => {
  const rows = await Model.findAll({ raw: true, ...opciones });
  expect(rows).toMatchSnapshot(label);
};

export const cerrar = async () => {
  descongelarReloj();
  await sequelize.close();
};

