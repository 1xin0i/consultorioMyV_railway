/** @format */

/**
 * Convierte "YYYY-MM" en el rango [primer instante, último instante] de ese mes (hora local).
 * Devuelve null si el formato no es válido.
 */
export const rangoDeMes = (mesStr) => {
  const partes = mesStr.split("-");
  if (partes.length !== 2) return null;

  const year = parseInt(partes[0], 10);
  const month = parseInt(partes[1], 10);
  if (isNaN(year) || isNaN(month)) return null;

  return {
    inicio: new Date(year, month - 1, 1, 0, 0, 0, 0),
    fin: new Date(year, month, 0, 23, 59, 59, 999),
  };
};

