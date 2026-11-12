/** @format */

export const ESTILO_AVATAR = {
  bg: "bg-slate-100 dark:bg-slate-800",
  text: "text-slate-600 dark:text-slate-300",
  border: "border-slate-200 dark:border-slate-700",
};

export const PALETA_AVATAR = [ESTILO_AVATAR];

/**
 * Obtiene el estilo de avatar unificado para pacientes y usuarios.
 * @returns {{ bg: string, text: string, border: string }}
 */
export function obtenerColorAvatar() {
  return ESTILO_AVATAR;
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

