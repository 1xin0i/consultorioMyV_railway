/** @format */

import { Paciente, PacienteObraSocial, ObraSocial } from "../models/index.model.js";
import { validarTelefono, validarDni } from "../validations/Paciente.validation.js";
import { Op, Sequelize } from "sequelize";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

// Obtener todos los pacientes
export const getAllPacientes = async (req, res) => {
  try {
    // paginacion
    const { page, limit, offset, search, sortField, sortOrder } = parsePagination(req.query, {
      defaultLimit: 9,
      defaultSortField: "apellido",
      defaultSortOrder: "ASC",
      allowedSortFields: [...Object.keys(Paciente.rawAttributes), "paciente"],
    });

    const estadoFiltrado = req.query.estadoFiltrado ?? req.query.activo;
    const where = {};

    if (estadoFiltrado === "inactivos" || estadoFiltrado === "false" || estadoFiltrado === "0") {
      where.activo = false;
    } else if (estadoFiltrado === "todos" || estadoFiltrado === "all" || estadoFiltrado === "") {
      // mostrar todos (activos e inactivos)
    } else if (estadoFiltrado === "activos" || estadoFiltrado === "true" || estadoFiltrado === "1") {
      where.activo = true;
    }

    // Busqueda por nombre apellido dni telefono
    if (search !== "") {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { apellido: { [Op.like]: `%${search}%` } },
        { dni: { [Op.like]: `%${search}%` } },
        { telefono: { [Op.like]: `%${search}%` } },
        Sequelize.where(
          Sequelize.fn("concat", Sequelize.col("nombre"), " ", Sequelize.col("apellido")),
          { [Op.like]: `%${search}%` }
        ),
      ];
    }

    let orderClause = [[sortField, sortOrder]];
    if (sortField === "paciente") {
      orderClause = [
        ["apellido", sortOrder],
        ["nombre", sortOrder],
      ];
    }

    const { count, rows: pacientes } = await Paciente.findAndCountAll({
      where,
      limit,
      offset,
      order: orderClause,
      distinct: true,
      include: [
        {
          model: PacienteObraSocial,
          attributes: ["id_paciente_obra_social", "id_paciente", "id_obra_social", "nro_afiliado"],
          include: [
            {
              model: ObraSocial,
              attributes: ["id_obra_social", "nombre"],
            },
          ],
        },
      ],
    });

    const data = pacientes.map((p) => {
      const plain = p.get ? p.get({ plain: true }) : p;
      const obrasSociales = (plain.PacienteObraSocials || []).map((pos) => ({
        id_paciente_obra_social: pos.id_paciente_obra_social,
        id_relacion: pos.id_paciente_obra_social,
        id_obra_social: pos.id_obra_social,
        nro_afiliado: pos.nro_afiliado,
        nombre: pos.ObraSocial?.nombre || "Obra Social",
        ObraSocial: pos.ObraSocial,
        PacientesPorObrasSociales: {
          id_relacion: pos.id_paciente_obra_social,
          nro_afiliado: pos.nro_afiliado,
        },
      }));

      return {
        ...plain,
        ObraSocials: obrasSociales,
        PacientesPorObrasSociales: obrasSociales,
        obras_sociales: obrasSociales,
      };
    });

    res.status(200).json({
      status: "success",
      data,
      meta: buildPaginationMeta(count, page, limit),
    });
  } catch (error) {
    console.error("Error al obtener los pacientes:", error);
    res.status(500).json({
      status: "error",
      message: "Error al obtener los pacientes",
      error: error.message,
    });
  }
};

// Obtener un paciente por su ID
export const getPacienteById = async (req, res) => {
  try {
    const pacienteEncontrado = await Paciente.findByPk(req.paciente.id_paciente, {
      include: [
        {
          model: PacienteObraSocial,
          attributes: ["id_paciente_obra_social", "id_paciente", "id_obra_social", "nro_afiliado"],
          include: [
            {
              model: ObraSocial,
              attributes: ["id_obra_social", "nombre"],
            },
          ],
        },
      ],
    });

    if (!pacienteEncontrado) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const plain = pacienteEncontrado.get ? pacienteEncontrado.get({ plain: true }) : pacienteEncontrado;
    const obrasSociales = (plain.PacienteObraSocials || []).map((pos) => ({
      id_paciente_obra_social: pos.id_paciente_obra_social,
      id_relacion: pos.id_paciente_obra_social,
      id_obra_social: pos.id_obra_social,
      nro_afiliado: pos.nro_afiliado,
      nombre: pos.ObraSocial?.nombre || "Obra Social",
      ObraSocial: pos.ObraSocial,
      PacientesPorObrasSociales: {
        id_relacion: pos.id_paciente_obra_social,
        nro_afiliado: pos.nro_afiliado,
      },
    }));

    res.status(200).json({
      status: "success",
      data: {
        ...plain,
        ObraSocials: obrasSociales,
        PacientesPorObrasSociales: obrasSociales,
        obras_sociales: obrasSociales,
      },
    });
  } catch (error) {
    console.error("Error al obtener el paciente:", error);
    res.status(500).json({ error: "Error al obtener el paciente" });
  }
};

// Crear un nuevo paciente
export const createPaciente = async (req, res) => {
  try {
    const { nombre, apellido, fecha_nacimiento, dni, telefono, domicilio } = req.body;

    const telefonoDuplicado = await validarTelefono(telefono);

    if (!telefonoDuplicado) {
      return res.status(400).json({
        status: "error",
        message: "El telefono esta duplicado. El paciente ya existe",
      });
    }

    if (dni) {
      const dniDuplicado = await validarDni(dni);
      if (!dniDuplicado) {
        return res.status(400).json({
          status: "error",
          message: "El dni esta duplicado. El paciente ya existe",
        });
      }
    }

    const newPaciente = await Paciente.create({
      nombre,
      apellido,
      fecha_nacimiento,
      dni,
      telefono,
      domicilio,
    });

    res.status(201).json({
      status: "success",
      data: newPaciente,
    });
  } catch (error) {
    console.error("Error al crear el paciente:", error);
    res.status(500).json({ error: "Error al crear el paciente" });
  }
};

// Actualizar un paciente existente
export const updatePaciente = async (req, res) => {
  try {
    const { nombre, apellido, fecha_nacimiento, dni, telefono, domicilio } = req.body;

    const paciente = req.paciente;

    if (telefono) {
      const telefonoDuplicado = await validarTelefono(telefono, paciente.id_paciente);

      if (!telefonoDuplicado) {
        return res.status(400).json({
          status: "error",
          message: "Telefono duplicado. El paciente ya existe",
        });
      }
    }

    if (dni) {
      const dniDuplicado = await validarDni(dni, paciente.id_paciente);
      if (!dniDuplicado) {
        return res.status(400).json({
          status: "error",
          message: "El dni esta duplicado. El paciente ya existe",
        });
      }
    }

    await paciente.update({
      nombre: nombre || paciente.nombre,
      apellido: apellido || paciente.apellido,
      fecha_nacimiento: fecha_nacimiento || paciente.fecha_nacimiento,
      dni: dni || paciente.dni,
      telefono: telefono || paciente.telefono,
      domicilio: domicilio || paciente.domicilio,
    });

    res.status(200).json({
      status: "success",
      data: paciente,
    });
  } catch (error) {
    console.error("Error al actualizar el paciente:", error);
    res.status(500).json({ error: "Error al actualizar el paciente" });
  }
};

// Alternar estado de paciente (baja lógica / reactivación)
export const deletePaciente = async (req, res) => {
  try {
    const paciente = req.paciente;

    await paciente.update({
      activo: !paciente.activo,
    });

    res.status(200).json({ message: "Estado de paciente actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar estado del paciente:", error);
    res.status(500).json({ error: "Error al actualizar estado del paciente" });
  }
};

// Eliminar un paciente permanentemente
export const destroyPaciente = async (req, res) => {
  try {
    const paciente = req.paciente;

    await paciente.destroy();

    res.status(200).json({ message: "Paciente eliminado permanentemente" });
  } catch (error) {
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(409).json({
        status: "error",
        message:
          "No se puede eliminar permanentemente el paciente porque tiene turnos o historial clínico asociado. Podés mantenerlo inactivo.",
      });
    }
    console.error("Error al eliminar permanentemente el paciente:", error);
    res.status(500).json({ error: "Error al eliminar el paciente" });
  }
};
