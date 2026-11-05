/** @format */

import { useState, useRef, useEffect } from "react";
import { Lock } from "lucide-react";
import { OBTENER_ESTILOS_OCUPACION_MES } from "../../utils/agendaStyles";
import { useConfiguracion } from "../../../../context/ConfiguracionContext";
import ModalRestriccion from "../modales/ModalRestriccion";

export const VistaMes = ({
  fecha,
  turnos,
  ahora,
  setFechaActual,
  setVista,
  _restricciones = [],
  agregarRestriccion,
  eliminarRestriccion,
  esDiaBloqueado,
  obtenerRestriccionDia,
  obtenerRestriccionesDeFecha,
  onDragStart,
  onDragEnd,
}) => {
  const { totalModulosDia } = useConfiguracion();
  const capacidadDia = totalModulosDia || 24;

  const [modalAbierto, setModalAbierto] = useState(false);
  const [rangoModal, setRangoModal] = useState({ inicio: new Date(), fin: new Date() });
  const [seleccionDrag, setSeleccionDrag] = useState(null); // { inicio: Date, fin: Date }
  const [isHolding, setIsHolding] = useState(false);

  const gridContainerRef = useRef(null);
  const touchTimerRef = useRef(null);
  const mouseTimerRef = useRef(null);
  const huboHoldingRef = useRef(false);
  const huboHoldingMouseRef = useRef(false);
  const isMouseDownRef = useRef(false);
  const mouseStartDiaRef = useRef(null);

  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    dia: null,
    isHolding: false,
    isScrolling: false,
  });

  const primerDiaMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const ultimoDiaMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

  const diasEnMes = [];
  const startDay = (primerDiaMes.getDay() + 6) % 7;

  for (let i = 0; i < startDay; i++) {
    diasEnMes.push(null);
  }
  for (let d = 1; d <= ultimoDiaMes.getDate(); d++) {
    diasEnMes.push(new Date(fecha.getFullYear(), fecha.getMonth(), d));
  }

  // Prevenir scroll nativo y movimiento de página mientras se sostiene/arrastra
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    const onNativeTouchMove = (e) => {
      if (touchStateRef.current.isHolding) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    container.addEventListener("touchmove", onNativeTouchMove, {
      passive: false,
    });
    return () => {
      container.removeEventListener("touchmove", onNativeTouchMove);
    };
  }, []);

  // Bloqueo global de scroll en window mientras se arrastra
  useEffect(() => {
    const preventWindowScroll = (e) => {
      if (touchStateRef.current.isHolding) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener("touchmove", preventWindowScroll, {
      passive: false,
    });
    return () => {
      window.removeEventListener("touchmove", preventWindowScroll);
    };
  }, []);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
      if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
    };
  }, []);

  // Soporte Mouse Desktop: finalizar arrastre en window
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);

      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        setIsHolding(false);
        onDragEnd?.();

        if (huboHoldingMouseRef.current) {
          huboHoldingRef.current = true;
          setTimeout(() => {
            huboHoldingRef.current = false;
            huboHoldingMouseRef.current = false;
          }, 450);

          const inicio = seleccionDrag?.inicio || mouseStartDiaRef.current;
          const fin = seleccionDrag?.fin || inicio;
          if (inicio) {
            setRangoModal({
              inicio: new Date(Math.min(inicio.getTime(), fin.getTime())),
              fin: new Date(Math.max(inicio.getTime(), fin.getTime())),
            });
            setModalAbierto(true);
          }
        } else if (seleccionDrag && seleccionDrag.inicio && seleccionDrag.fin) {
          const dist = Math.abs(
            seleccionDrag.inicio.getTime() - seleccionDrag.fin.getTime(),
          );
          // Si arrastró a otro día o fue un arrastre marcado
          if (dist > 1000 * 60 * 60 * 12) {
            huboHoldingRef.current = true;
            setTimeout(() => {
              huboHoldingRef.current = false;
            }, 450);

            const inicio = new Date(
              Math.min(seleccionDrag.inicio.getTime(), seleccionDrag.fin.getTime()),
            );
            const fin = new Date(
              Math.max(seleccionDrag.inicio.getTime(), seleccionDrag.fin.getTime()),
            );
            setRangoModal({ inicio, fin });
            setModalAbierto(true);
          }
        }
        setSeleccionDrag(null);
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [seleccionDrag, onDragEnd]);

  const esDiaEnRango = (dia, rango) => {
    if (!dia || !rango || !rango.inicio || !rango.fin) return false;
    const t = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate()).getTime();
    const min = new Date(
      Math.min(rango.inicio.getTime(), rango.fin.getTime()),
    );
    const max = new Date(
      Math.max(rango.inicio.getTime(), rango.fin.getTime()),
    );
    min.setHours(0, 0, 0, 0);
    max.setHours(23, 59, 59, 999);
    return t >= min.getTime() && t <= max.getTime();
  };

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

    // 280ms: tiempo óptimo para detectar pulsación prolongada sin retrasos
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

    // Detener cualquier evento de scroll o swipe padre
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return;
    const celda = el.closest("[data-fecha-iso]");
    if (celda) {
      const fechaIso = celda.getAttribute("data-fecha-iso");
      if (fechaIso) {
        const diaHover = new Date(fechaIso);
        setSeleccionDrag({
          inicio: touchStateRef.current.dia,
          fin: diaHover,
        });
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

      if (seleccionDrag && seleccionDrag.inicio && seleccionDrag.fin) {
        const inicio = new Date(
          Math.min(seleccionDrag.inicio.getTime(), seleccionDrag.fin.getTime()),
        );
        const fin = new Date(
          Math.max(seleccionDrag.inicio.getTime(), seleccionDrag.fin.getTime()),
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
    setSeleccionDrag(null);
  };

  const handleClickDia = (dia) => {
    // Si acaba de ocurrir un long press o drag táctil o de mouse, ignorar click sintético
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
    setSeleccionDrag({ inicio: dia, fin: dia });

    if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
    mouseTimerRef.current = setTimeout(() => {
      if (isMouseDownRef.current) {
        huboHoldingMouseRef.current = true;
        huboHoldingRef.current = true;
        setIsHolding(true);
        onDragStart?.();
        if (window.navigator?.vibrate) window.navigator.vibrate(30);
      }
    }, 280);
  };

  const handleMouseEnter = (dia) => {
    if (isMouseDownRef.current && mouseStartDiaRef.current && dia) {
      setSeleccionDrag({
        inicio: mouseStartDiaRef.current,
        fin: dia,
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-2 md:p-3 bg-gray-50/50 select-none relative">
      {/* Indicador flotante en modo de selección de días */}
      {isHolding && seleccionDrag && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none flex items-center gap-1.5 animate-pulse">
          <Lock size={12} className="text-amber-400" />
          <span>Arrastra sobre los días para seleccionarlos</span>
        </div>
      )}

      {/* Cabecera de días de la semana */}
      <div className="grid grid-cols-7 text-center font-extrabold text-[11px] md:text-xs text-gray-600 py-1.5 md:py-2 border-b border-gray-300">
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
        {diasEnMes.map((d, index) => {
          if (!d)
            return <div key={`empty-${index}`} className="bg-transparent" />;

          const esHoy = d.toDateString() === new Date().toDateString();
          const esDiaSeleccionado =
            fecha && d.toDateString() === new Date(fecha).toDateString();
          const inicioDelDia = new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate(),
            0,
            0,
            0,
          );
          const hoySinHora = new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            ahora.getDate(),
            0,
            0,
            0,
          );
          const esDiaPasado = inicioDelDia < hoySinHora;

          const turnosDelDia = turnos.filter(
            (t) =>
              new Date(t.fecha_hora_inicio).toDateString() === d.toDateString(),
          );

          // Verificar si el día está bloqueado por restricciones
          const diaBloqueado = esDiaBloqueado?.(d);
          const restriccionDia = obtenerRestriccionDia?.(d);
          const restriccionesDelDia = obtenerRestriccionesDeFecha?.(d) || [];
          const tieneBloqueoParcial =
            !diaBloqueado && restriccionesDelDia.length > 0;

          // Cálculo dinámico de ocupación según la capacidad configurada
          const cantTurnos = turnosDelDia.length;
          const porcentaje = Math.min(
            100,
            Math.round((cantTurnos / capacidadDia) * 100),
          );
          const ocupacion = OBTENER_ESTILOS_OCUPACION_MES(porcentaje);

          const enSeleccionDrag = esDiaEnRango(d, seleccionDrag);

          return (
            <div
              key={d.toISOString()}
              data-fecha-iso={d.toISOString()}
              style={{ touchAction: isHolding ? "none" : "manipulation" }}
              onTouchStart={(e) => handleTouchStart(e, d)}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(e, d)}
              onMouseDown={(e) => handleMouseDown(e, d)}
              onMouseEnter={() => handleMouseEnter(d)}
              onClick={() => handleClickDia(d)}
              onContextMenu={(e) => {
                // Click derecho en Desktop abre el modal de bloqueo directamente
                e.preventDefault();
                setRangoModal({ inicio: d, fin: d });
                setModalAbierto(true);
              }}
              className={`rounded-xl p-1.5 md:p-2 flex flex-col justify-between min-h-[65px] md:min-h-[85px] transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden select-none ${
                enSeleccionDrag
                  ? "!bg-slate-300 !border-slate-800 ring-2 ring-slate-800 z-20 scale-[0.98]"
                  : diaBloqueado
                    ? "bg-slate-100/90 border border-slate-300 text-slate-500 opacity-90"
                    : esHoy
                      ? "bg-emerald-50/20 border-2 border-[#2eb086] ring-2 ring-[#2eb086]/20 z-10"
                      : esDiaSeleccionado
                        ? "bg-slate-50 border-2 border-slate-700 z-10"
                        : esDiaPasado
                          ? "bg-white/80 border border-gray-200 opacity-75 hover:bg-gray-50"
                          : "bg-white border border-gray-200 hover:bg-gray-50/90 hover:border-gray-300"
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
                        ? "text-slate-500"
                        : esDiaPasado
                          ? "text-gray-400"
                          : "text-gray-800"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                )}

                {diaBloqueado ? (
                  <span className="text-[10px] text-slate-600 font-bold flex items-center gap-0.5 bg-slate-200 px-1.5 py-0.5 rounded">
                    <Lock size={10} />
                    <span className="hidden sm:inline">
                      {restriccionDia?.motivo || "Bloqueado"}
                    </span>
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 font-semibold md:hidden">
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
                  {diaBloqueado ? (
                    <span className="text-[10px] md:text-xs font-bold text-slate-500">
                      Cerrado
                    </span>
                  ) : (
                    <div className="flex flex-col items-end gap-1 w-full">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 truncate ${ocupacion.badgeColor}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${ocupacion.dotColor}`}
                        />
                        <span>{porcentaje}%</span>
                      </span>

                      {/* Mini barra de progreso sutil al pie */}
                      {porcentaje > 0 && (
                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${porcentaje}%` }}
                            className={`h-full rounded-full transition-all ${ocupacion.barColor}`}
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
      <ModalRestriccion
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        rangoFechas={rangoModal}
        onGuardar={agregarRestriccion}
        onEliminar={eliminarRestriccion}
        restriccionesExistentes={
          obtenerRestriccionesDeFecha?.(rangoModal.inicio) || []
        }
      />
    </div>
  );
};

export default VistaMes;
