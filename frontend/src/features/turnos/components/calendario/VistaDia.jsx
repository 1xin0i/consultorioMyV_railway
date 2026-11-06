/** @format */

import { User, Clock, Lock } from "lucide-react";
import useTurnoTouchClick from "../../hooks/useTurnoTouchClick";
import {
  SLOTS_HORAS as DEFAULT_SLOTS,
  SLOT_HEIGHT_DIA,
  esMismoDia,
  procesarTurnosColocacion,
  OBTENER_ESTILOS_ESTADO,
  formatHoraSimple,
} from "../../utils/agendaStyles";

const ItemTurnoDia = ({ turno, style, duracionMinutos, onEventClick }) => {
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
      className={`absolute pointer-events-auto px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs border cursor-pointer hover:shadow-md transition-all overflow-hidden flex flex-col justify-center z-10 ${estilos.bg} ${estilos.border} ${estilos.text}`}
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
            <span>{horaInicio} - {horaFin} hs</span>
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
};

export const VistaDia = ({
  fecha,
  turnos,
  slotsHoras = DEFAULT_SLOTS,
  horaInicioAgenda,
  esSlotPasado,
  esSlotBloqueado,
  obtenerRestriccionSlot,
  isSlotSelected,
  onSlotMouseDown,
  onSlotMouseEnter,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onEventClick,
}) => {
  const turnosDelDia = turnos.filter((t) => esMismoDia(t.fecha_hora_inicio, fecha));
  const horaInicioReal =
    horaInicioAgenda ??
    (slotsHoras && slotsHoras.length > 0
      ? parseInt(slotsHoras[0].split(":")[0], 10)
      : 8);
  const turnosPosicionados = procesarTurnosColocacion(
    turnosDelDia,
    SLOT_HEIGHT_DIA,
    horaInicioReal,
  );

  return (
    <div className="flex w-full min-w-0 bg-white">
      {/* Columna fija de horas */}
      <div className="w-14 md:w-20 shrink-0 border-r border-gray-200 select-none bg-gray-50/80">
        {slotsHoras.map((hora) => (
          <div
            key={hora}
            style={{ height: `${SLOT_HEIGHT_DIA}px` }}
            className="text-[11px] md:text-xs font-bold text-gray-700 p-1 md:p-2 border-b border-gray-200 flex items-center justify-center"
          >
            {hora}
          </div>
        ))}
      </div>

      {/* Columna de eventos y slots interactivos */}
      <div className="flex-1 relative min-w-0">
        {/* Grilla de slots de fondo */}
        {slotsHoras.map((hora) => {
          const pasado = esSlotPasado(fecha, hora);
          const bloqueado = esSlotBloqueado ? esSlotBloqueado(fecha, hora) : false;
          const restriccion = bloqueado && obtenerRestriccionSlot ? obtenerRestriccionSlot(fecha, hora) : null;
          const seleccion = isSlotSelected(fecha, hora);

          return (
            <div
              key={hora}
              data-slot-hora={hora}
              style={{ height: `${SLOT_HEIGHT_DIA}px` }}
              onMouseDown={(e) => onSlotMouseDown(e, fecha, hora)}
              onMouseEnter={() => onSlotMouseEnter(fecha, hora)}
              onTouchStart={(e) => onTouchStart(e, fecha, hora)}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              className={`w-full border-b border-gray-200 transition-colors select-none flex items-center px-3 justify-between ${
                bloqueado || pasado
                  ? "bg-slate-100/90 text-slate-600 cursor-not-allowed border-slate-200"
                  : "bg-white hover:bg-emerald-50/30 cursor-pointer"
              } ${seleccion ? "!bg-emerald-100/90" : ""}`}
            >
              {bloqueado && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Lock size={13} className="text-slate-600 shrink-0" />
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
};

export default VistaDia;
