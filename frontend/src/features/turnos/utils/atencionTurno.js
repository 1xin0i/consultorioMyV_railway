/** @format */

// Un turno solo se marca como atendido si ya empezó o empieza dentro de este margen.
export const MINUTOS_ANTES_PARA_ATENDER = 30;

export const MENSAJE_ATENCION_ANTICIPADA = `Solo se puede marcar como atendido un turno que ya empezó o que empieza en los próximos ${MINUTOS_ANTES_PARA_ATENDER} minutos.`;

export const puedeMarcarseAtendido = (turno) => {
  const inicio = new Date(turno?.fecha_hora_inicio).getTime();
  if (isNaN(inicio)) return true;
  return inicio - Date.now() <= MINUTOS_ANTES_PARA_ATENDER * 60000;
};
