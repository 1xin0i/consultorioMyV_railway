/** @format */

/**
 * Paleta de colores suaves estilo Google / SaaS médico para avatares de iniciales.
 * El color se asigna de forma determinística según el nombre del paciente,
 * para que cada paciente conserve siempre el mismo color en toda la app.
 */
const AVATAR_PALETTE = [
  {
    bg: "bg-teal-100",
    text: "text-teal-800",
    border: "border-teal-200/80",
  },
  {
    bg: "bg-sky-100",
    text: "text-sky-800",
    border: "border-sky-200/80",
  },
  {
    bg: "bg-indigo-100",
    text: "text-indigo-800",
    border: "border-indigo-200/80",
  },
  {
    bg: "bg-violet-100",
    text: "text-violet-800",
    border: "border-violet-200/80",
  },
  {
    bg: "bg-rose-100",
    text: "text-rose-800",
    border: "border-rose-200/80",
  },
  {
    bg: "bg-amber-100",
    text: "text-amber-800",
    border: "border-amber-200/80",
  },
  {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    border: "border-emerald-200/80",
  },
  {
    bg: "bg-cyan-100",
    text: "text-cyan-800",
    border: "border-cyan-200/80",
  },
];

export function obtenerColorAvatar(texto = "") {
  const str = String(texto).trim().toLowerCase();
  if (!str) return AVATAR_PALETTE[0];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

export function obtenerIniciales(nombre = "", apellido = "") {
  const n = String(nombre).trim().charAt(0).toUpperCase();
  const a = String(apellido).trim().charAt(0).toUpperCase();
  return `${n}${a}` || "P";
}

