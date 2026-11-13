/** @format */

import { Op } from "sequelize";
import {
  Cobro,
  SolicitudCobro,
  MetodoPago,
  Paciente,
  Turno,
  PracticaTurno,
  Practica,
} from "../models/index.model.js";

const ATRIBUTOS_PACIENTE = [
  "id_paciente",
  "nombre",
  "apellido",
  "dni",
  "telefono",
];

const incluirTurnoParaCobro = (conPracticas = false) =>
  conPracticas
    ? {
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
      }
    : {
        model: Turno,
        attributes: ["id_turno", "fecha_hora_inicio", "fecha_hora_fin"],
      };

export const construirWhere = ({ fechaDesde, fechaHasta, search = "" } = {}) => {
  const where = {};

  if (fechaDesde && fechaHasta) {
    where.fecha_cobro = { [Op.between]: [fechaDesde, fechaHasta] };
  }

  if (search !== "") {
    where[Op.or] = [
      { observaciones: { [Op.like]: `%${search}%` } },
      { "$SolicitudCobro.observaciones$": { [Op.like]: `%${search}%` } },
      { "$SolicitudCobro.Paciente.nombre$": { [Op.like]: `%${search}%` } },
      { "$SolicitudCobro.Paciente.apellido$": { [Op.like]: `%${search}%` } },
      { "$SolicitudCobro.Paciente.dni$": { [Op.like]: `%${search}%` } },
    ];
  }

  return where;
};

export const findPaginado = ({
  where,
  limit,
  offset,
  order,
  conPracticas = false,
  distinct = false,
}) =>
  Cobro.findAndCountAll({
    where,
    limit,
    offset,
    order,
    subQuery: false,
    ...(distinct && { distinct: true }),
    include: [
      {
        model: MetodoPago,
        as: "MetodoPago",
        attributes: ["id", "nombre"],
      },
      {
        model: SolicitudCobro,
        as: "SolicitudCobro",
        required: true,
        include: [
          incluirTurnoParaCobro(conPracticas),
          {
            model: Paciente,
            attributes: ATRIBUTOS_PACIENTE,
          },
        ],
      },
    ],
  });

export const findMontosPorPeriodo = ({ fechaDesde, fechaHasta } = {}) =>
  Cobro.findAll({
    where:
      fechaDesde && fechaHasta
        ? { fecha_cobro: { [Op.between]: [fechaDesde, fechaHasta] } }
        : {},
    attributes: ["id", "monto"],
  });

export const findById = (id, transaction = null) =>
  Cobro.findByPk(id, { transaction });

export const findDetalleById = (id) =>
  Cobro.findByPk(id, {
    include: [
      { model: MetodoPago, as: "MetodoPago" },
      {
        model: SolicitudCobro,
        as: "SolicitudCobro",
        include: [{ model: Paciente }, { model: Turno }],
      },
    ],
  });

export const crear = (datos, transaction = null) =>
  Cobro.create(datos, { transaction });

