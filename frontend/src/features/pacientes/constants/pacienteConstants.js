export const COLUMNAS_TABLA = [
  { etiqueta: "ID", campo: "id_paciente", ordenable: true },
  { etiqueta: "Paciente", campo: "apellido", ordenable: true },
  { etiqueta: "DNI", campo: "dni", ordenable: true },
  { etiqueta: "Teléfono", campo: "telefono", ordenable: false },
  { etiqueta: "Edad", campo: "fecha_nacimiento", ordenable: true },
  { etiqueta: "Domicilio", campo: "domicilio", ordenable: false },
  { etiqueta: "Obra Social", campo: null, ordenable: false },
  { etiqueta: "Acciones", campo: null, ordenable: false, centrado: true },
];

export const ESTADO_INICIAL_PACIENTE = {
  nombre: "",
  apellido: "",
  dni: "",
  fecha_nacimiento: "",
  telefono: "",
  domicilio: "",
  obrasSociales: [],
  obrasSocialesEliminadas: [],
};

export const ESTADO_INICIAL = ESTADO_INICIAL_PACIENTE;
