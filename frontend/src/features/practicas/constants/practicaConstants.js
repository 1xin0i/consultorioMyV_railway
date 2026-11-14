export const COLUMNAS_TABLA = [
  { etiqueta: "Código", campo: "codigo_nomenclador", ordenable: true },
  { etiqueta: "Práctica", campo: "nombre_referencia", ordenable: true },
  { etiqueta: "Especialidad", campo: "especialidad", ordenable: true },
  { etiqueta: "Precio Ref.", campo: "precio_referencia", ordenable: true },
  { etiqueta: "Estado", campo: "activo", ordenable: false, centrado: true },
  { etiqueta: "Acciones", campo: null, ordenable: false, centrado: true },
];

export const ESTADO_INICIAL_PRACTICA = {
  codigo_nomenclador: "",
  nombre_nomenclador: "",
  nombre_referencia: "",
  especialidad: "",
  precio_referencia: 0,
};

export const ESTADO_INICIAL = ESTADO_INICIAL_PRACTICA;
