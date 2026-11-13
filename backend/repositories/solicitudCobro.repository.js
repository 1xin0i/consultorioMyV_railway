/** @format */

import { Op } from "sequelize";
import {
  SolicitudCobro,
  Cobro,
  MetodoPago,
  Paciente,
  Turno,
  PracticaTurno,
  Practica,
} from "../models/index.model.js";
import { ESTADOS_SOLICITUD_CON_SALDO } from "../constants/EstadosSolicitud.js";

const ATRIBUTOS_PACIENTE = [
  "id_paciente",
  "nombre",
  "apellido",
  "dni",
  "telefono",
];

const incluirCobrosConMetodo = () => ({
  model: Cobro,
  as: "Cobros",
  include: [{ model: MetodoPago, as: "MetodoPago" }],
});

export const findByIdConCobros = (id, transaction = null) =>
  SolicitudCobro.findByPk(id, {
    include: [{ model: Cobro, as: "Cobros" }],
    transaction,
  });

export const findByTurnoId = (turnoId, transaction = null) =>
  SolicitudCobro.findOne({
    where: { turno_id: turnoId },
    transaction,
  });

export const findByTurnoIdConCobros = (turnoId, transaction = null) =>
  SolicitudCobro.findOne({
    where: { turno_id: turnoId },
    include: [{ model: Cobro, as: "Cobros" }],
    transaction,
  });

export const findDetalleByTurnoId = (turnoId) =>
  SolicitudCobro.findOne({
    where: { turno_id: turnoId },
    include: [
      {
        model: Turno,
        attributes: [
          "id_turno",
          "fecha_hora_inicio",
          "fecha_hora_fin",
          "precio_final",
          "notas_consulta",
        ],
      },
      {
        model: Paciente,
        attributes: ATRIBUTOS_PACIENTE,
      },
      incluirCobrosConMetodo(),
    ],
    order: [[{ model: Cobro, as: "Cobros" }, "fecha_cobro", "ASC"]],
  });

export const findPendientesConDetalle = () =>
  SolicitudCobro.findAll({
    where: {
      estado: { [Op.in]: ESTADOS_SOLICITUD_CON_SALDO },
    },
    include: [
      {
        model: Paciente,
        attributes: ATRIBUTOS_PACIENTE,
      },
      {
        model: Turno,
        attributes: [
          "id_turno",
          "fecha_hora_inicio",
          "fecha_hora_fin",
          "notas_consulta",
        ],
        include: [
          {
            model: PracticaTurno,
            include: [
              {
                model: Practica,
                attributes: ["nombre_referencia", "nombre_nomenclador"],
              },
            ],
          },
        ],
      },
      incluirCobrosConMetodo(),
    ],
    order: [["created_at", "DESC"]],
  });

export const crear = (datos, transaction = null) =>
  SolicitudCobro.create(datos, { transaction });

