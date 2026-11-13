/** @format */

import { Op } from "sequelize";
import sequelize from "../config/database.js";
import {
  Turno,
  Practica,
  PracticaTurno,
  EstadoTurno,
  Paciente,
  ObraSocial,
  SolicitudCobro,
  Cobro,
  MetodoPago,
} from "../models/index.model.js";
import { ESTADOS, ESTADO_POR_FILTRO } from "../constants/EstadosTurno.js";
import { rangoDeMes } from "../utils/fechas.js";

/* ───────────── Includes reutilizables (factories: Sequelize muta las opciones) ───────────── */

const ATRIBUTOS_PACIENTE = ["nombre", "apellido", "dni", "telefono"];

export const incluirPaciente = (attributes = ATRIBUTOS_PACIENTE) => ({
  model: Paciente,
  attributes,
});

export const incluirEstado = (attributes = ["estado"]) => ({
  model: EstadoTurno,
  attributes,
});

export const incluirPracticas = ({ conPrecio = true } = {}) => ({
  model: PracticaTurno,
  include: [
    {
      model: Practica,
      attributes: [
        "id_practica",
        "codigo_nomenclador",
        "nombre_nomenclador",
        "nombre_referencia",
        ...(conPrecio ? ["precio_referencia"] : []),
      ],
    },
    {
      model: ObraSocial,
      attributes: ["id_obra_social", "nombre"],
    },
  ],
});

const ATRIBUTOS_COBRO = [
  "id",
  "monto",
  "metodo_pago_id",
  "fecha_cobro",
  "observaciones",
];

/** Solicitud de cobro resumida (listado paginado). */
const incluirSolicitudResumen = () => ({
  model: SolicitudCobro,
  required: false,
  attributes: ["id", "monto_total", "estado", "observaciones"],
  include: [{ model: Cobro, as: "Cobros", attributes: ATRIBUTOS_COBRO }],
});

/** Solicitud de cobro con método de pago (historial de un paciente). */
const incluirSolicitudConMetodo = () => ({
  model: SolicitudCobro,
  attributes: ["id", "monto_total", "estado", "observaciones", "created_at"],
  include: [
    {
      model: Cobro,
      as: "Cobros",
      attributes: ATRIBUTOS_COBRO,
      include: [{ model: MetodoPago, as: "MetodoPago" }],
    },
  ],
});

/* ───────────── Filtros y orden del listado paginado ───────────── */

export const construirWhereListado = ({ estadoFiltrado, mes, search }) => {
  const where = { activo: true };

  if (estadoFiltrado && estadoFiltrado !== "todos" && estadoFiltrado !== "all") {
    const idEst =
      Number(estadoFiltrado) || ESTADO_POR_FILTRO[String(estadoFiltrado).toLowerCase()];
    if (idEst) {
      where.id_estado = idEst;
    }
  }

  if (mes) {
    // mes esperado como "YYYY-MM" (e.g. "2026-10")
    const rango = rangoDeMes(mes);
    if (rango) {
      where.fecha_hora_inicio = { [Op.between]: [rango.inicio, rango.fin] };
    }
  }

  // Búsqueda por nombre, apellido, dni, teléfono
  if (search !== "") {
    where[Op.or] = [
      { fecha_hora_inicio: { [Op.like]: `%${search}%` } },
      { fecha_hora_fin: { [Op.like]: `%${search}%` } },
      { "$Paciente.nombre$": { [Op.like]: `%${search}%` } },
      { "$Paciente.apellido$": { [Op.like]: `%${search}%` } },
      { "$Paciente.dni$": { [Op.like]: `%${search}%` } },
      { "$Paciente.telefono$": { [Op.like]: `%${search}%` } },
      sequelize.where(
        sequelize.fn("concat", sequelize.col("Paciente.nombre"), " ", sequelize.col("Paciente.apellido")),
        { [Op.like]: `%${search}%` },
      ),
    ];
  }

  return where;
};

export const construirOrdenListado = (sortField, sortOrder) => {
  if (sortField === "paciente") {
    return [
      [{ model: Paciente }, "apellido", sortOrder],
      [{ model: Paciente }, "nombre", sortOrder],
    ];
  }
  if (sortField === "estado") {
    return [[{ model: EstadoTurno }, "estado", sortOrder]];
  }
  if (sortField === "fecha" || sortField === "fecha_hora_inicio") {
    return [["fecha_hora_inicio", sortOrder]];
  }
  if (sortField === "honorarios" || sortField === "precio_final") {
    return [["precio_final", sortOrder]];
  }
  return [[sortField, sortOrder]];
};

/* ───────────── Consultas ───────────── */

export const camposOrdenables = () => [
  ...Object.keys(Turno.rawAttributes),
  "paciente",
  "estado",
  "fecha",
  "honorarios",
];

export const findAgenda = () =>
  Turno.findAll({
    where: { activo: true },
    include: [incluirPaciente(), incluirEstado(), incluirPracticas()],
  });

export const findPaginado = ({ where, limit, offset, order }) =>
  Turno.findAndCountAll({
    where,
    limit,
    offset,
    order,
    distinct: true,
    include: [
      incluirPaciente(),
      incluirEstado(),
      incluirPracticas(),
      incluirSolicitudResumen(),
    ],
  });

/**
 * Turnos atendidos que todavía no tienen solicitud de cobro.
 * `include` y `order` son opcionales: Caja los reutiliza con más detalle (Fase 2).
 */
export const findAtendidosSinSolicitud = async ({ include, order } = {}) => {
  const solicitudesExistentes = await SolicitudCobro.findAll({
    where: { turno_id: { [Op.ne]: null } },
    attributes: ["turno_id"],
  });

  const idsConSolicitud = solicitudesExistentes
    .map((s) => s.turno_id)
    .filter(Boolean);

  return Turno.findAll({
    where: {
      activo: true,
      id_estado: ESTADOS.ATENDIDO,
      id_turno: {
        // [-1] evita un NOT IN () vacío
        [Op.notIn]: idsConSolicitud.length > 0 ? idsConSolicitud : [-1],
      },
    },
    include: include ?? [incluirPaciente(), incluirEstado()],
    ...(order && { order }),
  });
};

export const findDetalleById = (id_turno) =>
  Turno.findByPk(id_turno, {
    include: [
      incluirPaciente([
        "nombre",
        "apellido",
        "dni",
        "telefono",
        "fecha_nacimiento",
        "domicilio",
      ]),
      incluirEstado(["id_estado", "estado"]),
      incluirPracticas(),
    ],
  });

export const findByPaciente = (id_paciente) =>
  Turno.findAll({
    where: { id_paciente, activo: true },
    order: [["fecha_hora_inicio", "DESC"]], // Del más reciente al más antiguo
    include: [
      incluirEstado(["id_estado", "estado"]),
      incluirPracticas({ conPrecio: false }),
      incluirSolicitudConMetodo(),
    ],
  });

export const crear = (datos, transaction) => Turno.create(datos, { transaction });

