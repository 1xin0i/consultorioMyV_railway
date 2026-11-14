/** @format */

import { useMemo, memo } from "react";
import { Clock, Lock } from "lucide-react";
import useTurnoTouchClick from "../../hooks/useTurnoTouchClick";
import {
  SLOTS_HORAS as DEFAULT_SLOTS,
  SLOT_HEIGHT_SEMANA,
  HORA_INICIO_AGENDA,
  esMismoDia,
  esSlotPasado as defaultEsSlotPasado,
  procesarTurnosColocacion,
  OBTENER_ESTILOS_ESTADO,
  formatHoraSimple,
} from "../../utils/agendaStyles";

const FMT_DIA_CORTO = new Intl.DateTimeFormat("es-AR", { weekday: "short" });

const ItemTurnoSemana = memo(function ItemTurnoSemana({
  turno,
  style,
  duracionMinutos,
  onEventClick,
}) {
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
      className={`absolute pointer-events-auto p-0.5 sm:p-1 md:p-1.5 text-[9px] sm:text-[10px] md:text-[11px] rounded sm:rounded-md shadow-2xs border truncate font-bold flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow z-10 overflow-hidden leading-tight ${estilos.bg} ${estilos.border} ${estilos.text}`}
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
});

export const VistaSemana = memo(function VistaSemana({
  setFechaActual,
  setVista,
  dias,
  diasSemana,
  turnos = [],
  ahora: ahoraProp,
  slotsHoras = DEFAULT_SLOTS,
  esSlotPasado,
  esSlotBloqueado,
  obtenerRestriccionSlot,
  esDiaLaboral,
  esDiaBloqueado,
  obtenerRestriccionDia,
  onBloquearDia,
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
  onSelectDay,
  estaDiaMarcado,
  iniciarPresionDia,
  moverPresionDiaMouse,
  moverPresionDiaTouch,
  debeIgnorarClickDia,
}) {
  const ahora = useMemo(() => ahoraProp || new Date(), [ahoraProp]);

  const diasArray = useMemo(() => dias || diasSemana || [], [dias, diasSemana]);
  const checkSlotPasado = esSlotPasado || defaultEsSlotPasado;

  const horaInicioAgenda =
    slotsHoras && slotsHoras.length > 0
      ? parseInt(slotsHoras[0].split(":")[0], 10)
      : HORA_INICIO_AGENDA;

  const ahoraMinutos =
    (ahora.getHours() - horaInicioAgenda) * 60 + ahora.getMinutes();
  const topActual = (ahoraMinutos * SLOT_HEIGHT_SEMANA) / 30;
  const totalHeight = slotsHoras.length * SLOT_HEIGHT_SEMANA;

  // Pre-calcular turnos posicionados y metadatos de cada día de la semana
  const datosDiasSemana = useMemo(() => {
    return diasArray.map((d) => {
      const esHoy = esMismoDia(d, ahora);
      const esDomingo = d.getDay() === 0;
      const diaLaboral = esDiaLaboral ? esDiaLaboral(d) : true;
      const bloqueado = esDiaBloqueado ? esDiaBloqueado(d) : false;
      const diaBloqueado = bloqueado || !diaLaboral;
      const restriccionDia =
        bloqueado && obtenerRestriccionDia
          ? obtenerRestriccionDia(d)
          : !diaLaboral
            ? { motivo: "Día no laboral" }
            : null;
      const nombreDia = FMT_DIA_CORTO.format(d).replace(".", "").toUpperCase();
      const turnosDelDia = turnos.filter((t) =>
        esMismoDia(t.fecha_hora_inicio, d),
      );
      const turnosPosicionados = procesarTurnosColocacion(
        turnosDelDia,
        SLOT_HEIGHT_SEMANA,
        horaInicioAgenda,
      );

      return {
        dia: d,
        isoKey: d.toISOString(),
        esHoy,
        esDomingo,
        diaLaboral,
        diaBloqueado,
        restriccionDia,
        nombreDia,
        turnosPosicionados,
      };
    });
  }, [
    diasArray,
    ahora,
    turnos,
    horaInicioAgenda,
    esDiaLaboral,
    esDiaBloqueado,
    obtenerRestriccionDia,
  ]);

  // Manejadores para el encabezado de días (clic rápido: ver día, mantener presionado: bloquear día)
  const handleHeaderClick = (dia) => {
    if (debeIgnorarClickDia?.()) return;
    if (onSelectDay) {
      onSelectDay(dia);
    } else if (setFechaActual && setVista) {
      setFechaActual(dia);
      setVista("dia");
    }
  };

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
    <div className="w-full h-full flex flex-col overflow-y-auto overflow-x-auto">
      <div className="w-full min-w-full md:min-w-max flex flex-col">
        {/* Cabecera de días de la semana */}
        <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-900 sticky top-0 z-20 w-full min-w-full">
          {/* Espaciador de horas */}
          <div className="w-8 sm:w-11 md:w-16 border-r border-gray-200 dark:border-slate-800 shrink-0 bg-gray-50 dark:bg-slate-900 select-none" />

          {/* Días a mostrar (Semana completa - 7 días estilo Google Calendar) */}
          {datosDiasSemana.map(
            ({
              dia: d,
              isoKey,
              esHoy,
              esDomingo,
              diaBloqueado,
              restriccionDia,
              nombreDia,
            }) => {
              const marcado = estaDiaMarcado ? estaDiaMarcado(d) : false;
              const fechaIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

              return (
                <div
                  key={isoKey}
                  data-dia-iso={fechaIso}
                  onMouseDown={(e) => iniciarPresionDia?.(d, e)}
                  onMouseEnter={() => moverPresionDiaMouse?.(d)}
                  onTouchStart={(e) => iniciarPresionDia?.(d, e)}
                  onTouchMove={moverPresionDiaTouch}
                  onClick={() => handleHeaderClick(d)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onBloquearDia?.(d, d);
                  }}
                  title={
                    diaBloqueado
                      ? `Día bloqueado: ${restriccionDia?.motivo || "Cerrado"}`
                      : "Clic: ver día | Mantener presionado y arrastrar: bloquear días"
                  }
                  className={`flex-1 min-w-[34px] md:min-w-[100px] text-center py-1 px-0.5 sm:py-1.5 sm:px-1 md:p-2 border-r border-gray-200 dark:border-slate-800 last:border-r-0 select-none cursor-pointer transition-colors ${
                    marcado
                      ? "ring-2 ring-inset ring-black dark:ring-white bg-slate-200/90 dark:bg-slate-800 z-10"
                      : diaBloqueado
                        ? "bg-slate-200/90 dark:bg-slate-950/80 text-slate-700 dark:text-slate-400"
                        : esHoy
                          ? "bg-emerald-50/70 dark:bg-emerald-950/40"
                          : "bg-gray-50 dark:bg-slate-900 hover:bg-gray-200/70 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <p
                      className={`text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider truncate ${
                        diaBloqueado
                          ? "text-slate-600 dark:text-slate-400"
                          : esHoy
                            ? "text-emerald-700 dark:text-emerald-400 font-extrabold"
                            : esDomingo
                              ? "text-rose-500 font-bold"
                              : "text-gray-500 dark:text-slate-400"
                      }`}
                    >
                      {nombreDia}
                    </p>
                    {diaBloqueado && (
                      <Lock
                        size={10}
                        className="text-slate-600 dark:text-slate-400 shrink-0"
                      />
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
                            ? "text-slate-600 dark:text-slate-400"
                            : esDomingo
                              ? "text-rose-600"
                              : "text-gray-800 dark:text-slate-200"
                        }`}
                      >
                        {d.getDate()}
                      </span>
                    )}
                  </div>

                  {diaBloqueado && restriccionDia?.motivo && (
                    <p className="text-[8px] sm:text-[9px] font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-[85px] sm:max-w-none mx-auto">
                      {restriccionDia.motivo}
                    </p>
                  )}
                </div>
              );
            },
          )}
        </div>

        {/* Cuerpo de la grilla semanal */}
        <div className="flex relative w-full min-w-full">
          {/* Columna fija de horas */}
          <div className="w-8 sm:w-11 md:w-16 shrink-0 border-r border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/60 select-none">
            {slotsHoras.map((hora) => (
              <div
                key={hora}
                style={{ height: `${SLOT_HEIGHT_SEMANA}px` }}
                className="text-[9px] sm:text-[10px] md:text-xs font-semibold md:font-bold text-gray-700 dark:text-slate-300 p-0.5 md:p-1 border-b border-gray-200 dark:border-slate-800 flex items-center justify-center"
              >
                {hora}
              </div>
            ))}
          </div>

          {/* Columnas para cada día */}
          {datosDiasSemana.map(
            ({
              dia,
              isoKey,
              esHoy,
              diaBloqueado,
              restriccionDia,
              turnosPosicionados,
            }) => (
              <div
                key={isoKey}
                className={`flex-1 min-w-[34px] md:min-w-[100px] border-r border-gray-200 dark:border-slate-800 last:border-r-0 relative ${
                  diaBloqueado ? "bg-slate-100/60 dark:bg-slate-950/60" : ""
                }`}
              >
                {/* Slots del día de fondo */}
                {slotsHoras.map((hora, idx) => {
                  const pasado = checkSlotPasado(dia, hora);
                  const bloqueado = esSlotBloqueado
                    ? esSlotBloqueado(dia, hora)
                    : false;
                  const restriccion =
                    bloqueado && obtenerRestriccionSlot
                      ? obtenerRestriccionSlot(dia, hora)
                      : null;
                  const seleccion = checkSlotSeleccionado(dia, hora, idx);

                  return (
                    <div
                      key={hora}
                      data-slot-idx={idx}
                      data-slot-hora={hora}
                      style={{ height: `${SLOT_HEIGHT_SEMANA}px` }}
                      onMouseDown={(e) => handleMouseDown(e, dia, hora, idx)}
                      onMouseEnter={() => handleMouseEnter(dia, hora, idx)}
                      onTouchStart={(e) => handleTouchStart(e, dia, hora, idx)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      title={
                        diaBloqueado
                          ? `Día bloqueado: ${restriccionDia?.motivo || "Cerrado"}`
                          : restriccion?.motivo ||
                            (bloqueado ? "Horario Bloqueado" : "")
                      }
                      className={`border-b border-gray-200 dark:border-slate-800 transition-colors select-none flex items-center justify-center ${
                        pasado
                          ? "bg-slate-100/90 dark:bg-slate-950/70 cursor-not-allowed border-slate-200 dark:border-slate-800"
                          : diaBloqueado
                            ? "bg-slate-100/60 dark:bg-slate-950/60 border-slate-200/70 dark:border-slate-800/70 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-900/50"
                            : bloqueado
                              ? "bg-slate-100/90 dark:bg-slate-950/70 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 cursor-pointer border-slate-200 dark:border-slate-800"
                              : "bg-white dark:bg-slate-900 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/30 cursor-pointer"
                      } ${seleccion ? "!bg-emerald-100/90 dark:!bg-emerald-900/60" : ""}`}
                    />
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
            ),
          )}
        </div>
      </div>
    </div>
  );
});

export default VistaSemana;
