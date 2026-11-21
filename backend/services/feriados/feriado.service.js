/** @format */

/**
 * Feriados nacionales de Argentina.
 * Fuente: API pública de ArgentinaDatos (gratuita, sin clave).
 * Se guardan en memoria 24 h por año, para no consultar el servicio externo en cada carga.
 * Si el servicio no responde, se usa una lista de respaldo, así la agenda nunca queda sin feriados.
 */

const URL_API = "https://api.argentinadatos.com/v1/feriados";
const DURACION_CACHE_MS = 24 * 60 * 60 * 1000;
const DURACION_CACHE_RESPALDO_MS = 10 * 60 * 1000;

// Calendario oficial 2026 (incluye los días no laborables con fines turísticos).
const RESPALDO = {
  2026: [
    { fecha: "2026-01-01", tipo: "inamovible", nombre: "Año nuevo" },
    { fecha: "2026-02-16", tipo: "inamovible", nombre: "Carnaval" },
    { fecha: "2026-02-17", tipo: "inamovible", nombre: "Carnaval" },
    { fecha: "2026-03-23", tipo: "puente", nombre: "Día no laborable con fines turísticos" },
    { fecha: "2026-03-24", tipo: "inamovible", nombre: "Día Nacional de la Memoria por la Verdad y la Justicia" },
    { fecha: "2026-04-02", tipo: "inamovible", nombre: "Día del Veterano y de los Caídos en la Guerra de Malvinas" },
    { fecha: "2026-04-03", tipo: "inamovible", nombre: "Viernes Santo" },
    { fecha: "2026-05-01", tipo: "inamovible", nombre: "Día del Trabajador" },
    { fecha: "2026-05-25", tipo: "inamovible", nombre: "Día de la Revolución de Mayo" },
    { fecha: "2026-06-15", tipo: "trasladable", nombre: "Paso a la Inmortalidad del General Martín Miguel de Güemes" },
    { fecha: "2026-06-20", tipo: "inamovible", nombre: "Paso a la Inmortalidad del General Manuel Belgrano" },
    { fecha: "2026-07-09", tipo: "inamovible", nombre: "Día de la Independencia" },
    { fecha: "2026-07-10", tipo: "puente", nombre: "Día no laborable con fines turísticos" },
    { fecha: "2026-08-17", tipo: "trasladable", nombre: "Paso a la Inmortalidad del General José de San Martín" },
    { fecha: "2026-10-12", tipo: "trasladable", nombre: "Día del Respeto a la Diversidad Cultural" },
    { fecha: "2026-11-23", tipo: "trasladable", nombre: "Día de la Soberanía Nacional" },
    { fecha: "2026-12-07", tipo: "puente", nombre: "Día no laborable con fines turísticos" },
    { fecha: "2026-12-08", tipo: "inamovible", nombre: "Día de la Inmaculada Concepción de María" },
    { fecha: "2026-12-25", tipo: "inamovible", nombre: "Navidad" },
  ],
};

const cache = new Map(); // anio -> { feriados, vence }

const normalizar = (lista) =>
  (Array.isArray(lista) ? lista : [])
    .filter((f) => f && /^\d{4}-\d{2}-\d{2}$/.test(String(f.fecha)))
    .map((f) => ({
      fecha: String(f.fecha),
      nombre: String(f.nombre || "Feriado"),
      tipo: String(f.tipo || "inamovible"),
    }));

export const obtenerFeriados = async (anio) => {
  const guardado = cache.get(anio);
  if (guardado && guardado.vence > Date.now()) return guardado.feriados;

  try {
    const res = await fetch(`${URL_API}/${anio}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const feriados = normalizar(await res.json());
    cache.set(anio, { feriados, vence: Date.now() + DURACION_CACHE_MS });
    return feriados;
  } catch (error) {
    console.warn(`Feriados ${anio}: se usa la lista de respaldo (${error.message})`);
    const feriados = normalizar(RESPALDO[anio]);
    cache.set(anio, { feriados, vence: Date.now() + DURACION_CACHE_RESPALDO_MS });
    return feriados;
  }
};
