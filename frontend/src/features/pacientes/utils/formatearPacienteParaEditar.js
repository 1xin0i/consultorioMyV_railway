/** @format */

import { formatDateInput } from "@/shared/utils";

export const formatearPacienteParaEditar = (paciente) => {
  const relaciones =
    paciente.ObraSocials || paciente.PacientesPorObrasSociales || [];

  const obrasSocialesFormateadas = relaciones.map((os) => ({
    id_relacion:
      os.PacientesPorObrasSociales?.id_relacion || os.id_relacion || null,
    id_obra_social:
      os.id_obra_social || os.ObraSocial?.id_obra_social || "",
    nro_afiliado:
      os.PacientesPorObrasSociales?.nro_afiliado || os.nro_afiliado || "",
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
