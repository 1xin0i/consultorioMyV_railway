/** @format */

import { useMemo, memo } from "react";
import { User, Clock, Lock } from "lucide-react";
import useTurnoTouchClick from "../../hooks/useTurnoTouchClick";
import {
  SLOTS_HORAS as DEFAULT_SLOTS,
  SLOT_HEIGHT_DIA,
  esMismoDia,
  esSlotPasado as defaultEsSlotPasado,
  procesarTurnosColocacion,
  OBTENER_ESTILOS_ESTADO,
  formatHoraSimple,
} from "../../utils/agendaStyles";

const ItemTurnoDia = memo(function ItemTurnoDia({
  turno,
  style,
  duracionMinutos,
  onEventClick,
}) {
  const touchProps = useTurnoTouchClick(turno, onEventClick);
  const estado = turno.EstadoTurno?.estado || "Programado";
  const estilos = OBTENER_ESTILOS_ESTADO(estado);
  const IconoEstado = estilos.icon;
  const paciente = turno.Paciente
    ? `${turno.Paciente.nombre} ${turno.Paciente.apellido}`
    : `Paciente #${turno.id_paciente}`;
  const horaInicio = formatHoraSimple(turno.fecha_hora_inicio);
  const horaFin = formatHoraSimple(turno.fecha_hora_fin);

  return (
    <div
      style={style}
      {...touchProps}
      className={`absolute pointer-events-auto px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs border cursor-pointer hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-center z-10 ${estilos.bg} ${estilos.border} ${estilos.text}`}
    >
      <div className="flex flex-col justify-center gap-1 min-w-0">
        {/* Fila superior: Paciente y Badge de Estado */}
        <div className="flex items-center justify-between gap-2 min-w-0 leading-tight">
          <span className="flex items-center gap-1.5 font-bold tracking-wide truncate text-xs sm:text-sm">
            <User size={14} className="shrink-0 opacity-80" />
            <span className="truncate">{paciente}</span>
          </span>
          <span
            className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 ${estilos.badge}`}
          >
            <IconoEstado size={11} />
            <span>{estado}</span>
          </span>
        </div>

        {/* Fila inferior: Horarios, Duración y Notas */}
        <div className="flex items-center gap-2.5 text-[11px] sm:text-xs opacity-85 font-normal leading-tight">
          <span className="flex items-center gap-1 font-medium">
            <Clock size={12} className="shrink-0" />
            <span>
              {horaInicio} - {horaFin} hs
            </span>
          </span>
          {duracionMinutos > 30 && (
            <span className="text-[10px] font-semibold bg-white/70 px-1.5 py-0.2 rounded border border-gray-200/50">
              {duracionMinutos >= 60
                ? `${duracionMinutos / 60}h`
                : `${duracionMinutos}m`}
            </span>
          )}
          {turno.notas_consulta && (
            <span className="text-[11px] opacity-80 truncate italic border-l border-gray-300/80 pl-2">
              {turno.notas_consulta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export const VistaDia = memo(function VistaDia({
  fecha,
  fechaActual,
  turnos = [],
  slotsHoras = DEFAULT_SLOTS,
  horaInicioAgenda,
  esSlotPasado,
  esSlotBloqueado,
  obtenerRestriccionSlot,
  isSlotSelected,
  estaSeleccionado,
  onSlotMouseDown,
  iniciarSeleccion,
  onSlotMouseEnter,
  moverSeleccion,
  onTouchStart,
  handleSlotTouchStart,
  onTouchMove,
  handleSlotTouchMove,
  onTouchEnd,
  handleSlotTouchEnd,
  onEventClick,
}) {
  const fechaEfectiva = useMemo(
    () => fecha || fechaActual || new Date(),
    [fecha, fechaActual],
  );
  const checkSlotPasado = esSlotPasado || defaultEsSlotPasado;

  const horaInicioReal =
    horaInicioAgenda ??
    (slotsHoras && slotsHoras.length > 0
      ? parseInt(slotsHoras[0].split(":")[0], 10)
      : 8);

  const turnosPosicionados = useMemo(() => {
    const turnosDelDia = turnos.filter((t) =>
      esMismoDia(t.fecha_hora_inicio, fechaEfectiva),
    );
    return procesarTurnosColocacion(
      turnosDelDia,
      SLOT_HEIGHT_DIA,
      horaInicioReal,
    );
  }, [turnos, fechaEfectiva, horaInicioReal]);

  const checkSlotSeleccionado = (d, h, idx) => {
    if (typeof isSlotSelected === "function") return isSlotSelected(d, h);
    if (typeof estaSeleccionado === "function") return estaSeleccionado(d, idx);
    return false;
  };

  const handleMouseDown = (e, d, h, idx) => {
    if (onSlotMouseDown) return onSlotMouseDown(e, d, h);
    if (iniciarSeleccion) return iniciarSeleccion(d, idx, e);
  };

  const handleMouseEnter = (d, h, idx) => {
    if (onSlotMouseEnter) return onSlotMouseEnter(d, h);
    if (moverSeleccion) return moverSeleccion(d, idx);
  };

  const handleTouchStart = (e, d, h, idx) => {
    if (onTouchStart) return onTouchStart(e, d, h);
    if (handleSlotTouchStart) return handleSlotTouchStart(d, idx, e);
  };

  const handleTouchMove = onTouchMove || handleSlotTouchMove;
  const handleTouchEnd = onTouchEnd || handleSlotTouchEnd;

  return (
    <div className="flex w-full min-w-0 bg-white dark:bg-slate-900">
      {/* Columna fija de horas */}
      <div className="w-14 md:w-20 shrink-0 border-r border-gray-200 dark:border-slate-800 select-none bg-gray-50/80 dark:bg-slate-800/60">
        {slotsHoras.map((hora) => (
          <div
            key={hora}
            style={{ height: `${SLOT_HEIGHT_DIA}px` }}
            className="text-[11px] md:text-xs font-bold text-gray-700 dark:text-slate-300 p-1 md:p-2 border-b border-gray-200 dark:border-slate-800 flex items-center justify-center"
          >
            {hora}
          </div>
        ))}
      </div>

      {/* Columna de eventos y slots interactivos */}
      <div className="flex-1 relative min-w-0">
        {/* Grilla de slots de fondo */}
        {slotsHoras.map((hora, idx) => {
          const pasado = checkSlotPasado(fechaEfectiva, hora);
          const bloqueado = esSlotBloqueado
            ? esSlotBloqueado(fechaEfectiva, hora)
            : false;
          const restriccion =
            bloqueado && obtenerRestriccionSlot
              ? obtenerRestriccionSlot(fechaEfectiva, hora)
              : null;
          const seleccion = checkSlotSeleccionado(fechaEfectiva, hora, idx);

          return (
            <div
              key={hora}
              data-slot-idx={idx}
              data-slot-hora={hora}
              style={{ height: `${SLOT_HEIGHT_DIA}px` }}
              onMouseDown={(e) => handleMouseDown(e, fechaEfectiva, hora, idx)}
              onMouseEnter={() => handleMouseEnter(fechaEfectiva, hora, idx)}
              onTouchStart={(e) => handleTouchStart(e, fechaEfectiva, hora, idx)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`w-full border-b border-gray-200 dark:border-slate-800 transition-colors select-none flex items-center px-3 justify-between ${
                pasado
                  ? "bg-slate-100/90 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-800"
                  : bloqueado
                    ? "bg-slate-100/90 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 cursor-pointer border-slate-200 dark:border-slate-800"
                    : "bg-white dark:bg-slate-900 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/30 cursor-pointer"
              } ${seleccion ? "!bg-emerald-100/90 dark:!bg-emerald-900/60" : ""}`}
            >
              {bloqueado && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Lock
                    size={13}
                    className="text-slate-600 dark:text-slate-400 shrink-0"
                  />
                  <span className="truncate">
                    {restriccion?.motivo || "Horario Bloqueado"}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Capa flotante de turnos superpuestos según su duración exacta */}
        <div className="absolute inset-0 pointer-events-none">
          {turnosPosicionados.map(({ turno, style, duracionMinutos }) => (
            <ItemTurnoDia
              key={turno.id_turno}
              turno={turno}
              style={style}
              duracionMinutos={duracionMinutos}
              onEventClick={onEventClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default VistaDia;
