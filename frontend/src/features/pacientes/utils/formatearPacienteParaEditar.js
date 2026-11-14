/** @format */

import { formatDateInput } from "@/shared/utils";

/**
 * Normaliza las obras sociales de un paciente sin importar si vienen de
 * PacienteObraSocials (Sequelize crudo), ObraSocials, PacientesPorObrasSociales u obras_sociales.
 */
export const obtenerObrasSocialesPaciente = (paciente) => {
  if (!paciente) return [];

  const lista =
    paciente.PacienteObraSocials ||
    paciente.ObraSocials ||
    paciente.PacientesPorObrasSociales ||
    paciente.obras_sociales ||
    [];

  if (!Array.isArray(lista)) return [];

  return lista.map((os) => {
    const idRelacion =
      os.id_paciente_obra_social ||
      os.id_relacion ||
      os.PacientesPorObrasSociales?.id_relacion ||
      null;

    const idObraSocial =
      os.id_obra_social ||
      os.ObraSocial?.id_obra_social ||
      os.PacientesPorObrasSociales?.id_obra_social ||
      "";

    const nombre =
      os.nombre ||
      os.ObraSocial?.nombre ||
      (idObraSocial ? `Obra Social #${idObraSocial}` : "Obra Social");

    const nroAfiliado =
      os.nro_afiliado ||
      os.PacientesPorObrasSociales?.nro_afiliado ||
      "";

    return {
      id_relacion: idRelacion,
      id_paciente_obra_social: idRelacion,
      id_obra_social: idObraSocial,
      nombre,
      nro_afiliado: nroAfiliado,
      ObraSocial: os.ObraSocial || {
        id_obra_social: idObraSocial,
        nombre,
      },
    };
  });
};

export const formatearPacienteParaEditar = (paciente) => {
  const obrasSociales = obtenerObrasSocialesPaciente(paciente);

  const obrasSocialesFormateadas = obrasSociales.map((os) => ({
    id_relacion: os.id_relacion,
    id_obra_social: os.id_obra_social,
    nro_afiliado: os.nro_afiliado,
  }));

  return {
    id_paciente: paciente.id_paciente,
    nombre: paciente.nombre || "",
    apellido: paciente.apellido || "",
    dni: paciente.dni || "",
    telefono: paciente.telefono || "",
    fecha_nacimiento: formatDateInput(paciente.fecha_nacimiento),
    domicilio: paciente.domicilio || "",
    activo: paciente.activo !== undefined ? paciente.activo : true,
    obras_sociales: obrasSocialesFormateadas,
  };
};
