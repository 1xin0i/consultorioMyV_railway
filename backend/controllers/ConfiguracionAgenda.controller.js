/** @format */

import { ConfiguracionAgenda, RestriccionAgenda } from "../models/index.model.js";

const normalizarHora = (horaStr, fallback = "08:00") => {
  if (!horaStr || typeof horaStr !== "string") return fallback;
  const parts = horaStr.trim().split(":");
  if (parts.length < 2) return fallback;
  const h = String(parseInt(parts[0], 10) || 0).padStart(2, "0");
  const m = String(parseInt(parts[1], 10) || 0).padStart(2, "0");
  return `${h}:${m}`;
};

const formatearConfiguracion = (row) => {
  const hIni = normalizarHora(row?.hora_inicio, "08:00");
  const hFin = normalizarHora(row?.hora_fin, "20:00");
  const modulos = Number(row?.duracion_modulo_minutos) || 30;
  let dias = row?.dias_laborales;
  if (typeof dias === "string") {
    try {
      dias = JSON.parse(dias);
    } catch {
      dias = [1, 2, 3, 4, 5, 6];
    }
  }
  const diasArr = Array.isArray(dias) && dias.length > 0
    ? dias.map(Number)
    : [1, 2, 3, 4, 5, 6];

  const ocupacionBajaMax = Number(row?.ocupacion_baja_max) || 50;
  const ocupacionMediaMax = Number(row?.ocupacion_media_max) || 80;

  return {
    id: row?.id || 1,
    hora_inicio: hIni,
    hora_fin: hFin,
    duracion_modulo_minutos: modulos,
    dias_laborales: diasArr,
    ocupacion_baja_max: ocupacionBajaMax,
    ocupacion_media_max: ocupacionMediaMax,
    horaInicio: hIni,
    horaFin: hFin,
    duracionModuloMinutos: modulos,
    diasLaborales: diasArr,
    ocupacionBajaMax,
    ocupacionMediaMax,
  };
};

const formatearRestriccion = (row) => {
  const todoDia = Boolean(row.todo_el_dia);
  const hIni = !todoDia && row.hora_inicio ? normalizarHora(row.hora_inicio) : null;
  const hFin = !todoDia && row.hora_fin ? normalizarHora(row.hora_fin) : null;

  return {
    id: row.id,
    motivo: row.motivo || "Bloqueado",
    todo_el_dia: todoDia,
    todoElDia: todoDia,
    fecha_inicio: row.fecha_inicio,
    fechaInicio: row.fecha_inicio,
    fecha_fin: row.fecha_fin || row.fecha_inicio,
    fechaFin: row.fecha_fin || row.fecha_inicio,
    hora_inicio: hIni,
    horaInicio: hIni,
    hora_fin: hFin,
    horaFin: hFin,
  };
};

// GET /api/configuracion-agenda
export const getConfiguracionAgenda = async (req, res) => {
  try {
    const [config] = await ConfiguracionAgenda.findOrCreate({
      where: { id: 1 },
      defaults: {
        id: 1,
        hora_inicio: "08:00:00",
        hora_fin: "20:00:00",
        duracion_modulo_minutos: 30,
        dias_laborales: [1, 2, 3, 4, 5, 6],
        ocupacion_baja_max: 50,
        ocupacion_media_max: 80,
      },
    });

    return res.status(200).json({
      status: "success",
      data: formatearConfiguracion(config),
    });
  } catch (error) {
    console.error("Error al obtener configuración de agenda:", error);
    return res.status(500).json({
      error: "Error al obtener la configuración de la agenda",
    });
  }
};

// PUT /api/configuracion-agenda
export const updateConfiguracionAgenda = async (req, res) => {
  try {
    const body = req.body || {};
    const horaInicioRaw = body.hora_inicio ?? body.horaInicio ?? "08:00";
    const horaFinRaw = body.hora_fin ?? body.horaFin ?? "20:00";
    const duracionRaw =
      body.duracion_modulo_minutos ?? body.duracionModuloMinutos ?? 30;
    const diasRaw = body.dias_laborales ?? body.diasLaborales ?? [1, 2, 3, 4, 5, 6];
    const bajaRaw =
      body.ocupacion_baja_max ?? body.ocupacionBajaMax ?? 50;
    const mediaRaw =
      body.ocupacion_media_max ?? body.ocupacionMediaMax ?? 80;

    const hIni = normalizarHora(horaInicioRaw, "08:00");
    const hFin = normalizarHora(horaFinRaw, "20:00");

    if (hFin <= hIni) {
      return res.status(400).json({
        error: "La hora de cierre debe ser posterior a la hora de apertura.",
      });
    }

    const duracion = Number(duracionRaw) || 30;
    let diasLaborales = Array.isArray(diasRaw)
      ? diasRaw.map(Number).filter((d) => !isNaN(d) && d >= 0 && d <= 6)
      : [1, 2, 3, 4, 5, 6];

    if (diasLaborales.length === 0) {
      return res.status(400).json({
        error: "Debe seleccionarse al menos un día laboral.",
      });
    }

    const ocupacionBajaMax = Math.min(98, Math.max(5, Number(bajaRaw) || 50));
    const ocupacionMediaMax = Math.min(99, Math.max(ocupacionBajaMax + 1, Number(mediaRaw) || 80));

    const [config] = await ConfiguracionAgenda.findOrCreate({
      where: { id: 1 },
      defaults: {
        id: 1,
        hora_inicio: `${hIni}:00`,
        hora_fin: `${hFin}:00`,
        duracion_modulo_minutos: duracion,
        dias_laborales: diasLaborales,
        ocupacion_baja_max: ocupacionBajaMax,
        ocupacion_media_max: ocupacionMediaMax,
      },
    });

    await config.update({
      hora_inicio: `${hIni}:00`,
      hora_fin: `${hFin}:00`,
      duracion_modulo_minutos: duracion,
      dias_laborales: diasLaborales,
      ocupacion_baja_max: ocupacionBajaMax,
      ocupacion_media_max: ocupacionMediaMax,
    });

    return res.status(200).json({
      status: "success",
      data: formatearConfiguracion(config),
    });
  } catch (error) {
    console.error("Error al actualizar configuración de agenda:", error);
    return res.status(500).json({
      error: "Error al actualizar la configuración de la agenda",
    });
  }
};

// GET /api/restricciones-agenda
export const getRestriccionesAgenda = async (req, res) => {
  try {
    const restricciones = await RestriccionAgenda.findAll({
      order: [
        ["fecha_inicio", "ASC"],
        ["id", "ASC"],
      ],
    });

    return res.status(200).json({
      status: "success",
      data: restricciones.map(formatearRestriccion),
    });
  } catch (error) {
    console.error("Error al obtener restricciones de agenda:", error);
    return res.status(500).json({
      error: "Error al obtener las restricciones de la agenda",
    });
  }
};

// POST /api/restricciones-agenda
export const createRestriccionAgenda = async (req, res) => {
  try {
    const body = req.body || {};
    const motivo = (body.motivo || "Bloqueado").trim();
    const todoElDia = Boolean(body.todo_el_dia ?? body.todoElDia ?? false);
    const fechaInicio = body.fecha_inicio ?? body.fechaInicio;
    const fechaFin = body.fecha_fin ?? body.fechaFin ?? fechaInicio;
    const horaInicioRaw = body.hora_inicio ?? body.horaInicio ?? "08:00";
    const horaFinRaw = body.hora_fin ?? body.horaFin ?? "10:00";

    if (!fechaInicio) {
      return res.status(400).json({
        error: "La fecha de inicio es obligatoria.",
      });
    }

    if (fechaFin < fechaInicio) {
      return res.status(400).json({
        error: "La fecha de fin no puede ser anterior a la fecha de inicio.",
      });
    }

    let horaInicio = null;
    let horaFin = null;

    if (!todoElDia) {
      const hIni = normalizarHora(horaInicioRaw, "08:00");
      const hFin = normalizarHora(horaFinRaw, "10:00");
      if (hFin <= hIni) {
        return res.status(400).json({
          error: "La hora de fin debe ser posterior a la hora de inicio.",
        });
      }
      horaInicio = `${hIni}:00`;
      horaFin = `${hFin}:00`;
    }

    const nueva = await RestriccionAgenda.create({
      motivo,
      todo_el_dia: todoElDia,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
    });

    return res.status(201).json({
      status: "success",
      data: formatearRestriccion(nueva),
    });
  } catch (error) {
    console.error("Error al crear restricción de agenda:", error);
    return res.status(500).json({
      error: "Error al crear la restricción de la agenda",
    });
  }
};

// DELETE /api/restricciones-agenda/:id
export const deleteRestriccionAgenda = async (req, res) => {
  try {
    const { id } = req.params;
    const restriccion = await RestriccionAgenda.findByPk(id);
    if (!restriccion) {
      return res.status(404).json({
        error: "La restricción especificada no existe.",
      });
    }

    await restriccion.destroy();

    return res.status(200).json({
      status: "success",
      message: "Restricción eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar restricción de agenda:", error);
    return res.status(500).json({
      error: "Error al eliminar la restricción de la agenda",
    });
  }
};
