/** @format */

export const CUADRANTES = {
  q1: [18, 17, 16, 15, 14, 13, 12, 11], // Superior Derecho
  q2: [21, 22, 23, 24, 25, 26, 27, 28], // Superior Izquierdo
  q4: [48, 47, 46, 45, 44, 43, 42, 41], // Inferior Derecho
  q3: [31, 32, 33, 34, 35, 36, 37, 38], // Inferior Izquierdo
};

export const TODOS_LOS_DIENTES = [
  ...CUADRANTES.q1,
  ...CUADRANTES.q2,
  ...CUADRANTES.q3,
  ...CUADRANTES.q4,
];

export const ARCADA_SUPERIOR = [...CUADRANTES.q1, ...CUADRANTES.q2];
export const ARCADA_INFERIOR = [...CUADRANTES.q4, ...CUADRANTES.q3];

export const DIENTES_INFO = {
  // Cuadrante 1
  18: { fdi: 18, nombre: "Tercer molar superior derecho", cuadrante: 1, arcada: "superior", tipo: "Molar" },
  17: { fdi: 17, nombre: "Segundo molar superior derecho", cuadrante: 1, arcada: "superior", tipo: "Molar" },
  16: { fdi: 16, nombre: "Primer molar superior derecho", cuadrante: 1, arcada: "superior", tipo: "Molar" },
  15: { fdi: 15, nombre: "Segundo premolar superior derecho", cuadrante: 1, arcada: "superior", tipo: "Premolar" },
  14: { fdi: 14, nombre: "Primer premolar superior derecho", cuadrante: 1, arcada: "superior", tipo: "Premolar" },
  13: { fdi: 13, nombre: "Canino superior derecho", cuadrante: 1, arcada: "superior", tipo: "Canino" },
  12: { fdi: 12, nombre: "Incisivo lateral superior derecho", cuadrante: 1, arcada: "superior", tipo: "Incisivo" },
  11: { fdi: 11, nombre: "Incisivo central superior derecho", cuadrante: 1, arcada: "superior", tipo: "Incisivo" },

  // Cuadrante 2
  21: { fdi: 21, nombre: "Incisivo central superior izquierdo", cuadrante: 2, arcada: "superior", tipo: "Incisivo" },
  22: { fdi: 22, nombre: "Incisivo lateral superior izquierdo", cuadrante: 2, arcada: "superior", tipo: "Incisivo" },
  23: { fdi: 23, nombre: "Canino superior izquierdo", cuadrante: 2, arcada: "superior", tipo: "Canino" },
  24: { fdi: 24, nombre: "Primer premolar superior izquierdo", cuadrante: 2, arcada: "superior", tipo: "Premolar" },
  25: { fdi: 25, nombre: "Segundo premolar superior izquierdo", cuadrante: 2, arcada: "superior", tipo: "Premolar" },
  26: { fdi: 26, nombre: "Primer molar superior izquierdo", cuadrante: 2, arcada: "superior", tipo: "Molar" },
  27: { fdi: 27, nombre: "Segundo molar superior izquierdo", cuadrante: 2, arcada: "superior", tipo: "Molar" },
  28: { fdi: 28, nombre: "Tercer molar superior izquierdo", cuadrante: 2, arcada: "superior", tipo: "Molar" },

  // Cuadrante 3
  31: { fdi: 31, nombre: "Incisivo central inferior izquierdo", cuadrante: 3, arcada: "inferior", tipo: "Incisivo" },
  32: { fdi: 32, nombre: "Incisivo lateral inferior izquierdo", cuadrante: 3, arcada: "inferior", tipo: "Incisivo" },
  33: { fdi: 33, nombre: "Canino inferior izquierdo", cuadrante: 3, arcada: "inferior", tipo: "Canino" },
  34: { fdi: 34, nombre: "Primer premolar inferior izquierdo", cuadrante: 3, arcada: "inferior", tipo: "Premolar" },
  35: { fdi: 35, nombre: "Segundo premolar inferior izquierdo", cuadrante: 3, arcada: "inferior", tipo: "Premolar" },
  36: { fdi: 36, nombre: "Primer molar inferior izquierdo", cuadrante: 3, arcada: "inferior", tipo: "Molar" },
  37: { fdi: 37, nombre: "Segundo molar inferior izquierdo", cuadrante: 3, arcada: "inferior", tipo: "Molar" },
  38: { fdi: 38, nombre: "Tercer molar inferior izquierdo", cuadrante: 3, arcada: "inferior", tipo: "Molar" },

  // Cuadrante 4
  41: { fdi: 41, nombre: "Incisivo central inferior derecho", cuadrante: 4, arcada: "inferior", tipo: "Incisivo" },
  42: { fdi: 42, nombre: "Incisivo lateral inferior derecho", cuadrante: 4, arcada: "inferior", tipo: "Incisivo" },
  43: { fdi: 43, nombre: "Canino inferior derecho", cuadrante: 4, arcada: "inferior", tipo: "Canino" },
  44: { fdi: 44, nombre: "Primer premolar inferior derecho", cuadrante: 4, arcada: "inferior", tipo: "Premolar" },
  45: { fdi: 45, nombre: "Segundo premolar inferior derecho", cuadrante: 4, arcada: "inferior", tipo: "Premolar" },
  46: { fdi: 46, nombre: "Primer molar inferior derecho", cuadrante: 4, arcada: "inferior", tipo: "Molar" },
  47: { fdi: 47, nombre: "Segundo molar inferior derecho", cuadrante: 4, arcada: "inferior", tipo: "Molar" },
  48: { fdi: 48, nombre: "Tercer molar inferior derecho", cuadrante: 4, arcada: "inferior", tipo: "Molar" },
};

export const CARAS_DENTALES = [
  { codigo: "V", nombre: "Vestibular" },
  { codigo: "P/L", nombre: "Palatino / Lingual" },
  { codigo: "M", nombre: "Mesial" },
  { codigo: "D", nombre: "Distal" },
  { codigo: "O/I", nombre: "Oclusal / Incisal" },
];

/**
 * Genera un texto conciso del conjunto de dientes seleccionados
 */
export function formatearResumenDientes(dientes) {
  if (!dientes || !Array.isArray(dientes) || dientes.length === 0) {
    return "Sin piezas asignadas";
  }

  const normalizados = [
    ...new Set(
      dientes.map((d) => (typeof d === "object" ? Number(d.numero_fdi) : Number(d))),
    ),
  ].filter((n) => !isNaN(n) && n > 0);

  if (normalizados.length === 0) return "Sin piezas asignadas";
  if (normalizados.length === 32) return "Toda la boca (32 piezas)";

  // Chequeo de arcadas completas
  const sonMismos = (arr1, arr2) =>
    arr1.length === arr2.length && arr1.every((v) => arr2.includes(v));

  if (sonMismos(normalizados, ARCADA_SUPERIOR)) return "Arcada Superior (16 piezas)";
  if (sonMismos(normalizados, ARCADA_INFERIOR)) return "Arcada Inferior (16 piezas)";

  // Chequeo de cuadrantes completos
  if (sonMismos(normalizados, CUADRANTES.q1)) return "Cuadrante 1 (8 piezas)";
  if (sonMismos(normalizados, CUADRANTES.q2)) return "Cuadrante 2 (8 piezas)";
  if (sonMismos(normalizados, CUADRANTES.q3)) return "Cuadrante 3 (8 piezas)";
  if (sonMismos(normalizados, CUADRANTES.q4)) return "Cuadrante 4 (8 piezas)";

  if (normalizados.length <= 4) {
    return `Piezas: ${normalizados.sort((a, b) => a - b).join(", ")}`;
  }

  return `${normalizados.length} piezas (${normalizados.sort((a, b) => a - b).join(", ")})`;
}

