/** @format */

import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { Lock } from "lucide-react";
import { OBTENER_ESTILOS_OCUPACION_MES } from "../../utils/agendaStyles";
import { useConfiguracion } from "../../../../context/ConfiguracionContext";
import ModalRestriccion from "../modales/ModalRestriccion";

const toDateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const VistaMes = memo(function VistaMes({
  fecha,
  turnos,
  ahora,
  setFechaActual,
  setVista,
  agregarRestriccion,
  eliminarRestriccion,
  esDiaBloqueado,
  obtenerRestriccionDia,
  obtenerRestriccionesDeFecha,
  onDragStart,
  onDragEnd,
}) {
  const { totalModulosDia, duracionModuloMinutos } = useConfiguracion();
  const capacidadDia = totalModulosDia || 24;
  const duracionModulo = Number(duracionModuloMinutos) || 30;

  const [modalAbierto, setModalAbierto] = useState(false);
  const [rangoModal, setRangoModal] = useState({
    inicio: new Date(),
    fin: new Date(),
  });
  const [seleccionDrag, setSeleccionDragState] = useState(null); // { inicio: Date, fin: Date }
  const [isHolding, setIsHolding] = useState(false);

  const gridContainerRef = useRef(null);
  const touchTimerRef = useRef(null);
  const mouseTimerRef = useRef(null);
  const huboHoldingRef = useRef(false);
  const huboHoldingMouseRef = useRef(false);
  const isMouseDownRef = useRef(false);
  const mouseStartDiaRef = useRef(null);
  const seleccionDragRef = useRef(null);
  const onDragEndRef = useRef(onDragEnd);

  useEffect(() => {
    onDragEndRef.current = onDragEnd;
  }, [onDragEnd]);

  const setSeleccionDrag = useCallback((val) => {
    seleccionDragRef.current = val;
    setSeleccionDragState(val);
  }, []);

  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    dia: null,
    isHolding: false,
    isScrolling: false,
  });

  // Pre-agrupar turnos del mes por clave YYYY-MM-DD en una sola pasada O(N)
  const estadisticasTurnosPorDia = useMemo(() => {
    const mapa = new Map();
    if (!turnos || turnos.length === 0) return mapa;

    const yearMes = fecha.getFullYear();
    const monthMes = fecha.getMonth();

    for (let i = 0; i < turnos.length; i++) {
      const t = turnos[i];
      if (!t.fecha_hora_inicio) continue;
      const dInicio = new Date(t.fecha_hora_inicio);
      if (
        dInicio.getFullYear() !== yearMes ||
        dInicio.getMonth() !== monthMes
      ) {
        continue;
      }

      const key = toDateKey(dInicio);
      let entry = mapa.get(key);
      if (!entry) {
        entry = { cantTurnos: 0, modulosOcupados: 0 };
        mapa.set(key, entry);
      }

      let minutos = 0;
      if (t.fecha_hora_fin) {
        const diffMs =
          new Date(t.fecha_hora_fin).getTime() - dInicio.getTime();
        if (diffMs > 0) {
          minutos = Math.round(diffMs / 60000);
        }
      }
      if (!minutos && t.duracion_minutos) {
        minutos = Number(t.duracion_minutos);
      }
      const modulosTurno =
        minutos > 0 ? Math.max(1, Math.round(minutos / duracionModulo)) : 1;

      entry.cantTurnos += 1;
      entry.modulosOcupados += modulosTurno;
    }

    return mapa;
  }, [turnos, fecha, duracionModulo]);

  // Pre-calcular la grilla completa del mes (evita recalcular en cada frame de drag)
  const celdasMes = useMemo(() => {
    const year = fecha.getFullYear();
    const month = fecha.getMonth();
    const primerDiaMes = new Date(year, month, 1);
    const ultimoDiaMes = new Date(year, month + 1, 0);
    const startDay = (primerDiaMes.getDay() + 6) % 7;

    const hoyKey = toDateKey(ahora || new Date());
    const fechaSelKey = fecha ? toDateKey(new Date(fecha)) : "";
    const hoySinHoraMs = new Date(
      (ahora || new Date()).getFullYear(),
      (ahora || new Date()).getMonth(),
      (ahora || new Date()).getDate(),
      0,
      0,
      0,
    ).getTime();

    const lista = [];
    for (let i = 0; i < startDay; i++) {
      lista.push(null);
    }

    const totalDias = ultimoDiaMes.getDate();
    for (let dNum = 1; dNum <= totalDias; dNum++) {
      const d = new Date(year, month, dNum);
      const dateKey = toDateKey(d);
      const isoStr = d.toISOString();
      const esHoy = dateKey === hoyKey;
      const esDiaSeleccionado = dateKey === fechaSelKey;
      const esDiaPasado = d.getTime() < hoySinHoraMs;

      const stats = estadisticasTurnosPorDia.get(dateKey);
      const cantTurnos = stats ? stats.cantTurnos : 0;
      const modulosOcupados = stats ? stats.modulosOcupados : 0;
      const modulosLibres = Math.max(0, capacidadDia - modulosOcupados);
      const porcentaje = Math.min(
        100,
        Math.round((modulosOcupados / capacidadDia) * 100),
      );
      const ocupacion = OBTENER_ESTILOS_OCUPACION_MES(porcentaje);

      const diaBloqueado = esDiaBloqueado ? esDiaBloqueado(d) : false;
      const restriccionDia =
        diaBloqueado && obtenerRestriccionDia ? obtenerRestriccionDia(d) : null;
      const restriccionesDelDia = obtenerRestriccionesDeFecha
        ? obtenerRestriccionesDeFecha(d)
        : [];
      const tieneBloqueoParcial =
        !diaBloqueado && restriccionesDelDia.length > 0;

      lista.push({
        d,
        dateKey,
        isoStr,
        esHoy,
        esDiaSeleccionado,
        esDiaPasado,
        diaBloqueado,
        restriccionDia,
        restriccionesDelDia,
        tieneBloqueoParcial,
        cantTurnos,
        modulosOcupados,
        modulosLibres,
        porcentaje,
        ocupacion,
      });
    }

    return lista;
  }, [
    fecha,
    ahora,
    capacidadDia,
    estadisticasTurnosPorDia,
    esDiaBloqueado,
    obtenerRestriccionDia,
    obtenerRestriccionesDeFecha,
  ]);

  // Prevenir scroll nativo y movimiento de página mientras se sostiene/arrastra
  useEffect(() => {
    const preventScroll = (e) => {
      if (touchStateRef.current.isHolding) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener("touchmove", preventScroll, {
      passive: false,
    });
    return () => {
      window.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
      if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
    };
  }, []);

  // Soporte Mouse Desktop: finalizar arrastre en window (registrado una sola vez)
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);

      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        setIsHolding(false);
        onDragEndRef.current?.();

        const currentDrag = seleccionDragRef.current;

        if (huboHoldingMouseRef.current) {
          huboHoldingRef.current = true;
          setTimeout(() => {
            huboHoldingRef.current = false;
            huboHoldingMouseRef.current = false;
          }, 450);

          const inicio = currentDrag?.inicio || mouseStartDiaRef.current;
          const fin = currentDrag?.fin || inicio;
          if (inicio) {
            setRangoModal({
              inicio: new Date(Math.min(inicio.getTime(), fin.getTime())),
              fin: new Date(Math.max(inicio.getTime(), fin.getTime())),
            });
            setModalAbierto(true);
          }
        } else if (currentDrag && currentDrag.inicio && currentDrag.fin) {
          const dist = Math.abs(
            currentDrag.inicio.getTime() - currentDrag.fin.getTime(),
          );
          if (dist > 1000 * 60 * 60 * 12) {
            huboHoldingRef.current = true;
            setTimeout(() => {
              huboHoldingRef.current = false;
            }, 450);

            const inicio = new Date(
              Math.min(
                currentDrag.inicio.getTime(),
                currentDrag.fin.getTime(),
              ),
            );
            const fin = new Date(
              Math.max(
                currentDrag.inicio.getTime(),
                currentDrag.fin.getTime(),
              ),
            );
            setRangoModal({ inicio, fin });
            setModalAbierto(true);
          }
        }
        if (seleccionDragRef.current) {
          setSeleccionDrag(null);
        }
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [setSeleccionDrag]);

  const rangoTimestamp = useMemo(() => {
    if (!seleccionDrag || !seleccionDrag.inicio || !seleccionDrag.fin) {
      return null;
    }
    const min = new Date(
      Math.min(seleccionDrag.inicio.getTime(), seleccionDrag.fin.getTime()),
    );
    const max = new Date(
      Math.max(seleccionDrag.inicio.getTime(), seleccionDrag.fin.getTime()),
    );
    min.setHours(0, 0, 0, 0);
    max.setHours(23, 59, 59, 999);
    return { min: min.getTime(), max: max.getTime() };
  }, [seleccionDrag]);

  // ─── GESTOS TOUCH (LONG PRESS & MULTI-DAY DRAG) ───────────────────────────
  const handleTouchStart = (e, dia) => {
    if (!dia) return;
    const touch = e.touches[0];
    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      dia,
      isHolding: false,
      isScrolling: false,
    };

    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);

    touchTimerRef.current = setTimeout(() => {
      if (!touchStateRef.current.isScrolling) {
        touchStateRef.current.isHolding = true;
        setIsHolding(true);
        onDragStart?.();
        setSeleccionDrag({ inicio: dia, fin: dia });
        if (window.navigator?.vibrate) {
          window.navigator.vibrate(40);
        }
      }
    }, 280);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStateRef.current.startX);
    const dy = Math.abs(touch.clientY - touchStateRef.current.startY);

    if (!touchStateRef.current.isHolding) {
      if (dx > 8 || dy > 8) {
        touchStateRef.current.isScrolling = true;
        if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
      }
      return;
    }

    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return;
    const celda = el.closest("[data-fecha-iso]");
    if (celda) {
      const fechaIso = celda.getAttribute("data-fecha-iso");
      if (fechaIso) {
        const diaHover = new Date(fechaIso);
        const currentFin = seleccionDragRef.current?.fin;
        if (!currentFin || currentFin.getTime() !== diaHover.getTime()) {
          setSeleccionDrag({
            inicio: touchStateRef.current.dia,
            fin: diaHover,
          });
        }
      }
    }
  };

  const handleTouchEnd = (e, dia) => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);

    if (touchStateRef.current.isHolding) {
      touchStateRef.current.isHolding = false;
      setIsHolding(false);
      onDragEnd?.();
      huboHoldingRef.current = true;
      setTimeout(() => {
        huboHoldingRef.current = false;
      }, 450);

      const currentDrag = seleccionDragRef.current;
      if (currentDrag && currentDrag.inicio && currentDrag.fin) {
        const inicio = new Date(
          Math.min(
            currentDrag.inicio.getTime(),
            currentDrag.fin.getTime(),
          ),
        );
        const fin = new Date(
          Math.max(
            currentDrag.inicio.getTime(),
            currentDrag.fin.getTime(),
          ),
        );
        setRangoModal({ inicio, fin });
        setModalAbierto(true);
      }
      setSeleccionDrag(null);
      return;
    }

    // Tap rápido: navegar al día
    if (!touchStateRef.current.isScrolling && dia) {
      setFechaActual(dia);
      setVista("dia");
    }

    touchStateRef.current.isHolding = false;
    setIsHolding(false);
    if (seleccionDragRef.current) {
      setSeleccionDrag(null);
    }
  };

  const handleClickDia = (dia) => {
    if (huboHoldingRef.current || huboHoldingMouseRef.current) return;
    setFechaActual(dia);
    setVista("dia");
  };

  // Soporte Mouse Desktop
  const handleMouseDown = (e, dia) => {
    if (e.button !== 0 || !dia) return;
    isMouseDownRef.current = true;
    mouseStartDiaRef.current = dia;
    huboHoldingMouseRef.current = false;

    if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
    mouseTimerRef.current = setTimeout(() => {
      if (isMouseDownRef.current) {
        huboHoldingMouseRef.current = true;
        huboHoldingRef.current = true;
        setIsHolding(true);
        setSeleccionDrag({ inicio: dia, fin: dia });
        onDragStart?.();
        if (window.navigator?.vibrate) window.navigator.vibrate(30);
      }
    }, 280);
  };

  const handleMouseEnter = (dia) => {
    if (isMouseDownRef.current && mouseStartDiaRef.current && dia) {
      const currentFin = seleccionDragRef.current?.fin;
      if (!currentFin || currentFin.getTime() !== dia.getTime()) {
        if (!huboHoldingMouseRef.current && mouseStartDiaRef.current.getTime() !== dia.getTime()) {
          huboHoldingMouseRef.current = true;
          huboHoldingRef.current = true;
          setIsHolding(true);
          onDragStart?.();
        }
        setSeleccionDrag({
          inicio: mouseStartDiaRef.current,
          fin: dia,
        });
      }
    }
  };

  const cerrarModalRestriccion = useCallback(() => {
    setModalAbierto(false);
  }, []);

  return (
    <div className="w-full h-full flex flex-col p-2 md:p-3 bg-gray-50/50 dark:bg-slate-900/60 select-none relative">
      {/* Indicador flotante en modo de selección de días */}
      {isHolding && seleccionDrag && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none flex items-center gap-1.5">
          <Lock size={12} className="text-amber-400" />
          <span>Arrastra sobre los días para seleccionarlos</span>
        </div>
      )}

      {/* Cabecera de días de la semana */}
      <div className="grid grid-cols-7 text-center font-extrabold text-[11px] md:text-xs text-gray-600 dark:text-slate-400 py-1.5 md:py-2 border-b border-gray-300 dark:border-slate-800">
        <span>LUN</span>
        <span>MAR</span>
        <span>MIÉ</span>
        <span>JUE</span>
        <span>VIE</span>
        <span>SÁB</span>
        <span>DOM</span>
      </div>

      {/* Grilla mensual */}
      <div
        ref={gridContainerRef}
        style={{ touchAction: isHolding ? "none" : "pan-y" }}
        className="grid grid-cols-7 flex-1 auto-rows-fr gap-1 md:gap-1.5 pt-1.5 min-h-0"
      >
        {celdasMes.map((celda, index) => {
          if (!celda) {
            return <div key={`empty-${index}`} className="bg-transparent" />;
          }

          const {
            d,
            isoStr,
            esHoy,
            esDiaSeleccionado,
            esDiaPasado,
            diaBloqueado,
            restriccionDia,
            restriccionesDelDia,
            tieneBloqueoParcial,
            cantTurnos,
            modulosOcupados,
            modulosLibres,
            porcentaje,
            ocupacion,
          } = celda;

          const tMs = d.getTime();
          const enSeleccionDrag =
            rangoTimestamp !== null &&
            tMs >= rangoTimestamp.min &&
            tMs <= rangoTimestamp.max;

          return (
            <div
              key={isoStr}
              data-fecha-iso={isoStr}
              style={{ touchAction: isHolding ? "none" : "manipulation" }}
              onTouchStart={(e) => handleTouchStart(e, d)}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(e, d)}
              onMouseDown={(e) => handleMouseDown(e, d)}
              onMouseEnter={() => handleMouseEnter(d)}
              onClick={() => handleClickDia(d)}
              onContextMenu={(e) => {
                e.preventDefault();
                setRangoModal({ inicio: d, fin: d });
                setModalAbierto(true);
              }}
              className={`rounded-xl p-1.5 md:p-2 flex flex-col justify-between min-h-[65px] md:min-h-[85px] transition-colors cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden select-none ${
                enSeleccionDrag
                  ? "!bg-slate-300 dark:!bg-slate-700 !border-slate-800 dark:!border-slate-400 ring-2 ring-slate-800 dark:ring-slate-400 z-20"
                  : diaBloqueado
                    ? "bg-slate-100/90 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 opacity-90"
                    : esHoy
                      ? "bg-emerald-50/20 dark:bg-emerald-950/30 border-2 border-[#2eb086] ring-2 ring-[#2eb086]/20 z-10"
                      : esDiaSeleccionado
                        ? "bg-slate-50 dark:bg-slate-800 border-2 border-slate-700 dark:border-slate-400 z-10"
                        : esDiaPasado
                          ? "bg-white/80 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 opacity-75 hover:bg-gray-50 dark:hover:bg-slate-800/80"
                          : "bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-50/90 dark:hover:bg-slate-800/80 hover:border-gray-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                {esHoy ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#2eb086] text-white font-extrabold text-xs shadow-xs">
                    {d.getDate()}
                  </span>
                ) : (
                  <span
                    className={`font-extrabold text-xs md:text-sm ${
                      diaBloqueado
                        ? "text-slate-500 dark:text-slate-400"
                        : esDiaPasado
                          ? "text-gray-400 dark:text-slate-500"
                          : "text-gray-800 dark:text-slate-200"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                )}

                {diaBloqueado ? (
                  <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold flex items-center gap-0.5 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    <Lock size={10} />
                    <span className="hidden sm:inline">
                      {restriccionDia?.motivo || "Bloqueado"}
                    </span>
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold md:hidden">
                    {cantTurnos > 0 ? cantTurnos : ""}
                  </span>
                )}
              </div>

              {/* Indicador de bloqueo parcial o de ocupación */}
              <div className="flex flex-col gap-1 mt-1">
                {tieneBloqueoParcial && (
                  <div className="flex items-center gap-1 text-[9px] text-slate-600 font-bold bg-slate-200/80 px-1 py-0.2 rounded w-fit">
                    <Lock size={9} />
                    <span>
                      {restriccionesDelDia[0].horaInicio}-
                      {restriccionesDelDia[0].horaFin}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-end w-full">
                  {!diaBloqueado && modulosOcupados > 0 && (
                    <div className="flex flex-col items-end gap-1 w-full">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 truncate ${ocupacion.badgeColor}`}
                        title={`${modulosOcupados} módulos ocupados (${cantTurnos} turnos) de ${capacidadDia}. Quedan ${modulosLibres} módulos libres.`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${ocupacion.dotColor}`}
                        />
                        <span>
                          {modulosLibres <= 0
                            ? "Completo"
                            : `${cantTurnos} ${cantTurnos === 1 ? "turno" : "turnos"}`}
                        </span>
                      </span>

                      {porcentaje > 0 && (
                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${porcentaje}%` }}
                            className={`h-full rounded-full ${ocupacion.barColor}`}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para crear o gestionar restricciones de fecha/hora */}
      {modalAbierto && (
        <ModalRestriccion
          isOpen={modalAbierto}
          onClose={cerrarModalRestriccion}
          rangoFechas={rangoModal}
          onGuardar={agregarRestriccion}
          onEliminar={eliminarRestriccion}
        />
      )}
    </div>
  );
});

export default VistaMes;
