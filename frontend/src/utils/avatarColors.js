/** @format */

export const PALETA_AVATAR = [
  { bg: "bg-emerald-100 dark:bg-emerald-950/70", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200/90 dark:border-emerald-800/60" },
  { bg: "bg-sky-100 dark:bg-sky-950/70", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200/90 dark:border-sky-800/60" },
  { bg: "bg-indigo-100 dark:bg-indigo-950/70", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200/90 dark:border-indigo-800/60" },
  { bg: "bg-amber-100 dark:bg-amber-950/70", text: "text-amber-800 dark:text-amber-300", border: "border-amber-200/90 dark:border-amber-800/60" },
  { bg: "bg-purple-100 dark:bg-purple-950/70", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200/90 dark:border-purple-800/60" },
  { bg: "bg-rose-100 dark:bg-rose-950/70", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200/90 dark:border-rose-800/60" },
  { bg: "bg-teal-100 dark:bg-teal-950/70", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200/90 dark:border-teal-800/60" },
  { bg: "bg-cyan-100 dark:bg-cyan-950/70", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200/90 dark:border-cyan-800/60" },
];

/**
 * Obtiene una combinación de colores armónica de acuerdo a la cadena de texto (nombre y apellido).
 * @param {string} str Cadena base para calcular el hash.
 * @returns {{ bg: string, text: string, border: string }}
 */
export function obtenerColorAvatar(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETA_AVATAR.length;
  return PALETA_AVATAR[index];
}

/**
 * Obtiene las iniciales del nombre y apellido (hasta 2 letras en mayúscula).
 * @param {string} nombre
 * @param {string} apellido
 * @param {string} fallback
 * @returns {string}
 */
export function obtenerIniciales(nombre = "", apellido = "", fallback = "P") {
  const i1 = nombre?.trim()?.charAt(0)?.toUpperCase() || "";
  const i2 = apellido?.trim()?.charAt(0)?.toUpperCase() || "";
  return i1 || i2 ? `${i1}${i2}` : fallback;
}

