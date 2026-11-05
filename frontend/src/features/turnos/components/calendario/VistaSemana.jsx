/** @format */

import { useState, useEffect, useRef } from "react";
import { Clock, Lock } from "lucide-react";
import useTurnoTouchClick from "../../hooks/useTurnoTouchClick";
import {
  SLOTS_HORAS as DEFAULT_SLOTS,
  SLOT_HEIGHT_SEMANA,
  HORA_INICIO_AGENDA,
  esMismoDia,
  procesarTurnosColocacion,
  OBTENER_ESTILOS_ESTADO,
  formatHoraSimple,
} from "../../utils/agendaStyles";

const ItemTurnoSemana = ({ turno, style, duracionMinutos, onEventClick }) => {
  const touchProps = useTurnoTouchClick(turno, onEventClick);
  const estado = turno.EstadoTurno?.estado || "Programado";
  const estilos = OBTENER_ESTILOS_ESTADO(estado);
  const paciente = turno.Paciente
    ? `${turno.Paciente.nombre} ${turno.Paciente.apellido}`
    : `Paciente #${turno.id_paciente}`;
  const horaInicio = formatHoraSimple(turno.fecha_hora_inicio);
  const horaFin = formatHoraSimple(turno.fecha_hora_fin);

  return (
    <div
      style={style}
      {...touchProps}
      title={`${paciente} (${horaInicio} - ${horaFin} hs) - ${estado}`}
      className={`absolute pointer-events-auto p-0.5 sm:p-1 md:p-1.5 text-[9px] sm:text-[10px] md:text-[11px] rounded sm:rounded-md shadow-2xs border truncate font-bold flex flex-col justify-between cursor-pointer hover:shadow-md transition-all z-10 overflow-hidden leading-tight ${estilos.bg} ${estilos.border} ${estilos.text}`}
    >
      <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
        <span
          className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0 ${estilos.indicator}`}
        />
        <span className="truncate">{paciente}</span>
      </div>

      {duracionMinutos >= 45 && (
        <div className="flex items-center gap-0.5 text-[8px] sm:text-[9px] md:text-[10px] opacity-80 font-normal truncate mt-0.5">
          <Clock size={9} className="shrink-0 hidden sm:inline" />
          <span className="truncate">
            {horaInicio} - {horaFin}
          </span>
        </div>
      )}
    </div>
  );
};

export const VistaSemana = ({
  fechaActual,
  setFechaActual,
  setVista,
  dias,
  turnos,
  slotsHoras = DEFAULT_SLOTS,
  esSlotPasado,
  esSlotBloqueado,
  obtenerRestriccionSlot,
  esDiaBloqueado,
  obtenerRestriccionDia,
  onBloquearDia,
  isSlotSelected,
  onSlotMouseDown,
  onSlotMouseEnter,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onEventClick,
}) => {
  const [ahora, setAhora] = useState(new Date());
  const timerHeaderRef = useRef(null);
  const huboHoldingHeaderRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setAhora(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const horaInicioAgenda =
    slotsHoras && slotsHoras.length > 0
      ? parseInt(slotsHoras[0].split(":")[0], 10)
      : HORA_INICIO_AGENDA;

  const ahoraMinutos =
    (ahora.getHours() - horaInicioAgenda) * 60 + ahora.getMinutes();
  const topActual = (ahoraMinutos * SLOT_HEIGHT_SEMANA) / 30;
  const totalHeight = slotsHoras.length * SLOT_HEIGHT_SEMANA;

  // Manejadores para el encabezado de días (clic rápido: ver día, mantener presionado: bloquear día)
  const handleHeaderMouseDown = (e, dia) => {
    if (e.button !== 0 || !dia) return;
    huboHoldingHeaderRef.current = false;
    if (timerHeaderRef.current) clearTimeout(timerHeaderRef.current);

    timerHeaderRef.current = setTimeout(() => {
      huboHoldingHeaderRef.current = true;
      if (window.navigator?.vibrate) window.navigator.vibrate(30);
      onBloquearDia?.(dia, dia);
    }, 280);
  };

  const handleHeaderMouseUp = () => {
    if (timerHeaderRef.current) clearTimeout(timerHeaderRef.current);
  };

  const handleHeaderClick = (dia) => {
    if (huboHoldingHeaderRef.current) {
      huboHoldingHeaderRef.current = false;
      return;
    }
    if (setFechaActual && setVista) {
      setFechaActual(dia);
      setVista("dia");
    }
  };

  const handleHeaderTouchStart = (e, dia) => {
    huboHoldingHeaderRef.current = false;
    if (timerHeaderRef.current) clearTimeout(timerHeaderRef.current);

    timerHeaderRef.current = setTimeout(() => {
      huboHoldingHeaderRef.current = true;
      if (window.navigator?.vibrate) window.navigator.vibrate(30);
      onBloquearDia?.(dia, dia);
    }, 280);
  };

  const handleHeaderTouchEnd = (e, dia) => {
    if (timerHeaderRef.current) clearTimeout(timerHeaderRef.current);
    if (huboHoldingHeaderRef.current) {
      setTimeout(() => {
        huboHoldingHeaderRef.current = false;
      }, 400);
      return;
    }
    if (setFechaActual && setVista) {
      setFechaActual(dia);
      setVista("dia");
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto overflow-x-auto">
      <div className="w-full min-w-full md:min-w-max flex flex-col">
        {/* Cabecera de días de la semana */}
        <div className="flex border-b border-gray-200 bg-gray-100 sticky top-0 z-20 w-full min-w-full">
          {/* Espaciador de horas */}
          <div className="w-8 sm:w-11 md:w-16 border-r border-gray-200 shrink-0 bg-gray-50 select-none" />

          {/* Días a mostrar (Semana completa - 7 días estilo Google Calendar) */}
          {dias.map((d) => {
            const esHoy = d.toDateString() === new Date().toDateString();
            const esDomingo = d.getDay() === 0;
            const diaBloqueado = esDiaBloqueado ? esDiaBloqueado(d) : false;
            const restriccionDia = diaBloqueado && obtenerRestriccionDia ? obtenerRestriccionDia(d) : null;
            const nombreDia = d
              .toLocaleDateString("es-AR", { weekday: "short" })
              .replace(".", "")
              .toUpperCase();

            return (
              <div
                key={d.toISOString()}
                onMouseDown={(e) => handleHeaderMouseDown(e, d)}
                onMouseUp={handleHeaderMouseUp}
                onClick={() => handleHeaderClick(d)}
                onTouchStart={(e) => handleHeaderTouchStart(e, d)}
                onTouchEnd={(e) => handleHeaderTouchEnd(e, d)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onBloquearDia?.(d, d);
                }}
                title={
                  diaBloqueado
                    ? `Día bloqueado: ${restriccionDia?.motivo || "Cerrado"} (Clic derecho o mantener presionado para gestionar)`
                    : "Clic: ver día | Mantener presionado o clic derecho: bloquear día"
                }
                className={`flex-1 min-w-[34px] md:min-w-[100px] text-center py-1 px-0.5 sm:py-1.5 sm:px-1 md:p-2 border-r border-gray-200 last:border-r-0 select-none cursor-pointer hover:bg-gray-200/70 transition-colors ${
                  diaBloqueado
                    ? "bg-slate-200/90 text-slate-700"
                    : esHoy
                      ? "bg-emerald-50/70"
                      : "bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <p
                    className={`text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider truncate ${
                      diaBloqueado
                        ? "text-slate-600"
                        : esHoy
                          ? "text-emerald-700 font-extrabold"
                          : esDomingo
                            ? "text-rose-500 font-bold"
                            : "text-gray-500"
                    }`}
                  >
                    {nombreDia}
                  </p>
                  {diaBloqueado && (
                    <Lock size={10} className="text-slate-600 shrink-0" />
                  )}
                </div>

                <div className="flex items-center justify-center mt-0.5">
                  {esHoy ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#2eb086] text-white font-extrabold text-[10px] sm:text-xs shadow-xs">
                      {d.getDate()}
                    </span>
                  ) : (
                    <span
                      className={`text-[11px] sm:text-xs md:text-sm font-extrabold ${
                        diaBloqueado
                          ? "text-slate-600"
                          : esDomingo
                            ? "text-rose-600"
                            : "text-gray-800"
                      }`}
                    >
                      {d.getDate()}
                    </span>
                  )}
                </div>

                {diaBloqueado && restriccionDia?.motivo && (
                  <p className="hidden md:block text-[9px] font-semibold text-slate-500 truncate mt-0.5">
                    {restriccionDia.motivo}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Cuerpo de la grilla semanal */}
        <div className="flex relative w-full min-w-full">
          {/* Columna fija de horas */}
          <div className="w-8 sm:w-11 md:w-16 shrink-0 border-r border-gray-200 bg-gray-50/80 select-none">
            {slotsHoras.map((hora) => (
              <div
                key={hora}
                style={{ height: `${SLOT_HEIGHT_SEMANA}px` }}
                className="text-[9px] sm:text-[10px] md:text-xs font-semibold md:font-bold text-gray-700 p-0.5 md:p-1 border-b border-gray-200 flex items-center justify-center"
              >
                {hora}
              </div>
            ))}
          </div>

          {/* Columnas para cada día */}
          {dias.map((dia) => {
            const esHoy = esMismoDia(dia, ahora);
            const diaBloqueado = esDiaBloqueado ? esDiaBloqueado(dia) : false;
            const turnosDelDia = turnos.filter((t) =>
              esMismoDia(t.fecha_hora_inicio, dia),
            );
            const turnosPosicionados = procesarTurnosColocacion(
              turnosDelDia,
              SLOT_HEIGHT_SEMANA,
              horaInicioAgenda,
            );

            return (
              <div
                key={dia.toISOString()}
                className={`flex-1 min-w-[34px] md:min-w-[100px] border-r border-gray-200 last:border-r-0 relative ${
                  diaBloqueado ? "bg-slate-100/50" : ""
                }`}
              >
                {/* Slots del día de fondo */}
                {slotsHoras.map((hora) => {
                  const pasado = esSlotPasado(dia, hora);
                  const bloqueado = esSlotBloqueado
                    ? esSlotBloqueado(dia, hora)
                    : false;
                  const restriccion =
                    bloqueado && obtenerRestriccionSlot
                      ? obtenerRestriccionSlot(dia, hora)
                      : null;
                  const seleccion = isSlotSelected(dia, hora);

                  return (
                    <div
                      key={hora}
                      data-slot-hora={hora}
                      style={{ height: `${SLOT_HEIGHT_SEMANA}px` }}
                      onMouseDown={(e) => onSlotMouseDown(e, dia, hora)}
                      onMouseEnter={() => onSlotMouseEnter(dia, hora)}
                      onTouchStart={(e) => onTouchStart(e, dia, hora)}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                      title={restriccion?.motivo || (bloqueado ? "Bloqueado" : "")}
                      className={`border-b border-gray-200 transition-colors select-none flex items-center justify-center ${
                        bloqueado
                          ? "bg-slate-200/90 cursor-not-allowed border-slate-300"
                          : pasado
                            ? "bg-slate-100/70 cursor-not-allowed opacity-75"
                            : "bg-white hover:bg-emerald-50/30 cursor-pointer"
                      } ${seleccion ? "!bg-emerald-100/90" : ""}`}
                    >
                      {bloqueado && (
                        <Lock size={10} className="text-slate-600/80" />
                      )}
                    </div>
                  );
                })}

                {/* Línea indicadora de hora actual si es el día de hoy (estilo Google Calendar) */}
                {esHoy && topActual >= 0 && topActual <= totalHeight && (
                  <div
                    style={{ top: `${topActual}px` }}
                    className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 -ml-0.5 shrink-0" />
                    <div className="h-[2px] w-full bg-red-500 shadow-xs" />
                  </div>
                )}

                {/* Capa flotante de turnos del día */}
                <div className="absolute inset-0 pointer-events-none">
                  {turnosPosicionados.map(
                    ({ turno, style, duracionMinutos }) => (
                      <ItemTurnoSemana
                        key={turno.id_turno}
                        turno={turno}
                        style={style}
                        duracionMinutos={duracionMinutos}
                        onEventClick={onEventClick}
                      />
                    ),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VistaSemana;
